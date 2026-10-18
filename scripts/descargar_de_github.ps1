# Baja a esta carpeta lo que se haya subido a repo3 (sesiones en la nube, PRs, ediciones web).
# Solo avanza si es seguro (fast-forward y sin cambios sin guardar); si no, lo apunta en el log
# y no toca nada. No usa Claude, así que no gasta tokens. Pensado para el Programador de
# tareas de Windows (cada hora) o para ejecutarlo a mano.
param([string]$Repo = "C:\Users\pc\Bibliotime")

Set-Location $Repo
$log = Join-Path $Repo "scripts\sincronizacion.log"
function Log($m) { "$(Get-Date -Format s)  $m" | Out-File -Append -Encoding utf8 $log }
$env:GIT_TERMINAL_PROMPT = "0"

git fetch -q repo3 2>$null
if ($LASTEXITCODE -ne 0) { Log "fetch de repo3 falló (¿sin conexión?)"; exit 1 }

$nuevos = [int](git rev-list --count main..repo3/main)
if ($nuevos -eq 0) { exit 0 }

if ((git rev-parse --abbrev-ref HEAD) -ne "main") { Log "Hay $nuevos commits nuevos en repo3, pero no estás en main: no toco nada"; exit 0 }
if (git status --porcelain --untracked-files=no) { Log "Hay $nuevos commits nuevos en repo3, pero hay cambios sin guardar: no toco nada"; exit 0 }

git merge -q --ff-only repo3/main 2>$null
if ($LASTEXITCODE -eq 0) { Log "Descargados $nuevos commits de repo3" }
else { Log "main y repo3 han divergido ($nuevos commits nuevos allí): hay que integrarlos a mano o con Claude" }
