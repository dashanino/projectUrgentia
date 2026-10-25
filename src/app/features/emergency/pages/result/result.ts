import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Location, LocationData } from '../../../location/location';
import { InstitutionsService, Institution } from '../../../../services/institutions.service';
import { EmergencyService } from '../../../../services/emergency.service';
import { finalize } from 'rxjs';

type TipoAtencionUrgencias =
  'general' | 'pediatrica' | 'ginecoobstetrica' | 'trauma' | 'neurologica' | 'cardiovascular';

interface ResultadoIA {
  prioridad: 'alta' | 'media_alta' | 'media_baja' | 'baja';
  tipo_atencion_urgencias: TipoAtencionUrgencias | null;
  servicio_recomendado: string | null;
  justificacion: string;
  incertidumbre: boolean;
  detalle_incertidumbre: string | null;
}

interface ResultadoTriage {
  ok: boolean;
  id_pretriage: number;
  origen: 'reglas' | 'ia';
  alta_prioridad: boolean;
  accion: 'alerta' | 'resultado_ia' | 'revision_clinica';
  resultado: any;
}
@Component({
  selector: 'app-result',
  standalone: true,
  imports: [MatIconModule, CommonModule, Location],
  templateUrl: './result.html',
  styleUrl: './result.scss',
})
export class Result implements OnInit {
  private router = inject(Router);
  private institutionsService = inject(InstitutionsService);
  private emergencyService = inject(EmergencyService);
  private cdr = inject(ChangeDetectorRef);

  resultadoTriage: ResultadoTriage | null = null;

  institutions: Institution[] = [];

  loadingInstitutions = false;
  institutionsError = '';

  tipoAtencionUrgencias: TipoAtencionUrgencias | null = null;
  servicioRecomendado: string | null = null;

  location: LocationData | null = null;
  token = sessionStorage.getItem('access_token');

  onLocationSelected(location: LocationData): void {
    this.location = location;
    this.institutionsError = '';
    this.institutions = [];

    const token = sessionStorage.getItem('access_token');

    if (!token) {
      this.institutionsError = 'Tu sesión ha expirado. Inicia sesión nuevamente.';
      return;
    }

    if (this.revisionClinica) {
      const epsId = Number(sessionStorage.getItem('eps_pretriage'));

      if (!Number.isInteger(epsId) || epsId <= 0) {
        this.institutionsError = 'Selecciona una EPS válida.';
        return;
      }

      this.loadingInstitutions = true;

      this.institutionsService
        .getNearbyInstitutionsForClinicalReview(
          location.latitude,
          location.longitude,
          epsId,
          token
        )
        .subscribe({
          next: (response) => {
            this.institutions = response.institutions ?? [];
            this.loadingInstitutions = false;

            this.institutionsError = this.institutions.length
              ? ''
              : 'No encontramos instituciones registradas para esta EPS que ofrezcan consulta de medicina general.';

            this.cdr.detectChanges();
          },
          error: () => {
            this.loadingInstitutions = false;
            this.institutionsError =
              'No fue posible consultar instituciones para valoración clínica.';
            this.cdr.detectChanges();
          }
        });

      return;
    }


    // Media-baja: buscar por servicio clínico.
    if (this.prioridad === 'media_baja') {
      if (!this.servicioRecomendado) {
        this.institutionsError = 'No se pudo determinar un servicio médico recomendado.';
        return;
      }

      this.buscarPorServicio(location, this.servicioRecomendado, token);
      return;
    }

    // Alta/media-alta con categoría ya obtenida del JSON.
    if (this.tipoAtencionUrgencias) {
      this.buscarPorUrgencias(location, this.tipoAtencionUrgencias, token);
      return;
    }

    // Alta detectada por reglas: clasificación complementaria.
    if (
      this.prioridad === 'alta' &&
      this.resultadoTriage?.origen === 'reglas' &&
      this.resultadoTriage.accion === 'alerta'
    ) {
      this.loadingInstitutions = true;

      this.emergencyService
        .clasificarTipoAtencion(this.resultadoTriage.id_pretriage, token)
        .subscribe({
          next: (response) => {
            const tipoAtencion = response.tipo_atencion_urgencias as TipoAtencionUrgencias;

            this.tipoAtencionUrgencias = tipoAtencion;

            this.buscarPorUrgencias(location, tipoAtencion, token);
          },
          error: () => {
            this.loadingInstitutions = false;
            this.institutionsError = 'No fue posible determinar el tipo de urgencia requerido.';
          },
        });

      return;
    }

    this.institutionsError = 'No se pudo determinar el tipo de atención requerido.';
  }

