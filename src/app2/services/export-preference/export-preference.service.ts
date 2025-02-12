import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { ManagePrefTemplates } from './export-preference.type';

@Injectable({
  providedIn: 'root',
})
export class ExportPrefService {
  constructor(
    private readonly http: HttpClient,
    private readonly toaster: ToastrService
  ) {}

  newTemplate: Subject<{ temp: ManagePrefTemplates; isEdit: boolean }> =
    new Subject();

  uploadTemplate(id, params, success, failure) {
    this.http.put('DocumentExportTemplates/' + id, params).subscribe(
      (res: ManagePrefTemplates) => {
        success();
        this.toaster.success('Template successfully updated');
        this.newTemplate.next({ temp: res, isEdit: true });
      },
      (error) => {
        failure();
        this.toaster.error('Template updation failed');
      }
    );
  }

  createTemplate(params, success, failure) {
    this.http.post('DocumentExportTemplates', params).subscribe(
      (res: ManagePrefTemplates) => {
        success();
        this.newTemplate.next({ temp: res, isEdit: false });
        this.toaster.success('Template successfully created');
      },
      (error) => {
        failure();
        // this.toaster.error('Template creation failed');
      }
    );
  }

  downloadTemplate(id, success, failure) {
    this.http.get(`DocumentExportTemplates/${id}/signed_url`).subscribe(
      (response) => {
        success(response);
      },
      () => {
        failure();
        this.toaster.error('Template download failed');
      }
    );
  }
}
