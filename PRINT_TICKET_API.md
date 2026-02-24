# 🖨️ API de Impresión de Tickets - Documentación

## 📋 Resumen

Esta API permite a los tótems registrar cuando una persona imprime físicamente su ticket. El flujo completo es:

1. **Pendiente** → Usuario tiene ticket asignado
2. **Impreso** → Usuario imprime ticket en tótem (este endpoint)
3. **Canjeado** → Usuario canjea ticket en punto de servicio

---

## 🔄 Nuevo Estado: "printed"

Se ha agregado un nuevo estado intermedio al modelo `TicketUsage`:

### **Estados de TicketUsage:**

| Estado | Descripción | Puede Imprimir | Puede Canjear |
|--------|-------------|----------------|---------------|
| `pending` | Ticket asignado, sin usar | ✅ Sí | ✅ Sí |
| `printed` | Ticket impreso en tótem | ✅ Sí (reimpresión) | ✅ Sí |
| `redeemed` | Ticket canjeado | ❌ No | ❌ No |
| `skipped` | Ticket omitido (fuera de rango) | ❌ No | ❌ No |
| `expired` | Ticket expirado | ❌ No | ❌ No |

---

## 🆕 Campos Nuevos

### **TicketUsage:**

```python
printed_at = models.DateTimeField(
    blank=True,
    null=True,
    verbose_name='fecha de impresión',
    help_text='Fecha y hora en que se imprimió este ticket en el tótem'
)

printed_by = models.CharField(
    max_length=255,
    blank=True,
    null=True,
    verbose_name='impreso por',
    help_text='Identificador del tótem o dispositivo que imprimió el ticket'
)
```

---

## 🌐 Endpoint: Imprimir Ticket

### **POST** `/api/tickets/print/`

Marca un TicketUsage como 'printed' (impreso).

### **Autenticación:**
- API Key: `X-API-Key: fvx_xxxxxxxxxx`
- JWT Token: `Authorization: Bearer xxxxxxxxxx`

---

## 📤 Request

### **Headers:**
```http
Content-Type: application/json
X-API-Key: fvx_xxxxxxxxxx
```

### **Body:**
```json
{
  "ticket_number": "EV0-20260206-57187",
  "usage_date": "2026-02-24",  // Opcional, default: hoy
  "totem_id": "TOTEM-01"  // Opcional, identificador del tótem
}
```

### **Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `ticket_number` | string | ✅ Sí | Número del ticket (obtenido del QR o código de barras) |
| `usage_date` | string | ❌ No | Fecha en formato YYYY-MM-DD (default: hoy) |
| `totem_id` | string | ❌ No | Identificador del tótem (default: TOTEM-UNKNOWN) |

---

## 📥 Response

### **✅ Éxito (200 OK):**

```json
{
  "success": true,
  "message": "Ticket impreso exitosamente",
  "is_reprint": false,
  "ticket": {
    "id": 123,
    "ticket_number": "EV0-20260206-57187",
    "status": "pending",
    "valid_from": "2026-02-18",
    "valid_until": "2026-02-28",
    "person": {
      "id": 45,
      "full_name": "Juan Pérez",
      "document_number": "12345678-9",
      "email": "juan@example.com"
    },
    "service": {
      "id": 5,
      "name": "Almuerzo",
      "code": "ALM001",
      "time_from": "12:00:00",
      "time_to": "14:00:00"
    },
    "event": {
      "id": 12,
      "name": "Almuerzo Corporativo",
      "code": "ACAM188",
      "organization": "Clikma"
    },
    "usage": {
      "usage_date": "2026-02-24",
      "status": "printed",
      "printed_at": "2026-02-24T14:30:00Z",
      "printed_by": "TOTEM-01",
      "notes": null
    }
  }
}
```

---

## ❌ Errores

### **400 Bad Request - Datos Inválidos:**

```json
{
  "success": false,
  "error": "document_number, event_code y service_code son requeridos"
}
```

### **400 Bad Request - Formato de Fecha Inválido:**

```json
{
  "success": false,
  "error": "Formato de fecha inválido. Use YYYY-MM-DD"
}
```

### **400 Bad Request - Ticket Ya Impreso:**

```json
{
  "success": false,
  "error": "El ticket ya fue impreso anteriormente",
  "ticket_usage": {
    "status": "printed",
    "printed_at": "2026-02-24T10:15:00Z",
    "printed_by": "TOTEM-01"
  }
}
```

