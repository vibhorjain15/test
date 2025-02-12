import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { finalize, take } from 'rxjs/operators';
import swal from 'sweetalert2/dist/sweetalert2.js';
import { RouterService } from 'src/app2/services/router.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { MyPermissionGridService } from './my-permission-grid.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { PermissionService } from 'src/app2/services/permission/permission.service';
import { Select, Store } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import {
  EveryonePermissionTypeId,
  LimitedPermissionTypeId,
  USER_ROLES,
} from 'src/app2/shared/constants/constant';
import { dvTabsList } from 'src/app2/shared/components/dv-tabs/dv-tabs.model';

@Component({
  selector: 'app-my-permissions',
  templateUrl: './my-permissions.component.html',
  styleUrls: ['./my-permissions.component.css'],
})
export class MyPermissionsComponent implements OnInit, OnDestroy {
  loading;
  current_user;
  teams = [];
  loading_assignments;
  is_admin: any;
  currentFirmId: any;
  edit_self_mode: boolean;
  selectedUser: any = {};
  funds: any[] = [];
  firms: any[] = [];
  projects: any[] = [];
  assignmentResources: any;
  is_manager: boolean;
  is_investor: boolean;
  selectionType: any;
  stateParams: any;
  team_members: any;
  saving_team: boolean;
  resources: any;
  columnDefs: any;
  @Select(UserState.getCurrentUserData) user$;
  @Select(UserState.getFirmPreferenceData) firmPref;
  selectedTabForResources = 'Fund';
  gridName = 'my-permissions';
  permissionSub;
  firmPreferences: any;
  tabList: Array<dvTabsList> = [
    {
      name: 'Products',
      link: 'Fund',
      active: true,
      condition: true,
    },
    {
      name: 'Firms',
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

  constructor(
    private readonly Utils: UtilsService,
    private readonly NewModalFactory: CustomModalService,
    private readonly PermissionService: PermissionService,
    private readonly routerService: RouterService,
    private readonly http: HttpClient,
    private readonly toaster: ToastrService,
    private readonly SweetAlert: SweetAlertService,
    private readonly BaseDataService: BaseDataService,
    private readonly myPermissionGridService: MyPermissionGridService,
    private readonly store: Store
  ) {}

  ngOnInit(): void {
    this.user$.pipe(take(1)).subscribe((user) => {
      if (user) {
        this.current_user = JSON.parse(JSON.stringify(user));
        this.currentFirmId = this.current_user.firmInfo.id;
        this.is_manager = this.current_user.isManager;
        this.is_investor = this.current_user.isInvestor;
        this.is_admin = this.current_user.isAdmin;
        this.firmPref.pipe(take(1)).subscribe((pref) => {
          if (pref) {
            this.firmPreferences = pref;
          }
        });
        this.initData();
      }
    });
    this.permissionSub = this.PermissionService.permissionSub.subscribe(
      (res) => {
        this.initData();
      }
    );

    this.edit_self_mode = false;
    this.selectedUser = {};
    this.teams = [];
    this.funds = [];
    this.firms = [];
    this.projects = [];
    this.assignmentResources = null;

    this.stateParams = { ...this.routerService.getState()?.params };
  }

  setSelectionType(type) {
    this.selectionType = type;
  }

  editRole(team) {
    this.NewModalFactory.invoke('new-team', {
      initialState: {
        entityData: team,
      },
      class: 'modal-lg',
    });
  }

  goBack() {
    history.back();
  }

  initData() {
    this.getTeamsByUserId(this.current_user.id);
    this.getSelectedTabData(this.selectedTabForResources);
  }

  goToSelectedEntity(row) {
    this.routerService.navigateWithParams(
      'app.firm.settings.permission.detail',
      {
        entity_id: row.team_id,
        entity_type: 'Team',
        entity_name: row.team_name,
      }
    );
  }

  onCellClicked = (event) => {
    if (!event.data) return;

    if (event.data.permission_type === LimitedPermissionTypeId) {
      // user shouldn't be allowed to access the entity
      return;
    }

    if (!event?.data?.can_redirect)
      return this.toaster.error(
        this.PermissionService.disabledRedirectionMessage
      );

    if (
      event.colDef.colId !== 'selectAll' &&
      event?.data &&
      event?.data?.can_redirect
    ) {
      if (event?.data.entity_type == 'Fund' && this.is_investor)
        this.routerService.navigateWithParams('app.funds.profile.monitor', {
          fundId: event?.data.entity_id,
        });
      else if (event?.data.entity_type == 'Fund' && this.is_manager)
        if (this.current_user.isFreeSubscription) {
          this.routerService.navigateWithParams('app.funds.profile.monitor', {
            fundId: event?.data.entity_id,
          });
        } else {
          this.routerService.navigateWithParams('app.funds.profile.summary', {
            fundId: event?.data.entity_id,
          });
        }
      else if (event?.data.entity_type == 'Firm')
        this.routerService.navigateWithParams('app.firms.profile.monitor', {
          firmId: event?.data.entity_id,
        });
      else if (event?.data.entity_type == 'Template')
        this.routerService.navigateWithParams(
          'app.diligence.template.preview',
          {
            templateId: event.data.entity_id,
          }
        );
      else if (event?.data.entity_type == 'DueDiligence' && this.is_investor)
        this.routerService.navigateWithParams('app.diligence.project.summary', {
          diligenceId: event?.data.entity_id,
        });
      else if (event?.data.entity_type == 'DueDiligence' && this.is_manager)
        this.routerService.navigateWithParams(
          'app.diligence.project.questionnaire',
          { diligenceId: event?.data.entity_id }
        );
    }
  };

  toggleAddRemove(item) {
    if (item.removed) {
      item.removed = false;
    } else {
      item.removed = true;
    }
  }

  revokeAccess(entity, resolve) {
    this.loading = true;
    this.http
      .delete(`firms/${this.currentFirmId}/ResourcePermissions/${entity.id}`)
      .pipe(
        finalize(() => {
          this.loading = false;
          resolve();
        })
      )
      .subscribe(() => {
        this.toaster.success('Permission(s) Deleted');
        this.initData();
      });
  }

  editUser() {
    this.NewModalFactory.invoke('new-user', {
      initialState: {
        existing_user: {
          id: this.current_user.id,
          name: this.current_user.fullName,
        },
        newUser: () => {
          this.initData();
        },
      },
    });
  }

  confirmTeamDeletion() {
    const title = 'Are you sure you want to remove this team?';
    this.SweetAlert.confirm({
      title,
      confirmButtonText: 'Confirm',
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

  removeTeam(resolve) {
    this.http
      .delete(`firms/${this.currentFirmId}/teams/${this.stateParams.entity_id}`)
      .pipe(finalize(() => resolve()))
      .subscribe((res) => {
        this.toaster.success('Team deleted successfully');
        this.goBack();
      });
  }

  confirmUserDeletion() {
    const title = 'Are you sure you want to delete this user?';
    this.SweetAlert.confirm({
      title,
      confirmButtonText: 'Confirm',
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
      .delete('users/' + userId)
      .pipe(finalize(() => resolve()))
      .subscribe(
        (response: any) => {
          this.toaster.success('User removed successfully', '', {
            timeOut: 2000,
          });
          this.routerService.navigate('app.firm.settings.employees');
        },
        (error) => {
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
    const payload = {
      role_id: entity.role_id,
      Assigned_member_ids: [],
      Unassigned_member_ids: [entity.user_id],
      team: {
        id: entity.team_id,
        name: entity.team_name,
      },
    };
    this.http
      .put(`firms/${this.currentFirmId}/teams/${entity.team_id}`, payload)
      .pipe(finalize(() => resolve()))
      .subscribe(
        (response: any) => {
          this.toaster.success('User removed successfully', '', {
            timeOut: 2000,
          });
          this.team_members.splice(idx, 1);
        },
        (error) => {
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
    const title = 'Are you sure you want to remove this team?';
    this.SweetAlert.confirm({
      title,
      confirmButtonText: 'Confirm',
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
    const payload = {
      role_id: entity.role_id,
      Assigned_member_ids: [],
      Unassigned_member_ids: [entity.user_id],
      team: {
        id: entity.team_id,
        name: entity.team_name,
      },
    };
    this.http
      .put(`firms/${this.currentFirmId}/teams/${entity.team_id}`, payload)
      .pipe(finalize(() => resolve()))
      .subscribe(
        (response: any) => {
          this.toaster.success('Team removed successfully', '', {
            timeOut: 2000,
          });
          this.teams.splice(idx, 1);
        },
        (error) => {
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

  addUserToTeam() {
    this.NewModalFactory.invoke('new-team', {
      initialState: {
        user: {
          id: this.current_user.id,
          name: this.current_user.fullName,
        },
      },
      class: 'modal-lg',
    });
  }

  revokeAccessModal(entity) {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to delete permission ?',
      confirmButtonText: 'Confirm',
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

  manageResources(resources: any) {
    this.funds = [];
    this.firms = [];
    this.projects = [];
    for (let item of resources) {
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

  getTeamMembers(id: string) {
    this.http
      .get('firms/' + this.currentFirmId + '/Teams/' + id + '/TeamMemberships')
      .subscribe((response: any) => {
        this.team_members = response.data;
      });
  }

  getTeamsByUserId(id: string) {
    this.http
      .get('firms/' + this.currentFirmId + '/users/' + id + '/TeamMemberships')
      .subscribe((response: any) => {
        this.teams = response;
      });
  }

  getUserResources(id: string) {
    this.http
      .get(
        'firms/' + this.currentFirmId + '/users/' + id + '/ResourcePermissions'
      )
      .subscribe((response: any) => {
        this.resources = response.data;
        this.manageResources(this.resources);
      });
  }

  getTeamResources(id: string) {
    this.http
      .get(
        'firms/' + this.currentFirmId + '/teams/' + id + '/ResourcePermissions'
      )
      .subscribe((response: any) => {
        this.resources = response.data;
        this.manageResources(this.resources);
      });
  }

  handleTabChange(tabIndex: number): void {
    this.getSelectedTabData(this.tabList[tabIndex].link);
  }

  getSelectedTabData(type) {
    this.loading_assignments = true;
    this.selectedTabForResources = type;
    const defaultColumnDef =
      this.myPermissionGridService.getMyPermissionGridColDef(type);
    defaultColumnDef.map((x) => (x.cellClass = 'my-permission-cursor-pointer'));
    this.store.dispatch(
      new SetDefaultColumnDef({ [this.gridName]: defaultColumnDef })
    );
    const includeDefaultPermissions =
      this.firmPreferences.default_permission_type ===
        EveryonePermissionTypeId &&
      this.current_user.firmwide_role_name?.toLowerCase() !==
        USER_ROLES.SECURITYADMIN; // security admin doesn't have access to entities
    this.myPermissionGridService
      .getMyPermissionGridRowData(
        this.currentFirmId,
        this.current_user.id,
        type,
        includeDefaultPermissions
      )
      .subscribe((response) => {
        this.assignmentResources = response;
        this.loading_assignments = false;
      });
  }
  ngOnDestroy(): void {
    this.permissionSub.unsubscribe();
  }
}
