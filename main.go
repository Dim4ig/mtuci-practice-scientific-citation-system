package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "modernc.org/sqlite"
)

// Citation - структура для хранения информации о научном цитировании
type Citation struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	Authors   string `json:"authors"`
	Journal   string `json:"journal"`
	Year      int    `json:"year"`
	Volume    string `json:"volume"`
	Issue     string `json:"issue"`
	Pages     string `json:"pages"`
	DOI       string `json:"doi"`
	URL       string `json:"url"`
	Abstract  string `json:"abstract"`
	Keywords  string `json:"keywords"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

// Database - структура для работы с базой данных
type Database struct {
	db *sql.DB
}

func main() {
	// Инициализация базы данных
	db, err := initDatabase()
	if err != nil {
		log.Fatal("Ошибка инициализации базы данных:", err)
	}
	defer db.Close()

	// Настройка роутера Gin
	r := gin.Default()

	// Настройка CORS
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	r.Use(cors.New(config))

	// Обслуживание статических файлов
	r.Static("/static", "./static")
	r.LoadHTMLGlob("templates/*")

	// Маршруты
	r.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "index.html", gin.H{
			"title": "Система научных цитирований",
		})
	})

	// API маршруты
	api := r.Group("/api")
	{
		api.GET("/citations", db.getCitations)
		api.GET("/citations/:id", db.getCitation)
		api.POST("/citations", db.createCitation)
		api.PUT("/citations/:id", db.updateCitation)
		api.DELETE("/citations/:id", db.deleteCitation)
		api.GET("/search", db.searchCitations)
		api.GET("/export", db.exportCitations)
	}

	// Запуск сервера
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Сервер запускается на порту %s", port)
	log.Fatal(r.Run(":" + port))
}

// initDatabase - инициализация базы данных SQLite
func initDatabase() (*Database, error) {
	// Создание файла базы данных, если он не существует
	db, err := sql.Open("sqlite", "citations.db")
	if err != nil {
		return nil, err
	}

	// Проверка соединения
	if err := db.Ping(); err != nil {
		return nil, err
	}

	// Создание таблицы цитирований
	createTableSQL := `
	CREATE TABLE IF NOT EXISTS citations (
		id TEXT PRIMARY KEY,
		title TEXT NOT NULL,
		authors TEXT,
		journal TEXT,
		year INTEGER,
		volume TEXT,
		issue TEXT,
		pages TEXT,
		doi TEXT,
		url TEXT,
		abstract TEXT,
		keywords TEXT,
		created_at TEXT,
		updated_at TEXT
	);`

	_, err = db.Exec(createTableSQL)
	if err != nil {
		return nil, err
	}

	return &Database{db: db}, nil
}

// Close - закрытие соединения с базой данных
func (d *Database) Close() error {
	return d.db.Close()
}
