import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import {
  ICellRendererParams,
  IAfterGuiAttachedParams,
} from 'ag-grid-community';

@Component({
  selector: 'app-adv-filing-date',
  templateUrl: './adv-filing-date.component.html',
})
export class AdvFilingDateComponent implements ICellRendererAngularComp {
  params: any;
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
  }
  afterGuiAttached?(params?: IAfterGuiAttachedParams): void {}
}
