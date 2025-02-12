import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-workflow-tags',
  templateUrl: './workflow-tags.component.html',
  styleUrls: ['./workflow-tags.component.css'],
})
export class WorkflowTagsComponent implements ICellRendererAngularComp {
  params;
  constructor() {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
  }
}
