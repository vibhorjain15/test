import { Component, OnDestroy, OnInit } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { AccessLevelsService } from './access-levels.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { UserState } from 'src/app2/store/user/user.state';
import { Select, Store } from '@ngxs/store';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import { take } from 'rxjs/operators';
import { NewAccessLevelServiceService } from 'src/app2/services/new-access-level/new-access-level.service';
import {
  defaultColumn,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';
import { ToastrService } from 'ngx-toastr';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { AccessLevelDataService } from 'src/app2/services/access-level.service';
import { PanelControl } from 'src/app2/shared/components/dv-panel-heading/dv-panel-heading.component';

@Component({
  selector: 'app-access-levels',
  templateUrl: './access-levels.component.html',
  styleUrls: ['./access-levels.component.css'],
})
export class AccessLevelsComponent implements OnInit, OnDestroy {
  render_grid;
  is_admin: any;
  current_user: any;
  currentFirmId: any;
  accessLevels: any;
  columnDefs: ColDef[] = [];
  gridName = 'access-levels';
  newAccessLevelSub;
  @Select(UserState.getCurrentUserData) user;
  accessLevelHeadingControls: PanelControl[] = [];
  constructor(
    private readonly accessLevelsService: AccessLevelsService,
    private readonly newAccessLevelServiceService: NewAccessLevelServiceService,
    private readonly newModalFactory: CustomModalService,
    private readonly store: Store,
    private readonly toastr: ToastrService,
    private readonly SweetAlert: SweetAlertService,
    private readonly accessLevelDataService: AccessLevelDataService
  ) {}

  ngOnInit(): void {
    this.user.pipe(take(1))
      .subscribe((user) => {
        if (user) {
          this.current_user = JSON.parse(JSON.stringify(user));
          this.is_admin = user.isAdmin;
          this.initApis();
          this.setAccessLevelHeadingControls();
        }
      });
    this.newAccessLevelSub =
      this.newAccessLevelServiceService.newAccessLevelSub.subscribe(() => {
        this.initGrid();
      });
  }

  setAccessLevelHeadingControls() {
    this.accessLevelHeadingControls = [
      {
        handleClick: this.addNewAccessLevelDialog.bind(this),
        text: 'Access Level',
        leftIcon: 'plus',
        tooltip: 'Add New Access Level'
      },
    ];1
  }

  initApis(): void {
    this.currentFirmId = this.current_user.firmInfo.id;
    let defaultColumnDef = this.accessLevelsService.getAccessLevelsColDef();
    defaultColumnDef = [
      ...defaultColumnDef,
      {
        ...defaultColumn,
        colId: 'actions',
        headerName: 'Actions',
        field: 'actions',
        cellRenderer: 'accessLevelCellActions',
        minWidth: grid_widths_map.sm_column_xm,
        cellRendererParams: {
          clickedEdit: (field) => {
            this.editAccessLevel(field.data);
          },
          clickedRemove: (field) => {
            this.deleteAccessLevel(field.data, field.data.id);
          },
          clickedAssign: (field) => {
            this.assignAccessLevel(field.data);
          },
        },
        sortable: false,
        headerClass: 'my-permission-cursor-pointer',
      },
    ];
    this.store.dispatch(
      new SetDefaultColumnDef({ [this.gridName]: defaultColumnDef })
    );
    this.initGrid();
  }

  initGrid() {
    this.render_grid = false;
    this.accessLevelsService
      .getAccessLevelsRowData(this.currentFirmId)
      .subscribe((response) => {
        this.accessLevels = response;
        this.render_grid = true;
      });
  }
  addNewAccessLevelDialog() {
    //add new  role in new-access-level modal
    if (this.accessLevels) {
      this.newModalFactory.invoke('access-level-description', {
        initialState: {
          gridData: this.accessLevels,
          onSaveNewAccessLevel: (createAccessLevel) => {
            createAccessLevel.users = createAccessLevel.user_count;
            this.accessLevels = [...this.accessLevels, createAccessLevel];
            this.assignAccessLevel(createAccessLevel);
          },
        },
        class: 'modal-md',
      });
    }
  }
  editAccessLevel(rowData) {
    // edit existing role in new-access-level modal
    if (rowData.firm_id && this.currentFirmId == rowData.firm_id) {
      this.newModalFactory.invoke('access-level-description', {
        initialState: {
          role: rowData,
          gridData: this.accessLevels,
          onUpdateAccessLevel: (updateAccessLevel) => {
            updateAccessLevel.users = updateAccessLevel.user_count;
            let updatedIndex = this.accessLevels.findIndex(
              (AccessLevel: any) => AccessLevel.id == updateAccessLevel.id
            );
            if (updatedIndex >= 0) {
              updateAccessLevel.users = updateAccessLevel.user_count =
                this.accessLevels[updatedIndex].users;
              this.accessLevels[updatedIndex] = {
                ...updateAccessLevel,
              };
              this.accessLevels = [...this.accessLevels];
            }
          },
        },
        class: 'modal-md',
      });
    }
  }
  assignAccessLevel(rowData) {
    // assign role to bulk users in assign-access-level modal
    this.newModalFactory.invoke('assign-access-level', {
      initialState: {
        role: rowData,
        gridData: this.accessLevels,
        onAccessLevelAssigned: (selectedUsers: any) => {
          let assignedUserCount: any = selectedUsers.length;
          let udpatedIndex = this.accessLevels.findIndex(
            (AccessLevel: any) => AccessLevel.id == rowData.id
          );
          if (udpatedIndex >= 0) {
            this.accessLevels[udpatedIndex].users += assignedUserCount;
            this.accessLevels[udpatedIndex].user_count =
              this.accessLevels[udpatedIndex].users;
            this.accessLevels = [...this.accessLevels];
          }
          selectedUsers.forEach((user) => {
            this.accessLevels.forEach((level) => {
              if (level.id == user.firmwide_role) {
                level.user_count -= 1;
                level.users -= 1;
              }
            });
          });
        },
      },
      class: 'modal-md',
    });
  }
  deleteAccessLevel(rowData, id) {
    // delete a role
    if (
      rowData.firm_id &&
      this.currentFirmId == rowData.firm_id &&
      rowData.users == 0
    ) {
      this.SweetAlert.confirm({
        title: 'Are you sure you want to delete this access level?',
        text: '',
        focusCancel: false,
        showLoaderOnConfirm: true,
        preConfirm: () => {
          this.accessLevelDataService.deleteRole(id).subscribe(
            (deletedAccessLevel: any) => {
              let deletedIndex = this.accessLevels.findIndex(
                (AccessLevel: any) => AccessLevel.id == id
              );
              if (deletedIndex != -1) {
                this.accessLevels.splice(deletedIndex, 1);
              }
              this.accessLevels = [...this.accessLevels];
              this.toastr.success('Access level deleted successfully');
            },
            (err) => {}
          );
        },
      });
    }
  }
  ngOnDestroy(): void {
    this.newAccessLevelSub.unsubscribe();
  }
}
