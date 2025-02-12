import { HttpClient, HttpContext } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import * as angular from 'angular';
import { ToastrService } from 'ngx-toastr';
import {
  authSettings,
  SKIP_400_ALERT,
  SKIP_AUTH_FAILURE_REDIRECTION,
} from '../shared/constants/constant';
import { ErrorHandlerService } from './error-handler.service';
import { RouterService } from './router.service';
import { SweetAlertService } from './sweet-alert.service';
import { tap } from 'rxjs/operators';
import { ResetStoreService } from './reset-store.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  requests_to_retry = [];
  is_token_being_refreshed = false;
  auth;
  currentToken = {
    refresh: null,
    jwt: null,
  };

  constructor(
    private readonly toaster: ToastrService,
    private readonly http: HttpClient,
    private readonly routerService: RouterService,
    private readonly sweetAlert: SweetAlertService,
    private readonly errorHandler: ErrorHandlerService,
    private readonly ResetStoreService: ResetStoreService,
  ) {
    this.currentToken = {
      refresh: localStorage.getItem('dv_refresh_token'),
      jwt: localStorage.getItem('jwt'),
    };
  }

  logoutViaRequest() {
    this.toaster.info('Logging out...', '', { timeOut: 500000 });
    this.http.delete('RefreshTokens').subscribe((response: any) => {
      this.toaster.clear();
      this.sweetAlert.close();
      this.logout(response);
    });
  }

  logout(response?) {
    localStorage.removeItem('dv_refresh_token');
    localStorage.removeItem('dv_access_token');
    localStorage.removeItem('jwt');
    if (response && response.url) {
      open(response.url, '_self');
      return;
    }
    this.currentToken = {
      refresh: null,
      jwt: null,
    };
    this.ResetStoreService.ResetStoreData();
    this.routerService.navigate('/login');
  }

  login(params) {
    return this.auth.login(params).then((response) => {
      if (localStorage) {
        if (!response) {
          this.logToSentry(new Error('Null response from login endpoint'));
        } else if (!response.data) {
          this.logToSentry(new Error('Null response data from login endpoint'));
        } else if (!response.data.access_token) {
          this.logToSentry(new Error('Null access token from login endpoint'));
        } else if (!response.data.refresh_token) {
          this.logToSentry(new Error('Null refresh token from login endpoint'));
        }
        localStorage.setItem('dv_refresh_token', response.data.refresh_token);
        localStorage.setItem('jwt', response.data.jwt);
      } else {
        this.logToSentry(new Error('login local storage not available'));
      }
    });
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

  isTokenBeingRefreshed() {
    return this.is_token_being_refreshed;
  }

  refreshToken() {
    const refresh_token = localStorage
      ? localStorage.getItem('dv_refresh_token')
      : null;
    if (refresh_token) {
      const params = {
        ...authSettings,
        grant_type: 'refresh_token',
        refresh_token,
      };
      this.is_token_being_refreshed = true;
      return this.login(params);
    } else {
      // this.logout();
      return new Promise((resolve, reject) => reject());
    }
  }

  queueRequest(config, deferred) {
    this.requests_to_retry.push({
      config,
      deferred,
    });
  }

  loginNew(params, skipBadAndUnauthorizeAlert = false) {
    let payload = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      payload.set(key, params[key]);
    });
    return this.http
      .post('auth/token', payload, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        },
        context: new HttpContext()
          .set(SKIP_400_ALERT, skipBadAndUnauthorizeAlert)
          .set(SKIP_AUTH_FAILURE_REDIRECTION, skipBadAndUnauthorizeAlert),
      })
      .pipe(
        tap((response: any) => {
          localStorage.setItem('dv_refresh_token', response.refresh_token);
          localStorage.setItem('dv_access_token', response.access_token);
          localStorage.setItem('jwt', response.jwt);
          this.currentToken = {
            refresh: response.refresh_token,
            jwt: response.jwt,
          };
        })
      )
      .toPromise();
  }
}
