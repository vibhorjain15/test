import { ExcelDataExportComponent } from './excel-data-export/excel-data-export.component';
import { NewReportComponent } from './new_reports/new-reports.component';
import { RealtimeReportsListComponent } from './realtime-reports/list/report-list.component';
import { RealtimePreviewReportComponent } from './realtime-reports/realtime-preview-report/realtime-preview-report.component';
import { ReportTemplatesListComponent } from './templates/list/list.component';
import { ReportTemplatesListPreviewComponent } from './templates/preview/preview.component';

export const reportsRoutesNames = {
  EXPORTS: 'exports',
  REAL_TIME_REPORTS_LIST: 'realtime-reports/list',
  REAL_TIME_SHOW_PREVIEW: 'realtime-reports/:reportId/show/preview',
  TEMPLATES_LIST: 'templates/list',
  NEW_REPORT: 'new_report',
};
export const REPORTS_ROUTES = [
  {
    path: reportsRoutesNames.EXPORTS,
    component: ExcelDataExportComponent,
  },

  {
    path: reportsRoutesNames.TEMPLATES_LIST,
    component: ReportTemplatesListComponent,
    children: [
      {
        // /app/reports/templates/list/6/preview
        path: ':id/preview',
        component: ReportTemplatesListPreviewComponent,
      },
    ],
  },
  {
    path: reportsRoutesNames.REAL_TIME_REPORTS_LIST,
    component: RealtimeReportsListComponent,
  },
  {
    path: reportsRoutesNames.REAL_TIME_SHOW_PREVIEW,
    component: RealtimePreviewReportComponent,
  },
  {
    path: reportsRoutesNames.NEW_REPORT,
    component: NewReportComponent,
  },
];
