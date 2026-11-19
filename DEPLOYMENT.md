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

On the login page (`http://localhost:3000`), click a demo button or sign in with these credentials. The workspace opens based on the account's role, and passwords are checked by the API.

| Persona | Demo Email | Demo Password | Purpose |
| :--- | :--- | :--- | :--- |
| **Patient Demo** | `alex.adeyemi@example.com` | `patient123` | Dashboard, recommendations, meal planner, food diary, glucose log, reminders, profile |
| **Patient (2)** | `grace.okafor@example.com` | `patient123` | Insulin patient with a fish allergy, CKD and a pending plan review |
| **Clinician Demo** | `dr.balogun@nutricare.clinic` | `clinician123` | Patient directory, targets, review queue (approve / request changes), reports |
| **Admin Demo** | `admin@nutricare.ai` | `admin123` | System health, live ML metrics, safety rule matrix, audit log |

New patients can sign up with **Create patient account** (a 6-step intake). Their plan starts as *Pending review* until a clinician approves it.

**Data storage:** state is kept in `backend/storage/app_state.json` (git-ignored). It is created from seed data on the first request. To reset the demo data, stop the services, delete that file, and start again.

**Sharing publicly:** `.\tunnel.ps1` starts the stack if needed, replaces any previous tunnel, and prints a temporary public HTTPS URL (Cloudflare quick tunnel). The PHP API is proxied through Next.js at `/api/v1`, so one URL serves the whole app.

**Vercel:** the frontend is deployed to Vercel (https://nutricare-ai-psi.vercel.app) and forwards `/api/v1` to `BACKEND_URL`, which points at this PC's tunnel. When the repo is linked to Vercel (`.vercel/` exists), `tunnel.ps1` also updates `BACKEND_URL` and redeploys production whenever the tunnel URL changes. Use `.\tunnel.ps1 -NoVercel` to skip that. The Vercel site only works while this PC, the services and the tunnel are running. **If sign-in shows a 502 or 530, run `.\tunnel.ps1 -Detach` again.**

Use `-Detach` when starting from an IDE terminal, agent or automation shell. Those shells can run commands inside a Windows job object that kills every child process when the shell closes or restarts, which takes the site down. `-Detach` launches the stack through WMI so it keeps running independently. A normal PowerShell window works without it. A 530 for a minute or two right after a restart is expected while Vercel redeploys onto the new tunnel.

**Watchdog (auto-recovery):** when this PC sleeps, Cloudflare drops the quick tunnel and it never comes back by itself. The `NutriCare Watchdog` scheduled task checks the live API every 5 minutes, 1 minute after the PC wakes, and at sign-in. If the API isn't answering, it runs `stop.ps1` then `tunnel.ps1 -Detach`, which also re-points Vercel. It skips the check when there's no internet and waits at least 10 minutes between repairs. Recovery takes about 2 minutes.

```powershell
.\install-watchdog.ps1              # install / update the task (current user, no admin)
.\install-watchdog.ps1 -Uninstall   # remove it
.\watchdog.ps1 -Force               # repair now, by hand
```

Log: `%TEMP%\nutricare-watchdog.log`. The site is still down while the PC is asleep or off. To avoid that, set Windows sleep to *Never* when plugged in, or host the backend on an always-on server.

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
*Expected: 7 of 7 tests passing (Allergens, Yield Math, ADA Rule of 15, Reminders, ML recommendations, Auth tokens, Seed state).*

To regenerate the model and the metrics shown on the admin ML page (`ml-service/models/metrics.json`):
```powershell
cd ml-service/training; python train.py
```

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
