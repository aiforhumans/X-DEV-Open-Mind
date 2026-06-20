@echo off
REM ============================================================================
REM X-DEV Open Mind - Setup Only (Install & Build, No Launch)
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ============================================================================
echo  X-DEV Open Mind - Setup Script
echo  Installing dependencies and building projects
echo ============================================================================
echo.

REM Check Node.js
echo [1/3] Checking Node.js and npm...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js not found! Install from https://nodejs.org/
    pause
    exit /b 1
)
echo OK - Node.js found

REM Install dependencies
echo.
echo [2/3] Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)
call npm install -w X-DEV-LM-Studio
call npm install -w X-DEV-Obsidian
echo OK - Dependencies installed

REM Build projects
echo.
echo [3/3] Building projects...
call npm run build:all
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)
echo OK - Build complete

echo.
echo ============================================================================
echo SETUP COMPLETE!
echo Next: Run start.bat to launch the LM Studio browser UI, or npm test for tests only
echo ============================================================================
echo.
pause
