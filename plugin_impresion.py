#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Plugin de Impresión para Sistema de Casino
Servidor Flask que recibe peticiones HTTP y envía datos a impresoras térmicas
Puerto: 8000
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import platform
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Permitir peticiones desde Angular

# Configuración de impresora
IMPRESORA_POR_DEFECTO = None  # None = impresora por defecto del sistema

# Importar librerías de impresión según el sistema operativo
try:
    if platform.system() == "Windows":
        import win32print
        import win32ui
        from PIL import Image, ImageDraw, ImageFont
        SISTEMA = "Windows"
    else:
        # Para Linux/Mac, usar escpos-python
        from escpos.printer import Usb, Network, File
        SISTEMA = "Linux/Mac"
    logger.info(f"✅ Sistema operativo detectado: {SISTEMA}")
except ImportError as e:
    logger.warning(f"⚠️ No se pudieron cargar librerías de impresión: {e}")
    logger.warning("💡 Instalación necesaria:")
    logger.warning("   Windows: pip install pywin32 pillow")
    logger.warning("   Linux/Mac: pip install python-escpos")
    SISTEMA = "Sin impresora"


def obtener_impresoras_disponibles():
    """Obtiene la lista de impresoras disponibles en el sistema"""
    impresoras = []
    try:
        if platform.system() == "Windows":
            impresoras = [printer[2] for printer in win32print.EnumPrinters(2)]
        else:
            # En Linux/Mac, esto requiere configuración manual
            impresoras = ["Impresora USB", "Impresora Red"]
    except Exception as e:
        logger.error(f"❌ Error al obtener impresoras: {e}")
    return impresoras


def imprimir_ticket_windows(datos):
    """Imprime un ticket en Windows usando win32print"""
    try:
        nombre_impresora = datos.get('nombreImpresora', IMPRESORA_POR_DEFECTO)
        if not nombre_impresora:
            nombre_impresora = win32print.GetDefaultPrinter()
        
        logger.info(f"🖨️ Imprimiendo en: {nombre_impresora}")
        
        # Crear contexto de impresión
        hDC = win32ui.CreateDC()
        hDC.CreatePrinterDC(nombre_impresora)
        hDC.StartDoc("Ticket Casino")
        hDC.StartPage()
        
        # Configuración de fuente
        fuente_titulo = win32ui.CreateFont({
            "name": "Courier New",
            "height": 40,
            "weight": 700
        })
        fuente_normal = win32ui.CreateFont({
            "name": "Courier New",
            "height": 30,
            "weight": 400
        })
        
        y = 100  # Posición vertical inicial
        
        # Título
        hDC.SelectObject(fuente_titulo)
        hDC.TextOut(100, y, "TICKET DE CASINO")
        y += 80
        
        # Línea separadora
        hDC.TextOut(100, y, "=" * 32)
        y += 60
        
        # Cambiar a fuente normal
        hDC.SelectObject(fuente_normal)
        
        # Fecha y hora
        fecha_hora = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
        hDC.TextOut(100, y, f"Fecha: {fecha_hora}")
        y += 50
        
        # Número de pedido
        if 'numeroPedido' in datos:
            hDC.TextOut(100, y, f"Ticket #: {datos['numeroPedido']}")
            y += 50
        
        # RUT y nombre del empleado
        if 'rut' in datos:
            hDC.TextOut(100, y, f"RUT: {datos['rut']}")
            y += 50
        
        if 'nombreCliente' in datos:
            hDC.TextOut(100, y, f"Nombre: {datos['nombreCliente']}")
            y += 50
        
        # Línea separadora
        y += 20
        hDC.TextOut(100, y, "-" * 32)
        y += 60
        
        # Productos
        for producto in datos['productos']:
            nombre = producto['nombre']
            cantidad = producto['cantidad']
            precio = producto.get('precio', 0)
            
            # Nombre del producto
            hDC.TextOut(100, y, nombre)
            y += 50
            
            # Cantidad y precio (solo si precio > 0)
            if precio > 0:
                linea = f"  {cantidad}x ${precio:,.0f}"
                hDC.TextOut(100, y, linea)
                y += 50
        
        # Línea separadora
        y += 20
        hDC.TextOut(100, y, "=" * 32)
        y += 60
        
        # Total (si existe)
        if 'total' in datos and datos['total'] > 0:
            hDC.SelectObject(fuente_titulo)
            hDC.TextOut(100, y, f"TOTAL: ${datos['total']:,.0f}")
            y += 80
        
        # Mensaje final
        hDC.SelectObject(fuente_normal)
        hDC.TextOut(100, y, "¡Buen provecho!")
        y += 100
        
        # Finalizar impresión
        hDC.EndPage()
        hDC.EndDoc()
        hDC.DeleteDC()
        
        logger.info("✅ Ticket impreso exitosamente")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error al imprimir en Windows: {e}")
        return False


