# Campo `allow_ticket_reprint` en Eventos

## 📋 Descripción

Se ha agregado un nuevo campo booleano al modelo `Event` que permite controlar si los tickets de un evento pueden ser reimpresos o no.

---

## 🔧 Especificaciones Técnicas

### **Campo en el Backend**

**Nombre:** `allow_ticket_reprint`  
**Tipo:** `Boolean`  
**Default:** `false`  
**Ubicación:** Modelo `Event` en la API

### **Descripción del Campo**

- **`true`**: Los tickets pueden ser reimpresos múltiples veces
- **`false`**: Los tickets solo pueden ser impresos una vez (sin reimpresión)

---

## 🎯 Implementación en Angular

### **1. Actualizar la Interfaz TypeScript del Evento**

Agrega el campo `allow_ticket_reprint` a la interfaz de `Event`:

```typescript
export interface Event {
  id: number;
  code: string;
  name: string;
  description?: string;
  date_start?: string;
  date_end?: string;
  location?: string;
  max_capacity?: number;
  status: string;
  check_in_required: boolean;
  supervisor_code?: string;
  contact_email?: string;
  allow_ticket_reprint: boolean;  // ← NUEVO CAMPO
  // ... otros campos
}
```

---

### **2. Agregar el Campo en el Formulario de Creación/Edición de Evento**

#### **HTML del Formulario**

Agrega un checkbox o toggle para controlar la reimpresión de tickets:

```html
<!-- Formulario de Evento -->
<form [formGroup]="eventForm" (ngSubmit)="onSubmit()">
  
  <!-- Campos existentes: nombre, código, descripción, etc. -->
  
  <!-- NUEVO: Campo para permitir reimpresión de tickets -->
  <div class="form-group">
    <label for="allowTicketReprint">
      <input 
        type="checkbox" 
        id="allowTicketReprint" 
        formControlName="allow_ticket_reprint"
      />
      Permitir reimpresión de tickets
    </label>
    <small class="form-text text-muted">
      Si está marcado, los asistentes podrán reimprimir sus tickets. 
      Si no está marcado, solo se permite una impresión por ticket.
    </small>
  </div>

  <!-- Otros campos del formulario -->
  
  <button type="submit">Guardar Evento</button>
</form>
```

#### **Ejemplo con Angular Material**

Si usas Angular Material:

```html
<mat-slide-toggle 
  formControlName="allow_ticket_reprint"
  color="primary">
  Permitir reimpresión de tickets
</mat-slide-toggle>
<mat-hint>
  Si está activado, los asistentes podrán reimprimir sus tickets múltiples veces.
</mat-hint>
```

---

### **3. Configurar el FormGroup en el Componente**

#### **TypeScript del Componente**

```typescript
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-event-form',
  templateUrl: './event-form.component.html',
  styleUrls: ['./event-form.component.css']
})
export class EventFormComponent implements OnInit {
  eventForm: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.eventForm = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      description: [''],
      location: [''],
      max_capacity: [null],
      check_in_required: [false],
      supervisor_code: [''],
      contact_email: ['', Validators.email],
      allow_ticket_reprint: [false],  // ← NUEVO CAMPO con valor por defecto false
      // ... otros campos
    });
  }

  onSubmit(): void {
    if (this.eventForm.valid) {
      const eventData = this.eventForm.value;
      // Enviar a la API
      this.eventService.createEvent(eventData).subscribe(
        response => {
          console.log('Evento creado:', response);
        },
        error => {
          console.error('Error al crear evento:', error);
        }
      );
    }
  }
}
```

---

### **4. Ejemplo de Payload al Crear/Editar Evento**

Cuando envíes el formulario a la API, el payload incluirá el nuevo campo:

```json
{
  "code": "EV2026",
  "name": "Conferencia Anual 2026",
  "description": "Evento principal del año",
  "location": "Centro de Convenciones",
  "max_capacity": 500,
  "check_in_required": true,
  "supervisor_code": "SUP123",
  "contact_email": "eventos@empresa.cl",
  "allow_ticket_reprint": false
}
```

---

### **5. Mostrar el Estado en la Vista de Detalle del Evento**

Si tienes una vista de detalle del evento, muestra el estado de este campo:

```html
<div class="event-details">
  <h2>{{ event.name }}</h2>
  <p><strong>Código:</strong> {{ event.code }}</p>
  <p><strong>Ubicación:</strong> {{ event.location }}</p>
  
  <!-- NUEVO: Mostrar estado de reimpresión -->
  <p>
    <strong>Reimpresión de tickets:</strong>
    <span *ngIf="event.allow_ticket_reprint" class="badge badge-success">
      ✓ Permitida
    </span>
    <span *ngIf="!event.allow_ticket_reprint" class="badge badge-warning">
      ✗ No permitida
    </span>
  </p>
</div>
```

---

### **6. Lógica de Negocio para Reimpresión**

Usa este campo para controlar la funcionalidad de reimpresión en el frontend:

