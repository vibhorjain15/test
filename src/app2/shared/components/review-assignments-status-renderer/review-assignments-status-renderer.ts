import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import {
  responseStatus,
  reviewStatusMap,
} from '../../constants/constant';
import { ReviewType } from 'src/app2/modules/questionnaire/constants/question-status.constant';

@Component({
  selector: 'app-review-assignments-status-renderer',
  templateUrl: './review-assignments-status-renderer.html',
  styleUrls: ['./review-assignments-status-renderer.css'],
})
export class reviewAssignmentsStatusRenderer
  implements ICellRendererAngularComp
{
  params;
  percentage_completed: number;
  reviewStatus = reviewStatusMap;
  constructor() {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
    if (this.params.node.group) {
      this.percentage_completed = this.getPercentageCompleted();
    }
  }

  getPercentageCompleted() {
    const total_questions_count = this.params.node.childrenAfterGroup.length;
    let total_answered_count = this.params.node.childrenAfterGroup.filter(
      (x) => x.data.status === responseStatus.REVIEWSUCCESS
    ).length;
    // Added logic to include rejected responses as completed
    if (
      this.params.node.childrenAfterGroup[0].data.review_type ===
      ReviewType.Evaluation
    ) {
      total_answered_count += this.params.node.childrenAfterGroup.filter(
        (x) => x.data.status == responseStatus.REVIEWFAILED
      ).length;
    }
    return Math.round((100 * total_answered_count) / total_questions_count);
  }
}
