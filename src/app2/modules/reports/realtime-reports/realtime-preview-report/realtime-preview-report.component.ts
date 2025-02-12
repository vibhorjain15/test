import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { ReportTemplateDataservice } from 'src/app2/services/report-template-data.service';
import { RouterService } from 'src/app2/services/router.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { ReportUtilsService } from '../../util/reportUtil.service';
@Component({
  selector: 'app-realtime-preview-report',
  templateUrl: './realtime-preview-report.component.html',
  styleUrls: ['./realtime-preview-report.component.css'],
})
export class RealtimePreviewReportComponent implements OnInit {
  stateParams: any;
  report: any;
  loading = true;
  constructor(
    private readonly routerService: RouterService,
    private readonly http: HttpClient,
    private readonly ReportTemplateDataservice: ReportTemplateDataservice,
    private readonly toaster: ToastrService,
    private readonly SweetAlert: SweetAlertService,
    private readonly reportUtilService: ReportUtilsService
  ) {}

  ngOnInit(): void {
    this.stateParams = this.routerService.getState().params;
    this.getReport(this.stateParams.reportId);
  }

  getReport(reportId) {
    this.http.get(`reports/${reportId}`).subscribe((response: any) => {
      this.report = response;
      this.loading = false;
    });
  }

  downloadReport(reportId) {
    this.reportUtilService.downloadReport(`/reports/download/${reportId}`);
  }

  emailReport(report) {
    this.http
      .get(`reports/new/${report.id}/email`)
      .subscribe((response: any) => {
        this.toaster.success('Report emailed successfully', '');
      });
  }

  deleteNewReport(id) {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to delete this report?',
      showLoaderOnConfirm: true,
      focusCancel: true,
      preConfirm: () => {
        this.ReportTemplateDataservice.deleteNewReport(id).subscribe(
          (response: any) => {
            this.toaster.success('', 'Report deleted successfully');
            this.routerService.navigateWithParams(
              'app.reports.realtime-reports.list',
              null,
              {
                reload: true,
              }
            );
          }
        );
      },
    });
  }

  preview(reportId, item) {
    this.routerService.navigateWithParams(
      `app.reports.realtime-reports.detail.${item}`,
      { reportId: reportId }
    );
  }
}
