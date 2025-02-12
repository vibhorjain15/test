import { Component, Input } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'my-work-row-badge',
  templateUrl: './my-work-row-badge.component.html',
  styleUrls: ['./my-work-row-badge.component.css'],
})
export class MyWorkRowBadgeComponent implements ICellRendererAngularComp {
  isNew = false;
  text = '';
  url=''
  params
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params
    let isNew = false;
    if (params?.data?.myWorkProject) {
      if (params?.data?.projectType == 'followups')
        isNew = params?.data?.followupIsNew;
      if (params?.data?.projectType == 'questions') {
        isNew = params?.data?.questionsIsNew;
      }
      if (params?.data?.projectType == 'reviews') {
        isNew = params?.data?.reviewIsNew;
      }
      if (params?.data?.projectType == 'todos') {
        isNew = params?.data?.toDoIsNew;
      }
      if (params?.data?.projectType == 'flags') {
        isNew = params?.data?.flagIsNew;
      }
      if (params?.data?.projectType == 'completed') {
        isNew = params?.data?.completedIsNew;
      }
      if (params?.data?.projectType == "total") {
        isNew = params?.data?.totalIsNew;
      }
    }
    if (params?.node.group) {
      if(params?.colDef?.colId == params?.node?.field )
        this.text = params?.node?.key;
    } else {
      this.isNew = params?.data?.myWorkProject ? isNew : params?.data?.isNew;
      this.text = params?.data?.myWorkProject
        ? params?.data?.entity_name
        : params?.data?.text;
      this.url = params?.data?.redirectUrl
    }
  }
}
