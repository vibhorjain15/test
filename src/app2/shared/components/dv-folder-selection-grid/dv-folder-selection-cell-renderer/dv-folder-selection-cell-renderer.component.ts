import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'dv-folder-selection-cell-renderer',
  templateUrl: './dv-folder-selection-cell-renderer.component.html',
  styleUrls: ['./dv-folder-selection-cell-renderer.component.css'],
})
export class DvFolderSelectionCellRendererComponent
  implements ICellRendererAngularComp
{
  params: any = {};

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
