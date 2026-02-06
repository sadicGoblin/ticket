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
  private inactivityTimeout: any = null;
  private countdownInterval: any = null;
  private readonly INACTIVITY_TIME = 60000; // 60 segundos

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
    this.inactivityTimeout = setTimeout(() => {
      console.log('⏱️ Timeout por inactividad - Volviendo al inicio');
      this.volverAlInicio();
    }, this.INACTIVITY_TIME);
  }

  private clearInactivityTimer(): void {
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
      this.inactivityTimeout = null;
    }
  }

  /**
   * Selecciona un servicio de comida (solo si tiene ticket y está en horario)
   */
  seleccionarComida(servicio: ServicioComida): void {
    if (!servicio.disponible || servicio.estadoHorario !== 'disponible') return;

    this.seleccionado = servicio;
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
   * Confirma la selección e imprime el ticket
   */
  confirmarSeleccion(): void {
    if (!this.seleccionado || !this.empleado) return;

    this.clearInactivityTimer();
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
            console.log('✅ Ticket impreso exitosamente');

            // Limpiar datos y volver al inicio después de 3 segundos
            setTimeout(() => {
              this.volverAlInicio();
            }, 3000);
          } else {
            console.error('❌ Error en impresión:', respuesta.mensaje);
            alert('Error al imprimir el ticket. Intente nuevamente.');
            this.imprimiendo = false;
          }
        },
        error: (error) => {
          this.imprimiendo = false;
          console.error('❌ Error de conexión con impresora:', error);
          alert('No se pudo conectar con la impresora. Verifique la conexión.');
        },
      });
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
