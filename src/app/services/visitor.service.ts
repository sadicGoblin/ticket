import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// ── Interfaces para el sistema de visitantes ──

export interface AddVisitorRequest {
  supervisor_code: string;
  supervisor_name: string;
  event_code: string;
  document_number: string;
  first_name?: string;
  last_name?: string;
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

export interface ServiceInfo {
  id: number;
  name: string;
  code: string;
}

export interface TicketInfo {
  id: number;
  ticket_number: string;
  service: ServiceInfo;
  status: string;
}

export interface AddVisitorResponse {
  success: boolean;
  message: string;
  person: PersonInfo;
  attendee: AttendeeInfo;
  tickets: TicketInfo[];
  tickets_count: number;
  error?: string;
}

export interface EventToday {
  id: number;
  code: string;
  name: string;
  location: string;
  date_start: string;
  date_end: string;
  organization: number;
  organization_name: string;
  supervisor_code: string | null;
  status: string;
  computed_status: string;
}

export interface EventsApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: EventToday[];
}

export interface EventsTodayResponse {
  events: EventToday[];
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

export interface ValidateSupervisorCodeRequest {
  event_code: string;
  supervisor_code: string;
}

export interface ValidateSupervisorCodeResponse {
  success: boolean;
  message: string;
  event?: {
    id: number;
    code: string;
    name: string;
    location: string;
    date_start: string;
    date_end: string;
    supervisor_code: string;
  };
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class VisitorService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Agregar visitante a un evento
   */
  addVisitor(data: AddVisitorRequest): Observable<AddVisitorResponse> {
    const url = `${this.API_URL}/visitor/add/`;
    console.log('🚀 [VisitorService] POST', url);
    console.log('📤 Payload:', data);

    return this.http.post<AddVisitorResponse>(url, data).pipe(
      tap({
        next: (res) => console.log('✅ [VisitorService] Response:', res),
        error: (err) => console.error('❌ [VisitorService] Error:', err),
      }),
    );
  }

  /**
   * Obtener lista de eventos.
   * Por defecto usa today=true para traer solo eventos que incluyen el día de hoy.
   *
   * Filtros soportados:
   * - today: true (default) → eventos cuyo rango de fechas incluye hoy
   * - status: 'active' | 'pending' | 'finished' | 'cancelled' | 'draft' | 'suspended'
   *   (solo aplica cuando today NO está activo, ya que el backend lo ignora con today=true)
   * - date: string → filtro por fecha específica
   */
  getEvents(params?: {
    today?: boolean;
    status?: string;
    date?: string;
  }): Observable<EventsTodayResponse> {
    const queryParts: string[] = [];

    // Construir query params solo si tienen valor (evitar params vacíos)
    if (params?.today !== false) {
      // today=true es el default
      queryParts.push('today=true');
    }

    if (params?.status && !params?.today) {
      // status solo aplica cuando today NO está activo
      queryParts.push(`status=${params.status}`);
    }

    if (params?.date) {
      queryParts.push(`date=${params.date}`);
    }

    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const url = `${this.API_URL}/events/${queryString}`;

    console.log('🚀 [VisitorService] GET', url);

    return this.http.get<EventsApiResponse | EventToday[]>(url).pipe(
      map((response) => {
        // Manejar respuesta como array directo o paginada
        const events = Array.isArray(response) ? response : response.results;
        return { events };
      }),
      tap({
        next: (res) => console.log('✅ [VisitorService] Events:', res),
        error: (err) => console.error('❌ [VisitorService] Error:', err),
      }),
    );
  }

  /**
   * @deprecated Usar getEvents() en su lugar. Mantener por compatibilidad.
   */
  getEventsToday(date?: string): Observable<EventsTodayResponse> {
    return this.getEvents(date ? { date, today: false } : {});
  }

  /**
   * Verificar si existe persona con ese RUT
   */
  checkRut(documentNumber: string): Observable<CheckRutResponse> {
    const url = `${this.API_URL}/person/check-rut/`;
    const payload = { document_number: documentNumber };

    console.log('🚀 [VisitorService] POST', url);
    console.log('📤 Payload:', payload);

    return this.http.post<CheckRutResponse>(url, payload).pipe(
      tap({
        next: (res) => console.log('✅ [VisitorService] Check RUT:', res),
        error: (err) => console.error('❌ [VisitorService] Error:', err),
      }),
    );
  }

  /**
   * Validar código de supervisor antes de habilitar registro
   */
  validateSupervisorCode(
    data: ValidateSupervisorCodeRequest,
  ): Observable<ValidateSupervisorCodeResponse> {
    const url = `${this.API_URL}/supervisor/validate-code/`;

    console.log('🚀 [VisitorService] POST', url);
    console.log('📤 Payload:', data);

    return this.http.post<ValidateSupervisorCodeResponse>(url, data).pipe(
      tap({
        next: (res) => console.log('✅ [VisitorService] Validate code:', res),
        error: (err) => console.error('❌ [VisitorService] Error:', err),
      }),
    );
  }
}
