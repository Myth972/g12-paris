@echo off
setlocal enabledelayedexpansion

TITLE G12 Paris - Server Launcher

:menu
cls
echo ==========================================
echo    G12 Paris Infos Medias - Launcher
echo ==========================================
echo.
echo [1] Start in Development Mode (with hot-reload)
echo [2] Start in Production Mode
echo [3] Check Node.js and npm versions
echo [4] Install dependencies
echo [5] Exit
echo.
set /p choice="Enter choice (1-5) [Default: 1]: "

if "%choice%"=="5" (
    exit /b 0
)

if "%choice%"=="3" (
    echo.
    echo Checking Node.js version...
    node --version
    echo.
    echo Checking npm version...
    npm --version
    echo.
    pause
    goto menu
)

if "%choice%"=="4" (
    echo.
    echo Installing dependencies...
    call pnpm install || call npm install
    echo.
    echo Dependencies installed!
    pause
    goto menu
)

if "%choice%"=="2" (
    echo.
    echo ==========================================
    echo    Starting Production Mode
    echo ==========================================
    echo.
    echo Building the project...
    call pnpm build || call npm run build
    echo.
    echo Starting server...
    call pnpm start || call npm start
) else (
    echo.
    echo ==========================================
    echo    Starting Development Mode
    echo ==========================================
    echo.
    echo Frontend: http://localhost:3001/
    echo API: http://localhost:3001/api/trpc
    echo.
    echo Database: Connected to Turso
    echo AI Provider: Groq (llama-3.3-70b-versatile)
    echo.
    echo Press Ctrl+C to stop the server
    echo.
    call pnpm dev || call npm run dev
)

echo.
echo Server stopped.
pause
goto menu

