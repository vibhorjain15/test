import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import {
  FollowUpType,
  IssueType,
} from 'src/app2/shared/constants/constant';

@Component({
  selector: 'issue-tag',
  templateUrl: './issue-level-tag.component.html',
  styleUrls: ['./issue-level-tag.component.css'],
})
export class IssueLevelTagComponent implements ICellRendererAngularComp {
  @Input() label: string = '';
  params: any;
  constructor() {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    if (params && params.value) {
      this.params = params;
      let value = params.value.toLowerCase();
      if (
        value == IssueType.Project.toLowerCase() ||
        value == 'project'
      ) {
        this.label = 'Project';
      } else if (
        value == IssueType.Question.toLowerCase()
      ) {
        this.label = 'Question';
      } else if (value == FollowUpType.Question.toLowerCase()) {
        this.label = 'Response';
      } else if (value == IssueType.Firm.toLowerCase()) {
        this.label = 'Firm';
      } else if (
        value == IssueType.Product.toLowerCase() ||
        value == 'product'
      ) {
        this.label = 'Product';
      } else if (
        value == IssueType.Strategy.toLowerCase()
      ) {
        this.label = 'Strategy';
      } else if (
        value == IssueType.Vehicle.toLowerCase()
      ) {
        this.label = 'Vehicle';
      }
    }
  }
}
