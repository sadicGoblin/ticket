@echo off
chcp 65001 >nul 2>nul
title Desinstalar Inicio Automatico
color 0C

echo.
echo  ══════════════════════════════════════════════════
echo   Remover inicio automatico del Totem
echo  ══════════════════════════════════════════════════
echo.

set "SHORTCUT=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\TotemCasino.lnk"

if exist "%SHORTCUT%" (
    del "%SHORTCUT%"
    echo   [OK] Acceso directo eliminado.
    echo   El totem ya NO se iniciara automaticamente.
) else (
    echo   [INFO] No se encontro acceso directo de inicio automatico.
)

echo.
pause
