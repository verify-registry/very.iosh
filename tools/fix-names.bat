@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0fix-names.ps1"
if errorlevel 1 (
    echo.
    echo An error occurred while fixing file names.
    pause
    exit /b 1
)
echo.
echo File-name check completed.
pause
