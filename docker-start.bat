@echo off
title NutriCare AI - Docker Deployment

echo =======================================================================
echo           NutriCare AI - Docker Full-Stack Startup                      
echo =======================================================================
echo.

set ROOT_DIR=%~dp0
cd /d "%ROOT_DIR%"

where docker >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker is not installed or not in PATH!
    echo Please install Docker Desktop or run start.bat for native startup.
    pause
    exit /b 1
)

echo Building and starting containers (Next.js, PHP Backend, Python ML, Postgres, Redis, Nginx)...
docker compose up --build -d

if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker compose failed to start!
    pause
    exit /b 1
)

echo.
echo Waiting for containers to become ready...
timeout /t 5 /nobreak >nul

echo.
echo =======================================================================
echo       NUTRICARE AI IS RUNNING VIA DOCKER!
echo =======================================================================
echo   * Web Frontend:          http://localhost:3000
echo   * Nginx Gateway:         http://localhost:80
echo   * Backend REST API:      http://localhost:8080/api/v1
echo   * Python ML Service:     http://localhost:8000
echo.
echo   To view logs:   docker compose logs -f
echo   To stop stack:  docker-stop.bat (or docker compose down)
echo =======================================================================
echo.

start http://localhost:3000
pause
