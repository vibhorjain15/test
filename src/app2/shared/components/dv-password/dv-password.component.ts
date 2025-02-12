import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { errorMessageMap } from '../../constants/constant';

@Component({
  selector: 'dv-password',
  templateUrl: './dv-password.component.html',
  styleUrls: ['./dv-password.component.css'],
})
export class DvPasswordComponent implements OnInit {
  @Input() label: string = 'Choose a Password';
  @Input() confirmPasswordLabel: string = 'Confirm Password';
  @Input() placeholder: string = 'Password';
  @Input() confirmPasswordPlaceholder: string = 'Password Confirmation';
  @Input() labelPosition: string = 'top';
  @Input() elementCol: number = 12;
  @Input() keepSpacing: boolean = false;
  @Input() twoColumnLayout: boolean = false;
  @Output() onSubmit = new EventEmitter();
  errorMessageMap = errorMessageMap;
  passwordNotVisible: boolean = true;
  passwordElementType: string = 'password';
  confirmPasswordNotVisible: boolean = true;
  confirmPasswordElementType: string = 'password';
  passwordForm: FormGroup;
  constructor() {}

  ngOnInit(): void {
    this.passwordForm = new FormGroup({
      password: new FormControl('', [
        Validators.required,
        this.lengthRange,
        this.uppercaseRequired,
        this.lowercaseRequired,
        this.symbolRequired,
        this.numberRequired,
        this.whiteSpaceNotRequired,
      ]),
      confirmPassword: new FormControl('', [
        Validators.required,
        this.validateEqual.bind(this),
      ]),
    });
    this.detectPasswordChange();
  }

  detectPasswordChange() {
    this.passwordForm.get('password').valueChanges.subscribe(() => {
      this.passwordForm
        .get('confirmPassword')
        .setValidators([Validators.required, this.validateEqual.bind(this)]);
      this.passwordForm.get('confirmPassword').updateValueAndValidity();
    });
  }

  lengthRange(control: FormControl) {
    if (
      control.value &&
      !(control.value.length >= 8 && control.value.length <= 16)
    ) {
      return {
        lengthRange: true,
      };
    }
    return null;
  }

  uppercaseRequired(control: FormControl) {
    if (control.value && !/[A-Z]/.test(control.value)) {
      return {
        uppercaseRequired: true,
      };
    }
    return null;
  }

  lowercaseRequired(control: FormControl) {
    if (control.value && !/[a-z]/.test(control.value)) {
      return {
        lowercaseRequired: true,
      };
    }
    return null;
  }

  symbolRequired(control: FormControl) {
    if (
      control.value &&
      !/[!"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~]/.test(control.value)
    ) {
      return {
        symbolRequired: true,
      };
    }
    return null;
  }

  numberRequired(control: FormControl) {
    if (control.value && !/[0-9]/.test(control.value)) {
      return {
        numberRequired: true,
      };
    }
    return null;
  }
  whiteSpaceNotRequired(control: FormControl) {
    if (control.value && /\s/.test(control.value)) {
      return {
        whiteSpaceNotRequired: true,
      };
    }
    return null;
  }

  validateEqual(control: FormControl) {
    if (
      control.value &&
      control.value !== this.passwordForm.get('password').value
    ) {
      return {
        validateEqual: true,
      };
    }
    return null;
  }

  showPasswordToggle() {
    this.passwordNotVisible = !this.passwordNotVisible;
    this.passwordElementType =
      this.passwordElementType === 'password' ? 'text' : 'password';
  }

  showConfirmPasswordToggle() {
    this.confirmPasswordNotVisible = !this.confirmPasswordNotVisible;
    this.confirmPasswordElementType =
      this.confirmPasswordElementType === 'password' ? 'text' : 'password';
  }

  isPasswordValid(markAsTouched: boolean = false) {
    if (!this.passwordForm.valid && markAsTouched) {
      this.passwordForm.markAllAsTouched();
    }
    return this.passwordForm.valid;
  }

  getPasswordDetails() {
    return this.passwordForm.value;
  }

  resetForm() {
    this.passwordForm.reset();
  }

  handleError() {
    const obj = {
      islength: true,
      isUpperCase: true,
      isLowerCase: true,
      isSpecialChar: true,
      isNumber: true,
      hasWhiteSpace: true,
    };

    const passwordVal = this.passwordForm.get('password');
    if (passwordVal.value) {
      obj.isLowerCase = passwordVal.errors?.lowercaseRequired ?? false;
      obj.isUpperCase = passwordVal.errors?.uppercaseRequired ?? false;
      obj.islength = passwordVal.errors?.lengthRange ?? false;
      obj.isSpecialChar = passwordVal.errors?.symbolRequired ?? false;
      obj.isNumber = passwordVal.errors?.numberRequired ?? false;
      obj.hasWhiteSpace = passwordVal.errors?.whiteSpaceNotRequired ?? false;
    }
    return obj;
  }

  handleSubmit(){
    this.onSubmit.emit();
  }
}
