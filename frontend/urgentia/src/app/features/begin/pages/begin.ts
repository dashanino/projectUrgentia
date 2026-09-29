import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
// import { EmergencyService } from '../../../services/emergency.service';

@Component({
  selector: 'app-begin',
  imports: [],
  templateUrl: './begin.html',
  styleUrl: './begin.scss',
})
export class Begin {

  private router = inject(Router);

  // Servicio de emergencias desactivado temporalmente
  // private emergencyService = inject(EmergencyService);

  cargandoEmergencia = false;
  errorEmergencia = '';

  irEmergencia() {

    /*
    // CONEXIÓN CON FLASK DESACTIVADA TEMPORALMENTE

    // Evitar múltiples clics
    if (this.cargandoEmergencia) return;

    this.cargandoEmergencia = true;
    this.errorEmergencia = '';

    // 1. Llamar al Service para crear el usuario NN y su pretriaje
    this.emergencyService.iniciarEmergencia().subscribe({

      next: (respuesta) => {

        // 2. Guardar los datos de la sesión temporal
        sessionStorage.setItem(
          'emergency_token',
          respuesta.access_token
        );

        sessionStorage.setItem(
          'id_user_nn',
          String(respuesta.id_user)
        );

        sessionStorage.setItem(
          'id_pretriage',
          String(respuesta.id_pretriage)
        );

        // 3. Redirigir a Antecedentes
        this.router.navigate(['/antecedentes']).then((navego) => {
          if (!navego) {
            this.errorEmergencia =
              'No se pudo abrir la pantalla de antecedentes.';
          }

          this.cargandoEmergencia = false;
        });
      },

      error: (error) => {
        console.error('Error al iniciar emergencia:', error);

        this.errorEmergencia =
          'No se pudo iniciar el pretriaje. Inténtalo nuevamente.';

        this.cargandoEmergencia = false;
      }
    });
    */

    // NAVEGACIÓN TEMPORAL:
    // Abrir Antecedentes sin crear el usuario NN ni el pretriaje.
    this.router.navigate(['/antecedentes']);
  }

  irLogin() {
    this.router.navigate(['/login']);
  }
}