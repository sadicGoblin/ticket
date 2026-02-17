import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, catchError } from 'rxjs';

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
  description: string | null;
  icon: string | null;
  icon_url: string | null;
  color: string | null;
  priority: string;
  estimated_time: number | null;
  time_from: string | null; // "09:00:00"
  time_to: string | null; // "11:00:00"
  is_active: boolean;
}

export interface ApiPersonTicket {
  id: number;
  ticket_number: string;
  service: ApiService;
  subject: string | null;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  is_overdue: boolean;
  created: string;
  modified: string;
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
  attendee_info: ApiAttendeeInfo;
  services: ApiService[];
  person_tickets: ApiPersonTicket[];
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
  private readonly API_URL = 'http://192.168.100.10:8051';

  constructor(private http: HttpClient) {}

  /**
   * Verifica persona y obtiene sus eventos/servicios desde la API real
   */
  verificarTicketCasino(rut: string): Observable<RespuestaVerificacion> {
    const rutLimpio = this.limpiarRut(rut);
    // Reconstruir con guión pero sin puntos: 18618839-K
    const rutSinPuntos =
      rutLimpio.length >= 2
        ? rutLimpio.slice(0, -1) + '-' + rutLimpio.slice(-1)
        : rutLimpio;

    return this.http
      .get<ApiPersonEventsResponse>(`${this.API_URL}/api/person-events/`, {
        params: { document_number: rutSinPuntos },
      })
      .pipe(
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
   * Actualiza el estado de un ticket (e.g. 'printed', 'redeemed')
   * POST /api/person-tickets/{id}/update-status/
   */
  updateTicketStatus(
    ticketId: number,
    status: 'printed' | 'redeemed',
  ): Observable<ApiPersonTicket> {
    return this.http.patch<ApiPersonTicket>(
      `${this.API_URL}/api/person-tickets/${ticketId}/`,
      { status },
    );
  }

  /**
   * Extrae los servicios de un evento, marcando cuáles están disponibles (en person_tickets)
   * y calculando el estado horario según time_from / time_to.
   */
  getServiciosDeEvento(evento: ApiEvent): ServicioComida[] {
    const ahora = new Date();

    return evento.services.map((service) => {
      const ticket = evento.person_tickets.find(
        (pt) => pt.service.id === service.id,
      );

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
        iconUrl: service.icon_url,
        disponible: !!ticket,
        ticketId: ticket ? ticket.id : null,
        ticketNumber: ticket ? ticket.ticket_number : null,
        ticketStatus: ticket ? ticket.status : null,
        timeFrom: service.time_from,
        timeTo: service.time_to,
        estadoHorario: estado,
        segundosParaAbrir,
      };
    });
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

    const hoy = ahora.toISOString().slice(0, 10); // "YYYY-MM-DD"
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
