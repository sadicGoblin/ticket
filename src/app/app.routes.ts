import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { ConfigService } from './services/config.service';

/**
 * Guard: redirige a /setup si no hay código de organización configurado.
 */
const configuredGuard = () => {
  const configService = inject(ConfigService);
  if (!configService.isConfigured) {
    const router = inject(Router);
    return router.parseUrl('/setup');
  }
  return true;
};

export const routes: Routes = [
  {
    path: 'setup',
    loadComponent: () =>
      import('./pages/setup/setup.component').then((m) => m.SetupComponent),
  },
  {
    path: 'rut-verification',
    canActivate: [configuredGuard],
    loadComponent: () =>
      import('./pages/rut-verification/rut-verification.component').then(
        (m) => m.RutVerificationComponent,
      ),
  },
  {
    path: 'servicio-seleccion',
    loadComponent: () =>
      import('./pages/servicio-seleccion/servicio-seleccion.component').then(
        (m) => m.ServicioSeleccionComponent,
      ),
  },
  {
    path: 'comida-seleccion',
    canActivate: [configuredGuard],
    loadComponent: () =>
      import('./pages/comida-seleccion/comida-seleccion.component').then(
        (m) => m.ComidaSeleccionComponent,
      ),
  },
  {
    path: 'agregar-visitante',
    canActivate: [configuredGuard],
    loadComponent: () =>
      import('./pages/agregar-visitante/agregar-visitante.component').then(
        (m) => m.AgregarVisitanteComponent,
      ),
  },
  {
    path: 'home',
    canActivate: [configuredGuard],
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: '',
    pathMatch: 'full',
    canActivate: [configuredGuard],
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