def imprimir_ticket_escpos(datos):
    """Imprime un ticket usando python-escpos (Linux/Mac)"""
    try:
        # Configurar impresora (ajustar según tu configuración)
        # Opción 1: USB (buscar vendor_id y product_id con lsusb)
        # p = Usb(0x04b8, 0x0e15)  # Ejemplo para Epson
        
        # Opción 2: Archivo (para pruebas)
        p = File("/dev/usb/lp0")  # Ajustar ruta según tu sistema
        
        # Título
        p.set(align='center', text_type='B', width=2, height=2)
        p.text("TICKET DE CASINO\n")
        p.text("\n")
        
        # Restaurar tamaño normal
        p.set(align='center', text_type='normal', width=1, height=1)
        p.text("================================\n")
        
        # Fecha y hora
        fecha_hora = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
        p.set(align='left')
        p.text(f"Fecha: {fecha_hora}\n")
        
        # Número de pedido
        if 'numeroPedido' in datos:
            p.text(f"Ticket #: {datos['numeroPedido']}\n")
        
        # RUT y nombre
        if 'rut' in datos:
            p.text(f"RUT: {datos['rut']}\n")
        if 'nombreCliente' in datos:
            p.text(f"Nombre: {datos['nombreCliente']}\n")
        
        p.text("--------------------------------\n")
        
        # Productos
        for producto in datos['productos']:
            nombre = producto['nombre']
            cantidad = producto['cantidad']
            precio = producto.get('precio', 0)
            
            p.text(f"{nombre}\n")
            if precio > 0:
                p.text(f"  {cantidad}x ${precio:,.0f}\n")
        
        p.text("================================\n")
        
        # Total
        if 'total' in datos and datos['total'] > 0:
            p.set(align='center', text_type='B', width=2, height=2)
            p.text(f"TOTAL: ${datos['total']:,.0f}\n")
        
        # Mensaje final
        p.set(align='center', text_type='normal', width=1, height=1)
        p.text("\n¡Buen provecho!\n\n\n")
        
        # Cortar papel
        p.cut()
        
        logger.info("✅ Ticket impreso exitosamente")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error al imprimir con escpos: {e}")
        return False


@app.route('/status', methods=['GET'])
def status():
    """Endpoint para verificar si el servicio está activo"""
    impresoras = obtener_impresoras_disponibles()
    return jsonify({
        'status': 'online',
        'sistema': SISTEMA,
        'impresoras_disponibles': impresoras,
        'timestamp': datetime.now().isoformat()
    })


@app.route('/imprimir', methods=['POST'])
def imprimir():
    """Endpoint principal para imprimir tickets"""
    try:
        datos = request.get_json()
        
        if not datos or 'productos' not in datos:
            return jsonify({
                'resultado': 'error',
                'mensaje': 'Datos inválidos. Se requiere campo "productos"'
            }), 400
        
        logger.info(f"📥 Recibida petición de impresión: {datos.get('numeroPedido', 'Sin número')}")
        
        # Calcular total si no viene
        if 'total' not in datos:
            total = sum(p['cantidad'] * p.get('precio', 0) for p in datos['productos'])
            datos['total'] = total
        
        # Imprimir según el sistema operativo
        exito = False
        if platform.system() == "Windows" and SISTEMA == "Windows":
            exito = imprimir_ticket_windows(datos)
        elif SISTEMA == "Linux/Mac":
            exito = imprimir_ticket_escpos(datos)
        else:
            # Modo simulación (sin impresora física)
            logger.info("🔶 MODO SIMULACIÓN - Ticket procesado:")
            logger.info(f"   Productos: {len(datos['productos'])}")
            logger.info(f"   Total: ${datos.get('total', 0):,.0f}")
            if 'nombreCliente' in datos:
                logger.info(f"   Cliente: {datos['nombreCliente']}")
            exito = True  # Simular éxito
        
        if exito:
            return jsonify({
                'resultado': 'ok',
                'mensaje': 'Ticket impreso correctamente'
            })
        else:
            return jsonify({
                'resultado': 'error',
                'mensaje': 'Error al imprimir el ticket'
            }), 500
            
    except Exception as e:
        logger.error(f"❌ Error en endpoint /imprimir: {e}")
        return jsonify({
            'resultado': 'error',
            'mensaje': str(e)
        }), 500


@app.route('/imprimir-casino', methods=['POST'])
def imprimir_casino():
    """Endpoint específico para tickets de casino"""
    try:
        datos = request.get_json()
        
        # Validar datos requeridos
        if not datos or 'rut' not in datos or 'nombreCliente' not in datos:
            return jsonify({
                'resultado': 'error',
                'mensaje': 'Datos inválidos. Se requiere RUT y nombre del cliente'
            }), 400
        
        logger.info(f"🍽️ Imprimiendo ticket de casino para: {datos['nombreCliente']}")
        
        # Usar el endpoint general de impresión
        return imprimir()
        
    except Exception as e:
        logger.error(f"❌ Error en endpoint /imprimir-casino: {e}")
        return jsonify({
            'resultado': 'error',
            'mensaje': str(e)
        }), 500


@app.route('/test', methods=['GET'])
def test():
    """Endpoint de prueba para verificar que el servidor funciona"""
    return jsonify({
        'mensaje': '¡Plugin de impresión funcionando!',
        'sistema': SISTEMA,
        'puerto': 8000
    })


if __name__ == '__main__':
    logger.info("=" * 50)
    logger.info("🖨️  PLUGIN DE IMPRESIÓN PARA SISTEMA DE CASINO")
    logger.info("=" * 50)
    logger.info(f"Sistema: {SISTEMA}")
    logger.info("Puerto: 8000")
    logger.info("Endpoints disponibles:")
    logger.info("  - GET  /status           (Estado del servicio)")
    logger.info("  - GET  /test             (Prueba rápida)")
    logger.info("  - POST /imprimir         (Imprimir ticket general)")
    logger.info("  - POST /imprimir-casino  (Imprimir ticket de casino)")
    logger.info("=" * 50)
    
    # Iniciar servidor
    app.run(host='127.0.0.1', port=8000, debug=False)
