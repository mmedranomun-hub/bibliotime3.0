# Sube los cambios locales de Bibliotime a repo3 (github.com/mmedranomun-hub/bibliotime3.0).
# Pensado para ejecutarse al cerrar sesión de Claude Code (hook SessionEnd) o a mano.
# Nunca hace push a origin ni usa --force: si repo3 tiene commits nuevos (p. ej. editados
# desde la web de GitHub), los integra primero con merge y, si hay conflicto, se para.
param([string]$Repo = "C:\Users\pc\Bibliotime")

$ErrorActionPreference = "Stop"
Set-Location $Repo
$log = Join-Path $Repo "scripts\subir_a_github.log"
function Log($m) { "$(Get-Date -Format s)  $m" | Out-File -Append -Encoding utf8 $log }

try {
    git add -A -- . ':!scripts/subir_a_github.log'
    $pend = git diff --cached --name-only
    if ($pend) {
        git commit -q -m "Sincronizacion automatica al cerrar sesion ($(Get-Date -Format 'yyyy-MM-dd HH:mm'))"
        Log "Commit creado: $($pend -join ', ')"
    }
    git fetch -q repo3
    $detras = git rev-list --count main..repo3/main
    if ([int]$detras -gt 0) {
        git merge -q --no-edit repo3/main
        if ($LASTEXITCODE -ne 0) { git merge --abort; Log "Conflicto con repo3/main: resolver a mano"; exit 1 }
        Log "Integrados $detras commits de repo3/main"
    }
    git push -q repo3 main:main
    Log "Push a repo3 OK"
} catch {
    Log "ERROR: $_"
    exit 1
}
