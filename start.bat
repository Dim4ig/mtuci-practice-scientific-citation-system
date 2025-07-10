@echo off
echo ========================================
echo Система научных цитирований
echo ========================================
echo.

echo Проверяем наличие Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ОШИБКА: Docker не установлен!
    echo.
    echo Для запуска системы необходимо установить Docker Desktop:
    echo 1. Скачайте Docker Desktop с https://www.docker.com/products/docker-desktop/
    echo 2. Установите и запустите Docker Desktop
    echo 3. Перезапустите этот скрипт
    echo.
    pause
    exit /b 1
)

echo Docker найден! Запускаем систему...
echo.

echo Сборка и запуск контейнера...
docker-compose up --build -d

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo Система успешно запущена!
    echo ========================================
    echo.
    echo Откройте браузер и перейдите по адресу:
    echo http://localhost:8080
    echo.
    echo Для остановки системы выполните: docker-compose down
    echo.
    pause
) else (
    echo.
    echo ОШИБКА при запуске системы!
    echo Проверьте, что Docker Desktop запущен.
    echo.
    pause
) 