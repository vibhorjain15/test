import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-project-status-icon-renderer',
  templateUrl: './project-status-icon-renderer.component.html',
  styleUrls: ['./project-status-icon-renderer.component.css'],
})
export class ProjectStatusIconRendererComponent
  implements ICellRendererAngularComp
{
  params: any;
  is_investor: boolean;
  constructor() {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.is_investor = this.params.isInvestor;
  }

  displayIcon(icon) {
    if (
      (icon === 'flag' && this.is_investor) ||
      (icon === 'hourglass' && !this.is_investor)
    ) {
      return (
        this.params.data.status === 'Completed' ||
        this.params.data.status === 'PendingRestart' ||
        this.params.data.status === 'ExtensionRequested' ||
        this.params.data.status === 'Evaluation'
      );
    } else if (
      (icon === 'flag' && !this.is_investor) ||
      (icon === 'hourglass' && this.is_investor)
    ) {
      return (
        this.params.data.status === 'Started' ||
        this.params.data.status === 'Followup' ||
        this.params.data.status === 'InReview'
      );
    }
  }
}
