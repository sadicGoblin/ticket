import { Component, OnInit, OnDestroy } from '@angular/core';
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
export class HomeComponent implements OnInit, OnDestroy {
  config = this.configService.currentConfig;
  logoUrl = this.configService.orgLogoUrl;

  // Estado de conexión a internet
  isOnline: boolean = navigator.onLine;
  private onlineHandler = () => this.updateOnlineStatus(true);
  private offlineHandler = () => this.updateOnlineStatus(false);

  // NPS
  npsRating: number | null = null;
  npsFollowUp: string[] = [];
  npsSubmitted: boolean = false;
  npsSending: boolean = false;
  readonly npsFaces = [
    { value: 1, emoji: '😡', label: 'Muy mal' },
    { value: 2, emoji: '😕', label: 'Mal' },
    { value: 3, emoji: '😐', label: 'Regular' },
    { value: 4, emoji: '😊', label: 'Bien' },
    { value: 5, emoji: '😍', label: 'Excelente' },
  ];
  readonly npsPositiveOptions = [
    'Fue fácil de usar',
    'El proceso fue rápido',
  ];

  // Admin panel
  private tapCount = 0;
  private tapTimer: any = null;
  private readonly TAP_THRESHOLD = 7;
  private readonly TAP_WINDOW = 4000; // 4 segundos para completar los 7 taps
  showAdminMenu = false;
  showPasswordModal = false;
  adminPassword = '';
  passwordError = '';
  pendingAction: 'salir' | 'configurar' | null = null;

  constructor(
    private router: Router,
    private configService: ConfigService,
  ) {
    // Limpiar cualquier flujo previo al volver al home
    sessionStorage.removeItem('flujoActual');
    sessionStorage.removeItem('empleadoActual');
    sessionStorage.removeItem('tipoServicio');
  }

  ngOnInit(): void {
    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);
  }

  ngOnDestroy(): void {
    window.removeEventListener('online', this.onlineHandler);
    window.removeEventListener('offline', this.offlineHandler);
  }

  private updateOnlineStatus(online: boolean): void {
    this.isOnline = online;
  }

  seleccionarFlujo(flujo: 'ticket' | 'asistencia' | 'visitante'): void {
    sessionStorage.setItem('flujoActual', flujo);

    if (flujo === 'visitante') {
      this.router.navigate(['/agregar-visitante']);
    } else {
      this.router.navigate(['/rut-verification']);
    }
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
    this.pendingAction = 'salir';
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
      setTimeout(() => this.confirmarAccion(), 200);
    }
  }

  onPinBackspace(): void {
    this.adminPassword = this.adminPassword.slice(0, -1);
    this.passwordError = '';
  }

  private getAdminCode(): string {
    const day = new Date().getDate().toString().padStart(2, '0');
    return '00' + day;
  }

  confirmarAccion(): void {
    if (this.adminPassword === this.getAdminCode()) {
      this.showPasswordModal = false;

      if (this.pendingAction === 'salir') {
        // Salir del modo kiosko: cerrar la ventana o navegar fuera
        window.close();
        // Fallback si window.close() no funciona (no fue abierta por script)
        document.body.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Inter,sans-serif;background:#f8f9fa;">
            <div style="text-align:center;">
              <h1 style="font-size:2rem;color:#2e2f32;margin-bottom:12px;">Modo Kiosco Desactivado</h1>
              <p style="color:#74787b;font-size:1.1rem;">Puede cerrar esta ventana manualmente.</p>
            </div>
          </div>
        `;
      } else if (this.pendingAction === 'configurar') {
        this.router.navigate(['/setup'], { queryParams: { reconfig: '1' } });
      }

      this.pendingAction = null;
    } else {
      this.passwordError = 'Clave incorrecta';
      this.adminPassword = '';
    }
  }

  cambiarConfiguracion(): void {
    this.pendingAction = 'configurar';
    this.showAdminMenu = false;
    this.showPasswordModal = true;
    this.adminPassword = '';
    this.passwordError = '';
  }

  // ── NPS ──

  selectNpsRating(value: number): void {
    this.npsRating = value;
    this.npsFollowUp = [];
  }

  toggleFollowUp(option: string): void {
    const idx = this.npsFollowUp.indexOf(option);
    if (idx >= 0) {
      this.npsFollowUp.splice(idx, 1);
    } else {
      this.npsFollowUp.push(option);
    }
  }

  submitNps(): void {
    if (!this.npsRating) return;
    this.npsSending = true;

    // Simular envío (reemplazar con llamada real a API)
    console.log('📊 NPS enviado:', {
      rating: this.npsRating,
      followUp: this.npsFollowUp,
    });

    setTimeout(() => {
      this.npsSending = false;
      this.npsSubmitted = true;

      // Reset después de 4 segundos
      setTimeout(() => this.resetNps(), 4000);
    }, 600);
  }

  private resetNps(): void {
    this.npsRating = null;
    this.npsFollowUp = [];
    this.npsSubmitted = false;
    this.npsSending = false;
  }
}
