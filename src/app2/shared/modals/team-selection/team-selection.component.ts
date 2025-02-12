import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { RouterService } from 'src/app2/services/router.service';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take } from 'rxjs/operators';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { PermissionService } from 'src/app2/services/permission/permission.service';
import {
  HighestRoleObj,
  IGetPermission,
  IGetRole,
} from 'src/app2/services/permission/permission.type';
import { UtilsService } from 'src/app2/services/utils.service';
@Component({
  selector: 'app-team-selection',
  templateUrl: './team-selection.component.html',
  styleUrls: ['./team-selection.component.css'],
})
export class TeamSelectionComponent implements OnInit {
  @Input() teams: Array<any>;
  @Input() type: string;
  @Input() disabled: boolean;
  @Input() entityType: string;
  @Output() onErrors = new EventEmitter();
  current_user: any;
  currentFirmId: number;
  loading_data: boolean;
  accessList: Array<any>;
  teamsForm: FormGroup;
  dropdown_teams: any[];
  @Select(UserState.getCurrentUserData) user;
  permissionTypes: any[];
  selectedPermissionType: number;
  everyonePermissionType: any;
  roles: IGetRole[];
  disableAssignmentDetails: boolean;

  get permissions(): FormArray {
    return this.teamsForm.get('permissions') as FormArray;
  }

  constructor(
    private readonly route: RouterService,
    private readonly baseDataService: BaseDataService,
    private readonly PermissionService: PermissionService,
    private readonly utils: UtilsService
  ) {}

  ngOnInit(): void {
    this.loading_data = true;
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.current_user = data;
          this.currentFirmId = this.current_user.firmInfo.id;
          this.createForm();
          this.getData();
        }
      });
  }

  createForm() {
    this.teamsForm = new FormGroup({
      permissions: new FormArray([]),
    });
  }

  getData() {
    this.PermissionService.getPermissionLevel(
      (permissions: IGetPermission[]) => {
        this.accessList = permissions;
        this.addNewControl();
        this.updateDropdownTeams();
        this.loading_data = false;
      },
      () => {}
    );
    this.PermissionService.getRoles(
      this.currentFirmId,
      (roles: IGetRole[]) => {
        this.roles = roles;
      },
      () => {}
    );
    this.getPermissionTypes();
  }

  getPermissionTypes() {
    this.baseDataService.getPermissionTypes().subscribe((response: any[]) => {
      this.permissionTypes = response;
      this.everyonePermissionType = this.permissionTypes.find(
        (x) => x.name === 'Everyone'
      );
      this.onPermissionTypeChange(response[0].id);
    });
  }

  onPermissionTypeChange(value) {
    this.selectedPermissionType = value;
    this.disableAssignmentDetails = value === this.everyonePermissionType?.id;

    if (value === this.everyonePermissionType?.id) {
      // remove all extra controls if any
      for (let i = 1; i < this.permissions.controls.length; i++) {
        this.removeControl(i);
      }
    }
    // change the value of form controls based on the type selection
    this.permissions.controls.forEach((permission: FormGroup) => {
      permission.get('assigned_to_entity_id').patchValue(null);
      permission
        .get('assigned_to_entity_id')
        .setValidators([]);
      permission.get('assigned_to_entity_id').markAsUntouched();
      permission.get('assigned_to_entity_id').updateValueAndValidity();
      permission.get('access_level').patchValue(null);
      permission.get('access_level').markAsUntouched();
      permission.get('access_level').updateValueAndValidity();
    });
    if (this.roles) {
      this.updateRolesData();
    }
    this.dropdown_teams.forEach((x) => (x.disabled = false));
  }

  updateRolesData() {
    if (this.disableAssignmentDetails) {
      if (this.roles.findIndex((x) => x.id === HighestRoleObj.id) === -1) {
        // add the highest role option
        this.roles.unshift(HighestRoleObj);
      }
    } else {
      const index = this.roles.findIndex((x) => x.id === HighestRoleObj.id);
      if (index > -1) {
        this.roles.splice(index, 1);
      }
    }
    this.roles = [...this.roles];
  }

  isFormValid() {
    if (!this.teamsForm.valid) {
      this.teamsForm.markAllAsTouched();
      return false;
    }
    return true;
  }

  addNewControl() {
    this.permissions.push(
      new FormGroup({
        access_level: new FormControl(null, [Validators.required]),
        assigned_to_entity_id: new FormControl(null, [Validators.required]),
      })
    );
    this.updateDropdownTeams();
  }

  removeControl(index) {
    if (this.permissions.length !== 1) this.permissions.removeAt(index);
    else {
      this.teamsForm.reset();
      (this.permissions.controls[0] as FormGroup)
        .get('access_level')
        .setValidators([]);
      (this.permissions.controls[0] as FormGroup)
        .get('assigned_to_entity_id')
        .setValidators([]);
      (this.permissions.controls[0] as FormGroup)
        .get('assigned_to_entity_id')
        .updateValueAndValidity();
      (this.permissions.controls[0] as FormGroup)
        .get('access_level')
        .updateValueAndValidity();
    }

    this.updateDropdownTeams();
  }

  resetForm() {
    this.teamsForm.reset();
    this.permissions.clear();
    this.addNewControl();
  }

  updateDropdownTeams() {
    let alreadySelected = this.permissions.value.map(
      (x) => x.assigned_to_entity_id
    );
    alreadySelected = this.utils.flattenArray(alreadySelected);
    this.dropdown_teams = [...this.teams];
    if (alreadySelected?.length) {
      this.dropdown_teams = this.dropdown_teams.filter(
        (x) => !alreadySelected.includes(x.id)
      );
    }
  }

  redirectToTeamsGrid() {
    this.route.navigate('app.firm.settings.teams');
  }

  triggerValidations(index) {
    (this.permissions.controls[index] as FormGroup)
      .get('access_level')
      .setValidators([Validators.required]);
    (this.permissions.controls[index] as FormGroup)
      .get('access_level')
      .updateValueAndValidity();
    (this.permissions.controls[index] as FormGroup)
      .get('assigned_to_entity_id')
      .setValidators([Validators.required]);
    (this.permissions.controls[index] as FormGroup)
      .get('assigned_to_entity_id')
      .updateValueAndValidity();
    this.updateDropdownTeams();
  }

  // this needs to be called from parent component on Submit button.
  getSelectedPermissions() {
    if (!this.teamsForm.valid) {
      this.teamsForm.markAllAsTouched();
      this.onErrors.emit('Not valid');
      return;
    }

    const finalSelection = this.permissions.value.filter(
      (val) =>
        (this.disableAssignmentDetails && val.access_level) ||
        (!this.disableAssignmentDetails &&
          val.access_level &&
          val.assigned_to_entity_id)
    );

    this.onErrors.emit('');
    if (!finalSelection.length) {
      return finalSelection;
    }
    finalSelection.forEach((permission) => {
      permission.permission_type = this.selectedPermissionType;
      permission.assigned_to_entity_type = this.disableAssignmentDetails
        ? null
        : 'Team';
      permission.entity_type = this.entityType;
      if (this.disableAssignmentDetails) {
        permission.role_id = +permission.access_level;
        permission.access_level = 'All';
        permission.assigned_to_entity_id = null;
      }
    });
    return finalSelection;
  }

  handleSelectChange(dvSelectEvent: number, control: FormControl) {
    control.setValue(dvSelectEvent);
  }
}
