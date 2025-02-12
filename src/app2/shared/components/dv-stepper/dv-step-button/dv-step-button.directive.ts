import { CdkStepperNext, CdkStepperPrevious } from '@angular/cdk/stepper';
import { Directive } from '@angular/core';

/** Button that moves to the next step in a stepper workflow. */
@Directive({
  selector: 'button[dvStepNext]',
  host: {
    class: 'dv-stepper-next',
    '[type]': 'type',
  },
  inputs: ['type'],
})
export class DvStepButonNext extends CdkStepperNext {}

/** Button that moves to the previous step in a stepper workflow. */
@Directive({
  selector: 'button[dvStepPrevious]',
  host: {
    class: 'dv-stepper-previous',
    '[type]': 'type',
  },
  inputs: ['type'],
})
export class DvStepButonPrevious extends CdkStepperPrevious {}
