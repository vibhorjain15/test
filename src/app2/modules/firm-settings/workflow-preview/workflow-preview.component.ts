import { HttpClient } from '@angular/common/http';
// import { Select } from '@ngxs/store';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import * as moment from 'moment';
import { finalize, take, tap } from 'rxjs/operators';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { DataService } from 'src/app2/services/data.service';
import { RouterService } from 'src/app2/services/router.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { GetTeamMembers } from 'src/app2/store/user/user.action';
import { UserState } from 'src/app2/store/user/user.state';

@Component({
  selector: 'app-workflow-preview',
  templateUrl: './workflow-preview.component.html',
  styleUrls: ['./workflow-preview.component.css'],
})
export class WorkflowPreviewComponent implements OnInit, OnDestroy {
  @Select(UserState.getTeamMembersData) teamMembers$;
  workflow;
  loading_workflow;
  workflowId: any;
  entityId: number;
  @Input() entityType: string;
  minDate: Date;
  teamMembers: any;
  workflow_audits: any;
  functions;
  workflow_due_date: any;
  has_steps: boolean = true;
  workflowPreviewSub;

  constructor(
    private readonly BaseDataService: BaseDataService,
    private readonly http: HttpClient,
    private readonly routerService: RouterService,
    private readonly utilService: UtilsService,
    private readonly store: Store,
    private readonly dataService: DataService,
    private readonly activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.workflowId = this.routerService.getState()?.params?.workflowId;
    this.entityId = 1;
    this.minDate = new Date();
    if (!this.entityType) {
      this.workflowPreviewSub = this.dataService
        .getWorkflowData()
        .subscribe((response: any) => {
          if (response) {
            this.entityType = response.entityType;
            this.getWorkflowPreview(this.workflowId);
          }
        });
    } else {
      this.getWorkflowPreview(this.workflowId);
    }
    this.teamMembers$
      .pipe(
        take(2),
        tap((userData) => {
          if (!userData) {
            this.store.dispatch(new GetTeamMembers());
          }
        })
      )
      .subscribe((teamMembers) => {
        if (teamMembers)
          this.teamMembers = teamMembers.map((teamMember) => ({
            ...teamMember,
            fullname: `${teamMember.firstName} ${teamMember.lastName}`,
          }));
      });
    this.BaseDataService.getFunctions().subscribe((response: any) => {
      this.functions = response;
    });
  }

  getWorkflowPreview(workflowId: any) {
    this.loading_workflow = true;
    this.http
      .get('workflow_audits/preview', {
        params: {
          workflow_id: workflowId,
          entity_id: this.entityId.toString(),
          entity_type: this.entityType,
        },
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
    const lastStep = this.workflow.steps[this.workflow.steps.length - 1];
    const lastStepActions = lastStep.actions;
    const lastAction = lastStepActions[lastStepActions.length - 1];
    this.workflow_due_date = lastAction.due_at;
  }

  groupWorkflowAudits() {
    let stepsObj = this.utilService.groupByArray(
      this.workflow_audits.workflow_steps_audits,
      'workflow_steps_id'
    );
    Object.values(stepsObj).forEach((steps: any) => {
      const actions = this.utilService.groupByArray(
        steps,
        'workflow_steps_actions_id'
      );
      const stepactions = [];
      Object.values(actions).forEach((action: any) => {
        action[0].users = Object.keys(
          this.utilService.groupByArray(action, 'user_id')
        ).filter((x) => x !== 'null');
        action[0].functions = Object.keys(
          this.utilService.groupByArray(action, 'function_id')
        ).filter((x) => x !== 'null');
        action[0].due_at = moment
          .utc(action[0].due_at)
          .local()
          .format('YYYY-MM-DD');
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

  trackByIndex(index: number, element): number {
    return index;
  }

  ngOnDestroy(): void {
    this.workflowPreviewSub.unsubscribe();
  }
}
