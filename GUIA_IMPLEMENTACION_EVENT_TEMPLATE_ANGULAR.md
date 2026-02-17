# 🚀 Guía de Implementación: Event-Template para Angular

**Fecha:** 17 de Febrero de 2026  
**Versión:** 1.0  
**Para:** Desarrollador IA trabajando en Angular

---

## 📋 Resumen de Cambios

Se ha implementado una relación entre **Event** y **Template** en el backend. Ahora cada evento puede tener asociado un template de configuración de su organización.

### **Cambios Importantes:**

1. ✅ **Event ahora incluye template** - El modelo Event tiene un campo `template` (ForeignKey opcional)
2. ✅ **API `/api/organization-templates/` ELIMINADA** - Ya no existe este endpoint
3. ✅ **Templates vienen en la respuesta de Event** - Todas las APIs de eventos incluyen el template completo
4. ✅ **Nueva forma de obtener templates** - Usar `/api/templates/?organization_code=XXX`

---

## 🎯 Lo Que Debes Implementar en Angular

### **1. Actualizar Interfaces TypeScript**

#### **Event Interface (ACTUALIZADA)**

```typescript
export interface Event {
  id: number;
  organization: number;
  organization_name?: string;
  code: string;
  name: string;
  slug?: string;
  description?: string;
  location?: string;
  max_capacity?: number;
  
  // ✨ NUEVO: Template asociado
  template?: Template | null;  // Objeto completo del template o null
  
  // Fechas
  date_start?: string;
  date_end?: string;
  
  // Estados
  status: 'draft' | 'pending' | 'active' | 'finished' | 'cancelled' | 'suspended';
  computed_status?: string;
  is_active_event?: boolean;
  
  // Metadata
  notes?: string;
  image?: string;
  tickets_count?: number;
  created?: string;
  modified?: string;
  
  // Relaciones
  event_dates?: EventDate[];
  services?: Service[];
  attendees?: EventAttendee[];
}
```

#### **Template Interface**

```typescript
export interface Template {
  id: number;
  organization: number;
  organization_name: string;
  name: string;
  slug: string;
  code: string;
  data: any;  // Datos JSON del template
  is_active: boolean;
  is_removed: boolean;
  created: string;
  modified: string;
}
```

---

## 🔌 APIs Actualizadas

### **1. Obtener Templates por Organización**

**❌ ANTIGUA (ELIMINADA):**
```typescript
// ⚠️ ESTO YA NO FUNCIONA
GET /api/organization-templates/?code=WAL
```

**✅ NUEVA (USAR ESTA):**
```typescript
GET /api/templates/?organization_code=WAL
GET /api/templates/?organization_code=WAL&is_active=true
```

**Ejemplo en Angular:**
```typescript
// En tu servicio
getTemplatesByOrganization(orgCode: string): Observable<Template[]> {
  const params = new HttpParams()
    .set('organization_code', orgCode)
    .set('is_active', 'true');
  return this.http.get<Template[]>(`${this.apiUrl}/templates/`, { params });
}
```

---

### **2. APIs de Event Incluyen Template Completo**

Todas estas APIs ahora devuelven el template completo en el objeto event:

#### **a) Listar Eventos**
```typescript
GET /api/events/?organization__code=WAL
```

**Respuesta:**
```json
[
  {
    "id": 1,
    "code": "WAL-001",
    "name": "Evento Corporativo",
    "organization": 1,
    "organization_name": "Wallmart",
    "template": {
      "id": 2,
      "organization": 1,
      "organization_name": "Wallmart",
      "name": "Template Corporativo",
      "code": "CORP-001",
      "data": {
        "colors": {
          "primary": "#007bff",
          "secondary": "#6c757d"
        }
      },
      "is_active": true,
      "is_removed": false,
      "created": "2026-02-01T10:00:00Z",
      "modified": "2026-02-15T14:30:00Z"
    },
    // ... otros campos
  }
]
```

#### **b) Detalle de Evento**
```typescript
GET /api/events/1/
```

Incluye el template completo en la respuesta.

#### **c) Event Attendance (ACTUALIZADA)**
```typescript
GET /api/event-attendance/TEST001/
```

**Respuesta:**
```json
{
  "event": {
    "id": 1,
    "code": "TEST001",
    "name": "Evento de Prueba",
    "organization": {...},
    "template": {
      "id": 2,
      "name": "Template Corporativo",
      "code": "CORP-001",
      "data": {...},
      // ... todos los campos del template
    },
    // ... otros campos del evento
  },
  "dates": [...],
  "services": [...],
  "attendees": [...]
}
```

