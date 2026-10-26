import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { EmergencyService } from '../../../../../services/emergency.service';

@Component({
  selector: 'app-trauma',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './trauma.html',
  styleUrl: './trauma.scss',
})
export class Trauma {
  private router = inject(Router);
  private emergencyService = inject(EmergencyService);

  readonly sintomas = [
    {
      id: 15,
      nombre: 'Herida profunda o sangrado abundante',
    },
    {
      id: 16,
      nombre: 'Golpe en la cabeza',
    },
    {
      id: 17,
      nombre: 'Posible fractura o deformidad',
    },
    {
      id: 5,
      nombre: 'Dificultad Respiratoria',
    },
    {
      id: 18,
      nombre: 'Confundido o desorientado',
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
      id: 19,
      nombre: 'Lesión en cuello, espalda o columna',
    },
    {
      id: 20,
      nombre: 'Quemadura',
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
      console.error('ID de pretriage inválido');
      return;
    }
  
    // CASO 1: Ninguna bandera roja seleccionada
    if (this.ningunoSeleccionado) {
      this.emergencyService.guardarBanderasRojas(id, [], token).subscribe({
        next: () => {
          sessionStorage.setItem('banderas_seleccionadas', '[]');
          this.evaluarTriage(id, token);
        },
        error: (error) => {
          console.error('Error al guardar banderas:', error);
        },
      });
  
      return;
    }
  
    // CASO 2: No seleccionó ninguna opción
    if (this.sintomasSeleccionados.length === 0) {
      return;
    }
  
    // CASO 3: Seleccionó una o varias banderas rojas
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
  
        sessionStorage.setItem(
          'resultadoTriage',
          JSON.stringify(resultado)
        );
  
        // PRIORIDAD ALTA: las reglas prevalecen sobre la IA
        if (
          resultado.origen === 'reglas' &&
          resultado.accion === 'alerta'
        ) {
          this.router.navigate(['/emergency/resultado']);
          return;
        }
  
        // Ninguna alerta: completar la etapa de síntomas
        // antes de iniciar las preguntas de IA.
        if (
          resultado.origen === 'reglas' &&
          resultado.accion === 'continuar_ia'
        ) {
          this.emergencyService.guardarSintomas(id, [], token).subscribe({
            next: (respuesta) => {
              if (
                respuesta.ok === true &&
                respuesta.accion === 'iniciar_ia'
              ) {
                this.router.navigate(['/emergency/sub-banderas']);
                return;
              }
  
              console.error(
                'El backend no autorizó iniciar la IA:',
                respuesta
              );
            },
            error: (error) => {
              console.error(
                'Error al completar la etapa de síntomas:',
                error
              );
            },
          });
  
          return;
        }
  
        // Hay síntomas adicionales que deben revisarse
        if (
          resultado.origen === 'reglas' &&
          resultado.accion === 'continuar_submenu'
        ) {
          sessionStorage.setItem(
            'banderas_seleccionadas',
            JSON.stringify(this.sintomasSeleccionados)
          );
  
          this.router.navigate(['/emergency/sintomas']);
          return;
        }
  
        console.error('Acción de triage no reconocida:', resultado);
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
