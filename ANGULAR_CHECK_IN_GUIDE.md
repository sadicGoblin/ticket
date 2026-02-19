# 📘 Sistema de Check-in - Guía para Angular

**Versión:** 1.0  
**Fecha:** 18 de Febrero de 2026  
**Audiencia:** IA de Angular

---

## 📋 Contenido

1. [Resumen del Sistema](#resumen-del-sistema)
2. [Modelo DailyAttendance](#modelo-dailyattendance)
3. [Modos de Check-in](#modos-de-check-in)
4. [APIs Disponibles](#apis-disponibles)
5. [Interfaces TypeScript](#interfaces-typescript)
6. [Servicios HTTP](#servicios-http)
7. [Componentes](#componentes)
8. [Flujos Completos](#flujos-completos)
9. [Puntos Clave](#puntos-clave)

---

## Resumen del Sistema

### Objetivo
Implementar un sistema de check-in diario que:
1. Registre la asistencia de personas a eventos multi-día
2. Separe el check-in del uso de servicios
3. Ofrezca dos modos: restrictivo y permisivo

### Componentes Principales

**1. DailyAttendance (Modelo Backend)**
- Registra check-in diario (1 por persona por día)
- Unique constraint: `(attendee, attendance_date)`

**2. Event.check_in_required (Campo Boolean)**
- `true` = Modo Restrictivo 🔒 (check-in obligatorio)
- `false` = Modo Permisivo 🔓 (check-in automático)

**3. TicketUsage (Modelo Existente)**
- Registra uso de servicios específicos
- Estados: `pending`, `redeemed`, `skipped`

---

## Modelo DailyAttendance

### Estructura

```typescript
interface DailyAttendance {
  id: number;
  person: {
    id: number;
    full_name: string;
    document_number: string;
    email: string;
  };
  event: {
    id: number;
    code: string;
    name: string;
  };
  attendance_date: string;      // YYYY-MM-DD
  check_in_time: string;        // ISO 8601
  check_out_time: string | null;
  duration: string | null;      // "9h 30m"
  check_in_by: string;          // Username
  notes: string | null;
}
```

### Características
- **Un registro por persona por día**
- No se puede duplicar
- Representa que la persona llegó al evento ese día
- Independiente del uso de servicios

---

## Modos de Check-in

### Modo Restrictivo (check_in_required = true) 🔒

**Comportamiento:**
- Usuario DEBE hacer check-in antes de canjear tickets
- Si intenta canjear sin check-in → Error 403
- Uso: Eventos formales, conferencias

**Flujo:**
```
1. Persona llega → Hace check-in en recepción
2. Se crea DailyAttendance
3. Va al servicio → Sistema verifica DailyAttendance existe
4. Permite canjear ticket
```

**Ejemplo:**
```typescript
// Evento restrictivo
const event = {
  code: 'CONF2026',
  name: 'Conferencia Anual',
  check_in_required: true  // 🔒
};

// Intentar canjear sin check-in
redeemTicket('CONF-001') 
  → Error: "Debe realizar check-in antes de canjear tickets"

// Hacer check-in primero
checkIn('15081307-7', 'CONF2026')
  → Success: DailyAttendance creado

// Ahora sí puede canjear
redeemTicket('CONF-001')
  → Success: Ticket canjeado
```

---

### Modo Permisivo (check_in_required = false) 🔓

**Comportamiento:**
- Usuario puede canjear tickets sin check-in previo
- Si no tiene check-in → Se crea automáticamente
- Uso: Eventos informales, almuerzos

**Flujo:**
```
1. Persona va directo al servicio (sin check-in)
2. Intenta canjear ticket
3. Sistema detecta que no tiene DailyAttendance
4. Crea DailyAttendance automáticamente
5. Permite canjear ticket
```

**Ejemplo:**
```typescript
// Evento permisivo
const event = {
  code: 'LUNCH2026',
  name: 'Almuerzo Mensual',
  check_in_required: false  // 🔓
};

// Canjear directo (sin check-in previo)
redeemTicket('LUNCH-001')
  → Success: Check-in automático + Ticket canjeado
  → Response: { auto_check_in: true }
```

---

## APIs Disponibles

### 1. Check-in Manual

```
POST /api/check-in/
```

**Request:**
```json
{
  "document_number": "15081307-7",
  "event_code": "CONF2026",
  "date": "2026-02-18"  // Opcional, default: hoy
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Check-in exitoso",
  "data": {
    "id": 123,
    "person": {
      "id": 1,
      "full_name": "Juan Pérez",
      "document_number": "15081307-7"
    },
    "event": {
      "id": 5,
      "code": "CONF2026",
      "name": "Conferencia Anual"
    },
    "attendance_date": "2026-02-18",
    "check_in_time": "2026-02-18T08:30:00Z",
    "check_in_by": "admin",
    "is_first_day": true
  }
}
```

**Response Error (Ya hizo check-in):**
```json
{
  "success": false,
  "error": "Ya realizó check-in para esta fecha",
  "existing_check_in": {
    "attendance_date": "2026-02-18",
    "check_in_time": "2026-02-18T08:30:00Z"
  }
}
```

---

### 2. Check-out

```
POST /api/check-out/
```

**Request:**
```json
{
  "document_number": "15081307-7",
  "event_code": "CONF2026",
  "date": "2026-02-18"  // Opcional, default: hoy
}
```

**Response:**
```json
{
  "success": true,
  "message": "Check-out exitoso",
  "data": {
    "id": 123,
    "attendance_date": "2026-02-18",
    "check_in_time": "2026-02-18T08:30:00Z",
    "check_out_time": "2026-02-18T18:00:00Z",
    "duration": "9h 30m"
  }
}
```

---

### 3. Verificar Check-in

```
GET /api/check-in/verify/
```

**Parámetros:**
- `document_number` (requerido)
- `event_code` (requerido)
- `date` (opcional, default: hoy)

**Response (Tiene check-in):**
```json
{
  "has_check_in": true,
  "check_in_time": "2026-02-18T08:30:00Z",
  "check_out_time": null,
  "can_redeem_tickets": true
}
```

**Response (NO tiene check-in):**
```json
{
  "has_check_in": false,
  "can_redeem_tickets": false,
  "message": "Debe realizar check-in primero"
}
```

---

### 4. Listar Asistencias

```
GET /api/daily-attendance/
```

**Parámetros:**
- `event` (Integer): ID del evento
- `event_code` (String): Código del evento
- `date` (String): Fecha YYYY-MM-DD
- `person` (Integer): ID de la persona
- `document_number` (String): Documento de la persona

**Ejemplos:**
```bash
# Todos los check-ins de un evento en una fecha
GET /api/daily-attendance/?event_code=CONF2026&date=2026-02-18

# Check-ins de una persona
GET /api/daily-attendance/?document_number=15081307-7
```

**Response:**
```json
{
  "count": 45,
  "results": [
    {
      "id": 123,
      "person": {
        "id": 1,
        "full_name": "Juan Pérez",
        "document_number": "15081307-7"
      },
      "event": {
        "id": 5,
        "code": "CONF2026",
        "name": "Conferencia Anual"
      },
      "attendance_date": "2026-02-18",
      "check_in_time": "2026-02-18T08:30:00Z",
      "check_out_time": "2026-02-18T18:00:00Z",
      "duration": "9h 30m",
      "check_in_by": "admin",
      "notes": null
    }
  ]
}
```

---

### 5. Obtener Eventos (con check_in_required)

```
GET /api/events/
GET /api/events/{id}/
```

**Response incluye:**
```json
{
  "id": 1,
  "code": "CONF2026",
  "name": "Conferencia Anual",
  "check_in_required": true,  // ⭐ NUEVO
  "status": "active",
  "date_start": "2026-02-20T09:00:00Z",
  "date_end": "2026-02-20T18:00:00Z",
  ...
}
```

**Filtrar por modo:**
```bash
# Solo eventos con check-in obligatorio
GET /api/events/?check_in_required=true

# Solo eventos con check-in automático
GET /api/events/?check_in_required=false
```

---

### 6. Redeem Ticket (Actualizado)

```
POST /api/redeem-ticket/
```

**Request:**
```json
{
  "ticket_number": "CONF-20260218-12345"
}
```

**Response Success (Modo Restrictivo):**
```json
{
  "success": true,
  "message": "Ticket canjeado exitosamente",
  "ticket_number": "CONF-20260218-12345",
  "service": "Desayuno",
  "person": "Juan Pérez",
  "redeemed_at": "2026-02-18T09:00:00Z",
  "auto_check_in": false
}
```

**Response Success (Modo Permisivo con auto check-in):**
```json
{
  "success": true,
  "message": "Ticket canjeado exitosamente",
  "ticket_number": "LUNCH-20260218-67890",
  "service": "Almuerzo",
  "person": "Juan Pérez",
  "redeemed_at": "2026-02-18T13:00:00Z",
  "auto_check_in": true  // ⭐ Se creó check-in automático
}
```

**Response Error (Modo Restrictivo sin check-in):**
```json
{
  "error": "Debe realizar check-in antes de canjear tickets",
  "check_in_required": true,
  "message": "Por favor diríjase a recepción para hacer check-in"
}
```
**Status:** 403 Forbidden

---

## Interfaces TypeScript

```typescript
// interfaces/daily-attendance.interface.ts

export interface DailyAttendance {
  id: number;
  person: PersonSummary;
  event: EventSummary;
  attendance_date: string;
  check_in_time: string;
  check_out_time: string | null;
  duration: string | null;
  check_in_by: string;
  notes: string | null;
}

export interface PersonSummary {
  id: number;
  full_name: string;
  document_number: string;
  email: string;
}

export interface EventSummary {
  id: number;
  code: string;
  name: string;
}

export interface CheckInRequest {
  document_number: string;
  event_code: string;
  date?: string;
}

export interface CheckInResponse {
  success: boolean;
  message: string;
  data?: DailyAttendance;
  error?: string;
  existing_check_in?: {
    attendance_date: string;
    check_in_time: string;
  };
}

export interface CheckInVerification {
  has_check_in: boolean;
  check_in_time?: string;
  check_out_time?: string;
  can_redeem_tickets: boolean;
  message?: string;
}

export interface Event {
  id: number;
  code: string;
  name: string;
  organization: number;
  organization_name: string;
  check_in_required: boolean;  // ⭐ NUEVO
  status: string;
  computed_status: string;
  date_start: string;
  date_end: string;
  location: string;
  max_capacity: number;
  // ... otros campos
}

export interface RedeemTicketResponse {
  success: boolean;
  message: string;
  ticket_number: string;
  service: string;
  person: string;
  redeemed_at: string;
  auto_check_in: boolean;  // ⭐ NUEVO
  error?: string;
  check_in_required?: boolean;
}
```

---

## Servicios HTTP

### DailyAttendanceService

```typescript
// services/daily-attendance.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  DailyAttendance, 
  CheckInRequest, 
  CheckInResponse,
  CheckInVerification 
} from '../interfaces/daily-attendance.interface';

@Injectable({
  providedIn: 'root'
})
export class DailyAttendanceService {
  private apiUrl = 'https://ticket-services.favric.cl/api';

  constructor(private http: HttpClient) {}

  /**
   * Realizar check-in de una persona
   */
  checkIn(request: CheckInRequest): Observable<CheckInResponse> {
    return this.http.post<CheckInResponse>(
      `${this.apiUrl}/check-in/`,
      request
    );
  }

  /**
   * Realizar check-out de una persona
   */
  checkOut(request: CheckInRequest): Observable<CheckInResponse> {
    return this.http.post<CheckInResponse>(
      `${this.apiUrl}/check-out/`,
      request
    );
  }

  /**
   * Verificar si una persona tiene check-in
   */
  verifyCheckIn(
    documentNumber: string,
    eventCode: string,
    date?: string
  ): Observable<CheckInVerification> {
    let params = new HttpParams()
      .set('document_number', documentNumber)
      .set('event_code', eventCode);
    
    if (date) {
      params = params.set('date', date);
    }
    
    return this.http.get<CheckInVerification>(
      `${this.apiUrl}/check-in/verify/`,
      { params }
    );
  }

  /**
   * Obtener asistencias de un evento en una fecha
   */
  getEventAttendance(
    eventCode: string,
    date: string
  ): Observable<{ count: number; results: DailyAttendance[] }> {
    const params = new HttpParams()
      .set('event_code', eventCode)
      .set('date', date);
    
    return this.http.get<{ count: number; results: DailyAttendance[] }>(
      `${this.apiUrl}/daily-attendance/`,
      { params }
    );
  }

  /**
   * Obtener asistencias de una persona
   */
  getPersonAttendance(
    documentNumber: string,
    eventCode?: string
  ): Observable<{ count: number; results: DailyAttendance[] }> {
    let params = new HttpParams().set('document_number', documentNumber);
    
    if (eventCode) {
      params = params.set('event_code', eventCode);
    }
    
    return this.http.get<{ count: number; results: DailyAttendance[] }>(
      `${this.apiUrl}/daily-attendance/`,
      { params }
    );
  }
}
```

---

### TicketService (Actualizado)

```typescript
// services/ticket.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RedeemTicketResponse } from '../interfaces/daily-attendance.interface';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private apiUrl = 'https://ticket-services.favric.cl/api';

  constructor(private http: HttpClient) {}

  /**
   * Canjear un ticket
   * Maneja automáticamente los modos de check-in
   */
  redeemTicket(ticketNumber: string): Observable<RedeemTicketResponse> {
    return this.http.post<RedeemTicketResponse>(
      `${this.apiUrl}/redeem-ticket/`,
      { ticket_number: ticketNumber }
    ).pipe(
      catchError(error => {
        // Manejar error de check-in requerido
        if (error.status === 403 && error.error.check_in_required) {
          console.log('Check-in requerido:', error.error.message);
        }
        return throwError(() => error);
      })
    );
  }
}
```

---

## Componentes

### 1. Componente de Check-in

```typescript
// components/check-in/check-in.component.ts

import { Component } from '@angular/core';
import { DailyAttendanceService } from '../../services/daily-attendance.service';
import { CheckInRequest, CheckInResponse } from '../../interfaces/daily-attendance.interface';

@Component({
  selector: 'app-check-in',
  templateUrl: './check-in.component.html'
})
export class CheckInComponent {
  documentNumber = '';
  eventCode = '';
  loading = false;
  message: string | null = null;
  messageType: 'success' | 'error' | null = null;

  constructor(private dailyAttendanceService: DailyAttendanceService) {}

  performCheckIn() {
    if (!this.documentNumber || !this.eventCode) {
      this.showMessage('Ingrese documento y código de evento', 'error');
      return;
    }

    this.loading = true;
    this.message = null;

    const request: CheckInRequest = {
      document_number: this.documentNumber,
      event_code: this.eventCode
    };

    this.dailyAttendanceService.checkIn(request).subscribe({
      next: (response: CheckInResponse) => {
        this.loading = false;
        
        if (response.success) {
          this.showMessage(response.message, 'success');
          this.playSuccessSound();
          this.documentNumber = '';
          console.log('Check-in exitoso:', response.data);
        } else {
          this.showMessage(response.error || 'Error al hacer check-in', 'error');
          this.playErrorSound();
        }
      },
      error: (error) => {
        this.loading = false;
        this.showMessage('Error de conexión', 'error');
        this.playErrorSound();
        console.error('Error:', error);
      }
    });
  }

  showMessage(text: string, type: 'success' | 'error') {
    this.message = text;
    this.messageType = type;
    
    setTimeout(() => {
      this.message = null;
      this.messageType = null;
    }, 3000);
  }

  playSuccessSound() {
    const audio = new Audio('assets/sounds/success.mp3');
    audio.play().catch(() => {});
  }

  playErrorSound() {
    const audio = new Audio('assets/sounds/error.mp3');
    audio.play().catch(() => {});
  }
}
```

**Template:**
```html
<!-- check-in.component.html -->

<div class="check-in-container">
  <div class="check-in-card">
    <h2>Check-in del Día</h2>
    
    <form (ngSubmit)="performCheckIn()" class="check-in-form">
      <!-- Campo de documento -->
      <div class="form-field">
        <label>Número de Documento</label>
        <input 
          type="text"
          [(ngModel)]="documentNumber"
          name="documentNumber"
          placeholder="Ej: 15081307-7"
          [disabled]="loading"
          autofocus>
      </div>

      <!-- Campo de código de evento -->
      <div class="form-field">
        <label>Código del Evento</label>
        <input 
          type="text"
          [(ngModel)]="eventCode"
          name="eventCode"
          placeholder="Ej: CONF2026"
          [disabled]="loading">
      </div>

      <!-- Botón -->
      <button 
        type="submit"
        [disabled]="loading"
        class="btn-primary">
        <span *ngIf="!loading">✓ Realizar Check-in</span>
        <span *ngIf="loading">Procesando...</span>
      </button>
    </form>

    <!-- Mensaje -->
    <div 
      *ngIf="message" 
      class="message"
      [class.success]="messageType === 'success'"
      [class.error]="messageType === 'error'">
      <span>{{ message }}</span>
    </div>
  </div>
</div>

<!-- NOTA: Aplicar estilos según la UI del sitio -->
```

---

### 2. Componente de Redeem Ticket (Actualizado)

```typescript
// components/redeem-ticket/redeem-ticket.component.ts

import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TicketService } from '../../services/ticket.service';
import { RedeemTicketResponse } from '../../interfaces/daily-attendance.interface';

@Component({
  selector: 'app-redeem-ticket',
  templateUrl: './redeem-ticket.component.html'
})
export class RedeemTicketComponent {
  ticketNumber = '';
  loading = false;
  message: string | null = null;
  messageType: 'success' | 'error' | 'warning' | null = null;

  constructor(
    private ticketService: TicketService,
    private router: Router
  ) {}

  redeemTicket() {
    if (!this.ticketNumber) {
      this.showMessage('Ingrese el número de ticket', 'error');
      return;
    }

    this.loading = true;
    this.message = null;

    this.ticketService.redeemTicket(this.ticketNumber).subscribe({
      next: (response: RedeemTicketResponse) => {
        this.loading = false;
        
        if (response.success) {
          // Verificar si hubo check-in automático
          if (response.auto_check_in) {
            this.showMessage(
              'Ticket canjeado. Check-in realizado automáticamente.',
              'success'
            );
          } else {
            this.showMessage('Ticket canjeado exitosamente', 'success');
          }
          
          this.playSuccessSound();
          this.ticketNumber = '';
          console.log('Ticket canjeado:', response);
        } else {
          this.showMessage(response.error || 'Error al canjear', 'error');
          this.playErrorSound();
        }
      },
      error: (error) => {
        this.loading = false;
        
        // Manejar error de check-in requerido
        if (error.status === 403 && error.error.check_in_required) {
          this.showMessage(error.error.message, 'warning');
          
          // Redirigir a check-in después de 2 segundos
          setTimeout(() => {
            this.router.navigate(['/check-in']);
          }, 2000);
        } else {
          this.showMessage('Error al canjear ticket', 'error');
        }
        
        this.playErrorSound();
        console.error('Error:', error);
      }
    });
  }

  showMessage(text: string, type: 'success' | 'error' | 'warning') {
    this.message = text;
    this.messageType = type;
    
    setTimeout(() => {
      this.message = null;
      this.messageType = null;
    }, 3000);
  }

  playSuccessSound() {
    const audio = new Audio('assets/sounds/success.mp3');
    audio.play().catch(() => {});
  }

  playErrorSound() {
    const audio = new Audio('assets/sounds/error.mp3');
    audio.play().catch(() => {});
  }
}
```

**Template:**
```html
<!-- redeem-ticket.component.html -->

<div class="redeem-container">
  <div class="redeem-card">
    <h2>Canjear Ticket</h2>
    
    <form (ngSubmit)="redeemTicket()" class="redeem-form">
      <div class="form-field">
        <label>Número de Ticket</label>
        <input 
          type="text"
          [(ngModel)]="ticketNumber"
          name="ticketNumber"
          placeholder="Ej: CONF-20260218-12345"
          [disabled]="loading"
          autofocus>
      </div>

      <button 
        type="submit"
        [disabled]="loading"
        class="btn-primary">
        <span *ngIf="!loading">✓ Canjear Ticket</span>
        <span *ngIf="loading">Procesando...</span>
      </button>
    </form>

    <!-- Mensaje -->
    <div 
      *ngIf="message" 
      class="message"
      [class.success]="messageType === 'success'"
      [class.error]="messageType === 'error'"
      [class.warning]="messageType === 'warning'">
      <span>{{ message }}</span>
    </div>
  </div>
</div>

<!-- NOTA: Aplicar estilos según la UI del sitio -->
```

---

### 3. Componente de Configuración de Evento

```typescript
// components/event-config/event-config.component.ts

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EventService } from '../../services/event.service';
import { Event } from '../../interfaces/daily-attendance.interface';

@Component({
  selector: 'app-event-config',
  templateUrl: './event-config.component.html'
})
export class EventConfigComponent implements OnInit {
  eventForm: FormGroup;
  loading = false;
  message: string | null = null;

  constructor(
    private fb: FormBuilder,
    private eventService: EventService
  ) {
    this.eventForm = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      organization: [null, Validators.required],
      check_in_required: [false]  // ⭐ NUEVO
    });
  }

  ngOnInit() {}

  onSubmit() {
    if (this.eventForm.invalid) {
      this.showMessage('Complete todos los campos requeridos');
      return;
    }

    this.loading = true;
    const eventData = this.eventForm.value;

    this.eventService.createEvent(eventData).subscribe({
      next: (response: Event) => {
        this.loading = false;
        const mode = response.check_in_required ? 'restrictivo' : 'permisivo';
        this.showMessage(`Evento creado en modo ${mode}`);
        this.eventForm.reset({ check_in_required: false });
      },
      error: (error) => {
        this.loading = false;
        this.showMessage('Error al crear evento');
        console.error('Error:', error);
      }
    });
  }

  showMessage(text: string) {
    this.message = text;
    setTimeout(() => {
      this.message = null;
    }, 3000);
  }
}
```

**Template:**
```html
<!-- event-config.component.html -->

<div class="event-config-container">
  <h2>Configurar Evento</h2>
  
  <form [formGroup]="eventForm" (ngSubmit)="onSubmit()">
    <div class="form-field">
      <label>Código *</label>
      <input type="text" formControlName="code">
    </div>

    <div class="form-field">
      <label>Nombre *</label>
      <input type="text" formControlName="name">
    </div>

    <div class="form-field">
      <label>Organización *</label>
      <select formControlName="organization">
        <option value="">Seleccione...</option>
        <!-- Cargar organizaciones dinámicamente -->
      </select>
    </div>

    <!-- ⭐ NUEVO: Toggle para modo de check-in -->
    <div class="form-field checkbox-field">
      <label>
        <input type="checkbox" formControlName="check_in_required">
        <span class="checkbox-label">
          <span class="icon">{{ eventForm.value.check_in_required ? '🔒' : '🔓' }}</span>
          Check-in obligatorio
        </span>
      </label>
      
      <div class="help-text">
        <span *ngIf="eventForm.value.check_in_required">
          🔒 Los asistentes deben hacer check-in en recepción antes de usar servicios
        </span>
        <span *ngIf="!eventForm.value.check_in_required">
          🔓 El check-in se realizará automáticamente al usar el primer servicio
        </span>
      </div>
    </div>

    <button type="submit" [disabled]="loading" class="btn-primary">
      {{ loading ? 'Creando...' : 'Crear Evento' }}
    </button>
  </form>

  <div *ngIf="message" class="message">{{ message }}</div>
</div>

<!-- NOTA: Aplicar estilos según la UI del sitio -->
```

---

## Flujos Completos

### Flujo 1: Evento Restrictivo

```typescript
// 1. Crear evento restrictivo
const event = {
  code: 'CONF2026',
  name: 'Conferencia Anual',
  organization: 1,
  check_in_required: true  // 🔒
};

eventService.createEvent(event).subscribe();

// 2. Persona llega al evento
checkInService.checkIn({
  document_number: '15081307-7',
  event_code: 'CONF2026'
}).subscribe(response => {
  console.log('Check-in exitoso');
});

// 3. Persona va al desayuno
ticketService.redeemTicket('CONF-20260218-12345').subscribe(response => {
  console.log('Ticket canjeado');
  console.log('Auto check-in:', response.auto_check_in);  // false
});

// 4. Si intenta canjear sin check-in previo
ticketService.redeemTicket('CONF-20260218-67890').subscribe({
  error: (error) => {
    if (error.status === 403) {
      console.log('Debe hacer check-in primero');
      router.navigate(['/check-in']);
    }
  }
});
```

---

### Flujo 2: Evento Permisivo

```typescript
// 1. Crear evento permisivo
const event = {
  code: 'LUNCH2026',
  name: 'Almuerzo Mensual',
  organization: 1,
  check_in_required: false  // 🔓
};

eventService.createEvent(event).subscribe();

// 2. Persona va directo al almuerzo (sin check-in previo)
ticketService.redeemTicket('LUNCH-20260218-12345').subscribe(response => {
  console.log('Ticket canjeado');
  console.log('Auto check-in:', response.auto_check_in);  // true
  
  if (response.auto_check_in) {
    console.log('Check-in creado automáticamente');
  }
});

// 3. Verificar que ahora tiene check-in
checkInService.verifyCheckIn('15081307-7', 'LUNCH2026').subscribe(result => {
  console.log('Tiene check-in:', result.has_check_in);  // true
});
```

---

### Flujo 3: Verificar Check-in Antes de Canjear

```typescript
// Verificar primero si tiene check-in
checkInService.verifyCheckIn(
  documentNumber,
  eventCode
).subscribe(verification => {
  if (verification.can_redeem_tickets) {
    // Puede canjear
    ticketService.redeemTicket(ticketNumber).subscribe();
  } else {
    // Debe hacer check-in primero
    console.log(verification.message);
    router.navigate(['/check-in']);
  }
});
```

---

### Flujo 4: Reportes de Asistencia

```typescript
// Obtener asistencias del día
checkInService.getEventAttendance('CONF2026', '2026-02-18')
  .subscribe(response => {
    console.log(`Total check-ins: ${response.count}`);
    
    response.results.forEach(attendance => {
      console.log(`${attendance.person.full_name} - ${attendance.check_in_time}`);
    });
  });

// Historial de una persona
checkInService.getPersonAttendance('15081307-7')
  .subscribe(response => {
    console.log(`Asistencias totales: ${response.count}`);
    
    response.results.forEach(attendance => {
      console.log(`${attendance.event.name} - ${attendance.attendance_date}`);
    });
  });
```

---

## Puntos Clave

### 1. DailyAttendance vs TicketUsage

- **DailyAttendance** = Check-in del día (1 por persona por día)
- **TicketUsage** = Uso de servicios (N por persona por día)
- Son independientes pero relacionados

### 2. Dos Modos de Check-in

- **`check_in_required = true`** 🔒 Restrictivo
  - Check-in obligatorio antes de canjear
  - Error 403 si intenta canjear sin check-in
  
- **`check_in_required = false`** 🔓 Permisivo
  - Check-in automático al canjear
  - `response.auto_check_in = true`

### 3. Manejo de Errores

```typescript
// Siempre manejar error 403 de check-in requerido
ticketService.redeemTicket(ticketNumber).subscribe({
  error: (error) => {
    if (error.status === 403 && error.error.check_in_required) {
      // Redirigir a check-in
      this.router.navigate(['/check-in']);
    }
  }
});
```

### 4. Verificar Check-in

```typescript
// Antes de canjear, verificar si puede
checkInService.verifyCheckIn(document, eventCode).subscribe(result => {
  if (result.can_redeem_tickets) {
    // Puede canjear
  } else {
    // Debe hacer check-in primero
  }
});
```

### 5. Estados de TicketUsage

- `pending` → Aún no usa el servicio
- `redeemed` → Usó el servicio
- `skipped` → No usó el servicio
- **NO existe** `checked_in`

### 6. Check-in NO modifica TicketUsage

- Check-in solo crea `DailyAttendance`
- `TicketUsage` se modifica al canjear cada servicio

### 7. Unique Constraint

- Solo puede haber 1 `DailyAttendance` por persona por día
- Si intenta check-in duplicado → Error

### 8. Auto Check-in

- Solo ocurre en modo permisivo
- Se crea al canjear el primer ticket del día
- `response.auto_check_in = true`

---

## Notas de Implementación

### Estilos CSS

**IMPORTANTE:** Los estilos CSS deben aplicarse según la UI del sitio. Los componentes incluyen clases básicas pero los estilos específicos (colores, tipografía, espaciado) deben adaptarse al diseño existente.

### Sonidos

Los componentes incluyen reproducción de sonidos de éxito/error. Asegúrate de tener los archivos:
- `assets/sounds/success.mp3`
- `assets/sounds/error.mp3`

O elimina las llamadas a `playSuccessSound()` y `playErrorSound()` si no los necesitas.

### Rutas

Ajusta las rutas de navegación según tu configuración:
```typescript
this.router.navigate(['/check-in']);
```

### API URL

Actualiza la URL base según tu entorno:
```typescript
private apiUrl = 'https://ticket-services.favric.cl/api';
```

---

## Resumen

### Modelos Backend
- ✅ `DailyAttendance` - Check-in diario
- ✅ `Event.check_in_required` - Modo de check-in
- ✅ `TicketUsage` - Uso de servicios

### APIs Implementadas
- ✅ `POST /api/check-in/` - Check-in manual
- ✅ `POST /api/check-out/` - Check-out
- ✅ `GET /api/check-in/verify/` - Verificar check-in
- ✅ `GET /api/daily-attendance/` - Listar asistencias
- ✅ `GET /api/events/` - Obtener eventos (con check_in_required)
- ✅ `POST /api/redeem-ticket/` - Canjear ticket (actualizado)

### Componentes Angular
- ✅ CheckInComponent - Check-in manual
- ✅ RedeemTicketComponent - Canjear tickets
- ✅ EventConfigComponent - Configurar eventos

### Servicios
- ✅ DailyAttendanceService - Gestión de check-ins
- ✅ TicketService - Canjear tickets

---

**Última actualización:** 18 de Febrero de 2026  
**Versión:** 1.0  
**Autor:** Sistema de Tickets FVX
