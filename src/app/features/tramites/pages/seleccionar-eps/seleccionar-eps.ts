import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Eps {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-seleccionar-eps',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './seleccionar-eps.html',
  styleUrl: './seleccionar-eps.scss',
})
export class SeleccionarEps implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly listaEps: Eps[] = [
    { id: 1, nombre: 'SURA' },
    { id: 2, nombre: 'Sanitas' },
    { id: 3, nombre: 'Nueva EPS' },
    { id: 4, nombre: 'Salud Total' },
    { id: 7, nombre: 'Compensar' },
    { id: 8, nombre: 'Famisanar' },
    { id: 5, nombre: 'Coosalud' },
    { id: 6, nombre: 'Savia Salud' },
  ];

  epsSeleccionada: number | null = null;

  origen: 'tramites' | 'pretriage' = 'tramites';

  ngOnInit(): void {
    this.origen =
      this.route.snapshot.queryParamMap.get('origen') === 'pretriage' ? 'pretriage' : 'tramites';

    if (this.origen === 'pretriage') {
      const epsGuardada = sessionStorage.getItem('eps_pretriage');

      if (epsGuardada) {
        const epsId = Number(epsGuardada);

        if (Number.isInteger(epsId) && epsId > 0) {
          this.epsSeleccionada = epsId;
        }
      }
    }
  }

  continuar(): void {
    if (this.epsSeleccionada === null) {
      return;
    }

    // Selección de EPS desde el pre-triage
    if (this.origen === 'pretriage') {
      sessionStorage.setItem('eps_pretriage', String(this.epsSeleccionada));

      this.router.navigate(['/tramites/seleccionar-tramite'], {
        queryParams: {
          eps: this.epsSeleccionada,
          origen: 'pretriage',
        },
      });

      return;
    }

    // Funcionamiento original de trámites
    this.router.navigate(['/tramites/seleccionar-tramite'], {
      queryParams: {
        eps: this.epsSeleccionada,
      },
    });
  }

  volver(): void {
    if (this.origen === 'pretriage') {
      this.router.navigate(['/emergency/resultado']);
      return;
    }

    this.router.navigate(['/begin']);
  }
}
