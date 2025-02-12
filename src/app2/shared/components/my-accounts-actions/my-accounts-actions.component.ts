import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-my-accounts-actions',
  templateUrl: './my-accounts-actions.component.html',
  styleUrls: ['./my-accounts-actions.component.css'],
})
export class MyAccountsActionsComponent implements ICellRendererAngularComp {
  params;
  current_user;
  constructor() {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.current_user = params.data.current_user;
  }
  isCurrentFirm() {
    let is_current = false;
    if (this.params?.data.firm_id === this.current_user?.firmInfo?.id) {
      is_current = true;
    }
    return is_current;
  }
  checkSamlConnection() {
    this.params.clickedCheckSamlConnection(this.params);
  }
  activateFirmAccess() {
    this.params.clickedActivateFirmAccess(this.params);
  }
  requestApproval() {
    this.params.clickedRequestApproval(this.params);
  }
}
