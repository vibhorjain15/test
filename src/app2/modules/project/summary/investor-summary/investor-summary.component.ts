import { HttpClient } from '@angular/common/http';
import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { finalize, takeUntil } from 'rxjs/operators';
import { ProjectSummaryService } from 'src/app2/services/project-summary.service';
import { RouterService } from 'src/app2/services/router.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { DueDiligenceDataService } from 'src/app2/services/duediligence-data-service';
import {
  diligenceStatusConstant,
  keywordConstants,
} from 'src/app2/shared/constants/constant';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { Subject, Subscription } from 'rxjs';
import { Select, Store } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take, tap } from 'rxjs/operators';
import { BaseDataService } from 'src/app2/services/base-data.service';
import {
  GetReviewers,
  UpdateDiligenceData,
} from 'src/app2/modules/questionnaire/store/questionnaire.action';
import { reviewStartedForUserHelper } from 'src/app2/modules/questionnaire/util/question-header.util';
import { AssignReviewerService } from 'src/app2/modules/questionnaire/modals/assign-reviwer/assign-reviewer.service';
import {
  IDVActionList,
  IDVActionListItem,
} from 'src/app2/shared/components/dv-action-list/dv-action-list.model';
import { QuestionState } from 'src/app2/modules/questionnaire/store/questionnaire.state';
import { ProjectStatusService } from 'src/app2/services/project-status.service';
@Component({
  selector: 'app-investor-summary',
  templateUrl: './investor-summary.component.html',
  styleUrls: ['./investor-summary.component.css'],
})
export class InvestorSummaryComponent implements OnInit, OnDestroy {
  diligenceId: number;
  diligenceTypeId: number;
  is_admin: boolean;
  is_freeSubscription: boolean;
  current_user: any;
  canStartReview: boolean;
  reviewStartedForUser: boolean;
  diligence: any;
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
  customDateFilter: any;
  dateRangeForDirectives: any;
  @Output() reviewerAssigned = new EventEmitter<boolean>();

  dropdownItems = [];
  toggleDropdown = false;
  constructor(
    private readonly route: RouterService,
    private readonly Utils: UtilsService,
    private readonly http: HttpClient,
    private readonly projectSummaryService: ProjectSummaryService,
    private readonly CustomModalFactory: CustomModalService,
    private readonly toaster: ToastrService,
    private readonly DueDiligenceDataService: DueDiligenceDataService,
    private readonly SweetAlert: SweetAlertService,
    private readonly store: Store,
    private readonly baseDataService: BaseDataService,
    private readonly reviewService: AssignReviewerService,
    private readonly activatedRoute: ActivatedRoute,
    public projectStatus: ProjectStatusService
  ) {}