---

## 💻 Implementación en Angular

### **1. Servicio de Templates**

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TemplateService {
  private apiUrl = 'http://localhost:8051/api';

  constructor(private http: HttpClient) {}

  /**
   * Obtener templates activos de una organización
   * @param orgCode Código de la organización (ej: "WAL", "WM001")
   */
  getActiveTemplates(orgCode: string): Observable<Template[]> {
    const params = new HttpParams()
      .set('organization_code', orgCode)
      .set('is_active', 'true');
    return this.http.get<Template[]>(`${this.apiUrl}/templates/`, { params });
  }

  /**
   * Obtener todos los templates de una organización
   */
  getAllTemplates(orgCode: string): Observable<Template[]> {
    const params = new HttpParams().set('organization_code', orgCode);
    return this.http.get<Template[]>(`${this.apiUrl}/templates/`, { params });
  }

  /**
   * Obtener un template específico por ID
   */
  getTemplate(id: number): Observable<Template> {
    return this.http.get<Template>(`${this.apiUrl}/templates/${id}/`);
  }
}
```

---

### **2. Servicio de Events (ACTUALIZADO)**

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private apiUrl = 'http://localhost:8051/api';

  constructor(private http: HttpClient) {}

  /**
   * Crear evento con template
   */
  createEvent(event: Partial<Event>): Observable<Event> {
    return this.http.post<Event>(`${this.apiUrl}/events/`, event);
  }

  /**
   * Actualizar evento (incluyendo template)
   */
  updateEvent(id: number, event: Partial<Event>): Observable<Event> {
    return this.http.patch<Event>(`${this.apiUrl}/events/${id}/`, event);
  }

  /**
   * Obtener eventos con sus templates
   */
  getEvents(orgCode: string): Observable<Event[]> {
    const params = new HttpParams().set('organization__code', orgCode);
    return this.http.get<Event[]>(`${this.apiUrl}/events/`, { params });
  }

  /**
   * Obtener detalle de evento con template
   */
  getEvent(id: number): Observable<Event> {
    return this.http.get<Event>(`${this.apiUrl}/events/${id}/`);
  }
}
```

---

### **3. Componente: Formulario de Creación de Evento**

#### **event-form.component.ts**

```typescript
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EventService } from './services/event.service';
import { TemplateService } from './services/template.service';

@Component({
  selector: 'app-event-form',
  templateUrl: './event-form.component.html'
})
export class EventFormComponent implements OnInit {
  eventForm: FormGroup;
  templates: Template[] = [];
  currentOrganization: any;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private eventService: EventService,
    private templateService: TemplateService
  ) {
    this.eventForm = this.fb.group({
      organization: [null, Validators.required],
      code: ['', Validators.required],
      name: ['', Validators.required],
      description: [''],
      location: [''],
      max_capacity: [null],
      template: [null],  // ✨ NUEVO: Campo template (opcional)
      status: ['draft', Validators.required]
    });
  }

  ngOnInit() {
    // Obtener organización actual del usuario
    this.currentOrganization = this.getCurrentOrganization();
    
    if (this.currentOrganization) {
      this.eventForm.patchValue({
        organization: this.currentOrganization.id
      });
      
      // ✨ NUEVO: Cargar templates de la organización
      this.loadTemplates();
    }
  }

  /**
   * ✨ NUEVO: Cargar templates activos de la organización
   */
  loadTemplates() {
    this.loading = true;
    this.templateService.getActiveTemplates(this.currentOrganization.code)
      .subscribe({
        next: (templates) => {
          this.templates = templates;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al cargar templates:', error);
          this.loading = false;
        }
      });
  }

  onSubmit() {
    if (this.eventForm.valid) {
      const eventData = this.eventForm.value;
      
      // Si template está vacío, enviarlo como null
      if (!eventData.template) {
        eventData.template = null;
      }
      
      this.eventService.createEvent(eventData)
        .subscribe({
          next: (event) => {
            console.log('Evento creado:', event);
            alert('Evento creado exitosamente');
            // Navegar a la vista del evento o resetear formulario
          },
          error: (error) => {
            console.error('Error al crear evento:', error);
            
            // Manejar error de validación de template
            if (error.error?.template) {
              alert(`Error: ${error.error.template}`);
            } else {
              alert('Error al crear el evento');
            }
          }
        });
    }
  }

  getCurrentOrganization() {
    const org = localStorage.getItem('current_organization');
    return org ? JSON.parse(org) : null;
  }
}
```

