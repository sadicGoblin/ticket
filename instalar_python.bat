@echo off
chcp 65001 >nul 2>nul
title Instalar Python 3.11
color 0A

echo.
echo  ══════════════════════════════════════════════════
echo   Instalador Automatico de Python 3.11
echo  ══════════════════════════════════════════════════
echo.

REM ──────────────────────────────────────────────
REM  Verificar si Python ya esta instalado
REM ──────────────────────────────────────────────
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('python --version 2^>^&1') do set PY_VER=%%i
    echo   [INFO] Python ya esta instalado: %PY_VER%
    echo.
    choice /c SN /m "  Desea continuar con la reinstalacion? (S/N)"
    if errorlevel 2 goto :instalar_deps
)

REM ──────────────────────────────────────────────
REM  Descargar Python 3.11.9 (ultima 3.11 estable)
REM ──────────────────────────────────────────────
set "PYTHON_URL=https://www.python.org/ftp/python/3.11.9/python-3.11.9-amd64.exe"
set "INSTALLER=%TEMP%\python-3.11.9-amd64.exe"

echo   [1/3] Descargando Python 3.11.9...
echo         URL: %PYTHON_URL%
echo         Destino: %INSTALLER%
echo.

powershell -Command "& { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%PYTHON_URL%' -OutFile '%INSTALLER%' -UseBasicParsing }"

if not exist "%INSTALLER%" (
    echo   [ERROR] No se pudo descargar Python.
    echo   Descargue manualmente desde: https://www.python.org/downloads/release/python-3119/
    echo   IMPORTANTE: Marque "Add python.exe to PATH" durante la instalacion.
    pause
    exit /b 1
)

echo   [OK] Descarga completada.
echo.

REM ──────────────────────────────────────────────
REM  Instalar Python silenciosamente
REM  - InstallAllUsers=1  → para todos los usuarios
REM  - PrependPath=1      → agrega al PATH automaticamente
REM  - Include_pip=1      → incluye pip
REM  - Include_test=0     → no incluir tests (ahorra espacio)
REM ──────────────────────────────────────────────
echo   [2/3] Instalando Python 3.11.9 (esto puede tardar un minuto)...
echo         - Se agregara al PATH automaticamente
echo         - Se instalara para todos los usuarios
echo.

"%INSTALLER%" /quiet InstallAllUsers=1 PrependPath=1 Include_pip=1 Include_test=0 Include_doc=0

if %ERRORLEVEL% NEQ 0 (
    echo   [WARN] La instalacion silenciosa fallo (puede requerir permisos de admin).
    echo   Intentando instalacion interactiva...
    echo   IMPORTANTE: Marque "Add python.exe to PATH" en la primera pantalla.
    echo.
    "%INSTALLER%" PrependPath=1
)

REM ──────────────────────────────────────────────
REM  Refrescar PATH en esta sesion
REM ──────────────────────────────────────────────
set "PATH=%PATH%;C:\Program Files\Python311;C:\Program Files\Python311\Scripts"
set "PATH=%PATH%;%LOCALAPPDATA%\Programs\Python\Python311;%LOCALAPPDATA%\Programs\Python\Python311\Scripts"

REM Verificar
echo.
python --version >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('python --version 2^>^&1') do echo   [OK] %%i instalado correctamente.
) else (
    echo   [WARN] Python instalado pero PATH aun no se actualiza.
    echo   Cierre y abra esta ventana, o reinicie el PC.
    echo   Luego ejecute este script de nuevo para instalar dependencias.
    pause
    exit /b 0
)

:instalar_deps
REM ──────────────────────────────────────────────
REM  Instalar dependencias del plugin de impresion
REM ──────────────────────────────────────────────
echo.
echo   [3/3] Instalando dependencias del plugin de impresion...
echo.

pip install --upgrade pip >nul 2>nul
pip install flask flask-cors pywin32

if %ERRORLEVEL% EQU 0 (
    echo.
    echo   [OK] Dependencias instaladas correctamente.
) else (
    echo.
    echo   [WARN] Algunas dependencias pueden haber fallado.
    echo   Intente manualmente: pip install flask flask-cors pywin32
)

REM ──────────────────────────────────────────────
REM  Limpiar instalador
REM ──────────────────────────────────────────────
if exist "%INSTALLER%" del "%INSTALLER%" >nul 2>nul

echo.
echo  ══════════════════════════════════════════════════
echo   INSTALACION COMPLETADA
echo  ══════════════════════════════════════════════════
echo.
echo   Python 3.11 + dependencias listas.
echo   Ahora puede ejecutar: iniciar_totem.bat
echo.
pause
