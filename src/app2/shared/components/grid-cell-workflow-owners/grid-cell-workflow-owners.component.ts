import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'grid-cell-workflow-owners',
  templateUrl: './grid-cell-workflow-owners.component.html',
  styleUrls: ['./grid-cell-workflow-owners.component.css'],
})
export class WorkflowOwnersCellRendererComponent
  implements ICellRendererAngularComp
{
  avatars = [];
  params;
  name: string = '';
  isGrouped: boolean;
  isSelfGrouped: boolean;
  constructor() {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.isGrouped = params?.node?.group;
    this.isSelfGrouped = params?.node?.field == 'owner_name';
    this.params =
      this.isGrouped && this.isSelfGrouped
        ? this.params?.node?.childrenAfterGroup[0]
        : this.params;
    if (this.isSelfGrouped || !this.isGrouped) {
      this.avatars = [this.params?.data?.owner_avatar];
      let name = this.params?.data?.owner_name.split(' ');
      if (name.length > 1)
        this.name =
          name[0][0]?.toUpperCase() + name[name.length - 1][0]?.toUpperCase();
      else {
        this.name = this.params.data?.owner_name?.slice(0, 2)?.toUpperCase();
      }
    }
  }
}
