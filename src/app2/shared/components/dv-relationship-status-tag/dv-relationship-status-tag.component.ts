import { Component, Input } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
@Component({
  selector: 'dv-relationship-status-tag',
  templateUrl: './dv-relationship-status-tag.component.html',
  styleUrls: ['./dv-relationship-status-tag.component.css'],
})
export class DvRelationshipStatusTagComponent
  implements ICellRendererAngularComp
{
  @Input() label: string = '';
  params: any;

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
    if (params.value) {
      this.label = params.value ? params.value : '';
    }
  }
}
