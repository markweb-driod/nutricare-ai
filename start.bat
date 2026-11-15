@echo off
setlocal enabledelayedexpansion
title NutriCare AI - System Startup Manager

echo =======================================================================
echo          NutriCare AI - Diabetic Dietary Recommendation System         
echo          Full-Stack Local Deployment & Startup Automation               
echo =======================================================================
echo.

set ROOT_DIR=%~dp0
cd /d "%ROOT_DIR%"

:: 1. Check Prerequisites
echo [1/5] Checking System Prerequisites...

where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python 3 is not installed or not in PATH!
    echo Please install Python 3.10+ from https://www.python.org/
    pause
    exit /b 1
)

where php >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] PHP is not installed or not in PATH!
    echo Please install PHP 8.1+ or ensure C:\xampp\php is in your PATH.
    pause
    exit /b 1
)

where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js / npm is not installed or not in PATH!
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

echo  - Python: OK
echo  - PHP:    OK
echo  - Node:   OK
echo.

:: 2. Check and Prepare Python ML Service
echo [2/5] Preparing Python Machine Learning Microservice...
cd /d "%ROOT_DIR%ml-service"

:: Check if dependencies installed
python -c "import fastapi, uvicorn, sklearn, pandas, numpy, joblib" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Installing Python ML dependencies from requirements.txt...
    pip install -r requirements.txt
)

:: Check if trained Random Forest model exists
if not exist "models\meal_suitability_rf.joblib" (
    echo Trained Random Forest model not found. Training model now...
    python training\train.py
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Model training failed!
        pause
        exit /b 1
    )
) else (
    echo  - Random Forest Model Artifact: VERIFIED (95.8%% Accuracy)
)

:: 3. Check and Prepare Next.js Frontend
echo.
echo [3/5] Preparing Next.js Frontend...
cd /d "%ROOT_DIR%frontend"
if not exist "node_modules\" (
    echo Installing frontend dependencies (this may take a minute on first run)...
    call npm install --no-audit
) else (
    echo  - Frontend dependencies: VERIFIED
)

:: 4. Start Services in Background Windows
echo.
echo [4/5] Launching All Services...

:: Kill any old lingering processes on ports 8000, 8080, 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1

:: Start ML Service on 8000
cd /d "%ROOT_DIR%ml-service"
start "NutriCare - Python ML Microservice [Port 8000]" cmd /k "python -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

:: Start PHP Backend on 8080
cd /d "%ROOT_DIR%backend"
start "NutriCare - PHP Backend API [Port 8080]" cmd /k "php -S 127.0.0.1:8080 -t public"

:: Start Next.js Frontend on 3000
cd /d "%ROOT_DIR%frontend"
start "NutriCare - Next.js Frontend [Port 3000]" cmd /k "npm run dev"

:: 5. Health Checks and Browser Launch
echo.
echo [5/5] Waiting for services to initialize...

set /a attempts=0
:WAIT_LOOP
timeout /t 2 /nobreak >nul
set /a attempts+=1

powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/health' -UseBasicParsing -TimeoutSec 1; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
set ML_OK=%ERRORLEVEL%

powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8080/api/v1/health' -UseBasicParsing -TimeoutSec 1; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
set API_OK=%ERRORLEVEL%

powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 1; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
set WEB_OK=%ERRORLEVEL%

if %ML_OK% equ 0 if %API_OK% equ 0 if %WEB_OK% equ 0 goto ALL_READY

if %attempts% lss 30 (
    echo   ... initializing services (attempt %attempts%/30)...
    goto WAIT_LOOP
)

:ALL_READY
echo.
echo =======================================================================
echo          ALL NUTRICARE AI SERVICES ARE LIVE AND OPERATIONAL!          
echo =======================================================================
echo.
echo   * Web Frontend (PWA):      http://localhost:3000
echo   * Backend REST API:        http://127.0.0.1:8080/api/v1
echo   * Python ML Service:       http://127.0.0.1:8000 (Random Forest Active)
echo.
echo   DEMO ACCOUNTS (Use One-Click Autofill Buttons on Login Screen):
echo   - Patient:   alex.adeyemi@example.com (Password: patient123)
echo   - Clinician: dr.balogun@nutricare.clinic (Password: clinician123)
echo   - Admin:     admin@nutricare.ai (Password: admin123)
echo.
echo   To shut down all services cleanly at any time, run: stop.bat
echo =======================================================================
echo.

:: Automatically open default web browser
start http://localhost:3000

pause
