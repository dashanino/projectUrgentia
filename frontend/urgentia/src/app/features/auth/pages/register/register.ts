import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {

  private router = inject(Router);

  // Flecha → volver a begin
  goBack() {
    this.router.navigate(['/begin']);
  }

  // Continuar → ir al login
  continue() {
    this.router.navigate(['/login']);
  }
}