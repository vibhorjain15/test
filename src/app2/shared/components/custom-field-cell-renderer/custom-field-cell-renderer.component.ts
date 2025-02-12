import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { DvDatePipe } from '../../pipes/dv-date.pipe';
@Component({
  selector: 'app-custom-field-cell-renderer',
  templateUrl: './custom-field-cell-renderer.component.html',
  styleUrls: ['./custom-field-cell-renderer.component.css'],
})
export class CustomFieldCellRendererComponent
  implements ICellRendererAngularComp
{
  params: any;
  text = '';
  textTooltip = '';
  otherTextTooltip = [];
  constructor(private readonly dvDatePipe: DvDatePipe) {}

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
    try {
      if (this.params.type == 'datetime' || this.params.type == 'date') {
        this.text = params.value;
      } else {
        this.text = params.value[0] ? '' + params.value[0] : ''; // first text
      }
      this.otherTextTooltip = params.value.slice(1).map((x) => x); // other tooltip
    } catch (error) {}
  }
}
