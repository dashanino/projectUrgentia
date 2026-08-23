import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-patient-group',
  imports: [MatIconModule],
  templateUrl: './patient-group.html',
  styleUrl: './patient-group.scss',
})
export class PatientGroup {

  private router = inject(Router);

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

    sessionStorage.setItem(
      'tipoPoblacion',
      this.poblacionSeleccionada
    );

    this.router.navigate(['/emergency/red-flags']);
  }


  goBack() {
    this.router.navigate(['/emergency/antecedentes']);
  }
}
