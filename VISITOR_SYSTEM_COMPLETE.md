# 👥 Sistema de Visitantes - Documentación Completa

**Versión:** 1.0  
**Fecha:** 19 de Febrero de 2026  
**Estado:** ✅ Implementado

---

## 📋 Índice

1. [Resumen](#resumen)
2. [Objetivo](#objetivo)
3. [Arquitectura](#arquitectura)
4. [APIs Implementadas](#apis-implementadas)
5. [Modelos y Base de Datos](#modelos-y-base-de-datos)
6. [Flujo Completo](#flujo-completo)
7. [Seguridad](#seguridad)
8. [Uso en Angular](#uso-en-angular)
9. [Testing](#testing)
10. [Deploy](#deploy)

---

## 🎯 Resumen

Sistema que permite a supervisores agregar visitantes a eventos el día del evento, sin necesidad de pre-registro, usando un código maestro.

### **Características:**
- ✅ Código maestro por evento
- ✅ Validación de código antes de agregar visitantes
- ✅ Creación automática de personas
- ✅ Generación automática de tickets
- ✅ Registro de quién agregó cada visitante
- ✅ Integración completa con el sistema existente

---

## 🎯 Objetivo

Permitir que supervisores autorizados agreguen visitantes de último momento a eventos activos, con las siguientes ventajas:

1. **Flexibilidad:** No requiere pre-registro
2. **Control:** Solo supervisores con código maestro
3. **Trazabilidad:** Se registra quién agregó cada visitante
4. **Automatización:** Tickets generados automáticamente
5. **Integración:** Visitantes usan el sistema normalmente

---

## 🏗️ Arquitectura

### **Componentes:**

```
┌─────────────────────────────────────────┐
│          FRONTEND (Angular)             │
│  - Formulario de visitantes             │
│  - Validación de código                 │
│  - Búsqueda de RUT                      │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│            BACKEND (Django)             │
│                                         │
│  ┌────────────────────────────────┐    │
│  │  visitor_views.py              │    │
│  │  - validate_supervisor_code    │    │
│  │  - add_visitor                 │    │
│  │  - events_today                │    │
│  │  - check_person_by_rut         │    │
│  └────────────────────────────────┘    │
│              │                          │
│              ▼                          │
│  ┌────────────────────────────────┐    │
│  │  Models                        │    │
│  │  - Event (supervisor_code)     │    │
│  │  - EventAttendee (visitor)     │    │
│  │  - Person                      │    │
│  └────────────────────────────────┘    │
│              │                          │
│              ▼                          │
│  ┌────────────────────────────────┐    │
│  │  Signals (post_save)           │    │
│  │  - Genera tickets automático   │    │
│  └────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

---

## 🚀 APIs Implementadas

### **1. Validar Código de Supervisor**

```
POST /api/events/validate-supervisor-code/
```

**Propósito:** Validar código maestro antes de mostrar formulario completo

**Request:**
```json
{
  "event_code": "CONF2026",
  "supervisor_code": "ABC123"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Código de supervisor válido",
  "event": {
    "id": 1,
    "code": "CONF2026",
    "name": "Conferencia Anual 2026",
    "location": "Centro de Convenciones",
    "date_start": "2026-02-18T09:00:00Z",
    "date_end": "2026-02-20T18:00:00Z",
    "supervisor_code": "ABC123"
  }
}
```

**Response Error (403):**
```json
{
  "success": false,
  "error": "Código de supervisor incorrecto"
}
```

**Validaciones:**
- ✅ Evento existe
- ✅ Evento tiene código configurado
- ✅ Código coincide

---

### **2. Agregar Visitante**

```
POST /api/events/add-visitor/
```

**Propósito:** Crear visitante y generar tickets automáticamente

**Request:**
```json
{
  "supervisor_code": "ABC123",
  "supervisor_name": "María González",
  "event_code": "CONF2026",
  "document_number": "15081307-7",
  "first_name": "Juan",
  "last_name": "Pérez"
}
```

**Response Success (201):**
```json
{
  "success": true,
  "message": "Visitante agregado exitosamente",
  "person": {
    "id": 10,
    "full_name": "Juan Pérez",
    "document_number": "15081307-7",
    "was_created": true
  },
  "attendee": {
    "id": 123,
    "role": "visitor",
    "status": "confirmed",
    "registration_date": "2026-02-19T02:30:00Z",
    "added_by": "María González"
  },
  "tickets": [
    {
      "id": 456,
      "ticket_number": "CONF-20260219-12345",
      "service": {
        "id": 1,
        "name": "Desayuno",
        "code": "BREAKFAST"
      },
      "status": "pending"
    }
  ],
  "tickets_count": 2
}
```

**Response Error (400):**
```json
{
  "success": false,
  "error": "Esta persona ya está registrada en el evento",
  "attendee": {
    "id": 123,
    "role": "attendee",
    "status": "confirmed"
  }
}
```

**Proceso Automático:**
1. Valida código maestro
2. Busca o crea persona
3. Crea EventAttendee con role='visitor'
4. Signal post_save genera tickets automáticamente
5. Retorna confirmación con tickets

---

### **3. Eventos del Día**

```
GET /api/events/today/?date=2026-02-19
```

**Propósito:** Listar eventos activos en una fecha

**Response:**
```json
{
  "date": "2026-02-19",
  "events": [
    {
      "id": 1,
      "code": "CONF2026",
      "name": "Conferencia Anual 2026",
      "location": "Centro de Convenciones",
      "date_start": "2026-02-18T09:00:00Z",
      "date_end": "2026-02-20T18:00:00Z",
      "organization": "Favric",
      "has_supervisor_code": true
    }
  ],
  "count": 1
}
```

**Nota:** Por seguridad, NO expone el código completo, solo indica si existe.

---

### **4. Verificar RUT**

```
POST /api/persons/check-rut/
```

**Propósito:** Verificar si existe persona con ese documento

**Request:**
```json
{
  "document_number": "15081307-7"
}
```

**Response - Existe:**
```json
{
  "exists": true,
  "person": {
    "id": 10,
    "full_name": "Juan Pérez",
    "first_name": "Juan",
    "last_name": "Pérez",
    "document_number": "15081307-7",
    "email": "juan@example.com",
    "phone": "+56912345678"
  }
}
```

**Response - No Existe:**
```json
{
  "exists": false,
  "message": "No se encontró persona con ese documento"
}
```

---

## 💾 Modelos y Base de Datos

### **Cambios en Event:**

```python
class Event(models.Model):
    # ... campos existentes ...
    
    supervisor_code = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name=_('código de supervisor'),
        help_text=_('Código maestro para que supervisores puedan agregar visitantes al evento')
    )
```

---

### **Cambios en EventAttendee:**

**1. Nuevo rol 'visitor':**
```python
ATTENDEE_ROLE = (
    ('attendee', _('Asistente')),
    ('speaker', _('Ponente')),
    ('sponsor', _('Patrocinador')),
    ('staff', _('Staff')),
    ('vip', _('VIP')),
    ('organizer', _('Organizador')),
    ('visitor', _('Visita')),  # ⭐ NUEVO
)
```

**2. Nuevo campo added_by:**
```python
class EventAttendee(models.Model):
    # ... campos existentes ...
    
    added_by = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name=_('agregado por'),
        help_text=_('Nombre del supervisor que agregó al visitante')
    )
```

---

### **Migración:**

```python
# 0021_add_visitor_fields.py

operations = [
    migrations.AddField(
        model_name='event',
        name='supervisor_code',
        field=models.CharField(...)
    ),
    migrations.AddField(
        model_name='eventattendee',
        name='added_by',
        field=models.CharField(...)
    ),
    migrations.AlterField(
        model_name='eventattendee',
        name='role',
        field=models.CharField(
            choices=[..., ('visitor', 'Visita')]
        ),
    ),
]
```

---

## 🔄 Flujo Completo

### **Paso a Paso:**

```
1. Supervisor abre formulario de visitantes
   │
   ├─→ Ingresa código maestro
   │   Ingresa evento
   │
   └─→ POST /api/events/validate-supervisor-code/
       │
       ├─→ ✅ Código válido → Habilita formulario
       │
       └─→ ❌ Código inválido → Error

2. Supervisor ingresa RUT del visitante
   │
   └─→ POST /api/persons/check-rut/
       │
       ├─→ Existe → Autocompletar nombres (readonly)
       │
       └─→ No existe → Habilitar campos nombres

3. Supervisor llena nombres/apellidos (si no existe)

4. Supervisor hace click en "Guardar"
   │
   └─→ POST /api/events/add-visitor/
       │
       ├─→ Backend valida código maestro
       │
       ├─→ Backend busca/crea persona
       │
       ├─→ Backend crea EventAttendee (role='visitor')
       │
       ├─→ Signal post_save genera tickets automáticamente
       │
       └─→ Retorna confirmación con tickets

5. Sistema muestra tickets generados

6. Visitante puede:
   - Hacer check-in
   - Canjear tickets
   - Usar servicios
   (Como cualquier asistente regular)
```

---

## 🔒 Seguridad

### **Validaciones Implementadas:**

#### **En validate_supervisor_code:**
1. ✅ Evento debe existir
2. ✅ Evento debe tener código configurado
3. ✅ Código debe coincidir exactamente

#### **En add_visitor:**
1. ✅ Código maestro correcto
2. ✅ Evento existe y tiene código
3. ✅ Persona no está ya registrada en el evento
4. ✅ Se registra quién agregó al visitante

---

### **Consideraciones de Privacidad:**

| API | Expone supervisor_code | Justificación |
|-----|------------------------|---------------|
| GET /api/events/ | ✅ Sí | API autenticada (admin) |
| POST validate-supervisor-code | ✅ Sí | Ya validó el código |
| GET events/today | ❌ No | Listado público |
| POST add-visitor | ❌ No | No es necesario |

---

### **Recomendaciones:**

1. **Códigos Únicos:** Usar código diferente por evento
2. **Rotación:** Cambiar códigos periódicamente
3. **Longitud:** Mínimo 8 caracteres
4. **Complejidad:** Mezclar letras y números
5. **Rate Limiting:** Limitar intentos fallidos

**Ejemplo de código seguro:** `CONF2026-A7B9X2K5`

---

## 💻 Uso en Angular

### **1. Interfaces TypeScript:**

```typescript
export interface ValidateSupervisorCodeRequest {
  event_code: string;
  supervisor_code: string;
}

export interface ValidateSupervisorCodeResponse {
  success: boolean;
  message: string;
  event: {
    id: number;
    code: string;
    name: string;
    supervisor_code: string;
  };
}

export interface AddVisitorRequest {
  supervisor_code: string;
  supervisor_name: string;
  event_code: string;
  document_number: string;
  first_name?: string;
  last_name?: string;
}

export interface AddVisitorResponse {
  success: boolean;
  message: string;
  person: {
    id: number;
    full_name: string;
    was_created: boolean;
  };
  attendee: {
    id: number;
    role: string;
    added_by: string;
  };
  tickets: TicketInfo[];
  tickets_count: number;
}
```

---

### **2. Servicio:**

```typescript
@Injectable({ providedIn: 'root' })
export class VisitorService {
  private apiUrl = 'https://ticket-services.favric.cl/api';

  constructor(private http: HttpClient) {}

  validateSupervisorCode(data: ValidateSupervisorCodeRequest) {
    return this.http.post<ValidateSupervisorCodeResponse>(
      `${this.apiUrl}/events/validate-supervisor-code/`,
      data
    );
  }

  addVisitor(data: AddVisitorRequest) {
    return this.http.post<AddVisitorResponse>(
      `${this.apiUrl}/events/add-visitor/`,
      data
    );
  }

  checkRut(document_number: string) {
    return this.http.post<CheckRutResponse>(
      `${this.apiUrl}/persons/check-rut/`,
      { document_number }
    );
  }

  getEventsToday(date?: string) {
    const url = date 
      ? `${this.apiUrl}/events/today/?date=${date}`
      : `${this.apiUrl}/events/today/`;
    return this.http.get<EventsTodayResponse>(url);
  }
}
```

---

### **3. Componente:**

```typescript
export class AddVisitorComponent {
  step: 'validate' | 'form' = 'validate';
  codeValidated = false;
  
  // Paso 1: Validar código
  validateCode() {
    this.visitorService.validateSupervisorCode({
      event_code: this.form.get('event_code').value,
      supervisor_code: this.form.get('supervisor_code').value
    }).subscribe({
      next: (response) => {
        this.codeValidated = true;
        this.step = 'form';
        this.eventInfo = response.event;
      },
      error: (error) => {
        this.error = 'Código incorrecto';
      }
    });
  }
  
  // Paso 2: Verificar RUT
  onRutBlur() {
    const rut = this.form.get('document_number').value;
    this.visitorService.checkRut(rut).subscribe({
      next: (response) => {
        if (response.exists) {
          this.form.patchValue({
            first_name: response.person.first_name,
            last_name: response.person.last_name
          });
          this.form.get('first_name').disable();
          this.form.get('last_name').disable();
        }
      }
    });
  }
  
  // Paso 3: Agregar visitante
  onSubmit() {
    this.visitorService.addVisitor(this.form.getRawValue())
      .subscribe({
        next: (response) => {
          this.showSuccess(response);
          this.resetForm();
        }
      });
  }
}
```

---

## 🧪 Testing

### **Test 1: Validar Código**
```bash
curl -X POST https://ticket-services.favric.cl/api/events/validate-supervisor-code/ \
  -H "Content-Type: application/json" \
  -d '{
    "event_code": "CONF2026",
    "supervisor_code": "ABC123"
  }'
```

### **Test 2: Agregar Visitante**
```bash
curl -X POST https://ticket-services.favric.cl/api/events/add-visitor/ \
  -H "Content-Type: application/json" \
  -d '{
    "supervisor_code": "ABC123",
    "supervisor_name": "María González",
    "event_code": "CONF2026",
    "document_number": "15081307-7",
    "first_name": "Juan",
    "last_name": "Pérez"
  }'
```

### **Test 3: Verificar RUT**
```bash
curl -X POST https://ticket-services.favric.cl/api/persons/check-rut/ \
  -H "Content-Type: application/json" \
  -d '{"document_number": "15081307-7"}'
```

### **Test 4: Eventos del Día**
```bash
curl https://ticket-services.favric.cl/api/events/today/
```

---

## 🚀 Deploy

### **1. Commit y Push:**
```bash
cd /Users/jmarquez/MyApps/fvx-suite/ticket_api

git add .
git commit -m "implement visitor system with supervisor code validation"
git push origin main
```

### **2. En el Servidor:**
```bash
# Conectarse
ssh usuario@ticket-services.favric.cl

# Actualizar código
cd /opt/fvx-ticket-bknd
git pull origin main

# Aplicar migración
docker compose -f docker-compose.prod.yml exec web python manage.py migrate

# Reiniciar
docker compose -f docker-compose.prod.yml restart web
```

### **3. Configurar Eventos:**
1. Ir al admin de Django: https://ticket-services.favric.cl/admin/
2. Editar eventos que necesiten visitantes
3. Agregar código en campo "Código de supervisor"
4. Ejemplo: `CONF2026-SUPER`
5. Guardar

### **4. Verificar:**
```bash
# Probar API
curl https://ticket-services.favric.cl/api/events/today/
```

---

## 📊 Archivos Modificados

### **Backend:**
- ✅ `/api/models.py` - Agregados campos supervisor_code y added_by
- ✅ `/api/serializers.py` - Agregado supervisor_code a EventSerializer
- ✅ `/api/admin.py` - Agregado supervisor_code al admin
- ✅ `/api/visitor_views.py` - Nuevo archivo con 4 views
- ✅ `/api/urls.py` - Agregadas 4 URLs nuevas
- ✅ `/api/migrations/0021_add_visitor_fields.py` - Nueva migración

### **Documentación:**
- ✅ `/docs/ANGULAR_VISITOR_GUIDE.md` - Guía completa para Angular
- ✅ `/docs/VISITOR_SYSTEM_COMPLETE.md` - Este documento

---

## ✅ Checklist de Implementación

- [x] Campo supervisor_code en Event
- [x] Rol 'visitor' en ATTENDEE_ROLE
- [x] Campo added_by en EventAttendee
- [x] API validate_supervisor_code
- [x] API add_visitor
- [x] API events_today
- [x] API check_person_by_rut
- [x] URLs registradas
- [x] Serializers actualizados
- [x] Admin actualizado
- [x] Migración creada
- [x] Documentación completa
- [ ] Testing en servidor
- [ ] Configurar códigos en eventos
- [ ] Implementación Angular

---

## 🎯 Próximos Pasos

1. **Deploy en servidor** (ver sección Deploy)
2. **Configurar códigos maestros** en eventos activos
3. **Implementar frontend Angular** (ver ANGULAR_VISITOR_GUIDE.md)
4. **Capacitar supervisores** en uso del sistema
5. **Monitorear logs** de visitantes agregados

---

## 📝 Notas Finales

### **Diferencias: Asistente vs Visitante**

| Característica | Asistente Regular | Visitante |
|----------------|-------------------|-----------|
| Pre-registro | ✅ Requerido | ❌ No requerido |
| Rol | `attendee` | `visitor` |
| Agregado por | Admin/Sistema | Supervisor en sitio |
| Tickets | Pre-generados | Auto-generados |
| Check-in | Normal | Normal |
| Servicios | Normal | Normal |
| Trazabilidad | created_date | added_by field |

**Una vez creado, un visitante funciona exactamente igual que un asistente regular.**

---

**Última actualización:** 19 de Febrero de 2026  
**Versión:** 1.0  
**Estado:** ✅ Implementado y documentado  
**Listo para:** Deploy y uso en producción
