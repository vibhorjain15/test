import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-my-actions-entity-name',
  templateUrl: './my-actions-entity-name.component.html'
})
export class MyActionsEntityNameComponent implements ICellRendererAngularComp {
  params: any;
  constructor() { }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
  } 

}
