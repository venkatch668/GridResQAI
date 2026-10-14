@echo off
echo ========================================================
echo Starting GridResQ React + Vite Frontend
echo ========================================================
cd /d "%~dp0\ui"

IF NOT EXIST "node_modules" (
    echo Frontend dependencies not found. Installing...
    call npm install
)

echo Starting Vite dev server on http://localhost:3000
call npm run dev
pause


