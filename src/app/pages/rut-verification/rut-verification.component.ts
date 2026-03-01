import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CasinoService, EmpleadoCasino } from '../../services/casino.service';
import { PrinterService } from '../../services/printer.service';
import { ConfigService } from '../../services/config.service';
import { PrinterStatusComponent } from '../../components/printer-status/printer-status.component';
import {
  DailyAttendanceService,
  CheckInResponse,
  CheckInVerification,
} from '../../services/daily-attendance.service';
import { ApiEvent } from '../../services/casino.service';

@Component({
  selector: 'app-rut-verification',
  standalone: true,
  imports: [CommonModule, FormsModule, PrinterStatusComponent],
  templateUrl: './rut-verification.component.html',
  styleUrl: './rut-verification.component.scss',
})
export class RutVerificationComponent implements OnDestroy {
  rut: string = '';
  rutFormateado: string = '';
  verificando: boolean = false;
  empleado: EmpleadoCasino | null = null;
  errorMensaje: string = '';
  ticketImpreso: boolean = false;
  imprimiendo: boolean = false;
  printerStatus: 'unknown' | 'online' | 'offline' = 'unknown';
  flujoActual: string = '';

  // Estado del check-in (flujo asistencia)
  checkInStatus: 'idle' | 'loading' | 'success' | 'already' | 'error' = 'idle';
  checkInMessage: string = '';
  checkInTime: string | null = null;

  // Estado para flujo ticket con check-in requerido
  requiresCheckIn: boolean = false;
  checkInVerified: boolean = false;
  pendingEventCode: string = '';

  // Gestión de inactividad
  private inactivityTimeout: any = null;
  private countdownInterval: any = null;
  private autoRedirectTimeout: any = null;
  private readonly INACTIVITY_TIME = 60000; // 60 segundos (1 minuto)
  tiempoRestante: number = 60;
  showInactivityTimer: boolean = false; // Cambiar a true para mostrar el contador

  brandName = '';
  logoUrl: string | null = null;

  constructor(
    public casinoService: CasinoService,
    private printerService: PrinterService,
    private router: Router,
    private configService: ConfigService,
    private dailyAttendanceService: DailyAttendanceService,
  ) {
    this.brandName = this.configService.currentConfig.brand.name;
    this.logoUrl = this.configService.orgLogoUrl;
    // Leer flujo actual desde sessionStorage
    this.flujoActual = sessionStorage.getItem('flujoActual') || '';
    // Iniciar el timer de inactividad
    this.resetInactivityTimer();
  }

  ngOnDestroy(): void {
    // Limpiar timers al destruir el componente
    this.clearInactivityTimer();
    this.clearAutoRedirectTimer();
  }

  /**
   * Gestión del timer de inactividad
   */
  resetInactivityTimer(): void {
    this.clearInactivityTimer();
    this.tiempoRestante = 60;

    // Iniciar countdown
    this.countdownInterval = setInterval(() => {
      this.tiempoRestante--;
      if (this.tiempoRestante <= 0) {
        this.clearInactivityTimer();
      }
    }, 1000);

    // Configurar timeout para resetear
    this.inactivityTimeout = setTimeout(() => {
      console.log('⏱️ Timeout por inactividad - Reseteando formulario');
      this.resetearFormulario();
    }, this.INACTIVITY_TIME);
  }

