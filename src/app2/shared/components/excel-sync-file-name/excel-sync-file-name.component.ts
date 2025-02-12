import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { RouterService } from 'src/app2/services/router.service';

@Component({
  selector: 'app-excel-sync-file-name',
  templateUrl: './excel-sync-file-name.component.html',
  styleUrls: ['./excel-sync-file-name.component.css'],
})
export class ExcelSyncFileNameComponent implements ICellRendererAngularComp {
  params;
  constructor(private readonly routerService: RouterService) {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
  }
  navigateToExcelDetail() {
    this.routerService.navigateWithParams('app.diligence.excel_sync.detail', {
      Id: this.params.data.id,
      sync_type: 'upload',
    });
  }
}
