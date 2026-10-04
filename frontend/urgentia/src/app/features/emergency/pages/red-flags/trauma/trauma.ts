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
      nombre: 'Herida profunda o sangrado abundante'
    },
    {
      id: 16,
      nombre: 'Golpe en la cabeza'
    },
    {
      id: 17,
      nombre: 'Posible fractura o deformidad'
    },
    {
      id: 5,
      nombre: 'Dificultad Respiratoria'
    },
    {
      id: 18,
      nombre: 'Confundido o desorientado'
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
      id: 19,
      nombre: 'Lesión en cuello, espalda o columna'
    },
    {
      id: 20,
      nombre: 'Quemadura'
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

    // 1. Guardar banderas rojas seleccionadas
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

        // 2. Evaluar reglas de triaje
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

            if (resultado.accion === 'alerta') {

              this.router.navigate([
                'emergency/resultado'
              ]);

            } else if (
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
