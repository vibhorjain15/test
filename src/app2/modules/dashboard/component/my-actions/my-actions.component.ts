import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { MyActionsService } from '../../service/myactions.service';
import { Store } from '@ngxs/store';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import { RouterService } from 'src/app2/services/router.service';
import { keywordConstants } from 'src/app2/shared/constants/constant';
import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';

@Component({
  selector: 'app-my-actions',
  templateUrl: './my-actions.component.html',
})
export class MyActionsComponent implements OnInit {
  constructor(
    private router: RouterService,
    private services: MyActionsService,
    private store: Store,
    private readonly toaster: ToastrService,
    private readonly http: HttpClient,
    private readonly dvDatePipe: DvDatePipe
  ) {}

  public gridDataSource: any = [];
  public columnDefs: any = [];
  @Input('dateRange') private dateRange;
  @Input('heading') public title;

  ngOnInit(): void {
    this.columnDefs = this.services.getActionsColDef();
    this.store.dispatch(
      new SetDefaultColumnDef({
        ['investor-my-actions']: this.columnDefs,
      })
    );
    this.getTasksData(this.dateRange);
  }
  action_types;
  getTasksData(dateRange) {
    let self = this;
    //this.toaster.info('Please wait...');
    let url = dateRange?.startDate
      ? `dashboard/tasks?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`
      : 'dashboard/tasks';
    try {
      self.toaster.clear();
      self.http.get(url).subscribe(
        (response: any) => {
          self.toaster.clear();
          this.http.get('workflow_actions').subscribe((response1: any) => {
            this.action_types = response1;
            response.forEach((e) => {
              e.due_at = this.dvDatePipe.transform(e.due_at, ['isLocaleDate']);
              if (e.entity_type == 'Workflow') {
                let action_item = this.action_types.find(
                  (val) => val.value == e.action_id
                );
                e.action_label = action_item.label;
              }
            });
          });
          self.gridDataSource = response;
        },
        (error: any) => {
          //self.toaster.clear();
        }
      );
    } catch (error) {
      //self.toaster.clear();
    }
  }

  onRowClicked = (event) => {
    this.services.redirectTask(event.data);
  };
}
