import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Select } from '@ngxs/store';
import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';
import { finalize, take } from 'rxjs/operators';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { RouterService } from 'src/app2/services/router.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { keywordConstants } from 'src/app2/shared/constants/constant';
import { DvValidators } from 'src/app2/shared/validators/no-white-space.validator';
import { UserState } from 'src/app2/store/user/user.state';

@Component({
  selector: 'app-workflow-automation-preview',
  templateUrl: './workflow-automation-preview.component.html',
  styleUrls: ['./workflow-automation-preview.component.css'],
})
export class WorkflowAutomationPreview implements OnInit {
  workflowId = null;
  entityId = null;
  entityType = null;
  loading_workflow = false;
  workflow_audits = null;
  workflow = null;
  pageUrl = null;
  workflows = [];
  workflow_due_date = null;
  workflow_audit_preview_form: FormGroup;
  teamMembers = [];
  has_steps;
  functions = [];
  trigger_workflow = false;
  @Select(UserState.getTeamMembersData) teamMembers$;
  minDate: Date;
  headers = {};

  constructor(
    private readonly http: HttpClient,
    private readonly routerService: RouterService,
    private readonly baseDataService: BaseDataService,
    private readonly utils: UtilsService,
    private readonly toaster: ToastrService
  ) {}

  ngOnInit(): void {
    this.minDate = new Date();
    const params = this.routerService.getState()?.params;
    this.workflowId = params?.id;
    this.entityId = params?.entity_id;
    this.entityType = params?.entity_type;
    this.workflow_audit_preview_form = new FormGroup({
      workflowNameControl: new FormControl('', [DvValidators.required]),
      workflowDefinitionControl: new FormControl(''),
      ownerControl: new FormControl(''),
    });

    this.teamMembers$.pipe(take(2)).subscribe((teamMembers) => {
      if (teamMembers)
        this.teamMembers = teamMembers.map((teamMember) => ({
          ...teamMember,
          fullname: `${teamMember.firstName} ${teamMember.lastName}`,
        }));
    });

    if (this.entityType.toLowerCase() === keywordConstants.Firm.toLowerCase()) {
      this.pageUrl = `app/firms/${this.entityId}/workflow_automation/${this.workflowId}`;
      this.init();
    } else if (
      this.entityType.toLowerCase() === keywordConstants.Product.toLowerCase()
    ) {
      this.baseDataService
        .getPermissionEntityDetails(this.entityId, this.entityType)
        .subscribe((response: any) => {
          this.pageUrl = `app/firms/${response.entity_id}/funds/${this.entityId}/workflow_automation/${this.workflowId}`;
          this.init();
        });
    } else if (
      this.entityType.toLowerCase() === keywordConstants.Vehicle.toLowerCase()
    ) {
      this.baseDataService
        .getPermissionEntityDetails(this.entityId, this.entityType)
        .subscribe((response: any) => {
          this.pageUrl = `app/firms/${response.firm_id}/funds/${response.fund_id}/vehicles/${this.entityId}/workflow_automation/${this.workflowId}`;
          this.init();
        });
    } else if (
      this.entityType.toLowerCase() === keywordConstants.Strategy.toLowerCase()
    ) {
      this.baseDataService
        .getPermissionEntityDetails(this.entityId, this.entityType)
        .subscribe((response: any) => {
          this.pageUrl = `app/firms/${response.entity_id}/strategies/${this.entityId}/workflow_automation/${this.workflowId}`;
          this.init();
        });
    } else if (
      this.entityType.toLowerCase() === keywordConstants.Project.toLowerCase()
    ) {
      this.baseDataService
        .getPermissionEntityDetails(this.entityId, this.entityType)
        .subscribe((permission: any) => {
          let fromfirmId: any, fundId: any, tofirmId: any;
          if (
            permission.entity_type.toLowerCase() ===
            keywordConstants.Product.toLowerCase()
          ) {
            fromfirmId = permission.fromfirm_id;
            tofirmId = permission.tofirm_id;
            fundId = permission.entity_id;
            this.pageUrl = `app/diligence/${fromfirmId}/firms/${tofirmId}/funds/${fundId}/projects/${this.entityId}/workflow_automation/${this.workflowId}`;
          } else if (
            permission.entity_type.toLowerCase() ===
            keywordConstants.Firm.toLowerCase()
          ) {
            fromfirmId = permission.fromfirm_id;
            tofirmId = permission.entity_id;
            this.pageUrl = `app/diligence/${fromfirmId}/firms/${tofirmId}/projects/${this.entityId}/workflow_automation/${this.workflowId}`;
          } else if (
            permission.entity_type.toLowerCase() ===
            keywordConstants.Vehicle.toLowerCase()
          ) {
            fromfirmId = permission.fromfirm_id;
            tofirmId = permission.tofirm_id;
            fundId = permission.parent_entity_id;
            const vehicleId = permission.entity_id;
            this.pageUrl = `app/diligence/${fromfirmId}/firms/${tofirmId}/funds/${fundId}/vehicles/${vehicleId}/projects/${this.entityId}/workflow_automation/${this.workflowId}`;
          } else if (
            permission.entity_type.toLowerCase() ===
            keywordConstants.Strategy.toLowerCase()
          ) {
            fromfirmId = permission.fromfirm_id;
            tofirmId = permission.tofirm_id;
            const strategyId = permission.entity_id;
            this.pageUrl = `app/diligence/${fromfirmId}/firms/${tofirmId}/strategies/${strategyId}/projects/${this.entityId}/workflow_automation/${this.workflowId}`;
          }
          this.init();
        });
    } else if (
      this.entityType.toLowerCase() === keywordConstants.Document.toLowerCase()
    ) {
      this.pageUrl = `app/content/docuemnt/${this.entityId}`;
      this.init();
    } else if (
      this.entityType.toLowerCase() === keywordConstants.FormADV.toLowerCase()
    ) {
      this.pageUrl = `app/form_adv/firm/${this.entityId}`;
      this.init();
    } else {
      this.init();
    }
  }

