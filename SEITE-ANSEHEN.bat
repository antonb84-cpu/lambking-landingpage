@echo off
title LambKing - Seite ansehen (Fenster offen lassen)
cd /d "%~dp0"
if exist "%~dp0runtime\node\node.exe" set "PATH=%~dp0runtime\node;%PATH%"

powershell -NoProfile -Command "try{ Invoke-WebRequest -UseBasicParsing http://localhost:3000/ -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }"
if %errorlevel%==0 (
  echo Die Seite laeuft bereits - oeffne den Browser ...
  start "" http://localhost:3000/
  timeout /t 3 >nul
  exit /b
)

echo Die LambKing-Seite wird gestartet ...
echo Der Browser oeffnet sich automatisch, sobald alles bereit ist.
echo Dieses Fenster offen lassen. Zum Beenden schliessen.
start "" /min powershell -NoProfile -Command "for($i=0;$i -lt 90;$i++){ try{ Invoke-WebRequest -UseBasicParsing http://localhost:3000/ -TimeoutSec 2 | Out-Null; Start-Process 'http://localhost:3000/'; break } catch { Start-Sleep 1 } }"
call npm run dev -- --port 3000 --strictPort
pause
