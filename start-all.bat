@echo off
REM Script para iniciar ambos servidores (Angular y Plugin Python) en Windows

echo ================================================
echo   Iniciando Sistema de Casino
echo ================================================

REM Verificar si Node esta instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js no esta instalado
    echo Instalar desde: https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar si node_modules existe
if not exist "node_modules\" (
    echo Instalando dependencias de npm...
    call npm install
)

REM Iniciar Angular en una nueva ventana
echo Iniciando servidor Angular...
start "Angular Server" cmd /k "npm start"

REM Esperar 3 segundos
timeout /t 3 /nobreak >nul

REM Verificar si Python esta instalado
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Iniciando plugin de impresion...
    start "Plugin Python" cmd /k "python plugin_impresion.py"
) else (
    echo Advertencia: Python no esta instalado (opcional para impresion)
)

echo.
echo ================================================
echo   Servicios iniciados
echo ================================================
echo   Angular:  http://localhost:4200
echo   Plugin:   http://127.0.0.1:8000 (si Python instalado)
echo.
echo   Presiona cualquier tecla para cerrar esta ventana
echo   (Los servidores seguiran corriendo en sus ventanas)
echo ================================================
pause
