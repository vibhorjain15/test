import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { responseStatus } from '../../constants/constant';

@Component({
  selector: 'app-review-name-renderer',
  templateUrl: './review-name-renderer.component.html',
  styleUrls: ['./review-name-renderer.component.css'],
})
export class ReviewNameRendererComponent implements ICellRendererAngularComp {
  params;
  showCaution;
  constructor() {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
    const currDate = new Date();
    const hasOverDue = params.node.childrenAfterGroup?.find(
      (x) =>
        new Date(x.data.due_date) <= currDate &&
        x.data.status === responseStatus.INREVIEW
    );
    this.showCaution = hasOverDue;
  }
}
