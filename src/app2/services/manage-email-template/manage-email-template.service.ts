import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import {
  IEmailTemplate,
  IEmailTemplateRequest,
  IFirmPref,
} from './manage-email-template.types';

@Injectable({
  providedIn: 'root',
})
export class ManageEmailService {
  constructor(
    private readonly http: HttpClient,
    private readonly toaster: ToastrService
  ) {
    this.templateSub = new Subject<string>();
  }

  templateSub: Subject<string>;
  allTemplate: IEmailTemplate[] = [];
  firmPref: IFirmPref;

  deleteEmailTemplate(id: number, success, failure) {
    this.http.delete(`EmailTemplateMessages/${id}`).subscribe(
      () => {
        this.toaster.success('Template deleted successfully');
        // this.templateSub.next('');
        success();
      },
      (error) => {
        failure();
      }
    );
  }

  createEmailTemplate(
    params: IEmailTemplateRequest,
    success,
    failure,
    defaultTemp: boolean
  ) {
    this.http.post(`EmailTemplateMessages`, params).subscribe(
      (response: IEmailTemplate) => {
        this.allTemplate.push(response);
        success(response.id);
        if (!defaultTemp) this.templateSub.next('');
      },
      () => {
        failure();
      }
    );
  }

  updateEmailTemplate(
    params: IEmailTemplate,
    success,
    failure,
    defaultTemp: boolean
  ) {
    this.http.put(`EmailTemplateMessages/${params.id}`, params).subscribe(
      (response: IEmailTemplate) => {
        this.allTemplate.forEach((val) => {
          if (val.id === response.id) {
            val.name = response.name;
            val.content = response.content;
          }
        });
        if (!defaultTemp) this.templateSub.next('');
        success();
      },
      () => {
        failure();
      }
    );
  }

  getFirmPreference(success) {
    if (this.firmPref) return success(this.firmPref);
    this.http.get(`firm_preferences`).subscribe(
      (response: IFirmPref) => {
        this.firmPref = response;
        success(this.firmPref);
      },
      (error) => {}
    );
  }

  updateFirmPref(
    params: IFirmPref,
    success?: () => void,
    failure?: () => void
  ) {
    this.http.put(`firm_preferences`, params).subscribe(
      (response: IFirmPref) => {
        this.templateSub.next('');
        if (success) success();
        this.toaster.success('Template is set as default', '', {
          timeOut: 5000,
        });
      },
      (error) => {
        if (failure) failure();
        this.toaster.error('Something went wrong. Please try again.');
      }
    );
  }
}
