
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

interface UsuarioSesion {
  id: number;
  first_names?: string;
  last_names?: string;
  id_eps?: number | null;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {

  private router = inject(Router);
  nuevaEvaluacion(): void {
    this.router.navigate(['/emergency/red-flags/adulto']);
  }

  irPerfil(): void {
    this.router.navigate(['/app/perfil']);
  }

  irATramites(): void {
    const usuarioGuardado = sessionStorage.getItem('user');

    if (!usuarioGuardado) {
      this.router.navigate(['/login']);
      return;
    }

    let usuario: UsuarioSesion;

    try {
      usuario = JSON.parse(usuarioGuardado) as UsuarioSesion;
    } catch {
      this.router.navigate(['/login']);
      return;
    }

    const epsId = Number(usuario.id_eps);

    if (Number.isInteger(epsId) && epsId > 0) {
      this.router.navigate(['/tramites/seleccionar-tramite'], {
        queryParams: {
          eps: epsId
        }
      });
      return;
    }

    // Si el paciente no tiene EPS registrada,
    // puede seleccionarla manualmente.
    this.router.navigate(['/tramites']);
  }
}