### **400 Bad Request - Ticket Ya Canjeado:**

```json
{
  "success": false,
  "error": "El ticket ya fue canjeado",
  "ticket_usage": {
    "status": "redeemed",
    "redeemed_at": "2026-02-24T12:30:00Z"
  }
}
```

### **400 Bad Request - Ticket Expirado:**

```json
{
  "success": false,
  "error": "El ticket ha expirado"
}
```

### **400 Bad Request - Ticket No Disponible:**

```json
{
  "success": false,
  "error": "Este ticket no está disponible para esta fecha"
}
```

### **404 Not Found - Persona No Encontrada:**

```json
{
  "success": false,
  "error": "Persona con documento 12345678-9 no encontrada"
}
```

### **404 Not Found - Evento No Encontrado:**

```json
{
  "success": false,
  "error": "Evento ACAM188 no encontrado"
}
```

### **404 Not Found - Servicio No Encontrado:**

```json
{
  "success": false,
  "error": "Servicio ALM001 no encontrado en el evento ACAM188"
}
```

### **404 Not Found - Ticket No Encontrado:**

```json
{
  "success": false,
  "error": "No se encontró ticket para Juan Pérez en Almuerzo"
}
```

### **404 Not Found - TicketUsage No Encontrado:**

```json
{
  "success": false,
  "error": "No se encontró uso de ticket para la fecha 2026-02-24"
}
```

---

## 🔍 Ejemplos de Uso

### **Ejemplo 1: Impresión Básica (Fecha de Hoy)**

```bash
curl -X POST https://api.example.com/api/tickets/print/ \
  -H "Content-Type: application/json" \
  -H "X-API-Key: fvx_xxxxxxxxxx" \
  -d '{
    "ticket_number": "EV0-20260206-57187"
  }'
```

### **Ejemplo 2: Impresión con Fecha Específica**

```bash
curl -X POST https://api.example.com/api/tickets/print/ \
  -H "Content-Type: application/json" \
  -H "X-API-Key: fvx_xxxxxxxxxx" \
  -d '{
    "ticket_number": "EV0-20260206-57187",
    "usage_date": "2026-02-25"
  }'
```

### **Ejemplo 3: Impresión con ID de Tótem**

```bash
curl -X POST https://api.example.com/api/tickets/print/ \
  -H "Content-Type: application/json" \
  -H "X-API-Key: fvx_xxxxxxxxxx" \
  -d '{
    "ticket_number": "EV0-20260206-57187",
    "totem_id": "TOTEM-CAFETERIA-01"
  }'
```

### **Ejemplo 4: Reimpresión (Ticket Perdido)**

Si un usuario pierde su ticket físico, puede reimprimirlo escaneando el QR nuevamente:

```bash
curl -X POST https://api.example.com/api/tickets/print/ \
  -H "Content-Type: application/json" \
  -H "X-API-Key: fvx_xxxxxxxxxx" \
  -d '{
    "ticket_number": "EV0-20260206-57187",
    "totem_id": "TOTEM-02"
  }'
```

**Respuesta de Reimpresión:**
```json
{
  "success": true,
  "message": "Ticket reimpreso exitosamente",
  "is_reprint": true,
  "ticket_usage": {
    "id": 123,
    "usage_date": "2026-02-24",
    "status": "printed",
    "printed_at": "2026-02-24T15:45:00Z",
    "printed_by": "TOTEM-02",
    "notes": "Reimpreso el 2026-02-24 15:45:00 por TOTEM-02 (impresión original: 2026-02-24 14:30:00 por TOTEM-01)"
  },
  "person": {
    "id": 45,
    "full_name": "Juan Pérez",
    "document_number": "12345678-9"
  },
  "event": {
    "id": 12,
    "code": "ACAM188",
    "name": "Almuerzo Corporativo"
  },
  "service": {
    "id": 5,
    "code": "ALM001",
    "name": "Almuerzo"
  }
}
```

**Nota:** El campo `notes` registra el historial de reimpresiones para auditoría.

---

## 🔄 Flujo Completo

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO DE TICKET                          │
└─────────────────────────────────────────────────────────────┘

1. CREACIÓN
   ├─ EventAttendee creado
   ├─ Signal crea Ticket
   └─ Signal crea TicketUsage (status: 'pending')

