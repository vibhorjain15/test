import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { AccessLevelDataService } from 'src/app2/services/access-level.service';
import { noHtmlValidator, noWhitespaceValidator } from 'src/app2/shared/validators/no-white-space.validator';
import { validateAllFormFields } from 'src/app2/modules/firm-settings/tags-modal/tags-modal.util';
import { Store } from '@ngxs/store';
import { errorMessageMap, Regex } from 'src/app2/shared/constants/constant';
import { InterpolatePipe } from 'src/app2/shared/pipes/interpolate.pipe';

@Component({
  selector: 'access-level-description',
  templateUrl: './new-access-level-description.component.html',
  styles: ['.checkbox-info-icon { position:relative;top:2px; }'],
})
export class AccessLevelDescriptionModal implements OnInit {
  @Input() gridData: any;
  @Input() role: any;
  @Input() onSaveNewAccessLevel: any; //used in grid
  @Input() onUpdateAccessLevel: any; //used in grid
  defaultConfigurations: any; //default values container for all checkboxes
  firmId: any; //getting firm id from store
  updatingAccessLevel: any; //loader for update button
  addingNewAccessLevel: any; //loader for save button
  accessLevelName: any; //name inputcontrol
  accessLevelDescription: any; // description textarea input
  loading: boolean; // loader for the accordion panels
  isUpdating: boolean; // will be true when this.role is received from parent component
  initialCheckBoxCount: number;
  selectedOption: any;
  accessForm: FormGroup;
  currentUser: any;
  constructor(
    private readonly store: Store,
    private readonly toastr: ToastrService,
    private readonly newModalFactory: CustomModalService,
    private readonly accessLevelDataService: AccessLevelDataService,
    private readonly interpolatePipe: InterpolatePipe
  ) {}

  ngOnInit() {
    //////// In this component accessLevel means role
    this.currentUser = this.store.selectSnapshot(
      (state) => state.user.currentUser
    );
    this.firmId = this.currentUser.firmInfo.id;
    this.isUpdating = !!this.role;
    this.createForm();
    this.fetchDefaultCofings();
  }
  createForm() {
    this.accessForm = new FormGroup({
      name: new FormControl('', [
        Validators.required,
        noWhitespaceValidator,
        Validators.pattern(Regex.validAccessLevelName),
        Validators.maxLength(100),
      ]),
      description: new FormControl('', [
        Validators.required,
        noWhitespaceValidator,
        noHtmlValidator
      ]),
    });
    if (this.isUpdating) {
      this.accessForm.patchValue({
        name: this.role.alias,
        description: this.role.description,
      });
    }
  }

  proceedToConfigure(closeModalCallback) {
    validateAllFormFields(this.accessForm);
    if (!this.accessForm.valid) {
      return;
    }
    if (this.gridData) {
      this.newModalFactory.invoke('access-level-config', {
        initialState: {
          role: this.role,
          isUpdating: this.isUpdating,
          gridData: this.gridData,
          accessLevelName: this.accessForm.get('name').value,
          accessLevelDescription: this.accessForm.get('description').value,
          defaultConfigurations: this.defaultConfigurations,
          copyFrom: this.selectedOption,
          initialCheckBoxCount: this.initialCheckBoxCount,
          onSaveNewAccessLevelConfig: (createAccessLevel) => {
            this.onSaveNewAccessLevel(createAccessLevel);
            closeModalCallback();
          },
          onUpdateAccessLevelConfig: (updatedAccessLevel) => {
            this.onUpdateAccessLevel(updatedAccessLevel);
            closeModalCallback();
          },
          onBackButtonClick: (dataToRetain) => {
            this.defaultConfigurations = dataToRetain.config;
            this.selectedOption = dataToRetain.selectedOption;
            this.initialCheckBoxCount = dataToRetain.initialCheckBoxCount;
          },
          onCancelClicked: () => {
            closeModalCallback();
          },
        },
        class: 'modal-lg',
      });
    }
  }

  fetchDefaultCofings() {
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
      config.isOpen = false;
      config.order = index;
      return config;
    });
  }

  updateAccessLevel(closeModalCallback) {
    validateAllFormFields(this.accessForm);
    if (!this.accessForm.valid) {
      return;
    }
    // update role configurations
    let updatePayload = {
      id: this.role.id,
      name: this.accessForm.get('name').value,
      alias: this.accessForm.get('name').value,
      description: this.accessForm.get('description').value,
      firm_id: this.firmId,
      can_clone: this.role.can_clone,
      user_count: this.role.users,
      role_configuration: this.getRoleConfigJSON(),
    };
    if (this.role.firm_id && this.firmId == this.role.firm_id) {
      this.updatingAccessLevel = true;
      this.accessLevelDataService
        .updateRoleConfigurationWithRoleId(this.role.id, updatePayload)
        .subscribe(
          (updatedAccessLevel) => {
            this.onUpdateAccessLevel(updatedAccessLevel);
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

  getRoleConfigJSON() {
    //converting nested data to array of ojbects for payload
    let tempArr = [];
    this.defaultConfigurations.map((parent_group_configuration) => {
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

  handleCancelClick(callback) {
    callback();
  }

  getErrorMessage(controlName: string, fieldName?: string): string {
    const control = this.accessForm.get(controlName);
    const hasError =
      control && control?.touched && control?.invalid && control?.errors;
    if (hasError && (control.errors.required || control.errors.whitespace)) {
      return this.interpolatePipe.transform(
        errorMessageMap?.required,
        fieldName
      );
    } else if (
      hasError &&
      (control.errors?.required || control?.errors?.containsHtml)
    ) {
      return this.interpolatePipe.transform(
        errorMessageMap.containsHtml,
        fieldName
      );
    }
    return '';
  }
}
