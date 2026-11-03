import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BulkPretriageService, BulkProgressResponse } from '../../../../services/bulk-pretriage.service';

@Component({
  selector: 'app-admin-bulk-triage',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-bulk-triage.html',
  styleUrl: './admin-bulk-triage.scss',
})
export class AdminBulkTriage implements OnDestroy {
  private router = inject(Router);
  private bulkService = inject(BulkPretriageService);
  private progressTimer: ReturnType<typeof setTimeout> | null = null;

  archivo: File | null = null;
  cargando = false;
  error = '';
  resultado = '';
  progreso: BulkProgressResponse['progress'] = {
    status: 'en espera',
    current: 0,
    total: 0,
    row: null,
    percentage: 0,
  };
  estadisticas: BulkProgressResponse['statistics'] = null;

  seleccionarArchivo(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.error = '';
    this.resultado = '';

    const file = input.files?.[0] ?? null;
    if (!file) {
      this.archivo = null;
      return;
    }

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      this.archivo = null;
      this.error = 'Selecciona un archivo Excel en formato .xlsx.';
      input.value = '';
      return;
    }

    this.archivo = file;
  }

  procesar(): void {
    const token = sessionStorage.getItem('access_token');

    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.archivo) {
      this.error = 'Primero selecciona un archivo Excel.';
      return;
    }

    this.detenerPolling();
    this.cargando = true;
    this.error = '';
    this.resultado = '';
    this.estadisticas = null;
    this.progreso = {
      status: 'subiendo archivo',
      current: 0,
      total: 0,
      row: null,
      percentage: 0,
    };

    console.log('[BULK FRONT] Enviando Excel...', this.archivo.name);

    this.bulkService.iniciarEvaluacionExcel(this.archivo, token).subscribe({
      next: (respuesta) => {
        console.log('[BULK FRONT] POST completado:', respuesta);

        if (!respuesta?.job_id) {
          this.cargando = false;
          this.error = 'El backend no devolvió un job_id para la evaluación.';
          console.error('[BULK FRONT] No se recibió job_id.');
          return;
        }

        this.progreso.status = 'en cola';
        this.iniciarPolling(respuesta.job_id, token);
      },
      error: async (error) => {
        console.error('[BULK FRONT] Error al iniciar evaluación:', error);
        this.cargando = false;
        this.mostrarError(error);
      },
    });
  }

  private iniciarPolling(jobId: string, token: string): void {
    console.log('[BULK FRONT] Iniciando polling. Job:', jobId);

    const consultar = () => {
      this.bulkService.consultarProgreso(jobId, token).subscribe({
        next: (respuesta) => {
          console.log('[BULK FRONT] Progreso:', respuesta);

          this.progreso = respuesta.progress;
          this.estadisticas = respuesta.statistics;

          if (respuesta.status === 'completed') {
            console.log('[BULK FRONT] Job completado. Solicitando Excel de resultado...');
            this.detenerPolling();
            this.descargarResultado(jobId, token);
            return;
          }

          if (respuesta.status === 'error') {
            this.detenerPolling();
            this.cargando = false;
            this.error = respuesta.error || 'No fue posible procesar el Excel.';
            return;
          }

          this.progressTimer = setTimeout(consultar, 1000);
        },
        error: (error) => {
          console.error('[BULK FRONT] Error consultando progreso:', error);
          this.detenerPolling();
          this.cargando = false;
          this.mostrarError(error);
        },
      });
    };

    consultar();
  }

  private descargarResultado(jobId: string, token: string): void {
    this.bulkService.descargarResultado(jobId, token).subscribe({
      next: (response) => {
        const blob = response.body;
        const contentType = response.headers.get('content-type') || '';

        console.log('[BULK FRONT] Respuesta de /result:', {
          status: response.status,
          contentType,
          size: blob?.size,
        });

        if (!blob || blob.size === 0) {
          this.cargando = false;
          this.error = 'El servidor respondió sin contenido para el Excel.';
          return;
        }

        if (!contentType.includes('spreadsheetml.sheet') && !contentType.includes('application/vnd.ms-excel')) {
          blob.text().then((text) => {
            console.error('[BULK FRONT] /result no devolvió un Excel:', text);
            try {
              const parsed = JSON.parse(text);
              this.error = parsed.message || parsed.error || 'El servidor no devolvió un archivo Excel válido.';
            } catch {
              this.error = 'El servidor no devolvió un archivo Excel válido.';
            }
            this.cargando = false;
          });
          return;
        }

        this.cargando = false;

        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'resultados_priorizacion_urgentia.xlsx';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();

        setTimeout(() => window.URL.revokeObjectURL(url), 1000);

        this.resultado =
          `La evaluación terminó: ${this.progreso.total} casos procesados. Se descargó el Excel con la columna priorizacion_urgentia.`;
      },
      error: (error) => {
        console.error('[BULK FRONT] Error descargando resultado:', error);
        this.cargando = false;
        this.mostrarError(error);
      },
    });
  }

  private mostrarError(error: any): void {
    if (error?.error instanceof Blob) {
      error.error.text().then((text: string) => {
        try {
          const parsed = JSON.parse(text);
          this.error = parsed.message || parsed.error || 'No fue posible procesar el Excel.';
        } catch {
          this.error = 'No fue posible procesar el Excel.';
        }
      });
      return;
    }

    this.error = error?.error?.message || error?.error?.error || 'No fue posible procesar el Excel.';
  }

  private detenerPolling(): void {
    if (this.progressTimer !== null) {
      clearTimeout(this.progressTimer);
      this.progressTimer = null;
    }
  }

  ngOnDestroy(): void {
    this.detenerPolling();
  }

  volver(): void {
    this.detenerPolling();
    this.router.navigate(['/app/home']);
  }
}