  private buscarPorUrgencias(
    location: LocationData,
    tipoAtencion: TipoAtencionUrgencias,
    token: string,
  ): void {
    if (this.prioridad !== 'alta' && this.prioridad !== 'media_alta') {
      this.institutionsError =
        'No existe una prioridad de urgencias válida para esta búsqueda.';
      return;
    }
    this.loadingInstitutions = true;
    this.institutionsError = '';
    this.institutions = [];

    this.cdr.detectChanges();

    console.log('[URGENTIA] Buscando instituciones:', {
      latitude: location.latitude,
      longitude: location.longitude,
      prioridad: this.prioridad,
      tipo_atencion: tipoAtencion,
    });

    this.institutionsService
      .getNearbyInstitutions(
        location.latitude,
        location.longitude,
        this.prioridad,
        tipoAtencion,
        token,
      )
      .subscribe({
        next: (response) => {
          console.log('[URGENTIA] Respuesta completa:', response);

          this.institutions = response.institutions ?? [];

          if (this.institutions.length === 0) {
            this.institutionsError =
              'No encontramos instituciones registradas que cumplan los criterios.';
          } else {
            this.institutionsError = '';
          }

          this.loadingInstitutions = false;

          // Actualizar la interfaz inmediatamente.
          this.cdr.detectChanges();

          console.table(this.institutions);
        },

        error: (error) => {
          console.error('[URGENTIA] Error consultando instituciones:', error);

          this.institutions = [];
          this.loadingInstitutions = false;
          this.institutionsError =
            'No fue posible consultar las instituciones. Inténtalo nuevamente.';

          this.cdr.detectChanges();
        },
      });
  }

  private buscarPorServicio(location: LocationData, servicio: string, token: string): void {
    this.loadingInstitutions = true;

    this.institutionsService
      .getNearbyInstitutionsByService(location.latitude, location.longitude, servicio, token)
      .subscribe({
        next: (response) => {
          this.institutions = response.institutions ?? [];
          this.loadingInstitutions = false;

          if (!this.institutions.length) {
            this.institutionsError = `No encontramos instituciones registradas que ofrezcan ${servicio}.`;
          }
        },
        error: () => {
          this.loadingInstitutions = false;
          this.institutionsError = 'No fue posible consultar las instituciones.';
          
          this.cdr.detectChanges();
        },
      });
  }

  prioridad: 'alta' | 'media_alta' | 'media_baja' | 'baja' | null = null;

  revisionClinica = false;

  justificacion = '';

  incertidumbre = false;

  detalleIncertidumbre: string | null = null;

  ngOnInit(): void {
    const resultadoGuardado = sessionStorage.getItem('resultadoTriage');

    if (!resultadoGuardado) {
      console.error('No existe un resultado de triage');

      this.router.navigate(['emergency/patient-group']);

      return;
    }

    try {
      this.resultadoTriage = JSON.parse(resultadoGuardado);

      this.procesarResultado();
    } catch (error) {
      console.error('No se pudo leer el resultado de triage:', error);

      this.router.navigate(['emergency/patient-group']);
    }
  }

  private procesarResultado(): void {
    if (!this.resultadoTriage) {
      return;
    }
    // =========================================================
    // RESULTADO QUE REQUIERE VALORACIÓN CLÍNICA
    // =========================================================

    if (this.resultadoTriage.accion === 'revision_clinica') {
      this.revisionClinica = true;
      this.prioridad = null;
      this.incertidumbre = true;

      this.justificacion =
        this.resultadoTriage.resultado?.justificacion ||
        'La información disponible no permite determinar una prioridad confiable. Se requiere valoración médica.';

      this.detalleIncertidumbre =
        this.resultadoTriage.resultado?.detalle_incertidumbre ?? null;

      this.tipoAtencionUrgencias = null;
      this.servicioRecomendado = null;

      return;
    }

    // =========================================================
    // RESULTADO PROVENIENTE DE TRIAGE_RULES
    // =========================================================

    console.log('RESULTADO TRIAGE:', this.resultadoTriage);

    if (this.resultadoTriage.origen === 'reglas' && this.resultadoTriage.accion === 'alerta') {
      this.prioridad = 'alta';

      console.log('PRIORIDAD ASIGNADA:', this.prioridad);

      this.justificacion =
        'Se identificaron signos o síntomas que requieren atención médica inmediata.';

      this.incertidumbre = false;
      this.detalleIncertidumbre = null;

      return;
    }

    // =========================================================
    // RESULTADO PROVENIENTE DE IA
    // =========================================================

    if (this.resultadoTriage.origen === 'ia' && this.resultadoTriage.accion === 'resultado_ia') {
      const resultadoIA: ResultadoIA = this.resultadoTriage.resultado;
      this.tipoAtencionUrgencias = resultadoIA.tipo_atencion_urgencias;
      this.servicioRecomendado = resultadoIA.servicio_recomendado;

      this.prioridad = resultadoIA.prioridad;

      this.justificacion = resultadoIA.justificacion;

      this.incertidumbre = resultadoIA.incertidumbre;

      this.detalleIncertidumbre = resultadoIA.detalle_incertidumbre;

      return;
    }

    console.error('Formato de resultado de triage no reconocido:', this.resultadoTriage);
  }

  get tituloPrioridad(): string {
    if (this.revisionClinica) {
      return 'VALORACIÓN MÉDICA REQUERIDA';
    }
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
    if (this.revisionClinica) {
      return 'medical_services';
    }
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
    this.router.navigate(['emergency/patient-group']);
  }
  get requiereEps(): boolean {
    return this.prioridad === 'media_baja' || this.revisionClinica;
  }
  
  get epsSeleccionada(): string | null {
    return sessionStorage.getItem('eps_pretriage');
  }
  
  seleccionarEps(): void {
    this.router.navigate(['/tramites'], {
      queryParams: { origen: 'pretriage' }
    });
  }
  irATramites(): void {
    this.router.navigate(['/tramites']);
  }
}
