@echo off
REM Document Intelligence Platform - Smart Quick Start (Windows)
REM Automatically detects Docker vs local Python setup

echo.
echo =========================================================
echo  Document Intelligence Platform - FastAPI + React
echo  AI-Powered Document Analysis, Summarization & Audio
echo =========================================================
echo.

REM Check what mode to use
set MODE=local

where docker >nul 2>nul
if %errorlevel% equ 0 (
    docker info >nul 2>nul
    if %errorlevel% equ 0 (
        set MODE=docker
        echo [INFO] Docker detected - will start MongoDB + Redis via Docker
    ) else (
        echo [INFO] Docker found but not running - using local mode
    )
) else (
    echo [INFO] Docker not found - using local Python mode
)

REM Check .env file
if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env >nul
        echo [INFO] Created .env from .env.example
    )
)

REM If Docker mode, start DB services
if "%MODE%"=="docker" (
    echo.
    echo [1/4] Starting MongoDB + Redis via Docker...
    docker-compose up -d mongodb redis 2>nul
    timeout /t 3 /nobreak >nul
    echo  OK MongoDB + Redis containers started
)

REM Check Python venv
echo.
echo [2/4] Checking Python environment...
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
    echo  OK Virtual environment activated
) else (
    echo  WARN No venv found - using system Python
    echo       Run: python -m venv venv ^&^& venv\Scripts\pip install -r requirements.txt
)

REM Check OpenRouter API Key
if "%OPENROUTER_API_KEY%"=="" (
    echo.
    echo  NOTE: OPENROUTER_API_KEY not set
    echo        Platform will use Local Fallback Reasoning Engine (no LLM API needed)
    echo        For AI-powered summaries, set: set OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY
    echo.
)

REM Start Backend
echo.
echo [3/4] Starting FastAPI backend on port 3000...
REM A host-provided DEBUG value such as "release" is not a valid boolean for Pydantic.
set "DEBUG=False"
start "FastAPI Backend - Port 3000" cmd /k "cd /d %CD% && (if exist venv\Scripts\activate.bat call venv\Scripts\activate.bat) && uvicorn main:app --host 0.0.0.0 --port 3000 --reload"
timeout /t 4 /nobreak >nul

REM Health check
echo  Verifying backend health...
powershell -Command "try { $r = Invoke-RestMethod 'http://localhost:3000/health' -TimeoutSec 5; Write-Host '  OK Backend healthy - LLM Provider:' $r.llm_provider } catch { Write-Host '  WAIT Backend still starting...' }" 2>nul

REM Start Frontend
echo.
echo [4/4] Starting React Frontend on port 5173...
if exist "frontend\node_modules" (
    start "React Frontend - Port 5173" cmd /k "cd /d %CD%\frontend && npm run dev"
) else (
    echo  Installing frontend dependencies first...
    start "React Frontend - Port 5173" cmd /k "cd /d %CD%\frontend && npm install && npm run dev"
)

timeout /t 3 /nobreak >nul

echo.
echo =========================================================
echo  Platform is starting! Access at:
echo.
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:3000
echo   API Docs:  http://localhost:3000/docs
echo   Health:    http://localhost:3000/health
echo =========================================================
echo.
echo  QUICK DEMO:
echo    1. Open http://localhost:5173
echo    2. Click "Load 1-Click Demo Dataset"
echo    3. Click any document to generate AI summary
echo    4. Explore: Q^&A, Quality Center, Audio Briefing
echo.
echo  TIPS:
echo    - Stop backend:   Close the "FastAPI Backend" window
echo    - Stop frontend:  Close the "React Frontend" window
echo    - MongoDB logs:   docker-compose logs -f mongodb
echo    - API explorer:   http://localhost:3000/docs
echo.
pause
