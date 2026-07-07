@echo off
setlocal
cd /d "%~dp0"

if not exist "build\libs\study-flow.jar" (
    call gradlew.bat build
    if errorlevel 1 exit /b %errorlevel%
)

java -jar build\libs\study-flow.jar
