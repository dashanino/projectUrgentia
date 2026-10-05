import { Component, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

interface ResultadoIA {
  prioridad: 'alta' | 'media_alta' | 'media_baja' | 'baja';
  justificacion: string;
  incertidumbre: boolean;
  detalle_incertidumbre: string | null;
}

interface ResultadoTriage {
  ok: boolean;
  id_pretriage: number;
  origen: 'reglas' | 'ia';
  alta_prioridad: boolean;
  accion: 'alerta' | 'resultado_ia';
  resultado: any;
}

@Component({
  selector: 'app-result',
  standalone: true,
  imports: [
    MatIconModule,
    CommonModule
  ],
  templateUrl: './result.html',
  styleUrl: './result.scss',
})
export class Result implements OnInit {

  private router = inject(Router);

  resultadoTriage: ResultadoTriage | null = null;

  prioridad:
    'alta' |
    'media_alta' |
    'media_baja' |
    'baja' = 'baja';

  justificacion = '';

  incertidumbre = false;

  detalleIncertidumbre: string | null = null;


  ngOnInit(): void {

    const resultadoGuardado =
      sessionStorage.getItem('resultadoTriage');

    if (!resultadoGuardado) {

      console.error(
        'No existe un resultado de triage'
      );

      this.router.navigate([
        'emergency/patient-group'
      ]);

      return;
    }

    try {

      this.resultadoTriage =
        JSON.parse(resultadoGuardado);

      this.procesarResultado();

    } catch (error) {

      console.error(
        'No se pudo leer el resultado de triage:',
        error
      );

      this.router.navigate([
        'emergency/patient-group'
      ]);
    }
  }


  private procesarResultado(): void {

    if (!this.resultadoTriage) {
      return;
    }

    // =========================================================
    // RESULTADO PROVENIENTE DE TRIAGE_RULES
    // =========================================================

    if (
      this.resultadoTriage.origen === 'reglas' &&
      this.resultadoTriage.accion === 'alerta'
    ) {

      this.prioridad = 'alta';

      this.justificacion =
        'Se identificaron signos o síntomas que requieren atención médica inmediata.';

      this.incertidumbre = false;

      this.detalleIncertidumbre = null;

      return;
    }


    // =========================================================
    // RESULTADO PROVENIENTE DE IA
    // =========================================================

    if (
      this.resultadoTriage.origen === 'ia' &&
      this.resultadoTriage.accion === 'resultado_ia'
    ) {

      const resultadoIA: ResultadoIA =
        this.resultadoTriage.resultado;

      this.prioridad =
        resultadoIA.prioridad;

      this.justificacion =
        resultadoIA.justificacion;

      this.incertidumbre =
        resultadoIA.incertidumbre;

      this.detalleIncertidumbre =
        resultadoIA.detalle_incertidumbre;

      return;
    }


    console.error(
      'Formato de resultado de triage no reconocido:',
      this.resultadoTriage
    );
  }


  get tituloPrioridad(): string {

    switch (this.prioridad) {

      case 'alta':
        return 'ALTA PRIORIDAD';

      case 'media_alta':
        return 'PRIORIDAD MEDIA ALTA';

      case 'media_baja':
        return 'PRIORIDAD MEDIA BAJA';

      case 'baja':
        return 'BAJA PRIORIDAD';

      default:
        return 'RESULTADO';
    }
  }


  get iconoPrioridad(): string {

    switch (this.prioridad) {

      case 'alta':
        return 'warning';

      case 'media_alta':
        return 'priority_high';

      case 'media_baja':
        return 'info';

      case 'baja':
        return 'check_circle';

      default:
        return 'info';
    }
  }


  goBack(): void {

    this.router.navigate([
      'emergency/patient-group'
    ]);
  }
}
