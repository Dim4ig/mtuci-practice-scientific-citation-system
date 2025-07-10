# Используем официальный образ Go для сборки
FROM golang:1.21-alpine AS builder

# Устанавливаем необходимые пакеты для сборки
RUN apk add --no-cache gcc musl-dev

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы зависимостей
COPY go.mod go.sum ./

# Загружаем зависимости
RUN go mod download

# Копируем исходный код
COPY . .

# Собираем приложение
RUN CGO_ENABLED=1 go build -o citation-system .

# Создаем финальный образ
FROM alpine:latest

# Устанавливаем необходимые пакеты для runtime
RUN apk --no-cache add ca-certificates tzdata

# Создаем пользователя для безопасности
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем собранное приложение из builder stage
COPY --from=builder /app/citation-system .

# Копируем статические файлы и шаблоны
COPY --from=builder /app/templates ./templates
COPY --from=builder /app/static ./static

# Создаем директорию для базы данных
RUN mkdir -p /app/data && chown -R appuser:appgroup /app

# Переключаемся на непривилегированного пользователя
USER appuser

# Открываем порт
EXPOSE 8080

# Запускаем приложение
CMD ["./citation-system"] 