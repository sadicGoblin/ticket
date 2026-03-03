import sys
import os
import logging
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)

print("")
print("=" * 50)
print("  PLUGIN DE IMPRESION - Iniciando...")
print("=" * 50)
print("")

# Verificar dependencias antes de importar
try:
    from flask import Flask, request, jsonify
    print("  [OK] Flask encontrado")
except ImportError:
    print("  [ERROR] Flask no esta instalado.")
    print("  Ejecute: pip install flask flask-cors")
    print("")
    input("  Presione Enter para cerrar...")
    sys.exit(1)

try:
    from flask_cors import CORS
    print("  [OK] Flask-CORS encontrado")
except ImportError:
    print("  [ERROR] flask-cors no esta instalado.")
    print("  Ejecute: pip install flask-cors")
    print("")
    input("  Presione Enter para cerrar...")
    sys.exit(1)

try:
    import qrcode
    from PIL import Image
    HAS_QR = True
    print("  [OK] qrcode + Pillow encontrado")
except ImportError:
    HAS_QR = False
    print("  [WARN] qrcode/Pillow no encontrado - QR no se imprimira")
    print("         Para QR: pip install qrcode[pil]")

try:
    import win32print
    import win32api
    WINDOWS = True
    print("  [OK] pywin32 encontrado (modo Windows)")
except ImportError:
    WINDOWS = False
    print("  [WARN] pywin32 no encontrado - modo simulacion")
    print("         Para imprimir real: pip install pywin32")

print("")

app = Flask(__name__)
CORS(app)  # Habilitar CORS para todas las rutas

def enviar_a_impresora(nombre_impresora, datos):
    if not WINDOWS:
        logging.warning("Simulacion: %d bytes enviados a impresora", len(datos))
        return True
    try:
        hPrinter = win32print.OpenPrinter(nombre_impresora)
        hJob = win32print.StartDocPrinter(hPrinter, 1, ("Trabajo de impresion", None, "RAW"))
        win32print.StartPagePrinter(hPrinter)
        win32print.WritePrinter(hPrinter, datos)
        win32print.EndPagePrinter(hPrinter)
        win32print.EndDocPrinter(hPrinter)
        win32print.ClosePrinter(hPrinter)
        return True
    except Exception as e:
        logging.error("Error al imprimir: %s", e)
        return False


def generar_qr_bitmap(data_str, pixel_size=8):
    """Genera un QR code como imagen bitmap y lo convierte a comandos
    ESC/POS raster (GS v 0) compatibles con todas las impresoras termicas.
    pixel_size: tamano de cada modulo QR en pixeles (default 8)
    """
    if not HAS_QR:
        logging.warning("qrcode no disponible, no se puede generar QR")
        return b''

    try:
        # Generar QR como imagen PIL
        qr = qrcode.QRCode(
            version=None,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=pixel_size,
            border=2,
        )
        qr.add_data(data_str)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white").convert('1')

        # Redimensionar si es muy grande (max 384px para 80mm)
        max_width = 384
        if img.width > max_width:
            ratio = max_width / img.width
            new_h = int(img.height * ratio)
            img = img.resize((max_width, new_h), Image.NEAREST)

        # Asegurar que el ancho sea multiplo de 8
        w = img.width
        if w % 8 != 0:
            new_w = w + (8 - w % 8)
            new_img = Image.new('1', (new_w, img.height), 1)  # blanco
            new_img.paste(img, (0, 0))
            img = new_img

        width_bytes = img.width // 8
        height = img.height
        pixels = img.load()

        # Construir datos raster
        raster_data = b''
        for y in range(height):
            row = b''
            for x_byte in range(width_bytes):
                byte_val = 0
                for bit in range(8):
                    x = x_byte * 8 + bit
                    if x < img.width and pixels[x, y] == 0:  # negro
                        byte_val |= (0x80 >> bit)
                row += bytes([byte_val])
            raster_data += row

        # GS v 0 - Print raster bit image
        # m=0 (normal), xL xH = width_bytes, yL yH = height
        xL = width_bytes & 0xFF
        xH = (width_bytes >> 8) & 0xFF
        yL = height & 0xFF
        yH = (height >> 8) & 0xFF

        cmd = b'\x1d\x76\x30\x00'  # GS v 0 m
        cmd += bytes([xL, xH, yL, yH])
        cmd += raster_data

        logging.info("QR bitmap generado: %dx%d px, %d bytes", img.width, height, len(cmd))
        return cmd

    except Exception as e:
        logging.error("Error generando QR bitmap: %s", e)
        return b''

