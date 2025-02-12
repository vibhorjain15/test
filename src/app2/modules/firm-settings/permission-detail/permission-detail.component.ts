import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { filter, finalize, take } from 'rxjs/operators';
import swal from 'sweetalert2/dist/sweetalert2.js';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { PermissionResourceGridService } from 'src/app2/services/permission-resource-grid.service';
import { PermissionTeamsGridService } from 'src/app2/services/permission-teams-grid.service';
import {
  CanDeleteOrEditAtOnce,
  defaultColumn,
  EveryonePermissionTypeId,
  grid_widths_map,
  USER_ROLES,
} from 'src/app2/shared/constants/constant';
import { DvGridComponent } from 'src/app2/shared/components/dv-grid/dv-grid.component';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { PermissionService } from 'src/app2/services/permission/permission.service';
import { UserState } from 'src/app2/store/user/user.state';
import { Select, Store } from '@ngxs/store';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import { dvTabsList } from 'src/app2/shared/components/dv-tabs/dv-tabs.model';
import { NavigationEnd, Router } from '@angular/router';
import { RouterService } from 'src/app2/services/router.service';

@Component({
  selector: 'app-permission-detail',
  templateUrl: './permission-detail.component.html',
  styleUrls: ['./permission-detail.component.css'],
})
export class PermissionDetailComponent implements OnInit, OnDestroy {
  loading;
  selectedUser: any = {};
  current_team: any = {};
  stateParams;
  is_admin;
  show_bulk_actions_team_permissions;
  totalSelectedRecords: number = 0;
  totalSelectedRecordsForTeam: number = 0;
  bulkRoleEditMode;
  roles;
  allTeamsUserIsIn = [];
  allTeamMembers;
  is_investor;
  show_bulk_actions;
  bulkResourceEditMode;
  freeSubscription;
  accessList;
  assignments_grid_type;
  loading_teams: boolean = true;
  loading_assignments: boolean = false;
  current_user: any;
  is_manager: boolean;
  team_members: any = [];
  currentFirmId: any;
  edit_self_mode: boolean;
  teams: any[] = [];
  funds: any[] = [];
  firms: any[] = [];
  projects: any[] = [];
  selectedTabForResources: string;
  assignmentResources: any;
  selectionType: any;
  entity_name: any;
  saving_team: boolean;
  resources: any;
  teamsColumnDefs: any;
  resourceColumnDefs: any;
  resourcesGridSelectedData: Array<any> = new Array<any>();
  teamsGridSelectedData: Array<any> = new Array<any>();
  teamMembersGridSelectedData: Array<any> = new Array<any>();
  @ViewChild('permissionsResourcesGrid')
  resourcesGridComponent: DvGridComponent; // ref of common grid component to call the deSelect method
  @ViewChild('permissionsTeamsGrid') teamsGridComponent: DvGridComponent;
  @ViewChild('permissionsTeamMembersGrid')
  teamMembersGridComponent: DvGridComponent;
  @Select(UserState.getCurrentUserData) user;
  @Select(UserState.getFirmPreferenceData) firmPref;
  teamsGridName = 'permission-teams';
  teammembersGridName = 'permission-teammembers';
  resourceGridName = 'permission-resource';
  permissonSub;
  accessListCopy: any[];
  USER_ROLES = USER_ROLES;
  canDeleteOrEditAtOnce = CanDeleteOrEditAtOnce;
  firmPreferences: any;
  tabList: Array<dvTabsList> = [];
  routeSubscription;

  constructor(
    private readonly Utils: UtilsService,
    private readonly NewModalFactory: CustomModalService,
    private readonly PermissionService: PermissionService,
    private readonly http: HttpClient,
    private readonly routerService: RouterService,
    private readonly SweetAlert: SweetAlertService,
    private readonly toaster: ToastrService,
    private readonly BaseDataService: BaseDataService,
    private readonly permissionTeamsGridService: PermissionTeamsGridService,
    private readonly permissionResourceGridService: PermissionResourceGridService,
    private readonly store: Store,
    private readonly router: Router
  ) {}

