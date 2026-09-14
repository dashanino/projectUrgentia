import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-adulto-mayor',
  standalone:true,
  imports: [MatIconModule],
  templateUrl: './adulto-mayor.html',
  styleUrl: './adulto-mayor.scss',
})
export class AdultoMayor {
  private router = inject(Router);
  readonly sintomas = [
    {
      id: 'DolorCabeza',
      nombre: 'Dolor de Cabeza'
    },
    {
      id: 'DolorPecho',
      nombre: 'Dolor de Pecho'
    },
    {
      id: 'DolorAbdomen',
      nombre: 'Dolor de Abdomen'
    },
    {
      id: 'DificultadRespiratoria',
      nombre: 'Dificultad Respiratoria'
    },
    {
      id: 'Fiebre',
      nombre: 'Fiebre'
    },
    { id: 'Golpe',
      nombre: 'Caída o Golpe reciente'}

  ];

  sintomaSeleccionado: string | null = null;

  seleccionarSintoma(id: string): void {
    this.sintomaSeleccionado = id;
  }

  continuar(): void {
    if (!this.sintomaSeleccionado) {
      return;
    }

    sessionStorage.setItem(
      'banderaRoja',
      this.sintomaSeleccionado
    );

    this.router.navigate(['emergency/resultado']);
  }

  goBack(): void {
    this.router.navigate(['emergency/patient-group']);
  }
}
