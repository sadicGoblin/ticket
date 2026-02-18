# 📋 API Person Events - Documentación Completa

**Versión:** 2.0  
**Fecha:** 18 de Febrero de 2026  
**Endpoint:** `/api/person-events/`

---

## 🎯 Propósito

API que devuelve todos los **eventos activos** de una persona para un día específico, incluyendo:
- Información de la persona
- Eventos donde está registrada
- Tickets de cada evento
- **Estado real de cada ticket (TicketUsage)**
- Servicios disponibles

---

## 📍 Endpoint

```
GET /api/person-events/
```

**Base URL:** `https://ticket-services.favric.cl`

---

## 🔑 Parámetros

| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
|-----------|------|-----------|-------------|---------|
| `document_number` | string | ✅ Sí | Número de documento de la persona | `15081307-7` |
| `date` | string | ❌ No | Fecha en formato YYYY-MM-DD (default: hoy) | `2026-02-18` |

---

## 📤 Ejemplos de Request

### **Ejemplo 1: Eventos de hoy**
```bash
GET https://ticket-services.favric.cl/api/person-events/?document_number=15081307-7
```

### **Ejemplo 2: Eventos de una fecha específica**
```bash
GET https://ticket-services.favric.cl/api/person-events/?document_number=15081307-7&date=2026-02-20
```

---

## 📥 Estructura de Respuesta

```json
{
  "person": { /* Información de la persona */ },
  "date": "2026-02-18",
  "events_count": 2,
  "events": [ /* Array de eventos */ ]
}
```

---

## 📊 Respuesta Completa (Ejemplo)

