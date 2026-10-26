import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';

import { EmergencyService, Sintoma } from '../../../../services/emergency.service';

@Component({
  selector: 'app-sintomas-red-flags',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl:'./sintomas-red-flags.html',
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
  ningunoSeleccionado = false;

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
  guardando = false;
  mensajeError = '';

  ngOnInit(): void {
    const banderasGuardadas = sessionStorage.getItem('banderas_seleccionadas');

    if (!banderasGuardadas) {
      console.error('No hay banderas seleccionadas en sessionStorage.');

      this.cargando = false;
      this.continuar();
      return;
    }

    try {
      const banderas = JSON.parse(banderasGuardadas);

      if (!Array.isArray(banderas) || !banderas.every((id) => Number.isInteger(id))) {
        throw new Error('Formato de banderas inválido');
      }

      this.banderasSeleccionadas = banderas;
    } catch (error) {
      console.error('Error al recuperar las banderas:', error);

      this.cargando = false;
      this.mensajeError = 'No se pudo recuperar la selección de banderas.';
      this.cdr.detectChanges();
      return;
    }

    console.log('Banderas recuperadas:', this.banderasSeleccionadas);

    if (this.banderasSeleccionadas.length === 0) {
      console.log('No hay banderas seleccionadas. Guardando selección vacía.');

      this.cargando = false;
      this.continuar();
      return;
    }

    this.cargarSintomasDeTodasLasBanderas(this.banderasSeleccionadas);
  }

  cargarSintomasDeTodasLasBanderas(banderas: number[]): void {
    this.cargando = true;
    this.mensajeError = '';

    const peticiones = banderas.map((idBandera) =>
      this.emergencyService.obtenerSintomasPorRedFlag(idBandera),
    );

    forkJoin(peticiones).subscribe({
      next: (respuestas) => {
        const todosLosSintomas = respuestas.flatMap((respuesta) => respuesta.sintomas);

        // Evitar síntomas duplicados
        this.sintomas = todosLosSintomas.filter(
          (sintoma, index, arreglo) =>
            arreglo.findIndex((item) => item.id === sintoma.id) === index,
        );

        console.log('Todos los síntomas encontrados:', this.sintomas);

        this.cargando = false;
        this.cdr.detectChanges();

        // Si no hay síntomas disponibles, registrar lista vacía
        if (this.sintomas.length === 0) {
          console.log('No hay síntomas visuales. Guardando selección vacía.');
          this.continuar();
        }
      },

      error: (error) => {
        console.error('Error cargando síntomas:', error);

        this.cargando = false;
        this.mensajeError = 'No fue posible cargar los síntomas. Intenta nuevamente.';
        this.cdr.detectChanges();
      },
    });
  }

  seleccionarSintoma(sintomaId: number): void {
    if (this.guardando) {
      return;
    }

    // Seleccionar un síntoma desmarca "Ninguno".
    this.ningunoSeleccionado = false;

    if (this.sintomasSeleccionados.includes(sintomaId)) {
      this.sintomasSeleccionados = this.sintomasSeleccionados.filter((id) => id !== sintomaId);
    } else {
      this.sintomasSeleccionados = [...this.sintomasSeleccionados, sintomaId];
    }
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

  // Guardar síntomas antes de continuar con IA
  continuar(): void {
    if (this.guardando) {
      return;
    }

    const idPretriage = sessionStorage.getItem('id_pretriage');
    const token = sessionStorage.getItem('access_token');

    if (!idPretriage || !token) {
      console.error('No existe un pretriage activo.');

      this.mensajeError = 'No existe un pre-triage activo. Debes iniciar nuevamente.';
      this.cdr.detectChanges();
      return;
    }

    const id = Number(idPretriage);

    if (!Number.isInteger(id) || id <= 0) {
      this.mensajeError = 'El identificador del pre-triage no es válido.';
      this.cdr.detectChanges();
      return;
    }

    this.guardando = true;
    this.cargando = true;
    this.mensajeError = '';

    console.log('Síntomas seleccionados:', this.sintomasSeleccionados);

    this.emergencyService.guardarSintomas(id, this.sintomasSeleccionados, token).subscribe({
      next: (respuesta) => {
        console.log('Síntomas guardados:', respuesta);

        this.guardando = false;
        this.cargando = false;

        if (respuesta.ok === true && respuesta.accion === 'iniciar_ia') {
          this.irAIA();
        } else {
          this.mensajeError = 'El servidor no confirmó el guardado de los síntomas.';
          this.cdr.detectChanges();
        }
      },

      error: (error) => {
        console.error('Error al guardar síntomas:', error);

        this.guardando = false;
        this.cargando = false;

        this.mensajeError =
          error.error?.error || 'No fue posible guardar los síntomas. Intenta nuevamente.';

        this.cdr.detectChanges();
      },
    });
  }

  // Navegar a las preguntas de IA
  private irAIA(): void {
    this.router.navigate(['/emergency/sub-banderas']);
  }

  goBack(): void {
    this.router.navigate(['/emergency/patient-group']);
  }
  
  seleccionarNinguno(): void {
    this.ningunoSeleccionado = !this.ningunoSeleccionado;

    if (this.ningunoSeleccionado) {
      this.sintomasSeleccionados = [];
    }
  }
}
