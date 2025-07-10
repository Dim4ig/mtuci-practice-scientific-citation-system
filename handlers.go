package main

import (
	"database/sql"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// getCitations - получение всех цитирований
func (d *Database) getCitations(c *gin.Context) {
	rows, err := d.db.Query("SELECT id, title, authors, journal, year, volume, issue, pages, doi, url, abstract, keywords, created_at, updated_at FROM citations ORDER BY created_at DESC")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var citations []Citation
	for rows.Next() {
		var citation Citation
		err := rows.Scan(
			&citation.ID,
			&citation.Title,
			&citation.Authors,
			&citation.Journal,
			&citation.Year,
			&citation.Volume,
			&citation.Issue,
			&citation.Pages,
			&citation.DOI,
			&citation.URL,
			&citation.Abstract,
			&citation.Keywords,
			&citation.CreatedAt,
			&citation.UpdatedAt,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		citations = append(citations, citation)
	}

	c.JSON(http.StatusOK, citations)
}

// getCitation - получение одного цитирования по ID
func (d *Database) getCitation(c *gin.Context) {
	id := c.Param("id")

	var citation Citation
	err := d.db.QueryRow("SELECT id, title, authors, journal, year, volume, issue, pages, doi, url, abstract, keywords, created_at, updated_at FROM citations WHERE id = ?", id).Scan(
		&citation.ID,
		&citation.Title,
		&citation.Authors,
		&citation.Journal,
		&citation.Year,
		&citation.Volume,
		&citation.Issue,
		&citation.Pages,
		&citation.DOI,
		&citation.URL,
		&citation.Abstract,
		&citation.Keywords,
		&citation.CreatedAt,
		&citation.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Цитирование не найдено"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, citation)
}

// createCitation - создание нового цитирования
func (d *Database) createCitation(c *gin.Context) {
	var citation Citation
	if err := c.ShouldBindJSON(&citation); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Генерация UUID и временных меток
	citation.ID = uuid.New().String()
	now := time.Now().Format(time.RFC3339)
	citation.CreatedAt = now
	citation.UpdatedAt = now

	// Вставка в базу данных
	_, err := d.db.Exec(`
		INSERT INTO citations (id, title, authors, journal, year, volume, issue, pages, doi, url, abstract, keywords, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		citation.ID, citation.Title, citation.Authors, citation.Journal, citation.Year,
		citation.Volume, citation.Issue, citation.Pages, citation.DOI, citation.URL,
		citation.Abstract, citation.Keywords, citation.CreatedAt, citation.UpdatedAt,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, citation)
}

// updateCitation - обновление существующего цитирования
func (d *Database) updateCitation(c *gin.Context) {
	id := c.Param("id")

	var citation Citation
	if err := c.ShouldBindJSON(&citation); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	citation.ID = id
	citation.UpdatedAt = time.Now().Format(time.RFC3339)

	// Обновление в базе данных
	_, err := d.db.Exec(`
		UPDATE citations 
		SET title = ?, authors = ?, journal = ?, year = ?, volume = ?, issue = ?, 
		    pages = ?, doi = ?, url = ?, abstract = ?, keywords = ?, updated_at = ?
		WHERE id = ?`,
		citation.Title, citation.Authors, citation.Journal, citation.Year,
		citation.Volume, citation.Issue, citation.Pages, citation.DOI, citation.URL,
		citation.Abstract, citation.Keywords, citation.UpdatedAt, id,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, citation)
}

// deleteCitation - удаление цитирования
func (d *Database) deleteCitation(c *gin.Context) {
	id := c.Param("id")

	_, err := d.db.Exec("DELETE FROM citations WHERE id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Цитирование успешно удалено"})
}

// searchCitations - поиск цитирований
func (d *Database) searchCitations(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Поисковый запрос обязателен"})
		return
	}

	// Поиск в названии, авторах, журнале, аннотации и ключевых словах
	searchSQL := `
		SELECT id, title, authors, journal, year, volume, issue, pages, doi, url, abstract, keywords, created_at, updated_at 
		FROM citations 
		WHERE title LIKE ? OR authors LIKE ? OR journal LIKE ? OR abstract LIKE ? OR keywords LIKE ?
		ORDER BY created_at DESC`

	searchTerm := "%" + query + "%"
	rows, err := d.db.Query(searchSQL, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var citations []Citation
	for rows.Next() {
		var citation Citation
		err := rows.Scan(
			&citation.ID,
			&citation.Title,
			&citation.Authors,
			&citation.Journal,
			&citation.Year,
			&citation.Volume,
			&citation.Issue,
			&citation.Pages,
			&citation.DOI,
			&citation.URL,
			&citation.Abstract,
			&citation.Keywords,
			&citation.CreatedAt,
			&citation.UpdatedAt,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		citations = append(citations, citation)
	}

	c.JSON(http.StatusOK, citations)
}

// exportCitations - экспорт цитирований в различных форматах
func (d *Database) exportCitations(c *gin.Context) {
	format := c.Query("format")
	if format == "" {
		format = "json"
	}

	// Получение всех цитирований
	rows, err := d.db.Query("SELECT id, title, authors, journal, year, volume, issue, pages, doi, url, abstract, keywords, created_at, updated_at FROM citations ORDER BY created_at DESC")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var citations []Citation
	for rows.Next() {
		var citation Citation
		err := rows.Scan(
			&citation.ID,
			&citation.Title,
			&citation.Authors,
			&citation.Journal,
			&citation.Year,
			&citation.Volume,
			&citation.Issue,
			&citation.Pages,
			&citation.DOI,
			&citation.URL,
			&citation.Abstract,
			&citation.Keywords,
			&citation.CreatedAt,
			&citation.UpdatedAt,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		citations = append(citations, citation)
	}

	switch format {
	case "json":
		c.JSON(http.StatusOK, citations)
	case "bibtex":
		bibtex := generateBibTeX(citations)
		c.Header("Content-Type", "text/plain")
		c.Header("Content-Disposition", "attachment; filename=citations.bib")
		c.String(http.StatusOK, bibtex)
	case "csv":
		csv := generateCSV(citations)
		c.Header("Content-Type", "text/csv")
		c.Header("Content-Disposition", "attachment; filename=citations.csv")
		c.String(http.StatusOK, csv)
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неподдерживаемый формат. Используйте 'json', 'bibtex' или 'csv'"})
	}
}

// generateBibTeX - генерация формата BibTeX
func generateBibTeX(citations []Citation) string {
	var bibtex strings.Builder
	bibtex.WriteString("% Сгенерировано системой научных цитирований\n\n")

	for _, citation := range citations {
		// Создание ключа из первого автора и года
		key := fmt.Sprintf("%s%d", strings.Split(citation.Authors, ",")[0], citation.Year)
		key = strings.ReplaceAll(key, " ", "")

		bibtex.WriteString(fmt.Sprintf("@article{%s,\n", key))
		bibtex.WriteString(fmt.Sprintf("  title = {%s},\n", citation.Title))
		bibtex.WriteString(fmt.Sprintf("  author = {%s},\n", citation.Authors))
		bibtex.WriteString(fmt.Sprintf("  journal = {%s},\n", citation.Journal))
		bibtex.WriteString(fmt.Sprintf("  year = {%d},\n", citation.Year))

		if citation.Volume != "" {
			bibtex.WriteString(fmt.Sprintf("  volume = {%s},\n", citation.Volume))
		}
		if citation.Issue != "" {
			bibtex.WriteString(fmt.Sprintf("  number = {%s},\n", citation.Issue))
		}
		if citation.Pages != "" {
			bibtex.WriteString(fmt.Sprintf("  pages = {%s},\n", citation.Pages))
		}
		if citation.DOI != "" {
			bibtex.WriteString(fmt.Sprintf("  doi = {%s},\n", citation.DOI))
		}
		if citation.URL != "" {
			bibtex.WriteString(fmt.Sprintf("  url = {%s},\n", citation.URL))
		}

		bibtex.WriteString("}\n\n")
	}

	return bibtex.String()
}

// generateCSV - генерация формата CSV
func generateCSV(citations []Citation) string {
	var csv strings.Builder
	csv.WriteString("Title,Authors,Journal,Year,Volume,Issue,Pages,DOI,URL,Abstract,Keywords\n")

	for _, citation := range citations {
		csv.WriteString(fmt.Sprintf("\"%s\",\"%s\",\"%s\",%d,\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"\n",
			citation.Title, citation.Authors, citation.Journal, citation.Year,
			citation.Volume, citation.Issue, citation.Pages, citation.DOI,
			citation.URL, citation.Abstract, citation.Keywords))
	}

	return csv.String()
}
