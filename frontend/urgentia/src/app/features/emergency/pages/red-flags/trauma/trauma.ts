import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-trauma',
  standalone:true,
  imports: [MatIconModule],
  templateUrl: './trauma.html',
  styleUrl: './trauma.scss',
})
export class Trauma {
  private router = inject(Router);

  readonly sintomas = [
    {
      id: 'HeridaProfunda',
      nombre: 'Herida profunda o sangrado abundante'
    },
    {
      id: 'GolpeCabeza',
      nombre: 'Golpe en la cabeza'
    },
    {
      id: 'Fractura',
      nombre: 'Posible fractura o deformidad'
    },
    {
      id: 'DificultadRespiratoria',
      nombre: 'Dificultad respiratoria'
    },
    {
      id: 'Confundido',
      nombre: 'Confundido o desorientado'
    },
    {
      id: 'DolorPecho',
      nombre: 'Dolor de pecho'
    },
    {
      id: 'DolorAbdomen',
      nombre: 'Dolor de abdomen'
    },
    {
      id: 'LesionEspaldaColumna',
      nombre: 'Lesión en cuello, espalda o columna' 
    },
    {
      id: 'Quemadura',
      nombre: 'Quemadura'
    }

  
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
