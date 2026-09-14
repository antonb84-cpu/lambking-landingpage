@echo off
setlocal
set "LAMBKING_ROOT=%~dp0"
if exist "%LAMBKING_ROOT%runtime\node\node.exe" set "PATH=%LAMBKING_ROOT%runtime\node;%PATH%"
if exist "%LAMBKING_ROOT%runtime\git\cmd\git.exe" set "PATH=%LAMBKING_ROOT%runtime\git\cmd;%LAMBKING_ROOT%runtime\git\bin;%PATH%"
if exist "%LAMBKING_ROOT%runtime\python\python.exe" set "PATH=%LAMBKING_ROOT%runtime\python;%PATH%"
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
if not exist "node_modules\wrangler\bin\wrangler.js" (
  echo Die mitgelieferten Zaehler-Pakete fehlen und werden einmalig geladen.
  call npm install
  if errorlevel 1 goto :error
)
call npm run setup
if errorlevel 1 goto :error
echo.
if /I not "%~1"=="--from-admin" pause
exit /b 0

:error
echo.
echo Die Einrichtung wurde nicht abgeschlossen. Bestehende Landingpage-Daten bleiben erhalten.
echo Lies bitte die Fehlermeldung oben oder starte die Datei erneut.
if /I not "%~1"=="--from-admin" pause
exit /b 1
