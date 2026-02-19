# 👥 Sistema de Visitantes - Guía para Angular

**Versión:** 1.0  
**Fecha:** 19 de Febrero de 2026  
**Audiencia:** IA de Angular

---

## 🎯 Objetivo

Permitir que supervisores agreguen visitantes a eventos usando un código maestro, sin necesidad de pre-registro.

---

## 📋 Flujo del Sistema

```
1. Supervisor ingresa código maestro
   ↓
2. Sistema valida código
   ↓
3. Supervisor ingresa datos del visitante
   ↓
4. Sistema busca/crea persona
   ↓
5. Sistema crea EventAttendee con role='visitor'
   ↓
6. post_save genera tickets automáticamente
   ↓
7. Visitante puede usar el sistema normalmente
```

---

## 🚀 APIs Disponibles

### **1. Agregar Visitante**

```
POST /api/events/add-visitor/
```

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
    "registration_date": "2026-02-19T01:30:00Z",
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
    },
    {
      "id": 457,
      "ticket_number": "CONF-20260219-12346",
      "service": {
        "id": 2,
        "name": "Almuerzo",
        "code": "LUNCH"
      },
      "status": "pending"
    }
  ],
  "tickets_count": 2
}
```

**Response Error - Código Incorrecto (403):**
```json
{
  "success": false,
  "error": "Código de supervisor incorrecto"
}
```

**Response Error - Ya Registrado (400):**
```json
{
  "success": false,
  "error": "Esta persona ya está registrada en el evento",
  "attendee": {
    "id": 123,
    "role": "attendee",
    "status": "confirmed",
    "registration_date": "2026-02-15T10:00:00Z"
  }
}
```

---

### **2. Eventos del Día**

```
GET /api/events/today/?date=2026-02-19
```

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
    },
    {
      "id": 2,
      "code": "WORKSHOP2026",
      "name": "Workshop de Tecnología",
      "location": "Sala 101",
      "date_start": "2026-02-19T14:00:00Z",
      "date_end": "2026-02-19T18:00:00Z",
      "organization": "Tech Corp",
      "has_supervisor_code": false
    }
  ],
  "count": 2
}
```

---

### **3. Verificar RUT**

```
POST /api/persons/check-rut/
```

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

## 💻 Interfaces TypeScript

```typescript
// interfaces/visitor.interface.ts

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
  person: PersonInfo;
  attendee: AttendeeInfo;
  tickets: TicketInfo[];
  tickets_count: number;
}

export interface PersonInfo {
  id: number;
  full_name: string;
  document_number: string;
  was_created: boolean;
}

export interface AttendeeInfo {
  id: number;
  role: string;
  status: string;
  registration_date: string;
  added_by: string;
}

export interface TicketInfo {
  id: number;
  ticket_number: string;
  service: ServiceInfo;
  status: string;
}

export interface ServiceInfo {
  id: number;
  name: string;
  code: string;
}

export interface EventToday {
  id: number;
  code: string;
  name: string;
  location: string;
  date_start: string;
  date_end: string;
  organization: string;
  has_supervisor_code: boolean;
}

export interface EventsTodayResponse {
  date: string;
  events: EventToday[];
  count: number;
}

export interface CheckRutRequest {
  document_number: string;
}

export interface CheckRutResponse {
  exists: boolean;
  person?: {
    id: number;
    full_name: string;
    first_name: string;
    last_name: string;
    document_number: string;
    email: string;
    phone: string;
  };
  message?: string;
}
```

---

## 🔧 Servicio HTTP

```typescript
// services/visitor.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AddVisitorRequest,
  AddVisitorResponse,
  EventsTodayResponse,
  CheckRutRequest,
  CheckRutResponse
} from '../interfaces/visitor.interface';

@Injectable({
  providedIn: 'root'
})
export class VisitorService {
  private apiUrl = 'https://ticket-services.favric.cl/api';

  constructor(private http: HttpClient) {}

  /**
   * Agregar visitante a un evento
   */
  addVisitor(data: AddVisitorRequest): Observable<AddVisitorResponse> {
    return this.http.post<AddVisitorResponse>(
      `${this.apiUrl}/events/add-visitor/`,
      data
    );
  }

  /**
   * Obtener eventos del día
   */
  getEventsToday(date?: string): Observable<EventsTodayResponse> {
    const url = date 
      ? `${this.apiUrl}/events/today/?date=${date}`
      : `${this.apiUrl}/events/today/`;
    
    return this.http.get<EventsTodayResponse>(url);
  }

  /**
   * Verificar si existe persona con ese RUT
   */
  checkRut(data: CheckRutRequest): Observable<CheckRutResponse> {
    return this.http.post<CheckRutResponse>(
      `${this.apiUrl}/persons/check-rut/`,
      data
    );
  }
}
```

