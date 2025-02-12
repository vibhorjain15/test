import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { validateAllFormFields } from 'src/app2/modules/firm-settings/tags-modal/tags-modal.util';
import { WorkflowService } from 'src/app2/services/workflow/workflow.service';
import { ISteps } from '../manage-workflow/manage-workflow.type';

@Component({
  selector: 'manage-workflow-step',
  templateUrl: './manage-workflow-step.component.html',
})
export class ManageWorkflowStepModal implements OnInit {
  mwsForm: FormGroup;
  loading: boolean;

  @Input() allSteps = [];
  @Input() edit_mode: boolean = false;
  @Input() workflowId: number;
  @Input() step: ISteps;
  @Input() successCallback;

  steps = [];

  constructor(private readonly WorkflowService: WorkflowService) {}

  ngOnInit() {
    if (this.edit_mode) {
      this.mwsForm = new FormGroup({
        useStepbuilder: new FormControl(false, []),
        name: new FormControl(this.step.name, [Validators.required]),
        description: new FormControl(this.step.description, []),
        steps: new FormControl('', []),
      });
    } else {
      this.mwsForm = new FormGroup({
        useStepbuilder: new FormControl(false, []),
        name: new FormControl(null, [Validators.required]),
        description: new FormControl(null, []),
        steps: new FormControl('', []),
      });
    }
    this.useStepBuilder();
  }

  save(callback) {
    validateAllFormFields(this.mwsForm);

    if (this.mwsForm.value.useStepbuilder) {
      this.mwsForm.get('name').setValidators([]);
      this.mwsForm.get('name').updateValueAndValidity();
      if (this.steps.length) {
        this.mwsForm.get('steps').setValidators([]);
        this.mwsForm.get('steps').updateValueAndValidity();
      }
    } else {
      this.mwsForm.get('name').setValidators([Validators.required]);
      this.mwsForm.get('name').updateValueAndValidity();
    }

    if (this.mwsForm.valid) {
      this.loading = true;
      let { name, description, useStepbuilder } = this.mwsForm.value;
      if (useStepbuilder) {
        const params = this.steps.map((val) => ({
          workflow_id: this.workflowId,
          name: val.name,
        }));
        this.WorkflowService.createWorkflowStepsBulk(
          this.workflowId,
          params,
          () => {
            this.loading = false;
            callback();
          },
          () => {
            this.loading = false;
          }
        );
        return;
      }

      if (this.edit_mode) {
        const { workflow_id, id, order, destination_index } = this.step;
        const params = {
          name: this.mwsForm.value.name,
          description: this.mwsForm.value.description,
          workflow_id,
          id,
          order,
          destination_index,
        };
        this.WorkflowService.upateWorkflowSteps(
          this.workflowId,
          params,
          () => {
            this.loading = false;
            this.step.name = params.name;
            this.step.description = params.description;
            this.successCallback(this.step);
            callback();
          },
          () => {
            this.loading = false;
          }
        );
        return;
      }

      const params = {
        workflow_id: this.workflowId,
        name,
        description,
      };
      this.WorkflowService.createWorkflowSteps(
        this.workflowId,
        params,
        () => {
          this.loading = false;
          callback();
        },
        () => {
          this.loading = false;
        }
      );
    }
  }

  useStepBuilder() {
    this.mwsForm.controls.steps.setValidators(
      this.mwsForm.value.useStepbuilder ? [Validators.required] : []
    );
    this.mwsForm.controls.steps.updateValueAndValidity();
  }
}
