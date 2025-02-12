import { Component, OnInit, ViewChild } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { AccountService } from 'src/app2/services/account.service';
import { RouterService } from 'src/app2/services/router.service';
import { SecureStorageService } from 'src/app2/services/secure-storage.service';
import { DvPasswordComponent } from 'src/app2/shared/components/dv-password/dv-password.component';

@Component({
  selector: 'reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
})
export class ResetPasswordComponent implements OnInit {
  email: string;
  token: string;
  verifyingToken: boolean;
  invalidToken: boolean;
  loading: boolean;
  @ViewChild('password') passwordComponent: DvPasswordComponent;
  constructor(
    private readonly router: RouterService,
    private readonly accountService: AccountService,
    private readonly toaster: ToastrService,
    private readonly secureStorageService: SecureStorageService
  ) {}

  ngOnInit(): void {
    this.email = this.router.getState().params.email_id;
    this.token = this.router.getState().params.token;
    this.verifyToken();
  }

  verifyToken() {
    this.verifyingToken = true;
    const params = {
      email_id: this.email,
      token: this.token,
    };
    this.accountService
      .verifyResetPasswordToken(params)
      .pipe(finalize(() => (this.verifyingToken = false)))
      .subscribe(
        () => (this.invalidToken = false),
        (error) => (this.invalidToken = error.status === 401)
      );
  }

  resetPassword() {
    if (this.passwordComponent && !this.passwordComponent.isPasswordValid()) {
      return;
    }
    this.loading = true;
    const payload = {
      email_id: this.email,
      token: this.token,
      password: this.secureStorageService.encrypt(
        this.passwordComponent.getPasswordDetails().password
      ),
    };
    this.accountService
      .resetPassword(payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        () => this.handleSuccess(),
        (err) => this.handleFailure(err)
      );
  }

  handleFailure(error: any): void {
    this.invalidToken = error.status === 401;
    this.passwordComponent.resetForm();
  }

  handleSuccess(): void {
    this.toaster.success('Your password has been reset successfully!');
    this.router.navigate('login');
  }

  redirectToForgetPasswordPage() {
    this.router.navigateWithParams('begin_password_reset', {
      userName: this.email,
    });
  }
}