def generar_ticket(pedido):
    ESC = b'\x1b'
    GS  = b'\x1d'
    NL  = b'\n'
    WIDTH = 48  # Ancho en caracteres para 80mm (estandar)

    def centrar(texto):
        return texto.center(WIDTH)[:WIDTH]

    def separador():
        return ("-" * WIDTH).encode("cp437") + NL

    ticket = b""
    ticket += ESC + b'@'  # Inicializar impresora
    ticket += b'\x1b\x61\x01'  # Centrar TODO el ticket
    ticket += ESC + b'd\x01'

    # Encabezado (nombre del cliente/marca)
    brand_name = pedido.get("brandName", "Casino")
    ticket += b'\x1b\x45\x01'  # Negrita
    ticket += b'\x1d\x21\x11'  # Doble alto y ancho
    ticket += brand_name.upper().encode("cp437") + NL
    ticket += b'\x1d\x21\x00'  # Tamano normal
    ticket += b'\x1b\x45\x00'  # Fin negrita
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    ticket += centrar(f"Fecha: {now}").encode("cp437") + NL

    # Evento y nombre de persona
    evento_nombre = pedido.get("eventoNombre", "")
    if evento_nombre:
        # Normalizar caracteres especiales para cp437
        evento_limpio = evento_nombre.replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u")
        evento_limpio = evento_limpio.replace("Á", "A").replace("É", "E").replace("Í", "I").replace("Ó", "O").replace("Ú", "U")
        evento_limpio = evento_limpio.replace("ñ", "n").replace("Ñ", "N")
        ticket += centrar(evento_limpio).encode("cp437", errors="replace") + NL
    nombre_cliente = pedido.get("nombreCliente", "")
    if nombre_cliente:
        # Normalizar caracteres especiales para cp437
        nombre_limpio = nombre_cliente.replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u")
        nombre_limpio = nombre_limpio.replace("Á", "A").replace("É", "E").replace("Í", "I").replace("Ó", "O").replace("Ú", "U")
        nombre_limpio = nombre_limpio.replace("ñ", "n").replace("Ñ", "N")
        ticket += centrar(nombre_limpio).encode("cp437", errors="replace") + NL

    ticket += NL

    # QR Code (si hay ticketNumber)
    ticket_number = pedido.get("ticketNumber", "")
    if ticket_number:
        qr_data = generar_qr_bitmap(ticket_number, pixel_size=10)
        if qr_data:
            ticket += qr_data
            ticket += NL
        ticket += NL
        ticket += centrar(f"Ticket: {ticket_number}").encode("cp437") + NL

    ticket += NL

    # Avanzar papel y cortar
    ticket += ESC + b'd\x01'
    ticket += GS + b'V\x00'

    return ticket

@app.route("/imprimir", methods=["POST"])
def imprimir():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"resultado": "error", "mensaje": "No se recibieron datos"}), 400
        
        if WINDOWS:
            nombre_impresora = data.get("nombreImpresora", win32print.GetDefaultPrinter())
        else:
            nombre_impresora = data.get("nombreImpresora", "SimulatedPrinter")
        contenido = generar_ticket(data)
        logging.info("Ticket generado: %d bytes, impresora: %s", len(contenido), nombre_impresora)
        logging.info("Datos recibidos - RUT: %s, Nombre: %s, Pedido: %s, TicketNumber: %s, Evento: %s, Brand: %s",
                     data.get('rut', 'N/A'), data.get('nombreCliente', 'N/A'),
                     data.get('numeroPedido', 'N/A'), data.get('ticketNumber', 'N/A'),
                     data.get('eventoNombre', 'N/A'), data.get('brandName', 'N/A'))
        exito = enviar_a_impresora(nombre_impresora, contenido)
        
        return jsonify({
            "resultado": "ok" if exito else "error",
            "mensaje": "Ticket impreso correctamente" if exito else "Error al imprimir ticket"
        })
    except Exception as e:
        return jsonify({"resultado": "error", "mensaje": str(e)}), 500

@app.route("/imprimir-casino", methods=["POST"])
def imprimir_casino():
    """Endpoint alternativo para impresión de tickets de casino"""
    return imprimir()

@app.route("/status", methods=["GET"])
def status():
    """Endpoint para verificar el estado del servicio de impresion"""
    try:
        if WINDOWS:
            impresora_default = win32print.GetDefaultPrinter()
        else:
            impresora_default = "SimulatedPrinter (no Windows)"
        return jsonify({
            "estado": "ok",
            "mensaje": "Servicio de impresion activo",
            "impresora_default": impresora_default
        })
    except Exception as e:
        return jsonify({
            "estado": "error",
            "mensaje": f"Error en el servicio: {str(e)}"
        }), 500

if __name__ == "__main__":
    try:
        print("  Servidor: http://127.0.0.1:8000")
        print("  Endpoints: /status, /imprimir, /imprimir-casino")
        if WINDOWS:
            try:
                print(f"  Impresora default: {win32print.GetDefaultPrinter()}")
            except Exception:
                print("  [WARN] No se detecto impresora por defecto")
        else:
            print("  Modo: SIMULACION (no Windows / sin pywin32)")
        print("")
        print("  Servidor corriendo... (Ctrl+C para detener)")
        print("=" * 50)
        print("")
        app.run(host="127.0.0.1", port=8000, debug=False)
    except Exception as e:
        print("")
        print(f"  [ERROR FATAL] {e}")
        print("")
        input("  Presione Enter para cerrar...")
