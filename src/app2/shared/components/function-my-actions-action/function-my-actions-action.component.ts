import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-function-my-actions-action',
  templateUrl: './function-my-actions-action.component.html'
})
export class FunctionMyActionsActionComponent implements ICellRendererAngularComp {
  params: any;
  constructor() { }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
  } 
}