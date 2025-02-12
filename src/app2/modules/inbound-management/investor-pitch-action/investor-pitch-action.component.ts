import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-investor-pitch-action',
  templateUrl: './investor-pitch-action.component.html',
  styleUrls: ['./investor-pitch-action.component.css'],
})
export class InvestorPitchActionComponent implements ICellRendererAngularComp {
  params;
  constructor() {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
  }
  onSelect() {
    this.params.clickedSelect(this.params.data);
  }
}
