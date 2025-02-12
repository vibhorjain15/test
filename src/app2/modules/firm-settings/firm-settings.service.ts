import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class FirmSettingsService {
  constructor(private readonly http: HttpClient) {}
  getFirmProfile(firmId) {
    return this.http.get(`firms/${firmId}/profile`);
  }

  saveFirmProfile(firmId, params) {
    return this.http.put(`firms/${firmId}/profile`, params);
  }

  unlockUser(userName) {
    return this.http.put(`users/unlock`, { userName });
  }
}
