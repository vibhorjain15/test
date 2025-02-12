import { Directive } from '@angular/core';
import { CdkStepLabel } from '@angular/cdk/stepper';

@Directive({
  selector: '[dvStepLabel]',
})
export class DvStepLabel extends CdkStepLabel {}
