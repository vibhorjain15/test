import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { AccountService } from 'src/app2/services/account.service';
import { RouterService } from 'src/app2/services/router.service';
import { SITE_KEY } from 'src/app2/shared/constants/constant';

@Component({
  selector: 'forget-password',
  templateUrl: './forget-password.component.html',
  styleUrls: ['./forget-password.component.css'],
})
export class ForgetPasswordComponent implements OnInit {
  alertMessage: string[];
  messageShown: boolean;
  type: string;
  userName: string;
  loading: boolean;
  captchaResponse: any;
  emailForm: FormGroup;
  email: string;
  siteKey: string = SITE_KEY;
  showCaptchaError: boolean;
  isInstructionsVisible: boolean = false;

  constructor(
    private readonly router: RouterService,
    private readonly accountService: AccountService,
    private readonly toaster: ToastrService
  ) {}

  ngOnInit(): void {
    this.userName = this.router.getState().params.userName;
    this.emailForm = new FormGroup({
      userName: new FormControl(this.userName ?? '', [
        Validators.required,
        Validators.email,
      ]),
    });
  }

  showMessage(type: string, message: string) {
    this.alertMessage = message.split('. ');
    this.messageShown = true;
    this.type = type;
  }

  submit() {
    if (!this.emailForm.valid || !this.captchaResponse) {
      this.emailForm.markAllAsTouched();
      this.showCaptchaError = true;
      return;
    }
    this.email = this.emailForm.value.userName;
    this.loading = true;
    this.messageShown = false;
    const params = { EmailID: this.email };
    this.accountService.verifyUserName(params).subscribe(
      () => this.resetPasswordRequest(),
      (error) => this.handleVerificationError(error)
    );
  }

  resetPasswordRequest() {
    const payload = {
      EmailID: this.email,
      recaptchaToken: this.captchaResponse,
    };
    this.accountService
      .resetPasswordRequest(payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        () => this.handleSuccess(),
        (error) => this.handleResetPasswordRequestError(error)
      );
  }

  handleVerificationError(error) {
    if (error.status === 404) {
      this.showMessage(
        'alert alert-custom-danger',
        "Username doesn't exist in our database. If you have received a forward from a colleague, please email ask@diligencevault.com to create your account"
      );
    } else if (error.status === 400) {
      let message = `Your account needs activation. We have resent activation link to ${this.email}. Please activate your account and login.`;
      if (error.error && error.error.error_description) {
        message = error.error.error_description;
      }
      this.showMessage('alert alert-custom-danger', message);
    }
    this.loading = false;
  }

  handleSuccess(): void {
    this.isInstructionsVisible = true;
  }

  navigateToLogin(): void {
    this.router.navigate('login');
  }

  handleResetPasswordRequestError(error) {
    if (error.error && error.error.error_description) {
      const message = error.error.error_description;
      this.showMessage('alert alert-custom-danger', message);
    }
  }
  goBackToEnterEmail() {
    this.router.navigate('login');
  }
  captchaResolved(captchaResponse: string) {
    this.captchaResponse = captchaResponse;
    this.showCaptchaError = false;
  }
}
