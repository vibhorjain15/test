import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-email-template-actions',
  templateUrl: './email-template-actions.component.html',
  styleUrls: ['./email-template-actions.component.css'],
})
export class EmailTemplateActionsComponent implements ICellRendererAngularComp {
  params;
  constructor() {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
  }
  markDefault() {
    this.params.clickedDefault(this.params);
  }
  editTemplate() {
    this.params.clickedEdit(this.params);
  }
  deleteTemplate() {
    this.params.clickedDelete(this.params);
  }
}
