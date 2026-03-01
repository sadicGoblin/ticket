import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  VisitorService,
  AddVisitorResponse,
  CheckRutResponse,
  ValidateSupervisorCodeResponse,
  EventToday,
} from '../../services/visitor.service';
import { ConfigService } from '../../services/config.service';

type Step = 'login' | 'registro' | 'confirmacion';
type ActiveField = 'supervisorCode' | 'rut' | 'firstName' | 'lastName';

@Component({
  selector: 'app-agregar-visitante',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agregar-visitante.component.html',
  styleUrl: './agregar-visitante.component.scss',
})
export class AgregarVisitanteComponent implements OnInit, OnDestroy {
  // Paso actual del flujo
  currentStep: Step = 'login';

  // Datos de login (paso 1)
  supervisorCode: string = '';
  showPassword: boolean = false;
  eventsToday: EventToday[] = [];
  selectedEvent: EventToday | null = null;
  showEventDropdown: boolean = false;
  loadingEvents: boolean = false;
  validatedEvent: ValidateSupervisorCodeResponse['event'] | null = null;

  // Datos del visitante (paso 2)
  documentNumber: string = '';
  firstName: string = '';
  lastName: string = '';

  // Estado
  loading: boolean = false;
  errorMessage: string = '';
  personExists: boolean = false;
  rutVerified: boolean = false;
  personData: CheckRutResponse['person'] | null = null;
  visitorsAdded: number = 0;

  // Resultado
  addedVisitor: AddVisitorResponse | null = null;

  // Timer de inactividad
  private inactivityTimeout: any = null;
  private countdownInterval: any = null;
  private readonly INACTIVITY_TIME = 120000; // 2 minutos
  tiempoRestante: number = 120;
  showTimeoutPopup: boolean = false;

  // Branding
  brandName: string = '';
  logoUrl: string | null = null;

