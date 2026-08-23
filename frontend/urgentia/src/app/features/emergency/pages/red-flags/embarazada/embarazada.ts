import { Component,inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-embarazada',
  imports: [MatIconModule],
  templateUrl: './embarazada.html',
  styleUrl: './embarazada.scss',
})
export class Embarazada {
  private router = inject(Router);
  banderaSeleccionada: string | null = null;

  seleccionarBandera(bandera: string) {
    this.banderaSeleccionada = bandera;
  }

  estaSeleccionada(bandera: string): boolean {
    return this.banderaSeleccionada === bandera;
  }
  goBack() {
    this.router.navigate(['/patient-group']);
  }
}