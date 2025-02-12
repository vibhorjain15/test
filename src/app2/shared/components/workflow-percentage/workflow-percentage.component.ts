import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-workflow-percentage',
  templateUrl: './workflow-percentage.component.html'
})
export class WorkflowPercentageComponent implements ICellRendererAngularComp {
  params: any;
  value: number;
  field: string;
  constructor() { }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.value = +params.data?.pct_complete;
  }

}
