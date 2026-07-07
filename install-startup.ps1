$ErrorActionPreference = "Stop"

$projectDir = $PSScriptRoot
$startupDir = [Environment]::GetFolderPath("Startup")
$shortcutPath = Join-Path $startupDir "Study Flow.lnk"
$target = Join-Path $projectDir "start-study-flow.bat"

Set-Location $projectDir
.\gradlew.bat build

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $target
$shortcut.WorkingDirectory = $projectDir
$shortcut.WindowStyle = 7
$shortcut.Description = "Inicia o Study Flow local em http://localhost:8732"
$shortcut.Save()

Write-Host "Study Flow configurado para iniciar com o Windows."
Write-Host "Acesse: http://localhost:8732"
