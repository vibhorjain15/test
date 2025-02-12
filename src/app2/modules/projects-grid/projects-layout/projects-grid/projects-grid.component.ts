import { HttpHeaders } from '@angular/common/http';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Store } from '@ngxs/store';
import { ColDef } from 'ag-grid-community';
import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { CustomFieldsGridService } from 'src/app2/services/custom-fields-grid.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { ProjectsGridInvestorService } from 'src/app2/services/projects-grid-investor.service';
import { ProjectsGridManagerService } from 'src/app2/services/projects-grid-manager.service';
import { RouterService } from 'src/app2/services/router.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { DvGridComponent } from 'src/app2/shared/components/dv-grid/dv-grid.component';
import {
  DownloadMedium,
  defaultColumn,
  diligenceStatusConstant,
  grid_widths_map,
  keywordConstants,
} from 'src/app2/shared/constants/constant';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import { MyProjectsGridService } from 'src/app2/modules/dashboard/service/my-project.service';
import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';

@Component({
  selector: 'app-projects-grid',
  templateUrl: './projects-grid.component.html',
  styleUrls: ['./projects-grid.component.css'],
})
export class ProjectsGridComponent implements OnInit {
  gridData: any = [];
  columnDefs: ColDef[];
  render_grid: boolean = false;
  @Input() type: string;
  @Input() payload: any;
  @Input() current_user: any;
  @Input() filterData;
  @Input() customFilterInitValue;
  @Output() onLoadView = new EventEmitter();
  @Output() onProjectsDataChanged: EventEmitter<any[]> = new EventEmitter();
  is_investor: boolean;
  is_manager: boolean;
  subscription: any;
  lastUpdatedRowId: any;
  lastPerformedAction: any;
  gridSelectedData: Array<any>;
  show_bulk_actions: boolean = false;
  totalSelectedRecords: number = 0;
  minDate: Date;
  maxDate: Date;
  minDateEditSection: Date;
  sent_diligences_as_of_date: Date;
  sent_diligences_due_date: Date;
  show_bulk_edit_actions: boolean = false;
  maxAsOfDate: any;
  keywordConstants = keywordConstants;
  loading: boolean;
  @ViewChild('projectsGrid') commonGridComponent: DvGridComponent; // ref of common grid component to call the deSelect method
  lastEmittedDate: Date;
  gridName: string;
  projectThreshold = 100;
  projectsApiLoader;
  downloadMedium;
  initGridSection;
  @Input() customFields;
  constructor(
    private readonly projectsGridInvestorService: ProjectsGridInvestorService,
    private readonly projectsGridManagerService: ProjectsGridManagerService,
    private readonly Utils: UtilsService,
    private dvDatePipe: DvDatePipe,
    private readonly toaster: ToastrService,
    private readonly SweetAlert: SweetAlertService,
    private readonly store: Store,
    private readonly ModalFactory: CustomModalService,
    private readonly router: RouterService,
    private readonly customFieldsGridService: CustomFieldsGridService,
    private readonly projectGrid: MyProjectsGridService
  ) {
    this.columnDefs = new Array<ColDef>();
  }

  ngOnInit() {
    this.minDateEditSection = new Date();
    this.maxAsOfDate = this.Utils.getMaxAsOfDateDiligence();
    this.downloadMedium =
      this.current_user.firmInfo.preferences.doc_access_preference;
    this.initGridData();
  }

