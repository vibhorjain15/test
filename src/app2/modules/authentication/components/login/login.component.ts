import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Select, Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { finalize, take, tap } from 'rxjs/operators';
import { AccountService } from 'src/app2/services/account.service';
import { AuthService } from 'src/app2/services/auth.service';
import { HomePageService } from 'src/app2/services/home-page.service';
import { ResetStoreService } from 'src/app2/services/reset-store.service';
import { RouterService } from 'src/app2/services/router.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { authSettings } from 'src/app2/shared/constants/constant';
import { GetCurrentUser, GetSubscriptionLimit, GetUserNotification } from 'src/app2/store/user/user.action';
import { UserState } from 'src/app2/store/user/user.state';
import * as $ from 'jquery';
import { SecureStorageService } from 'src/app2/services/secure-storage.service';
import { ErrorHandlerService } from 'src/app2/services/error-handler.service';
import { DeviceService } from 'src/app2/services/device-type.service';
import { NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  email: string;
  isInboundRequest: boolean;
  inboundLogo: boolean;
  redirectToState: string;
  samlLoginErrorMsg: string;
  saml_token: string;
  isSamlLogin: boolean;
  firm_id: number;
  showLoginWithPass: boolean;
  redirectToParams: string;
  redirectToFragment: string;
  alertMessage: string[];
  messageShown: boolean;
  loading: boolean;
  showAccountCreationButton: boolean;
  redirectId: string;
  showFirmSelection: boolean;
  showNudges: boolean;
  otp_mode: boolean;
  requestAccess: boolean;
  passwordNotVisible: boolean = true;
  passwordElementType: string = 'password';
  @Select(UserState.getCurrentUserData) user;
  current_user: any;
  selectedNudge: any;
  user_firms: any;
  loggedInTokenDetails: any;
  userFilter: any;
  selectedFirm: any;
  settingUpFirm: boolean;
  banner: any;
  toasterMessage: string;
  toasterVisible: boolean;
  remainingTime: number = 5;
  showButton: boolean = false;
  subscription: Subscription;
  constructor(
    private readonly router: RouterService,
    private readonly accountService: AccountService,
    private readonly toaster: ToastrService,
    private readonly authService: AuthService,
    private readonly resetStoreService: ResetStoreService,
    private readonly store: Store,
    private readonly homePageService: HomePageService,
    private readonly utils: UtilsService,
    private readonly secureStorageService: SecureStorageService,
    private readonly errorHandler: ErrorHandlerService,
    public readonly DeviceService: DeviceService
  ) {}

  ngOnInit(): void {
    this.getBannerDetail();
    this.createForm();
    this.initData();
    this.userFilter = {
      All: 'All',
      Inactive: 'Deleted',
      Invited: 'Invited',
      Locked: 'Locked',
      Pending: 'PendingApproval',
      Active: 'Active',
    };

    this.subscription = this.router
      .getRouterInstance()
      .events.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.initData();
        }
      });
  }

  getBannerDetail() {
    this.accountService.getLoginBannerDetail().subscribe((response) => {
      this.banner = response;
    });
  }

  createForm() {
    this.loginForm = new FormGroup({
      userName: new FormControl(null, [Validators.required, Validators.email]),
    });
  }

  initData() {
    const routeParams = this.router.getState().params;
    this.redirectId = routeParams.redirectId ?? '';
    this.redirectToFragment = routeParams.redirectToFragment;
    if (this.redirectId) {
      this.isInboundRequest = true;
      const params = {
        redirect_id: this.redirectId,
      };
      this.accountService
        .getInboundConfig(params)
        .subscribe((response: any) => {
          this.inboundLogo = response.logo_link;
        });
    }
    this.redirectToState = routeParams.redirectToState ?? '';
    if (routeParams.redirectToParams) {
      this.redirectToParams = JSON.parse(routeParams.redirectToParams);
    }
    if (routeParams.error_message) {
      this.showMessage(routeParams.error_message);
    }

    this.email = routeParams.email;
    this.saml_token = routeParams.token;
    this.firm_id = routeParams.firm_id ?? null;
    if (this.email && this.saml_token) {
      this.isSamlLogin = true;
      this.showLoginWithPass = true;
      this.loginForm.get('userName').setValue(this.email);
      this.loginForm.get('userName').disable();
      this.login();
    }
  }

  navigateToReleaseNotes(url: string) {
    if (this.router.isExternalUrl(url)) {
      // Don't update redirect details if it is external url
      // instead, open it in new tab
      this.router.navigateToExternalLink(url);
    } else {
      this.loginForm.markAllAsTouched();
      this.showToaster(
        '<b>Please Login</b> to gain full access to this information.'
      );

      // Update redirect details to the banner url
      const relativeUrl = this.router.getRelativeURL(url);
      const stateDetails = this.router.getUrlAndQueryParams(relativeUrl);

      this.redirectId = stateDetails.queryParams.redirectId ?? '';
      this.redirectToParams = stateDetails.queryParams.redirectToParams ?? '';
      this.redirectToState = `/${stateDetails.url}`;
      this.redirectToFragment = stateDetails.fragment;

      // Update the redirect state in url as well.
      this.router.navigateWithParams('/login', {
        redirectId: this.redirectId,
        redirectToParams: JSON.stringify(this.redirectToParams),
        redirectToState: this.redirectToState,
        redirectToFragment: this.redirectToFragment,
      });
    }
  }
  showToaster(message: string) {
    this.toasterMessage = message;
    this.toasterVisible = true;
    this.remainingTime = 5;
    this.startTimer();
  }
  startTimer() {
    const timer = setInterval(() => {
      if (this.remainingTime > 0) {
        this.remainingTime--;
      } else {
        clearInterval(timer);
        this.closeToaster();
      }
    }, 1000); // Update timer every second
  }
  closeToaster() {
    this.toasterVisible = false;
  }
  checkSamlConnection() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    const params: any = {
      email: this.loginForm.value.userName,
    };
    if (this.redirectToState) {
      params.redirectToState = this.redirectToState;
    }
    if (this.redirectToParams) {
      params.redirectToParams = JSON.stringify(this.redirectToParams);
    }

    if (this.router.getState().params.redirectId) {
      params.redirectId = this.router.getState().params.redirectId;
    }

    this.accountService
      .login(params)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        (response: any) => {
          this.hideMessage();
          if (response.saml_enabled === false) {
            this.showLoginWithPass = true;
            this.loginForm.get('userName').disable();
            this.loginForm.addControl(
              'password',
              new FormControl('', Validators.required)
            );
          } else {
            this.toaster.info('Please wait..');
            const { url } = response;
            if (url) {
              window.open(url, '_self');
            }
          }
          this.showAccountCreationButton = false;
        },
        (error: any) => {
          if (error.error) {
            if (
              error.error.error_code === 'NOT_FOUND' &&
              this.isInboundRequest
            ) {
              this.sendVerificationCode();
            } else if (error.error.error_description) {
              this.showMessage(error.error.error_description);
            }
          }
        }
      );
  }

  sendVerificationCode() {
    const params = {
      email: this.loginForm.value.userName,
    };
    this.accountService.generateSignupCode(params).subscribe(() => {
      this.router.navigateWithParams('signup', {
        redirectId: this.redirectId,
        username: this.loginForm.value.userName,
      });
    });
  }

  login() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    const params: any = {
      userName: this.loginForm.getRawValue().userName,
      ...authSettings,
    };
    if (this.showLoginWithPass) {
      params.password = this.loginForm.value.password
        ? this.secureStorageService.encrypt(this.loginForm.value.password)
        : null;
      params.grant_type = 'password';
      params.is_encrypted = true;
    }
    if (this.firm_id) {
      params.firm_id = this.firm_id;
      params.jwt = localStorage.getItem('jwt');
    }
    if (this.isSamlLogin) {
      params.saml_token = this.saml_token;
    }
    if (this.otp_mode) {
      params.otp_code = this.loginForm.value.otp_code;
    }
    this.hideMessage();
    this.authService
      .loginNew(params,true)
      .then((response) => this.handleLoginSuccess(response))
      .catch((error) => this.handleLoginFailure(error));
  }

  handleLoginSuccess(response, firmChange: boolean = false) {
    this.hideMessage();
    this.resetStoreService.ResetStoreData();
    this.store
        .dispatch([
          new GetCurrentUser(),
          new GetSubscriptionLimit(),
          new GetUserNotification(),
        ])
      .subscribe(
        (userData) => {
          if (userData) {
            let { currentUser } = userData[0].user;
            this.current_user = currentUser;
            this.loading = false;
            this.settingUpFirm = false;
            if (firmChange) {
              if (!this.current_user.isFirstLogin) {
                this.getNudge();
              } else {
                this.goToRequiredState();
              }
            } else {
              if (this.firm_id) {
                this.getNudge();
              } else {
                this.checkUserFirmAssociation(this.current_user, response);
              }
            }
          }
        },
        (error: any) => {
          this.loading = false;
          this.settingUpFirm = false;
        }
      );
  }

  private logToSentry(
    error,
    meta = null,
    fingerprint = null,
    logToConsole = false
  ) {
    try {
      this.errorHandler?.handleError(error, meta, fingerprint, logToConsole);
    } catch (err) {}
  }

  handleLoginFailure(response) {
    this.loading = false;
    const otp_required = response.headers.get('X-OTP');
    if (response.status === 401 && otp_required) {
      this.otp_mode = true;
      this.loginForm.addControl(
        'otp_code',
        new FormControl(null, Validators.required)
      );
      this.loginForm.get('password')?.setValidators([]);
      this.loginForm.get('password')?.markAsUntouched();
    } else if (response.status === 400) {
      if (!this.otp_mode) {
        this.loginForm.get('password')?.patchValue(null);
        this.loginForm.get('password')?.markAsUntouched();
      }
      this.requestAccess = true;
      if (this.isSamlLogin) {
        this.showLoginWithPass = false;
        this.loginForm.get('userName').enable();
        this.goBackToEnterEmail();
      }
      this.showMessage(response.error.error_description);
    } else if (response.status === -1) {
      this.showMessage(
        'Your internal policies are blocking access to DiligenceVault. Please contact your IT team to whitelist *.diligencevault.com domain. If there are further activation issues, please contact us at ask@diligencevault.com.'
      );
    }
  }

  getNudge() {
    this.accountService.getNudges().subscribe(
      (response: any) => {
        if (response?.length) {
          this.selectedNudge = response[0];
          this.logNudge({ id: this.selectedNudge.id });
        }
        this.showNudges = true;
        setTimeout(() => {
          this.goToRequiredState();
        }, 3000);
      },
      (error: any) => {
        this.showNudges = false;
        this.goToRequiredState();
      }
    );
  }

  logNudge(payload) {
    this.accountService.logNudge(payload).subscribe();
  }

  checkUserFirmAssociation(user, token_details) {
    this.accountService.getAssociatedFirms(user.id).subscribe(
      (response: any) => {
        const sorted_firms = response.sort((a, b) => {
          if (a.firm_id === user.firmInfo.id) {
            return -1;
          } else if (b.firm_id === user.firmInfo.id) {
            return 1;
          } else {
            return a.firm_name.toLowerCase() < b.firm_name.toLowerCase()
              ? -1
              : a.firm_name.toLowerCase() > b.firm_name.toLowerCase()
              ? 1
              : 0;
          }
        });
        this.user_firms = sorted_firms;
        if (this.user_firms.length > 1) {
          this.showFirmSelection = true;
          this.loading = false;
          this.loggedInTokenDetails = token_details;
          this.user_firms.map((firm) => this.getRandomColor(firm));
        } else {
          this.loading = false;
          if (!user.isFirstLogin) {
            this.getNudge();
          } else {
            this.goToRequiredState();
          }
        }
      },
      (error: any) => {
        this.loading = false;
        if (!user.isFirstLogin) {
          this.getNudge();
        } else {
          this.goToRequiredState();
        }
      }
    );
  }

  goToRequiredState() {
    if (this.redirectId) {
      setTimeout(() => {
        this.router.navigateWithParams('app.inbound.review_request', {
          redirectId: this.redirectId,
        });
      }, 100);
    } else {
      const obj = {
        firmName: this.current_user.firmInfo.name,
        type: this.current_user.type,
        username: this.current_user.userName,
      };
      if (!this.current_user.isFreeSubscription)
        Promise.resolve().then(() => {
          this.appendScripts(obj);
        });
      if (this.redirectToState) {
        this.router.navigate(this.redirectToState, {
          fragment: this.redirectToFragment || null,
          queryParams: this.redirectToParams,
        });
      } else {
        this.homePageService.navigateToHomePage(
          this.current_user,
          this.router.getState().params
        );
      }
    }
  }

  appendScripts(obj: any) {
    const heapScript = document.getElementById('heapScript');
    if (!heapScript) {
      const script = this.utils.getHeapScript();
      $('head').append(script);
    }
    // PENDING
    //heap.identify(obj.id);
    // heap.addUserProperties({
    //   subscription: this.current_user.isFreeSubscription ? 'free' : 'premium',
    //   type: obj.type,
    //   username: obj.userName,
    //   firm: obj.firm_name,
    // });
  }

  showPasswordToggle() {
    this.passwordNotVisible = !this.passwordNotVisible;
    this.passwordElementType =
      this.passwordElementType === 'password' ? 'text' : 'password';
  }

  redirectToForgetPasswordPage() {
    this.router.navigateWithParams('begin_password_reset', {
      userName: this.loginForm.get('userName').value,
    });
  }

  setSelectedFirm(firm: any) {
    if (firm.firm_id === this.current_user.firmInfo.id) {
      if (!this.current_user.isFirstLogin) {
        this.getNudge();
      } else {
        this.goToRequiredState();
      }
    } else {
      this.selectedFirm = firm;
      this.checkFirmSamlConnection(firm);
    }
  }

  checkFirmSamlConnection(firm: any) {
    this.loading = true;
    this.settingUpFirm = true;
    const params: any = {
      email: this.current_user.userName,
      firm_id: firm.firm_id,
    };
    if (this.redirectToState) {
      params.redirectToState = this.redirectToState;
    }

    if (this.router.getState().params.redirectId) {
      params.redirectId = this.router.getState().params.redirectId;
    }

    this.accountService.login(params).subscribe((response: any) => {
      if (response.saml_enabled === false) {
        this.loginWithSelectedFirm(firm);
      } else {
        this.toaster.info('Please wait..');
        const { url } = response;
        if (url) {
          localStorage.removeItem('dv_access_token');
          localStorage.removeItem('dv_refresh_token');
          window.open(url, '_self');
        }
      }
    }),
      (error: any) => {
        this.loading = false;
        this.settingUpFirm = false;
      };
  }

  loginWithSelectedFirm(firm: any) {
    const params: any = {
      userName: this.current_user.userName,
      grant_type: 'password',
      ...authSettings,
    };
    params.jwt = localStorage.getItem('jwt');
    params.firm_id = firm.firm_id;
    this.authService
      .loginNew(params)
      .then((response) => this.handleFirmLoginSuccessIntercept(response))
      .catch((error) => this.handleLoginFailure(error));
  }

  handleFirmLoginSuccessIntercept(response) {
    response.firm_display_name = this.selectedFirm.firm_name;
    this.handleLoginSuccess(response, true);
  }

  getRandomColor(member) {
    const color = this.utils.getRandomColor();
    member.style = 'background-color:' + color;
  }

  goBackToEnterEmail() {
    this.showLoginWithPass = false;
    this.loginForm.get('userName').enable();
    this.loginForm.removeControl('password');
    this.loginForm.removeControl('otp_code');
    this.isSamlLogin = false;
    this.otp_mode = false;
    this.hideMessage();
  }

  resendActivation(firm: any) {
    this.accountService.resendActivation(firm).subscribe((response: any) => {
      this.toaster.success(
        `Activation link resent to ${this.current_user.userName}`
      );
    });
  }

  showMessage(message: string) {
    this.alertMessage = message.split('. ');
    this.messageShown = true;
  }

  hideMessage() {
    this.messageShown = false;
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
