import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-embarazada',
  imports: [MatIconModule],
  standalone:true,
  templateUrl: './embarazada.html',
  styleUrl: './embarazada.scss',
})
export class Embarazada {

  private router = inject(Router);

  
  readonly sintomas = [
    {
      id: 'DolorCabeza',
      nombre: 'Dolor de Cabeza'
    },
    
    {
      id: 'DolorAbdomen',
      nombre: 'Dolor de Abdomen'
    },
    {
      id: 'HemorragiaVaginal',
      nombre: 'Hemorragia Vaginal'
    },
    {
      id: 'TosSangre',
      nombre: 'Tos con Sangre'
    },
    {
      id: 'NoSentirBebe',
      nombre: 'No siente al bebé'
    },
    { id: 'ContraccionPrematura',
      nombre: 'Contracciones prematuras (antes de semana 37'
    },
    { id: 'Presion',
      nombre: 'Presión Alta'
    },
    { id: 'VisionBorrosa',
      nombre: 'Visión Borrosa'
    },
    { id: 'Zumbidos',
      nombre: 'Zumbidos o pitos en los oídos.'
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