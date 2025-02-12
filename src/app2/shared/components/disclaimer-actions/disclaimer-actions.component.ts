import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-disclaimer-actions',
  templateUrl: './disclaimer-actions.component.html',
  styleUrls: ['./disclaimer-actions.component.css'],
})
export class DisclaimerActionsComponent implements ICellRendererAngularComp {
  params;
  constructor() {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
  }
  editDisclaimer() {
    this.params.clickedEdit(this.params);
  }
  confirmDisclaimerDeletion() {
    this.params.clickedDelete(this.params);
  }
}
