import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { ReportTemplateDataservice } from 'src/app2/services/report-template-data.service';
import { RouterService } from 'src/app2/services/router.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import {
  defaultColumn,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';
import swal from 'sweetalert2/dist/sweetalert2.js';
import { ReportsListType } from '../../type/report-list.type';
import { shortDateFormat } from '../../util/date.utils';
import { ReportListGridService } from './list-grid.service';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import { ReportUtilsService } from '../../util/reportUtil.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';
@Component({
  selector: 'report-list',
  templateUrl: './report-list.component.html',
  // styleUrls: ['./investor.component.css'],
})
export class RealtimeReportsListComponent implements OnInit {
  reports: any;
  ReportsManager: any;
  baseUrl: string;
  previewClicked: any;
  loading_data;
  constructor(
    private readonly http: HttpClient,
    private readonly router: RouterService,
    private readonly SweetAlert: SweetAlertService,
    private readonly toaster: ToastrService,
    private readonly ReportTemplateDataservice: ReportTemplateDataservice,
    private readonly store: Store,
    private readonly ReportListGridService: ReportListGridService,
    private readonly reportUtilService: ReportUtilsService,
    private readonly dvDatePipe: DvDatePipe,
    private readonly utils: UtilsService
  ) {
    this.onRowSelected = this.onRowSelected.bind(this);
  }

  ngOnInit() {
    this.getAllReports();

    let defaultColumnDef =
      this.ReportListGridService.getMyReportListGridColDef();
    defaultColumnDef = [
      ...defaultColumnDef,
      {
        ...defaultColumn,
        colId: 'actions',
        headerName: 'Actions',
        field: 'actions',
        flex: 1,
        minWidth: grid_widths_map.sm_column_xxm,
        cellRenderer: 'ReportListActionCellComponent',
        cellRendererParams: {
          onDelete: (report) => {
            this.deleteReport(report.data);
          },
          onDownload: (report) => {
            this.downloadReport(report.data);
          },
          onDownloadExcelLog: (report) => {
            this.downloadExcelLog(report.data);
          },
          onEmail: (report) => {
            this.emailReport(report.data);
          },
        },
        sortable: false,
      },
    ];

    this.store.dispatch(
      new SetDefaultColumnDef({ ['report_list']: defaultColumnDef })
    );
  }

  getAllReports() {
    if (this.reports) {
      delete this.reports;
    }
    this.loading_data = true;
    this.ReportListGridService.getAllReports().subscribe(
      (res: ReportsListType[]) => {
        this.loading_data = false;
        this.reports = res.map((reports: ReportsListType) => ({
          id: reports.id,
          report_name: reports.name,
          definition_name: reports.report_template_name,
          created_by: reports.created_by_name,
          as_of_date: reports.as_of_date
            ? shortDateFormat(reports.as_of_date)
            : '',
          created_at: reports.created_at
            ? this.getLocalDateTime(reports.created_at)
            : '',
          report_type: reports.entity_type,
          entity_type: reports.entity_type,
          output_blob_name: reports.output_blob_name,
        }));
      }
    );
  }

  downloadReport(entity: { id: string }) {
    this.reportUtilService.downloadReport(`/reports/download/${entity.id}`);
  }

  downloadExcelLog(entity: { id: string }) {
    this.reportUtilService.downloadReport(
      `reports/download_excel/${entity.id}`
    );
  }

  deleteReport(entity: { entity_type: string; id: any }) {
    if (entity.entity_type === 'Review') {
      this.deleteNewReport(entity.id);
    } else {
      this.deleteCurrentReport(entity.id);
    }
  }

  deleteNewReport(id: any) {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to delete this report?',
      showLoaderOnConfirm: true,
      focusCancel: true,
      preConfirm: () => {
        this.ReportTemplateDataservice.deleteNewReport(id).subscribe(
          (response: any) => {
            this.toaster.success('', 'Report deleted successfully');
            this.getAllReports();
            swal.close();
          }
        );
      },
    });
  }

  deleteCurrentReport(id: any) {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to delete this report?',
      showLoaderOnConfirm: true,
      focusCancel: true,
      preConfirm: () => {
        this.ReportTemplateDataservice.deleteRealtimeReport(id).subscribe(
          (response: any) => {
            this.toaster.success('', 'Report deleted successfully');
            const deleteReportData = this.reports.filter((x) => x.id != id);
            this.reports = deleteReportData;
          }
        );
      },
    });
  }

  emailReport(entity: { id: string }) {
    this.http
      .get('reports/new/' + entity.id + '/email')
      .subscribe((response: any) => {
        this.toaster.success('', 'Report emailed successfully');
      });
  }

  editReport(entity: { id: any }) {
    this.router.navigateWithParams('app.reports.realtime-reports.detail.edit', {
      reportId: entity.id,
    });
  }

  redirectToNewReport() {
    this.router.navigate('app.reports.realtime-reports.new');
  }

  handleClick(event) {
    event.stopPropagation();
    this.router.navigate('app.reports.new_report');
  }

  onRowSelected(data) {
    if (data.colDef.colId !== 'actions' && data?.data?.id) {
      this.router.navigateWithParams(
        'app.reports.realtime-reports.show.preview',
        {
          reportId: data.data.id,
        }
      );
    }
  }
  getLocalDateTime(date) {
    const localDateTime: any = this.utils.getLocalDateTime(date);
    return this.dvDatePipe.transform(localDateTime, [
      'dvDateTime',
      'isLocaleDate',
    ]);
  }
}


