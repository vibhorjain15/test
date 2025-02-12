import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-my-admin-type-cell-renderer',
  templateUrl: './my-admin-type-cell-renderer.component.html',
  styleUrls: ['./my-admin-type-cell-renderer.component.css'],
})
export class MyAdminTypeComponent implements ICellRendererAngularComp {
  params;
  constructor() {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

}
