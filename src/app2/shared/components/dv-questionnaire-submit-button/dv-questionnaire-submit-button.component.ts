import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { RouterService } from 'src/app2/services/router.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import {
  diligenceStatusConstant,
  keywordConstants,
  QuestionnaireSuccessMessages,
} from '../../constants/constant';
import { DueDiligenceDataService } from 'src/app2/services/duediligence-data-service';
import { finalize } from 'rxjs/operators';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';

@Component({
  selector: 'app-dv-questionnaire-submit-button',
  templateUrl: './dv-questionnaire-submit-button.component.html',
  styleUrls: ['./dv-questionnaire-submit-button.component.css'],
})
export class DvQuestionnaireSubmitButtonComponent implements OnInit, OnChanges {
  @Input() diligence: any;
  @Input() related_diligences: Array<any> = [];
  @Input() wipCount: number;
  @Input() mandatoryUnansweredCount: number;
  @Input() totalReviewFailed: number;
  @Input() totalReviewAssignmentPending: number;
  @Input() totalReviewPending: number;
  @Input() totalUnResolvedComments: number;
  @Input() totalTrackChangesCount: number;
  @Input() totalRatingReviewFailed: number;
  @Input() totalRatingReviewAssignmentPending: number;
  @Input() totalRatingTrackChangesCount: number;
  @Input() totalRatingReviewPending: number;
  @Input() readonly: boolean;
  @Input() user: any;
  @Input() diligence_status: string;
  @Input() review_mandatory: boolean;
  submitText: string;
  title: string;
  successMessage: string;
  confirmButtonText: string;
  keywordConstants = keywordConstants;
  diligenceStatusConstant = diligenceStatusConstant;
  responseCommentsCounts: number;
  btnClass: string = '';
  isFirstChange: boolean = true;

  constructor(
    private readonly customModalService: CustomModalService,
    private readonly SweetAlert: SweetAlertService,
    private readonly route: RouterService,
    private readonly toaster: ToastrService,
    private readonly DueDiligenceDataService: DueDiligenceDataService
  ) {}

  ngOnInit(): void {
    this.updateButtonClass();
    if (this.diligence.is_internal) {
      this.submitText = 'Finish';
      this.title =
        'Are you ready to mark this as completed? This project will be locked, and you will not be able to make any more edits.';
      this.successMessage =
        QuestionnaireSuccessMessages.projectMarkedAsComplete;
      this.confirmButtonText = 'Yes, please complete';
    } else {
      this.submitText = 'Submit to Requestor';
      this.title =
        'Are you sure you want to submit this for requestor review? You will not be able to make any more edits.';
      this.successMessage = QuestionnaireSuccessMessages.sentToRequestForReview;
      this.confirmButtonText = 'Yes, please submit!';
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.isFirstChange) {
      this.isFirstChange = false;
      return;
    }

    this.updateButtonClass();
  }

