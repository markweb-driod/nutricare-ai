#!/usr/bin/env bash
# NutriCare AI - Stop Services Script (Linux / macOS)

echo "Stopping NutriCare AI services..."

fuser -k 8000/tcp 2>/dev/null || true
fuser -k 8080/tcp 2>/dev/null || true
fuser -k 3000/tcp 2>/dev/null || true

# Also search by process names if needed
pkill -f "uvicorn app.main:app" 2>/dev/null || true
pkill -f "php -S 127.0.0.1:8080" 2>/dev/null || true

echo "[DONE] All NutriCare AI services stopped."
