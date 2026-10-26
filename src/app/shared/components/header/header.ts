import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router} from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [MatIconModule],
  standalone:true,
  templateUrl: './header.html',
  styleUrl: './header.scss',
})

export class Header {
  private router = inject(Router);

  showProfileMenu = false;

  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
  }

  logout(){
    sessionStorage.removeItem('isLoggedIn');
    this.router.navigate(['/login']);
  }
  

}