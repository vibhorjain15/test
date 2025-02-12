import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-share-action',
  templateUrl: './share-action.component.html',
})
export class ShareActionComponent implements ICellRendererAngularComp {
  params: any = {};
  constructor() {}

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  openFollowupDialog() {
    this.params.openFollowupDialog(this.params);
  }

  revokeAccessModal() {
    this.params.revokeAccessModal(this.params);
  }
}
