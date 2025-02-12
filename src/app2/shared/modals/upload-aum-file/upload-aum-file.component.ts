import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { saveAs } from 'file-saver';
import { NgxFileDropEntry } from 'ngx-file-drop';
import { ToastrService } from 'ngx-toastr';
import { ErrorStatusCode, PeriodOptions } from '../../constants/constant';

@Component({
  selector: 'app-upload-aum-file',
  templateUrl: './upload-aum-file.component.html',
  styleUrls: ['./upload-aum-file.component.css'],
})
export class UploadAumFileModal implements OnInit {
  @Input() entity_id;
  @Input() entity_type;

  files: any[] = [];
  period_options: any[] = PeriodOptions;
  selected_period: number = -1;
  is_uploading: boolean = false;
  is_downloading: boolean = false;
  upload_error_message: string = '';

  constructor(
    private readonly http: HttpClient,
    private readonly toaster: ToastrService
  ) {}

  ngOnInit(): void {}

  upload(modalCallback): void {
    this.is_uploading = true;
    try {
      const formData = new FormData();
      formData.append('file', this.files[0]);
      if (this.selected_period != -1) {
        formData.append('selected_periods', this.selected_period?.toString());
      }

      if (this.entity_id && this.entity_type) {
        formData.append('for_entity_id', this.entity_id.toString());
        formData.append('for_entity_type', this.entity_type.toString());
      }

      this.http
        .post('service/excel_services/aum_tr_upload/upload', formData)
        .subscribe(
          (response: any) => {
            this.is_uploading = false;
            this.toaster.success(
              'You will receive an email once the uploaded AUM/TR records are processed',
              'Processing File'
            );
            modalCallback();
          },
          (err) => {
            this.is_uploading = false;
            if (err && err.status == 422) {
              this.upload_error_message =
                err.error?.message ??
                'Invalid file format. Please make sure to only use our sample excel file while uploading AUM/TR data.';
            } else if (
              !(
                err &&
                err.status &&
                Object.values(ErrorStatusCode).includes(err.status)
              )
            ) {
              this.toaster.error(
                '',
                'Something went wrong while uploading AUM/TR file. Please try again.',
                {
                  timeOut: 1500,
                }
              );
            }
          }
        );
    } catch (err) {
      this.is_uploading = false;
      this.toaster.error(
        '',
        'Something went wrong while uploading AUM/TR file. Please try again.',
        {
          timeOut: 1500,
        }
      );
    }
  }

  handleFileUpload(files: NgxFileDropEntry[]) {
    this.files = files;
    this.upload_error_message = '';
  }

  downloadFile() {
    this.is_downloading = true;

    this.http
      .post(
        'service/excel_services/aum_tr_download',
        {
          period: this.selected_period == -1 ? null : this.selected_period, // Period of the history table
          for_entity_id: this.entity_id ?? null,
          for_entity_type: this.entity_type ?? null,
        },
        {
          responseType: 'blob',
          observe: 'response',
        }
      )
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
          } catch (err) {}
          saveAs(response.body, file_name);
          this.is_downloading = false;
        },
        (err) => {
          this.is_downloading = false;
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