#### **event-form.component.html**

```html
<div class="container">
  <h2>Crear Nuevo Evento</h2>

  <form [formGroup]="eventForm" (ngSubmit)="onSubmit()">
    
    <!-- Código del Evento -->
    <div class="form-group">
      <label for="code">Código del Evento *</label>
      <input 
        type="text" 
        id="code" 
        formControlName="code" 
        class="form-control"
        placeholder="Ej: WAL-001"
      >
      <small class="form-text text-muted">
        Código único del evento
      </small>
    </div>

    <!-- Nombre del Evento -->
    <div class="form-group">
      <label for="name">Nombre del Evento *</label>
      <input 
        type="text" 
        id="name" 
        formControlName="name" 
        class="form-control"
        placeholder="Nombre del evento"
      >
    </div>

    <!-- ✨ NUEVO: Selector de Template -->
    <div class="form-group">
      <label for="template">Template de Configuración</label>
      <select 
        id="template" 
        formControlName="template" 
        class="form-control"
        [disabled]="loading"
      >
        <option [value]="null">-- Sin template --</option>
        <option 
          *ngFor="let template of templates" 
          [value]="template.id"
        >
          {{ template.name }} ({{ template.code }})
        </option>
      </select>
      <small class="form-text text-muted">
        Opcional. Selecciona un template de configuración para personalizar el evento.
      </small>
      <div *ngIf="loading" class="text-muted mt-1">
        <small>Cargando templates...</small>
      </div>
    </div>

    <!-- Descripción -->
    <div class="form-group">
      <label for="description">Descripción</label>
      <textarea 
        id="description" 
        formControlName="description" 
        class="form-control"
        rows="3"
        placeholder="Descripción del evento"
      ></textarea>
    </div>

    <!-- Ubicación -->
    <div class="form-group">
      <label for="location">Ubicación</label>
      <input 
        type="text" 
        id="location" 
        formControlName="location" 
        class="form-control"
        placeholder="Lugar del evento"
      >
    </div>

    <!-- Capacidad Máxima -->
    <div class="form-group">
      <label for="max_capacity">Capacidad Máxima</label>
      <input 
        type="number" 
        id="max_capacity" 
        formControlName="max_capacity" 
        class="form-control"
        placeholder="Número máximo de asistentes"
      >
    </div>

    <!-- Botones -->
    <div class="form-group">
      <button 
        type="submit" 
        class="btn btn-primary" 
        [disabled]="!eventForm.valid || loading"
      >
        Crear Evento
      </button>
      <button 
        type="button" 
        class="btn btn-secondary ml-2"
        (click)="eventForm.reset()"
      >
        Cancelar
      </button>
    </div>

  </form>
</div>
```

---

### **4. Componente: Editar Evento**

```typescript
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EventService } from './services/event.service';
import { TemplateService } from './services/template.service';

@Component({
  selector: 'app-event-edit',
  templateUrl: './event-edit.component.html'
})
export class EventEditComponent implements OnInit {
  eventForm: FormGroup;
  templates: Template[] = [];
  event: Event | null = null;
  eventId: number;
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private eventService: EventService,
    private templateService: TemplateService
  ) {
    this.eventForm = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      description: [''],
      location: [''],
      max_capacity: [null],
      template: [null],
      status: ['draft', Validators.required]
    });
  }

  ngOnInit() {
    this.eventId = +this.route.snapshot.paramMap.get('id')!;
    this.loadEvent();
  }

  loadEvent() {
    this.loading = true;
    this.eventService.getEvent(this.eventId).subscribe({
      next: (event) => {
        this.event = event;
        
        // Cargar templates de la organización del evento
        this.loadTemplates(event.organization);
        
        // Llenar formulario con datos del evento
        this.eventForm.patchValue({
          code: event.code,
          name: event.name,
          description: event.description,
          location: event.location,
          max_capacity: event.max_capacity,
          template: event.template?.id || null,  // ✨ ID del template o null
          status: event.status
        });
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar evento:', error);
        this.loading = false;
      }
    });
  }

  loadTemplates(organizationId: number) {
    // Obtener código de organización del evento
    const orgCode = this.event?.organization_name || '';
    
    this.templateService.getActiveTemplates(orgCode).subscribe({
      next: (templates) => {
        this.templates = templates;
      },
      error: (error) => {
        console.error('Error al cargar templates:', error);
      }
    });
  }

  onSubmit() {
    if (this.eventForm.valid) {
      const updates = this.eventForm.value;
      
      this.eventService.updateEvent(this.eventId, updates).subscribe({
        next: (event) => {
          console.log('Evento actualizado:', event);
          alert('Evento actualizado exitosamente');
        },
        error: (error) => {
          console.error('Error al actualizar evento:', error);
          if (error.error?.template) {
            alert(`Error: ${error.error.template}`);
          }
        }
      });
    }
  }
}
```

