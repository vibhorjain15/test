import { AbstractControl, ValidatorFn } from '@angular/forms';

export const uniqueValidator = (arrObj): ValidatorFn => {
  return (control: AbstractControl): { [key: string]: any } | null =>
    !arrObj.includes(control.value) ? null : { notUnique: control.value };
};
