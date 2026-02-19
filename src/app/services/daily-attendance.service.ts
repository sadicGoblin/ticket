import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Interfaces según documentación ANGULAR_CHECK_IN_GUIDE.md

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

export interface DailyAttendance {
  id: number;
  person: PersonSummary;
  event: EventSummary;
  attendance_date: string; // YYYY-MM-DD
  check_in_time: string; // ISO 8601
  check_out_time: string | null;
  duration: string | null; // "9h 30m"
  check_in_by: string;
  notes: string | null;
  is_first_day?: boolean;
}

export interface CheckInRequest {
  document_number: string;
  event_code: string;
  date?: string; // YYYY-MM-DD, default: hoy
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

@Injectable({
  providedIn: 'root',
})
export class DailyAttendanceService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Realizar check-in de una persona en un evento
   */
  checkIn(request: CheckInRequest): Observable<CheckInResponse> {
    const url = `${this.API_URL}/check-in/`;
    console.log('🚀 [DailyAttendance] POST', url);
    console.log('📤 Payload:', request);
    
    return this.http.post<CheckInResponse>(url, request).pipe(
      tap({
        next: (res) => console.log('✅ [DailyAttendance] Check-in response:', res),
        error: (err) => console.error('❌ [DailyAttendance] Check-in error:', err),
      }),
    );
  }

  /**
   * Realizar check-out de una persona
   */
  checkOut(request: CheckInRequest): Observable<CheckInResponse> {
    const url = `${this.API_URL}/check-out/`;
    console.log('🚀 [DailyAttendance] POST', url);
    console.log('📤 Payload:', request);
    
    return this.http.post<CheckInResponse>(url, request).pipe(
      tap({
        next: (res) => console.log('✅ [DailyAttendance] Check-out response:', res),
        error: (err) => console.error('❌ [DailyAttendance] Check-out error:', err),
      }),
    );
  }

  /**
   * Verificar si una persona tiene check-in para una fecha
   */
  verifyCheckIn(
    documentNumber: string,
    eventCode: string,
    date?: string,
  ): Observable<CheckInVerification> {
    let params = new HttpParams()
      .set('document_number', documentNumber)
      .set('event_code', eventCode);

    if (date) {
      params = params.set('date', date);
    }

    const url = `${this.API_URL}/check-in/verify/`;
    console.log('🚀 [DailyAttendance] GET', url, params.toString());
    
    return this.http.get<CheckInVerification>(url, { params }).pipe(
      tap({
        next: (res) => console.log('✅ [DailyAttendance] Verify response:', res),
        error: (err) => console.error('❌ [DailyAttendance] Verify error:', err),
      }),
    );
  }

  /**
   * Obtener asistencias de un evento en una fecha
   */
  getEventAttendance(
    eventCode: string,
    date: string,
  ): Observable<{ count: number; results: DailyAttendance[] }> {
    const params = new HttpParams()
      .set('event_code', eventCode)
      .set('date', date);

    return this.http.get<{ count: number; results: DailyAttendance[] }>(
      `${this.API_URL}/daily-attendance/`,
      { params },
    );
  }

  /**
   * Obtener asistencias de una persona
   */
  getPersonAttendance(
    documentNumber: string,
    eventCode?: string,
  ): Observable<{ count: number; results: DailyAttendance[] }> {
    let params = new HttpParams().set('document_number', documentNumber);

    if (eventCode) {
      params = params.set('event_code', eventCode);
    }

    return this.http.get<{ count: number; results: DailyAttendance[] }>(
      `${this.API_URL}/daily-attendance/`,
      { params },
    );
  }
}
