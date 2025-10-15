import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CasinoService, EmpleadoCasino, TipoComida, TipoComidaInfo } from '../../services/casino.service';
import { PrinterService } from '../../services/printer.service';

@Component({
  selector: 'app-comida-seleccion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comida-seleccion.component.html',
  styleUrl: './comida-seleccion.component.scss'
})
export class ComidaSeleccionComponent implements OnInit, OnDestroy {
  empleado: EmpleadoCasino | null = null;
  tipoServicio: string = '';
  tiposComida: TipoComidaInfo[] = [];
  seleccionado: TipoComida | null = null;
  imprimiendo: boolean = false;
  private inactivityTimeout: any = null;
  private readonly INACTIVITY_TIME = 60000; // 60 segundos

  constructor(
    private router: Router,
    private casinoService: CasinoService,
    private printerService: PrinterService
  ) {}

  ngOnInit(): void {
    // Recuperar datos
    const empleadoData = sessionStorage.getItem('empleadoActual');
    this.tipoServicio = sessionStorage.getItem('tipoServicio') || '';

    if (!empleadoData || !this.tipoServicio) {
      this.router.navigate(['/']);
      return;
    }

    this.empleado = JSON.parse(empleadoData);
    this.tiposComida = this.casinoService.getTiposComida();
    
    // Iniciar timer de inactividad
    this.resetInactivityTimer();
  }

  ngOnDestroy(): void {
    this.clearInactivityTimer();
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
   * Verifica si un tipo de comida está disponible para el empleado
   */
  estaDisponibleParaEmpleado(tipoComida: TipoComidaInfo): boolean {
    if (!this.empleado) return false;
    return this.empleado.opcionesDisponibles.includes(tipoComida.nombre);
  }

  /**
   * Selecciona un tipo de comida
   */
  seleccionarComida(tipoComida: TipoComidaInfo): void {
    if (!this.estaDisponibleParaEmpleado(tipoComida)) return;
    
    this.seleccionado = tipoComida.nombre;
    this.resetInactivityTimer(); // Resetear timer al interactuar
  }

  /**
   * Confirma la selección e imprime el ticket
   */
  confirmarSeleccion(): void {
    if (!this.seleccionado || !this.empleado) return;

    this.clearInactivityTimer(); // Detener timer durante impresión
    this.imprimiendo = true;

    const tipoServicioTexto = this.tipoServicio === 'para-llevar' ? '(Para Llevar)' : '(Para Servir)';
    const productos = [{
      nombre: `Ticket de ${this.seleccionado} ${tipoServicioTexto}`,
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
      }
    });
  }

  /**
   * Volver a la pantalla anterior
   */
  volver(): void {
    this.clearInactivityTimer();
    sessionStorage.removeItem('tipoServicio');
    this.router.navigate(['/servicio-seleccion']);
  }

  /**
   * Volver al inicio y limpiar todo
   */
  volverAlInicio(): void {
    this.clearInactivityTimer();
    sessionStorage.removeItem('empleadoActual');
    sessionStorage.removeItem('tipoServicio');
    this.router.navigate(['/']);
  }
}
