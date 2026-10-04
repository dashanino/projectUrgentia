import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { EmergencyService } from '../../../../../services/emergency.service';

@Component({
  selector: 'app-embarazada',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './embarazada.html',
  styleUrl: './embarazada.scss',
})
export class Embarazada {

  private router = inject(Router);
  private emergencyService = inject(EmergencyService);

  readonly sintomas = [
    { id: 2, nombre: 'Dolor de Cabeza' },
    { id: 4, nombre: 'Dolor de Abdomen' },
    { id: 8, nombre: 'Hemorragia vaginal' },
    { id: 9, nombre: 'Tos con sangre' },
    { id: 10, nombre: 'No siente al bebé' },
    { id: 11, nombre: 'Contracciones prematuras' },
    { id: 12, nombre: 'Presión alta' },
    { id: 13, nombre: 'Visión borrosa' },
    { id: 14, nombre: 'Zumbidos o pitos en los oídos' }
  ];

  sintomasSeleccionados: number[] = [];

  seleccionarBandera(id: number): void {

    if (this.sintomasSeleccionados.includes(id)) {

      this.sintomasSeleccionados =
        this.sintomasSeleccionados.filter(
          item => item !== id
        );

    } else {

      this.sintomasSeleccionados.push(id);

    }
  }

  estaSeleccionada(id: number): boolean {
    return this.sintomasSeleccionados.includes(id);
  }

  continuar(): void {

    if (this.sintomasSeleccionados.length === 0) {
      return;
    }

    const idPretriage =
      sessionStorage.getItem('id_pretriage');

    const token =
      sessionStorage.getItem('access_token');

    if (!idPretriage || !token) {
      console.error('No existe un pretriaje activo');
      return;
    }

    const id = Number(idPretriage);

    // 1. Guardar las banderas rojas seleccionadas
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

        // 2. Evaluar las reglas de triaje
        this.emergencyService.evaluarTriaje(
          id,
          token
        ).subscribe({

          next: (resultado) => {

            console.log(
              'Resultado del triaje:',
              resultado
            );

            sessionStorage.setItem(
              'resultadoTriaje',
              JSON.stringify(resultado)
            );

            // Si alguna regla da alta prioridad
            if (resultado.accion === 'alerta') {

              this.router.navigate([
                'emergency/resultado'
              ]);

            }

            // Si ninguna regla da alta prioridad
            else if (
              resultado.accion === 'continuar_ia'
            ) {

              this.router.navigate([
                'emergency/sub-banderas'
              ]);

            }

          },

          error: (error) => {

            console.error(
              'Error al evaluar triaje:',
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