import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-empty-cell-renderer',
  templateUrl: './empty-cell-renderer.component.html',
})
export class EmptyCellRenderer implements ICellRendererAngularComp {
  params;
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
  }
}
