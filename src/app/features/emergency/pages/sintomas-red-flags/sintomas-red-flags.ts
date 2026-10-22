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

  cargando = true;

  ngOnInit(): void {
    const banderasGuardadas = sessionStorage.getItem('banderas_seleccionadas');

    if (!banderasGuardadas) {
      console.error('No hay banderas seleccionadas en sessionStorage.');

      this.cargando = false;
      this.irAIA();
      return;
    }

    const banderasSeleccionadas: number[] = JSON.parse(banderasGuardadas);

    console.log('Banderas recuperadas:', banderasSeleccionadas);

    if (banderasSeleccionadas.length === 0) {
      console.log('No hay banderas seleccionadas. Pasando a IA.');

      this.cargando = false;
      this.irAIA();
      return;
    }

    this.cargarSintomasDeTodasLasBanderas(banderasSeleccionadas);
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

        /*
         * Le indicamos explícitamente a Angular
         * que actualice la interfaz.
         */
        this.cdr.detectChanges();

        /*
         * Si ninguna de las banderas seleccionadas
         * tiene síntomas visuales, pasamos directamente
         * a la etapa de preguntas de IA.
         */
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

    /*
     * Creamos una nueva referencia para que Angular
     * detecte el cambio inmediatamente.
     */
    this.sintomasSeleccionados = [...this.sintomasSeleccionados];
  }

  estaSeleccionado(sintomaId: number): boolean {
    return this.sintomasSeleccionados.includes(sintomaId);
  }

  continuar(): void {
    console.log('Síntomas seleccionados:', this.sintomasSeleccionados);

    /*
     * Por ahora solamente avanzamos a la etapa
     * de preguntas de IA.
     *
     * Después aquí agregaremos el endpoint para
     * guardar los síntomas en pretriage_sintomas.
     */
    this.irAIA();
  }

  private irAIA(): void {
    this.router.navigate(['emergency/sub-banderas']);
  }
}
