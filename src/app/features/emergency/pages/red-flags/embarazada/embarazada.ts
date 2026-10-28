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
  cargando=false;

  readonly sintomas = [
    { id: 2, nombre: 'Dolor de Cabeza' },
    { id: 4, nombre: 'Dolor de Abdomen' },
    { id: 8, nombre: 'Hemorragia vaginal' },
    { id: 9, nombre: 'Tos con sangre' },
    { id: 10, nombre: 'No siente al bebé' },
    { id: 11, nombre: 'Contracciones prematuras' },
    { id: 12, nombre: 'Presión alta' },
    { id: 13, nombre: 'Visión borrosa' },
    { id: 14, nombre: 'Zumbidos o pitos en los oídos' },
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

    if (this.cargando){
      return
    }
    this.cargando = true;

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
          this.cargando = false;
          sessionStorage.setItem('banderas_seleccionadas', '[]');
          this.evaluarTriage(id, token);
        },
        error: (error) => {
          this.cargando=false;
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

        sessionStorage.setItem('resultadoTriage', JSON.stringify(resultado));

        // PRIORIDAD ALTA: las reglas prevalecen sobre la IA
        if (resultado.origen === 'reglas' && resultado.accion === 'alerta') {
          this.router.navigate(['/emergency/resultado']);
          return;
        }

        // Ninguna alerta: completar la etapa de síntomas
        // antes de iniciar las preguntas de IA.
        if (resultado.origen === 'reglas' && resultado.accion === 'continuar_ia') {
          this.emergencyService.guardarSintomas(id, [], token).subscribe({
            next: (respuesta) => {
              if (respuesta.ok === true && respuesta.accion === 'iniciar_ia') {
                this.router.navigate(['/emergency/sub-banderas']);
                return;
              }

              console.error('El backend no autorizó iniciar la IA:', respuesta);
            },
            error: (error) => {
              console.error('Error al completar la etapa de síntomas:', error);
            },
          });

          return;
        }

        // Hay síntomas adicionales que deben revisarse
        if (resultado.origen === 'reglas' && resultado.accion === 'continuar_submenu') {
          sessionStorage.setItem(
            'banderas_seleccionadas',
            JSON.stringify(this.sintomasSeleccionados),
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
    const esRegistrado = sessionStorage.getItem('pretriage_registrado') === 'true';

    if (esRegistrado) {
      this.router.navigate(['/app/home']);
      return;
    }

    this.router.navigate(['/emergency/patient-group']);
  }
}
