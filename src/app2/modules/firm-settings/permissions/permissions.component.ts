import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { UtilsService } from 'src/app2/services/utils.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { PermissionsService } from './permissions.service';
import { RouterService } from 'src/app2/services/router.service';
import {
  CanDeleteOrEditAtOnce,
  EveryonePermissionTypeId,
  defaultColumn,
  grid_widths_map,
  keywordConstants,
} from 'src/app2/shared/constants/constant';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { DvGridComponent } from 'src/app2/shared/components/dv-grid/dv-grid.component';
import swal from 'sweetalert2/dist/sweetalert2.js';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { PermissionService } from 'src/app2/services/permission/permission.service';
import { UserState } from 'src/app2/store/user/user.state';
import { Select, Store } from '@ngxs/store';
import { finalize, take } from 'rxjs/operators';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';

@Component({
  selector: 'app-permissions',
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.css'],
})
export class PermissionsComponent implements OnInit, OnDestroy {
  show_bulk_actions: boolean = false;
  totalSelectedRecords: number = 0;
  render_grid = false;
  is_admin: any;
  is_manager: any;
  selectionType: string;
  current_user: any;
  currentFirmId: any;
  permissions;
  columnDefs: ColDef[] = [];
  previewClicked: any;
  resources: any;
  loading: boolean;
  gridSelectedData: Array<any>;
  @ViewChild('permissionsGrid') commonGridComponent: DvGridComponent; // ref of common grid component to call the deSelect method
  gridName = 'permissions';
  permissionSub;
  @Select(UserState.getCurrentUserData) user;
  @Select(UserState.getFirmPreferenceData) firmPref;

  canDeleteOrEditAtOnce = CanDeleteOrEditAtOnce;
  firmPreferences: any;
  constructor(
    private readonly Utils: UtilsService,
    private readonly permissionsService: PermissionsService,
    private readonly PermissionServiceApi: PermissionService,
    private readonly NewModalFactory: CustomModalService,
    private readonly SweetAlert: SweetAlertService,
    private readonly routerService: RouterService,
    private readonly http: HttpClient,
    private readonly toaster: ToastrService,
    private readonly store: Store
  ) {}

