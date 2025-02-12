import { DocumentDetailComponent } from 'src/app2/shared/components/document-detail/document-detail.component';
import { ExcelSyncDownloadComponent } from './excel-sync-download/excel-sync-download.component';
import { ExcelSyncUploadComponent } from './excel-sync-upload/excel-sync-upload.component';
import { ManageAumTrComponent } from '../standalone/manage-aum-tr/manage-aum-tr.component';
import { DocumentsGridComponent } from '../documents/documents-grid/documents-grid.component';
import { Route } from '@angular/router';

export const excelSyncRoutesNames = {
  AUM_TR: 'aum_tr', // app/content/aum_tr
  LIST: 'list',
  DETAIL: 'detail',
};

export const EXCEL_SYNC_ROUTES: Route[] = [
  {
    path: '',
    redirectTo: `${excelSyncRoutesNames.LIST}?sync_type=download`,
    pathMatch: 'full',
  },
  {
    path: excelSyncRoutesNames.AUM_TR,
    component: ManageAumTrComponent,
  },
  {
    path: excelSyncRoutesNames.LIST,
    component: ExcelSyncUploadComponent,
  },
  {
    path: excelSyncRoutesNames.DETAIL,
    component: ExcelSyncDownloadComponent,
  },
];