```typescript
canReprintTicket(event: Event): boolean {
  return event.allow_ticket_reprint;
}

onReprintTicket(ticket: Ticket, event: Event): void {
  if (!this.canReprintTicket(event)) {
    this.showError('Este evento no permite la reimpresión de tickets');
    return;
  }
  
  // Proceder con la reimpresión
  this.ticketService.reprintTicket(ticket.id).subscribe(
    response => {
      console.log('Ticket reimpreso:', response);
    },
    error => {
      console.error('Error al reimprimir ticket:', error);
    }
  );
}
```

---

## 📊 Casos de Uso

### **Caso 1: Evento sin Reimpresión (Default)**

```typescript
// Crear evento con reimpresión deshabilitada
const newEvent = {
  name: 'Concierto Exclusivo',
  code: 'CONC2026',
  allow_ticket_reprint: false  // Solo una impresión permitida
};
```

**Comportamiento esperado:**
- Los asistentes solo pueden imprimir su ticket una vez
- Intentos de reimpresión deben ser bloqueados en el frontend
- Mostrar mensaje: "Este evento no permite reimpresión de tickets"

### **Caso 2: Evento con Reimpresión Habilitada**

```typescript
// Crear evento con reimpresión habilitada
const newEvent = {
  name: 'Conferencia Abierta',
  code: 'CONF2026',
  allow_ticket_reprint: true  // Múltiples impresiones permitidas
};
```

**Comportamiento esperado:**
- Los asistentes pueden reimprimir sus tickets las veces que necesiten
- Botón de "Reimprimir" debe estar habilitado
- No hay restricciones en el número de impresiones

---

## ⚠️ Consideraciones Importantes

### **1. Valor por Defecto**

El campo tiene `default=false` en el backend, lo que significa:
- Si no se envía en el payload, se asumirá `false`
- **Recomendación:** Siempre incluir el campo explícitamente en el formulario

### **2. Validación en Frontend**

Antes de permitir reimpresión, verifica:

```typescript
if (!event.allow_ticket_reprint) {
  // Deshabilitar botón de reimpresión
  // Mostrar tooltip: "Reimpresión no permitida para este evento"
}
```

### **3. Mensajes al Usuario**

Muestra mensajes claros cuando la reimpresión no está permitida:

```typescript
const messages = {
  reprintNotAllowed: 'Este evento no permite la reimpresión de tickets. Si perdiste tu ticket, contacta al organizador.',
  reprintAllowed: 'Puedes reimprimir tu ticket las veces que necesites.'
};
```

---

## 🎨 Ejemplo de Diseño (Referencial)

### **Toggle en el Formulario**

```
┌─────────────────────────────────────────┐
│ Crear Nuevo Evento                      │
├─────────────────────────────────────────┤
│                                         │
│ Nombre del Evento: [_______________]   │
│ Código: [_______________]              │
│ Ubicación: [_______________]           │
│                                         │
│ ☐ Requiere check-in                    │
│ ☐ Permitir reimpresión de tickets     │
│   ℹ️ Los asistentes podrán reimprimir  │
│      sus tickets si esta opción está   │
│      habilitada.                        │
│                                         │
│ [Cancelar]  [Guardar Evento]           │
└─────────────────────────────────────────┘
```

### **Badge en Vista de Detalle**

```
Evento: Conferencia 2026
Código: CONF2026
Reimpresión: ✓ Permitida
```

---

## 📝 Checklist de Implementación

- [ ] Actualizar interfaz TypeScript de `Event`
- [ ] Agregar campo `allow_ticket_reprint` al formulario de creación
- [ ] Agregar campo `allow_ticket_reprint` al formulario de edición
- [ ] Configurar valor por defecto como `false` en el FormGroup
- [ ] Implementar lógica de validación para reimpresión
- [ ] Mostrar estado del campo en vista de detalle del evento
- [ ] Deshabilitar botón de reimpresión cuando `allow_ticket_reprint=false`
- [ ] Agregar mensajes informativos para el usuario
- [ ] Probar creación de evento con reimpresión habilitada
- [ ] Probar creación de evento con reimpresión deshabilitada
- [ ] Probar edición del campo en eventos existentes

---

## 🔗 Endpoints Relacionados

### **Crear Evento**
```
POST /api/events/
```

### **Actualizar Evento**
```
PUT /api/events/{id}/
PATCH /api/events/{id}/
```

### **Obtener Evento**
```
GET /api/events/{id}/
```

**Respuesta incluirá:**
```json
{
  "id": 1,
  "code": "EV2026",
  "name": "Mi Evento",
  "allow_ticket_reprint": false,
  ...
}
```

---

## 📞 Contacto

Si tienes dudas sobre la implementación de este campo, contacta al equipo de backend.

**Email:** jmarquez@favric.cl  
**Proyecto:** FVX Ticket System

---

**Fecha de Implementación:** 2 de Marzo, 2026  
**Versión del Backend:** 1.0  
**Migración:** `0031_event_allow_ticket_reprint.py`
