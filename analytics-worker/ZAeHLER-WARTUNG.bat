@echo off
setlocal
set "LAMBKING_ROOT=%~dp0..\"
if exist "%LAMBKING_ROOT%runtime\node\node.exe" set "PATH=%LAMBKING_ROOT%runtime\node;%PATH%"
if exist "%LAMBKING_ROOT%runtime\mingit\cmd\git.exe" set "PATH=%LAMBKING_ROOT%runtime\mingit\cmd;%LAMBKING_ROOT%runtime\mingit\bin;%PATH%"
if exist "%LAMBKING_ROOT%runtime\python\python.exe" set "PATH=%LAMBKING_ROOT%runtime\python;%PATH%"
cd /d "%~dp0"
title LambKing Zaehler-Wartung
echo ========================================================
echo   LambKing: anonymen Seitenzaehler einrichten
echo ========================================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo FEHLER: Die mitgelieferte Node.js-Laufzeit fehlt.
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
