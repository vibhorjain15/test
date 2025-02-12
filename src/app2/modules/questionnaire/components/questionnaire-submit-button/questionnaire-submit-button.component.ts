import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { Subject, forkJoin } from 'rxjs';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import { ModalService } from 'src/app2/services/modal.service';
import { RouterService } from 'src/app2/services/router.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import {
  keywordConstants,
  QuestionnaireSuccessMessages,
} from 'src/app2/shared/constants/constant';
import { diligenceStatusConstant } from '../../constants/quick-view-headers.constant';
import { DvDraftService } from '../../service/draft.service';
import {
  GetQuestionCount,
  TriggerSilentReload,
  UpdateDiligenceData,
  UpdateDraftData,
} from '../../store/questionnaire.action';
import { StateDiligenceUpdateType } from '../../store/questionnaire.modal';
import { QuestionState } from '../../store/questionnaire.state';
import { getFinishToolTipText } from '../../util/questionnaire-submit-button.util';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { finalize, takeUntil } from 'rxjs/operators';
import { QuestionnaireStatusService } from '../../service/status.service';

@Component({
  selector: 'questionnaire-submit-button',
  templateUrl: './questionnaire-submit-button.component.html',
  styleUrls: ['./questionnaire-submit-button.component.css'],
})
export class QuestionnaireSubmitButtonComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() diligence: DiligenceType & StateDiligenceUpdateType;
  @Input() countMap;
  @Input() isReadonly;
  @Input() relatedDiligences;
  @Input() user;
  @Input() submittingRevisions: boolean = false;
  @Output() onBulkSubmitRevisions = new EventEmitter();
  submitText = 'Finish';
  title =
    'Are you ready to mark this as completed? This project will be locked, and you will not be able to make any more edits.';
  successMessage = QuestionnaireSuccessMessages.projectMarkedAsComplete;
  confirmButtonText = 'Yes, please complete';
  tooltip = '';
  isDisable = false;
  counterSub;
  isOrange = true;
  countObj: any = {};
  submitLoader: boolean;
  private ngUnsubscribe = new Subject<void>();
  @Select(QuestionState.getQuestionnaireCount) totalCounter;
  @Select(QuestionState.getDraftData) draftData;
  updatedDraftData: any;

  constructor(
    private modal: CustomModalService,
    private store: Store,
    private SweetAlert: SweetAlertService,
    private draftService: DvDraftService,
    private questionniare: QuestionnaireService,
    private toaster: ToastrService,
    private router: RouterService,
    private readonly status: QuestionnaireStatusService
  ) {}
  ngOnInit(): void {
    this.counterSub = this.totalCounter.subscribe((counter) => {
      if (counter) {
        let countTotal = {};
        counter.count?.forEach((count) => (countTotal[count.id] = count.value));
        this.countMap = countTotal;
        const { countObj, message } = getFinishToolTipText(
          this.diligence,
          this.countMap,
          this.submittingRevisions
        );
        this.tooltip = message;
        this.countObj = countObj;
        this.isDisableHelper();
      }
    });

    this.draftData
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(async (val) => {
        this.updatedDraftData = val;
        if (this.submittingRevisions) {
          if (val) {
            this.tooltip =
              'Please finalize the response before submitting to investor';
          }
          this.isDisableHelper();
        }
      });
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes?.diligence || changes?.countMap) &&
      (changes.diligence.currentValue !== changes.diligence.previousValue ||
        changes.countMap.currentValue !== changes.countMap.previousValue)
    ) {
      if (!changes.diligence.currentValue.is_internal) {
        this.submitText = 'Submit to Requestor';
        this.title =
          'Are you sure you want to submit this for requestor review? You will not be able to make any more edits.';
        this.successMessage =
          QuestionnaireSuccessMessages.sentToRequestForReview;
        this.confirmButtonText = 'Yes, please submit!';
      }
      const { countObj, message } = getFinishToolTipText(
        this.diligence,
        this.countMap,
        this.submittingRevisions
      );
      this.tooltip = message;
      this.countObj = countObj;
      this.isDisableHelper();
    }
  }

  ngOnDestroy(): void {
    this.counterSub.unsubscribe();
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  isDisableHelper() {
    this.isDisable =
      !(
        this.diligence.status == diligenceStatusConstant.Started ||
        this.diligence.status == diligenceStatusConstant.Followup ||
        this.diligence.status == diligenceStatusConstant.ExtensionRequested ||
        this.diligence.status == diligenceStatusConstant.InReview ||
        (this.submittingRevisions && !this.updatedDraftData)
      ) ||
      this.isReadonly ||
      this.countObj.mandatory_count > 0 ||
      this.countObj.wip_count > 0 ||
      this.countObj.totalTrackChangesCount > 0 ||
      (this.diligence.review_mandatory &&
        (this.countObj.totalReviewAssignmentPending > 0 ||
          this.countObj.totalReviewPending > 0 ||
          this.countObj.totalReviewFailed > 0)) ||
      this.countObj.totalRatingTrackChangesCount > 0 ||
      (this.diligence.review_mandatory &&
        (this.countObj.totalRatingReviewAssignmentPending > 0 ||
          this.countObj.totalRatingReviewPending)) ||
      this.countObj.totalRatingReviewFailed > 0 ||
      this.countObj.totalUnResolvedComments > 0 ||
      this.countObj.validationRequiredCount > 0;
  }

  submit() {
    if (!this.isDisable) {
      if (
        !this.submittingRevisions &&
        this.relatedDiligences &&
        this.relatedDiligences.length > 0 &&
        this.diligence.entity_type != keywordConstants.Vehicle
      ) {
        this.modal.invoke('view-related-projects', {
          initialState: {
            diligence: this.diligence,
            disabled: this.isDisable,
            user: this.user,
            disabledTooltip: this.tooltip,
          },
          class: 'modal-lg',
        });
      } else {
        this.hasUnsavedChanges();
      }
    }
  }

  hasUnsavedChanges() {
    if (this.draftService.getDraftCount()) {
      let title = 'Are you sure you want to submit? You have unsaved changes.';
      let cancelButtonText = 'Submit without saving';
      let confirmButtonText = 'Save & Submit';
      this.draftService.showCountAlert(
        () => {
          if (this.submittingRevisions) {
            this.bulkSubmitResponseRevisions();
          } else {
            this.changeDDStatus();
          }
        },
        () => {
          this.store.dispatch(new UpdateDraftData(null));
          if (this.submittingRevisions) {
            this.bulkSubmitResponseRevisions();
          } else {
            this.changeDDStatus();
          }
        },
        title,
        undefined,
        confirmButtonText,
        cancelButtonText
      );
    } else {
      this.showConfirmationAlert();
    }
  }

  bulkSubmitResponseRevisions(resolve = null) {
    this.submitLoader = true;
    this.questionniare
      .bulkSubmitResponseRevision(this.diligence.id)
      .pipe(
        finalize(() => {
          this.submitLoader = false;
          if (resolve) {
            resolve();
          }
        })
      )
      .subscribe(() => {
        this.store.dispatch(new GetQuestionCount()).subscribe(() => {
          this.onBulkSubmitRevisions.emit();
          this.toaster.success('Response revisions are submitted successfully');
        });
        this.store.dispatch(new TriggerSilentReload(Math.random()));
      });
  }

  showConfirmationAlert() {
    if (this.submittingRevisions) {
      this.SweetAlert.confirm({
        title:
          'Are you sure you want to submit the entire project and any revisions made back to the requestor?',
        text: 'After submitting, no further edits can be made unless additional follow-ups are initiated.',
        preConfirm: () => {
          return new Promise<void>((resolve) => {
            this.bulkSubmitResponseRevisions(resolve);
          });
        },
      });
      return;
    }

    let pct_complete =
      ((this.countMap['AnsweredTotal'] - this.countMap['WipTotal']) /
        this.diligence.question_count) *
      100;
    let messageText = '';

    if (pct_complete == 0)
      messageText =
        'Did you click this by mistake? You are yet to start answering.';
    else if (pct_complete < 50)
      messageText =
        'You have only partially completed this questionnaire, less than 50% of the questions, which is below industry average.';
    else if (pct_complete < 75)
      messageText =
        'Great effort in completing the questionnaire. Although, it is still less than 75% complete, and below industry average.';
    else if (pct_complete < 100)
      messageText =
        'You are almost there! Only a few % more, and you will be at 100%.';

    if (this.diligence.status == diligenceStatusConstant.InReview) {
      let reviewMessageText = '';
      if (this.countObj.totalReviewPending > 0)
        reviewMessageText += `You have ${this.countObj.totalReviewPending} reviews pending.`;
      if (this.countObj.totalReviewFailed > 0)
        reviewMessageText += ` ${this.countObj.totalReviewFailed} failed reviews.`;
      if (this.countObj.totalRatingReviewPending > 0)
        reviewMessageText += `${this.countObj.totalRatingReviewPending} rating reviews pending.`;
      if (this.countObj.responseCommentsCounts > 0)
        reviewMessageText += `${this.countObj.responseCommentsCounts} review comments pending to be resolved. All unresolved comments will be marked as resolved.`;
      messageText = reviewMessageText.length > 0 ? reviewMessageText : '';
    }

    this.SweetAlert.confirm({
      title: this.title,
      text: messageText,
      confirmButtonText: this.confirmButtonText,
      focusCancel: true,
      showLoaderOnConfirm: true,
      preConfirm: () => {
        this.changeDDStatus();
      },
    });
  }

  changeDDStatus() {
    let obs = [];
    this.submitLoader = true;

    obs.push(
      this.questionniare.updateDiligenceStatus(this.diligence.id, {
        status: 'Completed',
      })
    );
    let len = obs.length - 1;
    forkJoin(obs).subscribe(
      (res) => {
        this.toaster.success(this.successMessage);
        if (
          this.diligence.entity_type == keywordConstants.Vehicle &&
          this.diligence.linked_duediligence_id
        )
          this.router.navigateWithParams(
            'app.diligence.firms.funds.vehicles.project.summary',
            {
              fromfirmId: this.diligence.fromfirm_id,
              tofirmId: this.diligence.tofirm_id,
              fundId: this.diligence.parent_entity_id,
              vehicleId: this.diligence.entity_id,
              diligenceId: this.diligence.linked_duediligence_id,
            }
          );
        else if (this.diligence.is_internal) {
          this.store.dispatch(new UpdateDiligenceData(res[len]));
          this.store.dispatch(new GetQuestionCount());
          this.store.dispatch(new TriggerSilentReload(Math.random()));
        } else
          this.router.navigateWithParams('app.diligence.projects.activity', {
            type: 'in-progress',
          });
        this.SweetAlert.close();
        this.status.destroyVariablesUponExit();
        this.submitLoader = false;
      },
      (error) => {
        this.submitLoader = false;
      }
    );
  }
}
