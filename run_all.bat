@echo off
echo ========================================================
echo Starting GridResQ AI Outage Management System
echo Backend (FastAPI + Supabase) & Frontend (React + Vite)
echo ========================================================
cd /d "%~dp0"

start "GridResQ Backend (Port 8000)" cmd /k "run_server.bat"
start "GridResQ Frontend (Port 3000)" cmd /k "run_ui.bat"

echo.
echo GridResQ services are launching:
echo  - Backend API:  http://localhost:8000
echo  - Swagger Docs: http://localhost:8000/docs
echo  - Frontend UI:  http://localhost:3000
echo.

