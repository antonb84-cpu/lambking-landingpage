# Beendet ein noch laufendes, aelteres Admin-Programm, damit nach dem Start immer die neueste Version laeuft.
# Wird von ADMIN-STARTEN.bat aufgerufen. Es wird nur der Prozess beendet, der den Admin-Port belegt UND
# admin_server.py ausfuehrt - sonst nichts.
$port = 8123
if ($env:LAMBKING_ADMIN_PORT) { $port = [int]$env:LAMBKING_ADMIN_PORT }
$connection = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($connection) {
  $process = Get-CimInstance Win32_Process -Filter "ProcessId=$($connection.OwningProcess)"
  if ($process -and $process.CommandLine -match 'admin_server\.py') {
    Stop-Process -Id $process.ProcessId -Force
    Start-Sleep -Seconds 1
    Write-Host "  Ein noch laufendes aelteres Admin-Programm wurde beendet."
  }
}
