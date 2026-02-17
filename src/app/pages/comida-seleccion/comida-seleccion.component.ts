import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  CasinoService,
  EmpleadoCasino,
  ApiEvent,
  ServicioComida,
} from '../../services/casino.service';
import { PrinterService } from '../../services/printer.service';
import { ConfigService } from '../../services/config.service';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-comida-seleccion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comida-seleccion.component.html',
  styleUrl: './comida-seleccion.component.scss',
})
export class ComidaSeleccionComponent implements OnInit, OnDestroy {
  empleado: EmpleadoCasino | null = null;
  tipoServicio: string = '';
  eventoActual: ApiEvent | null = null;
  servicios: ServicioComida[] = [];
  seleccionado: ServicioComida | null = null;
  imprimiendo: boolean = false;
  mostrarPreviewTicket: boolean = false;
  qrDataUrl: string = '';
  mostrarAvisoReimpresion: boolean = false;
  servicioReimpresion: ServicioComida | null = null;

  // Toast notification
  toastVisible: boolean = false;
  toastMensaje: string = '';
  toastTipo: 'error' | 'success' | 'warning' = 'error';
  private toastTimeout: any = null;
  private inactivityTimeout: any = null;
  private countdownInterval: any = null;
  private readonly INACTIVITY_TIME = 60000; // 60 segundos

  // Inactivity warning modal
  mostrarAvisoInactividad: boolean = false;
  inactividadCountdown: number = 15;
  private readonly INACTIVITY_WARNING_TIME = 15; // 15 segundos para responder
  private inactividadInterval: any = null;

  brandName = '';
  logoUrl: string | null = null;

  constructor(
    private router: Router,
    public casinoService: CasinoService,
    private printerService: PrinterService,
    private configService: ConfigService,
  ) {
    this.brandName = this.configService.currentConfig.brand.name;
    this.logoUrl = this.configService.orgLogoUrl;
  }

  ngOnInit(): void {
    // Recuperar datos
    const empleadoData = sessionStorage.getItem('empleadoActual');
    this.tipoServicio = sessionStorage.getItem('tipoServicio') || '';
    const eventoData = sessionStorage.getItem('eventoActual');

    if (!empleadoData) {
      this.router.navigate(['/home']);
      return;
    }

    this.empleado = JSON.parse(empleadoData);

    // Recuperar evento actual o usar el primero disponible
    if (eventoData) {
      this.eventoActual = JSON.parse(eventoData);
    } else if (
      this.empleado &&
      this.empleado.eventos &&
      this.empleado.eventos.length > 0
    ) {
      this.eventoActual = this.empleado.eventos[0];
    }

    if (this.eventoActual) {
      // Extraer servicios del evento con disponibilidad basada en person_tickets
      this.servicios = this.casinoService.getServiciosDeEvento(
        this.eventoActual,
      );
    }

    // Iniciar timer de inactividad
    this.resetInactivityTimer();

    // Iniciar countdown en vivo para servicios 'proximamente'
    this.startCountdown();
  }

  ngOnDestroy(): void {
    this.clearInactivityTimer();
    this.cerrarAvisoInactividad();
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  /**
   * Tick cada segundo: decrementa segundosParaAbrir y
   * cambia estado a 'disponible' cuando llega a 0.
   */
  private startCountdown(): void {
    this.countdownInterval = setInterval(() => {
      let changed = false;
      for (const s of this.servicios) {
        if (s.estadoHorario === 'proximamente' && s.segundosParaAbrir > 0) {
          s.segundosParaAbrir--;
          changed = true;
          if (s.segundosParaAbrir <= 0) {
            s.estadoHorario = 'disponible';
          }
        }
      }
      // Si ya no quedan servicios 'proximamente', parar el interval
      if (!changed) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }
    }, 1000);
  }

  private resetInactivityTimer(): void {
    this.clearInactivityTimer();
    this.cerrarAvisoInactividad();
    this.inactivityTimeout = setTimeout(() => {
      this.mostrarWarningInactividad();
    }, this.INACTIVITY_TIME);
  }

