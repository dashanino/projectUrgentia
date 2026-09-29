import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})

export class Header implements OnInit {

  // Inyectar el Router y la ruta activa
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  // Variable para almacenar el título de la página
  pageTitle = signal<string>('Inicio');

  ngOnInit(): void {

    // Obtener el título de la página actual
    this.updatePageTitle();

    // Detectar los cambios de ruta
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd)
      )
      .subscribe(() => {
        this.updatePageTitle();
      });

  }

  // Función para actualizar el título
  private updatePageTitle(): void {

    let route = this.activatedRoute;

    // Buscar la última ruta hija activa
    while (route.firstChild) {
      route = route.firstChild;
    }

    // Obtener el título definido en app.routes.ts
    const title = route.snapshot.data['title'];

    // Actualizar el título
    this.pageTitle.set(title ?? 'Inicio');

  }

}
