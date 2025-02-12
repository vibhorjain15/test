import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { AccountService } from 'src/app2/services/account.service';
import { RouterService } from 'src/app2/services/router.service';
import { SecureStorageService } from 'src/app2/services/secure-storage.service';
import { DvPasswordComponent } from 'src/app2/shared/components/dv-password/dv-password.component';
import { Regex } from 'src/app2/shared/constants/constant';

@Component({
  selector: 'app-activate',
  templateUrl: './activate.component.html',
  styleUrls: ['./activate.component.css'],
})
export class ActivateComponent implements OnInit {
  user: any;
  loading: boolean;
  activateForm: FormGroup;
  alertMessage: any;
  @ViewChild('password') passwordComponent: DvPasswordComponent;
  constructor(
    private readonly router: RouterService,
    private readonly toaster: ToastrService,
    private readonly accountService: AccountService,
    private readonly secureStorageService: SecureStorageService
  ) {}

  ngOnInit(): void {
    this.initData();
  }

  initData() {
    const token = decodeURIComponent(this.router.getState().params.token);
    if (token) {
      const params = { token };
      this.accountService.getUserToActivate(params).subscribe(
        (response: any) => {
          this.user = response;
          this.createForm();
        },
        () => {
          this.handleError();
        }
      );
    } else {
      this.handleError();
    }
  }

  createForm() {
    this.activateForm = new FormGroup({
      userName: new FormControl(this.user.userName, Validators.required),
      firmName: new FormControl(this.user.firm_name, Validators.required),
      firstName: new FormControl(this.user.firstName, [
        Validators.required,
        Validators.pattern(Regex.validPersonNames),
      ]),
      lastName: new FormControl(this.user.lastName, [
        Validators.required,
        Validators.pattern(Regex.validPersonNames),
      ]),
    });
    this.activateForm.get('userName').disable();
    this.activateForm.get('firmName').disable();
  }

  handleError() {
    this.loading = false;
    this.redirectToLogin();
  }

  activateAccount() {
    if (
      !this.user.is_saml_enabled && this.user.is_default
        ? !this.activateForm.valid || !this.passwordComponent?.isPasswordValid()
        : !this.activateForm.valid
    ) {
      this.activateForm.markAllAsTouched();
      this.passwordComponent?.passwordForm?.markAllAsTouched();
      return;
    }
    this.loading = true;
    const formData = this.activateForm.value;
    this.user = { ...this.user, ...formData };
    if (this.passwordComponent) {
      const passwordData: any = this.passwordComponent.getPasswordDetails();
      if (passwordData.password) {
        this.user.password = this.user.confirmPassword =
          this.secureStorageService.encrypt(passwordData.password);
      }
    }
    this.accountService
      .activateUser(this.user)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        () => this.handleActivationSuccess(),
        (err) => this.handleActivationFailure(err)
      );
  }

  handleActivationSuccess() {
    const message =
      'Your account has been successfully activated, Please login using your credentials';
    this.toaster.success(message);
    this.redirectToLogin();
  }

  handleActivationFailure(response) {
    let errorMsg =
      'Something is wrong with your account activation. Please contact us at ask@diligencevault.com';
    if (response.data && response.data.error_description) {
      errorMsg = response.data.error_description;
    }
    this.alertMessage = errorMsg;
  }

  redirectToLogin(): void {
    this.router.navigate('login');
  }
}
