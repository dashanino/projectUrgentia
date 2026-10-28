import { Component, Input } from '@angular/core';

export interface PretriageStep {
  id: string;
  label: string;
  visible: boolean;
}

@Component({
  selector: 'app-pretriage-stepper',
  standalone: true,
  templateUrl: './pretriage-stepper.html',
  styleUrl: './pretriage-stepper.scss',
})
export class PretriageStepper {
  @Input() currentStep = '';

  @Input() steps: PretriageStep[] = [];

  get visibleSteps(): PretriageStep[] {
    return this.steps.filter((step) => step.visible);
  }

  getStepNumber(stepId: string): number {
    const step = this.visibleSteps.find((item) => item.id === stepId);

    if (stepId === 'red-flags') return 3.1;
    if (stepId === 'informacion-adicional') return 3.2;
    if (stepId === 'resultado') return 4;

    return this.visibleSteps.findIndex((item) => item.id === step?.id) + 1;
  }
}