---

## 🎨 Componente

```typescript
// components/add-visitor/add-visitor.component.ts

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VisitorService } from '../../services/visitor.service';
import { EventToday } from '../../interfaces/visitor.interface';

@Component({
  selector: 'app-add-visitor',
  templateUrl: './add-visitor.component.html',
  styleUrls: ['./add-visitor.component.scss']
})
export class AddVisitorComponent implements OnInit {
  visitorForm: FormGroup;
  eventsToday: EventToday[] = [];
  loading = false;
  success = false;
  error: string | null = null;
  personExists = false;
  ticketsGenerated: any[] = [];

  constructor(
    private fb: FormBuilder,
    private visitorService: VisitorService
  ) {
    this.visitorForm = this.fb.group({
      supervisor_code: ['', Validators.required],
      supervisor_name: ['', Validators.required],
      event_code: ['', Validators.required],
      document_number: ['', Validators.required],
      first_name: [''],
      last_name: ['']
    });
  }

  ngOnInit() {
    this.loadEventsToday();
  }

  /**
   * Cargar eventos del día
   */
  loadEventsToday() {
    this.visitorService.getEventsToday().subscribe({
      next: (response) => {
        this.eventsToday = response.events.filter(e => e.has_supervisor_code);
      },
      error: (error) => {
        console.error('Error al cargar eventos:', error);
      }
    });
  }

  /**
   * Verificar RUT cuando el usuario termina de escribir
   */
  onRutBlur() {
    const rut = this.visitorForm.get('document_number')?.value;
    
    if (rut && rut.length >= 7) {
      this.visitorService.checkRut({ document_number: rut }).subscribe({
        next: (response) => {
          if (response.exists && response.person) {
            // Autocompletar y deshabilitar campos
            this.visitorForm.patchValue({
              first_name: response.person.first_name,
              last_name: response.person.last_name
            });
            this.visitorForm.get('first_name')?.disable();
            this.visitorForm.get('last_name')?.disable();
            this.personExists = true;
          } else {
            // Habilitar campos para nueva persona
            this.visitorForm.get('first_name')?.enable();
            this.visitorForm.get('last_name')?.enable();
            this.visitorForm.get('first_name')?.setValidators(Validators.required);
            this.visitorForm.get('last_name')?.setValidators(Validators.required);
            this.personExists = false;
          }
        },
        error: (error) => {
          console.error('Error al verificar RUT:', error);
        }
      });
    }
  }

  /**
   * Enviar formulario
   */
  onSubmit() {
    if (this.visitorForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = false;

    // Obtener valores (incluyendo disabled)
    const formData = this.visitorForm.getRawValue();

    this.visitorService.addVisitor(formData).subscribe({
      next: (response) => {
        this.success = true;
        this.ticketsGenerated = response.tickets;
        this.loading = false;
        
        // Mostrar mensaje de éxito
        alert(`Visitante agregado exitosamente!\n\n` +
              `Nombre: ${response.person.full_name}\n` +
              `Tickets generados: ${response.tickets_count}`);
        
        // Resetear formulario
        this.resetForm();
      },
      error: (error) => {
        this.error = error.error?.error || 'Error al agregar visitante';
        this.loading = false;
      }
    });
  }

  /**
   * Resetear formulario
   */
  resetForm() {
    this.visitorForm.reset();
    this.visitorForm.get('first_name')?.enable();
    this.visitorForm.get('last_name')?.enable();
    this.personExists = false;
    this.ticketsGenerated = [];
  }
}
```

---

## 📄 Template HTML

