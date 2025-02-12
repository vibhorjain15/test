import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { UtilsService } from 'src/app2/services/utils.service';
import { WorkflowService } from 'src/app2/services/workflow/workflow.service';
import {
  IWorkFlowEntity,
  IWorkflowRequest,
  IWorkflows,
  IWorkflowUpdate,
} from './manage-workflow.type';
import { keywordConstants } from 'src/app2/shared/constants/constant';
import { validateAllFormFields } from 'src/app2/modules/firm-settings/tags-modal/tags-modal.util';
import { RouterService } from 'src/app2/services/router.service';
import { finalize } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { BaseDataService } from 'src/app2/services/base-data.service';

@Component({
  selector: 'manage-workflow',
  templateUrl: './manage-workflow.component.html',
  styleUrls: ['./manage-workflow.component.css'],
})
export class ManageWorkflowModal implements OnInit {
  @Input() edit_mode: boolean = false;
  @Input() workflowData: IWorkflows;

  document_types: any;
  document_types_loading: any;
  loading: boolean = false;
  workflowForm: FormGroup;
  is_manager: boolean = false;
  all_workflows: IWorkflows[];
  entity_types: IWorkFlowEntity[];

  constructor(
    private readonly store: Store,
    private readonly workflowService: WorkflowService,
    private readonly RouterService: RouterService,
    private readonly Util: UtilsService,
    private readonly BaseDataService: BaseDataService
  ) {}
  ngOnInit() {
    this.is_manager = this.Util.isManager();
    if (this.edit_mode) {
      this.workflowForm = new FormGroup({
        name: new FormControl(this.workflowData.name, [Validators.required]),
        entity_type: new FormControl('', []),
        entity_sub_type: new FormControl(null, []),
        baseWorkflow: new FormControl(null, []),
      });
    } else {
      this.workflowForm = new FormGroup({
        name: new FormControl(null, [Validators.required]),
        entity_type: new FormControl('', [Validators.required]),
        entity_sub_type: new FormControl(null, [Validators.required]),
        baseWorkflow: new FormControl(null, []),
      });
    }
    this.getDocumentTypes();
    this.setEntityTypes();
    this.getWorkflows();
  }

  getDocumentTypes() {
    this.document_types_loading = !this.document_types_loading;
    this.BaseDataService.getAttachmentTypes()
      .pipe(
        finalize(
          () => (this.document_types_loading = !this.document_types_loading)
        )
      )
      .subscribe((response) => {
        this.document_types = response;
      });
    const documentTags = this.store.selectSnapshot(
      (state) => state.user.documentTags
    );
    this.document_types = [...documentTags];
  }

  setEntityTypes() {
    if (this.workflowService.allentityTypes.length === 0)
      this.workflowService.getEntityTypes(() => {
        this.entity_types = this.workflowService.allentityTypes;
        this.setEntityType(this.entity_types[0]);
      });
    else {
      this.entity_types = this.workflowService.allentityTypes;
      this.setEntityType(this.entity_types[0]);
    }
  }

  getWorkflows() {
    if (this.workflowService.allentityTypes.length === 0)
      this.workflowService.getWorkflows(
        () => (this.all_workflows = this.workflowService.allworkflows)
      );
    else this.all_workflows = this.workflowService.allworkflows;
  }

  save(callback) {
    validateAllFormFields(this.workflowForm);
    if (this.workflowForm.valid) {
      this.loading = true;
      if (this.edit_mode) {
        const params: IWorkflowUpdate = {
          name: this.workflowForm.value.name,
          id: this.workflowData.id,
          active: this.workflowData.active,
        };
        this.workflowService.updateWorkflow(
          params,
          () => {
            this.loading = false;
            callback();
          },
          () => (this.loading = false)
        );
      } else {
        const { entity_type, name, entity_sub_type, baseWorkflow } =
          this.workflowForm.value;
        const params: IWorkflowRequest = {
          baseworkflow_id: baseWorkflow,
          entity_sub_type,
          entity_type,
          name,
        };
        this.workflowService.creatWorkflow(
          params,
          (id) => {
            this.loading = false;
            this.RouterService.navigateWithParams(
              'app.firm.settings.workflows.detail.edit',
              { workflowId: id }
            );
            callback();
          },
          () => (this.loading = false)
        );
      }
    }
  }

  setEntityType(type) {
    this.workflowForm.patchValue({
      entity_type: type.value,
    });
    if (this.workflowForm.value.entity_type === 'Document') {
      if (this.document_types?.length > 0) {
        this.workflowForm.patchValue({
          entity_sub_type: this.document_types[0].id,
        });
      }
    } else {
      this.workflowForm.patchValue({
        entity_sub_type: null,
      });
      this.workflowForm.get('entity_sub_type').setValidators([]);
      this.workflowForm.get('entity_sub_type').updateValueAndValidity();
    }
  }

  getEntityTypeName(value) {
    let displayName = this.Util.getDisplayEntityType(value);

    if (this.is_manager && displayName === keywordConstants.Firm) {
      displayName = 'Investor';
    }
    return displayName;
  }
}
