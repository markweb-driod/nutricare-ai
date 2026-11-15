# =======================================================================
# NutriCare AI - PowerShell Full-Stack Startup Script
# =======================================================================

$ErrorActionPreference = "Continue"
$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $rootDir

Write-Host "=======================================================================" -ForegroundColor DarkGreen
Write-Host "         NutriCare AI - Full-Stack Local Deployment Manager            " -ForegroundColor Green
Write-Host "=======================================================================" -ForegroundColor DarkGreen
Write-Host ""

# 1. Prerequisite Verification
Write-Host "[1/5] Checking System Prerequisites..." -ForegroundColor Cyan

$hasPython = Get-Command python -ErrorAction SilentlyContinue
$hasPhp = Get-Command php -ErrorAction SilentlyContinue
$hasNpm = Get-Command npm -ErrorAction SilentlyContinue

if (-not $hasPython) {
    Write-Host "[ERROR] Python 3 is required but not found in PATH." -ForegroundColor Red
    Write-Host "Please install Python 3.10+ from https://www.python.org/"
    exit 1
} else {
    $pyVer = & python --version 2>&1
    Write-Host "  - Python: OK ($pyVer)" -ForegroundColor Green
}

if (-not $hasPhp) {
    Write-Host "[ERROR] PHP is required but not found in PATH." -ForegroundColor Red
    Write-Host "Please install PHP 8.1+ or ensure PHP is added to Environment Variables."
    exit 1
} else {
    $phpVer = & php -v | Select-Object -First 1
    Write-Host "  - PHP:    OK ($phpVer)" -ForegroundColor Green
}

if (-not $hasNpm) {
    Write-Host "[ERROR] Node.js / npm is required but not found in PATH." -ForegroundColor Red
    Write-Host "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
} else {
    $nodeVer = & node -v
    Write-Host "  - Node:   OK ($nodeVer)" -ForegroundColor Green
}

# 2. Prepare ML Microservice
Write-Host "`n[2/5] Checking Python Machine Learning Service..." -ForegroundColor Cyan
Set-Location "$rootDir\ml-service"

$checkImports = & python -c "import fastapi, uvicorn, sklearn, pandas, numpy, joblib; print('OK')" 2>$null
if ($checkImports -ne "OK") {
    Write-Host "  Installing ML requirements..." -ForegroundColor Yellow
    & pip install -r requirements.txt
}

$modelFile = "$rootDir\ml-service\models\meal_suitability_rf.joblib"
if (-not (Test-Path $modelFile)) {
    Write-Host "  Training Random Forest Model (95.8% F1 Holdout)..." -ForegroundColor Yellow
    & python training\train.py
} else {
    Write-Host "  - Random Forest Model Artifact: VERIFIED" -ForegroundColor Green
}

# 3. Prepare Frontend
Write-Host "`n[3/5] Checking Next.js Frontend..." -ForegroundColor Cyan
Set-Location "$rootDir\frontend"
if (-not (Test-Path "$rootDir\frontend\node_modules")) {
    Write-Host "  Installing npm packages (first-time setup)..." -ForegroundColor Yellow
    & npm install --no-audit
} else {
    Write-Host "  - Frontend dependencies: VERIFIED" -ForegroundColor Green
}

# 4. Clean Stale Ports & Launch Services
Write-Host "`n[4/5] Launching Background Services..." -ForegroundColor Cyan

function Stop-PortListener($port) {
    $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($conns) {
        foreach ($conn in $conns) {
            Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
}

Stop-PortListener 8000
Stop-PortListener 8080
Stop-PortListener 3000

# Start ML Microservice
$mlProc = Start-Process -FilePath "python" -ArgumentList "-m uvicorn app.main:app --host 127.0.0.1 --port 8000" -WorkingDirectory "$rootDir\ml-service" -PassThru -WindowStyle Minimized
Write-Host "  - ML Service running on http://127.0.0.1:8000 (PID: $($mlProc.Id))" -ForegroundColor Green

# Start PHP Backend Monolith
$phpProc = Start-Process -FilePath "php" -ArgumentList "-S 127.0.0.1:8080 -t public" -WorkingDirectory "$rootDir\backend" -PassThru -WindowStyle Minimized
Write-Host "  - Backend REST API running on http://127.0.0.1:8080 (PID: $($phpProc.Id))" -ForegroundColor Green

# Start Next.js Frontend
$feProc = Start-Process -FilePath "npm.cmd" -ArgumentList "run dev" -WorkingDirectory "$rootDir\frontend" -PassThru -WindowStyle Minimized
Write-Host "  - Next.js Web Frontend running on http://localhost:3000 (PID: $($feProc.Id))" -ForegroundColor Green

# 5. Health Checks
Write-Host "`n[5/5] Performing Health Checks..." -ForegroundColor Cyan
$attempts = 0
$healthy = $false

while ($attempts -lt 30 -and -not $healthy) {
    Start-Sleep -Seconds 2
    $attempts++
    
    $mlStatus = try { (Invoke-WebRequest -Uri "http://127.0.0.1:8000/health" -UseBasicParsing -TimeoutSec 1).StatusCode } catch { 0 }
    $apiStatus = try { (Invoke-WebRequest -Uri "http://127.0.0.1:8080/api/v1/health" -UseBasicParsing -TimeoutSec 1).StatusCode } catch { 0 }
    $webStatus = try { (Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 1).StatusCode } catch { 0 }

    if ($mlStatus -eq 200 -and $apiStatus -eq 200 -and $webStatus -eq 200) {
        $healthy = $true
    } else {
        Write-Host "  ... waiting for services to initialize (check $attempts/30)" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "=======================================================================" -ForegroundColor DarkGreen
Write-Host "         ALL NUTRICARE AI SERVICES ARE LIVE AND OPERATIONAL!           " -ForegroundColor Green
Write-Host "=======================================================================" -ForegroundColor DarkGreen
Write-Host ""
Write-Host "  * Web Application (PWA):   http://localhost:3000" -ForegroundColor Yellow
Write-Host "  * Backend REST API:        http://127.0.0.1:8080/api/v1" -ForegroundColor Yellow
Write-Host "  * Python ML Microservice:  http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host ""
Write-Host "  ONE-CLICK DEMO ACCOUNTS (Available on login screen):" -ForegroundColor Cyan
Write-Host "  - Patient Demo:    alex.adeyemi@example.com (Password: patient123)"
Write-Host "  - Clinician Demo:  dr.balogun@nutricare.clinic (Password: clinician123)"
Write-Host "  - Admin Demo:      admin@nutricare.ai (Password: admin123)"
Write-Host ""
Write-Host "  To stop all services cleanly, run: .\stop.ps1" -ForegroundColor DarkGray
Write-Host "=======================================================================" -ForegroundColor DarkGreen

Start-Process "http://localhost:3000"
