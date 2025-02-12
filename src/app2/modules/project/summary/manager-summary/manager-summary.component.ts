import { HttpClient } from '@angular/common/http';
import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  Output,
  EventEmitter,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize, takeUntil } from 'rxjs/operators';
import { ProjectSummaryService } from 'src/app2/services/project-summary.service';
import { RouterService } from 'src/app2/services/router.service';
import { DueDiligenceDataService } from 'src/app2/services/duediligence-data-service';
import {
  diligenceStatusConstant,
  keywordConstants,
} from 'src/app2/shared/constants/constant';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { Subject, Subscription } from 'rxjs';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { Select, Store } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take, tap } from 'rxjs/operators';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { AssignReviewerService } from 'src/app2/modules/questionnaire/modals/assign-reviwer/assign-reviewer.service';
import {
  GetReviewers,
  UpdateDiligenceData,
} from 'src/app2/modules/questionnaire/store/questionnaire.action';
import { reviewStartedForUserHelper } from 'src/app2/modules/questionnaire/util/question-header.util';
import {
  IDVActionList,
  IDVActionListItem,
} from 'src/app2/shared/components/dv-action-list/dv-action-list.model';
import { QuestionState } from 'src/app2/modules/questionnaire/store/questionnaire.state';
import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import { ProjectStatusService } from 'src/app2/services/project-status.service';
import { UtilsService } from 'src/app2/services/utils.service';
@Component({
  selector: 'app-manager-summary',
  templateUrl: './manager-summary.component.html',
  styleUrls: ['./manager-summary.component.css'],
})
export class ManagerSummaryComponent implements OnInit, OnDestroy {
  diligenceId: number;
  diligenceTypeId: number;
  is_admin: boolean;
  is_freeSubscription: boolean;
  current_user: any;
  canStartReview: boolean;
  reviewStartedForUser: boolean;
  diligence: DiligenceType | any;
  diligenceStatusConstant = diligenceStatusConstant;
  keywordConstants = keywordConstants;
  related_diligences: any[];
  customFields: any[];
  functions: any[];
  conversations: any[];
  diligenceIds: string;
  canFinishDD: boolean;
  canApproveDD: boolean;
  canDeleteDD: boolean;
  mandatoryUnansweredCount: number;
  wipCount: number;
  totalReviewPending: number;
  totalReviewFailed: number;
  unansweredCount: number;
  totalTrackChangesCount: number;
  totalReviewAssignmentPending: number;
  totalRatingTrackChangesCount: number;
  totalRatingReviewPending: number;
  totalRatingReviewAssignmentPending: number;
  totalRatingReviewFailed: number;
  totalUnResolvedComments: number;
  unsubmittedResponsesAfterCompletionCount: number;
  @ViewChild('followupForm') form: NgForm;
  saving_notes: boolean;
  subscribers: any[];
  exitingSubscribers: any[];
  is_smartSubscription: boolean;
  approving_dd: boolean = false;
  disapproving_dd: boolean = false;
  restarting_dd: boolean = false;
  minDate: Date;
  canRestartDD: boolean;
  subscription: Subscription;
  issueTrackerDefaultName: string;
  firmPreferences;
  questionCountLoader: boolean = true;
  dvActionList: IDVActionList;
  ngUnsubscribe = new Subject();
  reviewerDetails: any = {};
  @Select(UserState.getCurrentUserData) user;
  @Select(UserState.getFirmPreferenceData) firmPref;
  @Select(QuestionState.getReviewers) reviewers;
  @Output() reviewerAssigned = new EventEmitter<boolean>();

  dropdownItems: Array<any> = [];
  toggleDropdown = false;
  constructor(
    private readonly route: RouterService,
    private readonly http: HttpClient,
     private readonly Utils: UtilsService,
    private readonly projectSummaryService: ProjectSummaryService,
    private readonly CustomModalFactory: CustomModalService,
    private readonly toaster: ToastrService,
    private readonly DueDiligenceDataService: DueDiligenceDataService,
    private readonly SweetAlert: SweetAlertService,
    private readonly store: Store,
    private readonly baseDataService: BaseDataService,
    private readonly reviewService: AssignReviewerService,
    public projectStatus: ProjectStatusService
  ) {}

