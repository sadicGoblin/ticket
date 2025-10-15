import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CasinoService, EmpleadoCasino } from '../../services/casino.service';
import { PrinterService } from '../../services/printer.service';

@Component({
  selector: 'app-rut-verification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rut-verification.component.html',
  styleUrl: './rut-verification.component.scss'
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

  // Gestión de inactividad
  private inactivityTimeout: any = null;
  private countdownInterval: any = null;
  private readonly INACTIVITY_TIME = 60000; // 60 segundos (1 minuto)
  tiempoRestante: number = 60;
  showInactivityTimer: boolean = false; // Cambiar a true para mostrar el contador

  constructor(
    public casinoService: CasinoService,
    private printerService: PrinterService,
    private router: Router
  ) {
    // Verificar estado de la impresora al iniciar
    this.verificarImpresora();
    // Iniciar el timer de inactividad
    this.resetInactivityTimer();
  }

  ngOnDestroy(): void {
    // Limpiar timers al destruir el componente
    this.clearInactivityTimer();
  }

  /**
   * Verifica si la impresora está disponible
   */
  verificarImpresora(): void {
    this.printerService.verificarConexion().subscribe({
      next: () => {
        this.printerStatus = 'online';
        console.log('✅ Impresora conectada');
      },
      error: () => {
        this.printerStatus = 'offline';
        console.warn('⚠️ Impresora no conectada - Los tickets no se imprimirán');
      }
    });
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

  /**
   * Agregar dígito desde el teclado numérico
   */
  agregarDigito(digito: string): void {
    // Reiniciar el timer de inactividad
    this.resetInactivityTimer();

    // Limitar longitud a 10 caracteres (incluye guión)
    if (this.rut.length >= 10) {
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
          sessionStorage.setItem('empleadoActual', JSON.stringify(respuesta.empleado));
          
          // Navegar a la vista de selección de tipo de servicio
          this.router.navigate(['/servicio-seleccion']);
        } else {
          this.errorMensaje = respuesta.mensaje || 'No se pudo verificar el RUT';
        }
      },
      error: (error) => {
        this.verificando = false;
        this.errorMensaje = 'Error al conectar con el servidor. Intente nuevamente';
        console.error('Error en verificación:', error);
      }
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
    const productos = [{
      nombre: `Ticket de ${nombreTicket}`,
      cantidad: 1,
      precio: 0
    }];

    const numeroPedido = `CASINO-${new Date().getTime()}`;

    this.printerService.imprimirTicket(
      productos,
      undefined,
      numeroPedido,
      this.empleado.rut,
      this.empleado.nombre
    ).subscribe({
      next: (respuesta) => {
        this.imprimiendo = false;

        if (respuesta.resultado === 'ok') {
          console.log('✅ Ticket impreso exitosamente');
          this.ticketImpreso = true;
          
          // Marcar ticket como utilizado
          this.casinoService.marcarTicketUtilizado(this.empleado!.rut).subscribe();

          // Resetear después de 5 segundos
          setTimeout(() => {
            this.resetearFormulario();
          }, 5000);
        } else {
          this.errorMensaje = `Error al imprimir: ${respuesta.mensaje}`;
          console.error('❌ Error en impresión:', respuesta.mensaje);
        }
      },
      error: (error) => {
        this.imprimiendo = false;
        this.errorMensaje = 'No se pudo conectar con la impresora. Verifique la conexión';
        console.error('❌ Error de conexión con impresora:', error);
      }
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
    // Reiniciar timer de inactividad
    this.resetInactivityTimer();
  }

  /**
   * Maneja el Enter en el input
   */
  onEnter(event: Event): void {
    event.preventDefault();
    this.verificarRut();
  }
}
