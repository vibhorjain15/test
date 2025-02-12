import { Component, Input, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { RouterService } from 'src/app2/services/router.service';
import { keywordConstants } from 'src/app2/shared/constants/constant';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import * as moment from 'moment';
import { UtilsService } from 'src/app2/services/utils.service';
import { Select, Store } from '@ngxs/store';
import { take, tap } from 'rxjs/operators';
import { UserState } from 'src/app2/store/user/user.state';

@Component({
  selector: 'app-investor-activity',
  templateUrl: './investor-activity.component.html',
})
export class InvestorActivityComponent implements OnInit {
  customDateFilter: any;
  dashType: any;
  @Input() dashTypes;
  isAllDataLoaded: boolean = false;
  dashFilterMap: any = ['Activity', 'Monitor'];
  punchcard_data: any = [];
  dd_activities: any = [];
  punchcard_options: {
    // tooltip method for cells
    tooltipText(data: { count: number; audit_date: any }): string;
    // tooltip method for header label text
    rowHeaderTextToolTip(data: { fullName: any }): any;
  };
  @Select(UserState.getFirmPreferenceData) firmPref;
  dateRangeRatingScheme: any;
  entity_id: any;
  entity_type: any;
  dateRange;
  currentTab = 'myWork';
  loading = true;
  constructor(
    private readonly http: HttpClient,
    private readonly router: RouterService,
    private readonly Utils: UtilsService,
    private readonly toaster: ToastrService
  ) {}

  ngOnInit(): void {
    this.getFirmPref();
    setTimeout(() => {
      this.loading = false;
    }, 0);

    this.entity_type = keywordConstants.Firm;
    this.punchcard_options = {
      // tooltip method for cells
      tooltipText(data: { count: number; audit_date: any }) {
        let str: string;
        if (!data.count) {
          str = 'No activity';
        } else if (data.count === 1) {
          str = 'One activity';
        } else {
          str = `${data.count} activities`;
        }

        return `${str} on ${data.audit_date}`;
      },

      // tooltip method for header label text
      rowHeaderTextToolTip(data: { fullName: any }) {
        return data.fullName;
      },
    };
    this.getFirmPref();
  }

  getFirmPref() {
    this.http.get(`firm_preferences`).subscribe(async (response: any) => {
      this.entity_id = response.firm_id;
    });
    this.firmPref.pipe(take(2)).subscribe((response) => {
      if (response) {
        this.customDateFilter = this.Utils.getPredefinedDateRanges(
          response.default_daterange_months
        );
        if (response.default_daterange_months) {
          this.dateRangeRatingScheme = {
            startDate: this.Utils.formatDatetime(
              this.customDateFilter.startDate
            ),
            endDate: this.Utils.formatDatetime(this.customDateFilter.endDate),
            range: response?.default_daterange_months ?? 'null',
          };
        } else {
          this.dateRangeRatingScheme = null;
        }
        this.loadAllData();
      }
    });
  }
  loadAllData() {
    let self = this;
    let requestList = [];
    let team_activities_url = this.dateRangeRatingScheme
      ? `team_activities?start_date=${this.dateRangeRatingScheme.startDate}&end_date=${this.dateRangeRatingScheme.endDate}`
      : 'team_activities';
    let dd_activities_url = this.dateRangeRatingScheme
      ? `dd_activities?start_date=${this.dateRangeRatingScheme.startDate}&end_date=${this.dateRangeRatingScheme.endDate}`
      : 'dd_activities';
    requestList.push(this.http.get(team_activities_url));
    requestList.push(this.http.get(dd_activities_url));
    self.isAllDataLoaded = false;
    //this.toaster.info('Please wait...');
    try {
      forkJoin(requestList).subscribe(
        (responseList: any) => {
          this.punchcard_data = [];
          self.preparePuncardData(responseList[0]);
          self.dd_activities = responseList[1];
          self.isAllDataLoaded = true;
          self.toaster.clear();
        },
        (error: any) => {
          self.toaster.clear();
        }
      );
    } catch (error) {
      self.toaster.clear();
    }
  }
  handleTabChange(index: string): void {
    this.currentTab = index;
  }
  onDateRangeChange(event) {
    if (event.startDate && event.endDate) {
      this.dateRange = {
        startDate: event.startDate,
        endDate: event.endDate,
      };

      this.dateRangeRatingScheme = {
        startDate: this.Utils.formatDatetime(event.startDate) ?? null,
        endDate: this.Utils.formatDatetime(event.endDate) ?? null,
        range: event.range,
      };
      if (
        !this.dateRangeRatingScheme.startDate ||
        !this.dateRangeRatingScheme.endDate
      )
        this.dateRangeRatingScheme = null;

      this.loadAllData();
    } else {
      this.onClearDateFilter();
    }
  }
  preparePuncardData(response: any) {
    let parent = this;
    response.teamMember.map(function (name, index) {
      // if length of name is greater than 16 characters then trim it
      let trimmedFullName: string;
      if (name.length > 16) {
        trimmedFullName = name.split(' ');
        let trimmedFirstName = trimmedFullName[0];
        let trimmedLastName = trimmedFullName[1];

        if (trimmedFirstName.length > 8) {
          trimmedFirstName = trimmedFirstName.substring(0, 8);
        }
        if (trimmedLastName.length > 8) {
          trimmedLastName = trimmedLastName.substring(0, 8);
        }

        trimmedFullName = trimmedFirstName + ' ' + trimmedLastName;
      } else {
        trimmedFullName = name;
      }
      // keep trimmed name in name key and full name in fullName
      let punchcard_row = [];
      punchcard_row.push({ name: trimmedFullName, fullName: name });

      response.grouped_audits.map(function (audit_info: {
        auditDate: string;
        counts: any;
      }) {
        const date = moment(audit_info.auditDate, 'MM-DD-YYYY');

        punchcard_row.push({
          audit_date: date.format('DD MMM'),
          count: audit_info.counts[index],
        });
      });
      parent.punchcard_data.push(punchcard_row);
    });
  }

  toggleDashboard(type) {
    this.router.navigateWithParams('app.dash', {
      dashType: type,
    });
  }

  onChange(event) {
    if (event && event.startDate && event.endDate) {
      this.dateRangeRatingScheme = {
        startDate: this.Utils.formatDatetime(event.startDate) ?? null,
        endDate: this.Utils.formatDatetime(event.endDate) ?? null,
        range: event.range,
      };
      if (
        !this.dateRangeRatingScheme.startDate ||
        !this.dateRangeRatingScheme.endDate
      )
        this.dateRangeRatingScheme = null;

      this.loadAllData();
    }
  }

  onClearDateFilter() {
    this.dateRangeRatingScheme = null;
    this.dateRange = {
      startDate: null,
      endDate: null,
    };
    this.loadAllData();
  }
}