  ngOnInit(): void {
    this.diligenceId = parseInt(this.route.getState().params.diligenceId);
    this.diligenceTypeId = 1105;
    this.canStartReview = false;
    this.reviewStartedForUser = false;
    this.minDate = new Date();

    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.current_user = data;
          this.is_admin = data.isAdmin;
          this.is_freeSubscription = data.isFreeSubscription;
          this.is_smartSubscription = data.isSmartSubscription;
          this.getSummaryData();
        }
      });

    this.reviewers
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((response: any) => {
        this.reviewerDetails = response;
        if (!!this.diligence) {
          this.buildActionListItems();
        }
      });
  }

  getSummaryData() {
    this.projectSummaryService
      .getCurrentDiligence(this.diligenceId, this.current_user)
      .subscribe((diligence: any) => {
        this.diligence = diligence;
        this.setDiligenceRelatedProperties();
        if (this.diligence.entity_type !== this.keywordConstants.Firm) {
          this.getRelatedDiligences();
        }
        this.setActionFlags();

        this.projectSummaryService
          .getFollowUps(this.diligenceId, 'Duediligence')
          .subscribe((responses: any) => {
            this.conversations = responses;
          });

        this.getMandatoryQuestionCounts();
        this.getCustomFields();
        this.getFirmPref();
        this.getMyFunctions();
        this.subscribeToLoadLatestDiligence();
        this.buildActionListItems();
      });
  }

  subscribeToLoadLatestDiligence() {
    this.subscription =
      this.projectSummaryService.loadLatestDiligence$.subscribe(() => {
        this.projectSummaryService
          .getCurrentDiligence(this.diligenceId, this.current_user)
          .subscribe((diligence: any) => {
            this.diligence = diligence;
            this.setDiligenceRelatedProperties();
            this.setActionFlags();
            this.buildActionListItems();
          });
      });
  }

  getRelatedDiligences() {
    this.projectSummaryService
      .getRelatedDiligences(this.diligenceId)
      .subscribe((response: any) => {
        this.related_diligences = response;
      });
  }

  setDiligenceRelatedProperties() {
    if (this.diligence.is_internal) {
      if (this.diligence.status === this.diligenceStatusConstant.COMPLETED) {
        this.canStartReview = this.diligence.postsubmission_review_enabled;
      } else {
        this.canStartReview = this.diligence.presubmission_review_enabled;
      }
      if (
        this.diligence.status ===
        this.diligenceStatusConstant.PRECOMPLETIONREVIEW
      ) {
        this.reviewStartedForUser = this.diligence.presubmission_review_enabled;
      } else {
        this.reviewStartedForUser =
          this.diligence.postsubmission_review_enabled;
      }
      if (this.firmPreferences) {
        this.diligence.review_mandatory =
          this.firmPreferences.review_workflow_mandatory_for_internal_diligence;
      }
    } else {
      if (this.current_user.firmInfo.id === this.diligence.fromfirm_id) {
        this.canStartReview = this.diligence.postsubmission_review_enabled;
        if (
          this.diligence.status ===
          this.diligenceStatusConstant.POSTCOMPLETIONREVIEW
        ) {
          this.reviewStartedForUser = true;
        }
      } else if (this.current_user.firmInfo.id === this.diligence.tofirm_id) {
        this.canStartReview = this.diligence.presubmission_review_enabled;
        if (
          this.diligence.status ===
          this.diligenceStatusConstant.PRECOMPLETIONREVIEW
        ) {
          this.reviewStartedForUser = true;
        }
      }
      if (this.firmPreferences) {
        this.diligence.review_mandatory =
          this.firmPreferences.review_workflow_mandatory_for_external_diligence;
      }
    }
  }

  getCustomFields() {
    const payload = {
      entity_id: this.diligenceId,
      entity_type: this.diligenceTypeId,
      schema_type: 'duediligence',
      sub_entity_id: 0,
    };
    this.projectSummaryService
      .getCustomFields(payload)
      .subscribe((response: any) => {
        this.customFields = response.data;
      });
  }

  manageCustomFields() {
    this.CustomModalFactory.invoke('manage-custom-fields', {
      initialState: {
        entityTypeId: this.diligenceTypeId,
        entityType: 'duediligence',
        entityId: this.diligenceId,
        customFields: JSON.parse(JSON.stringify(this.customFields || {})),
        customUrl: 'project_tags',
        response: (response: { data: any }) => {
          this.customFields = response.data;
        },
      },
      class: 'gray modal-lg',
    });
  }

  changeDDStatus(status: string) {
    if (
      ['Approved', 'NotApproved'].includes(status) &&
      this.totalReviewPending > 0
    ) {
      return;
    }
    const loader_property = {
      Restarted: 'restarting_dd',
      Approved: 'approving_dd',
      NotApproved: 'disapproving_dd',
    };
    this[loader_property[status]] = true;
    this.DueDiligenceDataService.setStatus(this.diligenceId, status).subscribe(
      (response: any) => {
        let message: string;
        this[loader_property[status]] = false;
        switch (response.status) {
          case 'Started':
            message = 'Project re-started successfully!';
            break;
          case 'PendingRestart':
            message = 'Restart request has been sent to the investor';
            break;
          case 'Approved':
            message = 'Project is approved successfully!';
            break;
          case 'NotApproved':
            message = 'Project is not approved at this time';
            break;
        }
        this.buildActionListItems();
        this.toaster.success(message);
        this.redirectToProjectsGrid();
      }
    );
  }

  getFirmPref() {
    this.firmPref.pipe(take(2)).subscribe((response) => {
      if (response) {
        this.firmPreferences = response;
        if (this.diligence && this.diligence.is_internal) {
          this.diligence.review_mandatory =
            response.review_workflow_mandatory_for_internal_diligence;
        } else if (this.diligence) {
          this.diligence.review_mandatory =
            response.review_workflow_mandatory_for_external_diligence;
        }
        this.issueTrackerDefaultName = response.issue_tracker_default_name;
      }
    });
  }

  setActionFlags() {
    const internal_only = this.diligence.is_internal;
    this.canRestartDD =
      this.diligence.is_internal &&
      (this.diligence.status === 'Approved' ||
        this.diligence.status === 'Completed' ||
        this.diligence.status === 'NotApproved');
    this.canApproveDD =
      internal_only &&
      ((this.diligence.status === 'Completed' && !this.canStartReview) ||
        this.diligence.status ===
          this.diligenceStatusConstant.POSTCOMPLETIONREVIEW)
        ? true
        : false;

    if (
      !{
        Started: true,
        ExtensionRequested: true,
        Followup: true,
        PendingRestart: true,
        InReview: true,
      }[this.diligence.status] ||
      (!!this.canStartReview &&
        this.diligence.status !==
          this.diligenceStatusConstant.PRECOMPLETIONREVIEW)
    ) {
      this.canFinishDD = false;
    } else {
      this.canFinishDD =
        !this.diligence.isReadOnly && !this.diligence.alwaysOpen;
    }
  }

  getMandatoryQuestionCounts() {
    this.projectSummaryService
      .getQuestionCounts(this.diligenceId)
      .pipe(finalize(() => (this.questionCountLoader = false)))
      .subscribe((response: any) => {
        response.forEach((count_info: { id: any; value: any }) => {
          switch (count_info.id) {
            case 'MandatoryUnansweredTotal':
              this.mandatoryUnansweredCount = count_info.value;
              break;
            case 'WipTotal':
              this.wipCount = count_info.value;
              break;
            case 'TotalReviewPending':
              this.totalReviewPending = count_info.value;
              break;
            case 'ReviewFailed':
              this.totalReviewFailed = count_info.value;
              break;
            case 'UnAnsweredTotal':
              this.unansweredCount = count_info.value;
              break;
            case 'WithTrackChangesCount':
              this.totalTrackChangesCount = count_info.value;
              break;
            case 'TotalReviewerAssignmentPending':
              this.totalReviewAssignmentPending = count_info.value;
              break;
            case 'WithRatingTrackChangesCount':
              this.totalRatingTrackChangesCount = count_info.value;
              break;
            case 'RatingReviewpendingCount':
              this.totalRatingReviewPending = count_info.value;
              break;
            case 'RatingAssignmentpendingCount':
              this.totalRatingReviewAssignmentPending = count_info.value;
              break;
            case 'RatingReviewFailed':
              this.totalRatingReviewFailed = count_info.value;
              break;
            case 'TotalUnresolvedCommentsCount':
              this.totalUnResolvedComments = count_info.value;
              break;
            case 'UnsubmittedResponsesAfterCompletionCount':
              this.unsubmittedResponsesAfterCompletionCount = count_info.value;
              break;
          }
        });

        this.buildActionListItems();
      });
  }

  getMyFunctions() {
    let params: { entity_type: any; entity_id: any };
    if (this.diligence.entity_type === 'Review') {
      params = {
        entity_type: this.keywordConstants.Project,
        entity_id: this.diligence.id,
      };
    } else {
      params = {
        entity_type: this.diligence.entity_type,
        entity_id: this.diligence.entity_id,
      };
    }
    this.projectSummaryService
      .getMyFunctions(params)
      .subscribe((response: any) => {
        this.functions = response;
        this.functions.map((x) => (x.id = x.function_id));
        this.getSubscribers();
      });
  }

  getSubscribers() {
    this.baseDataService
      .getFunctions()
      .subscribe((allFunctions: Array<any>) => {
        this.projectSummaryService
          .getSubscribers(this.diligenceId, this.diligenceTypeId, allFunctions)
          .subscribe((response: Array<any>) => {
            this.subscribers = response;
            this.exitingSubscribers = [...this.subscribers];
          });
      });
  }

  onSubscriberChanged(selection: Array<any>) {
    let result: any;
    if (this.exitingSubscribers.length < selection.length) {
      // subscriber is added
      result = selection.find((item: any) => {
        let index = this.exitingSubscribers.findIndex(
          (sub: any) => sub.id === item.id && sub.type === item.type
        );
        return index === -1;
      });
      this.addSubscriber(result);
    } else if (this.exitingSubscribers.length > selection.length) {
      // subscriber is removed
      result = this.exitingSubscribers.find((sub: any) => {
        let index = selection.findIndex(
          (item: any) => item.id === sub.id && item.type === sub.type
        );
        return index === -1;
      });
      this.removeSubscriber(result);
    }
  }

  getParamsForSubscriberChange(subscriber: any) {
    const params: any = {
      entity_id: this.diligenceId,
      entity_type: this.diligenceTypeId,
    };

    if (subscriber.type === 'function') {
      params.function_id = subscriber.id;
    } else {
      params.user_id = subscriber.id;
    }
    return params;
  }

  addSubscriber(subscriber: any) {
    const params = this.getParamsForSubscriberChange(subscriber);
    const message = `${subscriber.fullName} is now subscribed`;
    this.projectSummaryService
      .addSubscriber(params)
      .subscribe((response: any) => {
        this.getSubscribers();
        this.toaster.success(message);
      });
  }

  removeSubscriber(subscriber: any) {
    const params = this.getParamsForSubscriberChange(subscriber);
    const message = `${subscriber.fullName} is unsubscribed from this project!`;

    this.projectSummaryService
      .removeSubscriber(params)
      .subscribe((response: any) => {
        this.getSubscribers();
        this.toaster.success(message);
      });
  }

  redirectToProjectsGrid() {
    this.route.navigateWithParams('app.diligence.projects.activity', {
      type: 'in-progress',
    });
  }

  resetForm() {
    this.form.reset();
  }

  saveFollowupResponse() {
    this.form.form.markAllAsTouched();
    if (this.form.invalid) return;
    if (this.form.valid) {
      this.saving_notes = true;
      const params = {
        text: this.form.value.new_followup_response,
        type: 'DiligenceFollowup',
        entity_id: this.diligenceId,
        entity_type: 'Duediligence',
      };

      this.projectSummaryService
        .saveFollowup(params)
        .pipe(finalize(() => (this.saving_notes = false)))
        .subscribe((response: any) => {
          const message = 'Your response was added!';
          this.conversations.push(response);
          this.toaster.success(message);
          this.resetForm();
        });
    }
  }

  viewHistory() {
    if (this.diligenceIds) {
      this.route.navigateWithParams('app.analyze.compare.due_diligences', {
        ids: this.diligenceIds,
      });
    }
  }

  openConfirmationforVerifier() {
    let confirmText =
      'This will change the project status to In Review/Evaluation and you can assign reviewers to the responses.';
    if (this.diligence.status !== this.diligenceStatusConstant.COMPLETED) {
      if (this.unansweredCount > 0) {
        confirmText = `There are ${this.unansweredCount} unanswered questions. This will change the project status to In Review/Evaluation and you can only assign reviewers to questions with responses.`;
      } else if (this.wipCount > 0) {
        confirmText = `There are ${this.wipCount} questions marked as draft. This will change the project status to In Review/Evaluation and you can only assign reviewers to questions with responses.`;
      }
    }
    this.SweetAlert.confirm({
      title:
        'Are you sure you want to start review/evaluation mode for this project?',
      text: confirmText,
      focusCancel: true,
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.startReview(resolve).subscribe();
        });
      },
    });
  }

  startReview(resolve) {
    this.reviewService.updateData(this.diligence, {
      currentUser: this.current_user,
    });
    return this.reviewService.startReviewProcess().pipe(
      tap((response: any) => {
        this.toaster.success('Review Started');
        this.diligence.status = response.status;
        this.store.dispatch(
          new UpdateDiligenceData({ status: response.status })
        );
        this.reviewStartedForUser = reviewStartedForUserHelper(
          this.diligence,
          this.current_user
        );
        this.buildActionListItems();
        this.openCopyVerifierModal();
      }),
      finalize(() => resolve())
    );
  }

  openCopyVerifierModal() {
    this.CustomModalFactory.invoke('assign-reviewer', {
      initialState: {
        diligence: this.diligence,
        success: (response) => {
          this.totalReviewPending = this.store.selectSnapshot(
            (state) =>
              state.questionnaire.questionCounts.find(
                (x) => x.id === 'TotalReviewerAssignmentPending'
              ).value
          );

          this.store.dispatch(new GetReviewers());
          this.reviewerAssigned.emit(true);
        },
      },
      class: 'modal-lg',
    });
  }

  triggerWorkflow() {
    if (!this.diligence.isLocked && !this.is_freeSubscription) {
      this.CustomModalFactory.invoke('trigger-workflow', {
        initialState: {
          entity_type: 'Duediligence',
          entity_id: this.diligenceId,
          name: this.diligence.name,
        },
      });
    }
  }

  openUpdateDiligenceModal() {
    this.CustomModalFactory.invoke('manage-diligence', {
      initialState: {
        diligence: this.diligence,
      },
    });
  }

  toggleReviewButton() {
    let canStartReview = !this.canStartReview;
    let params = { ...this.diligence };
    params.postsubmission_review_enabled = canStartReview;
    params.presubmission_review_enabled = canStartReview;
    this.http
      .put(`diligences/${this.diligence.id}/update_data`, params)
      .subscribe((response: any) => {
        this.canStartReview = canStartReview;
        this.diligence = params;
        this.setActionFlags();
        const message = `Review mode ${
          this.canStartReview ? 'Enabled' : 'Disabled'
        }`;
        this.toaster.success(message);
        this.buildActionListItems();
      });
  }

  trackByResponseId(index: number, element): number {
    return element.id;
  }

  requestRevision(status: string) {
    if (this.form.value.new_followup_response) {
      this.saveFollowupResponse();
    }
    this.changeDDStatus(status);
  }

  displayExtensionModal() {
    this.CustomModalFactory.invoke('extend-duedate', {
      initialState: {
        diligence: this.diligence,
      },
    });
  }

  handleActionList(event: IDVActionListItem): void {
    switch (event.key) {
      case 'start_review':
        this.openConfirmationforVerifier();
        break;
      case 'restart':
        this.openConfirmationModal('Restarted');
        break;
      case 'approve':
        this.openConfirmationModal('Approved');
        break;
      case 'not_approve':
        this.openConfirmationModal('NotApproved');
        break;
      case 'edit_due_date':
        this.displayExtensionModal();
        break;
      case 'start_workflow_process':
        this.triggerWorkflow();
        break;
      case 'toggle_review_workflow':
        this.toggleReviewButton();
        break;
      case 'add_reviewers':
        this.openCopyVerifierModal();
        break;
    }
  }

  buildActionListItems(): void {
    this.dvActionList = {
      context: this,
      moreOptionTooltip:
        'Request due date extension, view history, start workflow',
      actionItems: [
        {
          key: 'start_review',
          icon: 'analytics2',
          label: 'Start Review',
          isVisible:
            this.diligence.review_allowed &&
            !this.diligence.isLocked &&
            this.canStartReview &&
            {
              Started: true,
              ExtensionRequested: true,
              Followup: true,
              Completed: true,
            }[this.diligence.status] &&
            !this.diligence.alwaysOpen,
          isDisabled: !this.diligence.percentage_completed,
          tooltip: !this.diligence.percentage_completed
            ? 'No response added for review.'
            : 'Start review process.',
          isLoading: false,
        },
        {
          key: 'restart',
          icon: 'close',
          label: 'Restart',
          isVisible: this.canRestartDD,
          isDisabled: false,
          isLoading: false,
        },
        {
          key: 'approve',
          icon: 'thumbs-o-up',
          label: 'Approve',
          isDisabled: this.totalReviewPending > 0,
          isVisible:
            !(
              !this.canFinishDD &&
              !this.canApproveDD &&
              this.diligence.is_internal &&
              this.diligence.alwaysOpen
            ) && this.canApproveDD,
          tooltip:
            this.totalReviewPending > 0
              ? this.totalReviewPending +
                ' review(s) are open. Please close these before approving'
              : 'Accept this project. You will not be make any more edits, attach documents or change ratings',
          isLoading: this.approving_dd,
        },
        {
          key: 'not_approve',
          icon: 'thumbs-o-down',
          label: 'Not Approve',
          isDisabled: this.totalReviewPending > 0,
          isVisible:
            !(
              !this.canFinishDD &&
              !this.canApproveDD &&
              this.diligence.is_internal &&
              this.diligence.alwaysOpen
            ) && this.canApproveDD,
          tooltip:
            this.totalReviewPending > 0
              ? this.totalReviewPending +
                ' review(s) are open. Please close these before rejecting'
              : 'Mark as not approved',
          isLoading: this.disapproving_dd,
        },
        {
          key: 'edit_due_date',
          icon: 'calendar',
          label: this.diligence.is_internal
            ? 'Edit Due Date'
            : 'Request Extension',
          tooltip: 'Request extension or edit due date',
          isVisible:
            this.diligence.status !=
              diligenceStatusConstant.ExtensionRequested &&
            this.diligence.status != diligenceStatusConstant.Scheduled &&
            !this.diligence.isReadOnly &&
            !this.diligence.alwaysOpen &&
            !(this.diligence.isLocked || this.diligence.isCompleted),
          isDisabled: false,
          isLoading: false,
        },
        {
          key: 'start_workflow_process',
          icon: 'cogs',
          label: 'Start Workflow Process',
          tooltip: this.is_freeSubscription
            ? 'Upgrade your subscription to start using workflow.'
            : this.diligence.isLocked
            ? 'You cannot start a workflow in a closed project.'
            : 'Start a workflow process for your team to complete specific steps.',
          isVisible: !(this.diligence.isLocked || this.is_freeSubscription),
          isDisabled: false,
          isLoading: false,
        },
        {
          key: 'toggle_review_workflow',
          icon: 'analytics2',
          label: `${
            this.canStartReview ? 'Disable' : 'Enable'
          } Review Workflow`,
          tooltip: this.canStartReview
            ? ''
            : 'Assign or copy reviewers who can edit, comment, approve, or request revisions.',
          isVisible:
            this.diligence.review_allowed &&
            !this.diligence.isLocked &&
            !{ InReview: true, Evaluation: true }[this.diligence.status] &&
            !this.diligence.alwaysOpen &&
            !(this.diligence.review_mandatory && this.canStartReview),
          isDisabled: false,
          isLoading: false,
        },
        {
          key: 'add_reviewers',
          icon: 'add-user-2',
          label:
            this.reviewerDetails.reviewers &&
            this.reviewerDetails.reviewers.size > 0
              ? 'Add Reviewers'
              : 'Assign Reviewers',
          isVisible:
            !this.diligence.isLocked &&
            { InReview: true, Evaluation: true }[this.diligence.status] &&
            !this.diligence.alwaysOpen &&
            this.reviewStartedForUser,
          isDisabled: false,
          isLoading: false,
        },
      ],
    };
  }
  openConfirmationModal(status) {
    const data = {
      unsubmittedResponsesAfterCompletionCount:
        this.unsubmittedResponsesAfterCompletionCount,
      isInvestor: this.current_user.isInvestor,
    };
    let statusConfig = this.projectStatus.getStatusConfig(status, data);
    this.SweetAlert.confirm({
      title: statusConfig.confirmText,
      text: statusConfig.Subtext,
      confirmButtonText: statusConfig.confirmButtonText,
      focusCancel: true,
      showLoaderOnConfirm: true,
      preConfirm: () => {
        if (status == this.diligenceStatusConstant.Approved) {
          this.changeDDStatus('Approved');
        } else if (status == this.diligenceStatusConstant.NotApproved) {
          this.changeDDStatus('NotApproved');
        } else if (status == 'Restarted') {
          this.changeDDStatus('Restarted');
        }
      },
    });
  }
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.subscription?.unsubscribe();
  }

  onDropdownClick(dvDropdownEvent: any) {
    switch (dvDropdownEvent.key) {
      case 'calendar':
        this.displayExtensionModal();
        break;
      case 'cogs':
        this.triggerWorkflow();
        break;
      case 'analytics2':
        this.toggleReviewButton();
        break;
      case 'add-user-2':
        this.openCopyVerifierModal();
        break;
      case 'arrow-back':
        this.redirectToProjectsGrid();
        break;
      default:
        break;
    }
  }
}