```json
{
  "person": {
    "id": 1,
    "first_name": "Juan",
    "last_name": "Pérez",
    "full_name": "Juan Pérez",
    "email": "juan.perez@example.com",
    "phone": "+56912345678",
    "document_type": "RUT",
    "document_number": "15081307-7",
    "company": "Empresa XYZ",
    "position": "Gerente",
    "photo": "https://example.com/photos/juan.jpg"
  },
  "date": "2026-02-18",
  "events_count": 2,
  "events": [
    {
      "id": 1,
      "code": "EV001",
      "name": "Capacitación Anual",
      "slug": "capacitacion-anual",
      "description": "Capacitación obligatoria para todo el personal",
      "image": "https://example.com/events/ev001.jpg",
      "organization": 1,
      "organization_name": "Empresa XYZ",
      "date_start": "2026-02-18T09:00:00Z",
      "date_end": "2026-02-18T18:00:00Z",
      "location": "Sala de Conferencias A",
      "max_capacity": 50,
      "status": "active",
      "is_active_event": true,
      
      "attendee_info": {
        "id": 10,
        "role": "attendee",
        "status": "confirmed",
        "registration_date": "2026-02-15T10:00:00Z",
        "confirmation_date": "2026-02-16T14:30:00Z",
        "check_in_date": null,
        "badge_number": "A-001"
      },
      
      "services": [
        {
          "id": 1,
          "name": "Desayuno",
          "code": "DES",
          "description": "Desayuno continental",
          "color": "#ffc107",
          "time_from": "08:30:00",
          "time_to": "09:00:00",
          "icon": null,
          "priority": "high",
          "estimated_time": 30,
          "is_active": true,
          "order": 1
        },
        {
          "id": 2,
          "name": "Almuerzo",
          "code": "ALM",
          "description": "Almuerzo buffet",
          "color": "#28a745",
          "time_from": "13:00:00",
          "time_to": "14:00:00",
          "icon": null,
          "priority": "high",
          "estimated_time": 60,
          "is_active": true,
          "order": 2
        }
      ],
      
      "person_tickets": [
        {
          "id": 100,
          "ticket_number": "EV0-20260218-12345",
          "service": {
            "id": 1,
            "name": "Desayuno",
            "code": "DES",
            "description": "Desayuno continental",
            "color": "#ffc107",
            "time_from": "08:30:00",
            "time_to": "09:00:00",
            "icon": null,
            "priority": "high",
            "estimated_time": 30,
            "is_active": true,
            "order": 1
          },
          "subject": null,
          "description": null,
          "status": "pending",
          "priority": "medium",
          "due_date": null,
          "is_overdue": false,
          
          "usages": [
            {
              "id": 200,
              "usage_date": "2026-02-18",
              "status": "redeemed",
              "redeemed_at": "2026-02-18T08:45:00Z",
              "redeemed_by": 5,
              "redeemed_by_username": "admin",
              "redeemed_by_full_name": "María Administradora",
              "notes": "Canjeado en punto de control principal",
              "created": "2026-02-15T10:00:00Z",
              "modified": "2026-02-18T08:45:00Z"
            },
            {
              "id": 201,
              "usage_date": "2026-02-19",
              "status": "pending",
              "redeemed_at": null,
              "redeemed_by": null,
              "redeemed_by_username": null,
              "redeemed_by_full_name": null,
              "notes": null,
              "created": "2026-02-15T10:00:00Z",
              "modified": "2026-02-15T10:00:00Z"
            }
          ],
          
          "current_usage": {
            "id": 200,
            "usage_date": "2026-02-18",
            "status": "redeemed",
            "redeemed_at": "2026-02-18T08:45:00Z",
            "redeemed_by": 5,
            "redeemed_by_username": "admin",
            "redeemed_by_full_name": "María Administradora",
            "notes": "Canjeado en punto de control principal",
            "created": "2026-02-15T10:00:00Z",
            "modified": "2026-02-18T08:45:00Z"
          },
          
          "created": "2026-02-15T10:00:00Z",
          "modified": "2026-02-18T08:45:00Z"
        },
        {
          "id": 101,
          "ticket_number": "EV0-20260218-67890",
          "service": {
            "id": 2,
            "name": "Almuerzo",
            "code": "ALM",
            "description": "Almuerzo buffet",
            "color": "#28a745",
            "time_from": "13:00:00",
            "time_to": "14:00:00",
            "icon": null,
            "priority": "high",
            "estimated_time": 60,
            "is_active": true,
            "order": 2
          },
          "subject": null,
          "description": null,
          "status": "pending",
          "priority": "medium",
          "due_date": null,
          "is_overdue": false,
          
          "usages": [
            {
              "id": 202,
              "usage_date": "2026-02-18",
              "status": "pending",
              "redeemed_at": null,
              "redeemed_by": null,
              "redeemed_by_username": null,
              "redeemed_by_full_name": null,
              "notes": null,
              "created": "2026-02-15T10:00:00Z",
              "modified": "2026-02-15T10:00:00Z"
            }
          ],
          
          "current_usage": {
            "id": 202,
            "usage_date": "2026-02-18",
            "status": "pending",
            "redeemed_at": null,
            "redeemed_by": null,
            "redeemed_by_username": null,
            "redeemed_by_full_name": null,
            "notes": null,
            "created": "2026-02-15T10:00:00Z",
            "modified": "2026-02-15T10:00:00Z"
          },
          
          "created": "2026-02-15T10:00:00Z",
          "modified": "2026-02-15T10:00:00Z"
        }
      ]
    }
  ]
}
```

---

## 🔍 Descripción de Campos

### **Nivel 1: Root**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `person` | Object | Información completa de la persona |
| `date` | String | Fecha consultada (YYYY-MM-DD) |
| `events_count` | Integer | Cantidad de eventos encontrados |
| `events` | Array | Lista de eventos activos para esa fecha |

---

### **Nivel 2: Person**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | Integer | ID de la persona |
| `first_name` | String | Nombre |
| `last_name` | String | Apellido |
| `full_name` | String | Nombre completo |
| `email` | String | Email |
| `phone` | String | Teléfono |
| `document_type` | String | Tipo de documento |
| `document_number` | String | Número de documento |
| `company` | String | Empresa |
| `position` | String | Cargo |
| `photo` | String | URL de la foto |

---

