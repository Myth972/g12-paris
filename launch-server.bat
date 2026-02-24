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
echo [3] Build + Check TypeScript
echo [4] Check Node.js and npm versions
echo [5] Install dependencies
echo [6] Run Tests
echo [7] Format Code
echo [8] Exit
echo.
set /p choice="Enter choice (1-8) [Default: 1]: "

if "%choice%"=="8" (
    exit /b 0
)

if "%choice%"=="3" (
    echo.
    echo ==========================================
    echo    Building + TypeScript Check
    echo ==========================================
    echo.
    echo Checking TypeScript...
    call pnpm check || call npm run check
    echo.
    if errorlevel 1 (
        echo ❌ TypeScript Errors Found!
        pause
    ) else (
        echo ✅ TypeScript OK - Building...
        call pnpm build || call npm run build
        if errorlevel 1 (
            echo ❌ Build Failed!
        ) else (
            echo ✅ Build Successful!
        )
    )
    echo.
    pause
    goto menu
)

if "%choice%"=="4" (
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

if "%choice%"=="5" (
    echo.
    echo Installing dependencies...
    call pnpm install || call npm install
    echo.
    echo Dependencies installed!
    pause
    goto menu
)

if "%choice%"=="6" (
    echo.
    echo ==========================================
    echo    Running Tests
    echo ==========================================
    echo.
    call pnpm test || call npm run test
    echo.
    pause
    goto menu
)

if "%choice%"=="7" (
    echo.
    echo ==========================================
    echo    Formatting Code
    echo ==========================================
    echo.
    call pnpm format || call npm run format
    echo.
    echo Code formatted!
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

