@echo off
chcp 65001 >nul
set "PYTHONUTF8=1"
title LambKing Admin
REM Alle Pfade werden aus dem Speicherort dieser Datei bestimmt (portabel).
cd /d "%~dp0"

REM Eine echte Python-Installation suchen. "where python" allein reicht nicht,
REM weil Windows auch eine wirkungslose Microsoft-Store-Verknuepfung liefert.
set "PYEXE="
set "PYARGS="
if exist "%LocalAppData%\Programs\Python\Launcher\py.exe" (
  set "PYEXE=%LocalAppData%\Programs\Python\Launcher\py.exe"
  set "PYARGS=-3"
)
if not defined PYEXE (
  py -3 -c "import sys" >nul 2>nul && (
    set "PYEXE=py"
    set "PYARGS=-3"
  )
)
if not defined PYEXE (
  python -c "import sys" >nul 2>nul && set "PYEXE=python"
)
if not defined PYEXE (
  for /d %%D in ("%LocalAppData%\Programs\Python\Python3*") do (
    if not defined PYEXE if exist "%%~fD\python.exe" set "PYEXE=%%~fD\python.exe"
  )
)
if not defined PYEXE (
  echo.
  echo   Python ist auf diesem Computer noch nicht installiert.
  echo   Bitte installiere Python von https://www.python.org/downloads/
  echo   Wichtig: Beim Installieren den Haken bei "Add Python to PATH" setzen.
  echo.
  pause
  exit /b 1
)

"%PYEXE%" %PYARGS% admin\startcheck.py
if errorlevel 1 exit /b 1

echo.
echo   LambKing Admin wird gestartet ...
echo   Der Browser oeffnet sich gleich automatisch.
echo   Zum Beenden einfach dieses Fenster schliessen.
echo.

"%PYEXE%" %PYARGS% admin\admin_server.py
if errorlevel 1 (
  echo.
  echo   Es gab ein Problem beim Start. Bitte die Meldung oben lesen.
)
pause
