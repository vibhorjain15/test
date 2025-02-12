import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { Subject, throwError } from 'rxjs';
import { forkJoin } from 'rxjs';
import { take, takeUntil, tap, finalize } from 'rxjs/operators';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import { IDisclaimerObject } from 'src/app2/services/manage-disclaimer/manage-disclaimer.types';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { RouterService } from 'src/app2/services/router.service';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { keywordConstants } from 'src/app2/shared/constants/constant';

import {
  diligenceStatusConstant,
  diligenceTagMapper,
} from '../../constants/quick-view-headers.constant';
import { DvDraftService } from '../../service/draft.service';
import {
  FilterReload,
  GetDiligenceSectionData,
  GetQuestionCount,
  GetQuestionData,
  GetReviewers,
  GetSubSectionData,
  TriggerSilentReload,
  UpdateActivePanelId,
  UpdateDiligenceData,
  UpdateDraftData,
  UpdateFilterMap,
  UpdateSearchQuery,
} from '../../store/questionnaire.action';
import { StateDiligenceUpdateType } from '../../store/questionnaire.modal';
import { QuestionState } from '../../store/questionnaire.state';
import { HeaderDropdownType } from '../../types/header-dropdown.type';
import {
  canStartReviewHelper,
  getFinishButtonToolTipText,
  getQuestionHeaderDropdownList,
  reviewStartedForUserHelper,
} from '../../util/question-header.util';
import { AssignReviewerService } from '../../modals/assign-reviwer/assign-reviewer.service';
import { DiligenceTypeEnum } from '../../types/diligence-enum.type';
import { DeviceService } from 'src/app2/services/device-type.service';
import { ProjectStatusService } from 'src/app2/services/project-status.service';
import { autoFillHistoryParse, TabType } from '../../types/auto-fill.type';
import { QuestionnaireStatusService } from '../../service/status.service';

