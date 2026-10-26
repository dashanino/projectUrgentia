import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { EmergencyService } from '../../../../../services/emergency.service';

@Component({
  selector: 'app-adulto',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './adulto.html',
  styleUrl: './adulto.scss',
})
export class Adulto {
  private router = inject(Router);
  private emergencyService = inject(EmergencyService);

  readonly sintomas = [
    {
      id: 2,
      nombre: 'Dolor de Cabeza',
    },
    {
      id: 3,
      nombre: 'Dolor de Pecho',
    },
    {
      id: 4,
      nombre: 'Dolor de Abdomen',
    },
    {
      id: 5,
      nombre: 'Dificultad Respiratoria',
    },
    {
      id: 6,
      nombre: 'Fiebre',
    },
  ];

  sintomasSeleccionados: number[] = [];
  ningunoSeleccionado = false;

  seleccionarNinguno(): void {
    this.ningunoSeleccionado = !this.ningunoSeleccionado;

    if (this.ningunoSeleccionado) {
      this.sintomasSeleccionados = [];
    }
  }

  seleccionarSintoma(id: number): void {
    // Si selecciona un síntoma, "Ninguno" deja de estar seleccionado
    this.ningunoSeleccionado = false;

    if (this.sintomasSeleccionados.includes(id)) {
      this.sintomasSeleccionados = this.sintomasSeleccionados.filter((item) => item !== id);
    } else {
      this.sintomasSeleccionados.push(id);
    }
  }

  continuar(): void {
    const idPretriage = sessionStorage.getItem('id_pretriage');
    const token = sessionStorage.getItem('access_token');

    if (!idPretriage || !token) {
      console.error('No existe un pretriage activo');
      return;
    }

    const id = Number(idPretriage);

    if (!Number.isInteger(id) || id <= 0) {
      console.error('El ID del pretriage no es válido');
      return;
    }

    // CASO 1: Ninguna bandera roja seleccionada.
    // Primero guardamos la selección vacía.
    if (this.ningunoSeleccionado) {
      this.emergencyService.guardarBanderasRojas(id, [], token).subscribe({
        next: (respuesta) => {
          console.log('Selección vacía de banderas guardada:', respuesta);

          // Evaluar las reglas antes de continuar.
          this.evaluarTriage(id, token);
        },
        error: (error) => {
          console.error('Error al guardar la selección vacía:', error);
        },
      });

      return;
    }

    // Si no seleccionó nada y tampoco marcó "Ninguno",
    // no permitir continuar.
    if (this.sintomasSeleccionados.length === 0) {
      return;
    }

    // CASO 2: Sí seleccionó banderas rojas.
    this.guardarYEvaluar(id, token);
  }

  private guardarYEvaluar(id: number, token: string): void {
    this.emergencyService.guardarBanderasRojas(id, this.sintomasSeleccionados, token).subscribe({
      next: (respuestaBanderas) => {
        console.log('Banderas guardadas:', respuestaBanderas);

        this.evaluarTriage(id, token);
      },

      error: (error) => {
        console.error('Error al guardar banderas:', error);
      },
    });
  }

  private evaluarTriage(id: number, token: string): void {
    this.emergencyService.evaluarTriage(id, token).subscribe({
      next: (resultado) => {
        console.log('Resultado del triage:', resultado);

        sessionStorage.setItem('resultadoTriage', JSON.stringify(resultado));

        // 🔴 ALTA PRIORIDAD
        if (resultado.origen === 'reglas' && resultado.accion === 'alerta') {
          this.router.navigate(['emergency/resultado']);
          return;
        }
        // NO SE ACTIVÓ UNA REGLA Y NO HAY SUBMENÚ.
        // Registrar que la etapa de síntomas terminó vacía
        // y continuar con la IA.
        if (resultado.origen === 'reglas' && resultado.accion === 'continuar_ia') {
          this.emergencyService.guardarSintomas(id, [], token).subscribe({
            next: (respuesta) => {
              console.log('Etapa de síntomas completada sin selecciones:', respuesta);

              if (respuesta.ok === true && respuesta.accion === 'iniciar_ia') {
                this.router.navigate(['emergency/sub-banderas']);
                return;
              }

              console.error('El servidor no confirmó la etapa de síntomas.', respuesta);
            },
            error: (error) => {
              console.error('Error al guardar la selección vacía de síntomas:', error);
            },
          });

          return;
        }

        // 🟡 NO ALTA PRIORIDAD → SUBMENÚ
        if (resultado.origen === 'reglas' && resultado.accion === 'continuar_submenu') {
          sessionStorage.setItem(
            'banderas_seleccionadas',
            JSON.stringify(this.sintomasSeleccionados),
          );

          this.router.navigate(['emergency/sintomas']);
          return;
        }
      },

      error: (error) => {
        console.error('Error al evaluar triage:', error);
      },
    });
  }

  // ==========================================
  // NO HAY SÍNTOMAS → PEDIR PREGUNTAS A IA
  // ==========================================

  private generarPreguntasAdicionales(id: number, token: string): void {
    this.emergencyService.generarPreguntasAdicionales(id, token).subscribe({
      next: (respuesta) => {
        console.log('Preguntas generadas:', respuesta);

        sessionStorage.setItem('preguntasAdicionales', JSON.stringify(respuesta.preguntas));

        this.router.navigate(['emergency/informacion-adicional']);
      },

      error: (error) => {
        console.error('Error generando preguntas adicionales:', error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['emergency/patient-group']);
  }
}
