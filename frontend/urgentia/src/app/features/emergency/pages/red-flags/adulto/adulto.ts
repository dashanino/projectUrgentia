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
      nombre: 'Dolor de Cabeza'
    },
    {
      id: 3,
      nombre: 'Dolor de Pecho'
    },
    {
      id: 4,
      nombre: 'Dolor de Abdomen'
    },
    {
      id: 5,
      nombre: 'Dificultad Respiratoria'
    },
    {
      id: 6,
      nombre: 'Fiebre'
    }
  ];

  sintomasSeleccionados: number[] = [];


  seleccionarSintoma(id: number): void {

    if (this.sintomasSeleccionados.includes(id)) {

      this.sintomasSeleccionados =
        this.sintomasSeleccionados.filter(
          item => item !== id
        );

    } else {

      this.sintomasSeleccionados.push(id);

    }
  }


  continuar(): void {

    // =========================================================
    // 1. VALIDAR QUE HAYA BANDERAS SELECCIONADAS
    // =========================================================

    if (this.sintomasSeleccionados.length === 0) {
      return;
    }

    // =========================================================
    // 2. OBTENER DATOS DEL PRETRIAGE
    // =========================================================

    const idPretriage =
      sessionStorage.getItem('id_pretriage');

    const token =
      sessionStorage.getItem('access_token');

    if (!idPretriage || !token) {

      console.error(
        'No existe un pretriage activo'
      );

      return;
    }

    const id = Number(idPretriage);

    // =========================================================
    // 3. GUARDAR LAS BANDERAS ROJAS
    // =========================================================

    this.emergencyService.guardarBanderasRojas(
      id,
      this.sintomasSeleccionados,
      token
    ).subscribe({

      next: (respuestaBanderas) => {

        console.log(
          'Banderas guardadas:',
          respuestaBanderas
        );

        // =====================================================
        // 4. EVALUAR EL TRIAGE
        //
        // El backend:
        // - evalúa primero triage_rules
        // - si hay alta prioridad devuelve alerta
        // - si no hay alta prioridad ejecuta la IA
        // =====================================================

        this.emergencyService.evaluarTriage(
          id,
          token
        ).subscribe({

          next: (resultado) => {

            console.log(
              'Resultado del triage:',
              resultado
            );

            // =================================================
            // 5. GUARDAR EL RESULTADO
            // =================================================

            sessionStorage.setItem(
              'resultadoTriage',
              JSON.stringify(resultado)
            );

            // =================================================
            // 6. ALTA PRIORIDAD DETECTADA POR TRIAGE_RULES
            // =================================================

            if (
              resultado.origen === 'reglas' &&
              resultado.accion === 'alerta'
            ) {

              console.log(
                'Alta prioridad detectada por reglas.'
              );

              this.router.navigate([
                'emergency/resultado'
              ]);

              return;
            }

            // =================================================
            // 7. RESULTADO GENERADO POR IA
            // =================================================

            if (
              resultado.origen === 'ia' &&
              resultado.accion === 'resultado_ia'
            ) {

              console.log(
                'Resultado generado por IA:',
                resultado.resultado
              );

              this.router.navigate([
                'emergency/resultado'
              ]);

              return;
            }

            // =================================================
            // 8. RESPUESTA NO RECONOCIDA
            // =================================================

            console.error(
              'Respuesta de triage no reconocida:',
              resultado
            );
          },

          error: (error) => {

            console.error(
              'Error al evaluar triage:',
              error
            );
          }

        });
      },

      error: (error) => {

        console.error(
          'Error al guardar banderas:',
          error
        );
      }

    });
  }


  goBack(): void {

    this.router.navigate([
      'emergency/patient-group'
    ]);
  }
}