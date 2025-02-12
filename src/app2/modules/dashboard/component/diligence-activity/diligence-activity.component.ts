import { Component, Input, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { RouterService } from 'src/app2/services/router.service';
import { HttpClient } from '@angular/common/http';
import { tooltip_map } from 'src/app2/shared/constants/constant';

@Component({
  selector: 'app-diligence-activity',
  templateUrl: './diligence-activity.component.html',
  styleUrls: ['./diligence-activity.component.css'],
})
export class DiligenceActivityComponent implements OnInit {
  @Input('dateRange') private dateRange;
  public activityDatasource: any = [];
  public tooltip_map: any = tooltip_map;

  constructor(
    private router: RouterService,
    private readonly toaster: ToastrService,
    private readonly http: HttpClient
  ) {}

  ngOnInit(): void {
    this.getActivityData(this.dateRange);
  }

  redirectToPage(diligenceId) {
    this.router.navigateWithParams('app.diligence.project.questionnaire', {
      diligenceId: diligenceId,
    });
  }

  getActivityData(dateRange) {
    let self = this;
    //this.toaster.info('Please wait...');
    let url = dateRange?.startDate
      ? `dd_activities?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`
      : 'dd_activities';
    try {
      self.toaster.clear();
      self.http.get(url).subscribe(
        (response: any) => {
          //self.toaster.clear();
          self.activityDatasource = response;
        },
        (error: any) => {
          self.toaster.clear();
        }
      );
    } catch (error) {
      //self.toaster.clear();
    }
  }
}