### **Nivel 3: Event**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | Integer | ID del evento |
| `code` | String | Código único del evento |
| `name` | String | Nombre del evento |
| `slug` | String | Slug para URLs |
| `description` | String | Descripción |
| `image` | String | URL de la imagen |
| `organization` | Integer | ID de la organización |
| `organization_name` | String | Nombre de la organización |
| `date_start` | String | Fecha/hora de inicio (ISO 8601) |
| `date_end` | String | Fecha/hora de fin (ISO 8601) |
| `location` | String | Ubicación |
| `max_capacity` | Integer | Capacidad máxima |
| `status` | String | Estado manual del evento |
| `is_active_event` | Boolean | Si el evento está activo ahora |
| `attendee_info` | Object | Información del asistente |
| `services` | Array | Servicios disponibles |
| `person_tickets` | Array | **Tickets de la persona** |

---

### **Nivel 4: Attendee Info**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | Integer | ID del registro de asistente |
| `role` | String | Rol (attendee, organizer, speaker, sponsor) |
| `status` | String | Estado (registered, confirmed, attended, cancelled) |
| `registration_date` | String | Fecha de registro |
| `confirmation_date` | String | Fecha de confirmación |
| `check_in_date` | String | Fecha de check-in |
| `badge_number` | String | Número de credencial |

---

### **Nivel 5: Service**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | Integer | ID del servicio |
| `name` | String | Nombre del servicio |
| `code` | String | Código del servicio |
| `description` | String | Descripción |
| `color` | String | Color en formato hex |
| `time_from` | String | Hora de inicio (HH:MM:SS) |
| `time_to` | String | Hora de fin (HH:MM:SS) |
| `icon` | String | URL del ícono |
| `priority` | String | Prioridad (low, medium, high) |
| `estimated_time` | Integer | Tiempo estimado en minutos |
| `is_active` | Boolean | Si está activo |
| `order` | Integer | Orden de visualización |

---

### **Nivel 6: Ticket (person_tickets)** ⭐

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | Integer | ID del ticket |
| `ticket_number` | String | Número único del ticket |
| `service` | Object | Servicio asociado (objeto completo) |
| `subject` | String | Asunto |
| `description` | String | Descripción |
| `status` | String | Estado del ticket |
| `priority` | String | Prioridad |
| `due_date` | String | Fecha de vencimiento |
| `is_overdue` | Boolean | Si está vencido |
| **`usages`** | **Array** | **Todos los usos del ticket** ⭐ |
| **`current_usage`** | **Object** | **Uso de la fecha consultada** ⭐ |
| `created` | String | Fecha de creación |
| `modified` | String | Fecha de modificación |

---

### **Nivel 7: TicketUsage (usages y current_usage)** ⭐⭐⭐

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `id` | Integer | ID del uso | `200` |
| `usage_date` | String | Fecha del uso (YYYY-MM-DD) | `"2026-02-18"` |
| **`status`** | **String** | **Estado real del ticket** | `"pending"`, `"redeemed"`, `"skipped"`, `"expired"` |
| `redeemed_at` | String | Fecha/hora del canje | `"2026-02-18T08:45:00Z"` |
| `redeemed_by` | Integer | ID del usuario que canjeó | `5` |
| `redeemed_by_username` | String | Username del usuario | `"admin"` |
| `redeemed_by_full_name` | String | Nombre completo del usuario | `"María Administradora"` |
| `notes` | String | Notas adicionales | `"Canjeado en punto principal"` |
| `created` | String | Fecha de creación | `"2026-02-15T10:00:00Z"` |
| `modified` | String | Fecha de modificación | `"2026-02-18T08:45:00Z"` |

---

## 🎯 Estados de TicketUsage

