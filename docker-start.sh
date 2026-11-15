#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

command -v docker >/dev/null 2>&1 || { echo "[ERROR] Docker is required. Please install Docker or run ./start.sh."; exit 1; }

echo "Starting NutriCare AI via Docker Compose..."
docker compose up --build -d

echo "Stack is booting in background."
echo "Web Application: http://localhost:3000"
echo "Backend API:     http://localhost:8080/api/v1"
echo "ML Service:      http://localhost:8000"
echo "To stop:         ./docker-stop.sh"
