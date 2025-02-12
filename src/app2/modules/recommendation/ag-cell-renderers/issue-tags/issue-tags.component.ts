import {
  Component,
} from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'issue-tags',
  templateUrl: './issue-tags.component.html',
  styleUrls: ['./issue-tags.component.css'],
})
export class IssueTagsComponent implements ICellRendererAngularComp {
  label: any[] = [];
  tooltip: any;

  constructor() {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.label = params?.data?.AllTags;
    let tagnames = [];
    if (params?.data?.tags) {
      params?.data?.tags.forEach((element, index) => {
        if (index > 1) {
          tagnames.push(element.name);
        }
      });
    }
    this.tooltip = tagnames.toString();
  }
}
