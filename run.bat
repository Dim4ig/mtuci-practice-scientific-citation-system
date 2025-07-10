@echo off
echo Scientific Citation System
echo =========================
echo.
echo Checking if Go is installed...
go version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Go is not installed or not in PATH
    echo Please install Go from: https://golang.org/dl/
    echo Then add Go to your PATH and try again
    pause
    exit /b 1
)

echo Go is installed. Installing dependencies...
go mod tidy

echo.
echo Starting the citation system...
echo The web interface will be available at: http://localhost:8080
echo Press Ctrl+C to stop the server
echo.
go run . 