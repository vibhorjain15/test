import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { take, tap } from 'rxjs/operators';
import { GetCurrentUser } from 'src/app2/store/user/user.action';
import { UserState } from 'src/app2/store/user/user.state';
import { UtilsService } from 'src/app2/services/utils.service';
import { DashboardService } from 'src/app2/apis/dashboard/dashboard.service';

@Component({
  selector: 'dash-tab',
  templateUrl: './dash-tab.component.html',
  styleUrls: ['./dash-tab.component.css'],
})
export class DashTabComponent implements OnInit {
  dateRange;
  filters: any = { startDate: '', endDate: '' };
  customDateFilter: any;
  currentTabIndex = 0;
  loading = true;
  @Select(UserState.getCurrentUserData) user;
  @Select(UserState.getSubscriptionLimitsData) subscriptionLimits;
  @Select(UserState.getFirmPreferenceData) firmPref;
  @Input() dashTypes = null;
  @Output() onDateChange = new EventEmitter();
  canShowBanner = false;
  constructor(
    private readonly Utils: UtilsService,
    private readonly store: Store,
    private readonly dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.user
      .pipe(
        take(2),
        tap((userData) => {
          if (!userData) {
            this.store.dispatch(new GetCurrentUser());
          }
        })
      )
      .subscribe((user) => {
        if (user) {
          this.getFirmPref();
          this.loading = false;

          this.dashboardService
            .getLastView('dashboard-banner')
            .subscribe((response: any) => {
              this.canShowBanner = !response?.viewed_at;
            });
        }
      });
  }

  onClearDateFilter() {
    setTimeout(() => {
      this.dateRange = null;
      this.filters.startDate = null;
      this.filters.endDate = null;
      this.onDateChange.emit(this.filters);
    });
  }
  onDateRangeChange(event) {
    if (event && event.startDate && event.endDate) {
      this.dateRange = {
        startDate: event.startDate,
        endDate: event.endDate,
      };
      this.filters.startDate = event.startDate;
      this.filters.endDate = event.endDate;
      this.onDateChange.emit(this.filters);
    }
  }

  getFirmPref() {
    this.firmPref.pipe(take(1)).subscribe((response) => {
      if (response) {
        this.customDateFilter = this.Utils.getPredefinedDateRanges(
          response.default_daterange_months
        );
        if (response.default_daterange_months) {
          this.dateRange = {
            startDate: this.Utils.formatDatetime(
              this.customDateFilter.startDate
            ),
            endDate: this.Utils.formatDatetime(this.customDateFilter.endDate),
            range: response?.default_daterange_months ?? 'null',
          };
        } else {
          this.dateRange = null;
        }
      }
    });
  }
  handleOnClose() {
    let payload: any = {
      tab_name: `dashboard-banner`,
    };
    this.dashboardService.updateUnReadItem(payload).toPromise();
  }
}
