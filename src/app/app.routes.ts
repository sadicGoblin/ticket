import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'rut-verification',
    loadComponent: () => import('./pages/rut-verification/rut-verification.component').then(m => m.RutVerificationComponent)
  },
  {
    path: 'servicio-seleccion',
    loadComponent: () => import('./pages/servicio-seleccion/servicio-seleccion.component').then(m => m.ServicioSeleccionComponent)
  },
  {
    path: 'comida-seleccion',
    loadComponent: () => import('./pages/comida-seleccion/comida-seleccion.component').then(m => m.ComidaSeleccionComponent)
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: '',
    redirectTo: 'rut-verification',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'rut-verification'
  }
];
