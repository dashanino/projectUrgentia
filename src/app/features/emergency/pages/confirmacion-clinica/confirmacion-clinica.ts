import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { EmergencyService } from '../../../../services/emergency.service';
type Respuesta = 'si' | 'no' | '';

@Component({
  selector: 'app-confirmacion-clinica',
  standalone: true,
  imports: [],
  templateUrl: './confirmacion-clinica.html',
  styleUrl: './confirmacion-clinica.scss',
})
export class ConfirmacionClinica {
  private router = inject(Router);
  private emergencyService = inject(EmergencyService);
  guardando = false;
  readonly poblaciones: Record<number, string> = {
    1: 'Niño',
    2: 'Adulto',
    3: 'Adulto Mayor',
  };

  idPoblacion = Number(sessionStorage.getItem('id_poblacion'));
  poblacion = this.poblaciones[this.idPoblacion] || 'No identificada';

  accidente: Respuesta = '';
  embarazo: Respuesta = '';
  antecedentesActualizados: Respuesta = '';

  get preguntarEmbarazo(): boolean {
    // Por ahora mostramos la pregunta a pacientes adultos.
    // Más adelante utilizaremos los datos clínicos pertinentes
    // para adaptar esta pregunta sin hacer suposiciones.
    return this.idPoblacion === 2;
  }

  seleccionarAccidente(respuesta: Respuesta): void {
    this.accidente = respuesta;
  }

  seleccionarEmbarazo(respuesta: Respuesta): void {
    this.embarazo = respuesta;
  }

  seleccionarAntecedentes(respuesta: Respuesta): void {
    this.antecedentesActualizados = respuesta;
  }

  get formularioCompleto(): boolean {
    return (
      this.accidente !== '' &&
      (!this.preguntarEmbarazo || this.embarazo !== '') &&
      this.antecedentesActualizados !== ''
    );
  }

  continuar(): void {
    if (!this.formularioCompleto || this.guardando) {
      return;
    }
  
    const idPretriage = Number(sessionStorage.getItem('id_pretriage'));
    const token = sessionStorage.getItem('access_token');
  
    if (!Number.isInteger(idPretriage) || idPretriage <= 0 || !token) {
      alert('No se encontró una evaluación activa. Inicia una nueva evaluación.');
      this.router.navigate(['/app/home']);
      return;
    }
  
    if (this.antecedentesActualizados === 'no') {
      this.router.navigate(['/app/perfil']);
      return;
    }
  
    const accidente = this.accidente === 'si';
  
    const embarazo = this.preguntarEmbarazo
      ? this.embarazo === 'si'
      : null;
  
    this.guardando = true;
  
    this.emergencyService.confirmarClinicaRegistrado(
      idPretriage,
      token,
      accidente,
      embarazo,
      true
    ).subscribe({
      next: (respuesta) => {
        this.guardando = false;
  
        sessionStorage.setItem(
          'id_poblacion',
          String(respuesta.id_poblacion)
        );
  
        sessionStorage.setItem(
          'requiere_confirmacion_poblacion_especial',
          'false'
        );
  
        console.log('Confirmación clínica guardada:', respuesta);
  
        const rutasPoblacion: Record<number, string> = {
          1: '/emergency/red-flags/nino',
          2: '/emergency/red-flags/adulto',
          3: '/emergency/red-flags/adulto-mayor',
          4: '/emergency/red-flags/embarazada',
          5: '/emergency/red-flags/trauma',
        };
  
        const ruta = rutasPoblacion[respuesta.id_poblacion];
  
        if (!ruta) {
          alert('No se encontró la pantalla correspondiente a la población.');
          return;
        }
  
        this.router.navigate([ruta]);
      },
  
      error: (error) => {
        this.guardando = false;
  
        console.error('Error al confirmar información clínica:', error);
  
        alert(
          error.error?.error ||
          'No fue posible guardar la confirmación clínica.'
        );
      },
    });
  }

  volver(): void {
    this.router.navigate(['/app/home']);
  }
}