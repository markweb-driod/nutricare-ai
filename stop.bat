@echo off
title NutriCare AI - Stop Services

echo =======================================================================
echo              NutriCare AI - Stopping Local Services                    
echo =======================================================================
echo.

echo Terminating services running on ports 8000, 8080, and 3000...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    echo  - Stopping ML Service (PID: %%a)...
    taskkill /f /pid %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do (
    echo  - Stopping PHP Backend API (PID: %%a)...
    taskkill /f /pid %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo  - Stopping Next.js Frontend (PID: %%a)...
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo [DONE] All NutriCare AI local services have been stopped cleanly.
echo.
pause
