import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-header',
  imports: [MatIconModule],
  standalone:true,
  templateUrl: './header.html',
  styleUrl: './header.scss',
})

export class Header {}