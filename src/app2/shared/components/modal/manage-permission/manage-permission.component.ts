import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { validateAllFormFields } from 'src/app2/modules/firm-settings/tags-modal/tags-modal.util';
import { PermissionService } from 'src/app2/services/permission/permission.service';
import {
  HighestRoleObj,
  IGetPermission,
  IGetRole,
  IGetTeams,
  IGetUsers,
  IResource,
} from 'src/app2/services/permission/permission.type';
import { UtilsService } from 'src/app2/services/utils.service';
import {
  EveryonePermissionTypeId,
  USER_ROLES,
  keywordConstants,
} from 'src/app2/shared/constants/constant';
import { filtersConstants, getDiligenceType } from './manage-permission.util';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { finalize } from 'rxjs/operators';
type tabType = {
  id: number;
  type: string;
  name: string;
  entity_type: string;
};
@Component({
  selector: 'manage-permissions',
  templateUrl: './manage-permission.component.html',
  styleUrls: ['./manage-permission.component.css'],
})
export class ManagePermissionModal implements OnInit {
  edit_mode: boolean = false;
  @Input() tabType: tabType;
  @Input() resource_data: IResource;
  @Input() grid_members: any;
  selectionType;
  currentFirmId;

  selectedResources: any;
  selectMyFirm: boolean;
  accessLevelText: string;
  minDate: Date;
  maxDate: Date;
  is_investor: boolean;
  is_manager: boolean;
  is_admin: boolean;
  current_user: any;
  filters: any;
  diligence_types: { name: string; value: string }[];
  diligence_type: string;
  resources: any;
  loading: boolean = false;
  permissionForm: FormGroup;
  allTeams: { display: string; value: number }[];
  allUsers: { display: string; value: number }[];
  allPermission: IGetPermission[];
  allRoles: IGetRole[];
  permissionDescription: string;
  roleDescription: string;
  allPermissionCopy: IGetPermission[];
  keywordConstants = keywordConstants;
  permissionTypes: any[];
  assignedToTypes = [
    { id: 'team', name: 'Team' },
    { id: 'person', name: 'User' },
  ];
  permissionTypeHelpText: string;
  hideAssignmentDetails: boolean;
  everyonePermissionType: any;
  existingPermissionTypeId: number;
  showAssignmentDetailsInEditMode: boolean;
  disableFirstButton: boolean;
  permissionTypesLoading: boolean;

  constructor(
    private readonly PermissionService: PermissionService,
    private readonly UtilsService: UtilsService,
    private readonly toaster: ToastrService,
    private readonly baseDataService: BaseDataService
  ) {}

