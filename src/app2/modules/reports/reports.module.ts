import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app2/shared/shared.module';
import { NewReportComponent } from './new_reports/new-reports.component';
import { ReportListActionCellComponent } from './components/report-list-action-cell/report-list-action-cell.component';
import { RealtimeReportsListComponent } from './realtime-reports/list/report-list.component';
import { ReportTemplatesListComponent } from './templates/list/list.component';
import { ReportTemplatesListPreviewComponent } from './templates/preview/preview.component';
import { ReportTypeCellRendererComponent } from './templates/report-type-cell-renderer/report-type-cell-renderer.component';
import { RealtimePreviewReportComponent } from './realtime-reports/realtime-preview-report/realtime-preview-report.component';
import { ReportUtilsService } from './util/reportUtil.service';
import { ExcelDataExportComponent } from './excel-data-export/excel-data-export.component';
import { RouterModule } from '@angular/router';
import { REPORTS_ROUTES } from './reports.routes';
@NgModule({
  declarations: [
    NewReportComponent,
    ReportListActionCellComponent,
    RealtimeReportsListComponent,
    ReportTemplatesListComponent,
    ReportTemplatesListPreviewComponent,
    ReportTypeCellRendererComponent,
    RealtimePreviewReportComponent,
    ExcelDataExportComponent,
  ],
  imports: [CommonModule, SharedModule, RouterModule.forChild(REPORTS_ROUTES)],
  providers: [ReportUtilsService],
})
export class ReportModule {}