  init() {
    this.baseDataService.getFunctions().subscribe((response: any) => {
      this.functions = response;
    });

    if (this.pageUrl) {
      this.headers['page-url'] = this.pageUrl;
    }

    this.http
      .get('workflows', {
        params: { entity_type: this.entityType },
        headers: this.headers,
      })
      .subscribe((response: any) => {
        this.workflows = response;
        this.getWorkflowAudits(this.workflowId);
      });
  }

  onWorkflowChanged() {
    this.getWorkflowAudits(
      this.workflow_audit_preview_form.value.workflowDefinitionControl
    );
  }

  getWorkflowAudits(workflowId: any) {
    this.loading_workflow = true;
    this.http
      .get('workflow_audits/preview', {
        params: {
          workflow_id: workflowId,
          entity_id: this.entityId.toString(),
          entity_type: this.entityType,
        },
        headers: this.headers,
      })
      .pipe(finalize(() => (this.loading_workflow = false)))
      .subscribe((response: any) => {
        this.workflow_audits = response;
        this.groupWorkflowAudits();
        if (this.workflow_audits.workflow_steps_audits.length > 0) {
          this.getWorkflowDueDate();
        }
      });
  }

  getWorkflowDueDate() {
    const steps = Object.keys(this.workflow.steps);
    const lastStep = steps[steps.length - 1];
    this.workflow_due_date = this.utils.getMaxInArray(
      this.workflow.steps[lastStep].actions,
      'due_at'
    );
  }

  groupWorkflowAudits() {
    let stepsObj = this.utils.groupBy(
      this.workflow_audits.workflow_steps_audits,
      'workflow_steps_id'
    );
    Object.values(stepsObj).forEach((steps: any) => {
      const actions = this.utils.groupBy(steps, 'workflow_steps_actions_id');
      const stepactions = [];
      Object.values(actions).forEach((action: any) => {
        action[0].users = Object.keys(
          this.utils.groupBy(action, 'user_id')
        ).filter((x) => x !== 'null');
        action[0].functions = Object.keys(
          this.utils.groupBy(action, 'function_id')
        ).filter((x) => x !== 'null');
        action[0].due_at = moment(action[0].due_at).toDate();
        stepactions.push(action[0]);
      });
      steps.actions = stepactions;
    });
    this.workflow = {
      entity_id: this.workflow_audits.entity_id,
      entity_type: this.workflow_audits.entity_type,
      firm_id: this.workflow_audits.firm_id,
      name: this.workflow_audits.name,
      owner_id: this.workflow_audits.owner_id,
      pct_complete: this.workflow_audits.pct_complete,
      source: this.workflow_audits.source,
      updated_at: this.workflow_audits.updated_at,
      updated_by: this.workflow_audits.updated_by,
      workflow_id: this.workflow_audits.workflow_id,
      created_at: this.workflow_audits.created_at,
      created_by: this.workflow_audits.created_by,
      entities: this.workflow_audits.entities,
      id: this.workflow_audits.id,
      is_active: this.workflow_audits.is_active,
      description: this.workflow_audits.description,
    };
    let steps = Object.values(stepsObj).sort((a, b) => a[0].order - b[0].order);
    this.workflow.steps = steps;
    this.has_steps = this.workflow.steps.length > 0;
    this.workflow_audit_preview_form.patchValue({
      workflowNameControl: this.workflow.name ?? '',
      workflowDefinitionControl: this.workflow.workflow_id ?? '',
      ownerControl: this.workflow.owner_id,
    });
  }

