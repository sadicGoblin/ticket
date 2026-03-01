import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, catchError, tap } from 'rxjs';
import { environment } from '../../environments/environment';

// ── Interfaces de la API real ──

export interface ApiPerson {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string | null;
  document_type: string;
  document_number: string;
  company: string | null;
  position: string | null;
  photo: string | null;
}

export interface ApiService {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  icon: string | null;
  icon_url?: string | null;
  color: string | null;
  priority?: string;
  estimated_time?: number | null;
  time_from: string | null; // "09:00:00"
  time_to: string | null; // "11:00:00"
  is_active?: boolean;
}

// Uso de un ticket para una fecha específica (TicketUsage)
export interface ApiTicketUsage {
  id: number;
  usage_date: string; // "YYYY-MM-DD"
  status: 'pending' | 'printed' | 'redeemed' | 'skipped' | 'expired';
  redeemed_at: string | null;
  redeemed_by: number | null;
  redeemed_by_username: string | null;
  redeemed_by_full_name: string | null;
  printed_at?: string | null;
  printed_by?: string | null;
  notes: string | null;
  created: string;
  modified: string;
}

// Respuesta del endpoint POST /api/tickets/print/
export interface PrintTicketResponse {
  success: boolean;
  message?: string;
  error?: string;
  is_reprint: boolean;
  ticket?: {
    id: number;
    ticket_number: string;
    status: string;
    valid_from: string;
    valid_until: string;
    person: {
      id: number;
      full_name: string;
      document_number: string;
      email?: string;
    };
    service: {
      id: number;
      name: string;
      code: string;
      time_from?: string;
      time_to?: string;
    };
    event: {
      id: number;
      name: string;
      code: string;
      organization?: string;
    };
    usage: {
      usage_date: string;
      status: string;
      printed_at: string;
      printed_by: string;
      notes: string | null;
    };
  };
}

// Ticket con usages[] y current_usage (nuevo formato API v2)
export interface ApiPersonTicket {
  id: number;
  ticket_number: string;
  service: ApiService;
  subject?: string | null;
  description?: string | null;
  status?: string; // Estado general del ticket (no usar para estado del día)
  priority?: string;
  due_date?: string | null;
  is_overdue?: boolean;
  usages: ApiTicketUsage[]; // Todos los usos del ticket
  current_usage: ApiTicketUsage | null; // ⭐ Uso de HOY (fecha consultada)
  created?: string;
  modified?: string;
}

export interface ApiAttendeeInfo {
  id: number;
  role: string;
  status: string;
  registration_date: string;
  confirmation_date: string | null;
  check_in_date: string | null;
  badge_number: string | null;
  seat_number: string | null;
  special_requirements: string;
  is_confirmed: boolean;
  has_checked_in: boolean;
}

export interface ApiEvent {
  id: number;
  code: string;
  name: string;
  slug: string;
  description: string;
  image: string | null;
  organization: number;
  organization_name: string;
  date_start: string;
  date_end: string;
  location: string;
  max_capacity: number;
  status: string;
  is_active_event: boolean;
  check_in_required: boolean; // true = restrictivo, false = permisivo (auto check-in)
  attendee_info: ApiAttendeeInfo;
  services: ApiService[];
  person_tickets?: ApiPersonTicket[]; // legacy
  tickets?: ApiPersonTicket[]; // nuevo formato
}

export interface ApiPersonEventsResponse {
  person: ApiPerson;
  date: string;
  events_count: number;
  events: ApiEvent[];
}

// ── Interfaces internas de la app ──

export interface EmpleadoCasino {
  rut: string;
  nombre: string;
  persona: ApiPerson;
  eventos: ApiEvent[];
}

export type EstadoHorario = 'disponible' | 'proximamente' | 'finalizado';

export interface ServicioComida {
  id: number;
  nombre: string;
  code: string;
  icono: string | null;
  iconUrl: string | null;
  disponible: boolean; // true si está en person_tickets
  ticketId: number | null;
  ticketNumber: string | null;
  ticketStatus: string | null;
  usageId: number | null; // ID del current_usage para actualizar estado
  timeFrom: string | null; // "09:00:00"
  timeTo: string | null; // "11:00:00"
  estadoHorario: EstadoHorario; // calculado según hora actual
  segundosParaAbrir: number; // segundos restantes si es 'proximamente', 0 en otro caso
}

