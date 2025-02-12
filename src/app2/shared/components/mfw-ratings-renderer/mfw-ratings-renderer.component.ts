import { Component, OnInit } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-mfw-ratings-renderer',
  templateUrl: './mfw-ratings-renderer.component.html',
  styleUrls: ['./mfw-ratings-renderer.component.css'],
})
export class MfwRatingsRendererComponent implements ICellRendererAngularComp {
  params: any;
  constructor() {}

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
  }
}
