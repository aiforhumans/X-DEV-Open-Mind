@echo off
REM ============================================================================
REM X-DEV Open Mind - LM Studio Launcher
REM Runs the LM Studio backend test suite, then starts the UI server
REM ============================================================================

setlocal enabledelayedexpansion

set "TEST_EXIT_CODE=0"

echo.
echo ============================================================================
echo  X-DEV Open Mind - Launcher
echo  Running LM Studio backend tests and starting the UI
echo ============================================================================
echo.

REM ============================================================================
REM STEP 1: Check for Node.js and npm
REM ============================================================================
echo [1/3] Checking Node.js and npm...

where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js not found! Install from https://nodejs.org/
    pause
    exit /b 1
)

where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm not found! Install from https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set "NODE_VERSION=%%i"
for /f "tokens=*" %%i in ('npm --version') do set "NPM_VERSION=%%i"

echo OK - Node.js !NODE_VERSION! found
echo OK - npm !NPM_VERSION! found
echo.

REM ============================================================================
REM STEP 2: Install dependencies
REM ============================================================================
echo [2/3] Checking dependencies...

if not exist "node_modules" (
    echo Installing root dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install root dependencies!
        pause
        exit /b 1
    )
)

if not exist "X-DEV-LM-Studio\node_modules" (
    echo Installing LM Studio dependencies...
    call npm install -w X-DEV-LM-Studio
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install LM Studio dependencies!
        pause
        exit /b 1
    )
)

echo OK - Dependencies ready
echo.

REM ============================================================================
REM STEP 3: Run LM Studio test suite
REM ============================================================================
echo [3/4] Running LM Studio test suite...
echo.

call npm test
set "TEST_EXIT_CODE=%ERRORLEVEL%"

echo.
if %TEST_EXIT_CODE% NEQ 0 (
    echo ERROR: LM Studio test suite failed!
) else (
    echo OK - LM Studio test suite passed
)

if %TEST_EXIT_CODE% NEQ 0 (
    echo.
    echo ============================================================================
    echo Test run complete
    echo ============================================================================
    echo.
    pause
    exit /b %TEST_EXIT_CODE%
)

echo.
echo [4/4] Starting the LM Studio UI server...
echo This will open the browser UI at http://localhost:3000
echo.

start "X-DEV LM Studio Server" cmd /k "cd /d %~dp0 && npm start -w X-DEV-LM-Studio"
timeout /t 3 >nul
start "" "http://localhost:3000"

echo.
echo ============================================================================
echo UI launcher started
echo ============================================================================
echo.
pause

exit /b %TEST_EXIT_CODE%
