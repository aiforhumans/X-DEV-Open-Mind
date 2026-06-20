@echo off
REM ============================================================================
REM X-DEV Open Mind - Windows Launcher
REM Starts LM Studio backend + Obsidian plugin in a single command
REM ============================================================================

setlocal enabledelayedexpansion

REM Colors and formatting
for /F %%A in ('echo prompt $H ^| cmd') do set "BS=%%A"
set "RESET=[0m"
set "GREEN=[32m"
set "RED=[31m"
set "YELLOW=[33m"
set "BLUE=[34m"
set "CYAN=[36m"

REM Store process IDs for cleanup
set "BACKEND_PID="
set "OBSIDIAN_PID="

echo.
echo %BLUE%============================================================================%RESET%
echo %BLUE%  X-DEV Open Mind - Launcher%RESET%
echo %BLUE%  Starting Backend Server + Obsidian Plugin%RESET%
echo %BLUE%============================================================================%RESET%
echo.

REM ============================================================================
REM STEP 1: Check for Node.js and npm
REM ============================================================================
echo %CYAN%[1/5] Checking Node.js and npm...%RESET%

where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo %RED%ERROR: Node.js not found!%RESET%
    echo.
    echo Please install Node.js 20+ from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo %RED%ERROR: npm not found!%RESET%
    echo.
    echo Please install Node.js 20+ from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set "NODE_VERSION=%%i"
for /f "tokens=*" %%i in ('npm --version') do set "NPM_VERSION=%%i"

echo %GREEN%✓ Node.js %NODE_VERSION% found%RESET%
echo %GREEN%✓ npm %NPM_VERSION% found%RESET%
echo.

REM ============================================================================
REM STEP 2: Install dependencies (if needed)
REM ============================================================================
echo %CYAN%[2/5] Checking dependencies...%RESET%

if not exist "node_modules" (
    echo %YELLOW%Installing root dependencies...%RESET%
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo %RED%ERROR: Failed to install root dependencies!%RESET%
        pause
        exit /b 1
    )
)

if not exist "X-DEV-LM-Studio\node_modules" (
    echo %YELLOW%Installing LM Studio dependencies...%RESET%
    call npm install -w X-DEV-LM-Studio
    if %ERRORLEVEL% NEQ 0 (
        echo %RED%ERROR: Failed to install LM Studio dependencies!%RESET%
        pause
        exit /b 1
    )
)

if not exist "X-DEV-Obsidian\node_modules" (
    echo %YELLOW%Installing Obsidian plugin dependencies...%RESET%
    call npm install -w X-DEV-Obsidian
    if %ERRORLEVEL% NEQ 0 (
        echo %RED%ERROR: Failed to install Obsidian dependencies!%RESET%
        pause
        exit /b 1
    )
)

echo %GREEN%✓ Dependencies ready%RESET%
echo.

REM ============================================================================
REM STEP 3: Build projects (if needed)
REM ============================================================================
echo %CYAN%[3/5] Checking builds...%RESET%

if not exist "X-DEV-LM-Studio\dist\index.js" (
    echo %YELLOW%Building LM Studio backend...%RESET%
    call npm run build:lm
    if %ERRORLEVEL% NEQ 0 (
        echo %RED%ERROR: Failed to build LM Studio!%RESET%
        pause
        exit /b 1
    )
)

if not exist "X-DEV-Obsidian\main.js" (
    echo %YELLOW%Building Obsidian plugin...%RESET%
    call npm run build:obsidian
    if %ERRORLEVEL% NEQ 0 (
        echo %RED%ERROR: Failed to build Obsidian plugin!%RESET%
        pause
        exit /b 1
    )
)

echo %GREEN%✓ Projects built%RESET%
echo.

REM ============================================================================
REM STEP 4: Start Backend Server
REM ============================================================================
echo %CYAN%[4/5] Starting LM Studio backend server...%RESET%

REM Start backend in a separate process and capture PID
start "X-DEV LM Studio Backend" cmd /c "cd /d %CD% && npm start -w X-DEV-LM-Studio"

REM Give it a moment to start
timeout /t 2 /nobreak

echo %GREEN%✓ Backend server starting on http://localhost:3000%RESET%
echo.

REM ============================================================================
REM STEP 5: Start Obsidian
REM ============================================================================
echo %CYAN%[5/5] Launching Obsidian...%RESET%

REM Try to find Obsidian in common locations
set "OBSIDIAN_PATH="

if exist "%PROGRAMFILES%\Obsidian\Obsidian.exe" (
    set "OBSIDIAN_PATH=%PROGRAMFILES%\Obsidian\Obsidian.exe"
) else if exist "%LOCALAPPDATA%\Obsidian\Obsidian.exe" (
    set "OBSIDIAN_PATH=%LOCALAPPDATA%\Obsidian\Obsidian.exe"
) else if exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Obsidian.lnk" (
    set "OBSIDIAN_PATH=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Obsidian.lnk"
)

if "!OBSIDIAN_PATH!" NEQ "" (
    start "" "!OBSIDIAN_PATH!"
    echo %GREEN%✓ Obsidian launching...%RESET%
) else (
    echo %YELLOW%⚠ Obsidian not found in standard locations.%RESET%
    echo %YELLOW%  Please ensure Obsidian is installed or launch it manually.%RESET%
)

echo.
echo %BLUE%============================================================================%RESET%
echo %GREEN%✓ Launcher complete!%RESET%
echo %BLUE%============================================================================%RESET%
echo.
echo %CYAN%Backend Server:%RESET%
echo   URL: %GREEN%http://localhost:3000%RESET%
echo   Logs: %CYAN%Displayed below%RESET%
echo.
echo %CYAN%Obsidian Plugin:%RESET%
echo   Settings: Plugin settings in Obsidian (Settings ^> Community Plugins ^> X-DEV)
echo   LM Studio URL: %YELLOW%http://localhost:1234%RESET%
echo.
echo %YELLOW%To stop: Close this window or press Ctrl+C%RESET%
echo.
echo %BLUE%============================================================================%RESET%
echo.

REM Wait indefinitely to keep window open
:wait_loop
timeout /t 1 >nul 2>&1
goto wait_loop
