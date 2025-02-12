import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { IFirmPref } from '../manage-email-template/manage-email-template.types';

@Injectable({
  providedIn: 'root',
})
export class FirmPreferencesService {
  constructor(
    private readonly http: HttpClient,
    private readonly toaster: ToastrService
  ) {}
  firmPref: IFirmPref;

  getFirmPreference(success) {
    this.http.get(`firm_preferences`).subscribe(
      (response: IFirmPref) => {
        this.firmPref = response;
        success(this.firmPref);
      },
      (error) => {}
    );
  }
}
