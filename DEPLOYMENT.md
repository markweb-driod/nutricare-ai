# NutriCare AI — Multi-Machine Deployment & Startup Guide

This document explains how to copy, install, and run **NutriCare AI** on any other local machine (Windows, macOS, or Linux).

---

## ⚡ Quick Start (Windows)

Simply copy this folder (`nutricare-ai` or `ddd`) to the target machine:

### Option A: Native Startup (Recommended for Local Dev)
1. Double-click **`start.bat`** (or right-click and run with PowerShell **`start.ps1`**).
2. The script will:
   - Verify Python, PHP, and Node.js.
   - Automatically install missing dependencies (`pip install -r requirements.txt`, `npm install`).
   - Train the Random Forest model if not already present.
   - Start the **ML Microservice** (Port 8000).
   - Start the **PHP Backend API** (Port 8080).
   - Start the **Next.js Web Frontend** (Port 3000).
   - Automatically launch your browser at `http://localhost:3000`.
3. To stop all running services cleanly, double-click **`stop.bat`** (or run `.\stop.ps1`).

### Option B: Docker Startup (Zero Manual Dependencies)
If the target machine has Docker Desktop installed:
1. Double-click **`docker-start.bat`**.
2. Open `http://localhost:3000` in your browser.
3. To stop the stack, double-click **`docker-stop.bat`**.

---

## 🐧 Quick Start (Linux / macOS)

1. Open a terminal in the project directory:
   ```bash
   chmod +x start.sh stop.sh docker-start.sh docker-stop.sh
   ```
2. Run the startup script:
   ```bash
   ./start.sh
   ```
3. To stop services, press `Ctrl+C` in the running terminal or execute:
   ```bash
   ./stop.sh
   ```

---

## 📋 Target Machine Prerequisites

### For Native Startup:
- **Python 3.10+**: Must be in system PATH (`python --version`)
- **PHP 8.1+**: Must be in system PATH (`php -v`). *(On Windows, can be XAMPP `C:\xampp\php` or standalone PHP)*
- **Node.js 18+ and npm**: Must be in system PATH (`node -v` and `npm -v`)

### For Docker Startup:
- **Docker Desktop** or **Docker Engine 24+** with `docker compose`.

---

## 🔑 One-Click Demo Accounts

On the login page (`http://localhost:3000`), click any of the top autofill demo buttons:

| Persona | Demo Email | Demo Password | Purpose |
| :--- | :--- | :--- | :--- |
| **Patient Demo** | `alex.adeyemi@example.com` | `patient123` | Patient dashboard, meal planner, ML recommendations, seeded food diary & glucose logs |
| **Clinician Demo** | `dr.balogun@nutricare.clinic` | `clinician123` | Patient directory, compliance review, meal plan approval locking |
| **Admin Demo** | `admin@nutricare.ai` | `admin123` | ML Ops dashboard, Random Forest model metrics (95.83% accuracy), safety rule logs |

---

## 🧪 Verification & Health Check Endpoints

Once started, verify service connectivity:

| Service | Port | Health Check URL | Expected Response |
| :--- | :--- | :--- | :--- |
| **Next.js Frontend** | `3000` | `http://localhost:3000` | HTTP 200 (Interactive Web UI) |
| **PHP Backend REST API** | `8080` | `http://127.0.0.1:8080/api/v1/health` | `{"status":"healthy","app":"NutriCare AI Backend..."}` |
| **Python ML Microservice** | `8000` | `http://127.0.0.1:8000/health` | `{"status":"healthy","model_loaded":true,"model_version":"rf-v1.0.0-fao-ada2026"}` |

### Automated Integration Test:
Run the backend test suite anytime to verify clinical calculations and allergen filtering:
```powershell
php backend/tests/BackendTest.php
```
*Expected: 5 of 5 tests passing (Allergens, Yield Math, ADA Rule of 15, Reminders, ML recommendations).*

---

## 📁 Project Directory Breakdown

```
nutricare-ai/
├── start.bat               # Windows 1-Click Startup
├── stop.bat                # Windows 1-Click Stop
├── start.ps1               # PowerShell Startup
├── stop.ps1                # PowerShell Stop
├── start.sh                # Linux / macOS Startup
├── stop.sh                 # Linux / macOS Stop
├── docker-start.bat        # Docker 1-Click Startup
├── docker-stop.bat         # Docker 1-Click Stop
├── docker-compose.yml      # Multi-container topology (Frontend, Backend, ML, Postgres, Redis, Nginx)
├── DEPLOYMENT.md           # This deployment guide
├── README.md               # Architecture and project overview
├── BLUEPRINT.md            # Comprehensive system blueprint
│
├── frontend/               # Next.js 14 Responsive PWA (Patient, Clinician, Admin)
├── backend/                # Modular Monolith PHP 8.2 Backend REST API
├── ml-service/             # FastAPI + scikit-learn Random Forest Microservice
└── infrastructure/         # Dockerfiles and Nginx reverse proxy configurations
```

---

## ❓ Troubleshooting

1. **Port Conflicts (`Address already in use`):**
   - The startup scripts automatically detect and clear stale processes on ports `8000`, `8080`, and `3000`. You can also run `stop.bat` or `.\stop.ps1`.
2. **PHP not recognized in Command Prompt on Windows:**
   - Add your PHP directory (e.g. `C:\xampp\php`) to your Windows User or System Environment `PATH` variable.
3. **Python dependencies error:**
   - Run `pip install -r ml-service/requirements.txt`.
4. **Node module issues:**
   - In `frontend/`, delete `node_modules` and run `npm install`.
