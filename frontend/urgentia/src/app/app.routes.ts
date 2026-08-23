import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guards';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'begin',
  },

  {
    path: 'begin',
    loadComponent: () => import('./features/begin/pages/begin').then((m) => m.Begin),
  },

  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login/login').then((m) => m.Login),
  },

  {
    path: 'registro',
    loadComponent: () => import('./features/auth/pages/register/register').then((m) => m.Register),
  },

  {
    path: 'recuperar-contraseña',
    loadComponent: () =>
      import('./features/auth/pages/forgot-password/account-data/account-data').then(
        (m) => m.AccountData,
      ),
  },

  {
    path: 'recuperar-contraseña/codigo',
    loadComponent: () =>
      import('./features/auth/pages/forgot-password/verify-code/verify-code').then(
        (m) => m.VerifyCode,
      ),
  },
  {
    path: 'recuperar-contraseña/nueva-contraseña',
    loadComponent: () =>
      import('./features/auth/pages/forgot-password/new-password/new-password').then(
        (m) => m.NewPassword,
      ),
  },
  {
    path: 'recuperar-contraseña/exito',
    loadComponent: () =>
      import('./features/auth/pages/forgot-password/success/success').then((m) => m.Success),
  },
  {
    //se puede especificar el rol para ingrsar [authGuard, estudiante]
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./features/home/pages/home/home').then((m) => m.Home),
  },

  // Emergency
  {
    path: 'patient-group',
    loadComponent: () =>
      import('./features/emergency/pages/patient-group/patient-group').then((m) => m.PatientGroup),
  },

  {
    path: 'antecedentes',
    loadComponent: () =>
      import('./features/emergency/pages/antecedentes/antecedentes').then((m) => m.Antecedentes),
  },

  {
    path: 'red-flags/adulto',
    loadComponent: () =>
      import('./features/emergency/pages/red-flags/adulto/adulto').then((m) => m.Adulto),
  },
  {
    path: 'red-flags/adulto-mayor',
    loadComponent: () =>
      import('./features/emergency/pages/red-flags/adulto-mayor/adulto-mayor').then(
        (m) => m.AdultoMayor,
      ),
  },
  {
    path: 'red-flags/embarazada',
    loadComponent: () =>
      import('./features/emergency/pages/red-flags/embarazada/embarazada').then(
        (m) => m.Embarazada,
      ),
  },
  {
    path: 'red-flags/nino',
    loadComponent: () =>
      import('./features/emergency/pages/red-flags/nino/nino').then((m) => m.Nino),
  },
  {
    path: 'red-flags/trauma',
    loadComponent: () =>
      import('./features/emergency/pages/red-flags/trauma/trauma').then((m) => m.Trauma),
  },
  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () => import('./features/perfil/pages/perfil/perfil').then((m) => m.Perfil),
  },

  {
    path: '**',
    redirectTo: 'begin',
  },
];
