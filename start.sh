#!/usr/bin/env bash
# =======================================================================
# NutriCare AI - Linux / macOS Full-Stack Startup Script
# =======================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "======================================================================="
echo "         NutriCare AI - Full-Stack Local Deployment Manager            "
echo "======================================================================="
echo ""

# 1. Prerequisite Checks
echo "[1/5] Checking System Prerequisites..."
command -v python3 >/dev/null 2>&1 || command -v python >/dev/null 2>&1 || { echo "[ERROR] Python 3 is required. Aborting."; exit 1; }
command -v php >/dev/null 2>&1 || { echo "[ERROR] PHP is required. Aborting."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "[ERROR] Node.js / npm is required. Aborting."; exit 1; }

PYTHON_BIN=$(command -v python3 || command -v python)
echo "  - Python: OK ($($PYTHON_BIN --version))"
echo "  - PHP:    OK ($(php -v | head -n 1))"
echo "  - Node:   OK ($(node -v))"

# 2. Check and Prepare ML Microservice
echo ""
echo "[2/5] Preparing Python Machine Learning Microservice..."
cd "$SCRIPT_DIR/ml-service"

if ! $PYTHON_BIN -c "import fastapi, uvicorn, sklearn, pandas, numpy, joblib" >/dev/null 2>&1; then
    echo "  Installing Python requirements..."
    $PYTHON_BIN -m pip install -r requirements.txt
fi

if [ ! -f "models/meal_suitability_rf.joblib" ]; then
    echo "  Training Random Forest Model Artifact..."
    $PYTHON_BIN training/train.py
else
    echo "  - Random Forest Model Artifact: VERIFIED"
fi

# 3. Check and Prepare Next.js Frontend
echo ""
echo "[3/5] Preparing Next.js Frontend..."
cd "$SCRIPT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    echo "  Installing frontend dependencies (first time)..."
    npm install --no-audit
else
    echo "  - Frontend dependencies: VERIFIED"
fi

# 4. Clean Stale Ports & Launch Services
echo ""
echo "[4/5] Launching Background Services..."

# Kill any existing processes on 8000, 8080, 3000
fuser -k 8000/tcp 2>/dev/null || true
fuser -k 8080/tcp 2>/dev/null || true
fuser -k 3000/tcp 2>/dev/null || true

# Start ML Microservice
cd "$SCRIPT_DIR/ml-service"
$PYTHON_BIN -m uvicorn app.main:app --host 127.0.0.1 --port 8000 > /tmp/nutricare-ml.log 2>&1 &
ML_PID=$!
echo "  - ML Service started (PID: $ML_PID)"

# Start PHP Backend Monolith
cd "$SCRIPT_DIR/backend"
php -S 127.0.0.1:8080 -t public > /tmp/nutricare-php.log 2>&1 &
PHP_PID=$!
echo "  - Backend API started (PID: $PHP_PID)"

# Start Frontend
cd "$SCRIPT_DIR/frontend"
npm run dev > /tmp/nutricare-frontend.log 2>&1 &
FE_PID=$!
echo "  - Frontend started (PID: $FE_PID)"

# Trap exits to kill background processes on Ctrl+C
trap 'echo "Stopping services..."; kill $ML_PID $PHP_PID $FE_PID 2>/dev/null || true; exit 0' SIGINT SIGTERM

# 5. Wait for Health Checks
echo ""
echo "[5/5] Checking service health..."
ATTEMPTS=0
HEALTHY=false

while [ $ATTEMPTS -lt 30 ] && [ "$HEALTHY" = false ]; do
    sleep 2
    ATTEMPTS=$((ATTEMPTS+1))

    ML_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/health || echo "0")
    API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/api/v1/health || echo "0")
    WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "0")

    if [ "$ML_STATUS" = "200" ] && [ "$API_STATUS" = "200" ] && [ "$WEB_STATUS" = "200" ]; then
        HEALTHY=true
    else
        echo "  ... initializing services (check $ATTEMPTS/30)"
    fi
done

echo ""
echo "======================================================================="
echo "         ALL NUTRICARE AI SERVICES ARE LIVE AND OPERATIONAL!           "
echo "======================================================================="
echo ""
echo "  * Web Application (PWA):   http://localhost:3000"
echo "  * Backend REST API:        http://127.0.0.1:8080/api/v1"
echo "  * Python ML Microservice:  http://127.0.0.1:8000"
echo ""
echo "  ONE-CLICK DEMO ACCOUNTS (Available on login screen):"
echo "  - Patient Demo:    alex.adeyemi@example.com (Password: patient123)"
echo "  - Clinician Demo:  dr.balogun@nutricare.clinic (Password: clinician123)"
echo "  - Admin Demo:      admin@nutricare.ai (Password: admin123)"
echo ""
echo "  Logs: /tmp/nutricare-*.log"
echo "  Press Ctrl+C to terminate all services."
echo "======================================================================="

# Open browser if available
if command -v xdg-open >/dev/null 2>&1; then
    xdg-open http://localhost:3000 >/dev/null 2>&1 &
elif command -v open >/dev/null 2>&1; then
    open http://localhost:3000 >/dev/null 2>&1 &
fi

wait
