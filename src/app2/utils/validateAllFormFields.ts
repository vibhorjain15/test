import { FormControl, FormGroup } from "@angular/forms";

export const validateAllFormFields = (
    formGroup: FormGroup,
    touched: boolean = true
  ) => {
    Object.keys(formGroup.controls).forEach((field) => {
      const control = formGroup.get(field);
      if (control instanceof FormControl) {
        if (touched) control.markAsTouched({ onlySelf: true });
        else control.markAsUntouched({ onlySelf: true });
      }
    });
  };
  