import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-groupable-group-name',
  templateUrl: './groupable-group-name.component.html',
  styleUrls: ['./groupable-group-name.component.css'],
})
export class GroupableGroupNameComponent implements ICellRendererAngularComp {
  params: any;
  constructor() {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
  }
  displayDocumentGroupName(documentList) {
    return documentList?.length ? documentList?.join(',') : 'Ungrouped';
  }
}
