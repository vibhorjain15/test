import { ChangeDetectorRef, Component, ElementRef, Input } from '@angular/core';
import { CdkStepper } from '@angular/cdk/stepper';
import { Directionality } from '@angular/cdk/bidi';

@Component({
  selector: 'dv-stepper',
  templateUrl: './dv-stepper.component.html',
  providers: [{ provide: CdkStepper, useExisting: DvStepperComponent }],
})
export class DvStepperComponent extends CdkStepper {
  @Input() activeClass = 'active';
  @Input() showBackButton = 'active';
  @Input() widthclass;
  constructor(
    _dir?: Directionality,
    _changeDetectorRef?: ChangeDetectorRef,
    _elementRef?: ElementRef<HTMLElement>
  ) {
    super(_dir, _changeDetectorRef, _elementRef);
  }
  isNextButtonHidden() {
    return !(this.steps.length === this.selectedIndex + 1);
  }
}
