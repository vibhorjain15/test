import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { AccessLevelDataService } from 'src/app2/services/access-level.service';
import { Store } from '@ngxs/store';

@Component({
  selector: 'access-level-config',
  templateUrl: './new-access-level-config.component.html',
})
export class AccessLevelConfigModal implements OnInit {
  @Input() gridData: any;
  @Input() role: any;
  @Input() onSaveNewAccessLevelConfig: any; //used in grid
  @Input() onUpdateAccessLevelConfig: any; //used in grid
  @Input() onBackButtonClick: any;
  @Input() onCancelClicked: any;
  @ViewChild('AccessConfigForm') AccessConfigForm: NgForm;
  @Input() defaultConfigurations: any; //default values container for all checkboxes
  firmId: any; //getting firm id from store
  updatingAccessLevel: any; //loader for update button
  addingNewAccessLevel: any; //loader for save button
  @Input() accessLevelName: any; //name inputcontrol
  @Input() accessLevelDescription: any; // description textarea input
  modify: any; //quick select modify checkbox
  create: any; //quick select modify checkbox
  delete: any; //quick select modify checkbox
  copyFromOptionsList: any; //copyFrom dropdown options received as gridData input from parent component
  loading: boolean; // loader for the accordion panels
  enableSubmit: boolean = false; //conditon variable to disable submit button which will be true if no check is seleted in config panel.
  @Input() isUpdating: boolean; // will be true when this.role is received from parent component
  selectedCheckboxCount: number;
  initialCheckBoxCount: number;
  isCopied: boolean;
  copyFrom: any;
  copiedConfiguration: any;
  currentConfiguration: any[];
  currentUser: any;
  constructor(
    private readonly store: Store,
    private readonly toastr: ToastrService,
    private readonly accessLevelDataService: AccessLevelDataService
  ) {}

  ngOnInit() {
    //////// In this component accessLevel means role
    this.currentUser = this.store.selectSnapshot(
      (state) => state.user.currentUser
    );
    this.firmId = this.currentUser.firmInfo.id;
    this.copyFromOptionsList = this.gridData.filter((row) => row.can_clone);
    if (this.defaultConfigurations) {
      this.assignDefaultValueToCheckBoxes(this.defaultConfigurations);
    }
    this.CheckForConfigUpdate();
  }

  fetchDefaultConfigs() {
    // fetching initial config values when modal opened based on new or existing role
    this.loading = true;
    if (this.role) {
      this.accessLevelDataService
        .getRoleWiseConfiguration(this.role.id)
        .subscribe(
          (response: any) => {
            this.assignDefaultValueToCheckBoxes(response);
            this.loading = false;
          },
          (err) => {
            this.loading = false;
          }
        );
    } else {
      this.accessLevelDataService.getDefaultConfigurations().subscribe(
        (response: any) => {
          this.assignDefaultValueToCheckBoxes(response);
          this.loading = false;
        },
        (err) => {
          this.loading = false;
        }
      );
    }
  }

  assignDefaultValueToCheckBoxes(configuration) {
    // assigning initial values when modal opened
    this.defaultConfigurations = configuration.map((config: any, index) => {
      config.isOpen = this.isUpdating;
      config.order = index;
      return config;
    });
    if (this.copyFrom) {
      this.initialCheckBoxCount = this.getSelectedCheckBoxCount();
      this.selectedCheckboxCount = this.initialCheckBoxCount;
      this.copiedConfiguration = [
        ...this.getRoleConfigJSON(this.defaultConfigurations),
      ];
      this.currentConfiguration = [...this.copiedConfiguration];
    }
  }

  handleCopyFromSelectionChange(selectedRoleToCopy) {
    //handle copy From Selection Change
    this.enableSubmit = false;
    this.role = selectedRoleToCopy;
    this.modify = this.create = this.delete = false;
    this.fetchDefaultConfigs();
  }

  getSelectedCheckBoxCount() {
    // will return true if selected checkbox count is greater than zero.
    return this.getRoleConfigJSON(this.defaultConfigurations).filter(
      (item) => item.is_allowed
    ).length;
  }