  clearInactivityTimer(): void {
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
      this.inactivityTimeout = null;
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  clearAutoRedirectTimer(): void {
    if (this.autoRedirectTimeout) {
      clearTimeout(this.autoRedirectTimeout);
      this.autoRedirectTimeout = null;
    }
  }

  /**
   * Agregar dígito desde el teclado numérico
   */
  agregarDigito(digito: string): void {
    // Reiniciar el timer de inactividad
    this.resetInactivityTimer();

    // Limitar longitud a 9 caracteres (8 números + 1 DV)
    if (this.rut.length >= 9) {
      return;
    }

    // Si ya hay un guión y se intenta agregar otro, ignorar
    if (digito === '-' && this.rut.includes('-')) {
      return;
    }

    // Si ya hay una K, no permitir más caracteres
    if (this.rut.toUpperCase().includes('K')) {
      return;
    }

    // Agregar el dígito
    this.rut += digito.toUpperCase();
    this.actualizarRutFormateado();
    this.errorMensaje = ''; // Limpiar mensaje de error
  }

  /**
   * Borrar el último dígito
   */
  borrarUltimoDigito(): void {
    if (this.rut.length > 0) {
      this.rut = this.rut.substring(0, this.rut.length - 1);
      this.actualizarRutFormateado();
      this.errorMensaje = '';
      this.resetInactivityTimer();
    }
  }

  /**
   * Actualizar el formato visual del RUT
   */
  private actualizarRutFormateado(): void {
    if (this.rut.length === 0) {
      this.rutFormateado = '';
      return;
    }

    // Intentar formatear automáticamente
    const cleaned = this.rut.replace(/[^\dkK]/g, '');

    if (cleaned.length >= 2) {
      this.rutFormateado = this.casinoService.formatearRut(cleaned);
    } else {
      this.rutFormateado = cleaned;
    }
  }

  /**
   * Formatea el RUT mientras el usuario escribe
   */
  onRutInput(): void {
    // Limpiar caracteres no válidos
    let cleaned = this.rut.replace(/[^\dkK]/g, '');

    // Limitar longitud
    if (cleaned.length > 9) {
      cleaned = cleaned.substring(0, 9);
    }

    this.rut = cleaned;

    // Formatear para mostrar
    if (cleaned.length >= 2) {
      this.rutFormateado = this.casinoService.formatearRut(cleaned);
    } else {
      this.rutFormateado = cleaned;
    }

    // Resetear timer de inactividad
    this.resetInactivityTimer();
  }

  /**
   * Verifica el RUT ingresado
   */
  verificarRut(): void {
    // Limpiar mensajes anteriores
    this.errorMensaje = '';
    this.empleado = null;
    this.ticketImpreso = false;

    // Validar que el RUT no esté vacío
    if (!this.rut || this.rut.trim() === '') {
      this.errorMensaje = 'Por favor ingrese un RUT';
      return;
    }

    // Validar longitud mínima del RUT (al menos 8 caracteres)
    const rutLimpio = this.rut.replace(/[^\dkK]/g, '');
    if (rutLimpio.length < 8) {
      this.errorMensaje = 'RUT incompleto. Debe tener al menos 8 dígitos';
      return;
    }

    // NOTA: La validación del dígito verificador se hace en el servidor
    // Aquí solo validamos formato básico para mejor UX

    // Iniciar verificación
    this.verificando = true;

    this.casinoService.verificarTicketCasino(this.rut).subscribe({
      next: (respuesta) => {
        this.verificando = false;

        if (respuesta.success && respuesta.empleado) {
          // Guardar datos del empleado en el servicio para acceso global
          sessionStorage.setItem(
            'empleadoActual',
            JSON.stringify(respuesta.empleado),
          );

          // Navegar según el flujo seleccionado
          const flujo = sessionStorage.getItem('flujoActual') || 'ticket';
          if (flujo === 'ticket') {
            // Verificar check-in antes de continuar
            if (
              respuesta.empleado.eventos &&
              respuesta.empleado.eventos.length > 0
            ) {
              const evento = respuesta.empleado.eventos[0];
              sessionStorage.setItem('eventoActual', JSON.stringify(evento));
              this.empleado = respuesta.empleado;
              this.verificarCheckInParaTicket(respuesta.empleado, evento);
            } else {
              this.errorMensaje = 'No tiene eventos asignados para hoy';
            }
          } else {
            // Flujo de registro de asistencia - hacer check-in real
            this.empleado = respuesta.empleado;
            this.realizarCheckIn(respuesta.empleado);
          }
        } else {
          this.errorMensaje =
            respuesta.mensaje || 'No se pudo verificar el RUT';
        }
      },
      error: (error) => {
        this.verificando = false;
        this.errorMensaje =
          'Error al conectar con el servidor. Intente nuevamente';
        console.error('Error en verificación:', error);
      },
    });
  }

  /**
   * Imprime el ticket de casino
   * NOTA: Este método se usa desde las vistas posteriores con el tipo de comida seleccionado
   */
  imprimirTicket(tipoComida?: string): void {
    if (!this.empleado) return;

    this.imprimiendo = true;
    this.errorMensaje = '';

    const nombreTicket = tipoComida || 'Comida';
    const productos = [
      {
        nombre: `Ticket de ${nombreTicket}`,
        cantidad: 1,
        precio: 0,
      },
    ];

    const numeroPedido = `CASINO-${new Date().getTime()}`;

    this.printerService
      .imprimirTicket(
        productos,
        undefined,
        numeroPedido,
        this.empleado.rut,
        this.empleado.nombre,
        numeroPedido,
        this.brandName,
      )
      .subscribe({
        next: (respuesta) => {
          this.imprimiendo = false;

          if (respuesta.resultado === 'ok') {
            console.log('✅ Ticket impreso exitosamente');
            this.ticketImpreso = true;

            // Resetear después de 5 segundos
            this.autoRedirectTimeout = setTimeout(() => {
              this.resetearFormulario();
            }, 5000);
          } else {
            this.errorMensaje = `Error al imprimir: ${respuesta.mensaje}`;
            console.error('❌ Error en impresión:', respuesta.mensaje);
          }
        },
        error: (error) => {
          this.imprimiendo = false;
          this.errorMensaje =
            'No se pudo conectar con la impresora. Verifique la conexión';
          console.error('❌ Error de conexión con impresora:', error);
        },
      });
  }

  /**
   * Verifica si el usuario tiene check-in antes de ir a ticket casino
   */
  private verificarCheckInParaTicket(
    empleado: EmpleadoCasino,
    evento: ApiEvent,
  ): void {
    // RUT limpio sin puntos ni guión para la API
    const documentNumber = empleado.rut.replace(/[^\dkK]/g, '').toUpperCase();

    this.pendingEventCode = evento.code;
    console.log(
      '🔍 Verificando check-in para ticket. check_in_required:',
      evento.check_in_required,
    );

    this.dailyAttendanceService
      .verifyCheckIn(documentNumber, evento.code)
      .subscribe({
        next: (verification: CheckInVerification) => {
          console.log('✅ Verificación check-in:', verification);

          if (verification.has_check_in || verification.can_redeem_tickets) {
            // Ya tiene check-in O el backend dice que puede canjear (modo automático)
            if (verification.has_check_in) {
              console.log(
                '✅ Usuario ya tiene check-in, continuando a selección',
              );
            } else {
              console.log(
                '🔓 Backend permite canjear tickets (modo automático), continuando a selección',
              );
            }
            this.clearInactivityTimer();
            this.router.navigate(['/comida-seleccion']);
          } else {
            // No tiene check-in y no puede canjear
            if (evento.check_in_required === false) {
              // Modo permisivo: hacer check-in automático
              console.log('🔓 Modo permisivo: realizando check-in automático');
              this.realizarCheckInAutomatico(empleado, evento);
            } else {
              // Modo restrictivo: mostrar mensaje
              console.log('🔒 Modo restrictivo: requiere check-in manual');
              this.requiresCheckIn = true;
              this.checkInVerified = true;
              this.checkInStatus = 'idle';
              this.checkInMessage =
                'Debe registrar su asistencia antes de obtener tickets';
            }
          }
        },
        error: (error) => {
          console.error('❌ Error verificando check-in:', error);
          // En caso de error, asumir que necesita check-in si es restrictivo
          if (evento.check_in_required === false) {
            // Modo permisivo: intentar check-in automático
            this.realizarCheckInAutomatico(empleado, evento);
          } else {
            // Modo restrictivo: mostrar opción de registrarse
            this.requiresCheckIn = true;
            this.checkInVerified = true;
            this.checkInMessage =
              'Debe registrar su asistencia antes de obtener tickets';
          }
        },
      });
  }

  /**
   * Realiza check-in automático (modo permisivo)
   */
  private realizarCheckInAutomatico(
    empleado: EmpleadoCasino,
    evento: ApiEvent,
  ): void {
    // RUT limpio sin puntos ni guión para la API
    const documentNumber = empleado.rut.replace(/[^\dkK]/g, '').toUpperCase();

    this.checkInStatus = 'loading';
    this.checkInMessage = 'Registrando asistencia automáticamente...';

    this.dailyAttendanceService
      .checkIn({
        document_number: documentNumber,
        event_code: evento.code,
      })
      .subscribe({
        next: (response: CheckInResponse) => {
          console.log('✅ Check-in automático exitoso:', response);
          // Continuar a selección de comida
          this.clearInactivityTimer();
          this.router.navigate(['/comida-seleccion']);
        },
        error: (error) => {
          console.error('❌ Error en check-in automático:', error);
          // Si ya existe, continuar de todos modos
          if (error.error?.existing_check_in) {
            console.log('ℹ️ Ya tenía check-in, continuando');
            this.clearInactivityTimer();
            this.router.navigate(['/comida-seleccion']);
          } else {
            // Continuar de todos modos en modo permisivo
            console.log(
              '⚠️ Error en check-in auto, continuando de todos modos',
            );
            this.clearInactivityTimer();
            this.router.navigate(['/comida-seleccion']);
          }
        },
      });
  }

  /**
   * Registrar asistencia manualmente (botón en UI)
   */
  registrarAsistenciaManual(): void {
    if (!this.empleado || !this.pendingEventCode) return;

    // RUT limpio sin puntos ni guión para la API
    const documentNumber = this.empleado.rut
      .replace(/[^\dkK]/g, '')
      .toUpperCase();

    this.checkInStatus = 'loading';
    this.checkInMessage = 'Registrando asistencia...';

    this.dailyAttendanceService
      .checkIn({
        document_number: documentNumber,
        event_code: this.pendingEventCode,
      })
      .subscribe({
        next: (response: CheckInResponse) => {
          if (response.success) {
            console.log('✅ Check-in manual exitoso');
            this.checkInStatus = 'success';
            this.checkInMessage = 'Asistencia registrada correctamente';
            // Esperar un momento y luego continuar
            setTimeout(() => {
              this.clearInactivityTimer();
              this.router.navigate(['/comida-seleccion']);
            }, 1500);
          } else {
            this.checkInStatus = 'error';
            this.checkInMessage = response.error || 'Error al registrar';
          }
        },
        error: (error) => {
          console.error('❌ Error en check-in manual:', error);
          if (error.error?.existing_check_in) {
            // Ya tenía check-in, puede continuar
            this.clearInactivityTimer();
            this.router.navigate(['/comida-seleccion']);
          } else {
            this.checkInStatus = 'error';
            this.checkInMessage =
              error.error?.error || 'Error al registrar asistencia';
          }
        },
      });
  }

  /**
   * Realiza el check-in de asistencia llamando a la API
   */
  realizarCheckIn(empleado: EmpleadoCasino): void {
    // Verificar que haya al menos un evento
    if (!empleado.eventos || empleado.eventos.length === 0) {
      this.checkInStatus = 'error';
      this.checkInMessage = 'No tiene eventos asignados para hoy';
      return;
    }

    const evento = empleado.eventos[0];
    this.checkInStatus = 'loading';
    this.checkInMessage = 'Registrando asistencia...';

    // RUT limpio sin puntos ni guión para la API
    const documentNumber = empleado.rut.replace(/[^\dkK]/g, '').toUpperCase();

    this.dailyAttendanceService
      .checkIn({
        document_number: documentNumber,
        event_code: evento.code,
      })
      .subscribe({
        next: (response: CheckInResponse) => {
          if (response.success && response.data) {
            this.checkInStatus = 'success';
            this.checkInMessage = response.message || 'Asistencia registrada';
            this.checkInTime = response.data.check_in_time;
            console.log('✅ Check-in exitoso:', response.data);

            // Auto-volver al home después de 5 segundos
            this.autoRedirectTimeout = setTimeout(() => {
              this.resetearFormulario();
            }, 5000);
          } else if (response.existing_check_in) {
            // Ya tiene check-in para hoy
            this.checkInStatus = 'already';
            this.checkInMessage =
              response.error || 'Ya registró asistencia hoy';
            this.checkInTime = response.existing_check_in.check_in_time;
            console.log('ℹ️ Ya tiene check-in:', response.existing_check_in);

            // Auto-volver después de 5 segundos
            this.autoRedirectTimeout = setTimeout(() => {
              this.resetearFormulario();
            }, 5000);
          } else {
            this.checkInStatus = 'error';
            this.checkInMessage =
              response.error || 'Error al registrar asistencia';
          }
        },
        error: (error) => {
          console.error('❌ Error en check-in:', error);
          this.checkInStatus = 'error';

          // Manejar error de ya existente (puede venir como 400)
          if (error.error?.existing_check_in) {
            this.checkInStatus = 'already';
            this.checkInMessage = 'Ya registró asistencia hoy';
            this.checkInTime = error.error.existing_check_in.check_in_time;

            this.autoRedirectTimeout = setTimeout(() => {
              this.resetearFormulario();
            }, 5000);
          } else {
            this.checkInMessage =
              error.error?.error ||
              error.error?.message ||
              'Error al conectar con el servidor';
          }
        },
      });
  }

  /**
   * Resetea el formulario para nueva verificación
   */
  resetearFormulario(): void {
    this.rut = '';
    this.rutFormateado = '';
    this.empleado = null;
    this.errorMensaje = '';
    this.ticketImpreso = false;
    this.imprimiendo = false;
    this.checkInStatus = 'idle';
    this.checkInMessage = '';
    this.checkInTime = null;
    this.requiresCheckIn = false;
    this.checkInVerified = false;
    this.pendingEventCode = '';
    this.clearInactivityTimer();
    this.clearAutoRedirectTimer();
    // Volver al inicio (home)
    this.router.navigate(['/home']);
  }

  /**
   * Volver al menu principal
   */
  volverAlMenu(): void {
    this.clearInactivityTimer();
    this.clearAutoRedirectTimer();
    sessionStorage.removeItem('empleadoActual');
    sessionStorage.removeItem('flujoActual');
    this.router.navigate(['/home']);
  }

  /**
   * Maneja el Enter en el input
   */
  onEnter(event: Event): void {
    event.preventDefault();
    this.verificarRut();
  }
}
