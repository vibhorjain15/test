import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-access-level-cell-actions',
  templateUrl: './access-level-cell-actions.component.html',
  styleUrls: ['./access-level-cell-actions.component.css'],
})
export class AccessLevelCellActionsRendererComponent
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
  edit() {
    this.params.clickedEdit(this.params);
  }
  delete() {
    this.params.clickedRemove(this.params);
  }
  assign() {
    this.params.clickedAssign(this.params);
  }
}
