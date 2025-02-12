import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';
import { UtilsService } from 'src/app2/services/utils.service';
import { keywordConstants } from 'src/app2/shared/constants/constant';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { RouterService } from 'src/app2/services/router.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { finalize, take } from 'rxjs/operators';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';

@Component({
  selector: 'app-workflow-automation-detail',
  templateUrl: './workflow-automation-detail.component.html',
  styleUrls: ['./workflow-automation-detail.component.css'],
})
export class WorkflowAutomationDetailComponent implements OnInit {
  current_user: any;
  workflowId: any;
  completedActionCount: number;
  actionButtons: any;
  pageUrl: string = '';
  dateFormat: string;
  today: any;
  timeline_legend: {};
  workflow_notes = [];
  action_types: any;
  teamMembers: any;
  functions: any;
  myFunctions: any = [];
  activeStep = {
    actions: [],
  };
  activeAction = {
    checklist: [],
    percentageCompletion: 0,
  };
  keywordConstants = keywordConstants;
  workflow_status: any;
  workflow_pending_action_id: any;
  workflow_pending_user_id: any;
  entity_id: any;
  entity_type: any;
  workflow_steps_actions_id: any;
  performing_action: boolean;
  filteredTeamMembers: any;
  is_investor: boolean;
  @Select(UserState.getCurrentUserData) user;
  @Select(UserState.getTeamMembersData) teamMembers$;
  noteAction: any;
  loading_notes: boolean;
  headers = {};

  constructor(
    private readonly httpClient: HttpClient,
    private readonly toaster: ToastrService,
    private readonly utilsService: UtilsService,
    private readonly BaseDataService: BaseDataService,
    private readonly routerService: RouterService,
    private readonly SweetAlert: SweetAlertService,
    private readonly modal: CustomModalService,
    private readonly dvDatePipe: DvDatePipe
  ) {}

  ngOnInit(): void {
    this.initialize();
  }

