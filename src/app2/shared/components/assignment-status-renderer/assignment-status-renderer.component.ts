import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-assignment-status-renderer',
  templateUrl: './assignment-status-renderer.component.html',
  styleUrls: ['./assignment-status-renderer.component.css'],
})
export class AssignmentStatusRendererComponent
  implements ICellRendererAngularComp
{
  params;
  percentage_completed: number;
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
    const total_answered_count = this.params.node.childrenAfterGroup.filter(
      (x) => x.data.status === 'Answered'
    ).length;
    return Math.round((100 * total_answered_count) / total_questions_count);
  }
}
