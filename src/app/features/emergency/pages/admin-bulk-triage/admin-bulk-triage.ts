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
  private progressTimer: ReturnType<typeof setInterval> | null = null;

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

    this.bulkService.iniciarEvaluacionExcel(this.archivo, token).subscribe({
      next: (respuesta) => {
        this.progreso.status = 'en cola';
        this.iniciarPolling(respuesta.job_id, token);
      },
      error: async (error) => {
        this.cargando = false;
        this.mostrarError(error);
      },
    });
  }

  private iniciarPolling(jobId: string, token: string): void {
    const consultar = () => {
      this.bulkService.consultarProgreso(jobId, token).subscribe({
        next: (respuesta) => {
          this.progreso = respuesta.progress;
          this.estadisticas = respuesta.statistics;

          if (respuesta.status === 'completed') {
            this.detenerPolling();
            this.descargarResultado(jobId, token);
            return;
          }

          if (respuesta.status === 'error') {
            this.detenerPolling();
            this.cargando = false;
            this.error = respuesta.error || 'No fue posible procesar el Excel.';
          }
        },
        error: (error) => {
          this.detenerPolling();
          this.cargando = false;
          this.mostrarError(error);
        },
      });
    };

    consultar();
    this.progressTimer = setInterval(consultar, 1000);
  }

  private descargarResultado(jobId: string, token: string): void {
    this.bulkService.descargarResultado(jobId, token).subscribe({
      next: (blob) => {
        this.cargando = false;

        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'resultados_priorizacion_urgentia.xlsx';
        anchor.click();
        window.URL.revokeObjectURL(url);

        this.resultado =
          `La evaluación terminó: ${this.progreso.total} casos procesados. Se descargó el Excel con la columna priorizacion_urgentia.`;
      },
      error: (error) => {
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
          this.error = parsed.message || 'No fue posible procesar el Excel.';
        } catch {
          this.error = 'No fue posible procesar el Excel.';
        }
      });
      return;
    }

    this.error = error?.error?.message || 'No fue posible procesar el Excel.';
  }

  private detenerPolling(): void {
    if (this.progressTimer !== null) {
      clearInterval(this.progressTimer);
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
