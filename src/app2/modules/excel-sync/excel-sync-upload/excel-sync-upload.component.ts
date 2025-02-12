import { Component, OnInit } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { ToastrService } from 'ngx-toastr';
import { Store } from '@ngxs/store';
import { HttpClient } from '@angular/common/http';
import { ExcelSyncService } from 'src/app2/services/excel-sync.service';
import {
  defaultColumn,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import { finalize } from 'rxjs/operators';
import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';

@Component({
  selector: 'app-excel-sync-upload',
  templateUrl: './excel-sync-upload.component.html',
  styleUrls: ['./excel-sync-upload.component.css'],
})
export class ExcelSyncUploadComponent implements OnInit {
  maxFileSize: string;
  allowed_file_extensions_str: string;
  columnDefs: ColDef[] = [];
  sync_list: any;
  gridName = 'excel_sync';
  files: Blob[] = new Array<Blob>();
  constructor(
    private readonly toaster: ToastrService,
    private readonly excelSyncService: ExcelSyncService,
    private readonly store: Store,
    private readonly http: HttpClient,
    private readonly dvDatePipe: DvDatePipe
  ) {}

  ngOnInit(): void {
    const allowed_file_extensions = ['xls', 'xlsm', 'xlsx'];
    this.maxFileSize = '50MB';
    this.allowed_file_extensions_str = allowed_file_extensions
      .map((ext) => '.' + ext)
      .join(',');
    let defaultColumnDef = this.excelSyncService.getExcelSyncColDef();
    defaultColumnDef = [
      {
        ...defaultColumn,
        colId: 'leftAction',
        headerName: '',
        field: 'leftAction',
        minWidth: grid_widths_map['icon_lg'],
        cellRenderer: 'excelSyncUploadActionCellRenderer',
        sortable: false,
        cellRendererParams: {
          accept: this.allowed_file_extensions_str,
          clickedUpload: (data) => {
            this.onFileUpload(data.files, data.transaction_id);
          },
        },
        suppressColumnsToolPanel: true,
      },
      ...defaultColumnDef,
    ];
    this.store.dispatch(
      new SetDefaultColumnDef({ [this.gridName]: defaultColumnDef })
    );
    this.getRowData();
  }

  getRowData() {
    this.excelSyncService.getExcelSyncRowData().subscribe((res: any) => {
      this.sync_list = res[0].map((sync) => {
        let downloaded_by = '';
        let uploaded_by = '';
        if (sync.downloaded_by) {
          const member = res[1].find(
            (member) => member.id === sync.downloaded_by
          );
          downloaded_by = member
            ? `${member.firstName} ${member.lastName}`
            : '';
        }
        if (sync.uploaded_by) {
          const member = res[1].find(
            (member) => member.id === sync.uploaded_by
          );
          uploaded_by = member ? `${member.firstName} ${member.lastName}` : '';
        }
        return {
          id: sync.id,
          file_name: sync.file_name,
          status: sync.status ?? '',
          client: sync.investor_name,
          questionnaire: sync.template_name,
          projects: sync.project_count,
          downloaded_by: downloaded_by,
          downloaded_on: sync.downloaded_at
            ? this.dvDatePipe.transform(sync.downloaded_at)
            : '',
          downloaded_at: sync.downloaded_at ?? '',
          uploaded_by,
          uploaded_on: sync.uploaded_at
            ? this.dvDatePipe.transform(sync.uploaded_at)
            : '',
          uploaded_at: sync.uploaded_at ?? '',
        };
      });
    });
  }

  excelUploadComplete() {
    this.toaster.success('File uploaded successfully');
    this.getRowData();
  }

  excelUploadError(response) {
    this.toaster.error(response.error.message);
    this.files = [];
  }
  isProcessBtn = false;
  transaction_id;

  onFileUpload(files, transaction_id = null) {
    this.files = files;
    this.isProcessBtn = true;
    this.transaction_id = transaction_id;
  }

  isUploadDocument;
  addDocumentSubmit() {
    if (!this.files.length) {
      this.toaster.error('Please attach the excel file');
      return;
    }
    const payload = new FormData();
    payload.append('file', this.files[0]);
    this.isUploadDocument = true;
    if (this.transaction_id) {
      payload.append('transaction_id', this.transaction_id);
    }
    this.http
      .post('v2/excel_sync/upload', payload)
      .pipe(finalize(() => (this.isUploadDocument = false)))
      .subscribe(
        () => {
          this.excelUploadComplete();
        },
        (error) => this.excelUploadError(error)
      );
  }

  deleteFile(index) {
    this.files.splice(index, 1);
  }
}

