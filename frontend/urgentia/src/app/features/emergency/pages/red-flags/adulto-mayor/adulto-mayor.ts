import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { EmergencyService } from '../../../../../services/emergency.service';
@Component({
  selector: 'app-adulto-mayor',
  standalone:true,
  imports: [MatIconModule],
  templateUrl: './adulto-mayor.html',
  styleUrl: './adulto-mayor.scss',
})
export class AdultoMayor {

  private router = inject(Router);
  private emergencyService = inject(EmergencyService);

  readonly sintomas = [
    { id: 2, nombre: 'Dolor de Cabeza' },
    { id: 3, nombre: 'Dolor de Pecho' },
    { id: 4, nombre: 'Dolor de Abdomen' },
    { id: 5, nombre: 'Dificultad Respiratoria' },
    { id: 6, nombre: 'Fiebre' },
    { id: 7, nombre: 'Caída o Golpe reciente' }
  ];

  sintomasSeleccionados: number[] = [];

  seleccionarSintoma(id: number): void {
    if (this.sintomasSeleccionados.includes(id)) {
      this.sintomasSeleccionados =
        this.sintomasSeleccionados.filter(item => item !== id);
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
      console.error('No existe un pretriage activo');
      return;
    }
  
    const id = Number(idPretriage);
  
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
  
        this.emergencyService.evaluarTriage(
          id,
          token
        ).subscribe({
  
          next: (resultado) => {
  
            console.log(
              'Resultado del triage:',
              resultado
            );
  
            sessionStorage.setItem(
              'resultadoTriage',
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
    this.router.navigate(['emergency/patient-group']);
  }
}
