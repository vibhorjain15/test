import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-workflow-last-updated',
  templateUrl: './workflow-last-updated.component.html'
})
export class WorkflowLastUpdatedComponent implements ICellRendererAngularComp {
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
