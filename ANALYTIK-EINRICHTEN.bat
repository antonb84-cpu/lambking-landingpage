@echo off
setlocal
cd /d "%~dp0analytics-worker"
title LambKing Analytik einrichten
echo ========================================================
echo   LambKing: anonymen Seitenzaehler einmalig einrichten
echo ========================================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo FEHLER: Node.js fehlt. Bitte zuerst Node.js LTS installieren.
  pause
  exit /b 1
)
call npm install
if errorlevel 1 goto :error
call npm run setup
if errorlevel 1 goto :error
echo.
pause
exit /b 0

:error
echo.
echo Die Einrichtung wurde nicht abgeschlossen. Bestehende Landingpage-Daten bleiben erhalten.
echo Lies bitte die Fehlermeldung oben oder starte die Datei erneut.
pause
exit /b 1