  CheckForConfigUpdate() {
    // checking if config is updated or not to enable/disable the save/update button.
    this.selectedCheckboxCount = this.getSelectedCheckBoxCount();
    this.currentConfiguration = this.getRoleConfigJSON(
      this.defaultConfigurations
    );
    if (this.isUpdating) {
      this.enableSubmit =
        (this.selectedCheckboxCount > 0 &&
          JSON.stringify(this.copiedConfiguration) !=
            JSON.stringify(this.currentConfiguration)) ||
        this.accessLevelName != this.role.alias ||
        this.accessLevelDescription != this.role.description;
    } else {
      this.enableSubmit =
        this.selectedCheckboxCount > 0 &&
        JSON.stringify(this.copiedConfiguration) !=
          JSON.stringify(this.currentConfiguration);
    }
  }

  isOpenChange(event, action) {
    action.isOpen = event;
  }
  onFirstClick(closeModalCallback) {
    if (this.isUpdating) {
      this.updateAccessLevelConfig(closeModalCallback);
    } else {
      this.saveNewAccessLevelConfig(closeModalCallback);
    }
  }

  saveNewAccessLevelConfig(closeModalCallback) {
    //save new role
    if (!this.enableSubmit) {
      this.toastr.info(
        'Please update the configurations to avoid creating duplicate or blank access levels.'
      );
      return;
    }
    let savePayload = {
      name: this.accessLevelName,
      alias: this.accessLevelName,
      description: this.accessLevelDescription,
      role_configuration: this.getRoleConfigJSON(this.defaultConfigurations),
    };
    this.addingNewAccessLevel = true;
    this.accessLevelDataService.saveNewRoleConfiguration(savePayload).subscribe(
      (savedAccessLevel) => {
        this.onSaveNewAccessLevelConfig(savedAccessLevel);
        this.toastr.success('Successfully created new access level');
        this.updatingAccessLevel = false;
        closeModalCallback();
      },
      (err) => {
        this.updatingAccessLevel = false;
        closeModalCallback();
      }
    );
  }

  onBackClick(closeModalCallback) {
    let dataToRetain = {
      config: this.defaultConfigurations,
      selectedOption: this.copyFrom,
      initialCheckBoxCount: this.initialCheckBoxCount,
    };
    this.onBackButtonClick(dataToRetain);
    closeModalCallback();
  }

  updateAccessLevelConfig(closeModalCallback) {
    if (!this.enableSubmit) {
      this.toastr.info(
        'Please update the configurations to avoid creating duplicate or blank access levels.'
      );
      return;
    }
    // update role configurations
    let updatePayload = {
      id: this.role.id,
      name: this.accessLevelName,
      alias: this.accessLevelName,
      description: this.accessLevelDescription,
      firm_id: this.firmId,
      can_clone: this.role.can_clone,
      user_count: this.role.users,
      role_configuration: this.getRoleConfigJSON(this.defaultConfigurations),
    };
    if (this.role.firm_id && this.firmId == this.role.firm_id) {
      this.updatingAccessLevel = true;
      this.accessLevelDataService
        .updateRoleConfigurationWithRoleId(this.role.id, updatePayload)
        .subscribe(
          (updatedAccessLevel) => {
            this.onUpdateAccessLevelConfig(updatedAccessLevel);
            this.toastr.success('Successfully updated access level');
            this.updatingAccessLevel = false;
            closeModalCallback();
          },
          (err) => {
            this.updatingAccessLevel = false;
            closeModalCallback();
          }
        );
    }
  }

  getRoleConfigJSON(configuration) {
    //converting nested data to array of ojbects for payload
    let tempArr = [];
    configuration.map((parent_group_configuration) => {
      parent_group_configuration.child_groups.map((child_group_configs) => {
        child_group_configs.actions.map((action) => {
          tempArr.push({
            parent_group_name: parent_group_configuration.parent_group_name,
            child_group_name: child_group_configs.child_group_name,
            action: action.action,
            is_allowed: action.is_allowed,
          });
        });
      });
    });
    return tempArr;
  }

  toggleAllCheckboxWithSameLabel(isSelected, checkboxLabel) {
    //quick select option to toggle all similar options and all accordion panels
    this.defaultConfigurations.forEach((parent_group_config: any) => {
      parent_group_config.isOpen =
        this.modify ||
        this.create ||
        this.delete ||
        this.selectedCheckboxCount > 0;
      parent_group_config.child_groups.forEach((child_group_config: any) => {
        child_group_config.actions.forEach((action: any) => {
          if (
            action.action == checkboxLabel ||
            action.action.includes(checkboxLabel)
          ) {
            action.is_allowed = isSelected;
          }
        });
      });
    });
    this.CheckForConfigUpdate();
  }

  handleCancelClick(callback) {
    this.onCancelClicked();
    callback();
  }
}
