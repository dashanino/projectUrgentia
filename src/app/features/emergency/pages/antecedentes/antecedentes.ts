import { Component, inject } from '@angular/core';

import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { EmergencyService } from '../../../../services/emergency.service';
@Component({
  selector: 'app-antecedentes',
  imports: [MatIconModule],
  templateUrl: './antecedentes.html',
  styleUrl: './antecedentes.scss',
})
export class Antecedentes {
  private router = inject(Router);
  private emergencyService = inject(EmergencyService);
  private mapaAntecedentes: Record<string, number> = {
    Anticoagulantes: 1,
    Inmunocomprometido: 2,
    Autoinmune: 3,
    Hemodiálisis: 4,
    'Cáncer activo': 5,
  };

  antecedentesSeleccionados: string[] = [];
  ningunoSeleccionado = false;
  cargando = false;

  seleccionarNinguno(): void {
    this.ningunoSeleccionado = !this.ningunoSeleccionado;

    if (this.ningunoSeleccionado) {
      this.antecedentesSeleccionados = [];
    }
  }

  toggleAntecedente(antecedente: string): void {
    // Si selecciona cualquier antecedente,
    // "Ninguno de los anteriores" se deselecciona.
    this.ningunoSeleccionado = false;

    if (this.antecedentesSeleccionados.includes(antecedente)) {
      this.antecedentesSeleccionados = this.antecedentesSeleccionados.filter(
        (item) => item !== antecedente,
      );
    } else {
      this.antecedentesSeleccionados.push(antecedente);
    }
  }

  isSelected(antecedente: string): boolean {
    return this.antecedentesSeleccionados.includes(antecedente);
  }

  continuar() {
    const idPretriage = sessionStorage.getItem('id_pretriage');
    const token = sessionStorage.getItem('access_token');

    if (this.cargando) {
      return;
    }

    this.cargando = true;

    if (!idPretriage || !token) {
      console.error('No existe un pretriaje activo');
      return;
    }

    const idsAntecedentes = this.antecedentesSeleccionados
      .map((nombre) => this.mapaAntecedentes[nombre])
      .filter((id) => id !== undefined);

    this.emergencyService
      .guardarAntecedentes(Number(idPretriage), idsAntecedentes, token)
      .subscribe({
        next: (respuesta) => {
          this.cargando = false;
          console.log('Antecedentes guardados:', respuesta);

          this.router.navigate(['/emergency/patient-group']);
        },

        error: (error) => {
          this.cargando=false;
          console.error('Error al guardar antecedentes:', error);
        },
      });
  }
  goBack(): void {
    this.router.navigate(['/begin']);
  }
}
