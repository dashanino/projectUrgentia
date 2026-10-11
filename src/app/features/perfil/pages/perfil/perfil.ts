import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-perfil',
  imports: [MatIconModule],
  standalone:true,
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class Perfil {
  private router = inject(Router);

  nuevaEvaluacion() {
    this.router.navigate(['emergency/red-flags/adulto']);
  }

  goBack(){
    this.router.navigate(['/app/home'])
  }
   
  
  
}
