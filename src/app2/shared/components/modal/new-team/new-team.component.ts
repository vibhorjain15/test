import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { PermissionService } from 'src/app2/services/permission/permission.service';
import {
  IGetUsers,
  IResource,
} from 'src/app2/services/permission/permission.type';
import { UtilsService } from 'src/app2/services/utils.service';
import {
  USER_ROLES,
  keywordConstants,
} from 'src/app2/shared/constants/constant';
import { sortByFirstNames } from '../../dv-selector-list/dv-selector.util';
import swal from 'sweetalert2/dist/sweetalert2.js';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { NewTeamServiceService } from 'src/app2/services/new-team/new-team.service';
import { DvValidators } from 'src/app2/shared/validators/no-white-space.validator';
type MemeberListType = IGetUsers & {
  user_name: string;
  role_name: string;
  role_id: string;
  user_id: number;
};
@Component({
  selector: 'new-team',
  templateUrl: './new-team.component.html',
  styleUrls: ['./new-team.component.css'],
})
export class AddTeamModal implements OnInit {
  @Input() user: any;
  @Input() gridData: any;
  @Input() entityData: any;
  isTeam: any = false;

  addTeamForm: FormGroup;
  selectedMembers: IGetUsers[] = [];
  selectedResources = [];
  existing_members_response;
  visibilityText;

  is_admin: any;
  teamType: string;
  addToTeam: any;
  team_members: any;
  idsOfMyTeam: any;
  formData: any;
  alreadyAddedMembers: any;
  membersObject: any;
  adding_new_members: boolean;
  existing_members: Partial<MemeberListType>[];
  editingName: boolean;
  accordionState: Map<string, boolean>;
  current_user: any;
  currentFirmId: any;
  originalTeamMembers: any;
  teamCreated: boolean;
  modifiedData: any;
  resources: any;
  teamSelectorDisplayParams: { id: string; name: string };
  permissions: { entity_type: any; resource_list_ids: {} } & any;

  edit_role_mode: boolean;
  teams: any = [];
  roles: any;
  loading_resources: boolean;
  $q: any;
  loading: boolean;
  $http: any;
  baseUrl: string;
  myTeams: any;
  Restangular: any;
  BaseDataService: any;
  saving_team: boolean;
  roleText: any;
  accessList: any;
  copy_of_team_members: any;
  $scope: any;
  newTeamAdded: boolean;
  createdTeam: any;
  adding_user_to_teams: boolean;
  $uibModalInstance: any;
  updating_role: boolean;
  adding_resources: boolean;
  accessListCopy: any[];

  constructor(
    private readonly PermissionService: PermissionService,
    private readonly NewTeamServiceService: NewTeamServiceService,
    private readonly Utils: UtilsService,
    private readonly toaster: ToastrService,
    private readonly SweetAlert: SweetAlertService
  ) {
    this.accordionState = new Map<string, boolean>([
      ['Members', false],
      ['Permissions', false],
    ]);
  }
  ngOnInit() {
    // @is_investor = @Utils.isInvestor()
    this.is_admin = this.Utils.isAdmin();
    this.teamType = 'new';
    this.addToTeam = {};
    this.team_members = [];
    this.idsOfMyTeam = [];
    this.formData = {};
    this.alreadyAddedMembers = [];
    this.membersObject = {
      memberNames: [],
    };
    this.adding_new_members = false;
    this.existing_members = [];
    this.formData.team_members = [];
    this.editingName = true;
    this.current_user = this.Utils.getCurrentUser();
    this.currentFirmId = this.current_user.firmInfo.id;
    this.originalTeamMembers = [];
    this.teamCreated = false;
    this.modifiedData = [];
    this.resources = [];

    this.createdTeam = {};
    this.addTeamForm = new FormGroup({
      team_name: new FormControl(null, [DvValidators.required]),
      membersObject: new FormGroup({
        role_id: new FormControl(null),
      }),
      visibility: new FormControl(null),
      team: new FormControl(null),
    });

    this.teamSelectorDisplayParams = {
      id: 'id',
      name: 'fullName',
    };
    this.permissions = {
      entity_type: keywordConstants.Product,
      resource_list_ids: [],
      allow_underlying_entities: false,
    };
    if (this.gridData) {
      const team_ids = this.getTeamIds(this.gridData);
      this.modifiedData = this.modifyGridData(team_ids, this.gridData);
    }

    if (this.entityData) {
      this.edit_role_mode = true;
      this.isTeam = true;
    }

    if (this.edit_role_mode) {
      this.getRoles();
    } else if (this.user) {
      this.getRoles();
      this.getTeams();
    } else {
      this.fetchEmployees();
      this.getRoles();
      this.getVisibilityList();
    }
  }

