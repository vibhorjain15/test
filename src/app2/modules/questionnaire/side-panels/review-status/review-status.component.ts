import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { QuestionAttributeType } from '../../types/questions.type';
import {
  AssignReviewDefinition,
} from 'src/app2/shared/models/review-definitions.model';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { Select } from '@ngxs/store';
import { QuestionState } from '../../store/questionnaire.state';
import { Subscription } from 'rxjs';
import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import { UtilsService } from 'src/app2/services/utils.service';
import { responseStatus } from 'src/app2/shared/constants/constant';

@Component({
  selector: 'app-review-status',
  templateUrl: './review-status.component.html',
  styleUrls: ['./review-status.component.css'],
})
export class ReviewStatusComponent implements OnInit, OnDestroy {
  @Input() assignment: AssignReviewDefinition;
  @Input() question: QuestionAttributeType;
  @Input() diligence: DiligenceType;
  isFree: boolean;
  @Select(QuestionState.getAssignments) assignmentsData;
  subscription: Subscription;
  buttonLoader: boolean;

  constructor(
    private readonly sidePanel: SidePanelService,
    private readonly newModal: CustomModalService,
    private readonly utils: UtilsService
  ) {}

  ngOnInit(): void {
    this.subscription = this.assignmentsData.subscribe((assignment) => {
      let reviewAssignment = JSON.parse(
        JSON.stringify(assignment[this.question.answer.id])
      );
      if (reviewAssignment?.steps?.length > 1) {
        reviewAssignment.steps.sort((step1, step2) =>
          step1.order < step2.order ? -1 : 1
        );
      }
      this.assignment = reviewAssignment;
    });

    this.isFree = this.utils.isFreeSubscription();
  }

  onSidePanelCancel() {
    this.sidePanel.close();
  }

  handleEditReview() {
    this.newModal.invoke('assign-reviewer', {
      initialState: {
        type: 'Question',
        newDefinition: JSON.parse(JSON.stringify(this.assignment)),
        response: this.question.answer,
        question: this.question,
        deleteButtonDisabled:
          this.utils.checkForTrackChanges(
            this.question.answer.attributes?.currentResponse
          ) || this.question.answer.attributes.showTrackChangeButtons,
        success: (response) => {
          if (response === 'delete')
            this.question.answer.attributes.response_status =
              responseStatus.STARTED;
          else
            this.question.answer.attributes.response_status =
              responseStatus.INREVIEW;
        },
      },
      class: 'modal-lg',
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
