import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { ModalService } from 'src/app2/services/modal.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { RouterService } from 'src/app2/services/router.service';
import { UtilsService } from 'src/app2/services/utils.service';
import {
  Regex,
  errorMessageMap,
  siteKey,
} from 'src/app2/shared/constants/constant';
import { InterpolatePipe } from 'src/app2/shared/pipes/interpolate.pipe';
import { DvPasswordComponent } from 'src/app2/shared/components/dv-password/dv-password.component';
import { SecureStorageService } from 'src/app2/services/secure-storage.service';
import { InboundService } from 'src/app2/modules/inbound-management/inbound.service';
@Component({
  selector: 'app-inbound-signup',
  templateUrl: './inbound-signup.component.html',
  styleUrls: ['./inbound-signup.component.css'],
})
export class InboundSignupComponent implements OnInit {
  signupForm: FormGroup;
  loading = false;
  firms = [];
  showError = false;
  showSpinner = false;
  investorId;
  redirectId;
  logoLink;
  email;
  passwordNotVisible;
  passwordNotVisible2;
  passwordElementType = 'password';
  passwordElementType2 = 'password';
  siteKey = siteKey;
  isCaptchaResolved = false;
  public theme: 'light' | 'dark' = 'light';
  public size: 'compact' | 'normal' = 'normal';
  public lang = 'en';
  public type: 'image' | 'audio';
  duplicateFirms;
  @ViewChild('password') passwordComponent: DvPasswordComponent;
  saving: boolean;
  selectedFirm;
  duplicateFirmsCount = '';
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
    if (control.value && /^[A-z]*$/.test(control.value)) {
      return {
        symbolRequired: true,
      };
    }
    return null;
  }
  validateEquals(control: FormControl) {
    if (
      control.value &&
      control.value !== this.signupForm.get('passwordControl').value
    ) {
      return {
        validateEquals: true,
      };
    }
    return null;
  }

  constructor(
    private readonly interpolatePipe: InterpolatePipe,
    private readonly http: HttpClient,
    private readonly routerService: RouterService,
    private readonly toaster: ToastrService,
    private readonly ModalFactory: ModalService,
    private readonly customModalService: CustomModalService,
    private readonly utilsService: UtilsService,
    private readonly inboundService: InboundService,
    private readonly secureStorageService: SecureStorageService
  ) {}

  ngOnInit(): void {
    this.investorId = +this.routerService.getState().params.investorId;
    this.redirectId = this.routerService.getState().params.redirectId;
    this.email = this.routerService.getState().params.username;
    this.getAllFirms();
    this.getLogo();
    this.signupForm = new FormGroup({
      emailControl: new FormControl(this.email, [
        Validators.required,
        Validators.email,
        Validators.pattern(Regex.validEmailId),
      ]),
      firmControl: new FormControl(null, [Validators.required]),
      firstNameControl: new FormControl('', [
        Validators.required,
        Validators.pattern(/^[A-Za-z]+$/),
      ]),
      lastNameControl: new FormControl('', [
        Validators.required,
        Validators.pattern(/^[A-Za-z]+$/),
      ]),
      verificationCodeControl: new FormControl('', [Validators.required]),
      recaptchaControl: new FormControl('', [Validators.required]),
    });
    if (this.signupForm.value.firstNameControl && this.signupForm.invalid) {
      this.signupForm.get('firstNameControl').markAsTouched();
    }
    if (this.signupForm.value.emailControl && this.signupForm.invalid) {
      this.signupForm.get('emailControl').markAsTouched();
    }
    if (this.signupForm.value.lastNameControl && this.signupForm.invalid) {
      this.signupForm.get('lastNameControl').markAsTouched();
    }
  }

  getLogo() {
    this.inboundService
      .getLogo(this.redirectId)
      .subscribe((res: any) => (this.logoLink = res.logo_link));
  }

  sendVerificationCode() {
    this.inboundService
      .sendVerificationCode(encodeURIComponent(this.email))
      .subscribe(
        (response: any) => {
          const message =
            'We have resent the verification code. Please check your email.';
          this.toaster.success(message, '', { timeOut: 5000 });
        },
        (error: any) => {
          this.toaster.error('Something went wrong. Please try again.');
        }
      );
  }

  goBackToLogin() {
    window.history.back();
  }

  getAllFirms() {
    this.showSpinner = true;
    const params = { email: encodeURI(this.email) };
    this.inboundService
      .getAllFirms(params)
      .pipe(finalize(() => (this.showSpinner = false)))
      .subscribe((response: any) => {
        this.firms = Object.entries(response).map(([key, value]) => ({
          id: value,
          name: key,
        }));
      });
  }

  openDuplicateFirmsModal() {
    const firmInfo: any = {};
    this.customModalService.invoke('view-duplicate-firm', {
      initialState: {
        duplicateFirms: this.duplicateFirms,
        source: 'signup',
        onSuccess: (res) => {
          this.signupForm.controls['firmControl'].setValue(res.name);
          this.signupForm.controls['emailControl'].disable();
          this.signupForm.controls['firmControl'].disable();
          this.selectedFirm = res;
          if (this.selectedFirm) {
            firmInfo.id = this.selectedFirm.id;
            firmInfo.name = this.selectedFirm.name;
          }
          this.firms.push(firmInfo);
          this.customModalService.close();
        },
      },
    });
  }

  submit() {
    if (!this.passwordComponent.isPasswordValid(true)) {
      return;
    }
    if (this.signupForm.invalid) {
      this.showError = true;
      return;
    }
    if (this.signupForm.valid) {
      this.loading = true;
      if (this.signupForm.value.firmControl.id) {
        this.signUp();
      } else {
        this.checkForFirmDuplicates();
      }
    }
  }
  signUp() {
    let firmInfo: any = {};
    if (this.selectedFirm) {
      firmInfo.id = this.selectedFirm.id;
      firmInfo.name = this.selectedFirm.name;
    } else if (this.signupForm.value.firmControl.id) {
      firmInfo = this.signupForm.value.firmControl;
    } else if (
      !this.signupForm.value.firmControl.id &&
      this.signupForm.value.firmControl.name
    ) {
      firmInfo = this.signupForm.value.firmControl;
    } else if (
      !this.signupForm.value.firmControl.id &&
      !this.signupForm.value.firmControl.name &&
      !this.signupForm.value.firmControl.label
    ) {
      firmInfo.name = this.signupForm.value.firmControl;
    } else if (this.signupForm.value.firmControl.label) {
      firmInfo.name = this.signupForm.value.firmControl.label;
    }
    let newPassword = this.secureStorageService.encrypt(
      this.passwordComponent.getPasswordDetails().password
    );
    const param = {
      userName: this.signupForm.getRawValue().emailControl,
      password: newPassword,
      confirmPassword: newPassword,
      firstName: this.signupForm.value.firstNameControl,
      lastName: this.signupForm.value.lastNameControl,
      RecaptchaToken: this.signupForm.value.recaptchaControl,
      SignupVerificationCode: this.signupForm.value.verificationCodeControl,
      firmInfo,
      Referral_data: {
        redirectId: this.redirectId,
      },
    };
    this.loading = true;
    this.inboundService
      .signupInbound(param)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        (res) => {
          this.toaster.success('', 'You account is successfully created.', {
            timeOut: 10000,
          });
          const state_params: any = { redirectId: this.redirectId };
          if (this.redirectId) {
            this.routerService.navigateWithParams('login', state_params);
          }
        },
        (error) => {
          this.loading = false;
          this.saving = false;
        }
      );
  }

  checkForFirmDuplicates() {
    this.inboundService
      .getactivationList({
        params: {
          name: this.signupForm.value.firmControl.name
            ? this.signupForm.value.firmControl.name
            : this.signupForm.value.firmControl.label
            ? this.signupForm.value.firmControl.label
            : this.signupForm.value.firmControl,
        },
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe((response: any) => {
        this.duplicateFirms = response || [];
        this.duplicateFirmsCount = this.utilsService.convertNumber(
          this.duplicateFirms.length
        );
        this.duplicateFirms.forEach((res) => {
          (res.websiteUrl =
            res.website && res.website.startsWith('http')
              ? res.website
              : `https://${res.website}`),
            (res.name = res.name),
            (res.is_tracking = res.is_tracking),
            (res.firm_type = res.firm_type),
            (res.id = res.id),
            (res.website = res.website),
            (res.firm_type_id = res.firm_type_id);
        });
        if (this.duplicateFirms.length == 0) {
          this.signUp();
        } else {
          this.loading = false;
        }
      });
  }

  getErrorMessage(controlName: string, fieldName?: string): string {
    const control = this.signupForm.get(controlName);
    const hasError =
      control &&
      (control?.touched || this.showError) &&
      control?.invalid &&
      control?.errors;
    if (hasError && control.errors.required) {
      return this.interpolatePipe.transform(
        errorMessageMap?.required,
        fieldName
      );
    }
    if (hasError && control.errors.pattern) {
      if (controlName === 'emailControl') {
        return this.interpolatePipe.transform(
          errorMessageMap?.pattern,
          'Please enter a valid email'
        );
      } else {
        return this.interpolatePipe.transform(
          errorMessageMap?.pattern,
          'Please enter a valid name'
        );
      }
    }
    if (hasError && control.errors.lengthRange) {
      return 'Password needs to be between 8 and 16 characters long';
    }
    if (hasError && control.errors.uppercaseRequired) {
      return ' At least one uppercase letter is required';
    }
    if (hasError && control.errors.lowercaseRequired) {
      return 'At least one lowercase letter is required';
    }
    if (hasError && control.errors.symbolRequired) {
      return 'At least one number and/or symbol is required';
    }
    if (hasError && control.errors.validateEquals) {
      return 'Passwords do not match';
    }
    return '';
  }

  saveNewFirm() {
    if (
      this.signupForm.valid &&
      this.signupForm.get('recaptchaControl').value
    ) {
      this.signUp();
    }
  }

  resolved(captchaResponse: string) {
    this.isCaptchaResolved = true;
  }
}
