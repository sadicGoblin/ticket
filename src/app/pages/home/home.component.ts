import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ConfigService } from '../../services/config.service';
import { PrinterStatusComponent } from '../../components/printer-status/printer-status.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, PrinterStatusComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  config = this.configService.currentConfig;
  logoUrl = this.configService.orgLogoUrl;

  // Admin panel
  private tapCount = 0;
  private tapTimer: any = null;
  private readonly TAP_THRESHOLD = 7;
  private readonly TAP_WINDOW = 4000; // 4 segundos para completar los 7 taps
  showAdminMenu = false;
  showPasswordModal = false;
  adminPassword = '';
  passwordError = '';

  constructor(
    private router: Router,
    private configService: ConfigService,
  ) {
    // Limpiar cualquier flujo previo al volver al home
    sessionStorage.removeItem('flujoActual');
    sessionStorage.removeItem('empleadoActual');
    sessionStorage.removeItem('tipoServicio');
  }

  seleccionarFlujo(flujo: 'ticket' | 'asistencia'): void {
    sessionStorage.setItem('flujoActual', flujo);
    this.router.navigate(['/rut-verification']);
  }

  // ── Hidden admin trigger ──

  onAdminTap(): void {
    this.tapCount++;

    if (this.tapTimer) {
      clearTimeout(this.tapTimer);
    }

    if (this.tapCount >= this.TAP_THRESHOLD) {
      this.tapCount = 0;
      this.showAdminMenu = true;
      return;
    }

    this.tapTimer = setTimeout(() => {
      this.tapCount = 0;
    }, this.TAP_WINDOW);
  }

  closeAdminMenu(): void {
    this.showAdminMenu = false;
    this.showPasswordModal = false;
    this.adminPassword = '';
    this.passwordError = '';
  }

  solicitarSalida(): void {
    this.showAdminMenu = false;
    this.showPasswordModal = true;
    this.adminPassword = '';
    this.passwordError = '';
  }

  // ── PIN keypad ──

  onPinKey(digit: string): void {
    if (this.adminPassword.length >= 10) return;
    this.adminPassword += digit;
    this.passwordError = '';

    // Auto-submit cuando llega a 4 dígitos
    if (this.adminPassword.length === 4) {
      setTimeout(() => this.confirmarSalida(), 200);
    }
  }

  onPinBackspace(): void {
    this.adminPassword = this.adminPassword.slice(0, -1);
    this.passwordError = '';
  }

  confirmarSalida(): void {
    if (this.adminPassword === '1234') {
      this.showPasswordModal = false;
      // Salir del modo kiosko: cerrar la ventana o navegar fuera
      window.close();
      // Fallback si window.close() no funciona (no fue abierta por script)
      // Mostrar instrucciones
      document.body.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Inter,sans-serif;background:#f8f9fa;">
          <div style="text-align:center;">
            <h1 style="font-size:2rem;color:#2e2f32;margin-bottom:12px;">Modo Kiosco Desactivado</h1>
            <p style="color:#74787b;font-size:1.1rem;">Puede cerrar esta ventana manualmente.</p>
          </div>
        </div>
      `;
    } else {
      this.passwordError = 'Clave incorrecta';
      this.adminPassword = '';
    }
  }

  cambiarConfiguracion(): void {
    this.router.navigate(['/setup'], { queryParams: { reconfig: '1' } });
  }
}
