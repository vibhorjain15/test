import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-custom-field-cell-link-renderer',
  templateUrl: './custom-field-cell-link-renderer.component.html',
  styleUrls: ['./custom-field-cell-link-renderer.component.css'],
})
export class CustomFieldCellLinkRendererComponent
  implements ICellRendererAngularComp
{
  params: any;
  linkText = '';
  linkTooltip = '';
  otherLinksTooltip = '';
  constructor() {}

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;

    try {
      // data format [ 'link name' , ' link url ']
      this.linkText = '' + (params.value[0][0] || params.value[0][1]); // first link text
      this.linkTooltip = '' + params.value[0][1]; // first link tooltip
      this.otherLinksTooltip = params.value.slice(1).map((x) => x[1]); // other links tooltip
    } catch (error) {}
  }
}
