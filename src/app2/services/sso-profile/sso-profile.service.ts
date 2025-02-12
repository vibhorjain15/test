import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ISsoProvider } from './sso-profile.type';

@Injectable({
  providedIn: 'root',
})
export class SSOProfileService {
  private samlProvider: ISsoProvider;
  constructor(private readonly http: HttpClient) {}
  getSamlProvider(success, failure) {
    if (this.samlProvider) {
      success(this.samlProvider);
      return;
    }
    this.http.get('saml/provider').subscribe(
      (response: ISsoProvider) => {
        success(response);
        this.samlProvider = response;
      },
      (error) => {
        failure();
      }
    );
  }
}
