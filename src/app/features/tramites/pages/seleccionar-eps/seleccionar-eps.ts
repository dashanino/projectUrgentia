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
  private http = inject(HttpClient);

  epsSeleccionada: number | null = null;
  listaEps: Eps[] = [];

  origen: 'tramites' | 'pretriage' = 'tramites';

  cargando = false;
  error = '';

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

    this.cargarEps();
  }

  cargarEps(): void {
    this.cargando = true;
    this.error = '';

    this.http.get<Eps[]>('http://127.0.0.1:3000/api/tramites/eps').subscribe({
      next: (respuesta) => {
        this.listaEps = respuesta;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando EPS:', err);
        this.error = 'No se pudieron cargar las EPS.';
        this.cargando = false;
      },
    });
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
