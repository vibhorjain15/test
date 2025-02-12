import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-excel-sync-upload-action',
  templateUrl: './excel-sync-upload-action.component.html',
  styleUrls: ['./excel-sync-upload-action.component.css'],
})
export class ExcelSyncUploadActionComponent
  implements ICellRendererAngularComp
{
  params;
  constructor() {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
  }
  dropped(file) {
    let allFiles = [];
    file.map((val) => {
      val.fileEntry.file((file) => {
        allFiles.push(file);
      });
    });
    this.params.clickedUpload({
      transaction_id: this.params.data.id,
      files: allFiles,
    });
  }
}
