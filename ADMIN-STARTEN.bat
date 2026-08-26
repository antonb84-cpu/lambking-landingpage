@echo off
chcp 65001 >nul
title LambKing Admin
cd /d "%~dp0app\admin"

set "PY=C:\Users\anton\AppData\Roaming\kimi-desktop\daimon-share\daimon\runtime\python\.venv\Scripts\python.exe"
if not exist "%PY%" set "PY=python"

echo.
echo   LambKing Admin wird gestartet ...
echo   Der Browser oeffnet sich gleich automatisch.
echo   Zum Beenden einfach dieses Fenster schliessen.
echo.

"%PY%" admin_server.py
if errorlevel 1 (
  echo.
  echo   Es gab ein Problem. Bitte dieses Fenster offen lassen
  echo   und Anton Bescheid geben bzw. Kimi fragen.
)
pause
