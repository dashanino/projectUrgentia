import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { EmergencyService } from '../../../../services/emergency.service';

@Component({
  selector: 'app-patient-group',
  imports: [MatIconModule],
  templateUrl: './patient-group.html',
  styleUrl: './patient-group.scss',
})
export class PatientGroup {

  private router = inject(Router);
  private emergencyService = inject(EmergencyService);

  private mapaPoblaciones: Record<string, number> = {
    'Niño': 1,
    'Adulto': 2,
    'Adulto Mayor': 3,
    'Embarazada': 4,
    'Trauma/Accidente': 5
  };

  poblacionSeleccionada: string | null = null;

  seleccionarPoblacion(poblacion: string) {
    this.poblacionSeleccionada = poblacion;
  }

  estaSeleccionada(poblacion: string): boolean {
    return this.poblacionSeleccionada === poblacion;
  }

  continuar() {

    if (!this.poblacionSeleccionada) {
      return;
    }
  
    const idPretriage = sessionStorage.getItem('id_pretriage');
    const token = sessionStorage.getItem('access_token');
  
    if (!idPretriage || !token) {
      console.error('No existe un pretriaje activo');
      return;
    }
  
    const idPoblacion =
      this.mapaPoblaciones[this.poblacionSeleccionada];
  
    this.emergencyService.guardarPoblacion(
      Number(idPretriage),
      idPoblacion,
      token
    ).subscribe({
  
      next: (respuesta) => {
  
        console.log(
          'Población guardada:',
          respuesta
        );
  
        sessionStorage.setItem(
          'tipoPoblacion',
          this.poblacionSeleccionada!
        );
  
        switch (this.poblacionSeleccionada) {
  
          case 'Niño':
            this.router.navigate([
              'emergency/red-flags/nino'
            ]);
            break;
  
          case 'Adulto':
            this.router.navigate([
              'emergency/red-flags/adulto'
            ]);
            break;
  
          case 'Adulto Mayor':
            this.router.navigate([
              'emergency/red-flags/adulto-mayor'
            ]);
            break;
  
          case 'Embarazada':
            this.router.navigate([
              'emergency/red-flags/embarazada'
            ]);
            break;
  
          case 'Trauma/Accidente':
            this.router.navigate([
              'emergency/red-flags/trauma'
            ]);
            break;
        }
      },
  
      error: (error) => {
        console.error(
          'Error al guardar población:',
          error
        );
      }
  
    });
  }

  goBack() {
    this.router.navigate(['emergency/antecedentes']);
  }
}