---

### **5. Usar Template en Event Attendance**

```typescript
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-event-attendance',
  templateUrl: './event-attendance.component.html'
})
export class EventAttendanceComponent implements OnInit {
  eventCode = 'TEST001';
  eventData: any = null;
  template: Template | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadEventAttendance();
  }

  loadEventAttendance() {
    this.http.get(`/api/event-attendance/${this.eventCode}/`)
      .subscribe((response: any) => {
        this.eventData = response;
        this.template = response.event.template;  // ✨ Template completo
        
        // Aplicar configuración del template
        if (this.template) {
          this.applyTemplateConfiguration();
        }
      });
  }

  applyTemplateConfiguration() {
    if (!this.template || !this.template.data) return;

    const templateData = this.template.data;

    // Aplicar colores
    if (templateData.colors) {
      document.documentElement.style.setProperty(
        '--primary-color', 
        templateData.colors.primary
      );
      document.documentElement.style.setProperty(
        '--secondary-color', 
        templateData.colors.secondary
      );
    }

    // Aplicar configuraciones
    if (templateData.settings) {
      // Ejemplo: mostrar/ocultar elementos según configuración
      console.log('Configuración del template:', templateData.settings);
    }
  }
}
```

---

## ⚠️ Validaciones Importantes

### **1. Template debe pertenecer a la misma organización**

El backend valida automáticamente que el template seleccionado pertenezca a la misma organización del evento.

**Error si intentas asignar un template de otra organización:**
```json
{
  "template": ["El template debe pertenecer a la misma organización del evento."]
}
```

**Manejo en Angular:**
```typescript
this.eventService.createEvent(eventData).subscribe({
  error: (error) => {
    if (error.error?.template) {
      alert(`Error de validación: ${error.error.template}`);
    }
  }
});
```

---

## 📊 Filtros Disponibles

### **Templates:**
```typescript
// Por código de organización
GET /api/templates/?organization_code=WAL

// Por ID de organización
GET /api/templates/?organization=1

// Solo activos
GET /api/templates/?is_active=true

// Combinado
GET /api/templates/?organization_code=WAL&is_active=true
```

### **Events:**
```typescript
// Por template ID
GET /api/events/?template=2

// Por código de template
GET /api/events/?template_code=CORP-001

// Combinado
GET /api/events/?organization__code=WAL&template_code=CORP-001
```

---

## ✅ Checklist de Implementación

- [ ] Actualizar interface `Event` para incluir `template?: Template | null`
- [ ] Crear interface `Template` con todos los campos
- [ ] Actualizar `TemplateService` con método `getActiveTemplates(orgCode)`
- [ ] Eliminar referencias a `/api/organization-templates/` (ya no existe)
- [ ] Agregar selector de template en formulario de creación de evento
- [ ] Agregar selector de template en formulario de edición de evento
- [ ] Manejar validación de template en formularios
- [ ] Actualizar componentes que usan event-attendance para acceder a `event.template`
- [ ] Aplicar configuración del template (colores, settings, etc.) donde sea necesario
- [ ] Probar creación de evento con y sin template
- [ ] Probar actualización de template en evento existente

---

## 🎯 Puntos Clave para la IA

1. **API antigua eliminada**: `/api/organization-templates/` ya NO existe
2. **Templates vienen en Event**: Todas las APIs de eventos incluyen el template completo
3. **Obtener templates**: Usar `/api/templates/?organization_code=XXX`
4. **Template es opcional**: Puede ser `null` en el evento
5. **Validación automática**: El backend valida que el template pertenezca a la organización
6. **Template completo**: El objeto template incluye todos sus campos, incluyendo `data` (JSON)

---

**🎉 Guía completa para implementar Event-Template en Angular!** 🚀
