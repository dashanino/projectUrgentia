import { Component, ChangeDetectorRef, OnInit, inject } from '@angular/core';

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
  styleUrl: './sub-banderas.scss',
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
      this.mensajeError = 'No se encontró un pre-triage activo. Debes iniciar nuevamente.';
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

    this.emergencyService.generarPreguntaIA(this.idPretriage, this.token).subscribe({
      next: (respuesta) => {
        this.cargando = false;

        // La evaluación solicita información adicional.
        if (respuesta?.result?.accion === 'pregunta_adicional') {
          const pregunta = respuesta.result;

          this.preguntaActual = {
            id_pregunta: pregunta.id_pregunta,
            pregunta: pregunta.pregunta,
            orden: pregunta.orden,
          };

          this.respuestaPaciente = '';
          this.finalizado = false;
          this.alerta = false;
          this.mensajeEstado = '';
          this.mensajeError = '';

          this.cdr.detectChanges();
          return;
        }

        if (respuesta?.accion === 'revision_clinica') {
          this.enviarARevisionClinica(
            respuesta.message ||
            'Se requiere valoración por personal de salud.'
          );
          return;
        }

        if (!respuesta.ok) {
          this.mensajeError = 'No fue posible obtener la pregunta de IA.';
          this.cdr.detectChanges();
          return;
        }

        const resultado = respuesta.resultado;

        // Se completaron las cinco preguntas.
        // Todavía NO significa que exista una
        // clasificación final autorizada.
        if (resultado?.accion === 'cuestionario_completado') {
          this.preguntaActual = null;
          this.respuestaPaciente = '';
          this.cdr.detectChanges();

          this.evaluarResultadoFinal();
          return;
        }

        // Detener si el backend solicita revisión.

        // Detener si el backend solicita revisión clínica.
        if (
          resultado?.accion === 'revision_clinica' ||
          resultado?.accion === 'informacion_insuficiente'
        ) {
          this.enviarARevisionClinica(
            resultado.mensaje || 'No fue posible determinar una prioridad confiable.',
          );
          return;
        }

        // Verificar que la pregunta recibida sea válida.

        // Verificar que la pregunta recibida sea válida.
        if (
          !resultado ||
          typeof resultado.id_pregunta !== 'number' ||
          typeof resultado.pregunta !== 'string'
        ) {
          this.mensajeError = 'El servidor no devolvió una pregunta válida.';

          this.cdr.detectChanges();
          return;
        }

        this.preguntaActual = {
          id_pregunta: resultado.id_pregunta,
          pregunta: resultado.pregunta,
          orden: resultado.orden,
        };

        this.respuestaPaciente = '';

        this.cdr.detectChanges();
      },

      error: (error) => {
        this.cargando = false;

        this.mensajeError = error.error?.message || 'Ocurrió un error al generar la pregunta.';

        this.cdr.detectChanges();
      },
    });
  }

  enviarRespuesta(): void {
    const respuesta = this.respuestaPaciente.trim();

    if (!this.preguntaActual || this.guardando || this.cargando || this.finalizado) {
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
      .guardarRespuestaIA(this.idPretriage, idPregunta, respuesta, this.token)
      .subscribe({
        next: (resultado) => {
          this.guardando = false;

          if (!resultado.ok) {
            this.mensajeError = 'No fue posible guardar tu respuesta.';

            this.cdr.detectChanges();
            return;
          }

          const revision: RevisionSeguridad | undefined = resultado.revision_seguridad;

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

          // Una señal explícita de alarma debe llevar al
          // resultado de alta prioridad, no dejar el
          // cuestionario detenido en la pantalla actual.
          if (revision.accion === 'alerta' || revision.estado_seguridad_ia === 'alerta') {
            this.enviarAResultadoPrioridadAlta(
              revision.mensaje || 'Se identificó una señal que requiere atención inmediata.',
            );
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
            this.enviarARevisionClinica(
              revision.mensaje || 'Se requiere valoración por personal de salud.',
            );
            return;
          }

          // CASO 3: El backend autoriza
          // continuar recopilando información.
          //
          // Esto NO equivale a declarar
          // que el paciente está fuera de peligro.
          if (revision.accion === 'continuar' && revision.estado_seguridad_ia === 'continuar') {
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
            revision.mensaje || 'Se requiere verificar la seguridad antes de continuar.';

          this.cdr.detectChanges();
        },

        error: (error) => {
          this.guardando = false;

          this.mensajeError =
            error.error?.message || 'No fue posible guardar la respuesta. Intenta nuevamente.';

          this.cdr.detectChanges();
        },
      });
  }
  evaluarPretriage(): void {
    if (this.cargando || this.guardando || this.finalizado) {
      return;
    }

    this.cargando = true;
    this.mensajeError = '';

    this.emergencyService.evaluarConIA(this.idPretriage, this.token).subscribe({
      next: (respuesta) => {
        this.cargando = false;

        if (!respuesta?.ok || !respuesta?.result) {
          this.mensajeError = 'No fue posible obtener la evaluación final.';
          this.cdr.detectChanges();
          return;
        }

        const resultado = respuesta.result;

        const prioridadesValidas = ['alta', 'media_alta', 'media_baja', 'baja'];

        if (!prioridadesValidas.includes(resultado.prioridad)) {
          this.mensajeError = 'El servidor no devolvió una prioridad válida.';
          this.cdr.detectChanges();
          return;
        }

        // Una incertidumbre clínicamente relevante
        // requiere una revisión antes de mostrar prioridad.
        if (resultado.incertidumbre === true) {
          sessionStorage.setItem(
            'resultadoTriage',
            JSON.stringify({
              ok: true,
              id_pretriage: this.idPretriage,
              origen: 'ia',
              alta_prioridad: false,
              accion: 'revision_clinica',
              resultado: {
                prioridad: null,
                justificacion: 'Se requiere valoración médica presencial.',
                incertidumbre: true,
                detalle_incertidumbre: resultado.detalle_incertidumbre ?? null,
                tipo_atencion_urgencias: null,
                servicio_recomendado: null,
              },
            }),
          );

          this.router.navigate(['/emergency/resultado']);
          return;
        }

        sessionStorage.setItem(
          'resultadoTriage',
          JSON.stringify({
            ok: true,
            id_pretriage: this.idPretriage,
            origen: 'ia',
            alta_prioridad: resultado.prioridad === 'alta',
            accion: 'resultado_ia',
            resultado,
          }),
        );

        this.router.navigate(['/emergency/resultado']);
      },

      error: (error) => {
        this.cargando = false;

        this.mensajeError =
          error.error?.message || 'No fue posible completar la evaluación. Intenta nuevamente.';

        this.cdr.detectChanges();
      },
    });
  }

  private enviarARevisionClinica(mensaje: string): void {
    sessionStorage.setItem(
      'resultadoTriage',
      JSON.stringify({
        ok: true,
        id_pretriage: this.idPretriage,
        origen: 'ia',
        alta_prioridad: false,
        accion: 'revision_clinica',
        resultado: {
          prioridad: null,
          incertidumbre: true,
          justificacion: mensaje,
          detalle_incertidumbre: mensaje,
        },
      }),
    );

    this.router.navigate(['/emergency/resultado']);
  }

  volver(): void {
    this.router.navigate(['/emergency/sintomas']);
  }

  private evaluarResultadoFinal(): void {
    this.cargando = true;
    this.mensajeError = '';
    this.mensajeEstado = '';

    this.emergencyService.evaluarConIA(this.idPretriage, this.token).subscribe({
      next: (respuesta) => {
        this.cargando = false;

        // La IA no pudo emitir una orientación automática fiable.
        if (respuesta?.accion === 'revision_clinica') {
          this.finalizado = true;
          this.alerta = false;
          this.preguntaActual = null;

          this.mensajeEstado =
            respuesta.message || 'La información requiere valoración por personal de salud.';

          this.cdr.detectChanges();
          return;
        }

        if (!respuesta?.ok || !respuesta?.result) {
          this.finalizado = true;
          this.mensajeEstado =
            respuesta?.message || 'No fue posible completar la evaluación final.';

          this.cdr.detectChanges();
          return;
        }

        const resultadoIA = respuesta.result;

        const resultadoTriage = {
          ok: true,
          id_pretriage: this.idPretriage,
          origen: 'ia' as const,
          alta_prioridad: resultadoIA.prioridad === 'alta',
          accion: 'resultado_ia' as const,
          resultado: resultadoIA,
        };

        sessionStorage.setItem('resultadoTriage', JSON.stringify(resultadoTriage));

        this.router.navigate(['/emergency/resultado']);
      },

      error: (error) => {
        this.cargando = false;
        this.finalizado = true;

        this.mensajeEstado =
          error.error?.message || 'No fue posible completar la evaluación final.';

        this.cdr.detectChanges();
      },
    });
  }

  private enviarAResultadoPrioridadAlta(mensaje: string): void {
    sessionStorage.setItem(
      'resultadoTriage',
      JSON.stringify({
        ok: true,
        id_pretriage: this.idPretriage,
        origen: 'ia',
        alta_prioridad: true,
        accion: 'resultado_ia',
        resultado: {
          prioridad: 'alta',
          tipo_atencion_urgencias: 'general',
          servicio_recomendado: null,
          justificacion: mensaje,
          incertidumbre: false,
          detalle_incertidumbre: null,
        },
      }),
    );

    this.router.navigate(['/emergency/resultado']);
  }
}
