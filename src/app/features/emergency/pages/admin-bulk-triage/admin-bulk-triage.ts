import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BulkPretriageService } from '../../../../services/bulk-pretriage.service';

@Component({
  selector: 'app-admin-bulk-triage',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-bulk-triage.html',
  styleUrl: './admin-bulk-triage.scss',
})
export class AdminBulkTriage {
  private router = inject(Router);
  private bulkService = inject(BulkPretriageService);

  archivo: File | null = null;
  cargando = false;
  error = '';
  resultado = '';

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

    this.cargando = true;
    this.error = '';
    this.resultado = '';

    this.bulkService.evaluarExcel(this.archivo, token).subscribe({
      next: (blob) => {
        this.cargando = false;

        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'resultados_priorizacion_urgentia.xlsx';
        anchor.click();
        window.URL.revokeObjectURL(url);

        this.resultado =
          'La evaluación terminó. Se descargó el Excel con la columna priorizacion_urgentia.';
      },
      error: async (error) => {
        this.cargando = false;

        if (error.error instanceof Blob) {
          try {
            const text = await error.error.text();
            const parsed = JSON.parse(text);
            this.error = parsed.message || 'No fue posible procesar el Excel.';
            return;
          } catch {
            // Usa el mensaje genérico debajo.
          }
        }

        this.error = 'No fue posible procesar el Excel.';
      },
    });
  }

  volver(): void {
    this.router.navigate(['/app/home']);
  }
}
