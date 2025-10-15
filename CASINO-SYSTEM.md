# 🍽️ Sistema de Casino - Verificación de Tickets

Sistema completo de verificación de RUT e impresión de tickets de casino para comedores empresariales.

## 📋 Características Implementadas

### Frontend (Angular)
- ✅ **Verificación de RUT** - Validación con dígito verificador
- ✅ **Formateo automático** - RUT se formatea mientras se escribe
- ✅ **Consulta de empleados** - Verifica disponibilidad de ticket
- ✅ **Impresión automática** - Imprime ticket al verificar
- ✅ **Estado de impresora** - Muestra conexión en tiempo real
- ✅ **RUTs de prueba** - Base de datos simulada para desarrollo

### Backend (Python Flask)
- ✅ **Servidor de impresión** - Puerto 8000
- ✅ **Compatible Windows/Linux/Mac** - Detecta SO automáticamente
- ✅ **Múltiples endpoints** - /imprimir, /imprimir-casino, /status
- ✅ **CORS habilitado** - Peticiones desde Angular
- ✅ **Modo simulación** - Funciona sin impresora física

## 🚀 Instalación y Configuración

### 1. Frontend (Angular)

```bash
cd angular-base-project
npm install
npm start
```

La aplicación estará disponible en: **http://localhost:4200**

### 2. Backend (Plugin Python)

#### En Windows:
```bash
cd angular-base-project
pip install -r requirements.txt
python plugin_impresion.py
```

#### En Linux/Mac:
```bash
cd angular-base-project
pip3 install flask flask-cors python-escpos
python3 plugin_impresion.py
```

El servidor estará disponible en: **http://127.0.0.1:8000**

## 📡 Endpoints de la API

### GET /status
Verifica el estado del servicio de impresión

**Respuesta:**
```json
{
  "status": "online",
  "sistema": "Windows",
  "impresoras_disponibles": ["Impresora1", "Impresora2"],
  "timestamp": "2025-10-09T21:00:00"
}
```

### POST /imprimir
Imprime un ticket general

**Request:**
```json
{
  "productos": [
    {
      "nombre": "Ticket de Almuerzo",
      "cantidad": 1,
      "precio": 0
    }
  ],
  "numeroPedido": "CASINO-123456",
  "rut": "12345678-9",
  "nombreCliente": "Juan Pérez García"
}
```

**Response:**
```json
{
  "resultado": "ok",
  "mensaje": "Ticket impreso correctamente"
}
```

### POST /imprimir-casino
Imprime un ticket de casino específico (alias de /imprimir con validación)

**Request:** Igual que /imprimir pero requiere `rut` y `nombreCliente`

## 🧪 RUTs de Prueba

El sistema incluye una base de datos simulada para desarrollo:

| RUT | Nombre | Tipo Comida | Ticket Disponible |
|-----|--------|-------------|-------------------|
| 12345678-9 | Juan Pérez García | Almuerzo | ✅ Sí |
| 98765432-1 | María González López | Cena | ✅ Sí |
| 11111111-1 | Pedro Rodríguez | Colación | ✅ Sí |
| 22222222-2 | Ana Martínez | Almuerzo | ❌ No |

## 🔧 Configuración de Impresora

### Windows
El plugin usa la impresora por defecto del sistema. Para cambiar:

1. Abrir `plugin_impresion.py`
2. Modificar `IMPRESORA_POR_DEFECTO`:
```python
IMPRESORA_POR_DEFECTO = "Nombre de tu impresora"
```

### Linux/Mac
Configurar en la función `imprimir_ticket_escpos()`:

#### Opción 1: USB
```python
p = Usb(0x04b8, 0x0e15)  # Ajustar vendor_id y product_id
# Encontrar IDs con: lsusb
```

#### Opción 2: Red
```python
p = Network("192.168.1.100")  # IP de la impresora
```

#### Opción 3: Archivo (desarrollo)
```python
p = File("/dev/usb/lp0")  # Ruta del dispositivo
```

## 🎨 Servicios Angular

