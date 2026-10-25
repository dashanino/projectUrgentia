
import {
  Component,
  ChangeDetectorRef,
  OnInit,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EmergencyService } from '../../../../services/emergency.service';

interface PreguntaIA {
  id_pregunta: number;
  pregunta: string;
  orden: number;
}

interface RevisionSeguridad {
  accion: string;
  mensaje?: string;
  estado_seguridad_ia?: string;
}

@Component({
  selector: 'app-sub-banderas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sub-banderas.html',
  styleUrl: './sub-banderas.scss'
})
export class SubBanderas implements OnInit {

  private router = inject(Router);
  private emergencyService = inject(EmergencyService);
  private cdr = inject(ChangeDetectorRef);

  preguntaActual: PreguntaIA | null = null;
  respuestaPaciente = '';

  cargando = false;
  guardando = false;
  finalizado = false;
  alerta = false;

  mensajeError = '';
  mensajeEstado = '';

  private idPretriage = 0;
  private token = '';

  ngOnInit(): void {
    const idGuardado = sessionStorage.getItem('id_pretriage');
    const tokenGuardado = sessionStorage.getItem('access_token');

    this.idPretriage = Number(idGuardado);
    this.token = tokenGuardado ?? '';

    if (
      !idGuardado ||
      !Number.isInteger(this.idPretriage) ||
      this.idPretriage <= 0 ||
      !this.token
    ) {
      this.mensajeError =
        'No se encontró un pre-triage activo. Debes iniciar nuevamente.';
      return;
    }

    this.obtenerPregunta();
  }

  obtenerPregunta(): void {
    if (this.cargando || this.guardando || this.finalizado) {
      return;
    }

    this.cargando = true;
    this.mensajeError = '';
    this.mensajeEstado = '';

    this.emergencyService
      .generarPreguntaIA(this.idPretriage, this.token)
      .subscribe({
        next: (respuesta) => {
          this.cargando = false;

          if (!respuesta.ok) {
            this.mensajeError =
              'No fue posible obtener la pregunta de IA.';
            this.cdr.detectChanges();
            return;
          }

          const resultado = respuesta.resultado;

          // Se completaron las cinco preguntas.
          // Todavía NO significa que exista una
          // clasificación final autorizada.
          if (resultado?.accion === 'cuestionario_completado') {
            this.finalizado = true;
            this.preguntaActual = null;

            this.mensajeEstado =
              resultado.mensaje ||
              'Se completaron las preguntas adicionales.';

            this.cdr.detectChanges();
            return;
          }

          // Detener si el backend solicita revisión.
          if (
            resultado?.accion === 'revision_clinica' ||
            resultado?.accion === 'informacion_insuficiente'
          ) {
            this.finalizado = true;
            this.preguntaActual = null;

            this.mensajeEstado =
              resultado.mensaje ||
              'Se requiere una revisión de seguridad.';

            this.cdr.detectChanges();
            return;
          }

          // Verificar que la pregunta recibida sea válida.
          if (
            !resultado ||
            typeof resultado.id_pregunta !== 'number' ||
            typeof resultado.pregunta !== 'string'
          ) {
            this.mensajeError =
              'El servidor no devolvió una pregunta válida.';

            this.cdr.detectChanges();
            return;
          }

          this.preguntaActual = {
            id_pregunta: resultado.id_pregunta,
            pregunta: resultado.pregunta,
            orden: resultado.orden
          };

          this.respuestaPaciente = '';

          this.cdr.detectChanges();
        },

        error: (error) => {
          this.cargando = false;

          this.mensajeError =
            error.error?.message ||
            'Ocurrió un error al generar la pregunta.';

          this.cdr.detectChanges();
        }
      });
  }

  enviarRespuesta(): void {
    const respuesta = this.respuestaPaciente.trim();

    if (
      !this.preguntaActual ||
      this.guardando ||
      this.cargando ||
      this.finalizado
    ) {
      return;
    }

    if (!respuesta) {
      this.mensajeError = 'Debes escribir una respuesta.';
      return;
    }

    this.guardando = true;
    this.mensajeError = '';

    const idPregunta = this.preguntaActual.id_pregunta;

    this.emergencyService
      .guardarRespuestaIA(
        this.idPretriage,
        idPregunta,
        respuesta,
        this.token
      )
      .subscribe({
        next: (resultado) => {
          this.guardando = false;

          if (!resultado.ok) {
            this.mensajeError =
              'No fue posible guardar tu respuesta.';

            this.cdr.detectChanges();
            return;
          }

          const revision: RevisionSeguridad | undefined =
            resultado.revision_seguridad;

          // Nunca continuar sin revisión de seguridad.
          if (!revision) {
            this.finalizado = true;
            this.preguntaActual = null;

            this.mensajeEstado =
              'La respuesta fue guardada, pero no se recibió la revisión de seguridad.';

            this.cdr.detectChanges();
            return;
          }

          console.log('Revisión de seguridad:', revision);

          // CASO 1: Se identificó una posible alerta.
          if (
            revision.accion === 'alerta' ||
            revision.estado_seguridad_ia === 'alerta'
          ) {
            this.alerta = true;
            this.finalizado = true;
            this.preguntaActual = null;

            this.mensajeEstado =
              revision.mensaje ||
              'Se identificó una posible señal de alarma. Solicita atención médica inmediata.';

            this.cdr.detectChanges();
            return;
          }

          // CASO 2: La revisión no pudo autorizar
          // que el cuestionario continúe.
          if (
            revision.accion === 'revision_clinica' ||
            revision.accion === 'informacion_insuficiente' ||
            revision.estado_seguridad_ia === 'pendiente' ||
            revision.estado_seguridad_ia === 'en_revision'
          ) {
            this.finalizado = true;
            this.preguntaActual = null;

            this.mensajeEstado =
              revision.mensaje ||
              'Tu respuesta fue registrada. Se requiere una revisión de seguridad antes de continuar.';

            this.cdr.detectChanges();
            return;
          }

          // CASO 3: El backend autoriza
          // continuar recopilando información.
          //
          // Esto NO equivale a declarar
          // que el paciente está fuera de peligro.
          if (
            revision.accion === 'continuar' &&
            revision.estado_seguridad_ia === 'continuar'
          ) {
            this.preguntaActual = null;
            this.respuestaPaciente = '';

            this.cdr.detectChanges();

            // Solicitar la siguiente pregunta.
            this.obtenerPregunta();
            return;
          }

          // Cualquier respuesta inesperada
          // mantiene detenido el cuestionario.
          this.finalizado = true;
          this.preguntaActual = null;

          this.mensajeEstado =
            revision.mensaje ||
            'Se requiere verificar la seguridad antes de continuar.';

          this.cdr.detectChanges();
        },

        error: (error) => {
          this.guardando = false;

          this.mensajeError =
            error.error?.message ||
            'No fue posible guardar la respuesta. Intenta nuevamente.';

          this.cdr.detectChanges();
        }
      });
  }

  volver(): void {
    this.router.navigate(['/emergency/sintomas']);
  }
}
