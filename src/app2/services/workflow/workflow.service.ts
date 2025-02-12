import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { ReplaySubject, Subject } from 'rxjs';
import {
  Action,
  ISteps,
  IWorkFlowEntity,
  IWorkflowRequest,
  IWorkflows,
  IWorkflowUpdate,
} from 'src/app2/shared/components/modal/manage-workflow/manage-workflow.type';

@Injectable({
  providedIn: 'root',
})
export class WorkflowService {
  constructor(
    private readonly http: HttpClient,
    private readonly toaster: ToastrService,
  ) {}

  private entityTypes: IWorkFlowEntity[] = [];
  private workflows: IWorkflows[] = [];
  private currWorkflow: IWorkflows;
  currWorkSub = new ReplaySubject<IWorkflows>(1);
  allWorkflows = new Subject<IWorkflows[]>();

  get allentityTypes() {
    return this.entityTypes;
  }

  get allworkflows() {
    return this.workflows;
  }
  get currentWorkflow() {
    return this.currWorkflow;
  }

  getEntityTypes(success) {
    this.http
      .get(`Workflow_entity_types`)
      .subscribe((response: IWorkFlowEntity[]) => {
        response = response.sort((a, b) => {
          var x = a.value;
          var y = b.value;
          return x < y ? -1 : x > y ? 1 : 0;
        });
        this.entityTypes = response;
        success();
      });
  }

  getWorkflows(success) {
    this.http.get(`workflows`).subscribe((response: IWorkflows[]) => {
      this.workflows = response;
      success();
    });
  }

  creatWorkflow(request: IWorkflowRequest, success, failure) {
    this.http.post('workflows', request).subscribe(
      (response: IWorkflows) => {
        this.workflows.push(response);
        this.allWorkflows.next();
        success(response.id);
        this.toaster.success('Workflow created successfully');
      },
      (error) => {
        failure();
      }
    );
  }

  updateWorkflow(request: IWorkflowUpdate, success, failure) {
    this.http.put(`workflows/${request.id}`, request).subscribe(
      (response: IWorkflows) => {
        this.workflows.forEach((val) => {
          if (val.id === response.id) {
            val.name = response.name;
          }
        });
        this.currWorkflow = response;
        success();
        this.toaster.success('Workflow updated successfully');
      },
      (error) => {
        failure();
      }
    );
  }

  getWorkflow(id: number, success, failure) {
    this.http.get(`workflows/${id}`).subscribe(
      (response: IWorkflows) => {
        this.currWorkflow = response;
        this.currWorkSub.next(this.currWorkflow);
        success();
      },
      () => {
        failure();
      }
    );
  }

  deleteWorkflow(id, success, failure) {
    const local = id ? id : this.currWorkflow.id;
    this.http.delete(`workflows/${local}`).subscribe(
      () => {
        success();
        this.currWorkflow = null;
        this.toaster.success('Workflow deleted successfully');
      },
      (error) => failure()
    );
  }

  createWorkflowStepsBulk(id, params, success, failure) {
    this.http
      .post(`workflows/${id}/workflow_steps/bulk_workflow_steps`, params)
      .subscribe(
        (response: ISteps[]) => {
          this.currWorkflow.steps = this.currWorkflow.steps.concat(response);
          this.getWorkflowStepActions();
          success();
        },
        (error) => failure(error)
      );
  }

  createWorkflowSteps(id, params, success, failure) {
    this.http.post(`workflows/${id}/workflow_steps`, params).subscribe(
      (response: ISteps) => {
        this.currWorkflow.steps.push(response);
        this.getWorkflowStepActions();
        success();
      },
      (error) => failure(error)
    );
  }

  upateWorkflowSteps(id, params, success, failure) {
    this.http
      .put(`workflows/${id}/workflow_steps/${params.id}`, params)
      .subscribe(
        (response: ISteps) => {
          const step = this.currWorkflow.steps.find(
            (step: ISteps) => step.id === response.id
          );
          const index = this.currWorkflow.steps.indexOf(step);
          this.currWorkflow.steps[index] = response;
          this.currWorkflow.steps.sort((a, b) => a.order - b.order);
          //this.getWorkflowStepActions(index);
          success();
        },
        (error) => failure(error)
      );
  }

  getWorkflowStepActions(index?: number) {
    if (this.currWorkflow.steps?.length === 0) {
      this.currWorkSub.next(this.currWorkflow);
      return;
    }
    const ind = index ? index : this.currWorkflow.steps?.length - 1;
    this.http
      .get(
        `workflows/${this.currWorkflow.id}/workflow_steps/${this.currWorkflow.steps[ind]?.id}/workflow_steps_actions`
      )
      .subscribe(
        (response: Action[]) => {
          this.currWorkflow.steps[ind].actions = response;
          this.currWorkflow.index = ind;
          this.currWorkSub.next(this.currWorkflow);
        },
        (error) => {}
      );
  }

  deleteWorkflowStep(step: ISteps, success, failure) {
    this.http
      .delete(`workflows/${this.currWorkflow.id}/workflow_steps/${step.id}`)
      .subscribe(
        (response: any) => {
          success();
        },
        (error) => {
          this.toaster.error(error);
          failure();
        }
      );
  }
}