export interface RespuestaVerificacion {
  success: boolean;
  empleado?: EmpleadoCasino;
  mensaje?: string;
}

// Mantener por compatibilidad
export type TipoComida = string;
export interface TipoComidaInfo {
  id: string;
  nombre: string;
  icono: string;
  disponible: boolean;
  horario: string;
}

@Injectable({
  providedIn: 'root',
})
export class CasinoService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Verifica persona y obtiene sus eventos/servicios desde la API real
   */
  verificarTicketCasino(rut: string): Observable<RespuestaVerificacion> {
    // RUT limpio sin puntos ni guión para la API
    const rutLimpio = this.limpiarRut(rut).toUpperCase();

    const url = `${this.API_URL}/person-events/`;
    const params = { document_number: rutLimpio };

    console.log('🚀 [CasinoService] GET', url);
    console.log('📤 Params:', params);

    return this.http.get<ApiPersonEventsResponse>(url, { params }).pipe(
      tap((res) =>
        console.log('✅ [CasinoService] Person events response:', res),
      ),
      map((response) => {
        if (response && response.person) {
          const empleado: EmpleadoCasino = {
            rut: response.person.document_number,
            nombre: response.person.full_name,
            persona: response.person,
            eventos: response.events || [],
          };
          return {
            success: true,
            empleado,
            mensaje: `Usuario encontrado: ${empleado.nombre}`,
          };
        }
        return {
          success: false,
          mensaje: 'No se encontró información para este RUT',
        };
      }),
      catchError((error) => {
        console.error('Error en API person-events:', error);
        let mensaje = 'Error al conectar con el servidor';
        if (error.status === 404) {
          mensaje = 'RUT no encontrado en el sistema';
        } else if (error.status === 0) {
          mensaje =
            'No se pudo conectar con el servidor. Verifique la conexión';
        }
        return of({ success: false, mensaje });
      }),
    );
  }

  /**
   * Marca un ticket como impreso usando el nuevo endpoint
   * POST /api/print-ticket/
   * @param ticketNumber Número del ticket (ej: "EV0-20260206-57187")
   * @param totemId Identificador del tótem (opcional)
   */
  printTicket(
    ticketNumber: string,
    totemId: string = 'TOTEM-01',
  ): Observable<PrintTicketResponse> {
    const url = `${this.API_URL}/print-ticket/`;
    const payload = {
      ticket_number: ticketNumber,
      totem_id: totemId,
    };

    console.log('🚀 [CasinoService] POST', url);
    console.log('📤 Payload:', payload);

    return this.http.post<PrintTicketResponse>(url, payload).pipe(
      tap({
        next: (res) =>
          console.log('✅ [CasinoService] Print ticket response:', res),
        error: (err) =>
          console.error('❌ [CasinoService] Print ticket error:', err),
      }),
    );
  }

  /**
   * Actualiza el estado de un TicketUsage (e.g. 'printed', 'redeemed')
   * @param usageId ID del current_usage (NO del ticket)
   * @param status Nuevo estado
   */
  updateTicketStatus(
    usageId: number,
    status: 'printed' | 'redeemed',
  ): Observable<ApiTicketUsage> {
    const url = `${this.API_URL}/ticket-usages/${usageId}/`;
    const payload = { status };

    console.log('🚀 [CasinoService] PATCH', url);
    console.log('📤 Payload:', payload);

    return this.http.patch<ApiTicketUsage>(url, payload).pipe(
      tap({
        next: (res) =>
          console.log('✅ [CasinoService] Update usage response:', res),
        error: (err) =>
          console.error('❌ [CasinoService] Update usage error:', err),
      }),
    );
  }

  /**
   * Extrae los servicios de un evento, marcando cuáles están disponibles
   * y calculando el estado horario según time_from / time_to.
   * Usa current_usage.status para obtener el estado del día actual (API v2).
   */
  getServiciosDeEvento(evento: ApiEvent): ServicioComida[] {
    const ahora = new Date();

    // Soportar ambos formatos: tickets (nuevo) o person_tickets (legacy)
    const tickets = evento.tickets || evento.person_tickets || [];

    return evento.services.map((service) => {
      const ticket = tickets.find((pt) => pt.service.id === service.id);

      // Obtener estado del ticket para HOY usando current_usage
      let ticketStatus: string | null = null;
      if (ticket) {
        if (ticket.current_usage) {
          // API v2: usar current_usage.status (estado del día consultado)
          ticketStatus = ticket.current_usage.status;
        } else if (ticket.status) {
          // Legacy: usar status directo
          ticketStatus = ticket.status;
        } else {
          ticketStatus = 'pending';
        }
      }

      const { estado, segundosParaAbrir } = this.calcularEstadoHorario(
        service.time_from,
        service.time_to,
        ahora,
      );

      return {
        id: service.id,
        nombre: service.name,
        code: service.code,
        icono: service.icon,
        iconUrl: service.icon_url || null,
        disponible: !!ticket,
        ticketId: ticket ? ticket.id : null,
        ticketNumber: ticket ? ticket.ticket_number : null,
        ticketStatus,
        usageId: ticket?.current_usage?.id || null,
        timeFrom: service.time_from,
        timeTo: service.time_to,
        estadoHorario: estado,
        segundosParaAbrir,
      };
    });
  }

  /**
   * Obtiene la fecha local en formato "YYYY-MM-DD"
   */
  private getFechaLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Calcula si un servicio está disponible, próximamente o finalizado
   * basado en time_from y time_to (formato "HH:mm:ss").
   */
  private calcularEstadoHorario(
    timeFrom: string | null,
    timeTo: string | null,
    ahora: Date,
  ): { estado: EstadoHorario; segundosParaAbrir: number } {
    // Sin horario definido → disponible siempre
    if (!timeFrom || !timeTo) {
      return { estado: 'disponible', segundosParaAbrir: 0 };
    }

    // Usar fecha local (no UTC) para evitar desfase de zona horaria
    const year = ahora.getFullYear();
    const month = String(ahora.getMonth() + 1).padStart(2, '0');
    const day = String(ahora.getDate()).padStart(2, '0');
    const hoy = `${year}-${month}-${day}`;

    const desde = new Date(`${hoy}T${timeFrom}`);
    const hasta = new Date(`${hoy}T${timeTo}`);

    if (ahora < desde) {
      const diffMs = desde.getTime() - ahora.getTime();
      const segundos = Math.ceil(diffMs / 1000);
      return { estado: 'proximamente', segundosParaAbrir: segundos };
    }

    if (ahora > hasta) {
      return { estado: 'finalizado', segundosParaAbrir: 0 };
    }

    return { estado: 'disponible', segundosParaAbrir: 0 };
  }

  /**
   * Formatea segundos restantes en texto legible: "2h 30min 15s", "45min 10s", "30s", etc.
   */
  formatearTiempoRestante(segundos: number): string {
    if (segundos <= 0) return '';
    const h = Math.floor(segundos / 3600);
    const m = Math.floor((segundos % 3600) / 60);
    const s = segundos % 60;
    const parts: string[] = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}min`);
    if (s > 0 && h === 0) parts.push(`${s}s`); // solo mostrar segundos si < 1 hora
    return parts.join(' ') || '0s';
  }

  /**
   * Limpia el formato del RUT (quita puntos y guiones)
   */
  limpiarRut(rut: string): string {
    return rut.replace(/\./g, '').replace(/-/g, '');
  }

  /**
   * Formatea el RUT para mostrarlo (12.345.678-9)
   */
  formatearRut(rut: string): string {
    const rutLimpio = this.limpiarRut(rut);

    if (rutLimpio.length < 2) return rutLimpio;

    const dv = rutLimpio.slice(-1);
    const numero = rutLimpio.slice(0, -1);

    // Formatear con puntos
    const numeroFormateado = numero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return `${numeroFormateado}-${dv}`;
  }

  /**
   * Valida el formato del RUT chileno
   */
  validarRut(rut: string): boolean {
    const rutLimpio = this.limpiarRut(rut);

    if (rutLimpio.length < 8 || rutLimpio.length > 9) {
      return false;
    }

    const numero = parseInt(rutLimpio.slice(0, -1), 10);
    const dv = rutLimpio.slice(-1).toLowerCase();

    let suma = 0;
    let multiplicador = 2;

    let numeroStr = numero.toString();
    for (let i = numeroStr.length - 1; i >= 0; i--) {
      suma += parseInt(numeroStr[i]) * multiplicador;
      multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }

    const dvCalculado = 11 - (suma % 11);
    let dvEsperado: string;

    if (dvCalculado === 11) {
      dvEsperado = '0';
    } else if (dvCalculado === 10) {
      dvEsperado = 'k';
    } else {
      dvEsperado = dvCalculado.toString();
    }

    return dv === dvEsperado;
  }
}
