import { AbstractControl, FormControl, ValidationErrors } from '@angular/forms';
import { Regex } from '../constants/constant';

export const noWhitespaceValidator = (control: FormControl) => {
  const value = control.value ? String(control.value) : '';
  const isWhitespace = value.trim().length === 0;
  return !isWhitespace ? null : { whitespace: true };
};

export const noHtmlValidator = (control: FormControl) => {
  const value = control.value ? String(control.value) : '';
  const hasHTML = Regex.containsHtmlTags.test(value);
  return !hasHTML ? null : { containsHtml: true };
};

export class DvValidators {
  static validations = {
    email:
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    isNumeric: (value) =>
      !isNaN(parseFloat(value)) &&
      isFinite(value) &&
      Regex.numericResponse.test(value),
    isPhone: Regex.validPhoneCharsOnly,
  };

  constructor() {}

  static required(control: FormControl) {
    const value = control.value != null ? String(control.value) : '';
    let valid = true;
    if (value.trim().length === 0) valid = false;
    return valid
      ? null
      : {
          required: true,
        };
  }

  static ValidateUrl(control: AbstractControl, errorMessage = null) {
    if (!control.value.startsWith('https') || !control.value.includes('.io')) {
      return { invalidUrl: true };
    }
    return null;
  }

  static isEmail(
    errorMessage = null,
    isMultipleValues = false,
    separator = ','
  ) {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value?.length) {
        let isInvalid;
        if (!isMultipleValues) {
          isInvalid = !`${control.value}`
            .toLowerCase()
            .match(this.validations.email);
        } else {
          isInvalid = String(control.value)
            .split(separator)
            .some(
              (value) =>
                value?.trim() &&
                !value.trim().toLowerCase().match(this.validations.email)
            );
        }

        if (isInvalid) {
          return {
            message: errorMessage || 'Not a valid email address',
          };
        }
      }
    };
  }

  static isRequired(
    errorMessage = null,
    isMultipleValues = false,
    separator = ','
  ) {
    return (control: AbstractControl): ValidationErrors | null => {
      if (
        (!control.value && control.value !== false && control.value !== 0) || // explicitly check if the value exists and is false or 0
        !String(control.value)?.trim()?.length
      ) {
        return {
          message: errorMessage || 'Value is required',
        };
      } else if (
        isMultipleValues &&
        !String(control.value)
          .split(separator)
          .some((item) => item != null && String(item)?.trim()?.length)
      ) {
        return {
          message: errorMessage || 'Value is required',
        };
      }
    };
  }

  static isNumber(
    errorMessage = null,
    maxLength = 16,
    maxDigitsAfterDecimalPoint = null,
    isMultipleValues = false,
    separator = ','
  ) {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return {
          message: ' Value is required',
        };
      }
      let splitValueByDecimalPoint = control.value
        ? `${control.value}`?.toString()?.split('.') ?? []
        : [];
      if (
        !isMultipleValues &&
        control.value &&
        (!this.validations.isNumeric(control.value) ||
          splitValueByDecimalPoint[0].length > maxLength ||
          (maxDigitsAfterDecimalPoint != null &&
            splitValueByDecimalPoint.length > 1 &&
            splitValueByDecimalPoint[1].length > maxDigitsAfterDecimalPoint))
      ) {
        return {
          message: errorMessage || 'Not a valid number',
        };
      } else if (
        isMultipleValues &&
        control.value &&
        String(control.value)
          .split(separator)
          .some((item) => {
            let splitValueByDecimalPoint = item
              ? `${item}`?.toString()?.split('.') ?? []
              : [];
            return (
              item != null &&
              (!this.validations.isNumeric(String(item).trim()) ||
                splitValueByDecimalPoint[0].length > maxLength ||
                (maxDigitsAfterDecimalPoint != null &&
                  splitValueByDecimalPoint.length > 1 &&
                  splitValueByDecimalPoint[1].length >
                    maxDigitsAfterDecimalPoint))
            );
          })
      ) {
        return {
          message: errorMessage || 'Not a valid number',
        };
      }
    };
  }

  static isPureNumber(errorMessage = null, maxLength = 16) {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = `${control.value}`;
      if (!value) {
        return {
          message: ' Value is required',
        };
      }
      if (
        (!this.validations.isNumeric(value) ||
          value.includes('.') ||
          value.length > maxLength) &&
        value
      ) {
        return {
          message: errorMessage || 'Not a valid integer',
          type: 'isPureNumber',
        };
      }
    };
  }

  static isPhone(
    errorMessage = null,
    isMultipleValues = false,
    separator = ','
  ) {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!isMultipleValues) {
        if (!control?.value?.match(this.validations.isPhone)) {
          return {
            message: errorMessage || 'Phone is not valid',
          };
        }
      } else if (control?.value) {
        let isInvalid;
        isInvalid = String(control.value)
          .split(separator)
          .some(
            (value) =>
              value?.trim() && !value.trim().match(this.validations.isPhone)
          );
        if (isInvalid) {
          return {
            message: errorMessage || 'Phone is not valid',
          };
        }
      }
    };
  }

  static maxLength(maxLength = 50) {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value && control.value.length > maxLength) {
        return {
          message: `Value should not be greater than ${maxLength} characters`,
        };
      }
    };
  }

  static isDecimal(errorMessage = null, allowDecimal = 2) {
    return (control: AbstractControl): ValidationErrors | null => {
      let splitValueByDecimalPoint = control.value
        ? `${control.value}`?.toString()?.split('.') ?? []
        : [];
      if (splitValueByDecimalPoint[1] && splitValueByDecimalPoint[1].length > allowDecimal) {
        return {
          message: errorMessage || 'Not valid number',
          type: 'isDecimal'
        };
      }
      return null;
    };
  }
}
