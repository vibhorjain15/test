import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-report-type-cell-renderer',
  templateUrl: './report-type-cell-renderer.component.html',
  styleUrls: ['./report-type-cell-renderer.component.css']
})
export class ReportTypeCellRendererComponent implements ICellRendererAngularComp {
  params;
  constructor() {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
  }
}
