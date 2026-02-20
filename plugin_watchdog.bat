@echo off
chcp 65001 >nul 2>nul
title Plugin Impresion - Watchdog
color 0E

REM ══════════════════════════════════════════════════
REM  Watchdog: reinicia el plugin de impresion si se cae
REM ══════════════════════════════════════════════════

set RESTART_DELAY=5
set MAX_RESTARTS=100
set RESTART_COUNT=0

:loop
set /a RESTART_COUNT+=1

if %RESTART_COUNT% GTR %MAX_RESTARTS% (
    echo [ERROR] Se alcanzo el limite de %MAX_RESTARTS% reinicios.
    echo         Revise la configuracion del plugin.
    pause
    exit /b 1
)

echo.
echo [%date% %time%] Iniciando plugin de impresion (intento %RESTART_COUNT%)...
echo.

python plugin_impresion.py

echo.
echo [%date% %time%] Plugin de impresion se detuvo (codigo: %ERRORLEVEL%).
echo [INFO] Reiniciando en %RESTART_DELAY% segundos...
echo        Presione Ctrl+C para detener el watchdog.
echo.
timeout /t %RESTART_DELAY% /nobreak >nul

goto loop
