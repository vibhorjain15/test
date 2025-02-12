import { Directive, Input } from '@angular/core';
import { NG_VALIDATORS, Validator, AbstractControl } from '@angular/forms';
import { Regex } from '../constants/constant';

@Directive({
  selector: '[dvHtmlTagValidator]',
  providers: [{ provide: NG_VALIDATORS, useExisting: DvHtmlValidatorDirective, multi: true }]
})
export class DvHtmlValidatorDirective implements Validator {
  @Input() appHtmlTagValidator: string;
  validate(control: AbstractControl): { [key: string]: any } | null {
    const hasHTML =  Regex.containsHtmlTags.test(control.value);
    return !hasHTML ? null : { containsHtml: true };
  }
}
