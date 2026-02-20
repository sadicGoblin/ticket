@echo off
chcp 65001 >nul 2>nul
title Setup Totem - Instalacion Inicial
color 0A

echo.
echo  ══════════════════════════════════════════════════
echo   SETUP TOTEM - Instalacion Inicial
echo  ══════════════════════════════════════════════════
echo.

REM ──────────────────────────────────────────────
REM  1. Verificar Node.js
REM ──────────────────────────────────────────────
echo [1/5] Verificando Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo   [ERROR] Node.js no esta instalado.
    echo   Descargar desde: https://nodejs.org/
    echo   Instalar la version LTS y volver a ejecutar este script.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo   [OK] Node.js %NODE_VER%

REM ──────────────────────────────────────────────
REM  2. Verificar Python
REM ──────────────────────────────────────────────
echo [2/5] Verificando Python...
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo   [ERROR] Python no esta instalado.
    echo   Descargar desde: https://www.python.org/
    echo   IMPORTANTE: Marcar "Add Python to PATH" durante la instalacion.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('python --version') do set PY_VER=%%i
echo   [OK] %PY_VER%

REM ──────────────────────────────────────────────
REM  3. Instalar dependencias de Node.js
REM ──────────────────────────────────────────────
echo [3/5] Instalando dependencias de Node.js...
if not exist "node_modules\" (
    call npm install --production
    if %ERRORLEVEL% NEQ 0 (
        echo   [ERROR] Fallo la instalacion de dependencias npm.
        pause
        exit /b 1
    )
    echo   [OK] Dependencias npm instaladas.
) else (
    echo   [OK] node_modules ya existe, saltando...
)

REM ──────────────────────────────────────────────
REM  4. Instalar dependencias de Python
REM ──────────────────────────────────────────────
echo [4/5] Instalando dependencias de Python...
pip install -r requirements.txt >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo   [WARN] Algunas dependencias de Python no se pudieron instalar.
    echo   Intentando instalar individualmente...
    pip install flask flask-cors >nul 2>nul
    pip install pywin32 >nul 2>nul
)
echo   [OK] Dependencias Python instaladas.

REM ──────────────────────────────────────────────
REM  5. Build de la aplicacion Angular
REM ──────────────────────────────────────────────
echo [5/5] Compilando aplicacion Angular (produccion)...
call npx ng build --configuration=production --base-href=./
if %ERRORLEVEL% NEQ 0 (
    echo   [ERROR] Fallo la compilacion de Angular.
    pause
    exit /b 1
)
echo   [OK] Build de produccion completado.

echo.
echo  ══════════════════════════════════════════════════
echo   SETUP COMPLETADO EXITOSAMENTE
echo  ══════════════════════════════════════════════════
echo.
echo   Para iniciar el totem, ejecute:  iniciar_totem.bat
echo.
pause
