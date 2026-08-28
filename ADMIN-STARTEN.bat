@echo off
chcp 65001 >nul
title LambKing Admin
REM Alle Pfade werden aus dem Speicherort dieser Datei bestimmt (portabel).
cd /d "%~dp0"

REM Python suchen: Windows-Python-Launcher, dann python im PATH
set "PY="
where py >nul 2>nul && set "PY=py -3"
if not defined PY (
  where python >nul 2>nul && set "PY=python"
)
if not defined PY (
  echo.
  echo   Python ist auf diesem Computer noch nicht installiert.
  echo   Bitte installiere Python von https://www.python.org/downloads/
  echo   Wichtig: Beim Installieren den Haken bei "Add Python to PATH" setzen.
  echo.
  pause
  exit /b 1
)

%PY% admin\startcheck.py
if errorlevel 1 exit /b 1

echo.
echo   LambKing Admin wird gestartet ...
echo   Der Browser oeffnet sich gleich automatisch.
echo   Zum Beenden einfach dieses Fenster schliessen.
echo.

%PY% admin\admin_server.py
if errorlevel 1 (
  echo.
  echo   Es gab ein Problem beim Start. Bitte die Meldung oben lesen.
)
pause
