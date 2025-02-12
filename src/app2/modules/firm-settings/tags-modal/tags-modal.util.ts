import { FormControl, FormGroup } from '@angular/forms';

export const validateAllFormFields = (
  formGroup: FormGroup,
  touched: boolean = true
) => {
  Object.keys(formGroup.controls).forEach((field) => {
    const control = formGroup.get(field);
    if (
      !['hasMultiple', 'isMandatory', 'hasUrl'].includes(field) &&
      control instanceof FormControl
    ) {
      if (touched) control.markAsTouched({ onlySelf: true });
      else control.markAsUntouched({ onlySelf: true });
    }
  });
};

export const filterResponseTypes = (typeOptions, tagType) => {
  let response_types_to_allow: string[];
  switch (tagType) {
    case 'int':
      response_types_to_allow = ['int', 'numeric', 'text'];
      break;
    case 'numeric':
      response_types_to_allow = ['numeric', 'text'];
      break;
    case 'dropdown':
      response_types_to_allow = ['dropdown', 'checkbox'];
      break;
    case 'text':
      response_types_to_allow = ['text', 'textmultiline'];
      break;
    default:
      response_types_to_allow = [tagType];
  }
  return typeOptions.filter((val) => response_types_to_allow.includes(val.id));
};