| Estado | Descripción | Color Sugerido |
|--------|-------------|----------------|
| `pending` | Pendiente de canjear | 🟡 Amarillo (#ffc107) |
| `redeemed` | Ya canjeado | 🟢 Verde (#28a745) |
| `skipped` | Omitido (persona no asistió) | ⚫ Gris (#6c757d) |
| `expired` | Expirado sin usar | 🔴 Rojo (#dc3545) |

---

## 💡 Diferencia entre `usages` y `current_usage`

### **`usages` (Array)**
- Contiene **TODOS** los usos del ticket
- Útil para ver el historial completo
- Ordenado por fecha

**Ejemplo:**
```json
"usages": [
  { "usage_date": "2026-02-18", "status": "redeemed" },
  { "usage_date": "2026-02-19", "status": "pending" },
  { "usage_date": "2026-02-20", "status": "pending" }
]
```

### **`current_usage` (Object)**
- Contiene **SOLO** el uso de la fecha consultada (hoy)
- Es el **estado real actual** del ticket
- Si no existe uso para esa fecha, es `null`

**Ejemplo:**
```json
"current_usage": {
  "usage_date": "2026-02-18",
  "status": "redeemed"
}
```

---

## 🚀 Implementación en Angular

### **1. Interfaces TypeScript**

```typescript
// interfaces/person-events.interface.ts

export interface PersonEventsResponse {
  person: Person;
  date: string;
  events_count: number;
  events: EventOfTheDay[];
}

export interface Person {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  document_type: string;
  document_number: string;
  company: string;
  position: string;
  photo: string;
}

export interface EventOfTheDay {
  id: number;
  code: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  organization: number;
  organization_name: string;
  date_start: string;
  date_end: string;
  location: string;
  max_capacity: number;
  status: string;
  is_active_event: boolean;
  attendee_info: AttendeeInfo;
  services: Service[];
  person_tickets: TicketWithUsages[];
}

export interface AttendeeInfo {
  id: number;
  role: 'attendee' | 'organizer' | 'speaker' | 'sponsor';
  status: 'registered' | 'confirmed' | 'attended' | 'cancelled';
  registration_date: string;
  confirmation_date: string;
  check_in_date: string;
  badge_number: string;
}

export interface Service {
  id: number;
  name: string;
  code: string;
  description: string;
  color: string;
  time_from: string;
  time_to: string;
  icon: string;
  priority: 'low' | 'medium' | 'high';
  estimated_time: number;
  is_active: boolean;
  order: number;
}

export interface TicketWithUsages {
  id: number;
  ticket_number: string;
  service: Service;
  subject: string;
  description: string;
  status: string;
  priority: string;
  due_date: string;
  is_overdue: boolean;
  usages: TicketUsage[];        // ⭐ Todos los usos
  current_usage: TicketUsage;   // ⭐ Uso de hoy
  created: string;
  modified: string;
}

export interface TicketUsage {
  id: number;
  usage_date: string;
  status: 'pending' | 'redeemed' | 'skipped' | 'expired';
  redeemed_at: string;
  redeemed_by: number;
  redeemed_by_username: string;
  redeemed_by_full_name: string;
  notes: string;
  created: string;
  modified: string;
}
```

---

### **2. Servicio Angular**

```typescript
// services/person-events.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PersonEventsResponse } from '../interfaces/person-events.interface';

@Injectable({
  providedIn: 'root'
})
export class PersonEventsService {
  private apiUrl = 'https://ticket-services.favric.cl/api';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene los eventos de una persona para un día específico
   * @param documentNumber Número de documento de la persona
   * @param date Fecha en formato YYYY-MM-DD (opcional, default: hoy)
   */
  getPersonEvents(
    documentNumber: string, 
    date?: string
  ): Observable<PersonEventsResponse> {
    let params = new HttpParams().set('document_number', documentNumber);
    
    if (date) {
      params = params.set('date', date);
    }
    
    return this.http.get<PersonEventsResponse>(
      `${this.apiUrl}/person-events/`,
      { params }
    );
  }

  /**
   * Obtiene los eventos de hoy para una persona
   * @param documentNumber Número de documento
   */
  getTodayEvents(documentNumber: string): Observable<PersonEventsResponse> {
    return this.getPersonEvents(documentNumber);
  }
}
```

---

### **3. Componente de Ejemplo**

```typescript
// components/my-events/my-events.component.ts

import { Component, OnInit } from '@angular/core';
import { PersonEventsService } from '../../services/person-events.service';
import { PersonEventsResponse, TicketWithUsages } from '../../interfaces/person-events.interface';

@Component({
  selector: 'app-my-events',
  templateUrl: './my-events.component.html',
  styleUrls: ['./my-events.component.scss']
})
export class MyEventsComponent implements OnInit {
  personEvents: PersonEventsResponse | null = null;
  loading = false;
  error: string | null = null;

  constructor(private personEventsService: PersonEventsService) {}

  ngOnInit() {
    this.loadMyEvents();
  }

  loadMyEvents() {
    this.loading = true;
    this.error = null;
    
    // Obtener documento del usuario actual (desde auth service)
    const documentNumber = '15081307-7'; // Ejemplo
    
    this.personEventsService.getTodayEvents(documentNumber).subscribe({
      next: (response) => {
        this.personEvents = response;
        this.loading = false;
        console.log('Eventos cargados:', response);
      },
      error: (error) => {
        this.error = 'Error al cargar eventos';
        this.loading = false;
        console.error('Error:', error);
      }
    });
  }

  /**
   * Verifica si un ticket está canjeado HOY
   */
  isTicketRedeemed(ticket: TicketWithUsages): boolean {
    return ticket.current_usage?.status === 'redeemed';
  }

  /**
   * Verifica si un ticket está pendiente HOY
   */
  isTicketPending(ticket: TicketWithUsages): boolean {
    return ticket.current_usage?.status === 'pending';
  }

  /**
   * Obtiene el color del badge según el estado
   */
  getStatusColor(status: string): string {
    const colors = {
      'pending': '#ffc107',
      'redeemed': '#28a745',
      'skipped': '#6c757d',
      'expired': '#dc3545'
    };
    return colors[status] || '#6c757d';
  }

  /**
   * Obtiene el texto del estado en español
   */
  getStatusText(status: string): string {
    const texts = {
      'pending': 'Pendiente',
      'redeemed': 'Canjeado',
      'skipped': 'Omitido',
      'expired': 'Expirado'
    };
    return texts[status] || status;
  }
}
```

---

### **4. Template HTML**

```html
<!-- my-events.component.html -->

<div class="my-events-container">
  <!-- Loading -->
  <div *ngIf="loading" class="loading">
    <mat-spinner></mat-spinner>
    <p>Cargando eventos...</p>
  </div>

  <!-- Error -->
  <div *ngIf="error" class="error">
    <mat-icon>error</mat-icon>
    <p>{{ error }}</p>
  </div>

  <!-- Contenido -->
  <div *ngIf="personEvents && !loading">
    <!-- Header -->
    <div class="header">
      <h2>Mis Eventos</h2>
      <p>{{ personEvents.person.full_name }}</p>
      <p class="date">{{ personEvents.date | date:'fullDate' }}</p>
    </div>

    <!-- Sin eventos -->
    <div *ngIf="personEvents.events_count === 0" class="no-events">
      <mat-icon>event_busy</mat-icon>
      <p>No tienes eventos para hoy</p>
    </div>

    <!-- Lista de eventos -->
    <div *ngFor="let event of personEvents.events" class="event-card">
      <div class="event-header">
        <h3>{{ event.name }}</h3>
        <span class="event-code">{{ event.code }}</span>
      </div>

      <div class="event-info">
        <p><mat-icon>business</mat-icon> {{ event.organization_name }}</p>
        <p><mat-icon>place</mat-icon> {{ event.location }}</p>
        <p><mat-icon>schedule</mat-icon> 
          {{ event.date_start | date:'shortTime' }} - 
          {{ event.date_end | date:'shortTime' }}
        </p>
      </div>

      <!-- Tickets -->
      <div class="tickets-section">
        <h4>Mis Tickets</h4>
        
        <div *ngFor="let ticket of event.person_tickets" class="ticket-card">
          <div class="ticket-header">
            <div class="service-info">
              <div 
                class="service-color" 
                [style.background-color]="ticket.service.color">
              </div>
              <div>
                <h5>{{ ticket.service.name }}</h5>
                <p class="service-time">
                  {{ ticket.service.time_from | date:'shortTime' }} - 
                  {{ ticket.service.time_to | date:'shortTime' }}
                </p>
              </div>
            </div>
            
            <!-- Estado actual -->
            <div 
              class="status-badge" 
              [style.background-color]="getStatusColor(ticket.current_usage?.status)">
              {{ getStatusText(ticket.current_usage?.status) }}
            </div>
          </div>

          <div class="ticket-body">
            <p class="ticket-number">
              <mat-icon>confirmation_number</mat-icon>
              {{ ticket.ticket_number }}
            </p>

            <!-- Información del canje -->
            <div *ngIf="isTicketRedeemed(ticket)" class="redeemed-info">
              <mat-icon>check_circle</mat-icon>
              <div>
                <p><strong>Canjeado</strong></p>
                <p>{{ ticket.current_usage.redeemed_at | date:'short' }}</p>
                <p>Por: {{ ticket.current_usage.redeemed_by_full_name }}</p>
              </div>
            </div>

            <!-- Botón de acción -->
            <button 
              *ngIf="isTicketPending(ticket)"
              mat-raised-button 
              color="primary"
              (click)="showQRCode(ticket)">
              <mat-icon>qr_code</mat-icon>
              Mostrar QR
            </button>
          </div>

          <!-- Historial de usos (colapsable) -->
          <mat-expansion-panel class="usage-history">
            <mat-expansion-panel-header>
              <mat-panel-title>
                Historial de Usos ({{ ticket.usages.length }})
              </mat-panel-title>
            </mat-expansion-panel-header>
            
            <div *ngFor="let usage of ticket.usages" class="usage-item">
              <div class="usage-date">
                {{ usage.usage_date | date:'fullDate' }}
              </div>
              <div 
                class="usage-status" 
                [style.background-color]="getStatusColor(usage.status)">
                {{ getStatusText(usage.status) }}
              </div>
              <div *ngIf="usage.status === 'redeemed'" class="usage-details">
                <small>
                  {{ usage.redeemed_at | date:'short' }} - 
                  {{ usage.redeemed_by_full_name }}
                </small>
              </div>
            </div>
          </mat-expansion-panel>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

## 🎨 Estilos SCSS

```scss
// my-events.component.scss

.my-events-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.loading, .error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  
  mat-icon {
    font-size: 48px;
    width: 48px;
    height: 48px;
    margin-bottom: 16px;
  }
}

.header {
  text-align: center;
  margin-bottom: 32px;
  
  h2 {
    margin: 0;
    font-size: 28px;
  }
  
  .date {
    color: #666;
    font-size: 14px;
  }
}

.event-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 24px;
  margin-bottom: 24px;
  
  .event-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    
    h3 {
      margin: 0;
      font-size: 24px;
    }
    
    .event-code {
      background: #f0f0f0;
      padding: 4px 12px;
      border-radius: 4px;
      font-family: monospace;
    }
  }
  
  .event-info {
    display: flex;
    gap: 24px;
    margin-bottom: 24px;
    
    p {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      color: #666;
      
      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }
  }
}

.tickets-section {
  h4 {
    margin: 0 0 16px 0;
    font-size: 18px;
  }
}

.ticket-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  
  .ticket-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    
    .service-info {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .service-color {
        width: 4px;
        height: 48px;
        border-radius: 2px;
      }
      
      h5 {
        margin: 0;
        font-size: 16px;
      }
      
      .service-time {
        margin: 4px 0 0 0;
        font-size: 12px;
        color: #666;
      }
    }
    
    .status-badge {
      padding: 6px 16px;
      border-radius: 20px;
      color: white;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
  }
  
  .ticket-body {
    .ticket-number {
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: monospace;
      font-size: 14px;
      margin: 0 0 12px 0;
    }
    
    .redeemed-info {
      display: flex;
      gap: 12px;
      padding: 12px;
      background: #d4edda;
      border-radius: 6px;
      margin-bottom: 12px;
      
      mat-icon {
        color: #28a745;
      }
      
      p {
        margin: 0;
        font-size: 13px;
      }
    }
  }
}