  getUserFullName(user, type) {
    if (type === 'function') {
      const teamMember = this.functions
        ? this.functions.find((member) => member.function_id === Number(user))
        : null;
      if (teamMember) {
        return teamMember.function_name;
      } else {
        return null;
      }
    } else {
      const teamMember = this.teamMembers.find(
        (member) => member.id === Number(user)
      );
      if (teamMember) {
        return teamMember.fullname;
      } else {
        return null;
      }
    }
  }

  showInitials(user, type) {
    const fullName = this.getUserFullName(user, type);
    if (fullName) {
      const firstName = fullName.split(' ').slice(0, -1).join(' ');
      const lastName = fullName.split(' ').slice(-1).join(' ');
      let initials;
      if (firstName && !lastName) initials = firstName[0];
      if (lastName && !firstName) initials = lastName[0];
      if (firstName && lastName) initials = firstName[0] + lastName[0];
      return initials;
    } else return 'N/A';
  }

  displayUserName(user, type) {
    const fullName = this.getUserFullName(user, type);
    return fullName ? fullName : 'User not active';
  }

  dueDateChanged(event, action) {
    action.due_at = moment(event)
      .set({
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0,
      })
      .toDate();
    this.getWorkflowDueDate();
  }

  ungroupWorkflowAudits() {
    const formValue = this.workflow_audit_preview_form.value;
    let ungroupedWorkflow = {
      ...this.workflow,
      workflow_steps_audits: [],
      name: formValue.workflowNameControl,
      workflow_id: formValue.workflowDefinitionControl,
      owner_id: formValue.ownerControl,
    };
    delete ungroupedWorkflow.steps;
    this.workflow.steps.forEach((step) => {
      step.actions.forEach((action) => {
        action.users.forEach((user) => {
          let newAction = {
            ...action,
            function_id: null,
            user_id: +user,
            due_at: moment(action.due_at).format('YYYY-MM-DD'),
          };
          delete newAction.users;
          delete newAction.functions;
          ungroupedWorkflow.workflow_steps_audits.push(newAction);
        });
        action.functions.forEach((func) => {
          let newAction = {
            ...action,
            user_id: null,
            function_id: +func,
            due_at: moment(action.due_at).format('YYYY-MM-DD'),
          };
          delete newAction.users;
          delete newAction.functions;
          ungroupedWorkflow.workflow_steps_audits.push(newAction);
        });
      });
    });
    return ungroupedWorkflow;
  }

  triggerWorkflow() {
    if (this.workflow_audit_preview_form.invalid) {
      return;
    }
    if (this.validateDueDates()) {
      this.trigger_workflow = true;
      let changedWorkflow = this.ungroupWorkflowAudits();
      this.http
        .post('workflow_audits', changedWorkflow, {
          headers: this.headers,
        })
        .subscribe(
          (response: any) => {
            this.toaster.success('', 'Workflow triggered successfully');
            this.trigger_workflow = false;
            this.routerService.navigateWithParams(
              'app.workflow_automation.detail',
              { Id: response.id }
            );
          },
          (error) => {
            this.trigger_workflow = false;
          }
        );
    } else {
      return this.toaster.error('', 'Action Due dates are not in order');
    }
  }

  validateDueDates() {
    const steps = Object.keys(this.workflow.steps);
    let valid = true;
    let maxInPreviousStep = null;
    steps.forEach((step) => {
      let minInStepAction = this.utils.getMinInArray(
        this.workflow.steps[step].actions,
        'due_at'
      );
      if (maxInPreviousStep && maxInPreviousStep > minInStepAction) {
        valid = false;
        return valid;
      }
      maxInPreviousStep = this.utils.getMaxInArray(
        this.workflow.steps[step].actions,
        'due_at'
      );
    });
    return valid;
  }
}


