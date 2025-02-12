import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'grid-cell-workflow-activity',
  templateUrl: './grid-cell-workflow-activity.component.html',
  styleUrls: ['./grid-cell-workflow-activity.component.css'],
})
export class WorkflowActivityCellRendererComponent
  implements ICellRendererAngularComp
{
  params;
  constructor() {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
  }
}