.usage-history {
  margin-top: 12px;
  
  .usage-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 0;
    border-bottom: 1px solid #e0e0e0;
    
    &:last-child {
      border-bottom: none;
    }
    
    .usage-date {
      flex: 1;
      font-size: 14px;
    }
    
    .usage-status {
      padding: 4px 12px;
      border-radius: 12px;
      color: white;
      font-size: 11px;
      font-weight: bold;
    }
    
    .usage-details {
      font-size: 12px;
      color: #666;
    }
  }
}

.no-events {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  
  mat-icon {
    font-size: 64px;
    width: 64px;
    height: 64px;
    margin-bottom: 16px;
  }
}
```

---

## 🎯 Puntos Clave para la IA de Angular

### **1. Estado Real del Ticket**

El **estado real** del ticket para HOY está en:
```typescript
ticket.current_usage.status
```

**NO** uses `ticket.status`, usa `ticket.current_usage.status`

### **2. Verificar si está Canjeado**

```typescript
const isRedeemed = ticket.current_usage?.status === 'redeemed';
```

### **3. Verificar si está Pendiente**

```typescript
const isPending = ticket.current_usage?.status === 'pending';
```

### **4. Información del Canje**

Si el ticket está canjeado, obtén la información de:
```typescript
ticket.current_usage.redeemed_at         // Cuándo
ticket.current_usage.redeemed_by_full_name // Quién
```

### **5. Historial Completo**

Para ver todos los usos (pasados y futuros):
```typescript
ticket.usages.forEach(usage => {
  console.log(`${usage.usage_date}: ${usage.status}`);
});
```

### **6. Manejo de Null**

`current_usage` puede ser `null` si no hay uso para esa fecha:
```typescript
if (ticket.current_usage) {
  // Hay uso para hoy
} else {
  // No hay uso para hoy
}
```

---

## 📝 Casos de Uso Comunes

### **Caso 1: Mostrar Solo Tickets Pendientes**

```typescript
const pendingTickets = event.person_tickets.filter(
  ticket => ticket.current_usage?.status === 'pending'
);
```

### **Caso 2: Contar Tickets Canjeados**

```typescript
const redeemedCount = event.person_tickets.filter(
  ticket => ticket.current_usage?.status === 'redeemed'
).length;
```

### **Caso 3: Mostrar Próximos Usos**

```typescript
const futureUsages = ticket.usages.filter(
  usage => new Date(usage.usage_date) > new Date() && 
           usage.status === 'pending'
);
```

### **Caso 4: Verificar si Puede Canjear**

```typescript
canRedeem(ticket: TicketWithUsages): boolean {
  return ticket.current_usage?.status === 'pending';
}
```

---

## ⚠️ Errores Comunes

### **❌ Error 1: Usar ticket.status en lugar de current_usage.status**

```typescript
// ❌ INCORRECTO
if (ticket.status === 'redeemed') { }