  ngOnInit() {
    this.selectionType = 'team';
    this.currentFirmId = this.UtilsService.getCurrentUser().firmInfo.id;
    this.is_investor = this.UtilsService.isInvestor();
    this.is_manager = this.UtilsService.isManager();
    var d = new Date();
    var pastYear = d.getFullYear() - 5;
    d.setFullYear(pastYear);
    this.minDate = d;
    this.maxDate = new Date();
    this.is_admin = this.UtilsService.isAdmin();
    this.current_user = this.UtilsService.getCurrentUser();
    this.filters = filtersConstants;

    this.permissionForm = new FormGroup({
      permission_type: new FormControl('', Validators.required),
      team: new FormControl(null, [Validators.required]),
      user: new FormControl(null),
      visibility: new FormControl(null, [Validators.required]),
      role: new FormControl(null, [Validators.required]),
      entity_type: new FormControl(null),
      allow_underlying_entities: new FormControl(false),
    });
    if (this.tabType) {
      if (this.tabType.type === 'User') {
        this.getUsers();
      }
      if (this.tabType.type === 'Team') {
        this.getTeams();
      }
    } else if (this.resource_data) {
      this.edit_mode = true;
      this.permissionForm.get('team').setValidators([]);
      this.permissionForm.get('team').updateValueAndValidity();
      this.existingPermissionTypeId = +this.resource_data.permission_type;
    } else {
      this.getUsers();
      this.getTeams();
    }
    this.getPermission();
    this.getRoles();

    this.permissionTypesLoading = true;
    this.baseDataService
      .getPermissionTypes()
      .pipe(finalize(() => (this.permissionTypesLoading = false)))
      .subscribe((response: any[]) => {
        this.permissionTypes = response;
        this.everyonePermissionType = this.permissionTypes.find(
          (x) => x.name === 'Everyone'
        );
        if (!this.everyonePermissionType) {
          // temp workaround until SOW is signed - BE is not returning this type
          this.everyonePermissionType = {
            id: EveryonePermissionTypeId,
          };
        }
        this.onPermissionTypeChange(
          this.edit_mode ? this.resource_data.permission_type : response[0].id
        );
      });

    this.diligence_types = getDiligenceType(this.is_manager);
    this.diligence_type = this.diligence_types[0].value;
    if (this.tabType) {
      if (this.tabType.type === 'User') {
        this.selectionType = 'person';
        this.getResources(this.tabType.id, 'users');
      } else if (this.tabType.type === 'Team') {
        this.selectionType = 'team';
        this.getResources(this.tabType.id, 'teams');
      }
      this.permissionForm.patchValue({
        entity_type: this.tabType.entity_type,
      });
    } else {
      this.permissionForm.patchValue({
        entity_type: keywordConstants.Product,
      });
    }
    if (this.resource_data) {
      if (this.resource_data.assigned_to_entity_type == 'User') {
        this.selectionType = 'person';
      } else {
        this.selectionType = 'team';
      }
    }
  }

  getTeams() {
    this.PermissionService.getTeams(
      this.currentFirmId,
      (teams: IGetTeams[]) => {
        let allTeams = teams.map((val) => ({
          display: val.name,
          value: val.id,
        }));
        this.allTeams = allTeams;
        if (this.tabType && this.tabType.type != 'User') {
          this.allTeams = allTeams.filter(
            (val) => val.value === this.tabType.id
          );
          this.permissionForm.patchValue({
            team: this.allTeams,
          });
          this.permissionForm.get('user').setValidators([]);
          this.permissionForm.get('user').updateValueAndValidity();
          this.permissionForm.get('role').setValidators([]);
          this.permissionForm.get('role').updateValueAndValidity();
        }
        if (this.edit_mode && !this.showAssignmentDetailsInEditMode) {
          this.allTeams = allTeams.filter(
            (val) => val.value === this.resource_data.assigned_to_entity_id
          );
        }
      },
      () => {}
    );
  }

  getUsers() {
    this.PermissionService.getUser(
      this.currentFirmId,
      (users: IGetUsers[]) => {
        let allUsers = users.map((val) => ({
          display: val.fullName,
          value: val.id,
        }));
        this.allUsers = allUsers;
        if (this.tabType && this.tabType.type == 'User') {
          this.allUsers = allUsers.filter(
            (val) => val.value === this.tabType.id
          );
          this.permissionForm.patchValue({
            user: this.allUsers,
          });
          this.permissionForm.get('team').setValidators([]);
          this.permissionForm.get('team').updateValueAndValidity();
          this.permissionForm.get('visibility').setValidators([]);
          this.permissionForm.get('visibility').updateValueAndValidity();
        }
        if (this.edit_mode && !this.showAssignmentDetailsInEditMode) {
          this.allUsers = allUsers.filter(
            (val) => val.value === this.resource_data.assigned_to_entity_id
          );
        }
      },
      () => {}
    );
  }

