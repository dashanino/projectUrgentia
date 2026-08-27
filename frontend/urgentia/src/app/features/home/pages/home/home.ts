import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-home',
  imports: [MatIconModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {

  private router = inject(Router);

  goBack() {
    this.router.navigate(['/begin']);
  }

  nuevaEvaluacion() {
    this.router.navigate(['/red-flags/adulto']);
  }

}