```html
<!-- add-visitor.component.html -->

<div class="add-visitor-container">
  
  <h2>Agregar Visitante</h2>

  <form [formGroup]="visitorForm" (ngSubmit)="onSubmit()">
    
    <!-- Código Maestro -->
    <div class="form-group">
      <label>Código Maestro *</label>
      <input 
        type="password" 
        formControlName="supervisor_code"
        placeholder="Ingrese código de supervisor"
        class="form-control">
    </div>

    <!-- Nombre del Supervisor -->
    <div class="form-group">
      <label>Su Nombre *</label>
      <input 
        type="text" 
        formControlName="supervisor_name"
        placeholder="Ingrese su nombre"
        class="form-control">
    </div>

    <!-- Seleccionar Evento -->
    <div class="form-group">
      <label>Evento *</label>
      <select formControlName="event_code" class="form-control">
        <option value="">Seleccione un evento</option>
        <option *ngFor="let event of eventsToday" [value]="event.code">
          {{ event.name }} - {{ event.location }}
        </option>
      </select>
    </div>

    <!-- RUT -->
    <div class="form-group">
      <label>RUT del Visitante *</label>
      <input 
        type="text" 
        formControlName="document_number"
        (blur)="onRutBlur()"
        placeholder="12345678-9"
        class="form-control">
      <small *ngIf="personExists" class="text-success">
        ✓ Persona encontrada en el sistema
      </small>
    </div>

    <!-- Nombres -->
    <div class="form-group">
      <label>Nombres *</label>
      <input 
        type="text" 
        formControlName="first_name"
        placeholder="Juan"
        class="form-control"
        [readonly]="personExists">
    </div>

    <!-- Apellidos -->
    <div class="form-group">
      <label>Apellidos *</label>
      <input 
        type="text" 
        formControlName="last_name"
        placeholder="Pérez"
        class="form-control"
        [readonly]="personExists">
    </div>

    <!-- Mensajes -->
    <div *ngIf="error" class="alert alert-danger">
      {{ error }}
    </div>

    <div *ngIf="success" class="alert alert-success">
      ✓ Visitante agregado exitosamente
    </div>

    <!-- Botones -->
    <div class="form-actions">
      <button 
        type="button" 
        (click)="resetForm()"
        class="btn btn-secondary">
        Cancelar
      </button>
      <button 
        type="submit" 
        [disabled]="visitorForm.invalid || loading"
        class="btn btn-primary">
        {{ loading ? 'Guardando...' : 'Guardar Visitante' }}
      </button>
    </div>

  </form>

  <!-- Tickets Generados -->
  <div *ngIf="ticketsGenerated.length > 0" class="tickets-generated">
    <h3>Tickets Generados</h3>
    <ul>
      <li *ngFor="let ticket of ticketsGenerated">
        {{ ticket.service.name }} - {{ ticket.ticket_number }}
      </li>
    </ul>
  </div>

</div>
```

---

## 🎯 Validaciones

### **Frontend:**
- ✅ Código maestro requerido
- ✅ Nombre supervisor requerido
- ✅ Evento requerido
- ✅ RUT requerido
- ✅ Nombres/Apellidos requeridos si no existe

### **Backend:**
- ✅ Código maestro correcto
- ✅ Evento existe
- ✅ Evento tiene código maestro configurado
- ✅ Persona no está ya registrada

---

## 📋 Flujo UX Recomendado

```
1. Supervisor abre formulario
   ↓
2. Ingresa código maestro
   ↓
3. Selecciona evento del día
   ↓
4. Ingresa RUT del visitante
   ↓
5a. Si existe → Autocompletar nombre (readonly)
5b. Si NO existe → Habilitar campos nombre
   ↓
6. Click en "Guardar"
   ↓
7. Sistema valida y crea
   ↓
8. Muestra tickets generados
   ↓
9. Formulario se resetea para siguiente visitante
```

---

## ✅ Checklist de Implementación

- [ ] Crear interfaces TypeScript
- [ ] Crear servicio HTTP
- [ ] Crear componente
- [ ] Crear template HTML
- [ ] Aplicar estilos
- [ ] Agregar validaciones
- [ ] Probar flujo completo
- [ ] Manejar errores
- [ ] Agregar feedback visual

---

**Última actualización:** 19 de Febrero de 2026  
**Versión:** 1.0  
**Estado:** ✅ Listo para implementar
