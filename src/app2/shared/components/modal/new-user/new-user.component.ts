import { HttpClient } from '@angular/common/http';
import { Component, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { validateAllFormFields } from 'src/app2/modules/firm-settings/tags-modal/tags-modal.util';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { RouterService } from 'src/app2/services/router.service';
import { UtilsService } from 'src/app2/services/utils.service';
import {
  errorMessageMap,
  Regex,
  USER_ROLES,
} from 'src/app2/shared/constants/constant';
import { TeamSelectionComponent } from 'src/app2/shared/modals/team-selection/team-selection.component';
import { ModalComponent } from '../modal.component';
import { forkJoin } from 'rxjs';
import { InviteUserService } from 'src/app2/services/inviteuser.service';
import { take } from 'rxjs/operators';
import { UserState } from 'src/app2/store/user/user.state';
import { Select } from '@ngxs/store';
@Component({
  selector: 'new-user',
  templateUrl: './new-user.component.html',
})
export class AddNewUserComponent implements OnInit {
  @Output() newUser;
  @Output() existing_user;
  is_investor: any;
  is_manager: any;
  formData: any;
  firm_has_super_admin: boolean;
  current_user: any;
  currentFirmId: any;
  permissions_enabled: any;
  functions: any;
  user_type: string;
  showBody: boolean;
  defaultAccessLabel: string;
  selectedTeams: any;
  edit_mode: boolean = false;
  superViewerID: number;
  firm_name: string = '';
  selectedUser: any;
  teams: any;
  accessList: any;
  roles: any;
  primaryOwnersObj: any;
  secondaryOwnersObj: any;
  roleText: any;
  teamselectionForm: any;
  new_user_form: FormGroup;
  saving_user_add_another: boolean;
  saving_user: boolean;
  teamSelectionErrors = '';
  showAdvanceOptions;
  errorMessageMap = errorMessageMap;
  @ViewChild('NewUser') teamSelection: TeamSelectionComponent;
  @ViewChild('modal') modalComponent: ModalComponent;
  defaultRoleId: number;
  loadingRoles: boolean = true;
  canAddUser: boolean;
  @Select(UserState.getCurrentUserData) user;
  constructor(
    private readonly Utils: UtilsService,
    private readonly toaster: ToastrService,
    private readonly http: HttpClient,
    private readonly router: RouterService,
    private readonly BaseDataService: BaseDataService,
    private readonly inviteUserService: InviteUserService
  ) {}

  ngOnInit() {
    this.user.pipe(take(1)).subscribe((data) => {
      if (data) {
        this.firm_name = data?.firmInfo?.name;
        this.init();
      }
    });
  }
  init() {
    this.new_user_form = new FormGroup({
      firstName: new FormControl(null, [
        Validators.required,
        Validators.pattern(Regex.validPersonNames),
      ]),
      lastName: new FormControl(null, [
        Validators.required,
        Validators.pattern(Regex.validPersonNames),
      ]),
      userName: new FormControl(null, [
        Validators.required,
        Validators.pattern(Regex.validEmail),
      ]),
      functions: new FormControl(null),
      is_key_person: new FormControl(false),
      is_public: new FormControl(false),
      firmwide_role: new FormControl(null),
      type: new FormControl(null),
      fundId: new FormControl(null),
      accessLevel: new FormControl(null),
      enableFirmAccess: new FormControl(null),
    });
    this.is_investor = this.Utils.isInvestor();
    this.is_manager = this.Utils.isManager();
    this.formData = {};
    this.firm_has_super_admin = false;
    this.current_user = this.Utils.getCurrentUser();
    if (
      this.current_user.firmwide_role.toLowerCase() != USER_ROLES.ADMIN &&
      this.current_user.firmwide_role.toLowerCase() != USER_ROLES.SECURITYADMIN
    ) {
      this.canAddUser = false;
    } else {
      this.canAddUser = true;
    }
    this.currentFirmId = this.current_user.firmInfo.id;
    this.permissions_enabled = this.current_user.firmInfo.hasPermissionEnabled;
    this.functions = [];
    this.user_type = 'Standard';
    this.showBody = true;
    this.defaultAccessLabel = 'Read-write';
    this.getRoles();
    this.getTeams();
    this.getTeamRoles();
    this.getFunctions();
    this.selectedTeams = [];
    if (this.existing_user) {
      this.edit_mode = true;
      this.getCurrentUser();
      this.new_user_form.get('userName').disable();
    }
    if (!this.edit_mode && this.is_manager) {
      this.new_user_form.patchValue({
        is_public: true,
      });
    }
    this.superViewerID = 4;
  }

  setUserType(type: any) {
    return (this.user_type = type);
  }

  getCurrentUser() {
    this.http.get('users/' + this.existing_user.id).subscribe((response) => {
      this.selectedUser = response;
      this.new_user_form.patchValue({
        is_public: this.selectedUser.is_public,
        firstName: this.selectedUser.firstname,
        lastName: this.selectedUser.lastname,
        userName: this.selectedUser.userName,
        functions: this.selectedUser.functions.length
          ? this.selectedUser.functions.map((func) => func.function_id)
          : [],
        is_key_person: this.selectedUser.is_key_person,
      });
    });
  }

  getTeams() {
    this.http
      .get('firms/' + this.currentFirmId + '/teams')
      .subscribe((response: any) => {
        this.teams = response;
      });
  }

  getTeamRoles() {
    this.http
      .get('firms/' + this.currentFirmId + '/roles', {
        params: { include_admins: false },
      })
      .subscribe((response: any) => {
        this.accessList = response;
      });
  }

  getRoles() {
    const observables = [];
    observables.push(
      this.BaseDataService.getRoles(this.currentFirmId, {
        include_admins: true,
      })
    );
    observables.push(this.BaseDataService.getDefaultRole());

    forkJoin(observables).subscribe((response: any[]) => {
      this.roles = response[0];
      this.defaultRoleId = response[1].id;
      this.new_user_form.get('firmwide_role').patchValue(this.defaultRoleId);
      this.setRoleText();
      this.loadingRoles = false;
    });
  }

  getFunctions() {
    return this.BaseDataService.getFunctions().subscribe((response: any) => {
      this.functions = this.Utils.sortByAplha(response, 'function_name');
    });
  }

  setRoleText() {
    const role = this.roles.find(
      (val) => val.id === this.new_user_form.value.firmwide_role
    );
    if (role) {
      this.roleText = role.description;
    }
  }

  submit(addAnother: boolean = false) {
    validateAllFormFields(this.new_user_form);
    if (this.showAdvanceOptions)
      this.selectedTeams = this.teamSelection?.getSelectedPermissions();
    else this.teamSelectionErrors = '';
    if (this.new_user_form.valid && !this.teamSelectionErrors) {
      let params;
      let request;
      if (addAnother) {
        this.saving_user_add_another = true;
      } else {
        this.saving_user = true;
      }

      this.new_user_form.patchValue({
        type: this.is_investor ? 'investor' : 'manager',
      });
      let {
        firmwide_role,
        firstName,
        userName,
        lastName,
        is_key_person,
        is_public,
        functions,
        type,
        fundId,
        accessLevel,
      } = this.new_user_form.value;
      const functionsArr = [];
      if (functions && functions.length) {
        functions.map((selectedFunction) => {
          functionsArr.push({ function_id: selectedFunction });
        });
      }
      if (this.edit_mode) {
        params = this.selectedUser;
        params.firstName = firstName;
        params.lastName = lastName;
        params.is_key_person = is_key_person;
        params.is_public = is_public;
        params.functions = functionsArr;
        request = this.http.put('users/' + this.existing_user.id, params);
      } else {
        params = JSON.parse(
          JSON.stringify({
            firmwide_role,
            firstName,
            lastName,
            is_key_person,
            is_public,
            functions,
            type,
            fundId,
            accessLevel,
            userName,
          })
        );
        params.teamMemberships = [];
        this.selectedTeams.map((team) => {
          if (team.assigned_to_entity_id && team.access_level) {
            params.teamMemberships.push({
              team_id: team.assigned_to_entity_id,
              role_id: team.access_level,
            });
          }
        });
        params.functions = functionsArr;
        request = this.http.post('users', params);
      }

      return request.subscribe(
        (response: { id: any }) => {
          this.saving_user_add_another = false;
          this.saving_user = false;
          if (this.edit_mode) {
            this.toaster.success(
              '',
              `${firstName + ' ' + lastName} has been updated successfully`,
              { timeOut: 3000 }
            );
          } else {
            this.toaster.success(
              '',
              `${firstName + ' ' + lastName} has been added to team`,
              { timeOut: 3000 }
            );
          }
          this.new_user_form.reset();
          this.showAdvanceOptions = false;
          if (addAnother) {
            this.new_user_form.reset();
            this.new_user_form.patchValue({
              is_key_person: false,
              is_public: false,
              firmwide_role: this.defaultRoleId,
            });
            this.setRoleText();
            if (this.newUser) {
              this.newUser(response);
            }
          } else {
            if (!this.edit_mode) {
              if (this.newUser) {
                this.newUser(response);
              }
              this.inviteUserService.setSelectedTab('Invited', response);
              this.modalComponent.closeModal();
              return this.router.navigate('app.firm.settings.employees');
            } else {
              if (this.newUser) {
                this.newUser(response);
              }
              this.modalComponent.closeModal();
            }
          }
        },
        (error) => {
          this.saving_user_add_another = false;
          this.saving_user = false;
          const avoid_error_logging_statuses =
            this.BaseDataService.getAvoidErrorLoggingStatusList();
          if (
            !Array.from(avoid_error_logging_statuses).includes(error.status)
          ) {
            delete error?.config?.data?.userName;
            this.Utils.logError('Adding new user failed', error);
          }
        }
      );
    }
  }

  invite_and_add_another() {
    this.submit(true);
  }
  handleAccessLevelClick() {
    window.open('#/app/settings/access-level-map', '_blank');
  }

  handleTeamSelectionErrors(error) {
    this.teamSelectionErrors = error;
  }

  redirectToMyAdmins() {
    this.modalComponent.closeModal();
    this.router.navigate('app.settings.my_admins');
  }
}
