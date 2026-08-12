import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'begin',
  },

  {
    path: 'begin',
    loadComponent: () =>
      import('./features/begin/pages/begin')
        .then((m) => m.Begin),
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login/login')
        .then((m) => m.Login),
  },

  {
    path: 'registro',
    loadComponent: () =>
      import('./features/auth/pages/register/register')
        .then((m) => m.Register),
  },

  {
    path: 'recuperar-contraseña',
    loadComponent: () =>
      import('./features/auth/pages/forgot-password/account-data/account-data')
        .then((m) => m.AccountData),
  },

  {
    path: 'home',
    loadComponent: () =>
      import('./features/home/pages/home/home')
        .then((m) => m.Home),
  },

  // Emergency
  {
    path: 'emergency/patient-group',
    loadComponent: () =>
      import('./features/emergency/pages/patient-group/patient-group')
        .then((m) => m.PatientGroup),
  },

  {
    path: 'emergency/antecedentes',
    loadComponent: () =>
      import('./features/emergency/pages/antecedentes/antecedentes')
        .then((m) => m.Antecedentes),
  },

  {
    path: 'emergency/red-flags',
    loadComponent: () =>
      import('./features/emergency/pages/red-flags/red-flags')
        .then((m) => m.RedFlags),
  },

  {
    path: '**',
    redirectTo: 'begin',
  },
];
