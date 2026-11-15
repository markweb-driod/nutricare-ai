@echo off
title NutriCare AI - Stop Docker Containers

echo Stopping NutriCare AI Docker Containers...
cd /d "%~dp0"
docker compose down

echo [DONE] All Docker containers stopped.
pause
