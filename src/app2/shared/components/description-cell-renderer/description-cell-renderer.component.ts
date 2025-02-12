import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'description-cell-renderer',
  templateUrl: './description-cell-renderer.component.html',
  styleUrls: ['./description-cell-renderer.component.css'],
})
export class DescriptionCellRendererComponent
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
}