  ngOnInit() {
    this.permissionSub = this.PermissionServiceApi.permissionSub.subscribe(
      (res) => {
        this.initGrid();
      }
    );
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.current_user = JSON.parse(JSON.stringify(data));
          this.initApi();
        }
      });
  }

  initApi() {
    this.is_admin = this.current_user.isAdmin;
    this.is_manager = this.current_user.isManager;
    this.selectionType = 'person';
    this.currentFirmId = this.current_user.firmInfo.id;
    this.firmPref.pipe(take(1)).subscribe((pref) => {
      if (pref) {
        this.firmPreferences = pref;
      }
    });
    this.render_grid = false;
    this.gridSelectedData = new Array<any>();
    let defaultColumnDef = this.permissionsService.getPermissionsColDef();
    defaultColumnDef = [
      ...defaultColumnDef,
      {
        ...defaultColumn,
        id: 'action',
        colId: 'actions',
        headerName: 'Actions',
        field: 'actions',
        cellRenderer: 'actionsCellRenderer',
        minWidth: grid_widths_map.sm_column_xm,
        cellRendererParams: {
          clickedEdit: (field) => {
            this.editResourceList(field.data.permission);
          },
          clickedRemove: (field) => {
            this.revokeAccessModal(field.data.permission);
          },
        },
        sortable: false,
        headerClass: 'my-permission-cursor-pointer',
      },
    ];
    defaultColumnDef.map(
      (x) =>
        (x.cellClass =
          x.colId !== 'actions' ? 'my-permission-cursor-pointer' : '')
    );
    this.store.dispatch(
      new SetDefaultColumnDef({ [this.gridName]: defaultColumnDef })
    );
    this.initGrid();
  }

  openNewPermissionDialog() {
    this.NewModalFactory.invoke('manage-permissions', {
      initialState: {
        grid_members: [],
      },
      closeInterceptor: () => {
        return new Promise<void>((resolve) => {
          resolve();
          this.closeQuickActions();
        });
      },
    });
  }

  initGrid() {
    this.render_grid = false;
    const includeDefaultPermissions =
      this.firmPreferences.default_permission_type === EveryonePermissionTypeId;
    this.permissionsService
      .getPermissionsRowData(this.currentFirmId, includeDefaultPermissions)
      .subscribe((response) => {
        this.permissions = response;
        this.totalSelectedRecords = this.permissions.length;
        this.render_grid = true;
      });
  }

  confirmBulkResourceDeletion() {
    const title = 'Are you sure you want to delete permissions for selected User(s)/Team(s) ?';
    const text = 'Any default permission selected will be ignored.';
    this.SweetAlert.confirm({
      title,
      text,
      confirmButtonText: 'Confirm',
      focusCancel:false,
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.deleteSelectedResources(resolve);
        });
      },
    }).then(() => {
      swal.close();
      this.deSelectAllRows();
    });
  }

  onCellClicked = (event) => {
    if (
      event.colDef.colId !== 'actions' &&
      event.data &&
      event.data.permission.permission_type !== EveryonePermissionTypeId
    ) {
      this.routerService.navigateWithParams(
        'app.firm.settings.permission.detail',
        {
          entity_id: event?.data.entity_id,
          entity_type: event?.data.entity_type,
          entity_name: event?.data.entity_name,
        }
      );
    }
  };

  onRowSelected = (row) => {
    if (row.data) {
      if (row.node.selected) {
        this.gridSelectedData.push(row.data.permission);
      } else {
        const index = this.gridSelectedData.findIndex(
          (x) => x.id === row.data.permission.id
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

  deleteSelectedResources(resolve) {
    const selectedRows = this.gridSelectedData.filter((x) => !x.is_default);
    if (!selectedRows.length) {
      this.toaster.error(`You can't delete default permissions`);
      resolve();
      return;
    }
    selectedRows.forEach((item) => (item.is_active = false));
    this.http
      .put(
        `firms/${this.currentFirmId}/ResourcePermissions/bulk_update`,
        selectedRows
      )
      .pipe(finalize(() => resolve()))
      .subscribe((response: any) => {
        this.closeQuickActions();
        this.initGrid();
        this.toaster.success('Permission Deleted');
      }),
      (error: any) => {
        this.toaster.error(error.data.message);
      };
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

  setSelectionType(type) {
    this.selectionType = type;
    this.initGrid();
  }

  getEntityTypeName(entity_type) {
    let display_name = this.Utils.getDisplayEntityType(entity_type);
    if (this.is_manager && display_name === keywordConstants.Firm) {
      display_name = 'Investor';
    }
    return display_name;
  }

  getEntityGroupHeaderName(grid, row, col) {
    let entity_name: string;
    const enity_name = '';
    //get group name from the aggregations list.
    for (
      let i = 0, end = row.treeNode.aggregations.length, asc = 0 <= end;
      asc ? i < end : i > end;
      asc ? i++ : i--
    ) {
      const agg = row.treeNode.aggregations[i];
      if (agg.groupVal && agg.groupVal.length > 0) {
        entity_name = agg.groupVal;
      }
    }
    //if we find the group name from the aggregations list, get its appropriate label name, otherwise show 'Ungrouped'
    if (entity_name !== '') {
      entity_name = this.getEntityTypeName(entity_name);
    } else {
      entity_name = 'Ungrouped';
    }
    return entity_name + `(${row.treeNode.children.length})`;
  }

  revokeAccessModal(entity) {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to delete permission ?',
      confirmButtonText: 'Confirm',
      focusCancel:false,
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.revokeAccess(entity, resolve);
        });
      },
    }).then(() => {
      swal.close();
    });
  }

  formatTagsTooltip(tagsList) {
    if (tagsList && tagsList.length > 2) {
      return tagsList.slice(1).join(', ');
    }
  }

  filterResources(query) {
    if (!query) {
      return this.resources;
    }
    const regex = new RegExp(query, 'i');
    return this.resources.filter((fund) => regex.test(fund.name));
  }

  editResourceList(data) {
    this.NewModalFactory.invoke('manage-permissions', {
      initialState: {
        resource_data: data,
      },
      closeInterceptor: () => {
        return new Promise<void>((resolve) => {
          resolve();
          this.closeQuickActions();
        });
      },
    });
  }

  revokeAccess(entity, resolve) {
    this.loading = true;
    this.http
      .delete(`firms/${this.currentFirmId}/ResourcePermissions/${entity.id}`)
      .pipe(finalize(() => resolve()))
      .subscribe(() => {
        const index = this.permissions.findIndex(
          (permission) => permission.permission.id === entity.id
        );
        this.permissions.splice(index, 1);
        this.permissions = [...this.permissions];
        this.closeQuickActions();
        this.toaster.success('', 'Permission(s) Deleted');
      });
  }

  ngOnDestroy(): void {
    this.permissionSub.unsubscribe();
  }
}
