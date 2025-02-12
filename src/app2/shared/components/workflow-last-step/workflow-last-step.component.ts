import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-workflow-last-step',
  templateUrl: './workflow-last-step.component.html'
})
export class WorkflowLastStepComponent implements ICellRendererAngularComp {
  params: any;
  field: string;
  constructor() { }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.field = this.params.colDef.field;
  }

}