### CasinoService
```typescript
// Verificar ticket disponible
verificarTicketCasino(rut: string): Observable<RespuestaVerificacion>

// Marcar ticket como utilizado
marcarTicketUtilizado(rut: string): Observable<any>

// Validar formato de RUT
validarRut(rut: string): boolean

// Formatear RUT (12.345.678-9)
formatearRut(rut: string): string
```

### PrinterService
```typescript
// Imprimir ticket general
imprimirTicket(
  productos: ProductoTicket[], 
  nombreImpresora?: string,
  numeroPedido?: string,
  rut?: string,
  nombreCliente?: string
): Observable<RespuestaImpresion>

// Verificar conexión con impresora
verificarConexion(): Observable<any>

// Imprimir ticket de casino
imprimirTicketCasino(
  rut: string,
  nombreCliente: string,
  tipoComida: string
): Observable<RespuestaImpresion>
```

## 📝 Flujo de Usuario

1. **Usuario ingresa RUT** → Sistema valida formato
2. **Sistema consulta base de datos** → Verifica ticket disponible
3. **Si tiene ticket** → Muestra información del empleado
4. **Sistema imprime ticket automáticamente** → Envía a impresora
5. **Usuario retira ticket** → Sistema resetea en 5 segundos
6. **Sistema marca ticket como utilizado** → Evita duplicados

## 🔐 Integración con API Real

Para usar en producción, modificar `CasinoService`:

```typescript
// En casino.service.ts, línea ~52
verificarTicketCasino(rut: string): Observable<RespuestaVerificacion> {
  const rutLimpio = this.limpiarRut(rut);
  
  // Descomentar para usar API real:
  return this.http.post<RespuestaVerificacion>(
    `${this.API_URL}/casino/verificar`, 
    { rut: rutLimpio }
  );
}
```

### Endpoint esperado de la API:
```
POST /api/casino/verificar
{
  "rut": "123456789"
}

Response:
{
  "success": true,
  "empleado": {
    "rut": "12345678-9",
    "nombre": "Juan Pérez García",
    "tieneTicket": true,
    "tipoComida": "Almuerzo",
    "turno": "Mañana",
    "area": "Producción"
  },
  "mensaje": "Ticket disponible para Almuerzo"
}
```

## 🖨️ Formato del Ticket Impreso

```
    TICKET DE CASINO
================================
Fecha: 09/10/2025 21:00:00
Ticket #: CASINO-1728511200000
RUT: 12.345.678-9
Nombre: Juan Pérez García
--------------------------------
Ticket de Almuerzo
  1x $0
================================

      ¡Buen provecho!


```

## 🐛 Troubleshooting

### La impresora no responde
1. Verificar que el plugin Python esté ejecutándose
2. Comprobar endpoint: http://127.0.0.1:8000/status
3. Revisar logs del servidor Python
4. Verificar permisos de impresora

### Error de CORS
- El plugin ya tiene CORS habilitado
- Verificar que ambos servicios estén corriendo
- Angular: localhost:4200
- Python: 127.0.0.1:8000

### RUT no se valida
- Verificar que el dígito verificador sea correcto
- El formato puede ser 12345678-9 o 123456789
- El servicio limpia puntos y guiones automáticamente

## 📚 Tecnologías Utilizadas

- **Angular 17.3** - Framework frontend
- **Flask 3.0** - Servidor Python
- **python-escpos** - Control de impresoras térmicas (Linux/Mac)
- **win32print** - Control de impresoras (Windows)
- **RxJS** - Programación reactiva
- **TypeScript** - Tipado fuerte

## 🎯 Próximos Pasos

1. **Conectar con API real** - Reemplazar base de datos simulada
2. **Agregar autenticación** - Sistema de login para operadores
3. **Dashboard administrativo** - Ver estadísticas de uso
4. **Reportes** - Exportar datos de consumo
5. **Múltiples turnos** - Control de horarios de comida
6. **Notificaciones** - Alertas por correo/SMS

---

**Desarrollado para sistema de casino empresarial** 🍽️
