import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { saveAs } from 'file-saver';
import { DownloadStatus } from '../../constants/constant';

@Component({
  selector: 'app-my-downloads-filename-renderer',
  templateUrl: './my-downloads-filename-renderer.component.html',
})
export class MyDownloadFileNameRenderer implements ICellRendererAngularComp {
  params;
  filename;
  downloadStatus = DownloadStatus;
  constructor(private readonly http: HttpClient) {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.filename = this.params?.data?.filename;
  }

  downloadFile() {
    let file_data = this.params?.data?.file_data;
    let task_id = this.params?.data?.task_id;
    file_data.forEach((file) => {
      this.http
        .post(
          'service/dvapi_service/download_task_file',
          {
            task_id: task_id,
            file_id: file.file_id,
          },
          { responseType: 'blob' }
        )
        .subscribe((response: any) => {
          saveAs(response, file.file_name);
          this.params.updateDownloadedOn(this.params.data);
        });
    });
  }
}
