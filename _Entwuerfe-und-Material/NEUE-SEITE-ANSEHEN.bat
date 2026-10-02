@echo off
title LambKing - neue Seite (Fenster offen lassen)
cd /d C:\LambKing.de
if exist "C:\LambKing.de\runtime\node\node.exe" set "PATH=C:\LambKing.de\runtime\node;%PATH%"

powershell -NoProfile -Command "try{ Invoke-WebRequest -UseBasicParsing http://localhost:3000/ -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }"
if %errorlevel%==0 (
  echo Die Seite laeuft bereits - oeffne den Browser ...
  start "" http://localhost:3000/
  timeout /t 3 >nul
  exit /b
)

echo Neue LambKing-Seite wird gestartet ...
echo Der Browser oeffnet sich automatisch, sobald alles bereit ist.
echo Dieses Fenster offen lassen. Zum Beenden schliessen.
start "" /min powershell -NoProfile -Command "for($i=0;$i -lt 90;$i++){ try{ Invoke-WebRequest -UseBasicParsing http://localhost:3000/ -TimeoutSec 2 | Out-Null; Start-Process 'http://localhost:3000/'; break } catch { Start-Sleep 1 } }"
call npm run dev -- --port 3000 --strictPort
pause
