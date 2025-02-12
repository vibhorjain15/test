import { Component, DoCheck, OnInit } from '@angular/core';
import * as angular from 'angular';
import swal from 'sweetalert2/dist/sweetalert2.js';
import { ToastrService } from 'ngx-toastr';
import { RouterService } from 'src/app2/services/router.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { keywordConstants } from 'src/app2/shared/constants/constant';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { WorkflowService } from 'src/app2/services/workflow/workflow.service';
import { HttpClient } from '@angular/common/http';
import { finalize, take } from 'rxjs/operators';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { DataService } from 'src/app2/services/data.service';

@Component({
  selector: 'app-workflow-details',
  templateUrl: './workflow-details.component.html',
  styleUrls: ['./workflow-details.component.css'],
})
export class WorkflowDetailsComponent implements OnInit, DoCheck {
  workflow: any = {};
  state;
  workflowId: any;
  is_manager: boolean;
  document_types: any;
  printOptions;
  path: any;
  toUpdate: boolean = false;
  @Select(UserState.getCurrentUserData) user;

  constructor(
    private readonly routerService: RouterService,
    private readonly Utils: UtilsService,
    private readonly BaseDataService: BaseDataService,
    private readonly SweetAlert: SweetAlertService,
    private readonly toaster: ToastrService,
    private readonly ModalFactory: CustomModalService,
    private readonly WorkflowService: WorkflowService,
    private readonly http: HttpClient,
    private readonly dataService: DataService
  ) {}

  ngOnInit(): void {
    this.state = this.routerService.getState();
    this.path = location.hash;
    this.workflowId = this.state?.params?.workflowId;
    this.user.pipe(take(1))
      .subscribe((user) => {
        if (user) {
          this.is_manager = user.isManager;
        }
      });
    this.getWorkflow(this.workflowId);
  }

  ngDoCheck() {
    this.workflow = this.WorkflowService.currentWorkflow;
  }

  getDocumentTypes() {
    this.BaseDataService.getAttachmentTypes().subscribe((response: any) => {
      this.document_types = response;
      this.getEntitySubType();
    });
  }

  getEntitySubType() {
    if (
      this.workflow.entity_type === 'Document' &&
      this.workflow.entity_sub_type !== 0
    ) {
      const index = this.document_types.findIndex(
        (document) => document.id === this.workflow.entity_sub_type
      );
      this.workflow.entity_sub_type_name =
        this.document_types[index]?.name ?? '';
    }
  }

  getWorkflow(id) {
    this.WorkflowService.getWorkflow(
      id,
      () => {
        this.workflow = this.WorkflowService.currentWorkflow;

        this.dataService.setWorkflowData({
          entityType: this.workflow.entity_type,
        });
        this.getDocumentTypes();
        this.printOptions = {
          pageTitle: `DiligenceVault - ${this.workflow.name}`,
        };
      },
      () => {}
    );
  }

  confirmWorkflowDeletion() {
    const title = 'Are you sure you want to delete this workflow?';
    this.SweetAlert.confirm({
      title,
      text: '',
      customClass: 'danger',
      focusCancel: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.deleteWorkflow(resolve);
        });
      },
    }).then(() => {
      swal.close();
    });
  }

  deleteWorkflow(resolve) {
    this.http
      .delete(`workflows/${this.workflowId}`)
      .pipe(finalize(() => resolve()))
      .subscribe(() => {
        this.toaster.success('Workflow deleted successfully');
        this.routerService.navigate('app.firm.settings.workflows.list');
      });
  }

  openEditWorkflowModal() {
    this.toUpdate = true;
    const param = angular.copy(this.workflow);
    this.ModalFactory.invoke('manage-workflow', {
      initialState: {
        edit_mode: true,
        workflowData: param,
      },
      class: 'gray modal-lg',
    });
  }

  getEntityTypeName(entity_type) {
    let display_name = this.Utils.getDisplayEntityType(entity_type);
    if (this.is_manager && display_name === keywordConstants.Firm) {
      display_name = 'Investor';
    }
    return display_name;
  }

  navigateToEdit() {
    this.routerService.navigateWithParams(
      'app.firm.settings.workflows.detail.edit',
      { workflowId: this.workflowId },
      {
        reload: true,
      }
    );
    this.path = '/edit';
  }

  navigateToPreview() {
    this.routerService.navigateWithParams(
      'app.firm.settings.workflows.detail.preview',
      { workflowId: this.workflowId }
    );
    this.path = '/preview';
  }

  navigateToWorkflowList() {
    this.routerService.navigate('app.firm.settings.workflows.list');
  }

  printSection() {
    const el = document.getElementById('workflow-preview');
    const body = document.getElementsByTagName('BODY')[0];
    body.classList.add('print-initiated');
    el.classList.add('print-section');
    window.print();
    setTimeout(() => {
      body.classList.remove('print-initiated');
    }, 0);
  }
}
