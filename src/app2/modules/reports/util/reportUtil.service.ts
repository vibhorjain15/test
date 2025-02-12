import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { saveAs } from 'file-saver';
import { ErrorStatusCode } from 'src/app2/shared/constants/constant';
@Injectable({
  providedIn: 'root',
})
export class ReportUtilsService {
  constructor(
    private readonly http: HttpClient,
    private readonly toaster: ToastrService
  ) {}

  downloadReport(url) {
    return this.http
      .get(url, { responseType: 'blob', observe: 'response' })
      .subscribe(
        (response: any) => {
          let content_disposition_header = response.headers.get(
            'Content-Disposition'
          );
          let file_name = 'download.xlsx';
          try {
            file_name = content_disposition_header
              ?.split(';')[1]
              .split('filename')[1]
              .split('=')[1]
              .trim();
            if (file_name.startsWith('"') && file_name.endsWith('"')) {
              file_name = file_name.substring(1, file_name.length - 1);
            }
          } catch (err) {
            console.error(err);
          }
          saveAs(response.body, file_name);
        },
        (err) => {
          if (
            !(
              err &&
              err.status &&
              Object.values(ErrorStatusCode).includes(err.status)
            )
          ) {
            this.toaster.error(
              '',
              'Something went wrong while downloading sample file. Please try again.',
              {
                timeOut: 1500,
              }
            );
          }
        }
      );
  }
}
