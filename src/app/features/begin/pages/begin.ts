import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { EmergencyService } from '../../../services/emergency.service';

@Component({
  selector: 'app-begin',
  imports: [],
  templateUrl: './begin.html',
  styleUrl: './begin.scss',
})
export class Begin {

  private router = inject(Router);
  private emergencyService = inject(EmergencyService);

  irEmergencia() {

    this.emergencyService.iniciarPretriage().subscribe({

      next: (respuesta) => {

        console.log('Pretriaje creado:', respuesta);

        sessionStorage.setItem(
          'access_token',
          respuesta.access_token
        );

        sessionStorage.setItem(
          'id_pretriage',
          respuesta.id_pretriage.toString()
        );

        sessionStorage.setItem(
          'id_user',
          respuesta.id_user.toString()
        );

        this.router.navigate(['emergency/antecedentes']);
      },

      error: (error) => {
        console.error(
          'Error al iniciar el pretriaje:',
          error
        );
      }

    });
  }

  irLogin() {
    this.router.navigate(['/login']);
  }
}