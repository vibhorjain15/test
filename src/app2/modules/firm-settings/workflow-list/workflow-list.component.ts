import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import swal from 'sweetalert2/dist/sweetalert2.js';
import { ToastrService } from 'ngx-toastr';
import { RouterService } from 'src/app2/services/router.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { WorkflowService } from './workflow.service';
import {
  defaultColumn,
  grid_widths_map,
  keywordConstants,
} from 'src/app2/shared/constants/constant';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { WorkflowService as newWorkFlowService } from 'src/app2/services/workflow/workflow.service';
import { Select, Store } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { finalize, take } from 'rxjs/operators';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import { GetCurrentUser } from 'src/app2/store/user/user.action';
import { PanelControl } from 'src/app2/shared/components/dv-panel-heading/dv-panel-heading.component';
import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';

@Component({
  selector: 'app-workflow-list',
  templateUrl: './workflow-list.component.html',
  styleUrls: ['./workflow-list.component.css'],
})
export class WorkflowListComponent implements OnInit, OnDestroy {
  is_freeSubscription;
  workflows;
  columnDefs;
  is_manager: boolean = false;
  modalOptions: { resolve: { edit_mode: boolean } };
  keywordConstants = keywordConstants;
  gridName = 'workflows';
  allWorkflows;
  @Select(UserState.getCurrentUserData) user;
  panelHeadingControls: PanelControl[] = [];
  constructor(
    private readonly workflowService: WorkflowService,
    private readonly newWorkflowService: newWorkFlowService,
    private readonly Utils: UtilsService,
    private readonly SweetAlert: SweetAlertService,
    private readonly http: HttpClient,
    private readonly toaster: ToastrService,
    private readonly ModalFactory: CustomModalService,
    private readonly routerService: RouterService,
    private readonly dvDatePipe: DvDatePipe,
    private readonly store: Store
  ) {}

  initialize(): void {
    this.user.pipe(take(1)).subscribe((user) => {
      if (user) {
        this.is_manager = user.isManager;
        if (!this.is_freeSubscription) {
          this.setPanelHeadingControls();
        }
      }
    });
  }

  ngOnInit(): void {
    this.initialize();
    this.modalOptions = {
      resolve: {
        edit_mode: false,
      },
    };
    let defaultColumnDef = this.workflowService.getWorkflowColDef();
    defaultColumnDef = [
      ...defaultColumnDef,
      {
        ...defaultColumn,
        colId: 'action',
        headerName: 'Action',
        field: 'action',
        sortable: false,
        cellRenderer: 'deleteActionsCellRenderer',
        minWidth: grid_widths_map.sm_column_xm,
        cellRendererParams: {
          clickedRemove: (field) => {
            this.confirmWorkflowDeletion(field.data.workflow);
          },
        },
        headerClass: 'my-permission-cursor-pointer',
      },
    ];
    defaultColumnDef.map(
      (x) =>
        (x.cellClass =
          x.colId !== 'action' ? 'my-permission-cursor-pointer' : '')
    );
    this.store.dispatch(
      new SetDefaultColumnDef({ [this.gridName]: defaultColumnDef })
    );
    this.initGrid();
    this.allWorkflows = this.newWorkflowService.allWorkflows.subscribe(() => {
      this.initGrid();
    });
  }

  setPanelHeadingControls() {
    this.panelHeadingControls = [
      {
        text: 'New Workflow',
        handleClick: this.openAddWorkflowModal.bind(this),
        tooltip: 'Add New Workflow',
        leftIcon: 'plus',
      },
    ];
  }

  openAddWorkflowModal() {
    this.ModalFactory.invoke('manage-workflow', {
      class: 'gray modal-lg',
    });
  }

  confirmWorkflowDeletion(workflow: any) {
    const title = 'Are you sure you want to delete this workflow?';
    this.SweetAlert.confirm({
      title,
      focusCancel: true,
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.deleteWorkflow(workflow, resolve);
        });
      },
    }).then(() => {
      swal.close();
    });
  }

  deleteWorkflow(workflow: { id: any }, resolve) {
    this.http
      .delete(`workflows/${workflow.id}`)
      .pipe(finalize(() => resolve()))
      .subscribe(() => {
        this.toaster.success('Workflow deleted successfully');
        this.initGrid();
      });
  }

  initGrid() {
    this.workflowService.getWorkflowRowData().subscribe((response: any) => {
      const workflows = response[0];
      const tags = response[1];
      this.workflows = workflows.map((workflow) => ({
        id: workflow.id,
        name: workflow.name,
        reference_entity: this.getEntityTypeName(workflow.entity_type),
        usage: workflow.usage,
        last_updated: workflow.updated_at
          ? this.dvDatePipe.transform(workflow.updated_at)
          : workflow.created_at
          ? this.dvDatePipe.transform(workflow.created_at)
          : '',
        tag: tags
          .filter((tag) => tag.id === workflow.entity_sub_type)
          .map((tag) => tag.name),
        workflow,
        last_updated_at: workflow.updated_at ?? workflow.created_at,
      }));
      this.workflows = this.workflows.sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    });
  }

  onCellClicked = (event) => {
    if (event.colDef.colId !== 'action' && event.data) {
      this.routerService.navigateWithParams(
        `app.firm.settings.workflows.detail.edit`,
        {
          workflowId: event.data.id,
        }
      );
    }
  };

  getEntityTypeName(entity_type) {
    let display_name = this.Utils.getDisplayEntityType(entity_type);
    if (this.is_manager && display_name === this.keywordConstants.Firm) {
      display_name = 'Investor';
    }
    return display_name;
  }
  ngOnDestroy(): void {
    this.allWorkflows.unsubscribe();
  }
}
