import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { PermissionService } from 'src/app2/services/permission/permission.service';
import { IGetUsers } from 'src/app2/services/permission/permission.type';
import { ToastrService } from 'ngx-toastr';
import { UtilsService } from 'src/app2/services/utils.service';
import { sortByFirstNames } from '../../dv-selector-list/dv-selector.util';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { DvValidators } from 'src/app2/shared/validators/no-white-space.validator';
import { USER_ROLES } from 'src/app2/shared/constants/constant';

@Component({
  selector: 'edit-team',
  templateUrl: './edit-team.component.html',
})
export class EditTeamModal implements OnInit {
  @Input() existing_members: any;
  @Input() grid_members: any;
  @Input() team: any;
  @Input() adding_member: boolean;
  editTeamForm: FormGroup;
  selectedMembers: IGetUsers[] = [];

  is_admin: any;
  current_user: any;
  team_members = [];
  idsOfExistingMembers = [];
  currentFirmId: any;
  adding_new_members: boolean;
  teamSelectorDisplayParams: { id: string; name: string };

  dict: { originalAssigned: {}; unassigned: {}; newAssigned: {} };
  teams: any;
  roles: any;
  copy_of_team_members: any;
  roleText: any;
  copy_of_existing_members: any;
  saving_team: boolean;
  constructor(
    private readonly PermissionService: PermissionService,
    private readonly toaster: ToastrService,
    private readonly Utils: UtilsService,
    private readonly BaseDataService: BaseDataService
  ) {}

  ngOnInit() {
    this.editTeamForm = new FormGroup({
      name: new FormControl(null,[DvValidators.required]),
      role_id: new FormControl(null),
    });
    this.is_admin = this.Utils.isAdmin();
    this.current_user = this.Utils.getCurrentUser();
    this.idsOfExistingMembers = [];

    this.currentFirmId = this.current_user.firmInfo.id;
    this.adding_new_members = false;
    this.teamSelectorDisplayParams = {
      id: 'id',
      name: 'fullName',
    };
    if (this.existing_members) {
      this.idsOfExistingMembers = this.existing_members.map(
        (val) => val['user_id']
      );
    }

    if (this.team) {
      this.editTeamForm.patchValue({
        name: this.team.name,
      });
    }

    if (this.adding_member) {
      this.getRoles();
      this.fetchEmployees();
    }

    this.dict = {
      originalAssigned: {},
      unassigned: {},
      newAssigned: {},
    };
  }

  getTeamsByUserId(id: string) {
    this.PermissionService.getTeamByuserid(
      this.currentFirmId,
      id,
      (response) => (this.teams = response),
      () => {}
    );
  }

  getRoles() {
    this.PermissionService.getRoles(
      this.currentFirmId,
      (response) => {
        this.roles = response;
        if (this.adding_member) {
          const viewerRole = this.roles.find(
            (role) => role.name.toLowerCase() === USER_ROLES.READONLY
          );
          this.editTeamForm.patchValue({
            role_id: viewerRole.id,
          });
          this.setRoleText();
        }
      },
      () => {}
    );
  }

  getApiPayload() {
    const payload: any = { members: [] };

    payload.id = this.team.id;
    payload.name = this.editTeamForm.value.name;

    this.selectedMembers.forEach((members) => {
      payload.members.push({
        user_id: members.id,
        role_id: this.editTeamForm.value.role_id,
        is_active: true,
      });
    });
    return payload;
  }

  handleonChangeEntity(members) {
    this.selectedMembers = members;
  }

  validateData() {
    if (!this.editTeamForm.value.role_id) {
      this.toaster.error('Please select access level');
      return false;
    }
    if (this.selectedMembers.length === 0) {
      this.toaster.error('Please select team members');
      return false;
    }
    return true;
  }

  addMembersRow(callback) {
    if (this.validateData()) {
      const payload = this.getApiPayload();
      if (payload) {
        this.adding_new_members = true;
        this.PermissionService.updateTeam(
          this.currentFirmId,
          payload,
          () => {
            this.adding_new_members = false;
            callback();
          },
          () => {
            this.adding_new_members = false;
          },
          true,
          'Members added successfully'
        );
      }
    }
  }

  fetchEmployees() {
    this.PermissionService.getUser(
      this.currentFirmId,
      (response) => {
        let SelectedgridMembers = this.filterByReference(response ,this.grid_members);
        this.team_members = SelectedgridMembers;
        this.copy_of_team_members = JSON.parse(
          JSON.stringify(this.team_members)
        );
        if (this.idsOfExistingMembers.length > 0) {
          this.team_members = this.copy_of_team_members.filter(
            (member: { id: any }) =>
              !this.idsOfExistingMembers.includes(member.id)
          );
        }
        this.team_members = this.team_members.sort(sortByFirstNames);
      },
      () => {}
    );
  }

  filterByReference = (gridData, selectedRows) => {
    let res = [];
    res = gridData.filter(el => {
      return !selectedRows.find(element => {
        return element.team.user_id === el.id;
      });
    });
    return res;
  };

  setRoleText() {
    const role = this.roles.find(
      (val) => val.id === this.editTeamForm.value.role_id
    );
    if (role) {
      return (this.roleText = role.description);
    }
  }

  save(callback) {
    if(this.editTeamForm.invalid){
      return
    }
    this.saving_team = true;
    const payload: any = {};
    payload.id = this.team.id;
    payload.name = this.editTeamForm.value.name;
    payload.members = [];

    this.PermissionService.updateTeam(
      this.currentFirmId,
      payload,
      () => {
        this.saving_team = false;
        callback();
      },
      (error) => {
        this.saving_team = false;
        let message = 'Edit team failed.';
        if (error.data && error.data.message) message = error.data.message;
        this.toaster.error(message);
        const avoid_error_logging_statuses =
          this.BaseDataService.getAvoidErrorLoggingStatusList();
        if (!avoid_error_logging_statuses.includes(error.status)) {
          this.Utils.logError('Edit team failed', error);
        }
      },
      true
    );
  }

  getTeams() {
    this.PermissionService.getTeams(
      this.currentFirmId,
      (response) => (this.teams = response),
      () => {}
    );
  }
}