@Component({
  selector: 'questionnaire-header',
  templateUrl: './questionnaire-header.component.html',
  styleUrls: ['./questionnaire-header.component.css'],
})
export class QuestionnaireHeaderComponent
  implements OnChanges, OnInit, OnDestroy
{
  @Input() diligenceData: DiligenceType & StateDiligenceUpdateType = null;
  @Select(QuestionState.getQuestionnaireCount) questionCount;
  @Select(QuestionState.getDiligence) getDiligenceData;
  diligence: DiligenceType & StateDiligenceUpdateType = null;
  list = [];
  canStartReview = false;
  reviewStartedForUser = false;
  currentuser: any = {};
  firmPreference: any = {};
  options = {
    viewMySections: false,
    mode: 'investor',
  };
  private ngUnsubscribe = new Subject<void>();
  is_investor = false;
  is_manager = false;
  is_admin = false;
  is_readonly;
  is_freeSubscription = false;
  is_smartSubscription = false;
  allow_internal_to_external = false;
  canFinishDD: boolean;
  canRestartDD: boolean;
  canApprovedDD: boolean;
  statusType;
  diligenceName = '';
  related_diligences = [];
  isRelatedDiligences = false;
  disclaimer_id = -1;
  approvalLoader = {};
  isSearch = false;
  recalculating_scores: boolean;
  counterMap = {};
  statusFilter = 'default';
  wipCount = 0;
  autoFillHistory = [];
  diligenceStatusConstant = diligenceStatusConstant;
  diligenceTagMapper = diligenceTagMapper;
  wipList = [
    {
      label: 'All Responses',
      key: 'all_responses',
    },
    {
      label: 'Responses Edited by Me',
      key: 'my_responses',
    },
    {
      label: 'Responses Assigned to Me',
      key: 'assigned_responses',
    },
  ];
  toggleWIP = false;
  autoFillList: any[] = [];
  exportDropdownList: any[] = [
    {
      label: 'Export in Word or Excel',
      key: 'exportOptions',
      leftIcon: 'download-install-line',
    },
    {
      label: 'Work Offline & Sync',
      key: 'excelSync',
      leftIcon: 'sync',
    },
  ];
  Fund: string = keywordConstants.Product;
  Vehicle: string = keywordConstants.Vehicle;

  selectedDisclaimer: IDisclaimerObject;
  @Select(QuestionState.getFilterReload) filterState;
  @Select(QuestionState.getReviewers) reviewers;
  checkingEsStatus: boolean;
  isESDown: boolean;
  openRevisions: boolean;
  initalizedOnce: boolean; // To make sure that there are no duplicate api calls
  canSendProjectToManager: boolean = true;
  constructor(
    private store: Store,
    private route: RouterService,
    private newModal: CustomModalService,
    private toaster: ToastrService,
    private readonly SweetAlert: SweetAlertService,
    private questionnaire: QuestionnaireService,
    private panel: SidePanelService,
    private customModalService: CustomModalService,
    private draftService: DvDraftService,
    private reviewService: AssignReviewerService,
    public device: DeviceService,
    public projectStatus: ProjectStatusService,
    private readonly status: QuestionnaireStatusService
  ) {}

  isinternalHelper() {
    if (this.diligence.is_internal)
      this.diligence.review_mandatory =
        this.firmPreference.review_workflow_mandatory_for_internal_diligence;
    else
      this.diligence.review_mandatory =
        this.firmPreference.review_workflow_mandatory_for_external_diligence;
  }

  canDeleteHelper() {
    this.diligence.canDelete =
      (this.diligence.is_internal ||
        this.diligence.diligence_type == DiligenceTypeEnum.inbound) &&
      this.is_admin &&
      this.diligence.status != diligenceStatusConstant.Deleted;
  }

  ngOnInit(): void {
    this.getDiligenceData.pipe(take(2)).subscribe((diligence) => {
      if (diligence && !this.initalizedOnce) {
        this.initalizedOnce = true;
        this.diligence = JSON.parse(JSON.stringify(diligence));
        this.getDisclaimer();
        this.getRelatedDiligences();
        this.getAutofillHistory();
        const checkStatus = this.store.selectSnapshot((state) => state.user)
          .firmPreference.enable_es_autofill;
        if (checkStatus) {
          this.checkEsServiceStatus();
        }
      }
    });

    this.filterState.pipe(takeUntil(this.ngUnsubscribe)).subscribe((filter) => {
      if (filter) {
        this.isSearch = !!this.route.getState().params.q;
      }
    });

    this.reviewers
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((response: any) => {
        const assignReviewerOption = this.list.find(
          (option) => option.key === 'assignReviewers'
        );
        if (assignReviewerOption) {
          assignReviewerOption.label =
            response.reviewers.size > 0 ? 'Add Reviewers' : 'Assign Reviewers';
        }
      });
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes?.diligenceData &&
      changes?.diligenceData?.currentValue !==
        changes.diligenceData.previousValue
    ) {
      if (changes.diligenceData.currentValue) {
        this.diligence = JSON.parse(JSON.stringify(this.diligenceData));
        this.reInitializeData();
      }
    }
  }

  init() {
    this.statusFilter = this.route.getState().params.status || 'default';
    this.isSearch = !!this.route.getState().params.q;
    this.diligenceName = this.diligence.is_internal
      ? `${this.diligence.entity_name} (${this.diligence.name})`
      : this.diligence.entity_name;
    const { currentUser, firmPreference } = this.store.selectSnapshot(
      (state) => state.user
    );
    this.currentuser = currentUser;
    this.firmPreference = firmPreference;
    this.is_investor = this.currentuser.isInvestor;
    this.is_manager = this.currentuser.isManager;
    this.is_admin = this.currentuser.isAdmin;
    this.is_readonly = this.currentuser.isReadOnly;
    this.options.mode = this.currentuser.type;
    this.is_freeSubscription = this.currentuser.isFreeSubscription;
    this.is_smartSubscription = this.currentuser.isSmartSubscription;
    this.isinternalHelper();
    this.canDeleteHelper();
    const {
      options,
      is_freeSubscription,
      is_admin,
      canStartReview,
      reviewStartedForUser,
      diligence,
      currentuser,
    } = this;
    this.canStartReview = canStartReviewHelper(diligence, currentuser);
    this.reviewStartedForUser = reviewStartedForUserHelper(
      diligence,
      currentuser
    );
    const reviewerDetails = this.store.selectSnapshot(
      QuestionState.getReviewers
    );
    this.list = getQuestionHeaderDropdownList(
      options.mode,
      is_freeSubscription,
      is_admin,
      this.canStartReview,
      this.reviewStartedForUser,
      diligence,
      firmPreference,
      this.selectedDisclaimer,
      reviewerDetails.reviewers,
      currentuser
    );
    this.openRevisions =
      this.is_manager &&
      this.diligence.completed_at &&
      this.counterMap['UnsubmittedResponsesAfterCompletionCount'] > 0;
    this.setActionFlags();
  }

  reInitializeData() {
    this.questionCount.pipe(takeUntil(this.ngUnsubscribe)).subscribe((res) => {
      this.canSendProjectToManager = true;
      res.count?.map((val) => {
        if (val.id === 'WipTotal') this.wipCount = val.value;
        this.counterMap[val.id] = val.value;

        if (
          val.id === 'AutoFilledResponses' &&
          this.autoFillList.find((res) => res.key === 'autofill-delete')
        )
          this.autoFillList.find(
            (res) => res.key === 'autofill-delete'
          ).disabled = !val.value;

        if (
          this.canSendProjectToManager &&
          ['WithTrackChangesCount', 'TotalUnresolvedCommentsCount'].includes(
            val.id
          )
        ) {
          this.canSendProjectToManager = val.value === 0;
        }
      });
    });
    this.init();
  }

  getRelatedDiligences() {
    this.questionnaire
      .getLinkedProjects(this.diligence.id)
      .subscribe((response: any) => {
        this.isRelatedDiligences = true;
        this.related_diligences = response;
      });
  }

  checkEsServiceStatus() {
    this.questionnaire.esServiceStatus().subscribe(
      (esStatus: any) => {
        this.isESDown = !esStatus?.service_running;
      },
      () => {
        this.isESDown = true;
      }
    );
  }

  templateInfo() {
    this.newModal.invoke('template-info', {
      initialState: {
        showFirstButton: false,
      },
      id: 'template-info',
    });
  }

  setActionFlags() {
    if (this.is_manager) {
      this.canRestartDD =
        this.diligence.is_internal &&
        (this.diligence.status == 'Approved' ||
          this.diligence.status == 'Completed' ||
          this.diligence.status == 'NotApproved');
      this.canApprovedDD =
        this.diligence.is_internal &&
        ((this.diligence.status == 'Completed' && !this.canStartReview) ||
          this.diligence.status == diligenceStatusConstant.Evaluation);

      if (
        {
          Started: true,
          ExtensionRequested: true,
          Followup: true,
          PendingRestart: true,
          InReview: true,
        }[this.diligence.status] &&
        (!this.canStartReview ||
          this.diligence.status == diligenceStatusConstant.InReview)
      ) {
        this.canFinishDD = false;
      } else
        this.canFinishDD =
          !this.diligence.isReadOnly && !this.diligence.alwaysOpen;
    } else {
      this.canFinishDD =
        this.diligence.is_internal &&
        ['Started', 'InReview'].includes(this.diligence.status) &&
        (!this.canStartReview ||
          this.diligence.status == diligenceStatusConstant.InReview);

      if (this.diligence.is_internal) {
        this.canApprovedDD =
          (this.diligence.status == 'Completed' && !this.canStartReview) ||
          this.diligence.status == diligenceStatusConstant.Evaluation;
      } else {
        this.canApprovedDD =
          this.diligence.isReadOnly &&
          !this.diligence.alwaysOpen &&
          (!this.canStartReview ||
            this.diligence.status == diligenceStatusConstant.Evaluation);
      }
    }
  }

  getDisclaimer() {
    this.questionnaire
      .getDisclaimerAssigments({
        entity_id: this.diligence.id,
        entity_type: 'Duediligence',
      })
      .subscribe((response: any) => {
        this.selectedDisclaimer = response;
      });
  }

  wipDropDownClick(key) {
    let obs = this.questionnaire.updateFinalizeDraft(
      this.diligence.id,
      key.key
    );

    let draft = this.store.selectSnapshot(
      (state) => state.questionnaire.draftData
    );
    let questionsCount = 0;
    let apiData = [];
    draft &&
      Object.keys(draft).map((key) => {
        Object.values(draft[key]).map((api: any) => {
          apiData.push(JSON.parse(JSON.stringify(api)));
        });
        if (Object.values(draft[key]).length) {
          questionsCount += 1;
        }
      });
    if (questionsCount)
      this.SweetAlert.confirm({
        title: 'Are you sure you want to leave this page?',
        text: `You have ${questionsCount} unsaved change. All your unsaved answers will be lost if you leave this sub category`,
        confirmButtonText: 'Save & Exit',
        cancelButtonText: 'Do Not Save',
        showLoaderOnConfirm: true,
        showCloseButton: true,
        preConfirm: () => {
          return new Promise<void>(async (resolve) => {
            const { apiList, delNestedQuestionAct } =
              await this.draftService.updateDraftData(apiData, false);
            forkJoin(apiList).subscribe(async (res: any[]) => {
              await forkJoin(
                delNestedQuestionAct.map((action) =>
                  this.store.dispatch(action)
                )
              ).toPromise();
              this.store.dispatch(new GetQuestionCount());
              resolve();
            });
          });
        },
      }).then(() => {
        obs.subscribe((res: any) => {
          this.toaster.success(`${res.length} response(s) finalized`);
          this.store.dispatch(new GetQuestionData()).subscribe((res) => {
            this.toggleWIP = false;
            this.store.dispatch(new TriggerSilentReload(Math.random()));
          });
        });
        this.SweetAlert.close();
      });
    else {
      obs.subscribe((res: any) => {
        this.toaster.success(`${res.length} response(s) finalized`);
        this.store.dispatch(new GetQuestionCount());
        this.store.dispatch(new GetQuestionData()).subscribe((res) => {
          this.store.dispatch(new TriggerSilentReload(Math.random()));
          this.toggleWIP = false;
        });
      });
    }
  }

  async dropDownClick({ key }) {
    switch (key as HeaderDropdownType) {
      case 'quickFilter':
        return this.store.dispatch(
          new UpdateDiligenceData({
            isQuickFilter: !this.diligence.isQuickFilter,
          })
        );
      case 'modifyQuestionnaire':
        return this.route.navigateWithParams(
          'app.diligence.template.categories',
          { templateId: this.diligence.template_id }
        );
      case 'restartInternalProject':
        return this.openConfirmationModal('Restarted');
      case 'changeStatustoStarted':
        return this.openConfirmationModal('Restarted');
      case 'changeStatustoCompleted':
        return this.openConfirmationModal('changeStatustoCompleted');
      case 'startWorkflowProcess':
        return this.handleStartWorkflowProcess();
      case 'reviewWorkflow':
        return this.handleReviewWorkflow();
      case 'assignReviewers':
        return this.handleAssignReviewers();
      case 'templateInfo':
        return this.templateInfo();
      case 'cancelReview':
        return this.handleCancelReview();
      case 'addDisclaimer':
        return this.handleAddDisclaimer(false);
      case 'printPreview':
        const currRoute = this.route.getState()._routerState.url;
        return this.route.navigateToRoute(
          currRoute.split('questionnaire')[0] + '/print_preview'
        );
      case 'exporttoOriginalDoc':
        return this.handleExporttoOriginalDoc();
      case 'export&Email':
        return this.handleExportEmail();
      case 'autoFill':
        return this.handleAutoFillDropDownClick({
          name: 'responses',
          key: 'responses',
        });
      case 'generatePresentationReport':
        return this.handleGeneratePresentationReport();
      case 'delete':
        return this.handleDelete();
      case 'sendtoManager':
        if (this.canSendProjectToManager) {
          return this.route.navigateWithParams('app.diligence.to_external', {
            diligenceId: this.diligence.id,
          });
        }

        return this.toaster.error(
          `There are unresolved review comments/suggestions. Please resolve or delete these before sending to the manager.`
        );
      case 'backtoallprojects':
        this.draftService.showCountAlert(
          () => {
            this.navigateToProjectsTab();
          },
          () => this.navigateToProjectsTab()
        );
    }
  }

  navigateToProjectsTab() {
    this.route.navigateWithParams('app.diligence.projects.activity', {
      type: 'in-progress',
    });
  }

  async handleAutoFillDropDownClick(key) {
    if (
      key.key === 'responses' &&
      this.isESDown &&
      this.firmPreference.enable_es_autofill
    ) {
      this.checkingEsStatus = true;
      // if it is response autofill and previously checked status was false, check ES status again and if it is up, open es-autofill modal
      // if it is down or if it is ratings autofill, open standard autofill modal
      const esStatus: any = await this.questionnaire
        .esServiceStatus()
        .toPromise();
      this.isESDown = !esStatus?.service_running;
      this.checkingEsStatus = false;
    } else if (key.key === 'autofill-history') {
      this.newModal.invoke('autofill-history', {
        initialState: {
          autofillHistory: this.autoFillHistory,
          diligence: this.diligence,
          success: (deleteStatus) => {
            if (deleteStatus) {
              this.store.dispatch(new TriggerSilentReload(Math.random()));
              this.store.dispatch(new GetQuestionCount());
              this.getAutofillHistory();
            }
          },
        },
      });
      return;
    } else if (key.key === 'autofill-delete') {
      this.deleteAutoFillResponse();
      return;
    }
    this.newModal.invoke(
      this.isESDown ||
        !this.firmPreference.enable_es_autofill ||
        key.key !== 'responses'
        ? 'auto-fill'
        : 'es-autofill',
      {
        initialState: {
          diligence: this.diligence,
          autofillHistory: this.autoFillHistory,
          type: key.key == 'responses' ? 'response' : 'rating',
          success: (response) => {
            this.store.dispatch(new TriggerSilentReload(Math.random()));
            this.store.dispatch(new GetQuestionCount());
            this.getAutofillHistory();
          },
        },
      }
    );
  }

  deleteAutoFillResponse() {
    this.SweetAlert.confirm({
      title: `Are you sure you want delete all the auto-filled responses in this project?`,
      text: `Please note that any revised auto-filled responses will not be deleted.`,
      confirmButtonText: 'Yes, Delete',
      showLoaderOnConfirm: true,
      focusCancel: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.questionnaire
            .deleteAllAutofillResponses(this.diligence.id)
            .pipe(
              finalize(() => {
                resolve();
              })
            )
            .subscribe((res: any) => {
              this.store.dispatch(new TriggerSilentReload(Math.random()));
              this.store.dispatch(new GetQuestionCount());
              this.getAutofillHistory();
              this.toaster.success('Responses deleted successfully');
            });
        });
      },
    });
  }

  handleExportDropdownOptionClick(option) {
    if (option.key == 'exportOptions') {
      this.handleExportEmail();
    } else if (option.key == 'excelSync') {
      this.customModalService.invoke('excel-sync-questionnaire', {
        initialState: {
          diligence: this.diligence,
          current_user: this.currentuser,
          onClose: () => {},
        },
      });
    }
  }

  handleChangeDDStatus(status, noCheck?) {
    if (
      ['Approved', 'NotApproved'].includes(status) &&
      !noCheck &&
      this.counterMap['TotalReviewPending'] > 0
    ) {
      this.approvalLoader[status] = false;
      return;
    }

    this.approvalLoader[status] = true;
    this.questionnaire
      .updateDiligenceStatus(this.diligence.id, { status })
      .subscribe(
        (response: any) => {
          let action = {
            Started: 'started again',
            Restarted: 'started again',
            Approved: 'approved successfully!',
            Completed: 'completed successfully',
            NotApproved: 'not approved at this time',
          }[response.status];

          let type;
          if (['Started', 'RestartApproved', 'Restarted'].includes(status))
            type = 'in-progress';
          else type = 'closed';

          this.toaster.success(`Project has been ${action}`);

          if (
            (this.is_freeSubscription || this.is_smartSubscription) &&
            status == 'Approved'
          ) {
            this.route.navigateWithParams('app.diligence.projects.activity', {
              type: type,
            });
            return;
          }

          if (status == 'Approved') {
            if (this.diligence.entity_type == keywordConstants.Product)
              this.route.navigateWithParams('app.firms.funds.profile.monitor', {
                firmId: this.diligence.fromfirm_id,
                fundId: this.diligence.entity_id,
              });
            else if (this.diligence.entity_type == keywordConstants.Firm)
              this.route.navigateWithParams('app.firms.profile.monitor', {
                firmId: this.diligence.entity_id,
              });
            else if (this.diligence.entity_type == keywordConstants.Vehicle) {
              if (this.diligence.linked_duediligence_id)
                this.route.navigateWithParams(
                  'app.diligence.firms.funds.vehicles.project.summary',
                  {
                    fromfirmId: this.diligence.fromfirm_id,
                    tofirmId: this.diligence.tofirm_id,
                    fundId: this.diligence.parent_entity_id,
                    vehicleId: this.diligence.entity_id,
                    diligenceId: this.diligence.linked_duediligence_id,
                  }
                );
              else
                this.route.navigateWithParams(
                  'app.firms.funds.vehicles.profile.monitor',
                  {
                    firmId: this.diligence.fromfirm_id,
                    fundId: this.diligence.parent_entity_id,
                    vehicleId: this.diligence.entity_id,
                  }
                );
            } else if (this.diligence.entity_type == keywordConstants.Review)
              this.route.navigateWithParams('app.diligence.projects.activity', {
                type: type,
              });
          } else if (status == 'NotApproved') {
            this.store.dispatch(new UpdateDiligenceData(response));
            this.route.navigateWithParams(
              'app.diligence.project.not_approval_reasons',
              { diligenceId: this.diligence.id }
            );
          } else {
            this.store
              .dispatch(new UpdateDiligenceData(response))
              .subscribe(() => {
                this.store.dispatch(new GetQuestionCount());
              });
          }
          this.store.dispatch(new TriggerSilentReload(Math.random()));
          this.status.destroyVariablesUponExit();
          this.approvalLoader[status] = false;
        },
        (error) => (this.approvalLoader[status] = false)
      );
  }

  handleStartWorkflowProcess() {
    this.store.dispatch(
      new UpdateActivePanelId(`questionnaire-workflow-${this.diligence.id}`)
    );
    this.panel.invoke('new-workflow', {
      entity_type: 'Duediligence',
    });
  }

  changeDDStatus(status) {
    if (
      ['Approved', 'NotApproved'].includes(status) &&
      this.counterMap['TotalReviewPending'] > 0
    )
      return;

    if (this.approvalLoader['NotApproved'] || this.approvalLoader['Approved'])
      return;
    this.approvalLoader[status] = true;
    let loader_property = {
      Started: 'restarting_dd',
      Approved: 'approving_dd',
      NotApproved: 'disapproving_dd',
    }[status];
    this.questionnaire
      .updateDiligenceStatus(this.diligence.id, { status })
      .subscribe(
        (response: any) => {
          let message;
          if (response.status == 'Started')
            message = 'Project re-started successfully!';
          if (response.status == 'PendingRestart')
            message = 'Restart request has been sent to the investor';
          if (response.status == 'Approved')
            message = 'Project is approved successfully!';
          if (response.status == 'NotApproved')
            message = 'Project is not approved at this time';

          this.toaster.success(message);
          this.status.destroyVariablesUponExit();

          this.route.navigateWithParams('app.diligence.projects.activity', {
            type: 'in-progress',
          });
          this.approvalLoader[status] = false;
        },
        (error) => (this.approvalLoader[status] = false)
      );
  }

  exitAndChangeStatus(status) {
    if (this.approvalLoader['NotApproved'] || this.approvalLoader['Approved'])
      return;
    this.approvalLoader[status] = true;
    this.handleChangeDDStatus(status, true);
  }

  handleReviewWorkflow() {
    let canStartReview = !this.canStartReview;
    let params = { ...this.diligence };
    params.postsubmission_review_enabled = canStartReview;
    params.presubmission_review_enabled = canStartReview;
    this.questionnaire
      .UpdateDiligenceUpdateData(this.diligence.id, params)
      .subscribe((res) => {
        this.diligence = params;
        this.canStartReview = canStartReview;
        this.store.dispatch(
          new UpdateDiligenceData(JSON.parse(JSON.stringify(this.diligence)))
        );
        this.toaster.success(
          `Review mode ${this.canStartReview ? 'enabled' : 'disabled'}`
        );
      });
  }

  handleAssignReviewers() {
    this.newModal.invoke('assign-reviewer', {
      initialState: {
        success: (response) => {
          this.navigateToPendingReview();
        },
      },
      class: 'modal-lg',
    });
  }

  async navigateToPendingReview() {
    await this.store
      .dispatch(new UpdateFilterMap('TotalReviewPending'))
      .toPromise();
    await this.store.dispatch(new GetDiligenceSectionData()).toPromise();
    await this.store.dispatch(new GetReviewers()).toPromise();
    setTimeout(() => {
      this.store.dispatch(new FilterReload(`${Math.random()}`));
    });
  }

  handleCancelReview() {
    let status = 'Started';
    if (this.diligence.status === diligenceStatusConstant.InReview)
      status = 'Started';
    else status = diligenceStatusConstant.Completed;
    this.SweetAlert.confirm({
      title: `Are you sure you want to cancel review and change the status of the project to ${status.toLocaleLowerCase()} ?`,
      confirmButtonText: 'Confirm',
      text: `You have ${this.counterMap['TotalReviewPending']} review(s) pending.`,
      showLoaderOnConfirm: true,
      focusCancel: true,
      preConfirm: async () => {
        return new Promise<void>((resolve) => {
          let title =
            'Are you sure you want to cancel review? all your unsaved changes will be lost';
          this.draftService.showCountAlert(
            async () => {
              this.cancelReview(status, resolve);
            },
            async () => {
              this.cancelReview(status, resolve);

              this.store.dispatch(new UpdateDraftData(null));
            },
            title,
            undefined,
            'Save & Cancel',
            `Don't save & cancel`
          );
        });
      },
    });
  }

  async cancelReview(status, resolve) {
    try {
      await this.questionnaire
        .updateDiligenceReview(this.diligence.id)
        .toPromise();
      await this.questionnaire
        .updateDiligenceStatus(this.diligence.id, { status })
        .toPromise();
      this.diligence.status = status;
      this.status.destroyVariablesUponExit();
      this.store.dispatch(new GetQuestionCount());
      this.store.dispatch(new UpdateDiligenceData({ status }));
      this.toaster.success(`Review Cancelled`);
      this.store.dispatch(new TriggerSilentReload(Math.random()));
      this.store.dispatch(new GetSubSectionData());
      resolve();
    } catch {
      throwError('Something went wrong');
      resolve();
    }
  }

  handleAddDisclaimer(isInvokedFromViewDisclaimerModal: boolean = false) {
    this.newModal.invoke('add-disclaimer', {
      initialState: {
        entityId: this.diligence.id,
        entityType: 'Duediligence',
        disclaimerId: this.selectedDisclaimer?.id,
        entityName: this.diligence.entity_name,
        updating: isInvokedFromViewDisclaimerModal,
        success: (response) => {
          this.selectedDisclaimer = response;
        },
      },
    });
  }

  handleViewDisclaimer() {
    this.newModal.invoke('view-disclaimer', {
      initialState: {
        disclaimerObj: this.selectedDisclaimer,
        entityId: this.diligence.id,
        isManager: this.is_manager,
        editDisclaimer: () => {
          this.handleAddDisclaimer(true);
        },
        deleteDisclaimer: () => {
          this.selectedDisclaimer = undefined;
        },
      },
      class: 'modal-md',
    });
  }

  getAutofillHistory() {
    if (this.diligence.diligence_type === DiligenceTypeEnum.dd_review)
      this.autoFillList = [
        { label: 'Responses', key: 'responses' },
        {
          label: 'Ratings',
          key: 'ratings',
        },
      ];
    else this.autoFillList = [{ label: 'Responses', key: 'responses' }];
    // Only show these responses if the es autofill is enabled for firm

    this.questionnaire
      .getAutofillHistory(this.diligence.id)
      .subscribe((res: any) => {
        this.autoFillHistory = res;
        if (this.autoFillHistory.length) {
          this.autoFillList.push(
            { label: 'View Auto-Filled History', key: 'autofill-history' },
            {
              label: 'Delete Auto-Filled Responses',
              key: 'autofill-delete',
              disabled:
                this.autoFillHistory.filter(
                  (history) => history.removed_at || !history.responses_count
                ).length === this.autoFillHistory.length,
            }
          );
        }

        autoFillHistoryParse(this.autoFillHistory, this.currentuser);
      });
  }

  handleExporttoOriginalDoc() {
    this.questionnaire
      .writetoOriginalDoc({
        diligence_id: this.diligence.id,
      })
      .subscribe((res) => {
        this.toaster.success(`Export request received and is being processed`);
      });
  }

  handleExportEmail() {
    this.customModalService.invoke('export-preferences', {
      initialState: {
        diligence: this.diligence,
        current_user: this.currentuser,
      },
    });
  }

  handleDelete() {
    this.SweetAlert.confirm({
      title: `Are you sure you want to delete this Project?`,
      text: `${
        this.diligence.diligence_type === DiligenceTypeEnum.dd_profile
          ? "This will delete the project and its responses but will keep the questions in the template. If you'd like to delete or edit questions, please Cancel and go to More > Modify Questionnaire and make edits in the template."
          : ''
      }`,
      showLoaderOnConfirm: true,
      focusCancel: true,
      preConfirm: async () => {
        try {
          await this.questionnaire
            .deleteQuestionanire(this.diligence.id, { status: 'deleted' })
            .toPromise();
          this.toaster.success(`Deleted successfully`);
          this.SweetAlert.close();
          this.route.navigateWithParams('app.diligence.projects.activity', {
            type: 'in-progress',
          });
        } catch {
          throwError('Something went wrong');
        }
      },
    });
  }

  handleGotoMainProject() {
    if (this.diligence.entity_type == 'Vehicle')
      window.open(
        `/#/app/diligence/${this.diligence.fromfirm_id}/firms/${this.diligence.tofirm_id}/funds/${this.diligence.parent_entity_id}/projects/${this.diligence.linked_duediligence_id}/questionnaire`
      );
    else if (
      this.diligence.entity_type == 'Strategy' ||
      this.diligence.entity_type == 'Fund'
    )
      window.open(
        `/#/app/diligence/${this.diligence.fromfirm_id}/firms/${this.diligence.tofirm_id}/strategies/${this.diligence.parent_entity_id}/projects/${this.diligence.linked_duediligence_id}/questionnaire`
      );
  }

  handleGeneratePresentationReport() {
    this.customModalService.invoke('generate-presentation-report', {
      initialState: {
        diligence: this.diligence,
      },
    });
  }

  handleQuestionSearchClick() {
    this.isSearch = !this.isSearch;
  }

  handleRelatedProjects() {
    const disabled =
      !(
        this.diligence.status == 'Started' ||
        this.diligence.status == 'Followup' ||
        this.diligence.status == 'ExtensionRequested' ||
        this.diligence.status == 'InReview'
      ) ||
      this.is_readonly ||
      this.counterMap['MandatoryUnansweredTotal'] > 0 ||
      this.counterMap['WipTotal'] > 0;

    this.newModal.invoke('view-related-projects', {
      initialState: {
        diligence: this.diligence,
        disabled: disabled,
        user: this.currentuser,
        projects: this.related_diligences,
        disabledTooltip: getFinishButtonToolTipText(
          this.counterMap['MandatoryUnansweredTotal'],
          this.counterMap['WipTotal']
        ),
      },
      class: 'modal-lg',
    });
  }



  handleReviewClick() {
    let confirmText =
      'This will change the project status to In Review/Evaluation and you can assign reviewers to the responses.';
    if (this.diligence.status != diligenceStatusConstant.Completed) {
      if (this.counterMap['UnAnsweredTotal'] > 0) {
        confirmText = `There are ${this.counterMap['UnAnsweredTotal']} unanswered questions. This will change the project status to In Review/Evaluation and you can only assign reviewers to questions with responses.`;
      } else if (this.counterMap['WipTotal'] > 0) {
        confirmText = `There are ${this.counterMap['WipTotal']} questions marked as draft. This will change the project status to In Review/Evaluation and you can only assign reviewers to questions with responses.`;
      }
    }

    this.SweetAlert.confirm({
      title: `Are you sure you want to start review/evaluation mode for this project?`,
      text: confirmText,
      showLoaderOnConfirm: true,
      focusCancel: true,
      preConfirm: async () => {
        return new Promise<void>((resolve) => {
          this.reviewService.updateData(this.diligence, {
            currentUser: this.currentuser,
          });

          this.startReview(resolve).subscribe();
        });
      },
    });
  }

  startReview(resolve) {
    return this.reviewService.startReviewProcess().pipe(
      tap((response: any) => {
        this.toaster.success('Review Started');
        this.diligence.status = response.status;
        this.store.dispatch(new TriggerSilentReload(Math.random()));
        this.store.dispatch(new GetQuestionCount());
        this.store.dispatch(
          new UpdateDiligenceData({ status: response.status })
        );
        this.reviewStartedForUser = reviewStartedForUserHelper(
          this.diligence,
          this.currentuser
        );
        this.status.destroyVariablesUponExit();
        this.handleAssignReviewers();
      }),
      finalize(() => resolve())
    );
  }

  reloadRatings() {
    this.recalculating_scores = true;
    let params = { duediligence_ids: [this.diligence.id] };
    this.questionnaire.recalculateScore(params).subscribe(
      (response) => {
        this.diligence.recalculation_needed = false;
        this.recalculating_scores = false;
        this.store.dispatch(new UpdateDiligenceData(this.diligence));
        this.store.dispatch(new TriggerSilentReload(Math.random()));
      },
      (error) => (this.recalculating_scores = false)
    );
  }
  openConfirmationModal(status) {
    const data = {
      unsubmittedResponsesAfterCompletionCount:
        this.counterMap['UnsubmittedResponsesAfterCompletionCount'],
      isInvestor: this.is_investor,
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
          this.is_manager
            ? this.changeDDStatus('Approved')
            : this.exitAndChangeStatus('Approved');
        } else if (status == this.diligenceStatusConstant.NotApproved) {
          this.is_manager
            ? this.changeDDStatus('NotApproved')
            : this.exitAndChangeStatus('NotApproved');
        } else if (status == 'changeStatustoCompleted') {
          this.questionnaire
            .updateDiligenceReview(this.diligence.id)
            .toPromise();
          this.handleChangeDDStatus('Completed');
        } else if (status == 'Restarted') {
          this.questionnaire
            .updateDiligenceReview(this.diligence.id)
            .toPromise();
          this.handleChangeDDStatus('Restarted');
        }
      },
    });
  }

  async handleOnCancelSearch() {
    this.isSearch = !this.isSearch;
    // Make sure there is a query applied already before making API call
    if (this.route.getState().params.q) {
      await this.store.dispatch(new UpdateSearchQuery('', null));
      await this.store.dispatch(new GetDiligenceSectionData()).toPromise();
      await this.store
        .dispatch(new FilterReload(`${Math.random()}`))
        .toPromise();
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
