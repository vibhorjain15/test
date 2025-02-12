import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import {
  ICellRendererParams,
} from 'ag-grid-community';

@Component({
  selector: 'app-email-template-name',
  templateUrl: './email-template-name.component.html',
  styleUrls: ['./email-template-name.component.css'],
})
export class EmailTemplateNameComponent implements ICellRendererAngularComp {
  params;
  showPreview = false;
  constructor() {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
  }
  viewTemplate() {
    this.params.clickedView(this.params);
  }
}
