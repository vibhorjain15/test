import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { finalize, take } from 'rxjs/operators';
import { FirmSettingsService } from '../firm-settings.service';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';

@Component({
  selector: 'app-report-exports',
  templateUrl: './report-exports.component.html',
  styleUrls: ['./report-exports.component.css'],
})
export class ReportExportsComponent implements OnInit {
  loadingExportOptions;
  excelReports = [];
  firm_profile: any;
  firmId;
  @Select(UserState.getCurrentUserData) user;

  constructor(
    private readonly firmSettingsService: FirmSettingsService,
    private readonly http: HttpClient,
    private readonly toaster: ToastrService,
  ) {}

  ngOnInit(): void {
    this.user.pipe(take(1)).subscribe((user) => {
      if (user) {
        this.firmSettingsService
          .getFirmProfile(user.firmInfo.id)
          .subscribe((firm_profile: any) => (this.firm_profile = firm_profile));
      }
    });

    this.getExportOptionList();
  }

  getExportOptionList() {
    this.loadingExportOptions = true;
    this.http
      .get('excel_reports')
      .pipe(finalize(() => (this.loadingExportOptions = false)))
      .subscribe((response: any) => (this.excelReports = response));
  }

  generateReportLink(id) {
    this.toaster.info(
      'Request being processed. You will receive an email with the report.'
    );
    this.http.get(`excel_reports/${id}/generate_report`).subscribe(() => {
      this.toaster.success(
        'Request processed successfully. Please check your email'
      );
    });
  }
}
