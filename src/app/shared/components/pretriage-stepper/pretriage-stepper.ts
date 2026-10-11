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
  styleUrl: './pretriage-stepper.scss'
})
export class PretriageStepper {

  @Input() currentStep = '';

  @Input() steps: PretriageStep[] = [];

  get visibleSteps(): PretriageStep[] {
    return this.steps.filter(step => step.visible);
  }

  getStepNumber(stepId: string): number {
    return this.visibleSteps.findIndex(
      step => step.id === stepId
    ) + 1;
  }
}