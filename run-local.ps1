$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
.\gradlew.bat build
java -jar build\libs\study-flow.jar
