import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'grid-cell-workflow-progress',
  templateUrl: './grid-cell-workflow-progress.component.html',
  styleUrls: ['./grid-cell-workflow-progress.component.css'],
})
export class WorkflowProgressCellRendererComponent
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
