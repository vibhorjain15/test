import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  templateUrl: './gridLabelcell.component.html',
})
export class GridLabelCellComponent implements ICellRendererAngularComp {
  params: any;
  tooltip;
  displayLabel: string[] = [];
  constructor() {}

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.displayLabel = params?.value?.split(',');
    this.tooltip = this.displayLabel
      ?.filter((val, index) => index !== 0)
      .join(' , ');
  }
}