// ✅ CORRECTO
if (ticket.current_usage?.status === 'redeemed') { }
```

### **❌ Error 2: No verificar null**

```typescript
// ❌ INCORRECTO
const status = ticket.current_usage.status; // Puede ser null

// ✅ CORRECTO
const status = ticket.current_usage?.status || 'unknown';
```

### **❌ Error 3: Confundir usages con current_usage**

```typescript
// ❌ INCORRECTO - usages es un array
if (ticket.usages.status === 'redeemed') { }

// ✅ CORRECTO - current_usage es un objeto
if (ticket.current_usage?.status === 'redeemed') { }
```

---

## 🔒 Seguridad

- La API requiere autenticación JWT (si está configurada)
- Solo devuelve eventos de la persona consultada
- No expone información sensible de otros usuarios

---

## 📊 Performance

- La API usa `select_related` y `prefetch_related` para optimizar queries
- Incluye solo eventos activos para la fecha consultada
- Filtra por horarios si es HOY

---

## 🐛 Troubleshooting

### **Problema: No devuelve eventos**

**Posibles causas:**
1. La persona no está registrada en ningún evento
2. No hay EventDates para la fecha consultada
3. Los EventDates no están activos (`is_active=False`)
4. El horario actual está fuera del rango del evento

**Solución:**
- Verificar en el admin que la persona tenga EventAttendee
- Verificar que existan EventDates activas para esa fecha
- Verificar que el horario actual esté dentro del rango

### **Problema: current_usage es null**

**Causa:** No existe TicketUsage para la fecha consultada

**Solución:**
- Verificar que el evento tenga EventDates para esa fecha
- Llamar a `event.sync_event_data()` para crear los TicketUsage faltantes

---

## 📚 Recursos Adicionales

- [Documentación de Event Model](./SISTEMA_TECNICO_IA.md)
- [Documentación de TicketUsage](./TICKET_USAGE_SYSTEM.md)
- [API de Canje de Tickets](./API_REDEEM_TICKET.md)

---

**Última actualización:** 18 de Febrero de 2026  
**Versión:** 2.0  
**Autor:** Sistema de Tickets FVX
