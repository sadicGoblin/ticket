import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// ── Interfaces que coinciden con la respuesta real de la API ──

export interface ApiTemplate {
  id: number;
  organization: number;
  organization_name?: string;
  organization_detail?: ApiOrganization;
  name: string;
  slug?: string;
  code: string;
  data: ClientConfig;
  is_active: boolean;
  is_removed?: boolean;
  created?: string;
  modified?: string;
}

export interface ApiOrganization {
  id: number;
  name: string;
  slug: string;
  code: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string;
  logo: string | null;
  logo_url: string | null;
  description: string;
  is_active: boolean;
}

export interface ApiEvent {
  id: number;
  code: string;
  name: string;
  slug?: string;
  description?: string;
  location?: string;
  organization: ApiOrganization;
  template: ApiTemplate | null;
  date_start?: string;
  date_end?: string;
  status: string;
  is_active_event?: boolean;
}

export interface ApiEventAttendanceResponse {
  event: ApiEvent;
  dates: any[];
  services: any[];
  attendees: any[];
}

// Respuesta de /api/organization-templates/?code=XXX
export interface ApiOrganizationTemplatesResponse {
  id: number;
  name: string;
  slug: string;
  code: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string;
  logo: string | null;
  logo_url: string | null;
  description: string;
  is_active: boolean;
  templates: ApiTemplate[];
  active_templates: ApiTemplate[];
  templates_count: number;
  created: string;
  modified: string;
}

/**
 * Estructura de configuración del cliente (viene dentro de template.data).
 */
export interface ClientConfig {
  brand: {
    name: string;
    subtitle: string;
    logo_url: string | null;
    welcome_message: string;
    welcome_description: string;
  };
  colors: {
    primary: string;
    primary_dark: string;
    primary_darker: string;
    accent: string;
    accent_light: string;
  };
  status_colors: {
    success: string;
    error: string;
    warning: string;
  };
  neutral_colors: {
    background: string;
    surface: string;
    border: string;
    text_primary: string;
    text_secondary: string;
    text_muted: string;
  };
  flows: {
    ticket_enabled: boolean;
    ticket_label: string;
    ticket_description: string;
    asistencia_enabled: boolean;
    asistencia_label: string;
    asistencia_description: string;
    visitante_enabled: boolean;
    visitante_label: string;
    visitante_description: string;
  };
}

const DEFAULT_CONFIG: ClientConfig = {
  brand: {
    name: 'Rinno',
    subtitle: 'Sistema de Casino',
    logo_url: null,
    welcome_message: 'Bienvenidos',
    welcome_description: 'Seleccione una opción para continuar',
  },
  colors: {
    primary: '#0071dc',
    primary_dark: '#004c91',
    primary_darker: '#00254a',
    accent: '#ffc220',
    accent_light: '#ffd655',
  },
  status_colors: {
    success: '#2d8c3c',
    error: '#de1c24',
    warning: '#f57c00',
  },
  neutral_colors: {
    background: '#f8f9fa',
    surface: '#ffffff',
    border: '#e9ecef',
    text_primary: '#2e2f32',
    text_secondary: '#74787b',
    text_muted: '#adb5bd',
  },
  flows: {
    ticket_enabled: true,
    ticket_label: 'Ticket Casino',
    ticket_description: 'Obtener ticket de alimentación',
    asistencia_enabled: true,
    asistencia_label: 'Registro Asistencia',
    asistencia_description: 'Registrar asistencia',
    visitante_enabled: true,
    visitante_label: 'Agregar Visitante',
    visitante_description: 'Registrar visitante en evento',
  },
};