  getRoles() {
    this.PermissionService.getRoles(
      this.currentFirmId,
      (roles: IGetRole[]) => {
        this.allRoles = roles;
        if (
          this.edit_mode &&
          this.resource_data.assigned_to_entity_type !== 'Team' &&
          !this.showAssignmentDetailsInEditMode
        ) {
          let localRole =
            this.resource_data.role_id === HighestRoleObj.id
              ? HighestRoleObj
              : this.allRoles.find(
                  (val) => val.id === this.resource_data.role_id
                );
          this.permissionForm.patchValue({ role: localRole.id });
          this.roleDescription = JSON.parse(
            JSON.stringify(localRole.description)
          );
        } else {
          const viewerRole = this.allRoles.find(
            (role) => role.name.toLowerCase() === USER_ROLES.READONLY
          );
          this.permissionForm.get('role').patchValue(viewerRole.id);
          this.roleDescription = viewerRole.description;
        }
        if (this.tabType && this.tabType.type === 'User') {
          this.setSelectionType('person');
        }
        this.permissionForm.get('visibility').setValidators([]);
        this.permissionForm.get('visibility').updateValueAndValidity();
      },
      () => {}
    );
  }

  getPermission() {
    this.PermissionService.getPermissionLevel(
      (permissions: IGetPermission[]) => {
        this.allPermission = permissions;
        this.allPermissionCopy = [...this.allPermission];

        if (
          this.edit_mode &&
          this.resource_data.assigned_to_entity_type !== 'User' &&
          !this.showAssignmentDetailsInEditMode
        ) {
          let localPer = this.allPermission.find(
            (val) => val.name === this.resource_data.access_level
          );
          this.permissionForm.patchValue({
            visibility: localPer.name,
          });
          this.permissionDescription = JSON.parse(
            JSON.stringify(localPer.description)
          );
        } else {
          this.permissionForm.patchValue({
            visibility: this.allPermission[0].name,
          });
          this.permissionDescription = this.allPermission[0].description;
        }
        if (this.tabType && this.tabType.type === 'Team') {
          this.setSelectionType('team');
        }
        this.permissionForm.get('role').setValidators([]);
        this.permissionForm.get('role').updateValueAndValidity();
      },
      () => {}
    );
  }

  handleVisibility(value) {
    this.permissionDescription = this.allPermission.find(
      (val) => val.name === value
    ).description;
  }

  handleRole(value) {
    this.roleDescription = this.allRoles.find(
      (val) => val.id === value
    ).description;
  }

  setSelectionType(type) {
    this.selectionType = type;
    if (this.selectionType === 'team') {
      this.permissionForm.get('team').markAsUntouched();
      this.permissionForm.get('team').setValidators([Validators.required]);
      this.permissionForm.get('user').setValidators([]);
    } else if (this.selectionType === 'person') {
      const viewerRole = this.allRoles.find(
        (role) => role.name.toLowerCase() === USER_ROLES.READONLY
      );
      this.permissionForm.controls.role.setValue(viewerRole.id);
      this.roleDescription = viewerRole.description;
      this.permissionForm.get('team').setValidators([]);
      this.permissionForm.get('user').markAsUntouched();
      this.permissionForm.get('user').setValidators([Validators.required]);
    }
    this.permissionForm.get('team').updateValueAndValidity();
    this.permissionForm.get('user').updateValueAndValidity();
  }

