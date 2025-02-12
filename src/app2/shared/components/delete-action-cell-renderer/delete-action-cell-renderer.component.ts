import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import {
  ICellRendererParams,
} from 'ag-grid-community';

@Component({
  selector: 'app-delete-action-cell-renderer',
  templateUrl: './delete-action-cell-renderer.component.html',
  styleUrls: ['./delete-action-cell-renderer.component.css'],
})
export class DeleteActionCellRendererComponent
  implements ICellRendererAngularComp
{
  params;
  tooltip: string = 'Delete workflow';
  constructor() {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams | any): void {
    this.params = params;
    if (params?.tooltip) this.tooltip = params.tooltip;
  }
  deleteConfirm() {
    this.params.clickedRemove(this.params);
  }
}
