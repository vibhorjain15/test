import { Component, OnInit } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-inbound-actions',
  templateUrl: './inbound-actions.component.html',
  styleUrls: ['./inbound-actions.component.css'],
})
export class InboundActionsComponent implements ICellRendererAngularComp {
  params;
  constructor() {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
  }
  edit() {
    this.params.clickedEdit({
      ...this.params.data,
      rowIndex: this.params.rowIndex,
    });
  }
  delete() {
    this.params.clickedRemove(this.params.data);
  }
}
