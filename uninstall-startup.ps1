$ErrorActionPreference = "Stop"

$shortcutPath = Join-Path ([Environment]::GetFolderPath("Startup")) "Study Flow.lnk"

if (Test-Path $shortcutPath) {
    Remove-Item -LiteralPath $shortcutPath
    Write-Host "Study Flow removido da inicializacao do Windows."
} else {
    Write-Host "Study Flow nao estava configurado na inicializacao do Windows."
}
