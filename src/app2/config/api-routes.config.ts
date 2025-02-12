import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable()

export class ApiRoutes {

  /* private apiBaseUrl = environment.server.apiBaseUrl;
  private apiSecretKey = environment.server.apiSecret;
  private apiVersionUrl = environment.server.apiVersionPath;
  private apiTokenKeyName = environment.server.apiTokenKeyName;
  private apiSecretKeyName = environment.server.apiSecretKeyName;
  private imageHostingBaseUrl = environment.server.imageHostingBaseUrl; */

  constructor() { }

  /* get getApiSecretKeyName(): string {
    return this.apiSecretKeyName;
  }

  get getApiTokenKeyName(): string {
    return this.apiTokenKeyName;
  }

  get getApiSecretKey(): string {
    return this.apiSecretKey;
  }

  get getApiBaseUrl(): string {
    return this.apiBaseUrl + this.apiVersionUrl;
  }


  get getImageHostingBaseUrl(): string {
    return this.imageHostingBaseUrl;
  } */

  // ================= USER AUTH API's =================

  /* get userLoginAPIUrl(): string {
    return this.getApiBaseUrl + '/customer/signin';
  }

  get userInfoAPIUrl(): string {
    return this.getApiBaseUrl + '/customer/getuserinfo';
  } */

}
