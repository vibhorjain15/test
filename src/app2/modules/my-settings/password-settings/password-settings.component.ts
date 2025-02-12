import { errorMessageMap } from 'src/app2/shared/constants/constant';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { AuthService } from 'src/app2/services/auth.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { validateAllFormFields } from 'src/app2/utils/validateAllFormFields';
import { SecureStorageService } from 'src/app2/services/secure-storage.service';

@Component({
  selector: 'app-password-settings',
  templateUrl: './password-settings.component.html',
  styleUrls: ['./password-settings.component.css'],
})
export class PasswordSettingsComponent implements OnInit {
  saving: boolean;
  passwordElementType;
  passwordNotVisible;
  passwordNotVisible2;
  passwordNotVisible3;
  passwordElementType2: string;
  passwordElementType3: string;
  changePasswordForm: FormGroup;
  errorMessageMap = errorMessageMap;
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
  validateEquals(control: FormControl) {
    if (
      control.value &&
      control.value !== this.changePasswordForm.get('NewPasswordControl').value
    ) {
      return {
        validateEquals: true,
      };
    }
    return null;
  }

  constructor(
    private readonly http: HttpClient,
    private readonly toaster: ToastrService,
    private readonly AuthService: AuthService,
    private readonly SecureStorageService: SecureStorageService
  ) {}

  ngOnInit(): void {
    this.changePasswordForm = new FormGroup({
      passwordControl: new FormControl('', [Validators.required]),
      NewPasswordControl: new FormControl('', [
        Validators.required,
        this.lengthRange,
        this.uppercaseRequired,
        this.lowercaseRequired,
        this.symbolRequired,
        this.numberRequired,
        this.whiteSpaceNotRequired,
      ]),
      confirmPasswordControl: new FormControl('', [
        Validators.required,
        this.validateEquals.bind(this),
      ]),
    });
    this.passwordElementType = 'password';
    this.passwordElementType2 = 'password';
    this.passwordElementType3 = 'password';
  }

  submit() {
    validateAllFormFields(this.changePasswordForm);
    if (this.changePasswordForm.valid) {
      this.saving = true;
      let oldPassword = this.SecureStorageService.encrypt(
        this.changePasswordForm.value.passwordControl
      );
      let password = this.SecureStorageService.encrypt(
        this.changePasswordForm.value.NewPasswordControl
      );
      this.http
        .put('Account/ChangePassword', {
          password: oldPassword,
          NewPassword: password,
          confirmPassword: password,
        })
        .pipe(
          finalize(() => {
            this.saving = false;
          })
        )
        .subscribe(
          () => {
            this.toaster.success('Your password has been changed!');
            this.AuthService.logout();
          },
          (error) => {
            this.changePasswordForm.patchValue({
              passwordControl: '',
              NewPasswordControl: '',
              confirmPasswordControl: '',
            });
            validateAllFormFields(this.changePasswordForm, false);
          }
        );
    }
  }

  showPasswordToggle() {
    this.passwordNotVisible = !this.passwordNotVisible;
    if (this.passwordElementType === 'password') {
      this.passwordElementType = 'text';
    } else {
      this.passwordElementType = 'password';
    }
  }

  showPasswordToggle2() {
    this.passwordNotVisible2 = !this.passwordNotVisible2;
    if (this.passwordElementType2 === 'password') {
      this.passwordElementType2 = 'text';
    } else {
      this.passwordElementType2 = 'password';
    }
  }

  showPasswordToggle3() {
    this.passwordNotVisible3 = !this.passwordNotVisible3;
    if (this.passwordElementType3 === 'password') {
      this.passwordElementType3 = 'text';
    } else {
      this.passwordElementType3 = 'password';
    }
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

    const passwordVal = this.changePasswordForm.get('NewPasswordControl');
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
}
