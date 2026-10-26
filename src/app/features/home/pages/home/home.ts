import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { EmergencyService } from '../../../../services/emergency.service';

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
  private emergencyService = inject(EmergencyService);

  iniciandoEvaluacion = false;

  nuevaEvaluacion(): void {
    if (this.iniciandoEvaluacion) {
      return;
    }

    const token = sessionStorage.getItem('access_token');

    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    this.iniciandoEvaluacion = true;

    this.emergencyService.iniciarPretriageRegistrado(token).subscribe({
      next: (respuesta) => {
        this.iniciandoEvaluacion = false;

        sessionStorage.setItem(
          'id_pretriage',
          String(respuesta.id_pretriage)
        );

        sessionStorage.setItem(
          'id_poblacion',
          String(respuesta.id_poblacion)
        );

        sessionStorage.setItem(
          'pretriage_registrado',
          'true'
        );

        sessionStorage.setItem(
          'requiere_confirmacion_antecedentes',
          String(respuesta.requiere_confirmacion_antecedentes)
        );

        sessionStorage.setItem(
          'requiere_confirmacion_poblacion_especial',
          String(respuesta.requiere_confirmacion_poblacion_especial)
        );

        console.log('Pre-triage registrado creado:', respuesta);

        // Navegación provisional.
        // Antes de ir a las banderas rojas debemos implementar
        // la confirmación clínica del paciente.
        // Seleccionar la pantalla según la población calculada
        const rutasPoblacion: Record<number, string> = {
          1: '/emergency/red-flags/nino',
          2: '/emergency/red-flags/adulto',
          3: '/emergency/red-flags/adulto-mayor',
        };

        const ruta = rutasPoblacion[respuesta.id_poblacion];

        if (!ruta) {
          console.error('Población no reconocida:', respuesta.id_poblacion);
          alert('No se pudo determinar la pantalla de evaluación.');
          return;
        }

        // Temporalmente solo comprobamos la ruta calculada.
        // No saltar la confirmación clínica en el flujo definitivo.
        console.log('Ruta calculada para el paciente:', ruta);

        this.router.navigate(['/app/confirmacion-clinica']);
      },

      error: (error) => {
        this.iniciandoEvaluacion = false;
        console.error('Error al iniciar el pre-triage:', error);
        alert(
          error.error?.error ||
          'No fue posible iniciar la evaluación. Inténtalo nuevamente.'
        );
      },
    });
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
          eps: epsId,
        },
      });
      return;
    }

    this.router.navigate(['/tramites']);
  }
}