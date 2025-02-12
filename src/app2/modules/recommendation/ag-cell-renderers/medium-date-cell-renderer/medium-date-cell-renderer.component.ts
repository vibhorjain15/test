import { Component, Input } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import * as moment from 'moment';

@Component({
  selector: 'medium-date-cell-renderer',
  templateUrl: './medium-date-cell-renderer.component.html',
})
export class MediumDateCellRendererComponent
  implements ICellRendererAngularComp
{
  @Input() label: string = '';
  showWarningColor: boolean = false;
  isFull: boolean = false;
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    if (params.value) {
      this.label = params.value;
      this.isFull = params.data?.is_full || false;
      if (
        !params.data?.isDash &&
        params.colDef.field == 'due_date' &&
        params.data.statusName != 'Resolved'
      )
        this.showWarningColor = moment().isAfter(params.value);
    }
  }
}
