import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { ProjectsGridInvestorService } from 'src/app2/services/projects-grid-investor.service';

@Component({
  selector: 'app-project-actions-sent-tab-renderer',
  templateUrl: './project-actions-sent-tab-renderer.component.html',
  styleUrls: ['./project-actions-sent-tab-renderer.component.css'],
})
export class ProjectActionsSentTabRendererComponent
  implements ICellRendererAngularComp
{
  params: any;
  subscription: any;
  remind_loading = false;
  withdraw_loading = false;

  constructor(
    private readonly projectsGridInvestorService: ProjectsGridInvestorService
  ) {}

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.subscribeToStopLoadingEvent();
  }

  updateStatus(row, action) {
    if (action === 'remind') {
      this.remind_loading = true;
    } else {
      this.withdraw_loading = true;
    }
    this.params.updateStatus(row, action);
  }

  addSubscribersSentAction(row) {
    this.params.addSubscribersSentAction(row);
  }

  subscribeToStopLoadingEvent() {
    this.subscription =
      this.projectsGridInvestorService.stopActionButtonsLoading$.subscribe(
        () => {
          this.remind_loading = this.withdraw_loading = false;
        }
      );
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
