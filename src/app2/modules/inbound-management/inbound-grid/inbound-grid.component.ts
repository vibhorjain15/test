import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import {
  defaultColumn,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';
import { InboundService } from '../inbound.service';
import swal from 'sweetalert2/dist/sweetalert2.js';
import { finalize, take, tap } from 'rxjs/operators';
import { DvGridComponent } from 'src/app2/shared/components/dv-grid/dv-grid.component';
import { ToastrService } from 'ngx-toastr';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import { GetCurrentUser } from 'src/app2/store/user/user.action';
import { UserState } from 'src/app2/store/user/user.state';
import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';
@Component({
  selector: 'app-inbound-grid',
  templateUrl: './inbound-grid.component.html',
  styleUrls: ['./inbound-grid.component.css'],
})
export class InboundGridComponent implements OnInit {
  rowData = [];
  gridName = 'inbound';
  gridSelectedData = [];
  show_bulk_actions = false;
  totalSelectedRecords = 0;
  @ViewChild('inboundGrid') commonGridComponent: DvGridComponent;
  @Input() loading = false;
  currentUser: any;
  @Select(UserState.getCurrentUserData) user;
  constructor(
    private readonly inboundService: InboundService,
    private readonly store: Store,
    private readonly SweetAlert: SweetAlertService,
    private readonly toaster: ToastrService,
    private readonly customModalService: CustomModalService,
    private readonly dvDatePipe: DvDatePipe
  ) {}

  ngOnInit(): void {
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.currentUser = data;
        }
      });
    const inboundColDef = this.inboundService.getInboundColDef();
    inboundColDef.push({
      ...defaultColumn,
      colId: 'actions',
      headerName: 'Action',
      field: 'actions',
      minWidth: grid_widths_map.sm_column_xm,
      cellRenderer: 'inboundActionsCellRenderer',
      cellRendererParams: {
        clickedEdit: (field) => {
          this.clickedEdit(field);
        },
        clickedRemove: (field) => {
          this.showDeleteConfigAlert(field);
        },
      },
      sortable: false,
      cellClass: 'center',
    });
    this.store.dispatch(
      new SetDefaultColumnDef({ [this.gridName]: inboundColDef })
    );
    this.initGrid();
  }

  showDeleteConfigAlert(entity) {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to delete the opportunity?',
      confirmButtonText: 'Yes, delete',
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.deleteConfig(entity, resolve);
        });
      },
    }).then(() => {
      swal.close();
    });
  }
  initGrid() {
    this.inboundService
      .getInboundConfigs()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe((response: any) => {
        if (response.count > 0) {
          this.rowData = response.data.map((inbound) => ({
            id: inbound.id,
            name: inbound.name,
            description: inbound.description,
            contacts: inbound.contacts,
            template_name: inbound.template_name,
            template_id: inbound.template_id,
            email_template: inbound.email_template_name,
            due_date: inbound.due_date
              ? this.dvDatePipe.transform(inbound.due_date, ['isLocaleDate'])
              : '',
            as_of_date: inbound.as_of_date
              ? this.dvDatePipe.transform(inbound.as_of_date, ['isLocaleDate'])
              : '',
            links: inbound.redirect_url,
            submission_count: inbound.submission_count,
            visibility: inbound.visibility_type_name,
            entity_type: inbound.entity_type,
            inbound,
          }));
        }
      });
  }
  clickedEdit(data) {
    this.customModalService.invoke('inbound-add-edit', {
      initialState: {
        editMode: true,
        previousOpportunity: data,
        newData: (newData) => {
          this.initGrid();
        },
      },
    });
  }

  deleteConfig(entity, resolve) {
    this.inboundService
      .deleteInboundConfigs(entity.id)
      .pipe(finalize(() => resolve()))
      .subscribe(
        (response) => {
          this.rowData = this.rowData.filter(
            (config) => config.id !== entity.id
          );
        },
        (error) => {
          this.toaster.error('Failed to delete opportunity');
        }
      );
  }

  onRowSelected = (row) => {
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
  };

  onSelectionChanged = (event) => {
    this.show_bulk_actions = this.gridSelectedData.length ? true : false;
    this.totalSelectedRecords = this.gridSelectedData.length;
  };

  closeQuickActions() {
    this.show_bulk_actions = false;
    this.deSelectAllRows();
  }

  deSelectAllRows() {
    this.gridSelectedData = [];
    this.totalSelectedRecords = 0;
    this.commonGridComponent.deSelectAllRows();
  }

  confirmBulkResourceDeletion() {
    const title = 'Are you sure you want to delete the selected Opportunities?';
    const text =
      'Please check the selected opportunities, as you cannot undo this action.';
    this.SweetAlert.confirm({
      title,
      text,
      confirmButtonText: 'Yes, delete',
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.deleteSelectedResources(resolve);
        });
      },
    }).then((res) => {
      swal.close();
      if (res.isConfirmed) {
        this.show_bulk_actions = false;
        this.toaster.success('Opportunity deleted successfully');
      }
      this.deSelectAllRows();
    });
  }

  deleteSelectedResources(resolve) {
    const selectedRows = [...this.gridSelectedData];
    selectedRows.forEach((item) => {
      item.is_active = false;
      this.deleteConfig(item, resolve);
    });
  }
}
