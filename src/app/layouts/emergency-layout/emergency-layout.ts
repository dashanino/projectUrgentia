import { Component } from '@angular/core';
import { Header } from '../../shared/components/header/header';
import { RouterOutlet, Router } from '@angular/router';
import { Footer } from '../../shared/components/footer/footer';

import {
  PretriageStepper,
  PretriageStep,
} from '../../shared/components/pretriage-stepper/pretriage-stepper';

@Component({
  selector: 'app-emergency-layout',
  imports: [Header, Footer, PretriageStepper, RouterOutlet],
  templateUrl: './emergency-layout.html',
  styleUrl: './emergency-layout.scss',
})
export class EmergencyLayout {
  steps: PretriageStep[] = [
    {
      id: 'antecedentes',
      label: 'Antecedentes',
      visible: true,
    },
    {
      id: 'tipo-paciente',
      label: 'Tipo de paciente',
      visible: true,
    },
    {
      id: 'red-flags',
      label: 'Síntomas y signos de alarma',
      visible: true,
    },
    {
      id: 'informacion-adicional',
      label: 'Preguntas adicionales',
      visible: true,
    },
    {
      id: 'informacion-adicional',
      label: 'Información adicional',
      visible: false,
    },
    {
      id: 'eps',
      label: 'EPS',
      visible: false,
    },
    {
      id: 'resultado',
      label: 'Resultado',
      visible: true,
    },
  ];

  currentStep = '';

  constructor(private router: Router) {
    this.router.events.subscribe(() => {
      this.actualizarPaso();
    });

    this.actualizarPaso();
  }

  private actualizarPaso(): void {
    const url = this.router.url;

    if (url.includes('antecedentes')) {
      this.currentStep = 'antecedentes';
    } else if (url.includes('patient-group')) {
      this.currentStep = 'tipo-paciente';
    } else if (url.includes('red-flags')) {
      this.currentStep = 'red-flags';
    } else if (url.includes('sintomas')) {
      this.currentStep = 'red-flags';
    } else if (url.includes('sub-banderas')) {
      this.currentStep = 'informacion-adicional';
    } else if (url.includes('eps')) {
      this.currentStep = 'eps';
    } else if (url.includes('result')) {
      this.currentStep = 'resultado';
    }
  }
}
