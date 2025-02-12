import { DatePipe } from '@angular/common';
import { Component, OnInit, Input } from '@angular/core';
import { ReviewStep } from 'src/app2/shared/models/review-definitions.model';
import { diligenceStatusConstant } from '../../../modules/questionnaire/constants/quick-view-headers.constant';
import { UtilsService } from 'src/app2/services/utils.service';
import { reviewStatusMap } from '../../constants/constant';

@Component({
  selector: 'multiple-reviewer-accordion',
  templateUrl: './multiple-reviewer-accordion.component.html',
  styleUrls: ['./multiple-reviewer-accordion.component.css'],
})
export class MultipleReviewerAccordionComponent implements OnInit {
  @Input() steps: ReviewStep[];
  @Input() diligence;
  activeId: number = 1;
  freeUser;
  reviewStatus = reviewStatusMap;
  diligenceStatusConstant = diligenceStatusConstant;
  isEvaluation: string;
  reviewRejected: any[] = [];
  constructor(
    public readonly datePipe: DatePipe,
    private utils: UtilsService
  ) {}

  ngOnInit(): void {
    this.activeId = this.steps.find(
      (step) => step.status === diligenceStatusConstant.InReview
    )?.order;
    if (!this.activeId) this.activeId = 1;
    this.freeUser = this.utils.isFreeSubscription();

    this.isEvaluation =
      this.diligence.status == this.diligenceStatusConstant.Evaluation
        ? 'Evaluation'
        : '';
  }
}