  save(callback) {
    if (this.tabType) {
      if (this.tabType.type === 'User') {
        this.permissionForm.patchValue({
          user: this.tabType.name,
        });
        this.permissionForm.get('user').updateValueAndValidity();
      }
      if (this.tabType.type === 'Team') {
        this.permissionForm.patchValue({
          team: this.tabType.name,
        });
        this.permissionForm.get('team').updateValueAndValidity();
      }
    }
    validateAllFormFields(this.permissionForm);
    if (this.permissionForm.valid && this.validateEntites()) {
      this.loading = true;
      let params = this.getApiPayload();
      if (this.edit_mode && !this.resource_data.is_default) {
        if (this.showAssignmentDetailsInEditMode) {
          // the permission type has changed from everyone to something else so delete the old one and add new permissions
          this.PermissionService.deleteResourcePermissions(
            this.currentFirmId,
            this.resource_data.id,
            () => {
              this.PermissionService.createResourcePermissions(
                this.currentFirmId,
                params,
                () => {
                  this.loading = false;
                  callback();
                },
                () => (this.loading = false)
              );
            },
            () => (this.loading = false)
          );
        } else {
          this.PermissionService.updateResourcePermissions(
            this.currentFirmId,
            params,
            () => {
              this.loading = false;
              callback();
            },
            () => (this.loading = false)
          );
        }
      } else {
        // normal save or changes in the default permission
        this.PermissionService.createResourcePermissions(
          this.currentFirmId,
          params,
          () => {
            this.loading = false;
            callback();
          },
          () => (this.loading = false)
        );
      }
    }
  }

  getResources(id, type: 'users' | 'teams') {
    this.PermissionService.getResources(
      this.currentFirmId,
      id,
      type,
      (res) => {
        this.resources = res;
        this.resource_data = this.resources.find(
          (val) => val.assigned_to_entity_id === this.tabType.id
        );
        if (this.resource_data) {
          this.permissionForm.patchValue({
            role: this.resource_data.role_id,
            visibility: this.resource_data.access_level,
          });
          this.roleDescription = this.allRoles?.find(
            (val) => val.id === this.resource_data.role_id
          )?.description;
          this.permissionDescription = this.allPermission?.find(
            (val) => val.name === this.resource_data.access_level
          )?.description;
        }
      },
      () => {}
    );
  }

  handleOnChangeResources(resources) {
    this.selectedResources = resources;
  }
  validateEntites() {
    if (
      !this.edit_mode &&
      (!this.selectedResources?.entities ||
        this.selectedResources?.entities?.length === 0) &&
      this.selectedResources?.resourceType !== 'my_firm'
    ) {
      if (
        (this.selectedResources?.resourceType as string)?.toLowerCase() ===
          this.keywordConstants?.Project?.toLowerCase() &&
        !this.selectedResources?.entity?.entity_id
      ) {
        this.toaster.error('Please select entity');
        return false;
      }
      this.toaster.error('Please select resources');
      return false;
    }
    return true;
  }

  getApiPayload() {
    let params: any = {};
    if (this.edit_mode && !this.showAssignmentDetailsInEditMode) {
      params.id = this.resource_data.id;
      params.assigned_to_entity_type =
        this.resource_data.assigned_to_entity_type;
      params.assigned_to_entity_id = this.resource_data.assigned_to_entity_id;
      params.entity_type = this.resource_data.entity_type;
      params.entity_id = this.resource_data.entity_id;
    } else {
      if (this.showAssignmentDetailsInEditMode) {
        // the permission type has changed from everyone to something else so pick assigned entities from the existing data
        params.entity_type = this.resource_data.entity_type;
        params.entity_ids = [this.resource_data.entity_id];
      } else {
        // normal add mode
        params.assigned_to_entity_type =
          this.selectionType === 'person' ? 'User' : 'Team';
        params.entity_type = this.selectedResources.resourceType;
        params.entity_ids = this.selectedResources.entities?.map(
          (val) => val.id
        );
        if (this.selectedResources.resourceType === 'my_firm') {
          params.entity_ids = [this.currentFirmId];
          params.entity_type = 'Firm';
        }
      }
      params.assigned_to_entity_type =
        this.selectionType === 'person' ? 'User' : 'Team';
      if (this.selectionType === 'team') {
        params.assigned_to_entity_ids = this.permissionForm.value.team;
      } else {
        params.assigned_to_entity_ids = this.permissionForm.value.user;
      }
      if (this.tabType) {
        params.assigned_to_entity_ids = [this.tabType.id];
      }
    }
    if (this.selectionType !== 'team') {
      params.role_id = this.permissionForm.value.role;
    }
    if (this.selectionType === 'team') {
      params.access_level = this.permissionForm.value.visibility;
    }
    params.permission_type = this.permissionForm.value.permission_type;
    params.allow_underlying_entities = this.edit_mode
      ? this.resource_data.allow_underlying_entities
      : this.permissionForm.value.allow_underlying_entities;
    if (params.permission_type === this.everyonePermissionType.id) {
      // remove assigned to values if the type is everyone
      params.assigned_to_entity_ids = [];
      params.assigned_to_entity_type = null;
      params.assigned_to_entity_id = null;
      // assign role and visibility values
      params.role_id = this.permissionForm.value.role;
      params.access_level = this.allPermission[0].name;
    }
    return params;
  }

