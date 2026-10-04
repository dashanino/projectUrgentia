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
  
    // 1. Guardar las banderas seleccionadas
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
  
            if (resultado.accion === 'alerta') {
  
              this.router.navigate([
                'emergency/resultado'
              ]);
  
            } else if (
              resultado.accion === 'continuar_ia'
            ) {
            
              console.log(
                'No hay alerta. Continúa a sub-banderas.'
              );
            
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
    this.router.navigate(['emergency/patient-group']);
  }
}