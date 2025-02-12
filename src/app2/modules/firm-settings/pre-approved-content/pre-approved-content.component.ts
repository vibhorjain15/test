import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { NgxFileDropEntry } from 'ngx-file-drop';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { FileHandlerService } from 'src/app2/services/file-handler.service';
import { DvUploaderComponent } from 'src/app2/shared/components/dv-uploader/dv-uploader.component';

@Component({
  selector: 'app-pre-approved-content',
  templateUrl: './pre-approved-content.component.html',
  styleUrls: ['./pre-approved-content.component.css'],
})
export class PreApprovedContentComponent implements OnInit {
  @ViewChild(DvUploaderComponent) dvUploader: DvUploaderComponent;

  allowed_file_extensions: string[];
  uploadType;
  updatedParams;
  maxFileSize: number;
  drop_files: any[];
  files = [];
  tabType: string;
  onlyNewUploadSources: string[];
  allowed_file_extensions_str: string;
  uploading_excel: boolean;
  Navigator: any = navigator;
  Window: any = window;

  constructor(
    private readonly FileHandlerFactory: FileHandlerService,
    private readonly toaster: ToastrService,
    private readonly http: HttpClient
  ) {}

  ngOnInit() {
    this.allowed_file_extensions = ['.xls', '.xlsm', '.xlsx'];
    this.uploadType = {};
    this.updatedParams = {};
    this.drop_files = [];
    this.files = [];
    this.tabType = 'team_members';
    const allowed_file_extensions = this.FileHandlerFactory.getFileTypes();
    this.maxFileSize = this.FileHandlerFactory.getMaxFileSize();
    this.onlyNewUploadSources = [
      'detail',
      'list',
      'documentsEditClick',
      'firmDocumentsList',
    ];
    this.allowed_file_extensions_str = this.allowed_file_extensions.toString();
  }

  downloadEmptySampleFile() {
    this.toaster.info('Downloading Sample File', 'Please wait...', {
      timeOut: 0,
    });
    this.http
      .get(`bulk_import/qna_download`, {
        params: {
          download_blank: true,
        },
        responseType: 'arraybuffer',
        observe: 'response',
      })
      .subscribe(
        (response: any) => {
          this.toaster.clear();
          this.processExcelFile(response, 'sample_qa_file.xlsx');
        },
        (error: any) => {
          this.toaster.clear();
        }
      );
  }

  downloadSampleFile() {
    this.toaster.info('Downloading Sample File', 'Please wait...', {
      timeOut: 0,
    });
    this.http
      .get(`bulk_import/qna_download`, {
        responseType: 'arraybuffer',
        observe: 'response',
      })
      .subscribe(
        (response: any) => {
          this.toaster.clear();
          this.processExcelFile(response, 'alldata_sample_qa_file.xlsx');
        },
        (error: any) => {
          this.toaster.clear();
        }
      );
  }

  addDocumentSubmit() {
    if (!this.files.length) {
      this.toaster.error('Please select at least one file');
      return;
    }
    const payload = new FormData();
    this.uploading_excel = true;
    this.files.forEach((file: File) => {
      payload.append('file', file);
      payload.append('types', 'Qna');
      this.http
        .post('bulk_import/qna_upload', payload)
        .pipe(
          finalize(() => {
            this.uploading_excel = false;
            this.dvUploader.files = [];
          })
        )
        .subscribe((response: any) => {
          this.toaster.success('Request successful, Please check your email');
        });
    });
  }

  processExcelFile(response, fileName) {
    let blob: any, ex: any;
    const octetStreamMime = 'application/octet-stream';
    let success = false;
    // Get the filename from the x-filename header or default to "download.bin"
    const contentDisposition = response.headers.get('Content-Disposition');

    const filename = fileName || 'download.xlsx';
    // Determine the content type from the header or default to "application/octet-stream"
    const contentType = response.headers.get('content-type') || octetStreamMime;
    try {
      // Try using msSaveBlob if supported
      blob = new Blob([response.body], { type: contentType });
      if (this.Navigator.msSaveBlob) {
        this.Navigator.msSaveBlob(blob, filename);
      } else {
        // Try using other saveBlob implementations, if available
        const saveBlob =
          this.Navigator.webkitSaveBlob ||
          this.Navigator.mozSaveBlob ||
          this.Navigator.saveBlob;
        if (!saveBlob) {
          throw 'Not supported';
        }
        saveBlob(blob, filename);
      }
      success = true;
    } catch (error) {
      ex = error;
    }
    if (!success) {
      // Get the blob url creator
      const urlCreator =
        window.URL ||
        window.webkitURL ||
        this.Window.mozURL ||
        this.Window.msURL;
      if (urlCreator) {
        // Try to use a download link
        let url: any;
        const link = document.createElement('a');
        if ('download' in link) {
          // Try to simulate a click
          try {
            // Prepare a blob URL
            blob = new Blob([response.body], { type: contentType });
            url = urlCreator.createObjectURL(blob);
            link.setAttribute('href', url);
            // Set the download attribute (Supported in Chrome 14+ / Firefox 20+)
            link.setAttribute('download', filename);
            // Simulate clicking the download link
            const event = document.createEvent('MouseEvents');
            event.initMouseEvent(
              'click',
              true,
              true,
              window,
              1,
              0,
              0,
              0,
              0,
              false,
              false,
              false,
              false,
              0,
              null
            );
            link.dispatchEvent(event);
            success = true;
          } catch (error1) {
            ex = error1;
          }
        }
        if (!success) {
          // Fallback to window.location method
          try {
            // Prepare a blob URL
            // Use application/octet-stream when using window.location to force download
            blob = new Blob([response.body], { type: octetStreamMime });
            url = urlCreator.createObjectURL(blob);
            window.location = url;
            success = true;
          } catch (error2) {
            ex = error2;
          }
        }
      }
    }
    /* if (!success) {
      const popup = window.open(httpPath, '_blank', '');
      return PopupCheckerService.check(popup);
    } */
  }

  dropped(files: NgxFileDropEntry[]) {
    this.files = files;
  }
}

