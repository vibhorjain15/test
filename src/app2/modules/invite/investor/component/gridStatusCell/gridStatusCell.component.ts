import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  templateUrl: './gridStatusCell.component.html',
})
export class GridStatusCellComponent implements ICellRendererAngularComp {
  params: any;
  type;
  constructor() {}

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.type = {
      'Pending approval': 'warning-light',
      'Rejected': 'danger-light',
      'Waiting for approval': 'info-light',
    };
  }
}
