import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EmergencyService } from '../../../../services/emergency.service';

interface EvaluacionAdminResult {
  accion: 'resultado_ia' | 'revision_clinica';
  prioridad: 'alta' | 'media_alta' | 'media_baja' | 'baja' | null;
  justificacion: string;
  resumen_informacion: string;
  incertidumbre: boolean;
  detalle_incertidumbre: string | null;
  tipo_atencion_urgencias?: string | null;
  servicio_recomendado?: string | null;
}

@Component({
  selector: 'app-admin-free-triage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-free-triage.html',
  styleUrl: './admin-free-triage.scss',
})
export class AdminFreeTriage {
  private router = inject(Router);
  private emergencyService = inject(EmergencyService);

  motivo = '';
  cargando = false;
  error = '';
  resultado: EvaluacionAdminResult | null = null;

  evaluar(): void {
    const relato = this.motivo.trim();
    const token = sessionStorage.getItem('access_token');

    if (!token) {
      this.router.navigate(['/login']);
      return;
    }
    if (relato.length < 20) {
      this.error = 'Describe con mayor detalle el motivo de consulta (mínimo 20 caracteres).';
      return;
    }

    this.cargando = true;
    this.error = '';
    this.resultado = null;

    this.emergencyService.evaluarRelatoAdministrador(relato, token).subscribe({
      next: (response) => {
        this.cargando = false;
        this.resultado = response.resultado;
      },
      error: (error) => {
        this.cargando = false;
        this.error = error.error?.message || 'No fue posible realizar la evaluación.';
      },
    });
  }

  volver(): void {
    this.router.navigate(['/app/home']);
  }

  get tituloPrioridad(): string {
    if (!this.resultado || this.resultado.accion === 'revision_clinica') {
      return 'VALORACIÓN CLÍNICA REQUERIDA';
    }
    const titulos: Record<string, string> = {
      alta: 'ALTA PRIORIDAD',
      media_alta: 'PRIORIDAD MEDIA-ALTA',
      media_baja: 'PRIORIDAD MEDIA-BAJA',
      baja: 'BAJA PRIORIDAD',
    };
    return titulos[this.resultado.prioridad || ''] || 'RESULTADO';
  }
}