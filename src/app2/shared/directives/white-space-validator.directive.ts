import { Directive } from '@angular/core';
import {
  AbstractControl,
  NG_VALIDATORS,
  ValidationErrors,
  Validator,
} from '@angular/forms';
@Directive({
  selector: '[whiteSpaceValidator]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: WhiteSpaceValidatorDirective,
      multi: true,
    },
  ],
})
export class WhiteSpaceValidatorDirective implements Validator {
  validate(control: AbstractControl): ValidationErrors | null {
    const value: string = control.value;

    if (value && value.trim().length === 0) {
      return { whiteSpace: true };
    }

    return null;
  }
}
