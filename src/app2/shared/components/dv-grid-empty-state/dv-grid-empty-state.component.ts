import { Component } from '@angular/core';
import { INoRowsOverlayAngularComp } from 'ag-grid-angular';
import { INoRowsOverlayParams } from 'ag-grid-community';

@Component({
  selector: 'dv-grid-empty-state',
  templateUrl: './dv-grid-empty-state.component.html',
  styleUrls: ['./dv-grid-empty-state.component.css'],
})
export class DvGridEmptyStateComponent implements INoRowsOverlayAngularComp {
  params!: INoRowsOverlayParams<any, any> & {
    canAllowDocumentUpload: () => boolean;
    openDocumentUploadModal: () => void;
  };
  canShowDocumentUpload: boolean = false;

  agInit(params: INoRowsOverlayParams<any, any>): void {
    this.params = params as any;
    this.canShowDocumentUpload = this.params?.canAllowDocumentUpload();
  }

  openDocumentUploadModal(): void {
    if (this.params?.canAllowDocumentUpload()) {
      this.params?.openDocumentUploadModal();
    }
  }
}