  getFinishButtonToolTipText() {
    let message = '';
    if (this.wipCount > 0 && this.mandatoryUnansweredCount > 0) {
      message =
        this.mandatoryUnansweredCount +
        ' Mandatory Question(s) Pending and ' +
        this.wipCount +
        ' question(s) marked as draft. Please resolve these before submitting.';
    } else if (this.wipCount > 0) {
      message =
        'You have ' +
        this.wipCount +
        ' questions marked as draft. Please finalize these before submitting.';
    } else if (this.mandatoryUnansweredCount > 0) {
      message =
        this.mandatoryUnansweredCount + ' Mandatory Question(s) Pending.';
    } else if (this.totalReviewFailed > 0) {
      message =
        this.totalReviewFailed +
        ' Review(s) Failed. Please resolve these before submitting.';
    } else if (
      this.diligence &&
      this.diligence.review_mandatory &&
      this.totalReviewAssignmentPending > 0
    ) {
      message =
        this.totalReviewAssignmentPending +
        ' Response(s) are not reviewed yet. Please review them before submitting.';
    } else if (
      this.diligence &&
      this.diligence.review_mandatory &&
      this.totalReviewPending > 0
    ) {
      message =
        this.totalReviewPending +
        ' Review(s) Pending. Please review these before submitting.';
    } else if (this.totalUnResolvedComments > 0) {
      message =
        this.totalUnResolvedComments +
        ' Response(s) have review comments. Please resolve these before submitting.';
    } else if (this.totalTrackChangesCount > 0) {
      message =
        this.totalTrackChangesCount +
        ' Response(s) have tracking changes. Please resolve these before submitting.';
    } else if (this.totalRatingReviewFailed > 0) {
      message =
        this.totalRatingReviewFailed +
        ' Rating Review(s) Failed. Please resolve these before submitting.';
    } else if (
      this.diligence &&
      this.diligence.review_mandatory &&
      this.totalRatingReviewAssignmentPending > 0
    ) {
      message =
        this.totalRatingReviewAssignmentPending +
        ' Rating Review(s) are not reviewed yet. Please review them before submitting.';
    } else if (
      this.diligence &&
      this.diligence.review_mandatory &&
      this.totalRatingReviewPending > 0
    ) {
      message =
        this.totalRatingReviewPending +
        ' Rating Review(s) Pending. Please review these before submitting.';
    } else if (this.totalRatingTrackChangesCount > 0) {
      message =
        this.totalRatingTrackChangesCount +
        ' Rating(s) have tracking changes. Please resolve these before submitting.';
    }
    return message;
  }

  submit() {
    if (
      !(
        !(
          this.diligence.status === 'Started' ||
          this.diligence.status === 'Followup' ||
          this.diligence.status === 'ExtensionRequested' ||
          this.diligence.status === 'InReview'
        ) ||
        this.readonly ||
        this.mandatoryUnansweredCount > 0 ||
        this.wipCount > 0 ||
        this.totalTrackChangesCount > 0 ||
        (this.diligence.review_mandatory &&
          (this.totalReviewAssignmentPending > 0 ||
            this.totalReviewPending > 0 ||
            this.totalReviewFailed > 0)) ||
        this.totalRatingTrackChangesCount > 0 ||
        (this.diligence.review_mandatory &&
          (this.totalRatingReviewAssignmentPending > 0 ||
            this.totalRatingReviewPending)) ||
        this.totalUnResolvedComments > 0
      )
    ) {
      if (
        this.related_diligences &&
        this.related_diligences.length > 0 &&
        this.diligence.entity_type !== this.keywordConstants.Vehicle
      ) {
        this.openRelatedVehiclesModal();
      } else {
        this.hasUnsavedChanges();
      }
    }
  }

  openRelatedVehiclesModal() {
    const disabled =
      !(
        this.diligence.status === 'Started' ||
        this.diligence.status === 'Followup' ||
        this.diligence.status === 'ExtensionRequested' ||
        this.diligence.status === 'InReview'
      ) ||
      this.readonly ||
      this.mandatoryUnansweredCount > 0 ||
      this.wipCount > 0 ||
      this.totalTrackChangesCount > 0 ||
      (this.diligence.review_mandatory &&
        (this.totalReviewAssignmentPending > 0 ||
          this.totalReviewPending > 0 ||
          this.totalReviewFailed > 0)) ||
      this.totalRatingTrackChangesCount > 0 ||
      (this.diligence.review_mandatory &&
        (this.totalRatingReviewAssignmentPending > 0 ||
          this.totalRatingReviewPending)) ||
      this.totalRatingReviewFailed > 0;

    this.customModalService.invoke('view-related-projects', {
      initialState: {
        diligence: this.diligence,
        disabled,
        user: this.user,
        disabledTooltip: this.getFinishButtonToolTipText(),
      },
      class: 'modal-lg',
    });
  }

  hasUnsavedChanges() {
    // unsaved_count > 0 code needs to be added after questionnaire resdesign as it is for that page only
    // if(unsaved_count > 0) { .... }
    this.showConfirmationAlert();
  }

