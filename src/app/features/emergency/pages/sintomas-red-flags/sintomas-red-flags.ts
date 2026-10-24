import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';

import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';

import { EmergencyService, Sintoma } from '../../../../services/emergency.service';

@Component({
  selector: 'app-sintomas-red-flags',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sintomas-red-flags.html',
  styleUrl: './sintomas-red-flags.scss',
})
export class SintomasRedFlags implements OnInit {
  private router = inject(Router);
  private emergencyService = inject(EmergencyService);
  private cdr = inject(ChangeDetectorRef);

  sintomas: Sintoma[] = [];
  sintomasSeleccionados: number[] = [];

  // Banderas seleccionadas por el usuario
  banderasSeleccionadas: number[] = [];

  // Nombres de las banderas
  readonly nombresBanderas: { [key: number]: string } = {
    2: 'Dolor de Cabeza',
    3: 'Dolor de Pecho',
    4: 'Dolor de Abdomen',
    5: 'Dificultad Respiratoria',
    6: 'Fiebre',
    7: 'Caída o Golpe reciente',
    9: 'Tos con sangre',
    17: 'Posible fractura o deformidad',
  };

  cargando = true;

  ngOnInit(): void {
    const banderasGuardadas = sessionStorage.getItem('banderas_seleccionadas');

    if (!banderasGuardadas) {
      console.error('No hay banderas seleccionadas en sessionStorage.');

      this.cargando = false;
      this.irAIA();
      return;
    }

    // Guardamos las banderas como propiedad de la clase
    this.banderasSeleccionadas = JSON.parse(banderasGuardadas);

    console.log('Banderas recuperadas:', this.banderasSeleccionadas);

    if (this.banderasSeleccionadas.length === 0) {
      console.log('No hay banderas seleccionadas. Pasando a IA.');

      this.cargando = false;
      this.irAIA();
      return;
    }

    this.cargarSintomasDeTodasLasBanderas(this.banderasSeleccionadas);
  }

  cargarSintomasDeTodasLasBanderas(banderas: number[]): void {
    const peticiones = banderas.map((idBandera) =>
      this.emergencyService.obtenerSintomasPorRedFlag(idBandera),
    );

    forkJoin(peticiones).subscribe({
      next: (respuestas) => {
        const todosLosSintomas = respuestas.flatMap((respuesta) => respuesta.sintomas);

        this.sintomas = todosLosSintomas;

        console.log('Todos los síntomas encontrados:', this.sintomas);

        this.cargando = false;

        // Forzamos actualización de la interfaz
        this.cdr.detectChanges();

        // Si no hay síntomas visuales → IA
        if (this.sintomas.length === 0) {
          console.log('No hay síntomas visuales. Pasando a IA.');

          this.irAIA();
        }
      },

      error: (error) => {
        console.error('Error cargando síntomas:', error);

        this.cargando = false;

        this.cdr.detectChanges();
      },
    });
  }

  seleccionarSintoma(sintomaId: number): void {
    const index = this.sintomasSeleccionados.indexOf(sintomaId);

    if (index === -1) {
      this.sintomasSeleccionados.push(sintomaId);
    } else {
      this.sintomasSeleccionados.splice(index, 1);
    }

    // Nueva referencia para Angular
    this.sintomasSeleccionados = [...this.sintomasSeleccionados];
  }

  estaSeleccionado(sintomaId: number): boolean {
    return this.sintomasSeleccionados.includes(sintomaId);
  }

  // Devuelve solamente los síntomas pertenecientes
  // a una bandera específica
  getSintomasPorBandera(idBandera: number): Sintoma[] {
    return this.sintomas.filter((sintoma) => sintoma.id_bandera === idBandera);
  }

  // Devuelve el nombre de la bandera
  getNombreBandera(idBandera: number): string {
    return this.nombresBanderas[idBandera] ?? 'Síntomas adicionales';
  }

  continuar(): void {
    console.log('Síntomas seleccionados:', this.sintomasSeleccionados);

    // Por ahora vamos a IA
    this.irAIA();
  }

  private irAIA(): void {
    this.router.navigate(['emergency/sub-banderas']);
  }
}
