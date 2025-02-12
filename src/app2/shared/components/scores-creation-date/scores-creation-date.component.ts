import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-scores-creation-date',
  templateUrl: './scores-creation-date.component.html'
})
export class ScoresCreationDateComponent implements ICellRendererAngularComp {
  params: any;
  value: number;
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
