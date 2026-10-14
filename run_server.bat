@echo off
echo ========================================================
echo Starting GridResQ FastAPI Backend Server
echo ========================================================
cd /d "%~dp0"

IF NOT EXIST ".venv\Scripts\python.exe" (
    echo Python virtual environment not found. Setting up...
    python -m venv .venv
    .venv\Scripts\pip install -r server\requirements.txt
    .venv\Scripts\python.exe server\database\init_db.py
)

echo Starting uvicorn on http://localhost:8000
echo Interactive API Docs: http://localhost:8000/docs
.venv\Scripts\python.exe -m uvicorn server.main:app --reload --host 0.0.0.0 --port 8000
pause

