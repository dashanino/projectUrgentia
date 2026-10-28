import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface Eps {
  id: number;
  nombre: string;
}
interface OrientacionTramite {
  eps: string;
  tramite: string;
  disponible: boolean;
  requisitos?: string[];
  pasos?: string[];
  url_oficial?: string | null;
  fecha_verificacion?: string | null;
  mensaje?: string;
}

@Component({
  selector: 'app-resultado-tramite',
  standalone: true,
  imports: [],
  templateUrl: './resultado-tramite.html',
  styleUrl: './resultado-tramite.scss',
})
export class ResultadoTramite implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  origen: 'tramites' | 'pretriage' = 'tramites';

  epsSeleccionada = '';
  nombreEps = '';
  tramiteSeleccionado = '';
  nombreTramite = '';
  orientacion: OrientacionTramite | null = null;
  cargandoOrientacion = false;
  errorOrientacion = '';

  cargando = false;
  error = '';

  tramites: Record<string, string> = {
    'autorizacion-examen': 'Autorización de examen / procedimiento / cirugía',

    'autorizacion-especialista': 'Autorización para valoración con especialista',

    'asignacion-cita': 'Asignación de cita por consulta externa',

    'renovar-formula': 'Renovar fórmula',

    'vencimiento-examen': 'Vencimiento de orden para examen / procedimiento / cirugía',

    'vencimiento-especialista': 'Vencimiento de orden para valoración con especialista',
  };

  ngOnInit(): void {
    this.origen =
      this.route.snapshot.queryParamMap.get('origen') === 'pretriage' ? 'pretriage' : 'tramites';
    this.epsSeleccionada = this.route.snapshot.queryParamMap.get('eps') ?? '';

    this.tramiteSeleccionado = this.route.snapshot.queryParamMap.get('tramite') ?? '';

    const epsId = Number(this.epsSeleccionada);

    if (
      !Number.isInteger(epsId) ||
      epsId <= 0 ||
      !Object.prototype.hasOwnProperty.call(this.tramites, this.tramiteSeleccionado)
    ) {
      this.router.navigate(['/tramites']);
      return;
    }

    this.nombreTramite = this.tramites[this.tramiteSeleccionado];

    this.cargarEps(epsId);
    this.cargarOrientacion(epsId);
  }

  cargarEps(epsId: number): void {
    this.cargando = true;
    this.error = '';
  
    this.http.get<Eps[]>('http://127.0.0.1:3000/api/tramites/eps').subscribe({
      next: (listaEps) => {
        const epsEncontrada = listaEps.find((eps) => eps.id === epsId);
  
        if (!epsEncontrada) {
          this.error = 'No se encontró la EPS seleccionada.';
        } else {
          this.nombreEps = epsEncontrada.nombre;
        }
  
        this.cargando = false;
        this.cdr.markForCheck();
      },
  
      error: (err) => {
        console.error('Error consultando EPS:', err);
        this.error = 'No se pudo consultar la EPS.';
        this.cargando = false;
        this.cdr.markForCheck();
      },
    });
  }

  volver(): void {
    if (this.origen === 'pretriage') {
      this.router.navigate(['/emergency/resultado']);
      return;
    }

    this.router.navigate(['/tramites/seleccionar-tramite'], {
      queryParams: {
        eps: this.epsSeleccionada,
      },
    });
  }

  cambiarEps(): void {
    this.router.navigate(['/tramites']);
  }

  get mostrarAutorizacionSura(): boolean {
    return this.epsSeleccionada === '1' && this.tramiteSeleccionado === 'autorizacion-examen';
  }

  urlPortalSura = 'https://www.epssura.com/afiliados';

  urlLoginSura =
    'https://login.sura.com/sso/servicelogin.aspx?continueTo=https%3A%2F%2Fportaleps.epssura.com%2FServiciosUnClick%2F&service=epssura';
    cargarOrientacion(epsId: number): void {
      this.cargandoOrientacion = true;
      this.errorOrientacion = '';
      this.orientacion = null;
    
      const codigo = encodeURIComponent(this.tramiteSeleccionado);
    
      this.http.get<OrientacionTramite>(
        `http://127.0.0.1:3000/api/tramites/eps/${epsId}/tramites/${codigo}`
      ).subscribe({
        next: (respuesta) => {
          this.orientacion = respuesta;
          this.cargandoOrientacion = false;
          this.cdr.markForCheck();
        },
    
        error: (err) => {
          console.error('Error consultando orientación:', err);
          this.errorOrientacion = 'No fue posible consultar la información del trámite.';
          this.cargandoOrientacion = false;
          this.cdr.markForCheck();
        },
      });
    }
}