  getTeamIds(gridData: any) {
    const tempTeamIDs = [];
    gridData.foreach((item) => {
      if (tempTeamIDs.indexOf(item.team_id) === -1) {
        tempTeamIDs.push(item.team_id);
      }
    });
    return tempTeamIDs;
  }

  // completed
  getTeamsByUserId(id: string) {
    this.PermissionService.getTeamByuserid(
      this.currentFirmId,
      id,
      (response) => {
        this.myTeams = response;
        if (this.myTeams.length > 0) {
          this.idsOfMyTeam = this.myTeams.map((val) => val.team_id);
        }
        this.teams = this.teams.filter(
          (team: { id: any }) => this.idsOfMyTeam.indexOf(team.id) === -1
        );
      },
      () => {}
    );
  }

  //completed
  removeUserConfirm(entity: any, idx: any) {
    const title = 'Are you sure you want to remove this user?';
    return this.SweetAlert.confirm({
      title,
      confirmButtonText: 'Confirm',
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return this.removeUserFromTeam(entity, idx);
      },
    });
  }

  // completed
  removeUserFromTeam(entity: MemeberListType, idx: any) {
    const payload: any = { members: [] };
    payload.id = this.createdTeam.id;
    payload.name = this.createdTeam.name;
    payload.members.push({
      user_id: entity.user_id,
      role_id: entity.role_id,
      is_active: false,
    });
    this.PermissionService.updateTeamMembers(
      this.currentFirmId,
      payload,
      () => {
        const indexOfAddedMember = this.alreadyAddedMembers.indexOf(
          entity.user_id
        );
        this.existing_members.splice(idx, 1);
        if (indexOfAddedMember > -1) {
          this.alreadyAddedMembers.splice(indexOfAddedMember, 1);
        }
        this.removeAddedUsersFromSelectionList();
        swal.close();
      },
      () => {
        swal.close();
      }
    );
  }

  //completed
  setRoleText() {
    const role = this.roles.find(
      (val) => val.id === this.addTeamForm.value.membersObject.role_id
    );
    if (role) {
      this.roleText = role.description;
    }
  }

  modifyGridData(teamIds: any, gridData: any) {
    const modifiedData = [];
    teamIds.foreach((item) => {
      const obj: any = {};
      obj.team_members = [];
      gridData.foreach((gridItem) => {
        if (gridItem.team_id === item) {
          obj.team_name = gridItem.team_name;
          obj.team_id = gridItem.team_id;
          obj.team_members.push({
            id: gridItem.user_id,
            fullName: gridItem.user_name,
            role: gridItem.role_name,
            role_id: gridItem.role_id,
          });
        }
      });
      modifiedData.push(obj);
    });
    return modifiedData;
  }

  // completed
  setvisibilityText() {
    let private_access = this.accessList.find(
      (val) => val.name === this.addTeamForm.value.visibility
    );
    this.visibilityText = private_access.description;
  }
  // completed
  getVisibilityList() {
    this.PermissionService.getPermissionLevel(
      (response) => {
        this.accessList = response;
        this.accessListCopy = [...this.accessList];
        let private_access = this.accessList.find((val) => val.name === 'All');
        this.addTeamForm.patchValue({
          visibility: private_access.name,
        });
        this.visibilityText = private_access.description;
      },
      () => {}
    );
  }

  // completed
  fetchEmployees() {
    this.PermissionService.getUser(
      this.currentFirmId,
      (response) => {
        this.team_members = response;
        this.copy_of_team_members = JSON.parse(
          JSON.stringify(this.team_members)
        );
        this.team_members = this.team_members.sort(sortByFirstNames);
      },
      () => {}
    );
  }

  // completed
  handleonChangeEntity(members) {
    this.selectedMembers = members;
  }

  // partial completed
  getRoles() {
    this.PermissionService.getRoles(
      this.currentFirmId,
      (response) => {
        this.roles = response;
        if (!this.edit_role_mode || this.user) {
          const viewerRole = this.roles.find(
            (role) => role.name.toLowerCase() === USER_ROLES.READONLY
          );
          this.addTeamForm.patchValue({
            membersObject: {
              role_id: viewerRole.id,
            },
          });
          this.roleText = viewerRole.description;
        }
        if (this.edit_role_mode) {
          this.addTeamForm.patchValue({
            membersObject: {
              role_id: this.entityData.role_id,
            },
          });
          this.setRoleText();
        }
      },
      () => {}
    );
  }

  // completed
  getTeams() {
    this.PermissionService.getTeams(
      this.currentFirmId,
      (response) => {
        this.teams = response;
        if (this.user) {
          this.getTeamsByUserId(this.user.id);
        }
        if (!this.teams.length) {
          this.teams = [{}];
        }
        if (this.edit_role_mode) {
          return (this.formData.team = this.teams.find(
            (val) => val.id === this.entityData.team_id
          ));
        }
      },
      () => {}
    );
  }

  // completed
  removeAddedUsersFromSelectionList() {
    this.team_members = [];
    //filter the list manually to use the copy of each object instead of directly using the object
    this.copy_of_team_members.forEach((member: { id: any }) => {
      if (this.alreadyAddedMembers.indexOf(member.id) === -1) {
        this.team_members.push(Object.assign({}, member));
      }
    });
    this.team_members = this.team_members.sort(sortByFirstNames);
  }

  createNewTeam(term: any) {
    return this.$scope.$apply(() => {
      this.teams.push({ name: term });
      this.newTeamAdded = true;
      return (this.formData.team = this.teams[this.teams.length - 1]);
    });
  }

  // completed
  getApiPayload() {
    const payload: any = { members: [] };
    payload.id = this.createdTeam.id;
    payload.name = this.createdTeam.name;
    this.selectedMembers.forEach((members) => {
      payload.members.push({
        user_id: members.id,
        role_id: this.addTeamForm.value.membersObject.role_id,
        is_active: true,
      });
    });
    return payload;
  }

  //completed
  addUserToTeam(callback) {
    if (!this.addTeamForm.value.team) {
      this.toaster.error('Please select a team');
      return false;
    }
    if (!this.addTeamForm.value.membersObject.role_id) {
      this.toaster.error('Please select access level');
      return false;
    }

    const payload: any = { members: [] };
    payload.id = this.addTeamForm.value.team;
    payload.name = this.teams.find(
      (val) => val.id === this.addTeamForm.value.team
    ).name;
    payload.members.push({
      user_id: this.user.id,
      role_id: this.addTeamForm.value.membersObject.role_id,
      is_active: true,
    });
    this.adding_user_to_teams = true;
    this.PermissionService.updateTeamMembers(
      this.currentFirmId,
      payload,
      () => {
        this.adding_user_to_teams = false;
        callback();
      },
      () => {
        this.adding_user_to_teams = false;
      },
      true
    );
  }

  // completed
  validateData() {
    if (this.selectedMembers.length === 0) {
      this.toaster.error('Please select team members');
      return false;
    }
    return true;
  }

  // completed
  addMembersRow() {
    if (this.validateData()) {
      const payload = this.getApiPayload();
      if (payload) {
        this.adding_new_members = true;
        this.PermissionService.updateTeamMembers(
          this.currentFirmId,
          payload,
          () => {
            this.adding_new_members = false;
            let role = this.roles.find(
              (role) => role.id === this.addTeamForm.value.membersObject.role_id
            );
            const newSelection = this.selectedMembers.map((mem) => ({
              ...mem,
              user_name: mem.fullName,
              role_name: role.alias,
              role_id: role.id,
              user_id: mem.id,
            }));
            this.existing_members.push(...newSelection);
            this.selectedMembers = [];
            this.alreadyAddedMembers = this.existing_members.map(
              (mem) => mem.user_id
            );
            this.removeAddedUsersFromSelectionList();
          },
          () => {
            this.adding_new_members = false;
          }
        );
      }
    }
  }

  //completed
  updateRole(callback) {
    const payload: any = { members: [] };
    payload.name = this.entityData.team_name;
    payload.id = this.entityData.team_id;
    payload.members.push({
      user_id: this.entityData.user_id,
      role_id: this.addTeamForm.value.membersObject.role_id,
      is_active: true,
    });
    this.updating_role = true;

    this.PermissionService.updateTeam(
      this.currentFirmId,
      payload,
      () => {
        this.updating_role = false;
        callback();
      },
      () => {
        this.updating_role = false;
      },
      true,
      'Role updated successfully'
    );
  }

  // completed
  saveTeam() {
    if (this.addTeamForm.valid) {
      const payload: any = {};
      payload.members = [];
      payload.name = this.addTeamForm.value.team_name;
      this.saving_team = true;
      if (this.teamCreated) {
        payload.id = this.createdTeam.id;
        this.PermissionService.updateTeam(
          this.currentFirmId,
          payload,
          (response) => {
            this.createdTeam = response;
            this.saving_team = false;
            this.editingName = false;
          },
          () => (this.saving_team = false)
        );
      } else {
        this.PermissionService.createTeam(
          this.currentFirmId,
          payload,
          (response) => {
            this.createdTeam = response;
            this.saving_team = false;
            this.teamCreated = true;
            this.editingName = false;
          },
          () => (this.saving_team = false)
        );
      }
      this.addTeamForm.get('team_name').markAsUntouched({ onlySelf: true });
    }
  }

  // completed
  handleOnChangeResources(resources: {
    resourceType: string;
    entity: any;
    entities: [];
  }) {
    this.permissions.entity_type = resources.resourceType;
    this.selectedResources = resources.entities;
  }

  // completed
  getPermissionsApiPayload() {
    const obj: any = {};
    obj.assigned_to_entity_type = 'Team';
    obj.entity_type = this.permissions.entity_type;
    obj.entity_ids = this.selectedResources.map((res) => res.id);
    if (this.permissions.entity_type === 'my_firm') {
      obj.entity_ids = [];
      obj.entity_ids.push(this.currentFirmId);
      obj.entity_type = 'Firm';
    }
    obj.assigned_to_entity_ids = [this.createdTeam.id];

    if (this.addTeamForm.value.visibility) {
      obj.access_level = this.addTeamForm.value.visibility;
    }
    obj.allow_underlying_entities = this.permissions.allow_underlying_entities;
    return obj;
  }

  // completed
  validateResourceList() {
    if (
      !this.selectedResources.length &&
      this.permissions.entity_type !== 'my_firm'
    ) {
      this.toaster.error('Please select resources');
      return false;
    }
    return true;
  }

  //completed
  getTeamResources() {
    this.PermissionService.getResources(
      this.currentFirmId,
      this.createdTeam.id,
      'teams',
      (response: IResource[]) => {
        this.resources = response;
      },
      () => {}
    );
  }

  // completed
  revokeAccessModal(entity: any, index: any) {
    return this.SweetAlert.confirm({
      title: 'Are you sure you want to delete permission ?',
      confirmButtonText: 'Confirm',
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return this.revokeAccess(entity, index);
      },
    });
  }

  // completed
  revokeAccess(entity: { id: any }, index: any) {
    this.PermissionService.deleteResourcePermissions(
      this.currentFirmId,
      entity.id,
      () => {
        this.resources.splice(index, 1);
        this.resources = JSON.parse(JSON.stringify(this.resources));
        swal.close();
      },
      () => swal.close()
    );
  }

  // completed
  addPermissionRow() {
    if (this.validateResourceList()) {
      const payload = this.getPermissionsApiPayload();
      this.adding_resources = true;
      this.PermissionService.createResourcePermissions(
        this.currentFirmId,
        payload,
        (res) => {
          this.adding_resources = false;
          this.selectedResources = [];
          this.getTeamResources();
        },
        () => {
          this.adding_resources = false;
        },
        true
      );
    }
  }

  setAllowUnderlyingEntitiesOption(value) {
    this.permissions.allow_underlying_entities = value;
  }

  handleResourceTypeChange(type: string) {
    // in case of Template Resource Type, only "All" option should be visible
    if (type === 'Template') {
      this.accessList = this.accessList.filter((val) => val.name === 'All');
    } else {
      this.accessList = [...this.accessListCopy];
    }
    const access = this.accessList.find((val) => val.name === 'All');
    this.addTeamForm.patchValue({
      visibility: access.name,
    });
    this.visibilityText = access.description;
  }

  handleCancelClick(callback) {
    if (this.edit_role_mode !== undefined && !this.edit_role_mode) {
      this.NewTeamServiceService.getUpdatedTeams();
    }
    callback();
  }

  handleTeamNameEdit(isEditOperation: boolean): void {
    this.editingName = isEditOperation;
    this.accordionState.forEach((_, accordionGroup, accordion) =>
      accordion.set(accordionGroup, false)
    );
  }

  handleAccordionGroupState(value: boolean, property: string): void {
    this.accordionState.set(property, value);
  }
}