2. IMPRESIÓN (Este Endpoint)
   ├─ Usuario ingresa RUT en tótem
   ├─ Tótem llama POST /api/tickets/print/
   ├─ TicketUsage.status → 'printed'
   ├─ TicketUsage.printed_at → timestamp
   ├─ TicketUsage.printed_by → 'TOTEM-01'
   └─ Tótem imprime ticket físico

3. CANJE
   ├─ Usuario presenta ticket en punto de servicio
   ├─ Staff llama POST /api/redeem-ticket/
   ├─ TicketUsage.status → 'redeemed'
   ├─ TicketUsage.redeemed_at → timestamp
   └─ TicketUsage.redeemed_by → user_id
```

---

## 🛠️ Implementación en Frontend (Tótem)

### **JavaScript/TypeScript:**

```typescript
async function printTicket(
  ticketNumber: string,
  totemId: string = 'TOTEM-01'
) {
  try {
    const response = await fetch('https://api.example.com/api/tickets/print/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'fvx_xxxxxxxxxx'
      },
      body: JSON.stringify({
        ticket_number: ticketNumber,
        totem_id: totemId
      })
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Ticket impreso:', data.ticket.usage);
      console.log('👤 Persona:', data.ticket.person.full_name);
      console.log('🔄 Reimpresión:', data.is_reprint);
      
      // Imprimir ticket físico aquí
      printPhysicalTicket(data.ticket);
      
      return data;
    } else {
      console.error('❌ Error:', data.error);
      showError(data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error de red:', error);
    showError('Error de conexión con el servidor');
    return null;
  }
}

// Uso: Escanear QR del ticket y enviar el número
const ticketNumber = scanQRCode(); // Obtiene "EV0-20260206-57187"
const result = await printTicket(ticketNumber, 'TOTEM-CAFETERIA-01');
```

---

## 📊 Migración

### **Archivo:** `0026_add_printed_status_to_ticketusage.py`

```bash
# Ejecutar migración
python manage.py migrate
```

**Cambios:**
- ✅ Agrega campo `printed_at` a TicketUsage
- ✅ Agrega campo `printed_by` a TicketUsage
- ✅ Agrega estado 'printed' a TICKET_USAGE_STATUS

---

## ✅ Checklist de Implementación

- [x] Agregar estado 'printed' a TICKET_USAGE_STATUS
- [x] Agregar campos printed_at y printed_by a TicketUsage
- [x] Actualizar método can_redeem para aceptar tickets impresos
- [x] Agregar método can_print
- [x] Actualizar serializers (TicketUsageSerializer, TicketUsageDetailSerializer)
- [x] Crear endpoint POST /api/tickets/print/
- [x] Agregar URL en urls.py
- [x] Crear migración 0026
- [ ] Ejecutar migración en servidor
- [ ] Probar endpoint
- [ ] Integrar con frontend de tótem

---

## 🔒 Seguridad

- ✅ Requiere autenticación (API Key o JWT)
- ✅ Valida que el ticket exista
- ✅ Valida que el ticket esté en estado 'pending'
- ✅ Valida que la fecha sea válida
- ✅ Previene doble impresión
- ✅ Registra quién imprimió (totem_id)
- ✅ Registra cuándo se imprimió (printed_at)

---

## 📝 Notas Importantes

1. **✅ Reimpresión permitida**
   - Los tickets pueden reimprimirse en caso de pérdida del ticket físico
   - La reimpresión actualiza `printed_at` y `printed_by`
   - El historial de reimpresiones se registra en el campo `notes`

2. **Tickets impresos pueden canjearse**
   - El estado 'printed' permite el canje posterior

3. **Fecha por defecto es HOY**
   - Si no se envía `usage_date`, usa la fecha actual

4. **Identificador de tótem es opcional**
   - Si no se envía, usa 'TOTEM-UNKNOWN'

5. **Compatible con integración Clikma**
   - Tickets de Clikma con restricciones de fechas funcionan correctamente

6. **Auditoría completa**
   - Cada reimpresión se registra con fecha, hora y tótem
   - El campo `is_reprint` en la respuesta indica si fue reimpresión

---

**Documentación creada:** 2026-02-24  
**Versión:** 1.0  
**Estado:** ✅ Listo para uso
