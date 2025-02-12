import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'report-list-action-cell',
  templateUrl: './report-list-action-cell.component.html',
  styleUrls: ['./report-list-action-cell.component.css'],
})
export class ReportListActionCellComponent implements ICellRendererAngularComp {
  params;
  constructor() {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
  }
  onEmail() {
    this.params.onEmail(this.params);
  }
  onDelete() {
    this.params.onDelete(this.params);
  }
  onDownload() {
    this.params.onDownload(this.params);
  }
  onDownloadExcelLog() {
    this.params.onDownloadExcelLog(this.params);
  }
}
