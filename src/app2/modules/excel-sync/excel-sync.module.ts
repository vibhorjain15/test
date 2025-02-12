import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app2/shared/shared.module';
import { ExcelSyncUploadComponent } from './excel-sync-upload/excel-sync-upload.component';
import { ExcelSyncDownloadComponent } from './excel-sync-download/excel-sync-download.component';
import { FailedUploadDetailsComponent } from './failed-upload-details/failed-upload-details.component';
import { RouterModule } from '@angular/router';
import { EXCEL_SYNC_ROUTES } from './excel-sync.routes';

@NgModule({
  declarations: [
    ExcelSyncUploadComponent,
    ExcelSyncDownloadComponent,
    FailedUploadDetailsComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(EXCEL_SYNC_ROUTES),
  ],
})
export class ExcelSyncModule {}