  initialize() {
    this.workflowId = +this.routerService.getState().params.id;
    this.completedActionCount = 0;
    this.getActionsTypes();
    this.actionButtons = [];
    this.dateFormat = 'DD MMMM YYYY';
    this.today = new Date();

    this.timeline_legend = [
      { action: 'Completed', type: 'action', class: 'done legend' },
      { action: 'legend-gap', type: 'gap', class: 'legend-gap' },
      { action: 'Pending', type: 'action', class: 'in-progress legend' },
      { action: 'legend-gap', type: 'gap', class: 'legend-gap' },
      { action: 'Invisible', type: 'action', class: 'upcoming legend' },
    ];
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.current_user = data;
          this.is_investor = this.current_user.isInvestor;
          this.BaseDataService.getPermissionEntityDetails(
            this.workflowId,
            'workflow_audit'
          ).subscribe((permission: any) => {
            this.entity_id = permission.entity_id;
            this.entity_type = permission.entity_type;
            this.generatePageUrl(permission);
          });
        }
      });
  }

  redirectToEntity(entity_id: any, entity_type: any) {
    switch (entity_type) {
      case 'Duediligence':
        this.routerService.navigateWithParams(
          'app.diligence.project.questionnaire',
          {
            diligenceId: entity_id,
          }
        );
        break;
      case 'Fund':
        this.routerService.navigateWithParams('app.funds.profile.monitor', {
          fundId: entity_id,
        });
        break;
      case 'Firm':
        this.routerService.navigateWithParams('app.firms.profile.monitor', {
          firmId: entity_id,
        });
        break;
      case 'User':
        this.routerService.navigateWithParams('app.contacts', {
          Id: entity_id,
        });
        break;
      case 'Workflow':
        this.routerService.navigateWithParams(
          'app.workflow_automation.detail',
          {
            Id: entity_id,
          }
        );
        break;
      case 'Document':
        this.routerService.navigateWithParams('app.content.document.detail', {
          documentId: entity_id,
        });
        break;
      case 'FormADV':
        this.routerService.navigateWithParams(
          'app.form_adv.firm.filings_history',
          {
            firmCRD: entity_id,
          }
        );
        break;
    }
  }

  displayNotesController(action: any) {
    this.noteAction = action;
    this.actionButtons.add_note = false;
    this.modal.invoke('add-notes', {
      initialState: {
        entityId: +this.entity_id,
        entityType:
          this.entity_type === 'Document' ? 'Attachment' : this.entity_type,
        title: 'Workflow Notes',
        showInstructions: false,
        emptyStateMessage: 'No notes found.',
        notesPassed: true,
        notes: this.workflow_notes,
        additionalSaveParams: this.getAdditionalSaveParams(),
        callbackOnAddingNote: () => this.onNoteAdded(this.noteAction),
      },
      class: 'modal-lg',
    });
  }

  getAdditionalSaveParams() {
    const params: any = {};
    if (this.workflowId) {
      params.workflow_audit_id = this.workflowId;
    }
    if (this.workflow_pending_action_id) {
      params.action_id = this.workflow_pending_action_id;
    }
    if (this.workflow_steps_actions_id) {
      params.workflow_steps_actions_id = this.workflow_steps_actions_id;
    }
    return params;
  }

  getActionsTypes() {
    this.httpClient.get('workflow_actions').subscribe(
      (response: any) => {
        this.action_types = response;
        this.getFunctions();
        this.getTeamMembers();
        this.getMyFunctions();
      },
      (e) => {
        this.toaster.error('Something went wrong please try again later.');
      }
    );
  }

  getTeamMembers() {
    this.teamMembers$.pipe(take(2)).subscribe((teamMembers) => {
      if (teamMembers)
        this.teamMembers = teamMembers.map((teamMember) => ({
          ...teamMember,
          fullname: `${teamMember.firstName} ${teamMember.lastName}`,
        }));
    });
  }

  getFunctions() {
    this.BaseDataService.getFunctions().subscribe((response: any) => {
      this.functions = response;
    });
  }

  getMyFunctions() {
    this.httpClient
      .get(`workflow_audits/${this.workflowId}/MyFunctions`)
      .subscribe((response: any) => {
        this.myFunctions = response;
      });
  }

  setActiveStep(step: any) {
    this.activeStep = step;
    this.setActiveAction(this.activeStep.actions[0]);
  }

  setActiveAction(action: any) {
    this.activeAction = action;
    (this.activeAction.checklist as Array<any>).forEach(
      (list: { is_complete: any }) => {
        if (list.is_complete) {
          this.completedActionCount += 1;
        }
      }
    );
  }

  markTaskCompleted(task: any) {
    task.completed_at = new Date();
    this.httpClient.put(`todos/${task.id}`, task).subscribe(
      (response: any) => {
        if (task.is_complete) {
          this.toaster.success('The task has been marked as completed!');
        }
        task = response;
        this.activeAction.percentageCompletion = this.calculatePercentage(
          this.activeAction
        );
      },
      (e) => {
        this.toaster.error('Something went wrong please try again later');
      }
    );
  }

  getDaysInBetween(end: any) {
    const today = moment();
    const startDate = moment(today, 'DD.MM.YYYY');
    const endDate = moment(end, 'DD.MM.YYYY');
    const diff = endDate.diff(startDate, 'days');
    return diff;
  }

  calculatePercentage(action: any): number {
    const totalChecklist = action.checklist.length;
    if (totalChecklist > 0) {
      const completedChecklist = action.checklist.reduce(
        (sum: number, task: { is_complete: any }) => {
          if (task.is_complete) {
            sum += 1;
          }
          return sum;
        },
        0
      );
      const progress = (+completedChecklist * 100) / totalChecklist + '';
      return +parseInt(progress).toFixed(0);
    } else {
      return 0;
    }
  }

  getPer(action) {
    return action.percentageCompletion;
  }

  getUserFullName(user: any, type: string) {
    let teamMember: { function_name: any; fullName: any };
    if (type === 'function') {
      teamMember = this.functions.find((member: { function_id: any }) => {
        return member.function_id === Number(user);
      });
      if (teamMember) {
        return teamMember.function_name;
      } else {
        return null;
      }
    } else {
      teamMember = this.teamMembers.find((member: { id: any }) => {
        return member.id === Number(user);
      });
      if (teamMember) {
        return teamMember.fullName;
      } else {
        return null;
      }
    }
  }

  generatePageUrl(permission: any) {
    if (
      permission.entity_type.toLowerCase() ===
      this.keywordConstants.Firm.toLowerCase()
    ) {
      this.pageUrl = `app/firms/${permission.entity_id}/workflow_automation/${this.workflowId}`;
      this.init();
    } else if (
      permission.entity_type.toLowerCase() ===
      this.keywordConstants.Product.toLowerCase()
    ) {
      this.BaseDataService.getPermissionEntityDetails(
        permission.entity_id,
        'Fund'
      ).subscribe((response: { entity_id: any }) => {
        this.pageUrl = `app/firms/${response.entity_id}/funds/${permission.entity_id}/workflow_automation/${this.workflowId}`;
        this.init();
      });
    } else if (
      permission.entity_type.toLowerCase() ===
      this.keywordConstants.Vehicle.toLowerCase()
    ) {
      this.BaseDataService.getPermissionEntityDetails(
        permission.entity_id,
        'Vehicle'
      ).subscribe((response: any) => {
        this.pageUrl = `app/firms/${response.firm_id}/funds/${response.fund_id}/vehicles/${permission.entity_id}/workflow_automation/${this.workflowId}`;
        this.init();
      });
    } else if (
      permission.entity_type.toLowerCase() ===
      this.keywordConstants.Strategy.toLowerCase()
    ) {
      this.BaseDataService.getPermissionEntityDetails(
        permission.entity_id,
        'Strategy'
      ).subscribe((response: { entity_id: any }) => {
        this.pageUrl = `app/firms/${response.entity_id}/strategies/${permission.entity_id}/workflow_automation/${this.workflowId}`;
        this.init();
      });
    } else if (
      permission.entity_type.toLowerCase() ===
      this.keywordConstants.Project.toLowerCase()
    ) {
      this.BaseDataService.getPermissionEntityDetails(
        permission.entity_id,
        'Duediligence'
      ).subscribe(
        (diligence: {
          entity_type: { toLowerCase: () => any };
          fromfirm_id: any;
          tofirm_id: any;
          entity_id: any;
          parent_entity_id: any;
        }) => {
          let fromfirmId: any, fundId: any, tofirmId: any;
          if (
            diligence.entity_type.toLowerCase() ===
            this.keywordConstants.Product.toLowerCase()
          ) {
            fromfirmId = diligence.fromfirm_id;
            tofirmId = diligence.tofirm_id;
            fundId = diligence.entity_id;
            this.pageUrl = `app/diligence/${fromfirmId}/firms/${tofirmId}/funds/${fundId}/projects/${permission.entity_id}/workflow_automation/${this.workflowId}`;
          } else if (
            diligence.entity_type.toLowerCase() ===
            this.keywordConstants.Firm.toLowerCase()
          ) {
            fromfirmId = diligence.fromfirm_id;
            tofirmId = diligence.entity_id;
            this.pageUrl = `app/diligence/${fromfirmId}/firms/${tofirmId}/projects/${permission.entity_id}/workflow_automation/${this.workflowId}`;
          } else if (
            diligence.entity_type.toLowerCase() ===
            this.keywordConstants.Vehicle.toLowerCase()
          ) {
            fromfirmId = diligence.fromfirm_id;
            tofirmId = diligence.tofirm_id;
            fundId = diligence.parent_entity_id;
            const vehicleId = diligence.entity_id;
            this.pageUrl = `app/diligence/${fromfirmId}/firms/${tofirmId}/funds/${fundId}/vehicles/${vehicleId}/projects/${permission.entity_id}/workflow_automation/${this.workflowId}`;
          } else if (
            permission.entity_type.toLowerCase() ===
            keywordConstants.Strategy.toLowerCase()
          ) {
            fromfirmId = diligence.fromfirm_id;
            tofirmId = diligence.tofirm_id;
            const strategyId = diligence.entity_id;
            this.pageUrl = `app/diligence/${fromfirmId}/firms/${tofirmId}/strategies/${strategyId}/projects/${permission.entity_id}/workflow_automation/${this.workflowId}`;
          }
          this.init();
        }
      );
    } else if (
      permission.entity_type.toLowerCase() ===
      this.keywordConstants.Document.toLowerCase()
    ) {
      this.pageUrl = `app/content/docuemnt/${permission.entity_id}`;
      this.init();
    } else if (
      permission.entity_type.toLowerCase() ===
      this.keywordConstants.FormADV.toLowerCase()
    ) {
      this.pageUrl = `app/form_adv/firm/${permission.entity_id}`;
      this.init();
    } else {
      this.init();
    }
  }

  init() {
    if (this.pageUrl) {
      this.headers['page-url'] = this.pageUrl;
    }
    this.getWorkflowStatus(this.workflowId, true);
  }

  getWorkflowStatus(id: number, loadNotes: boolean = false) {
    this.httpClient
      .get(`workflow_audits/${id}`, {
        headers: this.headers,
      })
      .subscribe((response: any) => {
        this.workflow_status = this.groupWorkflowAudits(response);
        this.workflow_status.entity_name = response.entity_name;
        this.workflow_status.name = response.name;
        this.workflow_status.due_at = response.due_at;
        this.workflow_status.created_at = response.created_at;
        this.workflow_status.updated_at = response.updated_at;
        this.workflow_status.due_at = response.due_at;
        this.workflow_status.owner_name = response.owner_name;
        if (this.activeStep.actions.length) {
          this.setActiveStep(this.activeStep);
        }
        this.workflow_status.owner_name = this.getUserFullName(
          this.workflow_status.owner_id,
          ''
        );
        this.workflow_pending_action_id = null;
        this.workflow_pending_user_id = null;
        if (loadNotes) {
          this.getNotes();
        }
        this.entity_id = this.workflow_status.entity_id;
        this.entity_type = this.workflow_status.entity_type;
        this.workflow_status.workflow_steps_audit.forEach(
          (action: {
            status: string;
            from_now: any;
            created_at: any;
            action_id: any;
            user_id: any;
            workflow_steps_actions_id: any;
            created_at_new: any;
            updated_at: any;
          }) => {
            if (action.status === 'Pending') {
              action.from_now = this.dvDatePipe.transform(action.created_at);
              if (!this.workflow_pending_action_id) {
                this.workflow_pending_action_id = action.action_id;
                this.workflow_pending_user_id = action.user_id;
                this.workflow_steps_actions_id =
                  action.workflow_steps_actions_id;
                if (
                  this.workflow_pending_action_id === 'add_note' &&
                  this.workflow_pending_user_id === this.current_user.id
                ) {
                  this.displayNotesController(action);
                }
              }
            }
            if (action.status === 'Completed') {
              action.created_at_new = moment(action.updated_at).format(
                this.dateFormat
              );
            }
          }
        );
      });
  }

  groupWorkflowAudits(response: any) {
    const steps = this.utilsService.groupByUnsorted(
      response.workflow_steps_audits,
      'workflow_steps_id'
    );
    let newSteps = [];
    for (const [key, step] of steps) {
      const actions = this.utilsService.groupBy(
        step,
        'workflow_steps_actions_id'
      );
      const stepactions = [];

      Object.values(actions).forEach((action: Array<any>) => {
        action[0].users = action
          .filter((user) => user.user_id)
          .map((user) => user.user_id);
        action[0].functions = action
          .filter((user) => user.function_id)
          .map((func) => func.function_id);
        action[0].due_at = new Date(action[0].due_at);
        action[0].percentageCompletion = this.calculatePercentage(action[0]);
        if (action[0].users.indexOf(this.current_user.id) > -1) {
          action[0].user_id = this.current_user.id;
        }
        stepactions.push(action[0]);
      });

      const newStep = {
        id: step[0].id,
        name: step[0].name,
        order: step[0].order,
        description: step[0].description,
        status: step[0].status,
        workflow_steps_id: step[0].workflow_steps_id,
        workflow_audit_id: step[0].workflow_audit_id,
        created_at: step[0].created_at,
        updated_at: step[0].updated_at,
        updated_by: step[0].updated_by,
        actions: [],
      };
      const pending_exists = stepactions.find((sa) => sa.status === 'Pending');
      const invisible_exists = stepactions.find(
        (sa) => sa.status === 'Invisible'
      );
      if (invisible_exists) {
        newStep.status = 'Invisible';
        // if any pending action exists which makes step pending/in-progress
      } else if (pending_exists) {
        newStep.status = 'Pending';
      } else {
        newStep.status = 'Completed';
      }
      newStep.actions = stepactions;
      if (newStep.status === 'Pending' || newStep.status === 'Completed') {
        this.activeStep = newStep;
      }
      newSteps.push(newStep);
    }
    const workflow: any = {
      entity_id: response.entity_id,
      entity_type: response.entity_type,
      firm_id: response.firm_id,
      name: response.name,
      owner_id: response.owner_id,
      pct_complete: response.pct_complete,
      source: response.source,
      updated_at: response.updated_at,
      updated_by: response.updated_by,
      workflow_id: response.workflow_id,
      created_at: response.created_at,
      created_by: response.created_by,
      entities: response.entities,
      id: response.id,
      is_active: response.is_active,
    };
    newSteps = newSteps.sort((a, b) => a.order - b.order);
    workflow.workflow_steps_audit = newSteps;
    return workflow;
  }

  getNotes() {
    this.loading_notes = true;
    let temp_entity_type = this.entity_type;
    if (this.entity_type === 'Document') {
      temp_entity_type = 'Attachment';
    }
    const params = {
      entity_id: this.entity_id,
      entity_type: temp_entity_type,
      workflow_audit_id: this.workflowId,
    };
    this.httpClient
      .get(`notes`, {
        headers: this.headers,
        params,
      })
      .subscribe(
        (response: any) => {
          this.workflow_notes = response;
          this.loading_notes = false;
        },
        (e) => {
          this.loading_notes = false;
        }
      );
  }

  onNoteAdded(noteAction) {
    if (noteAction && noteAction.action_id === 'add_note') {
      this.completeAction(noteAction);
    }
    this.getWorkflowStatus(this.workflowId);
  }

  confirmApprovalAction(
    isApproved: boolean,
    action_text: string,
    actionObj: any,
    action: string | number
  ) {
    this.SweetAlert.confirm({
      title: `Are you sure you ${action_text} this workflow?`,
      showLoaderOnConfirm: true,
      confirmButtonText: 'Yes',
      focusCancel: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          const params: any = {};
          params.entity_id = this.entity_id;
          params.entity_type = this.entity_type;
          if (this.workflowId) {
            params.workflow_audit_id = this.workflowId;
          }
          if (this.workflow_pending_action_id) {
            params.action_id = this.workflow_pending_action_id;
          }
          if (this.workflow_steps_actions_id) {
            params.workflow_steps_actions_id = this.workflow_steps_actions_id;
          }
          this.actionButtons[action] = true;
          this.httpClient
            .post(`entity_approvals`, params)
            .pipe(
              finalize(() => ((this.actionButtons[action] = false), resolve()))
            )
            .subscribe(
              (response: any) => {
                this.toaster.success('This workflow has been updated');
                this.completeAction(actionObj);
                this.actionButtons[action] = false;
              },
              (error: any) => {
                // this.toaster.error('Something went wrong. Please try again.');
                const avoid_error_logging_statuses =
                  this.BaseDataService.getAvoidErrorLoggingStatusList();
                if (
                  !Array.from(avoid_error_logging_statuses).includes(
                    error.status
                  )
                ) {
                  return this.utilsService.logError(
                    'Updating workflow failed',
                    error
                  );
                }
              }
            );
        });
      },
    });
  }

  showInitials(user: any, type: any) {
    const fullName = this.getUserFullName(user, type);
    if (fullName) {
      let initials: any;
      const firstName = fullName.split(' ').slice(0, -1).join(' ');
      const lastName = fullName.split(' ').slice(-1).join(' ');
      if (firstName && !lastName) {
        initials = firstName[0];
      }
      if (lastName && !firstName) {
        initials = lastName[0];
      }
      if (firstName && lastName) {
        initials = firstName[0] + lastName[0];
      }
      return initials;
    } else {
      return 'N/A';
    }
  }

  displayUserName(user: any, type: any) {
    const fullName = this.getUserFullName(user, type);
    if (fullName) {
      return fullName;
    } else {
      return 'User not active';
    }
  }

  recordAction(action: string | number, actionObj: { checklist: any }) {
    switch (action) {
      case 'add_note':
        this.displayNotesController(actionObj);
        break;
      case 'approve':
        this.confirmApprovalAction(true, 'want to approve', actionObj, action);
        break;
      case 'non_approval':
        this.confirmApprovalAction(
          false,
          'do not want to approve',
          actionObj,
          action
        );
        break;
      case 'complete':
        const foundPendingTask = (actionObj.checklist as Array<any>).find(
          (item) => !item.is_complete
        );
        if (foundPendingTask) {
          this.SweetAlert.confirm({
            title:
              'There are pending tasks in the checklist. Are you sure you want to continue?',
            confirmButtonText: 'Yes',
            cancelButtonText: 'Cancel',
            showLoaderOnConfirm: true,
            focusCancel: true,
            preConfirm: () => {
              return new Promise<void>((resolve) => {
                this.actionButtons.complete = true;
                this.completeAction(actionObj, resolve);
              });
            },
          });
        } else {
          this.completeAction(actionObj);
        }
        break;
      case 'review':
        const params: any = {};
        params.entity_id = this.entity_id;
        params.entity_type = this.entity_type;
        if (this.workflowId) {
          params.workflow_audit_id = this.workflowId;
        }
        if (this.workflow_pending_action_id) {
          params.action_id = this.workflow_pending_action_id;
        }
        if (this.workflow_steps_actions_id) {
          params.workflow_steps_actions_id = this.workflow_steps_actions_id;
        }

        this.httpClient
          .post(`entity_reviews`, params)
          .pipe(finalize(() => (this.actionButtons[action] = false)))
          .subscribe(
            () => {
              this.toaster.success('This workflow has been marked as reviewed');
              this.completeAction(actionObj);
              this.actionButtons[action] = false;
            },
            (error) => {
              // this.toaster.error('Something went wrong. Please try again.');
              const avoid_error_logging_statuses =
                this.BaseDataService.getAvoidErrorLoggingStatusList();
              if (
                !Array.from(avoid_error_logging_statuses).includes(error.status)
              ) {
                return this.utilsService.logError(
                  'Marking workflow as reviewed failed',
                  error
                );
              }
            }
          );
    }
  }

  deleteWorkflow(resolve) {
    this.httpClient
      .delete(`workflow_audits/${this.workflowId}`, {
        headers: this.headers,
      })
      .pipe(finalize(() => resolve()))
      .subscribe(() => {
        this.toaster.success('Workflow has been deleted successfully');
        this.navigateToDashboard();
      });
  }

  confirmDeleteWorkflow() {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to delete this workflow?',
      showLoaderOnConfirm: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'Cancel',
      focusCancel: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.deleteWorkflow(resolve);
        });
      },
    });
  }

  disableActions(action: any) {
    let disableAction = false;
    // disable action for invisible and completed status. if status checks pass then we don't need to check users
    if (action.status === 'Invisible' || action.status === 'Completed') {
      disableAction = true;
      // check for all users, in order to make action disable
    } else if (
      action.users.indexOf(this.current_user.id) === -1 &&
      !this.isFunctionAssigned(action.functions)
    ) {
      disableAction = true;
    }
    return disableAction;
  }

  isFunctionAssigned(functions: Array<any>) {
    let functionAssigned = false;
    functions.forEach((func: any) => {
      if (Array.from(this.myFunctions).includes(func)) {
        functionAssigned = true;
      }
    });
    return functionAssigned;
  }

  completeAction(action: any, resolve = null) {
    const params = {
      id: action.id,
      name: action.name,
      workflow_audit_id: action.workflow_audit_id,
      workflow_steps_id: action.workflow_steps_id,
      workflow_steps_actions_id: action.workflow_steps_actions_id,
      user_id: action.user_id,
      order: action.order,
      action_id: action.action_id,
      status: 'Completed',
      created_at: action.created_at,
      updated_at: action.updated_at,
      updated_by: action.updated_by,
      due_at: action.due_at,
      is_owner_task: action.is_owner_task,
    };
    this.httpClient
      .put(`workflow_steps_audits/${action.id}`, params)
      .pipe(
        finalize(() => {
          this.actionButtons[action] = false;
          if (resolve) {
            resolve();
          } else if (!resolve) {
            action.status = 'Pending';
          }
        })
      )
      .subscribe(() => {
        this.toaster.success('Completed action successfully');
        action.status = 'Completed';
        this.getWorkflowStatus(this.workflowId);
      });
  }

  navigateToDashboard() {
    this.routerService.navigateWithParams(`app.dash`, {
      dashType: 'Activity',
    });
  }
}


