import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-disclaimer-name',
  templateUrl: './disclaimer-name.component.html',
  styleUrls: ['./disclaimer-name.component.css']
})
export class DisclaimerNameComponent implements ICellRendererAngularComp {
  params;
  showPreview = false;
  constructor() {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
  }
  viewDisclaimer(){
    this.params.clickedView(this.params);
  }
}
