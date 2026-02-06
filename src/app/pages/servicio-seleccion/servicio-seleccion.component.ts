import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EmpleadoCasino } from '../../services/casino.service';
import { ConfigService } from '../../services/config.service';

@Component({
  selector: 'app-servicio-seleccion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './servicio-seleccion.component.html',
  styleUrl: './servicio-seleccion.component.scss',
})
export class ServicioSeleccionComponent implements OnInit, OnDestroy {
  empleado: EmpleadoCasino | null = null;
  private inactivityTimeout: any = null;
  private readonly INACTIVITY_TIME = 60000; // 60 segundos

  brandName = '';
  logoUrl = this.configService.orgLogoUrl;

  constructor(
    private router: Router,
    private configService: ConfigService,
  ) {
    this.brandName = this.configService.currentConfig.brand.name;
  }

  ngOnInit(): void {
    // Recuperar datos del empleado desde sessionStorage
    const empleadoData = sessionStorage.getItem('empleadoActual');
    if (empleadoData) {
      this.empleado = JSON.parse(empleadoData);
      // Iniciar timer de inactividad
      this.resetInactivityTimer();
    } else {
      // Si no hay datos, redirigir al inicio
      this.router.navigate(['/home']);
    }
  }

  ngOnDestroy(): void {
    this.clearInactivityTimer();
  }

  private resetInactivityTimer(): void {
    this.clearInactivityTimer();
    this.inactivityTimeout = setTimeout(() => {
      console.log('⏱️ Timeout por inactividad - Volviendo al inicio');
      this.volver();
    }, this.INACTIVITY_TIME);
  }

  private clearInactivityTimer(): void {
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
      this.inactivityTimeout = null;
    }
  }

  seleccionarParaLlevar(): void {
    this.clearInactivityTimer();
    sessionStorage.setItem('tipoServicio', 'para-llevar');
    this.guardarEventoYNavegar();
  }

  seleccionarParaServir(): void {
    this.clearInactivityTimer();
    sessionStorage.setItem('tipoServicio', 'para-servir');
    this.guardarEventoYNavegar();
  }

  private guardarEventoYNavegar(): void {
    // Guardar el primer evento en sessionStorage para comida-seleccion
    if (
      this.empleado &&
      this.empleado.eventos &&
      this.empleado.eventos.length > 0
    ) {
      sessionStorage.setItem(
        'eventoActual',
        JSON.stringify(this.empleado.eventos[0]),
      );
    }
    this.router.navigate(['/comida-seleccion']);
  }

  volver(): void {
    // Limpiar datos y volver al inicio
    this.clearInactivityTimer();
    sessionStorage.removeItem('empleadoActual');
    sessionStorage.removeItem('tipoServicio');
    sessionStorage.removeItem('flujoActual');
    this.router.navigate(['/home']);
  }
}
