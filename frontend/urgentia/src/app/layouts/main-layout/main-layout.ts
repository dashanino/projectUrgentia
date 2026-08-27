import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Header } from '../../components/header/header';
import { Sidebar } from '../../components/sidebar/sidebar';
import { Footer } from '../../components/footer/footer';

@Component({
  selector: 'app-main-layout',
  imports: [
    Header,
    Sidebar,
    Footer,
    RouterOutlet
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout {}
