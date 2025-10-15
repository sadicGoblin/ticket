#!/bin/bash

# Script para iniciar ambos servidores (Angular y Plugin Python)

echo "================================================"
echo "🚀 Iniciando Sistema de Casino"
echo "================================================"

# Verificar si Node está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    echo "💡 Instalar desde: https://nodejs.org/"
    exit 1
fi

# Verificar si Python está instalado
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "⚠️ Python no está instalado (opcional para impresión)"
    echo "💡 Instalar desde: https://www.python.org/"
    PYTHON_AVAILABLE=false
else
    PYTHON_AVAILABLE=true
fi

# Verificar si node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias de npm..."
    npm install
fi

# Iniciar Angular en background
echo "🌐 Iniciando servidor Angular..."
npm start &
ANGULAR_PID=$!

# Esperar un poco antes de iniciar Python
sleep 2

# Iniciar Plugin Python si está disponible
if [ "$PYTHON_AVAILABLE" = true ]; then
    echo "🖨️  Iniciando plugin de impresión..."
    
    # Intentar con python3 primero, luego python
    if command -v python3 &> /dev/null; then
        python3 plugin_impresion.py &
        PYTHON_PID=$!
    else
        python plugin_impresion.py &
        PYTHON_PID=$!
    fi
else
    echo "⚠️ Plugin de impresión no iniciado (Python no disponible)"
fi

echo ""
echo "================================================"
echo "✅ Servicios iniciados"
echo "================================================"
echo "🌐 Angular:  http://localhost:4200"
if [ "$PYTHON_AVAILABLE" = true ]; then
    echo "🖨️  Plugin:   http://127.0.0.1:8000"
fi
echo ""
echo "💡 Presiona Ctrl+C para detener todos los servicios"
echo "================================================"

# Función para limpiar procesos al salir
cleanup() {
    echo ""
    echo "🛑 Deteniendo servicios..."
    
    if [ ! -z "$ANGULAR_PID" ]; then
        kill $ANGULAR_PID 2>/dev/null
    fi
    
    if [ ! -z "$PYTHON_PID" ]; then
        kill $PYTHON_PID 2>/dev/null
    fi
    
    echo "✅ Servicios detenidos"
    exit 0
}

# Capturar señal de interrupción (Ctrl+C)
trap cleanup INT

# Esperar indefinidamente
wait
