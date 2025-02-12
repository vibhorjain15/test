import { HttpClient } from '@angular/common/http';
import { Component, Input } from '@angular/core';
import { Store } from '@ngxs/store';
import * as saveAs from 'file-saver';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import { ErrorHandlerService } from 'src/app2/services/error-handler.service';
import { CurrentUserModel } from 'src/app2/store/user/user.model';
import {
  GetQuestionCount,
  TriggerSilentReload,
} from '../../store/questionnaire.action';
import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import { DatePipe } from '@angular/common';
@Component({
  selector: 'excel-sync',
  templateUrl: './excel-sync.component.html',
  styleUrls: ['./excel-sync.component.css'],
})
export class ExcelSyncModal {
  @Input() diligence: DiligenceType;
  @Input() current_user: CurrentUserModel;
  @Input() onClose;
  isDownloading = false;
  isUploading = false;
  isUploadStepDone = false;
  transactionId;
  files: any = [];
  excelSyncTransaction: any;
  updatedDiligence;

  constructor(
    private readonly http: HttpClient,
    private readonly toaster: ToastrService,
    private readonly errorHandler: ErrorHandlerService,
    private readonly questionnaire: QuestionnaireService,
    private readonly store: Store,
    private readonly datePipe: DatePipe
  ) {}

  download() {
    this.isDownloading = true;
    let request_payload = {
      template_id: this.diligence.template_id,
      diligences: [this.diligence.id],
      investor_firm_id: this.diligence.investorfirm_id
        ? this.diligence.investorfirm_id
        : this.current_user.firmInfo.id, // Either external request or internal (send own firm id as investor firm id)
    };
    this.http
      .post('excel_sync/download', request_payload, {
        responseType: 'blob',
        observe: 'response',
      })
      .pipe(
        finalize(() => {
          this.isDownloading = false;
        })
      )
      .subscribe(
        (response: any) => {
          const content_disposition_header = response.headers.get(
            'Content-Disposition'
          );
          let fileInfo = [];
          let file_name = 'download.xlsx';
          fileInfo[0] = (
            this.diligence.investorfirm_name ?? this.diligence.managerfirm_name
          )
            ?.trim()
            ?.split(' ')
            ?.join('-');
          fileInfo[1] = this.diligence.template_name
            ?.trim()
            ?.split(' ')
            ?.join('-');
          fileInfo[2] = this.diligence.entity_name
            ?.trim()
            ?.split(' ')
            ?.join('-');
          fileInfo[3] =
            this.diligence.due_at &&
            this.datePipe
              .transform(new Date(this.diligence.due_at), 'dd/MMMM/YYYY')
              ?.split(' ')
              ?.join('-');

          file_name = fileInfo.filter((info) => info).join('_') + '.xlsm';

          saveAs(response.body, file_name);
          this.toaster.success(
            '',
            'Excel file has been downloaded successfully.'
          );
        },
        (err) => {
          this.toaster.error(
            '',
            'Something went wrong while downloading the Excel file.'
          );
          this.errorHandler.handleError(err);
        }
      );
  }

  handleOnCancelClick(close) {
    if (this.onClose && this.isUploadStepDone) {
      this.onClose();
    }
    close();
  }

  onFileUpload(files, transactionId = null) {
    this.files = files;
    this.transactionId = transactionId;
  }

  deleteFile(index) {
    this.files.splice(index, 1);
  }

  addDocumentSubmit() {
    if (!this.files.length) {
      this.toaster.error('Please attach the Excel file');
      return;
    }
    const payload = new FormData();
    payload.append('file', this.files[0]);
    this.isUploading = true;
    this.updatedDiligence = null;
    payload.append('project_id', this.diligence.id.toString());
    if (this.transactionId) {
      payload.append('transaction_id', this.transactionId);
    }

    this.http
      .post('v2/excel_sync/upload', payload)
      .pipe(
        finalize(() => {
          this.files = [];
        })
      )
      .subscribe(
        (response: any) => {
          try {
            this.toaster.success('File uploaded successfully');
            forkJoin([
              this.store.dispatch(new TriggerSilentReload(Math.random())),
              this.store.dispatch(new GetQuestionCount()),
              this.loadTransactionDiligences(response.transaction_id),
            ])
              .pipe(
                finalize(() => {
                  this.isUploading = false;
                })
              )
              .subscribe((responses: any[]) => {
                this.isUploadStepDone = true;
                this.updatedDiligence = this.store.selectSnapshot(
                  (state) => state.questionnaire.diligence
                );
              });
          } catch (ex) {
            this.errorHandler.handleError(ex);
            this.isUploadStepDone = true;
          }
        },
        (error) => {
          this.toaster.error(error.error.message);
          this.isUploading = false;
          this.files = [];
        }
      );
  }

  loadTransactionDiligences(transactionId) {
    let request = this.http.get('ExcelsyncTransactionDiligences', {
      params: { transaction_id: transactionId },
    });

    return request.pipe(
      tap((response: any) => {
        this.excelSyncTransaction = response?.length > 0 ? response[0] : [];
        this.excelSyncTransaction.errors = JSON.parse(
          this.excelSyncTransaction.status_description
        );
      })
    );
  }
}
