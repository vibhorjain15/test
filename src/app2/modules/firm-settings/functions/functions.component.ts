import { Component, OnInit, ViewChild } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { ColDef } from 'ag-grid-community';
import { ToastrService } from 'ngx-toastr';
import { finalize, take } from 'rxjs/operators';
import {
  FunctionsService,
  functionType,
} from 'src/app2/services/functions.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { DvGridComponent } from 'src/app2/shared/components/dv-grid/dv-grid.component';
import { PanelControl } from 'src/app2/shared/components/dv-panel-heading/dv-panel-heading.component';
import { grid_widths_map } from 'src/app2/shared/constants/constant';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import { UserState } from 'src/app2/store/user/user.state';
import swal from 'sweetalert2/dist/sweetalert2.js';

@Component({
  selector: 'app-functions',
  templateUrl: './functions.component.html',
  styleUrls: ['./functions.component.css'],
})
export class FunctionsComponent implements OnInit {
  columnDefs: ColDef[];
  render_grid: boolean;
  current_user: any;
  currentFirmId: number;
  gridData: any;
  show_bulk_actions: boolean;
  totalSelectedRecords: number;
  freeSubscription: boolean;
  gridName: string = 'functions';
  gridSelectedData: Array<any> = new Array<any>();
  @ViewChild('functionsGrid') commonGridComponent: DvGridComponent; // ref of common grid component to call the deSelect method
  @Select(UserState.getCurrentUserData) user;
  panelHeadingControls: PanelControl[] = [];
  constructor(
    private readonly functionsService: FunctionsService,
    private readonly NewModalFactory: CustomModalService,
    private readonly SweetAlert: SweetAlertService,
    private readonly store: Store,
    private readonly toaster: ToastrService
  ) {}

  ngOnInit() {
    this.setPanelHeadingControls();
    this.user.pipe(take(1)).subscribe((data) => {
      if (data) {
        this.current_user = JSON.parse(JSON.stringify(data));
        this.initApi();
      }
    });
  }

  setPanelHeadingControls() {
    this.panelHeadingControls = [
      {
        text: 'User Role',
        tooltip: `Add user roles`,
        handleClick: this.openAddUsersToFunctionModal.bind(this),
        leftIcon: 'plus',
      },
    ];
  }

  initApi(): void {
    this.freeSubscription = this.current_user.isFreeSubscription;
    this.currentFirmId = this.current_user.firmInfo.id;
    this.columnDefs = this.functionsService.getFunctionsColDef();
    this.columnDefs.push({
      colId: 'action',
      headerName: 'Action',
      field: 'action',
      cellRenderer: 'functionsActionsRenderer',
      cellRendererParams: {
        clickedEdit: (row) => {
          this.displayEditFunctionConfirmation(row);
        },
        clickedRemove: (row) => {
          this.displayUserRemovalConfirmation(row);
        },
      },
      filter: false,
      menuTabs: [],
      flex: 1,
      minWidth: grid_widths_map.sm_column_xm,
      headerClass: 'my-permission-cursor-pointer',
      sortable: false,
    });
    this.store.dispatch(
      new SetDefaultColumnDef({ [this.gridName]: this.columnDefs })
    );
    this.initGrid();
  }

  initGrid() {
    this.render_grid = false;
    this.functionsService
      .getFunctions(this.currentFirmId, 'Firm')
      .subscribe((response: Array<any>) => {
        response = response
          .filter(
            (val) =>
              val.function_name !== 'Primary Owner' &&
              val.function_name !== 'Secondary Owner'
          )
          .map((val: functionType) => {
            return {
              function_name: val.function_name,
              function_id: val.function_id,
              user_assigments: val.user_assigments,
              user_assignment_names: val.user_assigments.map(
                (val) => val.user_name
              ),
            };
          });
        this.gridData = response.sort((a, b) =>
          a.function_name.localeCompare(b.function_name)
        );
        this.render_grid = true;
      });
  }

  openAddUsersToFunctionModal() {
    const function_ids = this.gridData.map((x) => x.function_id);
    this.NewModalFactory.invoke('add-users-to-function', {
      initialState: {
        functionsList: null,
        existingFunctions: function_ids,
        OnSuccess: () => {
          this.toaster.success('User roles added successfully');
          this.initGrid();
        },
      },
      class: 'modal-lg',
    });
  }

  bulkAddUsersToFunctions() {
    const items_arr = this.gridSelectedData;
    this.NewModalFactory.invoke('add-users-to-function', {
      initialState: {
        functionsList: items_arr,
        existingFunctions: null,
        OnSuccess: () => {
          this.toaster.success('User roles updated successfully');
          this.closeQuickActions();
          this.initGrid();
        },
      },
      class: 'modal-lg',
    });
  }

  displayEditFunctionConfirmation(entity: any) {
    this.closeQuickActions();
    const functions = [];
    functions.push(entity.data);
    this.NewModalFactory.invoke('add-users-to-function', {
      initialState: {
        functionsList: functions,
        existingFunctions: null,
        OnSuccess: () => {
          this.toaster.success('User roles updated successfully');
          this.closeQuickActions();
          this.initGrid();
        },
      },
      class: 'modal-lg',
    });
  }

  displayUserRemovalConfirmation(entity: any) {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to remove selected user role?',
      type: 'warning',
      confirmButtonText: 'Confirm',
      focusCancel: false,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.removeSelectedFunction(entity, resolve);
        });
      },
    }).then(() => {
      swal.close();
    });
  }

  removeSelectedFunction(entity: any, resolve) {
    const params = [];
    const innerObj: any = {};
    innerObj.user_ids = [];
    innerObj.function_id = entity.data.function_id;
    params.push(innerObj);
    this.functionsService
      .editFunctions(params)
      .pipe(finalize(() => resolve()))
      .subscribe((response: any) => {
        this.toaster.success('User roles removed successfully');
        this.closeQuickActions();
        this.initGrid();
      });
  }

  removeFunctions(resolve) {
    const items_arr = this.gridSelectedData;
    const params = [];
    for (let entry of Array.from(items_arr)) {
      const innerObj: any = {};
      innerObj.user_ids = [];
      innerObj.function_id = entry.function_id;
      params.push(innerObj);
    }
    return this.functionsService
      .editFunctions(params)
      .pipe(finalize(() => resolve()))
      .subscribe((response: any) => {
        this.toaster.success('User roles removed successfully');
        this.closeQuickActions();
        this.initGrid();
      });
  }

  bulkRemoveFunctions() {
    this.SweetAlert.confirm({
      title:
        'Are you sure you want to remove selected user roles and associated users?',
      type: 'warning',
      confirmButtonText: 'Confirm',
      focusCancel: false,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.removeFunctions(resolve);
        });
      },
    }).then(() => {
      swal.close();
    });
  }

  closeQuickActions() {
    this.show_bulk_actions = false;
    this.deSelectAllRows();
  }

  deSelectAllRows() {
    this.gridSelectedData = new Array<any>();
    this.totalSelectedRecords = 0;
    this.commonGridComponent.deSelectAllRows();
  }

  onRowSelected = (row) => {
    if (row.data) {
      if (row.node.selected) {
        this.gridSelectedData.push(row.data);
      } else {
        const index = this.gridSelectedData.findIndex(
          (x) => x.function_id === row.data.function_id
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
}