  // Teclado alfanumérico
  activeField: ActiveField = 'supervisorCode';
  readonly alphaRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
  ];
  readonly numRow = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  constructor(
    private visitorService: VisitorService,
    private configService: ConfigService,
    private router: Router,
  ) {
    this.brandName = this.configService.currentConfig.brand.name;
    this.logoUrl = this.configService.orgLogoUrl;
  }

  ngOnInit(): void {
    // Cargar eventos al iniciar
    this.loadEvents();
  }

  loadEvents(): void {
    this.loadingEvents = true;
    this.visitorService.getEventsToday().subscribe({
      next: (response) => {
        this.loadingEvents = false;
        // Solo eventos con código de supervisor
        this.eventsToday = response.events.filter(
          (e) => e.supervisor_code !== null,
        );
      },
      error: (error) => {
        this.loadingEvents = false;
        console.error('Error al cargar eventos:', error);
      },
    });
  }

  toggleEventDropdown(): void {
    this.showEventDropdown = !this.showEventDropdown;
  }

  selectEvent(event: EventToday): void {
    this.selectedEvent = event;
    this.showEventDropdown = false;
    this.errorMessage = '';
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  ngOnDestroy(): void {
    this.clearInactivityTimer();
  }

  // ── Timer de inactividad con popup ──

  resetInactivityTimer(): void {
    this.clearInactivityTimer();
    this.tiempoRestante = 120;
    this.showTimeoutPopup = false;

    this.countdownInterval = setInterval(() => {
      this.tiempoRestante--;

      // Mostrar popup cuando quedan 30 segundos
      if (this.tiempoRestante === 30) {
        this.showTimeoutPopup = true;
      }

      if (this.tiempoRestante <= 0) {
        this.clearInactivityTimer();
        this.cerrarSesion();
      }
    }, 1000);

    this.inactivityTimeout = setTimeout(() => {
      console.log('⏱️ Timeout por inactividad');
      this.cerrarSesion();
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
    this.showTimeoutPopup = false;
  }

  continuarSesion(): void {
    this.resetInactivityTimer();
  }

  // ── Navegación ──

  volverAlInicio(): void {
    this.clearInactivityTimer();
    this.router.navigate(['/home']);
  }

  cerrarSesion(): void {
    this.clearInactivityTimer();
    this.resetFormulario();
    this.router.navigate(['/home']);
  }

  // ── Paso 1: Login con código de evento + supervisor ──

  setActiveField(field: ActiveField): void {
    this.activeField = field;
    this.errorMessage = '';
  }

  onKeyPress(key: string): void {
    if (this.currentStep === 'login') {
      // Sin timer en login
    } else {
      this.resetInactivityTimer();
    }

    switch (this.activeField) {
      case 'supervisorCode':
        if (this.supervisorCode.length < 30)
          this.supervisorCode += key.toUpperCase();
        break;
      case 'rut':
        // Extraer solo dígitos y K para validar longitud real
        const rutLimpio = this.documentNumber.replace(/[^0-9kK]/g, '');
        if (rutLimpio.length < 9) {
          this.documentNumber = rutLimpio + key.toUpperCase();
          this.formatearRut();
        }
        break;
      case 'firstName':
        if (this.firstName.length < 50) this.firstName += key;
        break;
      case 'lastName':
        if (this.lastName.length < 50) this.lastName += key;
        break;
    }
    this.errorMessage = '';
  }

  onBackspace(): void {
    if (this.currentStep !== 'login') {
      this.resetInactivityTimer();
    }

    switch (this.activeField) {
      case 'supervisorCode':
        this.supervisorCode = this.supervisorCode.slice(0, -1);
        break;
      case 'rut':
        // Limpiar formato, quitar último carácter, y reformatear
        let rutSinFormato = this.documentNumber.replace(/[^0-9kK]/g, '');
        rutSinFormato = rutSinFormato.slice(0, -1);
        this.documentNumber = rutSinFormato;
        if (rutSinFormato.length > 0) {
          this.formatearRut();
        }
        this.personExists = false;
        this.rutVerified = false;
        this.personData = null;
        break;
      case 'firstName':
        this.firstName = this.firstName.slice(0, -1);
        break;
      case 'lastName':
        this.lastName = this.lastName.slice(0, -1);
        break;
    }
  }

  onClear(): void {
    if (this.currentStep !== 'login') {
      this.resetInactivityTimer();
    }

    switch (this.activeField) {
      case 'supervisorCode':
        this.supervisorCode = '';
        break;
      case 'rut':
        this.documentNumber = '';
        this.personExists = false;
        this.rutVerified = false;
        this.personData = null;
        this.firstName = '';
        this.lastName = '';
        break;
      case 'firstName':
        this.firstName = '';
        break;
      case 'lastName':
        this.lastName = '';
        break;
    }
  }

  onSpace(): void {
    if (this.activeField === 'firstName' || this.activeField === 'lastName') {
      this.onKeyPress(' ');
    }
  }

  validarCodigo(): void {
    if (!this.selectedEvent) {
      this.errorMessage = 'Seleccione un evento';
      return;
    }
    if (!this.supervisorCode.trim()) {
      this.errorMessage = 'Ingrese el código de supervisor';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.visitorService
      .validateSupervisorCode({
        event_code: this.selectedEvent.code,
        supervisor_code: this.supervisorCode,
      })
      .subscribe({
        next: (response) => {
          this.loading = false;

          if (response.success && response.event) {
            this.validatedEvent = response.event;
            this.currentStep = 'registro';
            this.activeField = 'rut';
            this.visitorsAdded = 0;
            // Iniciar timer solo después de validar
            this.resetInactivityTimer();
          } else {
            this.errorMessage =
              response.error || 'Código de supervisor no encontrado';
          }
        },
        error: (error) => {
          this.loading = false;

          if (error.status === 403) {
            this.errorMessage = 'Código de supervisor incorrecto';
          } else if (error.status === 404) {
            this.errorMessage = 'Evento no encontrado';
          } else {
            this.errorMessage =
              error.error?.error || 'Código de supervisor no encontrado';
          }

          console.error('Error al validar código:', error);
        },
      });
  }

  // ── Paso 2: Registro de visitantes ──

  formatearRut(): void {
    let rut = this.documentNumber.replace(/[^0-9kK]/g, '');

    // Limitar a 9 caracteres (8 números + 1 DV)
    if (rut.length > 9) {
      rut = rut.slice(0, 9);
    }

    if (rut.length < 2) {
      this.documentNumber = rut;
      return;
    }

    const dv = rut.slice(-1).toUpperCase();
    const numero = rut.slice(0, -1);

    // Formatear con puntos de miles
    const numeroFormateado = numero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    this.documentNumber = `${numeroFormateado}-${dv}`;
  }

  verificarRut(): void {
    // RUT limpio sin puntos ni guión para la API
    const rutLimpio = this.documentNumber
      .replace(/[^0-9kK]/g, '')
      .toUpperCase();
    if (rutLimpio.length < 8) {
      this.errorMessage = 'RUT incompleto';
      return;
    }

    this.resetInactivityTimer();
    this.loading = true;
    this.errorMessage = '';

    this.visitorService.checkRut(rutLimpio).subscribe({
      next: (response) => {
        this.loading = false;
        this.rutVerified = true;

        if (response.exists && response.person) {
          this.personExists = true;
          this.personData = response.person;
          this.firstName = response.person.first_name;
          this.lastName = response.person.last_name;
        } else {
          this.personExists = false;
          this.personData = null;
          this.activeField = 'firstName';
        }
      },
      error: (error) => {
        this.loading = false;
        this.personExists = false;
        console.error('Error al verificar RUT:', error);
      },
    });
  }

  agregarVisitante(): void {
    if (!this.documentNumber || !this.validatedEvent) {
      this.errorMessage = 'Complete el RUT del visitante';
      return;
    }

    if (
      !this.personExists &&
      (!this.firstName.trim() || !this.lastName.trim())
    ) {
      this.errorMessage = 'Ingrese nombre y apellido del visitante';
      return;
    }

    this.resetInactivityTimer();
    this.loading = true;
    this.errorMessage = '';

    this.visitorService
      .addVisitor({
        supervisor_code: this.supervisorCode,
        supervisor_name: 'Supervisor',
        event_code: this.validatedEvent.code,
        document_number: this.documentNumber
          .replace(/[^0-9kK]/g, '')
          .toUpperCase(),
        first_name: this.firstName,
        last_name: this.lastName,
      })
      .subscribe({
        next: (response) => {
          this.loading = false;

          if (response.success) {
            this.addedVisitor = response;
            this.visitorsAdded++;
            this.currentStep = 'confirmacion';
          } else {
            this.errorMessage = response.error || 'Error al agregar visitante';
          }
        },
        error: (error) => {
          this.loading = false;

          if (error.status === 403) {
            this.errorMessage = 'Sesión expirada. Vuelva a iniciar.';
            setTimeout(() => this.cerrarSesion(), 2000);
          } else if (error.status === 400) {
            this.errorMessage =
              error.error?.error ||
              'Esta persona ya está registrada en el evento';
          } else {
            this.errorMessage = 'Error al conectar con el servidor';
          }

          console.error('Error al agregar visitante:', error);
        },
      });
  }

  // ── Paso 3: Confirmación ──

  agregarOtro(): void {
    this.resetInactivityTimer();
    // Mantener código de supervisor y evento, limpiar datos de visitante
    this.documentNumber = '';
    this.firstName = '';
    this.lastName = '';
    this.personExists = false;
    this.rutVerified = false;
    this.personData = null;
    this.addedVisitor = null;
    this.activeField = 'rut';
    this.currentStep = 'registro';
  }

  resetFormulario(): void {
    this.supervisorCode = '';
    this.showPassword = false;
    this.selectedEvent = null;
    this.showEventDropdown = false;
    this.validatedEvent = null;
    this.documentNumber = '';
    this.firstName = '';
    this.lastName = '';
    this.personExists = false;
    this.rutVerified = false;
    this.personData = null;
    this.addedVisitor = null;
    this.errorMessage = '';
    this.visitorsAdded = 0;
    this.activeField = 'supervisorCode';
    this.currentStep = 'login';
  }

  // ── Helpers ──

  get stepTitle(): string {
    switch (this.currentStep) {
      case 'login':
        return 'Acceso Supervisor';
      case 'registro':
        return 'Registrar Visitante';
      case 'confirmacion':
        return 'Visitante Agregado';
      default:
        return '';
    }
  }

  get canValidate(): boolean {
    return this.selectedEvent !== null && this.supervisorCode.trim().length > 0;
  }

  get maskedCode(): string {
    return '•'.repeat(this.supervisorCode.length);
  }

  get canAddVisitor(): boolean {
    if (!this.documentNumber || this.documentNumber.length < 8) return false;
    if (!this.firstName.trim() || !this.lastName.trim()) return false;
    return true;
  }
}
