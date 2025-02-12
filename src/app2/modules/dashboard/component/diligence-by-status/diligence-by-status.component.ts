import { Component, OnInit, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { UtilsService } from 'src/app2/services/utils.service';
import { RouterService } from 'src/app2/services/router.service';
import { UserState } from 'src/app2/store/user/user.state';
import { Select } from '@ngxs/store';
import { take } from 'rxjs/operators';
import * as c3 from 'c3';
@Component({
  selector: 'app-diligence-by-status',
  templateUrl: './diligence-by-status.component.html',
  styleUrls: ['./diligence-by-status.component.css'],
})
export class DiligenceByStatusComponent implements OnInit {
  @Input('dateRange') private dateRange;
  item = [];
  @Input('heading') public title;

  private dataSource: any = [];
  private columns: any = [];
  private colorScheme: any = [];
  public dash_live_total;
  private chartConfig;
  private projectsTabsArray = [
    'in-progress',
    'sent',
    'invited',
    'closed',
    'my-projects',
    'all',
  ];
  private chart;
  @Select(UserState.getFirmPreferenceData) firmPref;

  constructor(
    private router: RouterService,
    private readonly Utils: UtilsService,
    private readonly toaster: ToastrService,
    private readonly http: HttpClient
  ) {}

  ngOnInit(): void {
    this.firmPref.pipe(take(2)).subscribe((pref) => {
      if (pref) {
        this.colorScheme = this.Utils.getFirmColorScheme(pref);
      }
    });
    this.getDataSource();
  }

  prepareChartConfig(id, response) {
    let dash_total_count = response.valueArray.reduce(
      (result, item) => result + item.value,
      0
    );
    if (dash_total_count) {
      for (let index = 0; index < response.valueArray.length; index++) {
        const element = response.valueArray[index];
        this.item.push([element?.label, element?.value]);
      }
    }
    c3.generate({
      bindto: `#${id}`,
      data: {
        columns: this.item,
        type: 'donut',
        empty: {
          label: {
            text: 'No activity',
          },
        },
        onclick: (d, element) => {
          return this.redirectToProjects(d, element, this);
        },
      },
      donut: {
        title: '',
        label: {
          format: function (value) {
            return value.toString();
          },
        },
      },
      color: {
        pattern: this.colorScheme,
      },
    });
    this.dash_live_total = this.dataSource.valueArray.reduce(function (
      result,
      item
    ) {
      return result + item.value;
    },
    0);
  }

  getDataSource() {
    let self = this;
    // self.toaster.info('Please wait...');
    let url =
      self.dateRange && self.dateRange.startDate
        ? `Dashboard/count/status?start_date=${self.dateRange.startDate}&end_date=${self.dateRange.endDate}`
        : 'Dashboard/count/status';
    try {
      self.toaster.clear();
      self.http.get(url).subscribe(
        (response: any) => {
          self.toaster.clear();
          self.dataSource = response;
          self.prepareChartConfig('diligence_by_status_chart', response);
          // self.chart = c3.generate(self.chartConfig);
        },
        (error: any) => {
          self.toaster.clear();
        }
      );
    } catch (error) {
      self.toaster.clear();
    }
  }

  redirectToProjects(d, element, chart) {
    setTimeout(() => {
      var indexOfTab, tabId;
      tabId = d.id.toLowerCase();
      indexOfTab = this.projectsTabsArray.indexOf(tabId);
      this.router.navigateWithParams('app.diligence.projects.activity', {
        type: 'in-progress',
      });
    }, 100);
  }
}
