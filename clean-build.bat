@echo off
REM ============================================================================
REM X-DEV Open Mind - Clean Build and Start
REM Remove all build artifacts, rebuild everything, and start
REM ============================================================================

echo.
echo ============================================================================
echo  X-DEV Open Mind - Clean Build
echo  This will remove all node_modules and dist, then rebuild everything
echo ============================================================================
echo.
echo WARNING: This will take several minutes
pause

REM Stop any running processes
echo.
echo Stopping any running X-DEV processes...
call stop-all.bat

echo.
echo Cleaning build artifacts...

REM Remove node_modules and build outputs
if exist node_modules (
    echo Removing root node_modules...
    rmdir /s /q node_modules >nul 2>&1
)

if exist X-DEV-LM-Studio\node_modules (
    echo Removing LM Studio node_modules...
    rmdir /s /q X-DEV-LM-Studio\node_modules >nul 2>&1
)

if exist X-DEV-LM-Studio\dist (
    echo Removing LM Studio dist...
    rmdir /s /q X-DEV-LM-Studio\dist >nul 2>&1
)

if exist X-DEV-Obsidian\node_modules (
    echo Removing Obsidian node_modules...
    rmdir /s /q X-DEV-Obsidian\node_modules >nul 2>&1
)

if exist X-DEV-Obsidian\main.js (
    echo Removing Obsidian main.js...
    del /f /q X-DEV-Obsidian\main.js >nul 2>&1
)

echo Clean complete!
echo.
echo Now running full setup and start...
echo.

REM Run setup
call npm install
call npm install -w X-DEV-LM-Studio
call npm install -w X-DEV-Obsidian
call npm run build:all

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

REM Start the launcher
echo.
echo Build successful! Starting LM Studio test suite...
echo.
timeout /t 2 >nul
call start.bat
