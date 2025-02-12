import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, Validators } from '@angular/forms';
import { finalize, take } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { RouterService } from 'src/app2/services/router.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { UserState } from 'src/app2/store/user/user.state';
import { Select, Store } from '@ngxs/store';
import {
  UpdateCurrentUser,
} from 'src/app2/store/user/user.action';
import { UtilsService } from 'src/app2/services/utils.service';

@Component({
  selector: 'app-tfa-setup',
  templateUrl: './tfa-setup.component.html',
  styleUrls: ['./tfa-setup.component.css'],
})
export class TfaSetupComponent implements OnInit {
  qr_code_url: string;
  private currentUser;
  validating = false;
  codeController: FormControl = null;
  @Select(UserState.getCurrentUserData) user$;

  constructor(
    private readonly http: HttpClient,
    private readonly routerService: RouterService,
    private readonly toastr: ToastrService,
    private readonly sweetAlertService: SweetAlertService,
    private readonly store: Store,
    private readonly util: UtilsService
  ) {}

  ngOnInit(): void {
    this.user$
      .pipe(
        take(1),
      )
      .subscribe((user) => {
        if (user) {
          this.currentUser = JSON.parse(JSON.stringify(user));
          this.qr_code_url = `https://quickchart.io/chart?chs=260x260&chld=M|0&cht=qr&chl=otpauth://totp/${this.currentUser.userName}?secret=${this.currentUser.psk}&&issuer=DiligenceVault`;
        }
      });
    this.codeController = new FormControl('', [
      Validators.required,
      Validators.minLength(6),
      Validators.maxLength(6),
      Validators.pattern(/^[0-9]{6}$/), //for numbers
    ]);
  }

  displayPskCodeDialog() {
    this.sweetAlertService.info({
      title: 'Your two-factor secret',
      text: this.currentUser.psk,
      confirmButtonText: 'Okay',
    });
  }

  validateCode() {
    this.codeController.markAsTouched({ onlySelf: true });
    if (this.codeController.valid) {
      this.validating = true;
      this.http
        .post(`two_factor_authentication/configure`, {
          code: this.codeController.value,
        })
        .pipe(
          finalize(() => {
            this.validating = false;
          })
        )
        .subscribe(
          () => {
            this.currentUser.twoFactorEnabled = true;
            this.store.dispatch(new UpdateCurrentUser(this.currentUser));
            this.toastr.success(
              'Two factor authentication is successfully enabled'
            );
            this.routerService.navigate(
              'app.settings.security.two_factor_authentication.status'
            );
          },
          (error) => {
            this.toastr.error(error?.error);
          }
        );
    }
  }

  errorHandler() {
    let { value } = this.codeController;
    value = `${value}`;
    const isValid = value.match(/^[0-9]{6}$/);
    if (!value) {
      return 'Code is required';
    } else if (!this.util.isNumeric(value)) {
      return 'Code must be a number';
    } else if (value.length < 6 && !isValid) {
      return 'Code is too short. Minimum 6 characters required';
    } else if (value.length > 6 && !isValid) {
      return 'Code is too long. Maximum 6 characters allowed';
    }
    return '';
  }

  navigateToIntro(): void {
    this.routerService.navigate(
      'app.settings.security.two_factor_authentication.intro'
    );
  }
}