  showConfirmationAlert() {
    const pct_complete = this.diligence.percentage_completed;
    let messageText = '';
    if (pct_complete === 0) {
      messageText =
        'Did you click this by mistake? You are yet to start answering.';
    } else if (pct_complete < 50) {
      messageText =
        'You have only partially completed this questionnaire, less than 50% of the questions, which is below industry average.';
    } else if (pct_complete < 75) {
      messageText =
        'Great effort in completing the questionnaire. Although, it is still less than 75% complete, and below industry average.';
    } else if (pct_complete < 100) {
      messageText =
        'You are almost there! Only a few % more, and you will be at 100%.';
    }

    if (
      this.diligence.status === this.diligenceStatusConstant.PRECOMPLETIONREVIEW
    ) {
      let reviewMessageText = '';
      if (this.totalReviewPending > 0) {
        reviewMessageText +=
          'You have ' + this.totalReviewPending + ' reviews pending.';
      }
      if (this.totalReviewFailed > 0) {
        reviewMessageText += this.totalReviewPending + ' failed reviews. ';
      }
      if (this.totalRatingReviewPending > 0) {
        reviewMessageText +=
          this.totalRatingReviewPending + ' rating reviews pending.';
      }
      if (this.responseCommentsCounts > 0) {
        reviewMessageText +=
          this.responseCommentsCounts +
          ' review comments pending to be resolved. All unresolved comments will be marked as resolved.';
      }
      if (reviewMessageText.length > 0) {
        messageText = reviewMessageText;
      }
    }

    if (
      this.diligence.status ===
        this.diligenceStatusConstant.PRECOMPLETIONREVIEW &&
      (this.totalReviewPending > 0 ||
        this.totalReviewFailed > 0 ||
        this.totalRatingReviewPending > 0)
    ) {
      this.title =
        'Are you sure you want to cancel review and mark this project as completed? You will not be able to make any more edits.';
      this.confirmButtonText = 'Yes, please cancel';
    }

    this.SweetAlert.confirm({
      title: this.title,
      text: messageText,
      confirmButtonText: this.confirmButtonText,
      focusCancel: true,
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.changeDDStatus(resolve);
        });
      },
    });
  }

  changeDDStatus(resolve) {
    const id = this.diligence.id;

    this.updateStatusAndRedirect(id, resolve);
  }

  updateStatusAndRedirect(id, resolve) {
    this.DueDiligenceDataService.setStatus(id, 'Completed')
      .pipe(finalize(() => resolve()))
      .subscribe(
        (response: any) => {
          this.toaster.success(this.successMessage);
          if (
            this.diligence.entity_type === this.keywordConstants.Vehicle &&
            this.diligence.linked_duediligence_id
          ) {
            this.route.navigateWithParams('app.diligence.project.summary', {
              diligenceId: this.diligence.linked_duediligence_id,
            });
          } else if (this.diligence.is_internal) {
            this.route.reload();
          } else {
            this.route.navigateWithParams('app.diligence.projects.activity', {
              type: 'in-progress',
            });
          }
        },
        (error: { status: number; data: { message: any } }) => {
          if (error.status === 400) {
            this.SweetAlert.error({
              title: error.data.message,
              confirmButtonText: 'Okay',
            });
          }
        }
      );
  }

  private updateButtonClass(): void {
    this.btnClass = '';
    if (
      this.diligence_status == 'Started' ||
      this.diligence_status == 'Followup' ||
      this.diligence_status == 'ExtensionRequested' ||
      this.diligence_status == 'InReview'
    ) {
      this.btnClass = 'text-orange';
    }

    if (
      !(
        this.diligence_status == 'Started' ||
        this.diligence_status == 'Followup' ||
        this.diligence_status == 'ExtensionRequested' ||
        this.diligence_status == 'InReview'
      ) ||
      this.readonly ||
      this.mandatoryUnansweredCount > 0 ||
      this.wipCount > 0 ||
      this.totalTrackChangesCount > 0 ||
      (this.review_mandatory &&
        (this.totalReviewAssignmentPending > 0 ||
          this.totalReviewPending > 0 ||
          this.totalReviewFailed > 0)) ||
      this.totalRatingTrackChangesCount > 0 ||
      (this.review_mandatory &&
        (this.totalRatingReviewAssignmentPending > 0 ||
          this.totalRatingReviewPending)) ||
      this.totalRatingReviewFailed > 0 ||
      this.totalUnResolvedComments > 0
    ) {
      this.btnClass = 'disabled';
    }
  }
}
