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

  // ==========================================================
  // PREGUNTA INDIVIDUAL
  // Se usa únicamente para P1
  // ==========================================================

  preguntaActual: PreguntaIA | null = null;
  respuestaPaciente = '';

  // ==========================================================
  // BLOQUES DE PREGUNTAS
  // P2-P5 o P6-P8
  // ==========================================================

  preguntasActuales: PreguntaIA[] = [];
  respuestasActuales: Record<number, string> = {};

  // ==========================================================
  // ESTADO
  // ==========================================================

  cargando = false;
  guardando = false;
  finalizado = false;
  alerta = false;

  mensajeError = '';
  mensajeEstado = '';

  private idPretriage = 0;
  private token = '';

  // ==========================================================
  // INICIO
  // ==========================================================

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

    // P1
    this.obtenerPregunta();
  }

  // ==========================================================
  // OBTENER PREGUNTA / BLOQUE DE PREGUNTAS
  // ==========================================================

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

        // ==================================================
        // REVISIÓN CLÍNICA
        // ==================================================

        if (respuesta?.accion === 'revision_clinica') {
          this.enviarARevisionClinica(
            respuesta.message || 'Se requiere valoración por personal de salud.',
          );
          return;
        }

        if (!respuesta?.ok) {
          this.mensajeError = 'No fue posible obtener las preguntas de IA.';
          this.cdr.detectChanges();
          return;
        }

        const resultado = respuesta.resultado;

        // ==================================================
        // CUESTIONARIO COMPLETADO
        // ==================================================

        if (resultado?.accion === 'cuestionario_completado') {
          this.preguntaActual = null;
          this.preguntasActuales = [];
          this.respuestasActuales = {};

          this.cdr.detectChanges();

          this.evaluarResultadoFinal();
          return;
        }

        // ==================================================
        // REVISIÓN CLÍNICA / INFORMACIÓN INSUFICIENTE
        // ==================================================

        if (
          resultado?.accion === 'revision_clinica' ||
          resultado?.accion === 'informacion_insuficiente'
        ) {
          this.enviarARevisionClinica(
            resultado.mensaje || 'No fue posible determinar una prioridad confiable.',
          );
          return;
        }

        // ==================================================
        // BLOQUE DE PREGUNTAS
        //
        // P2-P5
        // o
        // P6-P8
        // ==================================================

        if (
          resultado?.accion === 'bloque_preguntas' ||
          resultado?.accion === 'preguntas_adicionales'
        ) {
          if (!Array.isArray(resultado.preguntas) || resultado.preguntas.length === 0) {
            this.mensajeError = 'El servidor no devolvió preguntas válidas.';
            this.cdr.detectChanges();
            return;
          }

          this.preguntasActuales = resultado.preguntas;
          this.respuestasActuales = {};

          for (const pregunta of this.preguntasActuales) {
            this.respuestasActuales[pregunta.id_pregunta] = '';
          }

          // Ya no mostramos pregunta individual
          this.preguntaActual = null;

          this.cdr.detectChanges();
          return;
        }

        // ==================================================
        // PREGUNTA INDIVIDUAL
        //
        // Esto corresponde a P1.
        // ==================================================

        if (
          resultado &&
          typeof resultado.id_pregunta === 'number' &&
          typeof resultado.pregunta === 'string'
        ) {
          this.preguntaActual = {
            id_pregunta: resultado.id_pregunta,
            pregunta: resultado.pregunta,
            orden: resultado.orden,
          };

          this.respuestaPaciente = '';

          this.cdr.detectChanges();
          return;
        }

        this.mensajeError = 'El servidor no devolvió una pregunta válida.';

        this.cdr.detectChanges();
      },

      error: (error) => {
        this.cargando = false;

        this.mensajeError = error.error?.message || 'Ocurrió un error al generar las preguntas.';

        this.cdr.detectChanges();
      },
    });
  }

  // ==========================================================
  // ENVIAR P1
  //
  // P1 se envía individualmente porque es la pregunta inicial.
  // ==========================================================

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

          if (!resultado?.ok) {
            this.mensajeError = 'No fue posible guardar tu respuesta.';
            this.cdr.detectChanges();
            return;
          }

          const revision: RevisionSeguridad | undefined = resultado.revision_seguridad;

          // ==================================================
          // SIN REVISIÓN DE SEGURIDAD
          // ==================================================

          if (!revision) {
            this.finalizado = true;
            this.preguntaActual = null;

            this.mensajeEstado =
              'La respuesta fue guardada, pero no se recibió la revisión de seguridad.';

            this.cdr.detectChanges();
            return;
          }

          console.log('Revisión de seguridad:', revision);

          // ==================================================
          // ALERTA
          // ==================================================

          if (revision.accion === 'alerta' || revision.estado_seguridad_ia === 'alerta') {
            this.enviarAResultadoPrioridadAlta(
              revision.mensaje || 'Se identificó una señal que requiere atención inmediata.',
            );
            return;
          }

          // ==================================================
          // REVISIÓN CLÍNICA
          // ==================================================

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

          // ==================================================
          // CONTINUAR
          //
          // Aquí ya se guardó P1.
          // Ahora solicitamos P2-P5.
          // ==================================================

          if (revision.accion === 'continuar' && revision.estado_seguridad_ia === 'continuar') {
            this.preguntaActual = null;
            this.respuestaPaciente = '';

            this.cdr.detectChanges();

            this.obtenerPregunta();
            return;
          }

          // ==================================================
          // RESPUESTA INESPERADA
          // ==================================================

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

  // ==========================================================
  // VERIFICAR QUE TODAS LAS PREGUNTAS DEL BLOQUE
  // TENGAN RESPUESTA
  // ==========================================================

  todasRespondidas(): boolean {
    if (this.preguntasActuales.length === 0) {
      return false;
    }

    return this.preguntasActuales.every(
      (pregunta) => !!this.respuestasActuales[pregunta.id_pregunta]?.trim(),
    );
  }

  // ==========================================================
  // ENVIAR P2-P5 O P6-P8 JUNTAS
  // ==========================================================

  enviarRespuestas(): void {
    if (this.preguntasActuales.length === 0 || this.guardando || this.cargando || this.finalizado) {
      return;
    }

    if (!this.todasRespondidas()) {
      this.mensajeError = 'Debes responder todas las preguntas antes de continuar.';
      return;
    }

    this.guardando = true;
    this.mensajeError = '';

    const respuestas = this.preguntasActuales.map((pregunta) => ({
      id_pregunta: pregunta.id_pregunta,
      respuesta: this.respuestasActuales[pregunta.id_pregunta].trim(),
    }));

    // ========================================================
    // IMPORTANTE:
    //
    // guardarRespuestasIA recibe:
    // 1. idPretriage
    // 2. respuestas[]
    // 3. token
    //
    // NO recibe idPregunta ni respuesta individual.
    // ========================================================

    this.emergencyService.guardarRespuestasIA(this.idPretriage, respuestas, this.token).subscribe({
      next: (resultado) => {
        this.guardando = false;

        if (!resultado?.ok) {
          this.mensajeError = 'No fue posible guardar las respuestas.';
          this.cdr.detectChanges();
          return;
        }

        const revision: RevisionSeguridad | undefined = resultado.revision_seguridad;

        // ==================================================
        // SIN REVISIÓN
        // ==================================================

        if (!revision) {
          this.enviarARevisionClinica('No se recibió la revisión de seguridad.');
          return;
        }

        // ==================================================
        // ALERTA
        // ==================================================

        if (revision.accion === 'alerta' || revision.estado_seguridad_ia === 'alerta') {
          this.enviarAResultadoPrioridadAlta(
            revision.mensaje || 'Se identificó una señal que requiere atención inmediata.',
          );
          return;
        }

        // ==================================================
        // REVISIÓN CLÍNICA
        // ==================================================

        if (
          revision.accion === 'revision_clinica' ||
          revision.accion === 'informacion_insuficiente'
        ) {
          this.enviarARevisionClinica(
            revision.mensaje || 'Se requiere valoración por personal de salud.',
          );
          return;
        }

        // ==================================================
        // CONTINUAR
        //
        // Las respuestas fueron guardadas.
        // Ahora evaluamos todas juntas.
        // ==================================================

        if (revision.accion === 'continuar' && revision.estado_seguridad_ia === 'continuar') {
          this.preguntasActuales = [];
          this.respuestasActuales = {};

          this.cdr.detectChanges();

          this.evaluarResultadoFinal();

          return;
        }

        // ==================================================
        // RESPUESTA INESPERADA
        // ==================================================

        this.enviarARevisionClinica(
          revision.mensaje || 'No fue posible verificar la seguridad del cuestionario.',
        );
      },

      error: (error) => {
        this.guardando = false;

        this.mensajeError = error.error?.message || 'No fue posible guardar las respuestas.';

        this.cdr.detectChanges();
      },
    });
  }

  // ==========================================================
  // EVALUACIÓN GENERAL
  // ==========================================================

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

  // ==========================================================
  // EVALUACIÓN DESPUÉS DE CADA BLOQUE
  //
  // Si la IA determina que necesita aclaración:
  // devuelve preguntas_adicionales
  // y las mostramos juntas.
  // ==========================================================

  private evaluarResultadoFinal(): void {
    this.cargando = true;
    this.mensajeError = '';
    this.mensajeEstado = '';

    this.emergencyService.evaluarConIA(this.idPretriage, this.token).subscribe({
      next: (respuesta) => {
        this.cargando = false;

        // ==================================================
        // NECESITA MÁS PREGUNTAS
        // ==================================================

        if (respuesta?.ok && respuesta?.result?.accion === 'preguntas_adicionales') {
          const preguntas = respuesta.result.preguntas;

          if (!Array.isArray(preguntas) || preguntas.length === 0) {
            this.enviarARevisionClinica('No fue posible obtener preguntas adicionales.');
            return;
          }

          this.preguntasActuales = preguntas;

          this.respuestasActuales = {};

          for (const pregunta of this.preguntasActuales) {
            this.respuestasActuales[pregunta.id_pregunta] = '';
          }

          this.preguntaActual = null;
          this.finalizado = false;
          this.alerta = false;
          this.mensajeError = '';
          this.mensajeEstado = '';

          this.cdr.detectChanges();

          return;
        }

        // ==================================================
        // REVISIÓN CLÍNICA
        // ==================================================

        if (respuesta?.accion === 'revision_clinica') {
          this.enviarARevisionClinica(
            respuesta.message || 'Se requiere valoración por personal de salud.',
          );
          return;
        }

        // ==================================================
        // RESPUESTA INVÁLIDA
        // ==================================================

        if (!respuesta?.ok || !respuesta?.result) {
          this.mensajeError = respuesta?.message || 'No fue posible completar la evaluación final.';

          this.cdr.detectChanges();
          return;
        }

        const resultadoIA = respuesta.result;

        // ==================================================
        // INCERTIDUMBRE
        // ==================================================

        if (resultadoIA.incertidumbre === true) {
          this.enviarARevisionClinica(
            resultadoIA.detalle_incertidumbre ||
              'La información requiere valoración por personal de salud.',
          );
          return;
        }

        // ==================================================
        // VALIDAR PRIORIDAD
        // ==================================================

        const prioridadesValidas = ['alta', 'media_alta', 'media_baja', 'baja'];

        if (!prioridadesValidas.includes(resultadoIA.prioridad)) {
          this.mensajeError = 'El servidor no devolvió una prioridad válida.';
          this.cdr.detectChanges();
          return;
        }

        // ==================================================
        // RESULTADO FINAL
        // ==================================================

        sessionStorage.setItem(
          'resultadoTriage',
          JSON.stringify({
            ok: true,
            id_pretriage: this.idPretriage,
            origen: 'ia',
            alta_prioridad: resultadoIA.prioridad === 'alta',
            accion: 'resultado_ia',
            resultado: resultadoIA,
          }),
        );

        this.router.navigate(['/emergency/resultado']);
      },

      error: (error) => {
        this.cargando = false;

        this.mensajeError = error.error?.message || 'No fue posible completar la evaluación final.';

        this.cdr.detectChanges();
      },
    });
  }

  // ==========================================================
  // ENVIAR A REVISIÓN CLÍNICA
  // ==========================================================

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

  // ==========================================================
  // VOLVER
  // ==========================================================

  volver(): void {
    this.router.navigate(['/emergency/sintomas']);
  }

  // ==========================================================
  // RESULTADO DE ALTA PRIORIDAD
  // ==========================================================

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
