import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-reviewed-by-name',
  templateUrl: './reviewed-by-name.component.html',
})
export class ReviewedByNameComponent implements ICellRendererAngularComp {
  params: any;
  firstLabel: any = '';
  firstLabelTooltip: string = '';
  otherLabels: any = '';
  otherLabelsTooltip = '';
  constructor() {}

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.firstLabel =
      this.params?.value?.length > 0
        ? Array.isArray(this.params.value)
          ? this.params.value[0]
          : this.params.value
        : '';
    if (this.params?.value?.length > 1) {
      this.otherLabels = Array.isArray(this.params.value)
        ? this.params?.value?.splice(1)
        : '';
    }
  }
}
