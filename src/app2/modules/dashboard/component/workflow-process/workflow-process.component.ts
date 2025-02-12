import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngxs/store';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import { WorkflowService } from '../../service/workflow.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { RouterService } from 'src/app2/services/router.service';
import { ColDef } from 'ag-grid-community';
import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';
@Component({
  selector: 'app-workflow-process',
  templateUrl: './workflow-process.component.html',
})
export class WorkflowProcessComponent implements OnInit {
  public gridDataSource: any = [];
  public columnDefs: ColDef[] = [];
  @Input('dateRange') private dateRange;
  @Input('heading') public title;

  constructor(
    private services: WorkflowService,
    private store: Store,
    private readonly http: HttpClient,
    private readonly utils: UtilsService,
    private routerService: RouterService,
    private readonly dvDatePipe: DvDatePipe
  ) {
    this.onRowClicked = this.onRowClicked.bind(this);
  }

  ngOnInit(): void {
    this.columnDefs = this.services.getActionsColDef();
    this.store.dispatch(
      new SetDefaultColumnDef({
        ['investor-dash-workflow-process']: this.columnDefs,
      })
    );

    this.getWorkFlowData(this.dateRange);
  }

  getWorkFlowData(dateRange) {
    let self = this;
    let url = dateRange?.startDate
      ? `workflow_audits?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`
      : 'workflow_audits';
    self.http.get(url).subscribe((response: any[] = []) => {
      response.forEach((workflow) => {
        workflow.entity_type = this.utils.getDisplayEntityType(
          workflow.entity_type
        );
        workflow.due_at = this.dvDatePipe.transform(workflow.due_at, [
          'isLocaleDate',
        ]);
        workflow.updated_at = workflow.updated_at
          ? this.dvDatePipe.transform(workflow.updated_at)
          : 'Never';
        workflow.due_at_date = workflow.due_at ?? null;
        workflow.updated_at_date = workflow.updated_at ?? null;
      });
      self.gridDataSource = response;
    });
  }

  onRowClicked(event: any) {
    let self = this;
    if (event?.data?.id) {
      self.routerService.navigateWithParams('app.workflow_automation.detail', {
        Id: event?.data?.id,
      });
    }
  }
}
