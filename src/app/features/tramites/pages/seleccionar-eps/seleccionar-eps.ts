import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
  private http = inject(HttpClient);

  epsSeleccionada: number | null = null;
  listaEps: Eps[] = [];

  cargando = false;
  error = '';

  ngOnInit(): void {
    this.cargarEps();
  }

  cargarEps(): void {
    this.cargando = true;
    this.error = '';

    this.http.get<Eps[]>(
      'http://127.0.0.1:5001/api/tramites/eps'
    ).subscribe({
      next: (respuesta) => {
        this.listaEps = respuesta;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando EPS:', err);
        this.error = 'No se pudieron cargar las EPS.';
        this.cargando = false;
      }
    });
  }

  continuar(): void {
    if (this.epsSeleccionada === null) {
      return;
    }

    this.router.navigate(
      ['/tramites/seleccionar-tramite'],
      {
        queryParams: {
          eps: this.epsSeleccionada
        }
      }
    );
  }

  volver(): void {
    this.router.navigate(['/begin']);
  }
}

