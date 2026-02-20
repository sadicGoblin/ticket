@echo off
chcp 65001 >nul 2>nul
title Totem Casino - Launcher
color 0B

REM ──────────────────────────────────────────────
REM  Asegurar directorio de trabajo correcto
REM  (necesario si se ejecuta desde Inicio/Startup)
REM ──────────────────────────────────────────────
cd /d "%~dp0"

echo.
echo  ══════════════════════════════════════════════════
echo   TOTEM CASINO - Iniciando Servicios
echo   Carpeta: %~dp0
echo  ══════════════════════════════════════════════════
echo.

REM ──────────────────────────────────────────────
REM  Verificar prerequisitos minimos
REM ──────────────────────────────────────────────
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python no encontrado.
    echo         Instale Python desde https://www.python.org/
    echo         Marque "Add Python to PATH" durante la instalacion.
    pause
    exit /b 1
)

REM ──────────────────────────────────────────────
REM  Matar procesos previos si quedaron colgados
REM ──────────────────────────────────────────────
echo [INFO] Limpiando procesos previos...
taskkill /f /im "plugin_impresion.exe" >nul 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>nul
)
echo   [OK] Limpieza completada.

REM ──────────────────────────────────────────────
REM  Iniciar Plugin de Impresion (con auto-restart)
REM ──────────────────────────────────────────────
echo [INFO] Iniciando plugin de impresion (puerto 8000)...
start "Plugin Impresion" /min cmd /c "plugin_watchdog.bat"
timeout /t 2 /nobreak >nul

REM Verificar que el plugin inicio correctamente
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/status' -TimeoutSec 5 -UseBasicParsing; Write-Host '  [OK] Plugin de impresion activo' } catch { Write-Host '  [WARN] Plugin aun iniciando... se reintentara automaticamente' }"

REM ──────────────────────────────────────────────
REM  Iniciar Aplicacion (Electron .exe portable)
REM ──────────────────────────────────────────────
echo [INFO] Iniciando aplicacion...

REM Buscar el .exe portable en la misma carpeta
set "APP_EXE="
for %%f in ("Totem Casino*.exe") do (
    if not "%%f"=="" set "APP_EXE=%%f"
)

if defined APP_EXE (
    echo   Ejecutando: %APP_EXE%
    start "" "%APP_EXE%"
) else (
    echo   [ERROR] No se encontro el .exe de Totem Casino en esta carpeta.
    echo   Asegurese de que "Totem Casino X.X.X.exe" esta junto a este script.
    pause
    exit /b 1
)

echo.
echo  ══════════════════════════════════════════════════
echo   SERVICIOS INICIADOS
echo  ══════════════════════════════════════════════════
echo.
echo   Plugin impresion:  http://127.0.0.1:8000
echo   Aplicacion:        Electron (modo kiosco)
echo.
echo   El plugin de impresion se reinicia automaticamente
echo   si se cae. Para detener todo, cierre esta ventana.
echo  ══════════════════════════════════════════════════
echo.
pause
