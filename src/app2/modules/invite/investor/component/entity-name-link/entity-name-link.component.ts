import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  templateUrl: './entity-name-link.component.html',
})
export class EntityNameLinkCellRendererComponent
  implements ICellRendererAngularComp
{
  params;
  constructor() {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
  }
  handleClick(route, params) {
    this.params.clicked(route, params);
  }
}
