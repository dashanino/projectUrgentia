import { Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-header',
  imports: [MatIcon],
  standalone:true,
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {}
