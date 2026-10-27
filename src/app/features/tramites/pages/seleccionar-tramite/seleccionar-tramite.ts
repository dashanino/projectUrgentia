import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

interface Tramite {
  id: string;
  nombre: string;
}

@Component({
  selector: 'app-seleccionar-tramite',
  standalone: true,
  imports: [],
  templateUrl: './seleccionar-tramite.html',
  styleUrl: './seleccionar-tramite.scss',
})
export class SeleccionarTramite implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  epsSeleccionada: number | null = null;
  origen: 'tramites' | 'pretriage' = 'tramites';

  // Catálogo temporal hasta conectar la tabla tramites.
  tramites: Tramite[] = [
    {
      id: 'autorizacion-examen',
      nombre: 'Autorización de examen / procedimiento / cirugía',
    },
    {
      id: 'autorizacion-especialista',
      nombre: 'Autorización para valoración con especialista',
    },
    {
      id: 'asignacion-cita',
      nombre: 'Asignación de cita por consulta externa',
    },
    {
      id: 'renovar-formula',
      nombre: 'Renovar fórmula',
    },
    {
      id: 'vencimiento-examen',
      nombre: 'Vencimiento de orden para examen / procedimiento / cirugía',
    },
    {
      id: 'vencimiento-especialista',
      nombre: 'Vencimiento de orden para valoración con especialista',
    },
  ];

  ngOnInit(): void {
    const epsParam = this.route.snapshot.queryParamMap.get('eps');

    this.origen =
      this.route.snapshot.queryParamMap.get('origen') === 'pretriage' ? 'pretriage' : 'tramites';

    if (!epsParam) {
      this.volver();
      return;
    }

    const epsId = Number(epsParam);

    if (!Number.isInteger(epsId) || epsId <= 0) {
      this.volver();
      return;
    }

    this.epsSeleccionada = epsId;
  }

  seleccionarTramite(tramiteId: string): void {
    if (this.epsSeleccionada === null) {
      return;
    }

    this.router.navigate(['/tramites/resultado-tramite'], {
      queryParams: {
        eps: this.epsSeleccionada,
        tramite: tramiteId,
        origen: this.origen,
      },
    });
  }

  volver(): void {
    if (this.origen === 'pretriage') {
      this.router.navigate(['/emergency/resultado']);
      return;
    }

    this.router.navigate(['/tramites']);
  }
}