  ngOnInit() {
    this.routeSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.initApi();
      });
    this.permissonSub = this.PermissionService.permissionSub.subscribe(
      (res) => {
        this.initData();
      }
    );
    this.user.pipe(take(1)).subscribe((data) => {
      if (data) {
        this.current_user = JSON.parse(JSON.stringify(data));
        this.initApi();
      }
    });
  }

  initApi(): void {
    this.firmPref.pipe(take(1)).subscribe((pref) => {
      if (pref) {
        this.firmPreferences = pref;
      }
    });
    this.stateParams = { ...this.routerService.getState()?.params };
    let teamsDefaultColumnDef =
      this.permissionTeamsGridService.getPermissionTeamsColDef(
        this.stateParams.entity_type
      );
    teamsDefaultColumnDef = [
      ...teamsDefaultColumnDef,
      {
        ...defaultColumn,
        colId: 'actions',
        headerName: 'Actions',
        field: 'actions',
        flex: 1,
        minWidth: grid_widths_map.sm_column_xxm,
        cellRenderer: 'actionsCellRenderer',
        cellRendererParams: {
          clickedEdit: (field) => {
            this.editRole(field.data.team);
          },
          clickedRemove: (field) => {
            this.removeTeamConfirm(field.data.team, field.rowIndex);
          },
        },
        sortable: false,
      },
    ];
    teamsDefaultColumnDef.map(
      (x) =>
        (x.cellClass =
          x.colId !== 'actions' ? 'my-permission-cursor-pointer' : '')
    );
    if (
      this.stateParams.entity_type &&
      this.stateParams.entity_type === 'User'
    ) {
      this.store.dispatch(
        new SetDefaultColumnDef({ [this.teamsGridName]: teamsDefaultColumnDef })
      );
    } else {
      this.store.dispatch(
        new SetDefaultColumnDef({
          [this.teammembersGridName]: teamsDefaultColumnDef,
        })
      );
    }

    this.is_admin = this.current_user.isAdmin;
    this.is_investor = this.current_user.isInvestor;
    this.is_manager = this.current_user.isManager;
    this.team_members = [];
    this.current_team = {};
    this.stateParams.entity_id = parseInt(this.stateParams.entity_id);
    this.currentFirmId = this.current_user.firmInfo.id;
    this.edit_self_mode = false;
    this.selectedUser = {};
    this.teams = [];
    this.funds = [];
    this.loading = true;
    this.assignments_grid_type = 'assignments_grid';
    this.firms = [];
    this.projects = [];
    this.selectedTabForResources = 'Fund';
    this.buildTabList();
    this.initData();
    this.getVisibilityList();
    this.getRoles();
    this.assignmentResources = null;
  }

  buildTabList(): void {
    this.tabList = [
      {
        name: 'Products',
        link: 'Fund',
        active: true,
        condition: true,
      },
      {
        name: this.is_investor ? 'Firms' : 'Investors',
        link: 'Firm',
        active: false,
        condition: true,
      },
      {
        name: 'Projects',
        link: 'DueDiligence',
        active: false,
        condition: true,
      },
      {
        name: 'Templates',
        link: 'Template',
        active: false,
        condition: true,
      },
    ];
  }

  editTeam() {
    this.NewModalFactory.invoke('edit-team', {
      initialState: {
        existing_members: this.team_members,
        team: this.current_team,
        adding_member: false,
      },
    });
  }

  setSelectionType(type) {
    this.selectionType = type;
  }

  editRole(team: any) {
    this.NewModalFactory.invoke('new-team', {
      initialState: {
        entityData: team,
      },
      class: 'modal-lg',
    });
  }

  goBack() {
    window.history.back();
  }

  getUserById(id: any) {
    this.http
      .get(`users/${id}`)
      .subscribe((response: any) => (this.selectedUser = response));
  }

  getTeams() {
    this.http
      .get(`firms/${this.currentFirmId}/teams`)
      .subscribe((response: any) => {
        this.teams = response;
        this.current_team = this.teams.find(
          (team) => team.id === Number(this.stateParams.entity_id)
        );
      });
  }

  getTeamMembersAsResource() {
    this.loading_teams = true;
    this.permissionTeamsGridService
      .getPermissionTeamsRowData(
        +this.currentFirmId,
        +this.stateParams.entity_id,
        false
      )
      .subscribe((response) => {
        this.allTeamMembers = response.filter((e: any) => e.user_name != null);
        this.team_members = this.allTeamMembers?.data;
        this.loading_teams = false;
      });
  }

  initData() {
    this.loading = false;
    this.loading_assignments = true;
    this.entity_name = this.stateParams.entity_name;
    if (
      this.stateParams.entity_type &&
      this.stateParams.entity_type === 'User'
    ) {
      this.getUserInTeamsAsResource();
      this.getUserById(this.stateParams.entity_id);
    } else {
      this.getTeamMembersAsResource();
      this.getTeams();
    }
    this.getSelectedTabData(this.selectedTabForResources);
  }

  goToSelectedEntity(team) {
    if (!this.edit_self_mode) {
      const type = this.stateParams.entity_type === 'User' ? 'Team' : 'User';
      const name =
        this.stateParams.entity_type === 'User'
          ? team.team_name
          : team.user_name;
      const entity_id =
        this.stateParams.entity_type === 'User' ? team.team_id : team.user_id;
      this.routerService.navigateWithParams(
        'app.firm.settings.permission.detail',
        {
          entity_id,
          entity_type: type,
          entity_name: name,
        }
      );
    }
  }

  toggleAddRemove(item) {
    if (item.removed) {
      item.removed = false;
    } else {
      item.removed = true;
    }
  }

  editUser() {
    this.NewModalFactory.invoke('new-user', {
      initialState: {
        existing_user: {
          id: this.stateParams.entity_id,
          name: this.stateParams.entity_name,
        },
        newUser: () => {
          this.initData();
        },
      },
    });
  }

  confirmTeamDeletion() {
    const title = 'Are you sure you want to remove this team?';
    const text = '';
    this.SweetAlert.confirm({
      title,
      confirmButtonText: 'Confirm',
      focusCancel: false,
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.removeTeam(resolve);
        });
      },
    }).then(() => {
      swal.close();
    });
  }

  confirmUserDeletion() {
    const title = 'Are you sure you want to delete this user?';
    const text = '';
    this.SweetAlert.confirm({
      title,
      confirmButtonText: 'Confirm',
      focusCancel: false,
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.removeUserFromPlatform(resolve);
        });
      },
    }).then(() => {
      swal.close();
    });
  }

  removeUserFromPlatform(resolve) {
    const userId = Number(this.stateParams.entity_id);
    this.http
      .delete(`users/${userId}`)
      .pipe(finalize(() => resolve()))
      .subscribe(
        (response: any) => {
          this.toaster.success('User removed successfully', '', {
            timeOut: 2000,
          });
          this.routerService.navigate('app.firm.settings.employees');
        },
        (error: any) => {
          const avoid_error_logging_statuses =
            this.BaseDataService.getAvoidErrorLoggingStatusList();
          if (
            !Array.from(avoid_error_logging_statuses).includes(error.status)
          ) {
            this.Utils.logError('Edit team failed', error);
          }
        }
      );
  }

  removeUserConfirm(entity, idx) {
    const title = 'Are you sure you want to remove this user?';
    this.SweetAlert.confirm({
      title,
      confirmButtonText: 'Confirm',
      focusCancel: false,
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.removeUserFromTeam(entity, idx, resolve);
        });
      },
    }).then(() => {
      swal.close();
    });
  }

  removeUserFromTeam(entity, idx, resolve) {
    const payload: any = { members: [] };
    payload.id = entity.team_id;
    payload.name = entity.team_name;
    payload.members.push({
      user_id: entity.user_id,
      role_id: entity.role_id,
      is_active: false,
    });
    this.http
      .put(`firms/${this.currentFirmId}/teams/${entity.team_id}`, payload)
      .pipe(finalize(() => resolve()))
      .subscribe(
        (response: any) => {
          this.toaster.success('User removed successfully', '', {
            timeOut: 2000,
          });
          this.initData();
        },
        (error: any) => {
          const avoid_error_logging_statuses =
            this.BaseDataService.getAvoidErrorLoggingStatusList();
          this.saving_team = false;
          if (
            !Array.from(avoid_error_logging_statuses).includes(error.status)
          ) {
            this.Utils.logError('Edit team failed', error);
          }
        }
      );
  }

  removeTeamConfirm(entity, idx) {
    let title = '';
    if (this.stateParams.entity_type !== 'Team') {
      title = 'Are you sure you want to remove this team?';
    } else {
      title = 'Are you sure you want to remove this user?';
    }
    this.SweetAlert.confirm({
      title,
      confirmButtonText: 'Confirm',
      focusCancel: false,
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.removeTeamFromUser(entity, idx, resolve);
        });
      },
    }).then(() => {
      swal.close();
    });
  }

  removeTeamFromUser(entity, idx, resolve) {
    const payload: any = { members: [] };
    payload.id = entity.team_id;
    payload.name = entity.team_name;
    payload.members.push({
      user_id: entity.user_id,
      role_id: entity.role_id,
      is_active: false,
    });
    this.http
      .put(`firms/${this.currentFirmId}/teams/${entity.team_id}`, payload)
      .pipe(finalize(() => resolve()))
      .subscribe(
        (response: any) => {
          this.toaster.success(
            this.stateParams.entity_type !== 'Team'
              ? 'Team removed successfully'
              : 'User removed successfully',
            '',
            {
              timeOut: 2000,
            }
          );
          this.initData();
        },
        (error: any) => {
          const avoid_error_logging_statuses =
            this.BaseDataService.getAvoidErrorLoggingStatusList();
          if (
            !Array.from(avoid_error_logging_statuses).includes(error.status)
          ) {
            this.Utils.logError('Edit team failed', error);
          }
        }
      );
  }

  addTeamMembers() {
    this.NewModalFactory.invoke('edit-team', {
      initialState: {
        grid_members: this.allTeamMembers,
        existing_members: this.team_members,
        team: this.current_team,
        adding_member: true,
      },
    });
  }

  addUserToTeam() {
    if (
      this.selectedUser?.firmwide_role_name?.toLowerCase() ===
      USER_ROLES.SECURITYADMIN
    ) {
      return;
    }
    this.NewModalFactory.invoke('new-team', {
      initialState: {
        user: {
          id: this.stateParams.entity_id,
          name: this.stateParams.entity_name,
        },
      },
      class: 'modal-lg',
    });
  }

  removeTeam(resolve) {
    this.http
      .delete(`firms/${this.currentFirmId}/teams/${this.stateParams.entity_id}`)
      .pipe(finalize(() => resolve()))
      .subscribe(() => {
        this.toaster.success('Team deleted successfully');
        this.goBack();
      });
  }

  getVisibilityList() {
    this.http.get('PermissionLevels').subscribe((response: any) => {
      this.accessList = response;
      this.accessListCopy = [...this.accessList];
    });
  }

  revokeAccessModal(entity: any) {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to delete permission ?',
      confirmButtonText: 'Confirm',
      focusCancel: false,
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

  onResourcesRowSelected = (row) => {
    if (row.data) {
      if (row.node.selected) {
        this.resourcesGridSelectedData.push(row.data.resource);
      } else {
        const index = this.resourcesGridSelectedData.findIndex(
          (x) => x.id === row.data.resource.id
        );
        if (index !== -1) {
          this.resourcesGridSelectedData.splice(index, 1);
        }
      }
    }
  };

  onResourcesSelectionChanged = (event) => {
    this.show_bulk_actions = this.resourcesGridSelectedData.length
      ? true
      : false;
    this.totalSelectedRecords = this.resourcesGridSelectedData.length;
  };

  onTeamsRowSelected = (row) => {
    if (row.data) {
      if (row.node.selected) {
        this.teamsGridSelectedData.push(row.data.team);
      } else {
        const index = this.teamsGridSelectedData.findIndex(
          (x) => x.id === row.data.team.id
        );
        if (index !== -1) {
          this.teamsGridSelectedData.splice(index, 1);
        }
      }
    }
  };

  onTeamsSelectionChanged = (event) => {
    this.show_bulk_actions_team_permissions = this.teamsGridSelectedData.length
      ? true
      : false;
    this.totalSelectedRecordsForTeam = this.teamsGridSelectedData.length;
  };

  onTeamMembersRowSelected = (row) => {
    if (row.data) {
      if (row.node.selected) {
        this.teamMembersGridSelectedData.push(row.data.team);
      } else {
        const index = this.teamMembersGridSelectedData.findIndex(
          (x) => x.id === row.data.team.id
        );
        if (index !== -1) {
          this.teamMembersGridSelectedData.splice(index, 1);
        }
      }
    }
  };

  onTeamMembersSelectionChanged = (event) => {
    this.show_bulk_actions_team_permissions = this.teamMembersGridSelectedData
      .length
      ? true
      : false;
    this.totalSelectedRecordsForTeam = this.teamMembersGridSelectedData.length;
  };

  confirmBulkTeamMemberDeletion() {
    const title = 'Are you sure you want to remove selected members?';
    this.SweetAlert.confirm({
      title,
      confirmButtonText: 'Confirm',
      focusCancel: false,
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.deleteSelectedTeamsMembers(resolve);
        });
      },
    }).then(() => {
      swal.close();
    });
  }

  deleteSelectedTeamsMembers(resolve) {
    const selectedRows = [...this.teamMembersGridSelectedData];
    selectedRows.forEach((item) => (item.is_active = false));
    this.http
      .put(
        `firms/${this.currentFirmId}/TeamMemberships/bulk_update`,
        selectedRows
      )
      .pipe(finalize(() => resolve()))
      .subscribe(
        (response: any) => {
          this.initData();
          this.closeQuickActions(this.stateParams.entity_type);
          this.show_bulk_actions_team_permissions = false;
        },
        (error: any) => {
          this.show_bulk_actions_team_permissions = false;
        }
      );
  }

  confirmBulkUserTeamDeletion() {
    const title = 'Are you sure you want to remove selected teams?';
    this.SweetAlert.confirm({
      title,
      confirmButtonText: 'Confirm',
      focusCancel: false,
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.deleteSelectedUserTeams(resolve);
        });
      },
    }).then(() => {
      swal.close();
    });
  }

  deleteSelectedUserTeams(resolve) {
    const selectedRows = [...this.teamsGridSelectedData];
    selectedRows.forEach((item) => (item.is_active = false));
    this.http
      .put(
        `firms/${this.currentFirmId}/TeamMemberships/bulk_update`,
        selectedRows
      )
      .pipe(finalize(() => resolve()))
      .subscribe(
        (response: any) => {
          this.initData();
          this.closeQuickActions(this.stateParams.entity_type);
          this.show_bulk_actions_team_permissions = false;
        },
        (error: any) => {
          this.show_bulk_actions_team_permissions = false;
        }
      );
  }

  closeQuickActions(type: string) {
    if (type === this.assignments_grid_type) {
      this.show_bulk_actions = false;
    } else {
      this.show_bulk_actions_team_permissions = false;
    }
    this.deSelectAllRows(type);
  }

  deSelectAllRows(type) {
    if (type === this.assignments_grid_type) {
      this.resourcesGridSelectedData = new Array<any>();
      this.resourcesGridComponent?.deSelectAllRows();
      this.totalSelectedRecords = 0;
    } else if (type === 'User') {
      // if entity type is 'User', we show teams grid on UI. so deselect all the rows of Teams grid
      this.teamsGridSelectedData = new Array<any>();
      this.teamsGridComponent?.deSelectAllRows();
      this.totalSelectedRecordsForTeam = 0;
    } else if (type === 'Team') {
      // if entity type is 'Team', we show team members grid on UI. so deselect all the rows of Teams grid
      this.teamMembersGridSelectedData = new Array<any>();
      this.teamMembersGridComponent?.deSelectAllRows();
      this.totalSelectedRecordsForTeam = 0;
    }
  }

  confirmBulkResourceDeletion() {
    const title =
      'Are you sure you want to delete permissions for selected User(s)/Team(s) ?';
    const text = 'Any default permission selected will be ignored.';
    this.SweetAlert.confirm({
      title,
      text,
      confirmButtonText: 'Confirm',
      focusCancel: false,
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.deleteSelectedResources(resolve);
        });
      },
    }).then(() => {
      swal.close();
    });
  }

  deleteSelectedResources(resolve) {
    const validSelectedRows = this.resourcesGridSelectedData.filter(
      (x) =>
        !x.is_default &&
        !x.underlying_entity &&
        !(
          (this.stateParams?.entity_type === 'Team' &&
            x.assigned_to_entity_type === 'User') ||
          (this.stateParams?.entity_type === 'User' &&
            x.assigned_to_entity_type === 'Team')
        )
    );
    if (!validSelectedRows.length) {
      this.toaster.error(`You can't delete the selected permissions`);
      this.closeQuickActions(this.assignments_grid_type);
      resolve();
      return;
    }
    validSelectedRows.forEach((item) => (item.is_active = false));
    this.http
      .put(
        `firms/${this.currentFirmId}/ResourcePermissions/bulk_update`,
        validSelectedRows
      )
      .pipe(finalize(() => resolve()))
      .subscribe((response: any) => {
        this.getSelectedTabData(this.selectedTabForResources);
        this.closeQuickActions(this.assignments_grid_type);
      });
  }

  editSelectedRoles() {
    this.bulkRoleEditMode = true;
  }

  cancelBulkRoleEdit() {
    this.bulkRoleEditMode = false;
  }

  cancelEditSelectedRoles() {
    this.bulkRoleEditMode = false;
  }

  displayAccessChangeConfirmation(data, type) {
    let title = '';
    if (type === 'assignment') {
      title =
        'Are you sure you want to change visibility to ' + data.alias + ' ?';
    } else {
      title = 'Are you sure you want to change role ' + data.alias + ' ?';
    }
    const text = 'Any default permission selected will be ignored.';
    this.SweetAlert.confirm({
      title,
      text,
      confirmButtonText: 'Confirm',
      focusCancel: false,
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.bulkEditAccess(data, type, resolve);
        });
      },
    }).then(() => {
      swal.close();
    });
  }

  bulkEditAccess(data, type, resolve) {
    let items_arr: Array<any>;
    if (type === 'assignment') {
      items_arr = this.resourcesGridSelectedData.filter((x) => !x.is_default);
      if (!items_arr.length) {
        this.toaster.error(
          `You can't edit ${
            this.stateParams.entity_type === 'User'
              ? 'access level'
              : 'visibility'
          } of default permissions from here`
        );
        resolve();
        return;
      }
    } else if (type === 'teams') {
      if (this.stateParams.entity_type === 'User') {
        items_arr = this.teamsGridSelectedData;
      } else {
        items_arr = this.teamMembersGridSelectedData;
      }
    }

    items_arr.forEach((item) => {
      if (type === 'assignment') {
        item.access_level = data.name;
      } else {
        item.role_id = data.id;
      }
    });

    const observable =
      type === 'assignment'
        ? this.http.put(
            `firms/${this.currentFirmId}/ResourcePermissions/bulk_update`,
            items_arr
          )
        : this.http.put(
            `firms/${this.currentFirmId}/TeamMemberships/bulk_update`,
            items_arr
          );

    observable
      .pipe(
        finalize(() => {
          if (type === 'assignment') {
            this.cancelEdit();
            this.closeQuickActions(this.assignments_grid_type);
          } else {
            this.cancelEditSelectedRoles();
            this.closeQuickActions(this.stateParams.entity_type);
          }
          resolve();
        })
      )
      .subscribe((response: any) => {
        this.initData();
      });
  }

  editSelected() {
    this.bulkResourceEditMode = true;
  }

  cancelEdit() {
    this.bulkResourceEditMode = false;
  }

  revokeAccess(entity, resolve) {
    this.http
      .delete(`firms/${this.currentFirmId}/ResourcePermissions/${entity.id}`)
      .pipe(
        finalize(() => {
          resolve();
        })
      )
      .subscribe(() => {
        this.toaster.success('Permission(s) Deleted');
        this.getSelectedTabData(this.selectedTabForResources);
      });
  }

  getRoles() {
    this.http
      .get(`firms/${this.currentFirmId}/roles`, {
        params: { include_admins: false },
      })
      .subscribe((response: any) => (this.roles = response));
  }

  manageResources(resources: any) {
    const teamIds = [];
    this.funds = [];
    this.firms = [];
    this.projects = [];
    for (let item of [resources]) {
      if (item.entity_type === 'Fund') {
        this.funds.push(item);
      }
      if (item.entity_type === 'Firm') {
        this.firms.push(item);
      }
      if (item.entity_type === 'Duediligence') {
        this.projects.push(item);
      }
    }
  }

  getTeamsByUserId(id: string) {
    this.http
      .get('firms/' + this.currentFirmId + '/users/' + id + '/TeamMemberships')
      .subscribe((response: any) => (this.teams = response.data));
  }

  getUserInTeamsAsResource() {
    this.loading_teams = true;
    this.permissionTeamsGridService
      .getPermissionTeamsRowData(
        +this.currentFirmId,
        +this.stateParams.entity_id
      )
      .subscribe((response) => {
        this.allTeamsUserIsIn = response;
        this.loading_teams = false;
      });
  }

  showInitials(fullName) {
    if (fullName) {
      const firstName = fullName.split(' ').slice(0, -1).join(' ');
      const lastName = fullName.split(' ').slice(-1).join(' ');
      const initials = firstName[0] + lastName[0];
      return initials;
    }
  }

  openNewPermissionDialog() {
    if (
      this.selectedUser?.firmwide_role_name?.toLowerCase() ===
      USER_ROLES.SECURITYADMIN
    ) {
      return;
    }
    this.NewModalFactory.invoke('manage-permissions', {
      initialState: {
        tabType: {
          type: this.stateParams.entity_type,
          id: this.stateParams.entity_id,
          name: this.stateParams.entity_name,
          entity_type: this.selectedTabForResources,
        },
        grid_members: this.assignmentResources,
      },
    });
  }

  editResourceList(data: any) {
    this.NewModalFactory.invoke('manage-permissions', {
      initialState: {
        resource_data: data,
      },
    });
  }

  getUserResources(id: string) {
    this.http
      .get(`firms/${this.currentFirmId}/users/${id}/ResourcePermissions`)
      .subscribe((response: any) => {
        this.resources = response.data;
        this.manageResources(this.resources);
      });
  }

  getTeamResources(id: string) {
    this.http
      .get(`firms/${this.currentFirmId}/teams/${id}/ResourcePermissions`)
      .subscribe((response: { data: any }) => {
        this.resources = response.data;
        this.manageResources(this.resources);
      });
  }

  openPermissionsRow(row, col) {
    if (
      !row.internalRow &&
      col.field !== 'selectionRowHeaderCol' &&
      col.field !== 'action'
    ) {
      if (row.entity.entity_type === 'Fund' && this.is_investor) {
        this.routerService.navigateWithParams('app.funds.profile.monitor', {
          fundId: row.entity.entity_id,
        });
      } else if (row.entity.entity_type === 'Fund' && this.is_manager) {
        this.routerService.navigateWithParams('app.funds.profile.summary', {
          fundId: row.entity.entity_id,
        });
      } else if (row.entity.entity_type === 'Firm') {
        this.routerService.navigateWithParams('app.firms.profile.monitor', {
          firmId: row.entity.entity_id,
        });
      } else if (
        row.entity.entity_type === 'Duediligence' &&
        this.is_investor
      ) {
        this.routerService.navigateWithParams('app.diligence.project.summary', {
          diligenceId: row.entity.entity_id,
        });
      } else if (row.entity.entity_type === 'Duediligence' && this.is_manager) {
        this.routerService.navigateWithParams(
          'app.diligence.project.questionnaire',
          {
            diligenceId: row.entity.entity_id,
          }
        );
      }
    }
  }

  handleTabChange(tabIndex: number): void {
    this.getSelectedTabData(this.tabList[tabIndex].link);
  }

  getSelectedTabData(type: any) {
    this.loading_assignments = true;
    this.selectedTabForResources = type;
    this.setResourcesColDef();
    this.assignmentResources = [];
    this.closeQuickActions(this.assignments_grid_type);
    const includeDefaultPermissions =
      this.firmPreferences.default_permission_type === EveryonePermissionTypeId;
    this.permissionResourceGridService
      .getPermissionResourceRowData(
        +this.currentFirmId,
        +this.stateParams.entity_id,
        type,
        includeDefaultPermissions,
        this.stateParams.entity_type !== 'Team'
      )
      .subscribe((response) => {
        this.assignmentResources = response;
        this.loading_assignments = false;
        if (this.accessList?.length) {
          if (type === 'Template') {
            this.accessList = this.accessListCopy.filter(
              (x) => x.name === 'All'
            );
          } else {
            this.accessList = [...this.accessListCopy];
          }
        }
      });
  }

  setResourcesColDef() {
    let resourceDefaultColumnDef =
      this.permissionResourceGridService.getPermissionResourceTeamsColDef(
        this.selectedTabForResources
      );

    resourceDefaultColumnDef = [
      ...resourceDefaultColumnDef,
      {
        ...defaultColumn,
        colId: 'actions',
        headerName: 'Actions',
        field: 'actions',
        cellRenderer: 'permissionEntityActionsCellRenderer',
        minWidth: grid_widths_map.sm_column_xxm,
        cellRendererParams: {
          clickedEdit: (field) => {
            this.editResourceList(field.data.resource);
          },
          clickedDelete: (field) => {
            this.revokeAccessModal(field.data.resource);
          },
        },
        sortable: false,
      },
    ];
    resourceDefaultColumnDef.map(
      (x) =>
        (x.cellClass =
          x.colId !== 'actions' ? 'my-permission-cursor-pointer' : '')
    );
    this.store.dispatch(
      new SetDefaultColumnDef({
        [this.resourceGridName]: resourceDefaultColumnDef,
      })
    );
  }

  onCellClicked = (event) => {
    if (event.colDef.colId !== 'actions' && event.data) {
      this.goToSelectedEntity(event?.data.team);
    }
  };

  onPermissionCellClicked = (event) => {
    if (!event?.data) return;

    if (!event.data?.resource?.can_redirect)
      return this.toaster.error(
        this.PermissionService.disabledRedirectionMessage
      );

    if (
      event.colDef.colId !== 'actions' &&
      event?.data?.resource?.can_redirect
    ) {
      if (event.data.entity_type === 'Fund' && this.is_investor) {
        this.routerService.navigateWithParams('app.funds.profile.monitor', {
          fundId: event.data.entity_id,
        });
      } else if (event.data.entity_type === 'Fund' && this.is_manager) {
        this.routerService.navigateWithParams('app.funds.profile.summary', {
          fundId: event.data.entity_id,
        });
      } else if (event.data.entity_type === 'Firm') {
        this.routerService.navigateWithParams('app.firms.profile.monitor', {
          firmId: event.data.entity_id,
        });
      } else if (
        event.data.entity_type === 'Duediligence' &&
        this.is_investor
      ) {
        this.routerService.navigateWithParams('app.diligence.project.summary', {
          diligenceId: event.data.entity_id,
        });
      } else if (event.data.entity_type === 'Duediligence' && this.is_manager) {
        this.routerService.navigateWithParams(
          'app.diligence.project.questionnaire',
          {
            diligenceId: event.data.entity_id,
          }
        );
      } else if (event.data.entity_type === 'Template') {
        this.routerService.navigateWithParams(
          'app.diligence.template.preview',
          {
            templateId: event.data.entity_id,
          }
        );
      }
    }
  };
  ngOnDestroy(): void {
    this.permissonSub.unsubscribe();
    this.routeSubscription.unsubscribe();
  }
}