  ngOnInit(): void {
    this.getFirmPref();
    this.diligenceId = parseInt(this.route.getState().params.diligenceId);
    this.diligenceTypeId = 1105;
    this.canStartReview = false;
    this.reviewStartedForUser = false;

    this.user.pipe(take(1)).subscribe((data) => {
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

        this.projectSummaryService
          .fetchHistoricDDs(this.diligence.entity_id)
          .subscribe((response) => {
            this.diligenceIds = response;
            this.buildActionListItems();
          });

        this.setActionFlags();

        this.projectSummaryService
          .getFollowUps(this.diligenceId, 'Duediligence')
          .subscribe((responses: any) => {
            this.conversations = responses;
          });

        this.getMandatoryQuestionCounts();
        this.getMyFunctions();
        this.getCustomFields();
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

  trackByResponseId(index: number, element): number {
    return element.id;
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

  getFirmPref() {
    this.firmPref.pipe(take(2)).subscribe((response) => {
      if (response) {
        this.customDateFilter = this.Utils.getPredefinedDateRanges(
          response.default_daterange_months
        );
        if (!response.default_daterange_months) {
          this.dateRangeForDirectives = null;
        } else {
          this.dateRangeForDirectives = {
            startDate: this.Utils.formatDatetime(
              this.customDateFilter.startDate
            ),
            endDate: this.Utils.formatDatetime(this.customDateFilter.endDate),
            range: response?.default_daterange_months ?? 'null',
          };
        }

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

  setActionFlags() {
    const status = this.diligence.status;
    const internal_only = this.diligence.is_internal;
    const always_open = this.diligence.alwaysOpen;

    this.canFinishDD =
      internal_only &&
      ['Started', 'InReview'].includes(status) &&
      (!this.canStartReview ||
        this.diligence.status ===
          this.diligenceStatusConstant.PRECOMPLETIONREVIEW);

    if (internal_only) {
      this.canApproveDD =
        (status === 'Completed' && !this.canStartReview) ||
        status === this.diligenceStatusConstant.POSTCOMPLETIONREVIEW;
      this.canDeleteDD = true;
    } else {
      this.canApproveDD =
        this.diligence.isReadOnly &&
        !always_open &&
        (!this.canStartReview ||
          this.diligence.status ===
            this.diligenceStatusConstant.POSTCOMPLETIONREVIEW);
      this.canDeleteDD = status === 'Started';
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

  changeDDStatus(status: string) {
    const loader_property = {
      Restarted: 'restarting_dd',
      Approved: 'approving_dd',
      NotApproved: 'disapproving_dd',
    };
    this[loader_property[status]] = true;

    this.DueDiligenceDataService.setStatus(this.diligenceId, status).subscribe(
      (response: any) => {
        let type: string;
        this[loader_property[status]] = false;
        const action = {
          Started: 'started again',
          Restarted: 'started again',
          Approved: 'approved successfully!',
          NotApproved: 'not approved at this time',
        }[response.status];

        if (['Started', 'RestartApproved', 'Restarted'].includes(status)) {
          type = 'in-progress';
        } else {
          type = 'closed';
        }

        this.buildActionListItems();
        this.toaster.success('Due Diligence is ' + action);

        if (
          (this.is_freeSubscription || this.is_smartSubscription) &&
          status === 'Approved'
        ) {
          this.route.navigateWithParams('app.diligence.projects.activity', {
            type,
          });
          return;
        }

        switch (status) {
          case 'Approved':
            if (this.diligence.entity_type === this.keywordConstants.Product) {
              this.route.navigateWithParams('app.firms.funds.profile.monitor', {
                firmId: this.diligence.fromfirm_id,
                fundId: this.diligence.entity_id,
              });
            } else if (
              this.diligence.entity_type === this.keywordConstants.Strategy
            ) {
              this.route.navigateWithParams(
                'app.firms.strategies.profile.monitor',
                {
                  firmId: this.diligence.fromfirm_id,
                  strategyId: this.diligence.entity_id,
                }
              );
            } else if (
              this.diligence.entity_type === this.keywordConstants.Firm
            ) {
              this.route.navigateWithParams('app.firms.profile.monitor', {
                firmId: this.diligence.entity_id,
              });
            } else if (
              this.diligence.entity_type === this.keywordConstants.Vehicle
            ) {
              if (this.diligence.linked_duediligence_id) {
                this.route.navigateWithParams('app.diligence.project.summary', {
                  diligenceId: this.diligence.linked_duediligence_id,
                });
              } else {
                this.route.navigateWithParams(
                  'app.firms.funds.vehicles.profile.monitor',
                  {
                    firmId: this.diligence.fromfirm_id,
                    fundId: this.diligence.parent_entity_id,
                    vehicleId: this.diligence.entity_id,
                  }
                );
              }
            } else if (
              this.diligence.entity_type === this.keywordConstants.Review
            ) {
              this.route.navigateWithParams('app.diligence.projects.activity', {
                type,
              });
            }
            break;
          case 'NotApproved':
            this.redirectToNotApprovalReasons();
            break;
          default:
            this.route.navigateWithParams('app.diligence.projects.activity', {
              type,
            });
        }
      }
    );
  }

  exitAndChangeStatus(status: any) {
    this.changeDDStatus(status);
  }

  showRequestRevisionAlert() {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to unlock this project?',
      text: 'The managers will be able to update responses and will have to resubmit the project again.',
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
      focusCancel: true,
    }).then((isConfirm: { value: boolean }) => {
      if (isConfirm.value && isConfirm.value === true) {
        this.requestRevision();
      }
    });
  }

  requestRevision() {
    const validateResponse = false;
    this.saveFollowupResponse(validateResponse);
    this.changeDDStatus('Restarted');
  }

  resetForm() {
    this.form.reset();
  }

  saveFollowupResponse(validateResponse = true) {
    if (validateResponse) this.form.form.markAllAsTouched();
    if (this.form.invalid) return;
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

  formatDateTimeFormat(timeStamp: any) {
    return this.Utils.getLocalDateTime(timeStamp).format('MMM Do, YYYY h:mm a');
  }

  redirectToNotApprovalReasons() {
    this.route.navigateAngular('not_approval_reasons', {
      relativeTo: this.activatedRoute.parent,
    });
  }

  redirectToProjectsGrid() {
    this.route.navigateWithParams('app.diligence.projects.activity', {
      type: 'in-progress',
    });
  }

  viewHistory() {
    if (this.diligenceIds) {
      this.route.navigateWithParams('app.analyze.compare.due_diligences', {
        ids: this.diligenceIds,
        template_id: this.diligence.template_id,
      });
    }
  }

  openConfirmationforVerifier() {
    let confirmText =
      'This will change the project status to In Review/Evaluation and you can assign reviewers to the responses.';
    if (this.diligence.status !== this.diligenceStatusConstant.COMPLETED) {
      if (this.unansweredCount > 0) {
        confirmText = `There are ${this.unansweredCount} questions yet to answered. This will change the project status to In Review/Evaluation and you can only assign reviewers to questions with responses.`;
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

  displayDuedateExtensionModal() {
    this.CustomModalFactory.invoke('extend-duedate', {
      initialState: {
        diligence: this.diligence,
      },
    });
  }

  displayExtensionModal() {
    this.CustomModalFactory.invoke('approve-extension', {
      initialState: {
        diligence: this.diligence,
      },
    });
  }

  openUpdateDiligenceModal() {
    this.CustomModalFactory.invoke('manage-diligence', {
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
      case 'restart_internal':
      case 'restart_external':
        this.openConfirmationModal('Restarted');
        break;
      case 'approve_restart':
        this.changeDDStatus('RestartApproved');
        break;
      case 'view_extension_request':
        this.displayExtensionModal();
        break;
      case 'approve':
        this.openConfirmationModal('Approved');
        break;
      case 'not_approve':
        this.openConfirmationModal('NotApproved');
        break;
      case 'edit_due_date':
        this.displayDuedateExtensionModal();
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
      case 'view_history':
        this.viewHistory();
        break;
    }
  }

  buildActionListItems(): void {
    this.dvActionList = {
      context: this,
      moreOptionTooltip: 'View history, start workflow and more',
      actionItems: [
        {
          key: 'start_review',
          icon: 'analytics2',
          label: 'Start Review',
          isVisible:
            this.diligence.review_allowed &&
            !this.diligence.isLocked &&
            this.canStartReview &&
            { Started: true, PendingRestart: true, Completed: true }[
              this.diligence.status
            ] &&
            !this.diligence.alwaysOpen,
          isLoading: false,
          tooltip: !this.diligence.percentage_completed
            ? 'No response added for review.'
            : 'Start review process',
          isDisabled: !this.diligence.percentage_completed,
        },
        {
          key: 'restart_internal',
          icon: 'close',
          label: 'Restart',
          isVisible:
            this.diligence.is_internal &&
            (this.diligence.status == 'Approved' ||
              this.diligence.status == 'Completed' ||
              this.diligence.status == 'NotApproved'),
          isLoading: false,
          isDisabled: false,
        },
        {
          key: 'restart_external',
          icon: 'close',
          label: 'Restart',
          isVisible:
            !this.diligence.is_internal &&
            (this.diligence.status == 'Approved' ||
              this.diligence.status == 'NotApproved'),
          isLoading: false,
          isDisabled: false,
        },
        {
          key: 'approve_restart',
          icon: 'close',
          label: 'Approve Restart',
          isVisible: this.diligence.status == 'PendingRestart',
          isLoading: this.restarting_dd,
          isDisabled: false,
        },
        {
          key: 'view_extension_request',
          icon: 'clock-o',
          label: 'View Extension Request',
          isVisible: this.diligence.status == 'ExtensionRequested',
          isLoading: false,
          isDisabled: false,
        },
        {
          key: 'approve',
          icon: 'thumbs-o-up',
          label: 'Approve',
          isLoading: this.approving_dd,
          isDisabled: this.totalReviewPending > 0,
          tooltip:
            this.totalReviewPending > 0
              ? `${this.totalReviewPending} review(s) are open. Please close these before approving`
              : 'Accept this project. Once approved, no changes will be allowed',
          isVisible:
            !(
              !this.canFinishDD &&
              !this.canApproveDD &&
              this.diligence.is_internal &&
              this.diligence.alwaysOpen
            ) && this.canApproveDD,
        },
        {
          key: 'not_approve',
          icon: 'thumbs-o-down',
          label: 'Not Approve',
          isLoading: this.disapproving_dd,
          isDisabled: this.totalReviewPending > 0,
          tooltip:
            this.totalReviewPending > 0
              ? `${this.totalReviewPending} review(s) are open. Please close these before rejecting`
              : 'Mark as not approved, and document reasons for your decision',
          isVisible:
            !(
              !this.canFinishDD &&
              !this.canApproveDD &&
              this.diligence.is_internal &&
              this.diligence.alwaysOpen
            ) && this.canApproveDD,
        },
        {
          key: 'edit_due_date',
          icon: 'calendar',
          label: 'Edit Due Date',
          tooltip: 'Edit due date',
          isVisible:
            this.diligence.status !=
              diligenceStatusConstant.ExtensionRequested &&
            this.diligence.status != diligenceStatusConstant.Scheduled &&
            !(this.diligence.isLocked || this.diligence.isCompleted) &&
            this.diligence.is_internal,
          isLoading: false,
          isDisabled: false,
        },
        {
          key: 'start_workflow_process',
          icon: 'cogs',
          label: 'Start Workflow Process',
          isVisible: true,
          isDisabled: this.diligence.isLocked || this.is_freeSubscription,
          tooltip: this.is_freeSubscription
            ? 'Upgrade your subscription to start using workflow.'
            : this.diligence.isLocked
            ? 'You cannot start a workflow in a closed project.'
            : 'Start a workflow process for your team to complete specific steps.',
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
          isLoading: false,
          isDisabled: false,
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
          isLoading: false,
          isDisabled: false,
        },
        {
          key: 'view_history',
          icon: 'history',
          label: 'View History',
          isVisible: !!this.diligenceIds,
          isLoading: false,
          isDisabled: false,
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
          this.exitAndChangeStatus('Approved');
        } else if (status == this.diligenceStatusConstant.NotApproved) {
          this.exitAndChangeStatus('NotApproved');
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
}
