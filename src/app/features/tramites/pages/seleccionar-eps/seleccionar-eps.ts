import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
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
  private cdr = inject(ChangeDetectorRef);

  // Conserva las EPS mientras esta pestaña siga abierta
  private static epsCache: Eps[] | null = null;

  epsSeleccionada: number | null = null;
  listaEps: Eps[] = [];

  origen: 'tramites' | 'pretriage' = 'tramites';

  cargando = false;
  error = '';

  ngOnInit(): void {
    this.origen =
      this.route.snapshot.queryParamMap.get('origen') === 'pretriage'
        ? 'pretriage'
        : 'tramites';

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
    // Si ya tenemos las EPS en memoria, no llamamos al backend
    if (SeleccionarEps.epsCache !== null) {
      this.listaEps = SeleccionarEps.epsCache;
      this.cargando = false;
      this.error = '';
      return;
    }

    this.cargando = true;
    this.error = '';

    this.http
      .get<Eps[]>('http://127.0.0.1:3000/api/tramites/eps')
      .subscribe({
        next: (respuesta) => {
          SeleccionarEps.epsCache = respuesta;
          this.listaEps = respuesta;
          this.cargando = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error cargando EPS:', err);
          this.error = 'No se pudieron cargar las EPS.';
          this.cargando = false;
          this.cdr.markForCheck();
        },
      });
  }

  continuar(): void {
    if (this.epsSeleccionada === null) {
      return;
    }

    if (this.origen === 'pretriage') {
      sessionStorage.setItem(
        'eps_pretriage',
        String(this.epsSeleccionada)
      );

      this.router.navigate(['/tramites/seleccionar-tramite'], {
        queryParams: {
          eps: this.epsSeleccionada,
          origen: 'pretriage',
        },
      });

      return;
    }

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