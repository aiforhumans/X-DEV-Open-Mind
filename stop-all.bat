@echo off
REM ============================================================================
REM X-DEV Open Mind - Stop All Processes
REM Kill all running backend and Obsidian processes
REM ============================================================================

echo.
echo Killing all X-DEV processes...
echo.

REM Kill Node.js processes (backend server)
for /f "tokens=2" %%i in ('tasklist ^| findstr /i "node"') do (
    echo Killing Node.js process: %%i
    taskkill /PID %%i /F >nul 2>&1
)

REM Kill Obsidian processes
for /f "tokens=2" %%i in ('tasklist ^| findstr /i "Obsidian"') do (
    echo Killing Obsidian process: %%i
    taskkill /PID %%i /F >nul 2>&1
)

echo.
echo Done - All processes stopped
echo.
pause