  initGridData() {
    this.gridSelectedData = new Array<any>();
    this.gridName = `${this.type}-projects-grid`;
    this.show_bulk_edit_actions = false;
    this.is_investor = this.current_user.isInvestor;
    this.is_manager = this.current_user.isManager;
    this.columnDefs = this.is_investor
      ? this.projectsGridInvestorService.getProjectsGridColDef(
          this.type,
          this.customFields
        )
      : this.projectsGridManagerService.getProjectsGridColDef(
          this.type,
          this.customFields
        );
    if (this.type !== 'sent') {
      this.columnDefs.map(
        (columnDef) => (columnDef.cellClass = 'my-permission-cursor-pointer')
      );
    }
    let actionCol = {
      ...defaultColumn,
      colId: 'sentAction',
      headerName: 'Action',
      field: 'sentAction',
      cellRenderer: 'projectActionsSentTabRenderer',
      minWidth: grid_widths_map.sm_column_xxl,
      sortable: false,
      cellRendererParams: {
        updateStatus: (row, action) => {
          this.updateStatus(row, action);
        },
        addSubscribersSentAction: (row) => {
          this.addSubscribersSentAction(row);
        },
      },
    };

    if (this.type === 'sent') {
      this.columnDefs.push(actionCol);
    }
    if (this.type === 'all') {
      actionCol = {
        ...actionCol,
        hide: true,
      };
      this.columnDefs.splice(this.columnDefs.length - 1, 0, actionCol);
    }
    if (this.type !== 'sent' && this.type !== 'closed') {
      const statusCol = {
        ...defaultColumn,
        colId: 'statusIcon',
        headerName: '',
        field: 'statusIcon',
        width: grid_widths_map.icon_lg,
        cellRenderer: 'projectStatusIconRenderer',
        cellRendererParams: {
          isInvestor: this.is_investor,
        },
        flex: 1,
        suppressColumnsToolPanel: true,
      };
      this.columnDefs.push(statusCol);
    }
    this.store.dispatch(
      new SetDefaultColumnDef({ [this.gridName]: this.columnDefs })
    );
    this.render_grid = true;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes.payload &&
      changes.payload.currentValue &&
      JSON.stringify(changes.payload.currentValue) !=
        JSON.stringify(changes.payload.previousValue)
    ) {
      if (
        changes.type &&
        changes.type.currentValue !== changes.type.previousValue
      )
        this.initGridData();
      else this.initGrid();
    }
  }

  initGrid() {
    this.initGridSection = false;
    this.gridData = [];
    if (this.projectsApiLoader) this.projectsApiLoader.unsubscribe();
    if (this.is_investor) {
      this.projectsApiLoader = this.projectsGridInvestorService
        .getProjectsGridData(this.payload)
        .subscribe((response: any) => {
          this.receiveGridData(response);
          this.initGridSection = true;
        });
    } else {
      this.projectsApiLoader = this.projectsGridManagerService
        .getProjectsGridData(this.payload)
        .subscribe((response: any) => {
          this.receiveGridData(response);
          this.initGridSection = true;
        });
    }
  }

  receiveGridData(response: any) {
    this.gridData = response;
    this.customFieldsGridService.mapCustomFieldProjectsResponses(
      this.gridData,
      this.customFields
    );
    this.ModifyDataForDisplay();
    this.clearQuickActions();
    this.render_grid = true;
  }

  ModifyDataForDisplay() {
    this.gridData.forEach((project) => {
      this.ModifyDataForRow(project);
    });
    this.sortGridData();
    this.onProjectsDataChanged.emit(this.gridData);
  }

  ModifyDataForRow(project: any) {
    project.due_at_date = project.due_at ?? null;
    project.due_at = project.due_at
      ? this.dvDatePipe.transform(project.due_at, ['isLocaleDate'])
      : '';
    project.as_of_date_date = project.as_of_date ?? null;
    project.as_of_date = project.as_of_date
      ? this.dvDatePipe.transform(project.as_of_date, ['isLocaleDate'])
      : '';
    project.created_at_date = project.created_at ?? null;
    project.created_at = project.created_at
      ? this.dvDatePipe.transform(project.created_at)
      : '';
    project.closed_at_date = project.closed_at ?? null;
    project.closed_at = project.closed_at
      ? this.dvDatePipe.transform(project.closed_at, ['dvDateTime'])
      : '';
    project.last_updated_at_date = project.last_updated_at ?? null;
    project.last_updated_at = project.last_updated_at
      ? this.dvDatePipe.transform(project.last_updated_at, ['dvDateTime'])
      : '';
    project.last_reminded_at_date = project.last_reminded_at ?? null;
    project.last_reminded_at = project.last_reminded_at
      ? this.dvDatePipe.transform(project.last_reminded_at)
      : '';

    if (project.type == 'dd_review') {
      project['displayType'] = 'Analyst Evaluation';
    } else if (project.type == 'inbound') {
      project['displayType'] = 'Opportunity';
    } else if (project.is_internal) {
      project['displayType'] = 'Internal';
    } else {
      project['displayType'] = 'External';
    }
    if (
      project.status == 'Invited' &&
      project.fromfirm_id == this.current_user.firmInfo.id
    ) {
      project['displayStatus'] = 'Sent';
    } else {
      project['displayStatus'] = project.status.replace(
        /([a-z])([A-Z])/g,
        '$1 $2'
      ); // This code converts TestString into Test String
    }
    project.last_reminded_by_name = project.last_reminded_by_name ?? '';
    project.total_score =
      project.total_score && project.total_score != -1
        ? project.total_score
        : '-';
    project.internal_key = project.key;

    const primaryOwners = project.primary_owners?.split(',');
    project.primary_owners = !!primaryOwners?.length
      ? primaryOwners
      : [project.primary_owners];
    project.started_by = [project.started_by];
    project.entity_type_label =
      project.entity_type == 'Fund' ? 'Product' : project.entity_type;
    if (
      ['all', 'my projects', 'in-progress'].includes(this.type) &&
      ![
        diligenceStatusConstant.NotApproved,
        diligenceStatusConstant.Deleted,
        diligenceStatusConstant.Withdrawn,
        diligenceStatusConstant.Approved,
      ].includes(project.status) &&
      (project.last_sent_followup_timestamp ||
        project.last_received_followup_timestamp)
    ) {
      // append "Follow-up" string so that user can also search by this text in the filter
      project.displayStatus = `${project.displayStatus} Follow-up`;
    }
  }

  sortGridData() {
    if (
      this.type === 'my projects' ||
      this.type === 'in-progress' ||
      this.type === 'all'
    ) {
      this.gridData.sort((a, b) => {
        return this.Utils.sortProjectsByStatus(
          a.displayStatus,
          b.displayStatus
        );
      });
    } else if (this.type === 'closed') {
      this.gridData = this.Utils.sortByDate(this.gridData, 'closed_at_date');
    } else {
      this.gridData.sort((a, b) => a.entity_name?.localeCompare(b.entity_name));
    }
  }

  updateStatus(entity: any, action: string) {
    const status_map = {
      remind: 'Reminded',
      withdraw: 'Withdrawn',
    };
    const status = status_map[action];
    const params = { status };
    const pageUrl = this.projectsGridInvestorService.generatePageUrl(entity);
    const headers = new HttpHeaders().set('page-url', pageUrl);

    this.projectsGridInvestorService
      .updateStatus(entity.id, params, headers)
      .pipe(
        finalize(() =>
          this.projectsGridInvestorService.stopLoadingOfSentActions()
        )
      ) // stop the loader of action buttons
      .subscribe((response: any) => {
        const index = this.gridData.findIndex((x) => x.id === response.id);
        let message: string;
        if (action === 'withdraw') {
          message = 'Project withdrawn';
          this.gridData.splice(index, 1);
        } else {
          message = 'Sent reminder for this project';
          const updatedRow = this.gridData[index];
          updatedRow.last_reminded_at = response.last_reminded_at;
          updatedRow.last_reminded_by_name = response.last_reminded_by_name;
          this.ModifyDataForRow(updatedRow);
          this.gridData[index] = updatedRow;
        }
        this.gridData = [...this.gridData];
        this.toaster.success(message);
        // call fetch counts method of layout component
        this.projectsGridInvestorService.callFetchCountMethod();
      });
  }

  addSubscribersSentAction(diligence: any) {
    this.ModalFactory.invoke('manage-subscribers', {
      initialState: {
        diligence: diligence,
      },
    });
  }

  onRowSelected = (row) => {
    if (row.data) {
      if (row.node.selected) {
        this.gridSelectedData.push(row.data);
      } else {
        const index = this.gridSelectedData.findIndex(
          (x) => x.id === row.data.id
        );
        if (index !== -1) {
          this.gridSelectedData.splice(index, 1);
        }
      }
    }
  };

  onSelectionChanged = (event) => {
    this.show_bulk_actions = this.gridSelectedData.length ? true : false;
    this.totalSelectedRecords = this.gridSelectedData.length;
  };

  redirectToQuestionnaire(entity: any) {
    this.projectGrid.redirectToQuestionnaire(entity, this.is_investor);
  }

  onRowClicked = (row) => {
    if (row?.data) {
      if (
        row.data.displayStatus !== 'Sent' &&
        row.data.displayStatus !== 'Deleted' &&
        row.data.displayStatus !== 'Withdrawn'
      ) {
        if (row.data.displayStatus === 'Invited') {
          const toastInstance = this.toaster.info(
            'Please wait while the request is being processed.',
            'Starting project...'
          );
          this.projectsGridInvestorService
            .updateStatus(row.data.id, { status: 'Started' })
            .pipe(finalize(() => this.toaster.clear(toastInstance.toastId)))
            .subscribe((response: any) => {
              this.redirectToQuestionnaire(response);
            });
        } else {
          this.redirectToQuestionnaire(row.data);
        }
      }
    }
  };

  confirmBulkAction(action: string) {
    let confirm_button_text: string, custom_class: string, message_text: string;
    if (action === 'remind') {
      custom_class = 'primary';
      confirm_button_text = 'Remind';
      message_text = 'send a reminder for';
    } else if (action === 'approve') {
      custom_class = 'primary';
      confirm_button_text = 'Approve';
      message_text = 'approve ';
    } else if (action === 'accept') {
      custom_class = 'primary';
      confirm_button_text = 'Accept';
      message_text = 'accept';
    } else if (action === 'withdraw') {
      custom_class = 'danger';
      confirm_button_text = 'Withdraw';
      message_text = 'withdraw';
    } else if (action === 'delete') {
      custom_class = 'danger';
      confirm_button_text = 'Delete';
      message_text = 'delete';
    } else {
      message_text = action;
    }

    this.SweetAlert.confirm({
      title: `Are you sure you want to ${message_text} ${this.gridSelectedData.length} project(s)?`,
      customClass: custom_class,
      confirmButtonText: confirm_button_text,
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          if (this.gridSelectedData.length > this.projectThreshold) {
            this.showSecondaryAlert(action, resolve);
          } else {
            this.performBulkActions(action, resolve);
            this.deSelectAllRows();
          }
        });
      },
    });
  }
  showSecondaryAlert(action: string, resolve) {
    this.SweetAlert.confirm({
      title: `You have selected more than ${this.projectThreshold} records for this operation. Are you sure you want to continue with this?`,
      customClass: 'danger',
      confirmButtonText: 'Confirm',
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.performBulkActions(action, resolve);
          this.deSelectAllRows();
        });
      },
    });
  }

  editSentdDDBulkActionActive() {
    this.show_bulk_edit_actions = true;
  }

  closeQuickActions() {
    this.show_bulk_actions = false;
    this.cancelQuickActions();
    this.deSelectAllRows();
  }

  cancelQuickActions() {
    this.show_bulk_edit_actions = false;
    this.sent_diligences_as_of_date = null;
    this.sent_diligences_due_date = null;
  }

  clearQuickActions() {
    this.show_bulk_actions = false;
    this.totalSelectedRecords = 0;
  }

  onAsOfDateChange(date: Date) {
    this.sent_diligences_as_of_date = date;
  }

  onDueDateChange(date: Date) {
    this.sent_diligences_due_date = date;
  }

  validateDates() {
    return moment(this.sent_diligences_due_date).isSameOrAfter(
      this.sent_diligences_as_of_date,
      'day'
    );
  }

  checkForValidDates(diligence) {
    let can_proceed = true;
    if (
      this.sent_diligences_as_of_date === null ||
      this.sent_diligences_due_date === null
    ) {
      if (
        this.sent_diligences_as_of_date &&
        moment(diligence.due_at).isBefore(
          this.sent_diligences_as_of_date,
          'day'
        )
      ) {
        can_proceed = false;
      }
      if (
        this.sent_diligences_due_date &&
        moment(diligence.as_of_date).isAfter(
          this.sent_diligences_due_date,
          'day'
        )
      ) {
        can_proceed = false;
      }
    }
    return can_proceed;
  }

  editSentDDBulkAction() {
    if (!this.sent_diligences_due_date && !this.sent_diligences_as_of_date) {
      return;
    }
    if (
      this.sent_diligences_due_date &&
      this.sent_diligences_as_of_date &&
      !this.validateDates()
    ) {
      this.toaster.error('Due date should be greater than As of date');
      return;
    }

    this.loading = true;
    const selected_diligences_temp = this.gridSelectedData.map((x) => x.id);
    const selected_diligences = [];
    const removed_diligences = [];
    this.gridSelectedData.forEach((item) => {
      if (
        (item.status === 'Started' ||
          item.status === 'InReview' ||
          item.status === 'Followup' ||
          item.status === 'Sent') &&
        this.checkForValidDates(item)
      ) {
        selected_diligences.push(item);
      } else {
        removed_diligences.push(item);
      }
    });
    if (selected_diligences.length === 0) {
      this.toaster.error('You cannot change dates for these project(s).');
      this.loading = false;
    } else if (selected_diligences.length < selected_diligences_temp.length) {
      const toaster_err_message =
        'You cannot change dates for (' +
        removed_diligences.length +
        ') project(s)';
      this.toaster.error(toaster_err_message);
      this.loading = false;
      this.deSelectAllRows();
      return;
    }
    if (selected_diligences.length > 0) {
      const sent_diligences_updated_data = {
        diligence_ids: selected_diligences.map((x) => x.id),
        as_of_date: this.sent_diligences_as_of_date
          ? moment(this.sent_diligences_as_of_date).format('YYYY-MM-DD')
          : null,
        due_at: this.sent_diligences_due_date
          ? moment(this.sent_diligences_due_date).format('YYYY-MM-DD')
          : null,
      };

      this.projectsGridInvestorService
        .bulkScheduleDiligences(sent_diligences_updated_data)
        .pipe(
          finalize(() => {
            this.loading = false;
            this.closeQuickActions();
          })
        )
        .subscribe(() => {
          this.initGrid();
          const toaster_message =
            'Eligible projects (' +
            selected_diligences.length +
            ') have been updated';
          this.toaster.success(toaster_message);
        });
    } else {
      this.loading = false;
      this.closeQuickActions();
    }
  }

  performBulkActions(action: string, resolve) {
    let selected_diligences = [];
    const request_payload: any = {};
    let toaster_message = '';
    const count = this.gridSelectedData.length;
    let pageUrl = '';

    if (!this.current_user.isAdmin && !this.current_user.isOwner) {
      this.gridSelectedData.forEach((row, index) => {
        if (
          row.entity_type.toLowerCase() ===
          this.keywordConstants.Product.toLowerCase()
        ) {
          //if diligence type is fund then go to firms.funds route
          pageUrl += `app/diligence/${row.fromfirm_id}/firms/${row.tofirm_id}/funds/${row.entity_id}/projects/${row.id}`;
        } else if (
          row.entity_type.toLowerCase() ===
          this.keywordConstants.Firm.toLowerCase()
        ) {
          //else if it is a firm diligence then go to firms route
          pageUrl += `app/diligence/${row.fromfirm_id}/firms/${row.entity_id}/projects/${row.id}`;
        }
        if (index !== count - 1) {
          pageUrl += ',';
        }
      });
    }

    selected_diligences = this.gridSelectedData.map((x) => x.id);

    request_payload.entity_ids = selected_diligences;
    toaster_message = count + (count > 1 ? ' projects' : ' project');

    if (action === 'remind') {
      const reminded_diligences = this.gridSelectedData
        .filter((x) => x.status !== 'Completed')
        .map((x) => x.id);
      if (reminded_diligences.length) {
        request_payload.entity_ids = reminded_diligences;
        request_payload.status = 'Reminded';
        toaster_message =
          'Reminder sent to ' + reminded_diligences.length + ' project(s)';
      } else {
        this.toaster.error(
          'No projects available for reminder in the selection'
        );
        this.show_bulk_actions = false;
        resolve();
        return;
      }
    } else if (action === 'withdraw') {
      request_payload.status = 'Withdrawn';
      const withdrawn_diligences = this.gridSelectedData
        .filter((x) => x.status === 'Sent')
        .map((x) => x.id);
      if (withdrawn_diligences.length) {
        request_payload.entity_ids = withdrawn_diligences;
        request_payload.status = 'Withdrawn';
        toaster_message = toaster_message + ' withdrawn';
      } else {
        this.toaster.error(
          'No projects available for withdraw in the selection'
        );
        this.show_bulk_actions = false;
        resolve();
        return;
      }
    } else if (action === 'accept') {
      request_payload.status = 'Started';
      toaster_message = toaster_message + ' started';
    } else if (action === 'decline') {
      request_payload.status = 'Declined';
      toaster_message = toaster_message + ' declined';
    } else if (action === 'complete') {
      const completed_diligences = this.gridSelectedData
        .filter((x) => x.status !== 'Invited')
        .map((x) => x.id);
      if (completed_diligences.length) {
        request_payload.entity_ids = completed_diligences;
        request_payload.status = 'Completed';
        toaster_message =
          'Eligible projects (' +
          completed_diligences.length +
          ') have been submitted';
      } else {
        this.toaster.error(
          'No projects available for submission in the selection'
        );
        this.show_bulk_actions = false;
        resolve();
        return;
      }
    } else if (action === 'delete') {
      // ASK Minal/Raj as existing logic seems incorrect
      const deleted_diligences = this.gridSelectedData
        .filter((x) => x.status !== 'Sent')
        .map((x) => x.id);
      if (deleted_diligences.length) {
        request_payload.entity_ids = deleted_diligences;
        request_payload.status = 'Deleted';
        toaster_message = toaster_message + ' deleted';
      } else {
        this.toaster.error(
          'No projects available for deletion in the selection'
        );
        this.show_bulk_actions = false;
        resolve();
        return;
      }
    } else if (action === 'approve') {
      const approval_diligences = this.gridSelectedData
        .filter((x) => x.status === 'Completed' || x.status === 'Followup')
        .map((x) => x.id);
      if (approval_diligences.length) {
        request_payload.entity_ids = approval_diligences;
        request_payload.status = 'Approved';
        toaster_message =
          'Eligible projects (' +
          approval_diligences.length +
          ') have been approved';
      } else {
        this.toaster.error(
          'No projects available for approval in the selection'
        );
        this.show_bulk_actions = false;
        resolve();
        return;
      }
    }

    const headers = new HttpHeaders().set('page-url', pageUrl);
    this.projectsGridInvestorService
      .bulkActions(request_payload, headers)
      .pipe(finalize(() => resolve()))
      .subscribe(
        (response: any) => {
          this.show_bulk_actions = false;
          this.initGrid();
          this.toaster.success(toaster_message);
        },
        (error: any) => {
          this.toaster.error(error.data.message);
        }
      );
  }

  exportSelectedQuestions() {
    const params = {
      project_ids: this.gridSelectedData.map((x) => x.id),
      firm_id: this.current_user.firmInfo.id,
      firm_name: this.current_user.firmInfo.name,
      recipients: [this.current_user.userName],
    };

    this.projectsGridInvestorService
      .exportProjects(params)
      .pipe(
        finalize(() => {
          this.show_bulk_actions = false;
          this.show_bulk_edit_actions = false;
          this.deSelectAllRows();
        })
      )
      .subscribe((response: any) => {
        let message =
          "Once the document is ready for download, it will be accessible in the 'My Downloads' section.";
        if (this.downloadMedium == DownloadMedium.BOTH) {
          message =
            "Once the document is ready for download, it will be accessible in the 'My Downloads' section and in your inbox.";
        }
        this.toaster.success(message, 'Request processed successfully.');
      });
  }

  deSelectAllRows() {
    this.gridSelectedData = new Array<any>();
    this.totalSelectedRecords = 0;
    this.commonGridComponent.deSelectAllRows();
  }

  loadView(event) {
    this.onLoadView.emit(event);
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
