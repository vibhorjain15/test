import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-name-with-icon-cell-renderer',
  templateUrl: './name-with-icon-cell-renderer.component.html',
  styleUrls: ['./name-with-icon-cell-renderer.component.css'],
})
export class NameWithIconCellRendererComponent
  implements ICellRendererAngularComp
{
  params: any;
  showPreview = false;
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
  }
  iconClicked() {
    this.params.clickedActionIcon(this.params);
  }
}
