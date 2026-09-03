import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [MatIconModule,RouterLink],
  standalone:true,
  templateUrl: './header.html',
  styleUrl: './header.scss',
})

export class Header {}