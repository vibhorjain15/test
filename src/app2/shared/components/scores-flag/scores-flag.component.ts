import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-scores-flag',
  templateUrl: './scores-flag.component.html'
})
export class ScoresFlagComponent implements ICellRendererAngularComp {
  params: any;
  value: number;
  field: string;
  tooltipStr: string;
  constructor() { }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.field = this.params.colDef.field;
    this.tooltipStr = params.data[this.field] ? `${params.data[this.field]} flag(s) have been set` : 'No flag set';
  }

}
