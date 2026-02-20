@echo off
chcp 65001 >nul 2>nul
title Instalar Inicio Automatico
color 0A

cd /d "%~dp0"

echo.
echo  ══════════════════════════════════════════════════
echo   Crear acceso directo en Inicio de Windows
echo  ══════════════════════════════════════════════════
echo.

set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SCRIPT_PATH=%~dp0iniciar_totem.bat"
set "SHORTCUT=%STARTUP%\TotemCasino.lnk"

echo   Carpeta Startup: %STARTUP%
echo   Script objetivo:  %SCRIPT_PATH%
echo.

REM Crear acceso directo usando PowerShell
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT%'); $s.TargetPath = '%SCRIPT_PATH%'; $s.WorkingDirectory = '%~dp0'; $s.WindowStyle = 7; $s.Description = 'Totem Casino - Inicio Automatico'; $s.Save()"

if exist "%SHORTCUT%" (
    echo   [OK] Acceso directo creado exitosamente.
    echo.
    echo   El totem se iniciara automaticamente cada vez que
    echo   se encienda o reinicie el computador.
    echo.
    echo   Para DESACTIVAR el inicio automatico, ejecute:
    echo   desinstalar_inicio_automatico.bat
) else (
    echo   [ERROR] No se pudo crear el acceso directo.
    echo   Puede hacerlo manualmente:
    echo     1. Presione Win+R
    echo     2. Escriba: shell:startup
    echo     3. Copie un acceso directo de "iniciar_totem.bat" ahi
)

echo.
pause
