import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export type TipoComida = 'Desayuno' | 'Almuerzo' | 'Cena' | 'Colación' | 'Nocturna' | 'Otros';

export interface EmpleadoCasino {
  rut: string;
  nombre: string;
  area: string;
  turno: string;
  opcionesDisponibles: TipoComida[];
}

export interface TipoComidaInfo {
  id: string;
  nombre: TipoComida;
  icono: string;
  disponible: boolean;
  horario: string;
}

export interface RespuestaVerificacion {
  success: boolean;
  empleado?: EmpleadoCasino;
  mensaje?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CasinoService {
  // URL de la API - cambiar en producción
  private readonly API_URL = 'http://localhost:3000/api';

  // Base de datos simulada para desarrollo
  private empleadosSimulados: EmpleadoCasino[] = [
    {
      rut: '12345678-9',
      nombre: 'JUAN PEREZ L.',
      area: 'Producción',
      turno: 'Mañana',
      opcionesDisponibles: ['Desayuno', 'Almuerzo', 'Colación']
    },
    {
      rut: '15091233-K',
      nombre: 'MARIA GONZALEZ S.',
      area: 'Administración',
      turno: 'Tarde',
      opcionesDisponibles: ['Almuerzo', 'Colación']
    },
    {
      rut: '20542874-7',
      nombre: 'PEDRO RODRIGUEZ M.',
      area: 'Mantención',
      turno: 'Noche',
      opcionesDisponibles: ['Cena', 'Nocturna']
    },
    {
      rut: '18765432-1',
      nombre: 'ANA MARTINEZ V.',
      area: 'Ventas',
      turno: 'Mañana',
      opcionesDisponibles: ['Desayuno', 'Almuerzo']
    },
    {
      rut: '11111111-1',
      nombre: 'SOFIA FERNANDEZ R.',
      area: 'RRHH',
      turno: 'Mañana',
      opcionesDisponibles: ['Desayuno', 'Almuerzo']
    },
    {
      rut: '22222222-2',
      nombre: 'DIEGO SANCHEZ P.',
      area: 'Calidad',
      turno: 'Noche',
      opcionesDisponibles: ['Cena', 'Nocturna', 'Otros']
    }
  ];

  private tiposComida: TipoComidaInfo[] = [
    { id: 'desayuno', nombre: 'Desayuno', icono: 'utensils', disponible: true, horario: '07:00 - 09:00' },
    { id: 'almuerzo', nombre: 'Almuerzo', icono: 'utensils', disponible: true, horario: '12:00 - 14:30' },
    { id: 'cena', nombre: 'Cena', icono: 'utensils', disponible: false, horario: '19:00 - 21:00' },
    { id: 'colacion', nombre: 'Colación', icono: 'utensils', disponible: true, horario: '16:00 - 17:00' },
    { id: 'nocturna', nombre: 'Nocturna', icono: 'utensils', disponible: false, horario: '00:00 - 02:00' },
    { id: 'otros', nombre: 'Otros', icono: 'utensils', disponible: false, horario: 'Variable' }
  ];

  constructor(private http: HttpClient) {}

  /**
   * Verifica si un empleado tiene ticket de casino disponible
   * @param rut RUT del empleado (con o sin formato)
   * @returns Observable con la respuesta de verificación
   */
  verificarTicketCasino(rut: string): Observable<RespuestaVerificacion> {
    // Limpiar el RUT (quitar puntos y guiones)
    const rutLimpio = this.limpiarRut(rut);
    
    // Para desarrollo, usar datos simulados
    // En producción, descomentar la línea siguiente:
    // return this.http.post<RespuestaVerificacion>(`${this.API_URL}/casino/verificar`, { rut: rutLimpio });
    
    // Simulación para desarrollo
    return this.verificarTicketSimulado(rutLimpio);
  }

  /**
   * Marca un ticket como utilizado
   * @param rut RUT del empleado
   * @returns Observable con confirmación
   */
  marcarTicketUtilizado(rut: string): Observable<any> {
    const rutLimpio = this.limpiarRut(rut);
    
    // En producción:
    // return this.http.post(`${this.API_URL}/casino/marcar-utilizado`, { rut: rutLimpio });
    
    // Simulación
    return of({ success: true, mensaje: 'Ticket marcado como utilizado' }).pipe(delay(500));
  }

  /**
   * Limpia el formato del RUT (quita puntos y guiones)
   * @param rut RUT con o sin formato
   * @returns RUT limpio
   */
  private limpiarRut(rut: string): string {
    return rut.replace(/\./g, '').replace(/-/g, '');
  }

  /**
   * Formatea el RUT para mostrarlo (12.345.678-9)
   * @param rut RUT sin formato
   * @returns RUT formateado
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
   * @param rut RUT a validar
   * @returns true si es válido, false si no
   */
  validarRut(rut: string): boolean {
    const rutLimpio = this.limpiarRut(rut);
    
    // Verificar largo mínimo
    if (rutLimpio.length < 8 || rutLimpio.length > 9) {
      return false;
    }

    // Extraer número y dígito verificador
    const numero = parseInt(rutLimpio.slice(0, -1), 10);
    const dv = rutLimpio.slice(-1).toLowerCase();

    // Calcular dígito verificador
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

  /**
   * Obtiene información de tipos de comida
   * @returns Array de tipos de comida disponibles
   */
  getTiposComida(): TipoComidaInfo[] {
    return this.tiposComida;
  }

  /**
   * Verificación simulada para desarrollo
   * @param rut RUT limpio
   * @returns Observable con respuesta simulada
   */
  private verificarTicketSimulado(rut: string): Observable<RespuestaVerificacion> {
    const empleado = this.empleadosSimulados.find(emp => 
      this.limpiarRut(emp.rut) === rut
    );

    if (empleado) {
      return of({
        success: true,
        empleado: empleado,
        mensaje: `Usuario encontrado: ${empleado.nombre}`
      }).pipe(delay(1000)); // Simular latencia de red
    } else {
      return of({
        success: false,
        mensaje: 'RUT no encontrado en el sistema'
      }).pipe(delay(1000));
    }
  }
}
