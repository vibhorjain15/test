import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-shared-status',
  templateUrl: './share-status.component.html',
})
export class ShareStatusComponent implements ICellRendererAngularComp {
  params: any;
  type;
  constructor() {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.type = this.getStatusClass(params.value);
  }

  getStatusClass(status) {
    let type;
    switch (status) {
      case 'Completed':
      case 'Approved':
      case 'APPROVED':
      case 'Unanswered':
      case 'ExtensionApproved':
      case 'Registered':
        type = 'success';
        break;
      case 'NotApproved':
      case 'Deleted':
      case 'Answered':
      case 'Withdrawn':
      case 'ExtensionDeclined':
      case 'Retired':
        type = 'danger';
        break;
      case 'Started':
      case 'Following':
      case 'Scheduled':
      case 'ACTIVE':
        type = 'default';
        break;
      case 'Followup':
      case 'Invested':
      case 'Invited':
      case 'PendingRestart':
      case 'APPROVED-120':
      case 'WIP':
      case 'Extension Requested':
      case 'ExtensionRequested':
      case 'ERA':
        type = 'warning';
        break;
      case 'Reminded':
      case 'Restarted':
      case 'RestartApproved':
      case 'InReview':
      case 'Evaluation':
        type = 'info';
        break;
      case 'Sent':
        type = 'orange';
        break;
    }
    return `label-${type}`;
  }
}
