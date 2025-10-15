from flask import Flask, request, jsonify
from datetime import datetime
import win32print
import win32api

app = Flask(__name__)

def enviar_a_impresora(nombre_impresora, datos):
    try:
        hPrinter = win32print.OpenPrinter(nombre_impresora)
        hJob = win32print.StartDocPrinter(hPrinter, 1, ("Trabajo de impresión", None, "RAW"))
        win32print.StartPagePrinter(hPrinter)
        win32print.WritePrinter(hPrinter, datos)
        win32print.EndPagePrinter(hPrinter)
        win32print.EndDocPrinter(hPrinter)
        win32print.ClosePrinter(hPrinter)
        return True
    except Exception as e:
        print(f"Error al imprimir: {e}")
        return False

def generar_ticket(pedido):
    ESC = b'\x1b'
    GS  = b'\x1d'
    NL  = b'\n'
    WIDTH = 50  # Ancho en caracteres para 80mm

    def centrar(texto):
        return texto.center(WIDTH)[:WIDTH]

    def izquierda(texto):
        return ("  " + texto).ljust(WIDTH)[:WIDTH]

    ticket = b""
    ticket += ESC + b'@'  # Inicializar impresora
    ticket += ESC + b'd\x01'

    # Encabezado
    ticket += centrar("RINNO && FAVRIC").encode("cp437") + NL
    ticket += centrar("RUT: 99.999.999-K").encode("cp437") + NL
    ticket += centrar("Av. IV Centenario 548, Santiago").encode("cp437") + NL
    ticket += ("-" * WIDTH).encode("cp437") + NL
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    ticket += centrar(f"Fecha: {now}").encode("cp437") + NL
    ticket += b'\x1b\x45\x01'  # ESC E 1
    numero_pedido = pedido.get("numeroPedido", "N/A")
    ticket += centrar(f"Pedido #{numero_pedido}").encode("cp437") + NL
    ticket += b'\x1b\x45\x00'
    ticket += ("-" * WIDTH).encode("cp437") + NL

    # Datos del Cliente
    ticket += NL
    ticket += b'\x1b\x45\x01'  # Negrita
    ticket += centrar("DATOS DEL CLIENTE").encode("cp437") + NL
    ticket += b'\x1b\x45\x00'  # Fin negrita
    ticket += ("-" * WIDTH).encode("cp437") + NL
    
    rut_cliente = pedido.get("rut", "No especificado")
    ticket += izquierda(f"RUT: {rut_cliente}").encode("cp437") + NL
    
    nombre_cliente = pedido.get("nombre", "No especificado")
    ticket += izquierda(f"Nombre: {nombre_cliente}").encode("cp437") + NL
    
    ticket += NL
    
    # Selección
    ticket += b'\x1b\x45\x01'  # Negrita
    ticket += centrar("SELECCION").encode("cp437") + NL
    ticket += b'\x1b\x45\x00'  # Fin negrita
    ticket += ("-" * WIDTH).encode("cp437") + NL
    
    seleccion = pedido.get("seleccion", "No especificado")
    if seleccion.lower() == "desayuno":
        ticket += izquierda("[ X ] Desayuno").encode("cp437") + NL
        ticket += izquierda("[   ] Almuerzo").encode("cp437") + NL
    elif seleccion.lower() == "almuerzo":
        ticket += izquierda("[   ] Desayuno").encode("cp437") + NL
        ticket += izquierda("[ X ] Almuerzo").encode("cp437") + NL
    else:
        ticket += izquierda(f"Seleccion: {seleccion}").encode("cp437") + NL
    
    ticket += NL
    
    # Para llevar
    para_llevar = pedido.get("paraLlevar", False)
    ticket += b'\x1b\x45\x01'  # Negrita
    if para_llevar:
        ticket += centrar("*** PARA LLEVAR ***").encode("cp437") + NL
    else:
        ticket += centrar("*** PARA CONSUMIR AQUI ***").encode("cp437") + NL
    ticket += b'\x1b\x45\x00'  # Fin negrita
    
    ticket += NL
    ticket += ("-" * WIDTH).encode("cp437") + NL * 2

    # Footer
    ticket += centrar("¡Gracias por su preferencia!").encode("cp437") + NL * 3

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
        
        nombre_impresora = data.get("nombreImpresora", win32print.GetDefaultPrinter())
        contenido = generar_ticket(data)
        exito = enviar_a_impresora(nombre_impresora, contenido)
        
        return jsonify({
            "resultado": "ok" if exito else "error",
            "mensaje": "Ticket impreso correctamente" if exito else "Error al imprimir ticket"
        })
    except Exception as e:
        return jsonify({"resultado": "error", "mensaje": str(e)}), 500

@app.route("/status", methods=["GET"])
def status():
    """Endpoint para verificar el estado del servicio de impresión"""
    try:
        # Verificar que podemos acceder a las impresoras
        impresora_default = win32print.GetDefaultPrinter()
        return jsonify({
            "estado": "ok",
            "mensaje": "Servicio de impresión activo",
            "impresora_default": impresora_default
        })
    except Exception as e:
        return jsonify({
            "estado": "error",
            "mensaje": f"Error en el servicio: {str(e)}"
        }), 500

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8000, debug=True)
