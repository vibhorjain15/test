import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  SKIP_400_ALERT,
  SKIP_404_REDIRECTION,
  SKIP_AUTH_FAILURE_REDIRECTION,
} from '../shared/constants/constant';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  constructor(private readonly http: HttpClient) {}

  getUserToActivate(params) {
    return this.http.get('account/activate', {
      context: new HttpContext().set(SKIP_404_REDIRECTION, true),
      params: params,
    });
  }

  activateUser(payload) {
    return this.http.post('account/activate', payload);
  }

  verifyResetPasswordToken(params) {
    return this.http.get('account/verifyToken', {
      context: new HttpContext().set(SKIP_AUTH_FAILURE_REDIRECTION, true),
      params: params,
    });
  }

  resetPassword(payload) {
    return this.http.post('account/resetPassword', payload, {
      context: new HttpContext().set(SKIP_AUTH_FAILURE_REDIRECTION, true),
    });
  }

  verifyUserName(params) {
    return this.http.get('account/verifyUserName', {
      context: new HttpContext().set(SKIP_404_REDIRECTION, true),
      params: params,
    });
  }

  resetPasswordRequest(payload) {
    return this.http.post('account/forgotPassword', payload);
  }

  getInboundConfig(params) {
    return this.http.get('inboundConfigurations', { params: params });
  }

  login(params) {
    return this.http.get('saml/login', {
      context: new HttpContext().set(SKIP_400_ALERT, true),
      params: params,
    });
  }

  generateSignupCode(params) {
    return this.http.post('account/generatesignupcode', {}, { params: params });
  }

  getNudges() {
    return this.http.get('nudges');
  }

  logNudge(payload) {
    return this.http.post('nudges/log', payload);
  }

  getAssociatedFirms(userId) {
    return this.http.get(`users/${userId}/associated_firms`);
  }

  resendActivation(payload) {
    return this.http.put('users/resend_activation', payload);
  }

  getLoginBannerDetail() {
    return this.http.get(`login_banner`);
  }
}