  handleResourceTypeChange(type: string) {
    // in case of Template Resource Type, only "All" option should be visible
    if (!this.allPermission) {
      return;
    }
    if (this.selectionType === 'team') {
      if (type === 'Template') {
        this.allPermission = this.allPermission.filter((x) => x.name === 'All');
      } else {
        this.allPermission = [...this.allPermissionCopy];
      }
      let localPer = this.allPermission.find(
        (val) => val.name === this.resource_data?.access_level
      );
      this.permissionForm.patchValue({
        visibility: this.edit_mode
          ? localPer?.name
          : this.allPermission[0].name,
      });
      this.permissionDescription = this.allPermission[0].description;
    }
  }

  onPermissionTypeChange(value) {
    this.permissionForm.get('permission_type').patchValue(value);
    this.permissionTypeHelpText = this.permissionTypes.find(
      (x) => x.id === value
    ).description;

    this.disableFirstButton =
      this.resource_data?.is_default &&
      value === this.everyonePermissionType.id;

    if (this.allRoles) {
      this.updateRolesData();
    }

    // if the permission_type is Everyone, no need to show the assignment details
    this.hideAssignmentDetails = value === this.everyonePermissionType.id;
    if (this.hideAssignmentDetails) {
      // if user changes to Everyone type, remove validations and set default visibility value
      this.permissionForm.get('team').setValidators([]);
      this.permissionForm.get('team').updateValueAndValidity();
      this.permissionForm.get('user').setValidators([]);
      this.permissionForm.get('user').updateValueAndValidity();
      this.permissionForm.get('role').setValidators(Validators.required);
      this.permissionForm.get('role').updateValueAndValidity();
    } else if (!this.edit_mode && !this.tabType) {
      this.permissionForm.get('team').setValidators(Validators.required);
      this.permissionForm.get('team').updateValueAndValidity();
    }

    if (this.edit_mode) {
      if (
        this.existingPermissionTypeId === this.everyonePermissionType.id &&
        value !== this.everyonePermissionType.id
      ) {
        // in edit mode, the permission type has changed from everyone to something else so we have to enable the assigned to fields
        this.showAssignmentDetailsInEditMode = true;
        this.getTeams();
        this.getUsers();
        this.permissionForm.get('team').setValidators(Validators.required);
        this.permissionForm.get('team').updateValueAndValidity();
      } else {
        // if it is the edit mode and the above condition doesn't match, then hide the assigned to fields as usual
        this.showAssignmentDetailsInEditMode = false;
      }
    }
  }

  updateRolesData() {
    if (
      this.permissionForm.get('permission_type').value ===
      this.everyonePermissionType.id
    ) {
      if (this.allRoles.findIndex((x) => x.id === HighestRoleObj.id) === -1) {
        // add the highest role option
        this.allRoles.unshift(HighestRoleObj);
      }
    } else {
      const index = this.allRoles.findIndex((x) => x.id === HighestRoleObj.id);
      if (index > -1) {
        this.allRoles.splice(index, 1);
      }
    }
    this.allRoles = [...this.allRoles];
  }

  setAllowUnderlyingEntitiesOption(value) {
    this.permissionForm.get('allow_underlying_entities').patchValue(value);
  }
}
