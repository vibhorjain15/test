import { Component, Input, OnInit } from '@angular/core';
import { RouterService } from 'src/app2/services/router.service';
import { UserState } from 'src/app2/store/user/user.state';
import { Select } from '@ngxs/store';
import { take } from 'rxjs/operators';
import { UtilsService } from 'src/app2/services/utils.service';

@Component({
  selector: 'app-investor-monitor',
  templateUrl: './investor-monitor.component.html',
})
export class InvestorMonitorComponent implements OnInit {
  customDateFilter : any;
  isAllDataLoaded: boolean = false;
  is_freeSubscription: boolean = false;
  @Select(UserState.getCurrentUserData) user$;
  dashFilterMap: any = ['Activity', 'Monitor'];
  dateRangeRatingScheme : any;
  @Input() dashTypes;
  @Select(UserState.getFirmPreferenceData) firmPref;
  isFreeSubscription: boolean
  constructor(
    private readonly router: RouterService,
    private readonly Utils: UtilsService,
  ) {}

  ngOnInit(): void {
    this.getFirmPref();

    this.user$
      .pipe(
        take(1),
      )
      .subscribe((user) => {
        if (user) {
          let current_user = JSON.parse(JSON.stringify(user));
          this.is_freeSubscription = current_user.firmInfo.isFreeSubscription;
          this.isFreeSubscription = current_user.isFreeSubscription;
        }
      });
  }

  getFirmPref() {
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
        this.isAllDataLoaded = true;
      }
    });
  }
  onChange(event) {
    if (event && event.startDate && event.endDate) {
      this.isAllDataLoaded = false;
      this.dateRangeRatingScheme = {
        startDate: this.Utils.formatDatetime(event.startDate),
        endDate: this.Utils.formatDatetime(event.endDate),
        range: event.range,
      };

      setTimeout(() => {
        this.isAllDataLoaded = true;
      }, 10);
    }
  }

  onClearDateFilter() {
    this.isAllDataLoaded = false;
    setTimeout(() => {
      this.isAllDataLoaded = true;
      this.dateRangeRatingScheme = null;
    },10);
  }

  toggleDashboard(type) {
    this.router.navigateWithParams('app.dash', {
      dashType: type,
    });
  }
}
