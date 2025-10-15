# Plugin de Impresión - Instrucciones

## Instalación en Windows

1. **Instalar dependencias de Python:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Ejecutar el plugin:**
   ```bash
   python plugin_impresion.py
   ```

   El servidor quedará corriendo en: `http://127.0.0.1:8000`

## Características

- ✅ **CORS habilitado**: Permite peticiones desde Angular en desarrollo
- ✅ **Imprime datos del cliente**: RUT, nombre, selección de comida (desayuno/almuerzo/cena) y tipo de servicio (para llevar/para servir)
- ✅ **Compatible con impresoras térmicas**: Usa comandos ESC/POS estándar

## Endpoints

### GET /status
Verifica si el servicio está activo y la impresora conectada.

**Respuesta:**
```json
{
  "estado": "ok",
  "mensaje": "Servicio de impresión activo",
  "impresora_default": "Nombre de la impresora"
}
```

### POST /imprimir
Imprime un ticket con los datos del cliente.

**Cuerpo de la petición:**
```json
{
  "numeroPedido": "CASINO-1234567890",
  "rut": "12.345.678-9",
  "nombreCliente": "Juan Pérez",
  "productos": [
    {
      "nombre": "Ticket de Almuerzo (Para Llevar)",
      "cantidad": 1,
      "precio": 0
    }
  ]
}
```

**Respuesta exitosa:**
```json
{
  "resultado": "ok",
  "mensaje": "Ticket impreso correctamente"
}
```

## Solución de Problemas

### Error: "No module named 'flask_cors'"
Instalar la dependencia:
```bash
pip install flask-cors
```

### Error: "No se pudo conectar con la impresora"
1. Verificar que el plugin esté corriendo (debe aparecer "Running on http://127.0.0.1:8000")
2. Verificar que la impresora esté conectada y configurada en Windows
3. Verificar que el navegador pueda acceder a localhost:8000

### La impresora no corta el papel
Verificar que la impresora soporte el comando de corte automático (GS V).
