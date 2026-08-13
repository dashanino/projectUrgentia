import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-begin',
  imports: [],
  templateUrl: './index.html',
  styleUrl: './begin.scss',
})
export class Begin {

  private router = inject(Router);

  irEmergencia() {
    this.router.navigate(['/emergency']);
  }

  irLogin() {
    this.router.navigate(['/login']);
  }

  irRegistro() {
    this.router.navigate(['/registro']);
  }
}