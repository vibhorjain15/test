import { Component } from '@angular/core';
import { ILoadingOverlayAngularComp } from 'ag-grid-angular';
import { ILoadingOverlayParams } from 'ag-grid-community';

@Component({
  selector: 'dv-grid-loading-state',
  templateUrl: './dv-grid-loading-state.component.html',
  styleUrls: ['./dv-grid-loading-state.component.css'],
})
export class DvGridLoadingStateComponent implements ILoadingOverlayAngularComp {
  params: ILoadingOverlayParams<any, any>;

  agInit(params: ILoadingOverlayParams<any, any>): void {
    this.params = params;
  }
}