  private clearInactivityTimer(): void {
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
      this.inactivityTimeout = null;
    }
  }

  /**
   * Muestra el modal de advertencia de inactividad con countdown de 15s
   */
  private mostrarWarningInactividad(): void {
    this.mostrarAvisoInactividad = true;
    this.inactividadCountdown = this.INACTIVITY_WARNING_TIME;

    this.inactividadInterval = setInterval(() => {
      this.inactividadCountdown--;
      if (this.inactividadCountdown <= 0) {
        this.cerrarAvisoInactividad();
        console.log('⏱️ Timeout por inactividad - Volviendo al inicio');
        this.volverAlInicio();
      }
    }, 1000);
  }

  /**
   * El usuario confirma que necesita más tiempo
   */
  confirmarMasTiempo(): void {
    this.cerrarAvisoInactividad();
    this.resetInactivityTimer();
  }

  /**
   * Cierra el modal de inactividad y limpia el interval
   */
  private cerrarAvisoInactividad(): void {
    this.mostrarAvisoInactividad = false;
    if (this.inactividadInterval) {
      clearInterval(this.inactividadInterval);
      this.inactividadInterval = null;
    }
  }

  /**
   * Selecciona un servicio de comida.
   * - redeemed: bloqueado, no se puede seleccionar.
   * - printed: muestra aviso de reimpresión.
   * - pending/disponible: selección normal.
   */
  seleccionarComida(servicio: ServicioComida): void {
    if (!servicio.disponible || servicio.estadoHorario !== 'disponible') return;

    // Ticket ya cobrado → bloqueado
    if (servicio.ticketStatus === 'redeemed') return;

    // Ticket ya impreso → mostrar aviso de reimpresión
    if (servicio.ticketStatus === 'printed') {
      this.servicioReimpresion = servicio;
      this.mostrarAvisoReimpresion = true;
      this.resetInactivityTimer();
      return;
    }

    this.seleccionado = servicio;
    this.resetInactivityTimer();
  }

  /**
   * Confirma la reimpresión desde el modal de aviso
   */
  confirmarReimpresion(): void {
    if (!this.servicioReimpresion) return;
    this.seleccionado = this.servicioReimpresion;
    this.mostrarAvisoReimpresion = false;
    this.servicioReimpresion = null;
    this.confirmarSeleccion();
  }

  /**
   * Cancela el aviso de reimpresión
   */
  cancelarReimpresion(): void {
    this.mostrarAvisoReimpresion = false;
    this.servicioReimpresion = null;
    this.resetInactivityTimer();
  }

  /**
   * Formatea "HH:mm:ss" → "HH:mm"
   */
  formatHora(time: string | null): string {
    if (!time) return '';
    return time.slice(0, 5);
  }

  /**
   * Muestra un toast in-app (reemplaza alert())
   */
  mostrarToast(
    mensaje: string,
    tipo: 'error' | 'success' | 'warning' = 'error',
  ): void {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastMensaje = mensaje;
    this.toastTipo = tipo;
    this.toastVisible = true;
    this.toastTimeout = setTimeout(() => {
      this.toastVisible = false;
      this.toastTimeout = null;
    }, 4000);
  }

  cerrarToast(): void {
    this.toastVisible = false;
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
      this.toastTimeout = null;
    }
  }

  /**
   * Confirma la selección y muestra el preview del ticket
   */
  confirmarSeleccion(): void {
    if (!this.seleccionado || !this.empleado) return;

    this.clearInactivityTimer();

    // Solo mostrar preview, NO cambiar estado aún
    this.generarQR(this.seleccionado.ticketNumber || '');
    this.mostrarPreviewTicket = true;
  }

  /**
   * Genera un QR code como data URL a partir del codigo del ticket
   */
  private generarQR(code: string): void {
    if (!code) {
      this.qrDataUrl = '';
      return;
    }
    QRCode.toDataURL(code, {
      width: 200,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then((url: string) => {
        this.qrDataUrl = url;
      })
      .catch(() => {
        this.qrDataUrl = '';
      });
  }

  /**
   * Cierra el preview sin navegar (para seleccionar otro servicio)
   */
  cerrarPreviewSinNavegar(): void {
    this.mostrarPreviewTicket = false;
    this.qrDataUrl = '';
    this.seleccionado = null;
    this.resetInactivityTimer();
  }

  /**
   * Maneja click en el overlay del preview (cierra si es fuera del modal)
   */
  onOverlayClick(event: MouseEvent): void {
    if (
      (event.target as HTMLElement).classList.contains('ticket-preview-overlay')
    ) {
      this.cerrarPreviewSinNavegar();
    }
  }

  /**
   * Imprime el ticket desde el preview
   */
  imprimirDesdePreview(): void {
    if (!this.seleccionado || !this.empleado) return;

    this.imprimiendo = true;

    const productos = [
      {
        nombre: `Ticket de ${this.seleccionado.nombre}`,
        cantidad: 1,
        precio: 0,
      },
    ];

    const numeroPedido =
      this.seleccionado.ticketNumber || `CASINO-${new Date().getTime()}`;

    this.printerService
      .imprimirTicket(
        productos,
        undefined,
        numeroPedido,
        this.empleado.rut,
        this.empleado.nombre,
      )
      .subscribe({
        next: (respuesta) => {
          this.imprimiendo = false;
          if (respuesta.resultado === 'ok') {
            this.mostrarToast('Ticket enviado a la impresora', 'success');

            // Solo marcar como 'printed' DESPUÉS de que la impresora confirme éxito
            if (
              this.seleccionado?.ticketId &&
              this.seleccionado.ticketStatus === 'pending'
            ) {
              this.casinoService
                .updateTicketStatus(this.seleccionado.ticketId, 'printed')
                .subscribe({
                  next: () => {
                    console.log('✅ Estado del ticket actualizado a printed');
                    if (this.seleccionado) {
                      this.seleccionado.ticketStatus = 'printed';
                    }
                  },
                  error: (err) =>
                    console.warn('⚠️ No se pudo actualizar estado:', err),
                });
            }
          } else {
            this.mostrarToast(
              'Error al imprimir. Intente nuevamente.',
              'error',
            );
          }
        },
        error: () => {
          this.imprimiendo = false;
          this.mostrarToast('No se pudo conectar con la impresora.', 'error');
        },
      });
  }

  /**
   * Cierra el preview del ticket y vuelve al inicio
   */
  cerrarPreview(): void {
    this.mostrarPreviewTicket = false;
    this.volverAlInicio();
  }

  /**
   * Volver a la pantalla anterior
   */
  volver(): void {
    this.clearInactivityTimer();
    this.router.navigate(['/rut-verification']);
  }

  /**
   * Volver al inicio y limpiar todo
   */
  volverAlInicio(): void {
    this.clearInactivityTimer();
    sessionStorage.removeItem('empleadoActual');
    sessionStorage.removeItem('eventoActual');
    sessionStorage.removeItem('flujoActual');
    this.router.navigate(['/home']);
  }
}