const ORG_CODE_KEY = 'orgCode';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private readonly API_URL = environment.apiUrl;
  private config$ = new BehaviorSubject<ClientConfig>(DEFAULT_CONFIG);
  private orgName$ = new BehaviorSubject<string>('');
  private logoUrl$ = new BehaviorSubject<string | null>(null);

  /** Observable de la configuración actual */
  config = this.config$.asObservable();

  /** Acceso directo a la configuración actual */
  get currentConfig(): ClientConfig {
    return this.config$.value;
  }

  /** Nombre de la organización desde la API */
  get orgName(): string {
    return this.orgName$.value;
  }

  /** Logo URL de la organización desde la API */
  get orgLogoUrl(): string | null {
    return this.logoUrl$.value;
  }

  constructor(private http: HttpClient) {}

  // ── Gestión del código de organización (localStorage) ──

  /** Verifica si ya existe un código de organización guardado */
  get isConfigured(): boolean {
    return !!localStorage.getItem(ORG_CODE_KEY);
  }

  /** Obtiene el código de organización guardado */
  get orgCode(): string | null {
    return localStorage.getItem(ORG_CODE_KEY);
  }

  /** Guarda el código de organización en localStorage */
  saveOrgCode(code: string): void {
    localStorage.setItem(ORG_CODE_KEY, code);
  }

  /** Elimina el código (para reconfigurar) */
  clearOrgCode(): void {
    localStorage.removeItem(ORG_CODE_KEY);
  }

  // ── Carga de configuración desde la API ──

  /**
   * Carga la configuración del cliente desde la API.
   * @param code Código de la organización (ej: "WM001")
   */
  loadConfig(code: string): Observable<ClientConfig> {
    return this.http
      .get<ApiOrganizationTemplatesResponse>(
        `${this.API_URL}/organization-templates/?code=${code}`,
      )
      .pipe(
        map((response) => {
          // Guardar nombre y logo de la organización
          this.orgName$.next(response.name || '');
          this.logoUrl$.next(response.logo_url || response.logo || null);

          // Extraer data del primer template activo
          const template = response.active_templates?.[0] || response.templates?.[0];
          if (!template?.data) {
            console.warn('⚠️ Organización sin template, usando configuración por defecto');
            return null;
          }
          return template.data;
        }),
        map((configData) => {
          const merged = this.mergeWithDefaults(configData || {});
          this.config$.next(merged);
          this.applyCssVariables(merged);
          console.log('✅ Configuración cargada:', merged.brand.name);
          return merged;
        }),
      );
  }

  /**
   * Carga la configuración usando el código de organización guardado en localStorage.
   * Si no hay código guardado, aplica defaults.
   */
  loadSavedConfig(): Observable<ClientConfig> {
    const code = this.orgCode;
    if (!code) {
      this.applyCssVariables(DEFAULT_CONFIG);
      return of(DEFAULT_CONFIG);
    }
    return this.loadConfig(code).pipe(
      catchError((error) => {
        console.warn(
          '⚠️ No se pudo cargar la configuración guardada, usando defaults:',
          error,
        );
        this.applyCssVariables(DEFAULT_CONFIG);
        return of(DEFAULT_CONFIG);
      }),
    );
  }

  // ── Aplicación de CSS variables ──

  private applyCssVariables(config: ClientConfig): void {
    const root = document.documentElement;

    // Colores principales
    root.style.setProperty('--wm-blue', config.colors.primary);
    root.style.setProperty('--wm-blue-dark', config.colors.primary_dark);
    root.style.setProperty('--wm-blue-darker', config.colors.primary_darker);
    root.style.setProperty('--wm-yellow', config.colors.accent);
    root.style.setProperty('--wm-accent', config.colors.accent);
    root.style.setProperty('--wm-yellow-light', config.colors.accent_light);

    // Colores de estado
    root.style.setProperty('--wm-success', config.status_colors.success);
    root.style.setProperty('--wm-error', config.status_colors.error);
    root.style.setProperty('--wm-warning', config.status_colors.warning);

    // Colores neutros
    root.style.setProperty('--wm-gray-50', config.neutral_colors.background);
    root.style.setProperty('--wm-white', config.neutral_colors.surface);
    root.style.setProperty('--wm-gray-200', config.neutral_colors.border);
    root.style.setProperty('--wm-gray-900', config.neutral_colors.text_primary);
    root.style.setProperty(
      '--wm-gray-500',
      config.neutral_colors.text_secondary,
    );
    root.style.setProperty('--wm-gray-400', config.neutral_colors.text_muted);

    // RGB channels para uso con rgba()
    root.style.setProperty(
      '--wm-blue-rgb',
      this.hexToRgb(config.colors.primary),
    );
    root.style.setProperty(
      '--wm-blue-dark-rgb',
      this.hexToRgb(config.colors.primary_dark),
    );
    root.style.setProperty(
      '--wm-yellow-rgb',
      this.hexToRgb(config.colors.accent),
    );
    root.style.setProperty(
      '--wm-accent-rgb',
      this.hexToRgb(config.colors.accent),
    );
    root.style.setProperty(
      '--wm-success-rgb',
      this.hexToRgb(config.status_colors.success),
    );
    root.style.setProperty(
      '--wm-error-rgb',
      this.hexToRgb(config.status_colors.error),
    );
  }

  private hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '0, 0, 0';
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }

  private mergeWithDefaults(partial: Partial<ClientConfig>): ClientConfig {
    return {
      brand: { ...DEFAULT_CONFIG.brand, ...(partial.brand || {}) },
      colors: { ...DEFAULT_CONFIG.colors, ...(partial.colors || {}) },
      status_colors: {
        ...DEFAULT_CONFIG.status_colors,
        ...(partial.status_colors || {}),
      },
      neutral_colors: {
        ...DEFAULT_CONFIG.neutral_colors,
        ...(partial.neutral_colors || {}),
      },
      flows: { ...DEFAULT_CONFIG.flows, ...(partial.flows || {}) },
    };
  }
}
