# Retoma la sesión de Claude Code de Bibliotime cada vez que este ordenador se conecta a una wifi.
# Windows registra el evento 10000 de "NetworkProfile" al conectarse a una red; una tarea programada
# escucha ese evento y ejecuta este script, que comprueba que la conexión es wifi y abre la sesión
# en el navegador (como mucho una vez cada 30 minutos, para no abrir pestañas en cada reconexión).
#
# Instalar (una vez, en PowerShell normal, sin administrador):
#   powershell -ExecutionPolicy Bypass -File C:\Users\pc\Bibliotime\scripts\retomar_sesion_wifi.ps1 -Instalar
# Probar sin esperar a la wifi:   schtasks /Run /TN "Bibliotime - retomar sesion al conectar wifi"
# Quitar:
#   powershell -ExecutionPolicy Bypass -File C:\Users\pc\Bibliotime\scripts\retomar_sesion_wifi.ps1 -Desinstalar
param(
    [switch]$Instalar,
    [switch]$Desinstalar,
    [string]$Url = "https://claude.ai/code/session_01Nw7uR4dxgciBFmwNbJAFA3",
    [int]$MinutosEntreAperturas = 30
)

$ErrorActionPreference = "Stop"
$Tarea = "Bibliotime - retomar sesion al conectar wifi"
$log = Join-Path $PSScriptRoot "retomar_sesion_wifi.log"
$marca = Join-Path $PSScriptRoot "retomar_sesion_wifi.ultima"
function Log($m) { "$(Get-Date -Format s)  $m" | Out-File -Append -Encoding utf8 $log }

if ($Instalar) {
    $accion = "powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$PSCommandPath`""
    # Sin /RU: corre con tu usuario y solo con la sesión de Windows iniciada, así el navegador se abre en tu escritorio.
    schtasks /Create /F /TN $Tarea /SC ONEVENT /EC "Microsoft-Windows-NetworkProfile/Operational" `
        /MO "*[System[(EventID=10000)]]" /TR $accion | Out-Null
    if ($LASTEXITCODE -ne 0) { Write-Host "No se pudo crear la tarea programada."; exit 1 }
    Write-Host "Listo: al conectarte a una wifi se abrirá $Url"
    exit 0
}
if ($Desinstalar) {
    schtasks /Delete /F /TN $Tarea | Out-Null
    Write-Host "Tarea quitada."
    exit 0
}

# Ejecución desde la tarea: solo si la interfaz wifi está conectada (no con cable ni VPN).
Start-Sleep -Seconds 5   # deja que la conexión termine de establecerse
$wlan = (netsh wlan show interfaces) -join "`n"
if ($wlan -notmatch "(?m)^\s*(Estado|State)\s*:\s*(conectado|connected)\s*$") { Log "Red conectada pero no es wifi: no se abre nada"; exit 0 }

if (Test-Path $marca) {
    $ultima = [datetime](Get-Content $marca -Raw).Trim()
    if ((Get-Date) - $ultima -lt [timespan]::FromMinutes($MinutosEntreAperturas)) { Log "Abierta hace menos de $MinutosEntreAperturas min: se omite"; exit 0 }
}
(Get-Date -Format s) | Out-File -Encoding utf8 $marca
Start-Process $Url
Log "Wifi conectada: sesión abierta en el navegador"
