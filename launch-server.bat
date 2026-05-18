@echo off
setlocal enabledelayedexpansion

TITLE G12 Paris - Server Launcher

:env_select
cls
echo ==========================================
echo    G12 Paris Infos Medias - Environment Selection
echo ==========================================
echo.
echo [1] Racine du projet (Development)
echo [2] Production en cours (Build/Deploy)
echo.
set env_choice=
set /p env_choice="Select environment (1-2): "

if "%env_choice%"=="1" set "TARGET_DIR=."
if "%env_choice%"=="2" set "TARGET_DIR=Production en cours"

if "%TARGET_DIR%"=="" (
    echo Invalid choice.
    pause
    goto env_select
)

:menu
cls
echo ==========================================
echo    G12 Paris Infos Medias - Launcher
echo ==========================================
echo.
echo Current environment: %TARGET_DIR%
echo.
echo [1] Start in Development Mode (with hot-reload)
echo [2] Start in Production Mode
echo [3] Build + Check TypeScript
echo [4] Check Node.js and npm versions
echo [5] Install dependencies
echo [6] Run Tests
echo [7] Format Code
echo [8] Restart Server (Dev)
echo [9] Change Environment
echo [10] Exit
echo.
set choice=1
set /p choice="Enter choice (1-10) [Default: 1]: "

if "%choice%"=="10" (
    exit /b 0
)

if "%choice%"=="9" (
    goto env_select
)

if "%choice%"=="3" (
    echo.
    echo ==========================================
    echo    Building + TypeScript Check
    echo ==========================================
    echo.
    echo Checking TypeScript...
    pushd "%TARGET_DIR%"
    call npm run check
    popd
    echo.
    if errorlevel 1 (
        echo ❌ TypeScript Errors Found!
        pause
    ) else (
        echo ✅ TypeScript OK - Building...
        pushd "%TARGET_DIR%"
        call npm run build
        popd
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
    pushd "%TARGET_DIR%"
    call npm install
    popd
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
    pushd "%TARGET_DIR%"
    call npm test
    popd
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
    pushd "%TARGET_DIR%"
    call npm run format
    popd
    echo.
    echo Code formatted!
    pause
    goto menu
)

if "%choice%"=="8" (
    echo.
    echo ==========================================
    echo    Restarting Development Server
    echo ==========================================
    echo.
    echo Stopping server on port 3000 if running...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /F /PID %%a >nul 2>nul
    echo.
    echo Starting Development Mode in %TARGET_DIR%...
    echo Frontend: http://localhost:3000/
    echo API: http://localhost:3000/api/trpc
    echo.
    echo Press Ctrl+C to stop the server
    echo.
    pushd "%TARGET_DIR%"
    call npm run dev
    popd
    goto menu
)

if "%choice%"=="2" (
    echo.
    echo ==========================================
    echo    Starting Production Mode
    echo ==========================================
    echo.
    if "%TARGET_DIR%"=="." (
        echo Building the project from root...
        call npm run build
        echo.
        echo Starting server from dist...
        call npm start
    ) else (
        echo Starting pre-built server from Production en cours...
        echo (Build already done, using dist/)
        echo.
        pushd "%TARGET_DIR%"
        call npm start
        popd
    )
) else if "%choice%"=="1" (
    echo.
    echo ==========================================
    echo    Starting Development Mode
    echo ==========================================
    echo.
    echo Frontend: http://localhost:3000/
    echo API: http://localhost:3000/api/trpc
    echo.
    echo Database: Connected to Turso
    echo AI Provider: Groq (llama-3.3-70b-versatile)
    echo.
    echo Press Ctrl+C to stop the server
    echo.
    pushd "%TARGET_DIR%"
    call npm run dev
    popd
) else (
    echo Invalid choice.
    pause
    goto menu
)

echo.
echo Server stopped.
pause
goto menu