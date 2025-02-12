import { HttpClient } from '@angular/common/http';
import {
  Component,
  Input,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { ModalService } from 'src/app2/services/modal.service';
import { RouterService } from 'src/app2/services/router.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { Regex } from '../../constants/constant';
import { DateTimePickerComponent } from '../date-time-picker/date-time-picker.component';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';

@Component({
  selector: 'app-custom-field-selection',
  templateUrl: './custom-field-selection.component.html',
  styleUrls: ['./custom-field-selection.component.css'],
})
export class CustomFieldSelectionComponent implements OnInit {
  @Input() customUrl: string;
  @Input() splitMandatory: boolean;
  @Input() fields: Array<any>;
  @Input() disabled: boolean;
  @Input() enable_tracking: boolean = false;
  @Input() readonly: boolean;
  @Input() showNonMandatoryFields: boolean;
  current_user: any;
  currentFirmId: number;
  loading_data: boolean;
  redirectionUrl: string;
  mandatoryFields: any[];
  nonMandatoryFields: any[];
  fieldForm: FormGroup;
  isSubmitted: boolean;
  urlValidator: any;
  tinyMceInit = { placeholder: 'Please enter text here' };
  fieldsCopy: any[];
  onInitCalled: boolean;
  otherOptionValue: any;
  checkboxOtherOptionValue: any;
  otherOptionIndex: any;
  @ViewChild('dateTime') dateTimePickerComponent: DateTimePickerComponent;
  constructor(
    private readonly Utils: UtilsService,
    private readonly http: HttpClient,
    private readonly route: RouterService,
    public bsModalNewRef: BsModalRef,
    public bsModalRef: ModalService,
    public customModalService: CustomModalService,
  ) {}

  ngOnInit(): void {
    this.current_user = this.Utils.getCurrentUser();
    this.currentFirmId = this.current_user.firmInfo.id;
    this.loading_data = true;
    this.redirectionUrl = 'app.firm.settings.' + this.customUrl;
    this.urlValidator = Validators.pattern(Regex.validUrl);
    if (!this.fields) {
      this.fields = new Array<any>();
    }
    this.fieldForm = new FormGroup({});
    this.fieldsCopy = [...this.fields];
    this.onInitCalled = true;
    this.processCustomFields(!this.splitMandatory);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.fields?.currentValue && this.onInitCalled) {
      this.fields = changes.fields.currentValue;
      this.fieldsCopy = [...this.fields];
      this.processCustomFields();
    }
  }

  processCustomFields(setValue = true) {
    this.mandatoryFields = [];
    this.nonMandatoryFields = [];
    if (this.splitMandatory) {
      this.fields.forEach((field) => {
        field = this.parseField(field);
        if (field.is_mandatory) {
          this.mandatoryFields.push(field);
        } else {
          this.nonMandatoryFields.push(field);
        }
        this.addFieldToForm(field, setValue);
      });
      if (this.mandatoryFields.length === 0) {
        for (let index = 0; index < 3; index++) {
          if (this.nonMandatoryFields[0]) {
            this.mandatoryFields.push(this.nonMandatoryFields[0]);
            this.nonMandatoryFields.splice(0, 1);
          }
        }
      }
    } else {
      this.fields.forEach((field) => {
        field = this.parseField(field);
        this.mandatoryFields.push(field);
        this.addFieldToForm(field, setValue);
      });
    }
    this.loading_data = false;
  }

  addFieldToForm(field, setValue = true) {
    this.fieldForm.addControl(field.field_unique_key, new FormArray([]));
    this.addNewField(field, false, setValue);
  }

  addNewField(field, addButtonClicked = false, setValue = true) {
    if (
      field.value &&
      (!Array.isArray(field.value) || field.value.length) &&
      !addButtonClicked
    ) {
      // add new fields with existing values
      if (
        field.type === 'text' ||
        field.type === 'int' ||
        field.type === 'numeric' ||
        field.type === 'date' ||
        field.type === 'datetime'
      ) {
        field.value.forEach((value) => {
          this.getFormArray(field.field_unique_key).push(
            new FormGroup({
              value: new FormControl(
                setValue
                  ? (field.type == 'date' || field.type === 'datetime') &&
                    value.value
                    ? new Date(value.value)
                    : value.value
                  : null,
                field.is_mandatory ? Validators.required : null
              ),
            })
          );
        });
      } else if (
        field.type === 'dropdown' ||
        field.type === 'checkbox' ||
        field.type === 'dynamic'
      ) {
        this.getFormArray(field.field_unique_key).push(
          new FormGroup({
            value: new FormControl(
              setValue
                ? field.type == 'dropdown'
                  ? field.options.find((x) => x.id === field.value)
                  : field.type == 'dynamic' && !field.has_multiple
                  ? field?.value[0]
                  : field.value
                : null,
              field.is_mandatory ? Validators.required : null
            ),
          })
        );
      } else if (field.type === 'textmultiline') {
        this.getFormArray(field.field_unique_key).push(
          new FormGroup({
            value: new FormControl(
              setValue ? field.value[0].value : null,
              field.is_mandatory ? Validators.required : null
            ),
          })
        );
      } else if (field.type === 'link') {
        field.value.forEach((value) => {
          this.getFormArray(field.field_unique_key).push(
            new FormGroup({
              value: new FormControl(
                setValue ? value.value : null,
                field.is_mandatory ? Validators.required : null
              ),
            })
          );
          this.addUrlControl(field, setValue ? value.value_url : null);
        });
      } else {
        this.getFormArray(field.field_unique_key).push(
          new FormGroup({
            value: new FormControl(
              field.type === 'dropdown' || field.type === 'dynamic' ? null : '',
              field.is_mandatory ? Validators.required : null
            ),
          })
        );
      }
    } else {
      // initialize new field
      this.getFormArray(field.field_unique_key).push(
        new FormGroup({
          value: new FormControl(
            field.type === 'dropdown' || field.type === 'dynamic' ? null : '',
            field.is_mandatory ? Validators.required : null
          ),
        })
      );
      if (field.type === 'link') {
        this.addUrlControl(field, null);
      }
    }
  }

  getFormArray(key) {
    return this.fieldForm.get(key) as FormArray;
  }

  addUrlControl(field, existingValue) {
    const length = this.getFormArray(field.field_unique_key).controls.length;
    const validations = [];
    if (field.is_mandatory) {
      validations.push(Validators.required);
    }
    validations.push(this.urlValidator);
    (
      this.getFormArray(field.field_unique_key).controls[
        length - 1
      ] as FormGroup
    ).addControl(
      'value_url',
      new FormControl(existingValue ?? '', validations)
    );
  }

  log() {
    this.getAddedFields();
  }

  addCommasToInt(key, index) {
    let value: string =
      this.getFormArray(key).controls[index].get('value').value;
    if (!value) {
      return;
    }
    // first remove all commas from existing value
    value = value.replace(/\,/g, '');
    const num: number =
      value[0] === '-' ? +value.slice(1, value.length - 1) : +value;
    // add commas to int value
    const stringWithCommas =
      (value[0] === '-' ? '-' : '') + num.toLocaleString();
    // patch updated value to the form
    this.getFormArray(key)
      .controls[index].get('value')
      .patchValue(stringWithCommas);
  }

  validateInt(key, index, event) {
    // to allow only integer values to be entered in the textbox
    if (event.key === '-') {
      if (!this.getFormArray(key).controls[index].get('value').value) {
        // negative sign is allowed for first character
        return true;
      }
    }
    if (event.key === null || event.key === '' || isNaN(Number(event.key))) {
      return false;
    }
    return true;
  }

  setValidationForUrl(field, index) {
    const urlControl = this.getFormArray(field.field_unique_key).controls[
      index
    ].get('value_url');
    if (
      !this.getFormArray(field.field_unique_key).controls[index].get('value')
        .value
    ) {
      if (!field.is_mandatory) {
        // remove required validation
        urlControl.clearValidators();
        urlControl.setValidators(this.urlValidator);
        urlControl.updateValueAndValidity();
      }
    } else {
      const validations = [this.urlValidator];
      if (field.is_mandatory) {
        // add required validation
        validations.push(Validators.required);
      }
      urlControl.setValidators(validations);
      urlControl.updateValueAndValidity();
    }
  }

  parseField(field: any) {
    if (field.type === 'dropdown') {
      field.otherOption = field.options.find(
        (option) => option.value.toLowerCase() === 'other'
      );

      if (field.value && field.value.length) {
        if (field.otherOption && field.value[0].id === field.otherOption.id) {
          field.textExplanation = field.value[0].explanation;
        }

        if (field.value[0].id) {
          const id = field.value[0].id;
          field.value = id;
          // field.value = field.options.find(
          //   (option) => option.id === field.value[0].id
          // );
        } else {
          //field.value = _(field.value[0]).pick('id','value');
          field.value = field.value[0];
        }
      }
    } else if (field.type === 'checkbox') {
      field.otherOption = field.options.find(
        (option) => option.value.toLowerCase() === 'other'
      );

      if (field.value && field.value.length === 1 && !field.value[0].id) {
        field.value = [];
      }

      if (field.otherOption) {
        const otherOptionIndex = field.value.findIndex(
          (item) => field.otherOption.id === item.id
        );
        if (otherOptionIndex > -1) {
          field.textExplanation = field.value[otherOptionIndex].explanation;
          field.value[otherOptionIndex].value = 'Other';
          field.is_other_option_selected = true;
        }
      }
    } else if (field.type === 'dynamic') {
      // temp solution
      // service team needs to change all urls to new ones as discussed previously
      let requestPromise;
      const url = new URL(field.endpoint);
      if (field.method.toLowerCase() == 'get') {
        requestPromise = this.http.get(
          url.pathname.replace('/api/', '') + url.search
        );
      } else if (field.method.toLowerCase() == 'post') {
        requestPromise = this.http.post(
          url.pathname.replace('/api/', '') + url.search,
          field.request_params
        );
      }
      requestPromise.subscribe((response: any) => {
        let fieldIds: any;
        field.dynamicSource = [];
        if (field.value && field.value.length > 0) {
          fieldIds = field.value.map((x) => x.id);
          field.value = [];
        }
        const data = response.data ? response.data : response;
        data.forEach((source: any) => {
          const newField = {
            id: source.id,
            value: source[field.display_attribute],
          };
          field.dynamicSource.push(newField);
          if (fieldIds && Array.from(fieldIds).includes(source.id)) {
            field.value.push(newField);
          }
        });
        if (!field.has_multiple && field.value && field.value.length > 0) {
          field.value = field.value[0];
        }
      });
    } else if (
      (field.type === 'int' ||
        field.type === 'numeric' ||
        field.type === 'text') &&
      !field.has_multiple
    ) {
      if (field.value.length > 0) {
        const value = field.value[0];
        field.value = [value];
      }
    }
    return field;
  }

  isOtherOptionSelected(field: any, index: number): boolean {
    return (
      field.otherOption &&
      this.getFormArray(field.field_unique_key)
        .controls[index].get('value')
        .value.findIndex((item) => field.otherOption.id === item.id) > -1
    );
  }

  getCheckboxValue(key, index, option) {
    const value = this.getFormArray(key).controls[index].get('value').value;
    if (value?.length && value[0].id) {
      return value.findIndex((val) => val.id === option.id) !== -1;
    }
    return false;
  }

  onCheckBoxValueChange(field, index, option, event) {
    const key = field.field_unique_key;
    const value = this.getFormArray(key).controls[index].get('value').value;
    let existingValues = value;
    // checking and appending new values in existing value
    existingValues = existingValues?.length ? [...value, option] : [option];
    if (event) {
      this.getFormArray(key)
        .controls[index].get('value')
        .patchValue(existingValues);
    } else {
      this.getFormArray(key)
        .controls[index].get('value')
        .patchValue(value.filter((x) => x.id !== option.id));
    }
    field.is_other_option_selected = this.isOtherOptionSelected(field, index);
  }

  removeField(key, index) {
    this.getFormArray(key).removeAt(index);
  }

  clearField(key, index) {
    const control = this.getFormArray(key).controls[index];
    control.get('value').setValue(null);
    if (control?.value?.value_url) {
      control.get('value_url').setValue(null);
    }
  }
  onOptionChanged(key, index, data) {
    this.getFormArray(key).controls[index].get('value').patchValue(data);
  }

  handleEditorTextChange(key, index, data) {
    this.getFormArray(key).controls[index].get('value').patchValue(data);
  }

  redirect(url) {
    this.customModalService.closeAllActiveModals();
    this.route.navigate(url);
  }

  // this needs to be called from parent component on Submit button to check validity.
  isFormValid() {
    if (this.dateTimePickerComponent) {
      this.dateTimePickerComponent.hidePop();
    }
    this.isSubmitted = true;
    if (!this.fieldForm.valid) {
      this.fieldForm.markAllAsTouched();
      return false;
    }
    return this.validateOtherOption();
  }

  // if other option is selected, validate if explanation is provided
  validateOtherOption() {
    const fields = this.fields.filter(
      (x) => x.type === 'dropdown' || x.type === 'checkbox'
    );
    for (let field of fields) {
      const value = this.fieldForm.value[field.field_unique_key].map(
        (x) => x.value
      );
      if (field.type === 'dropdown') {
        if (value.length && value[0]?.id) {
          if (field.otherOption) {
            if (
              field.otherOption.id === value[0].id &&
              !field.textExplanation
            ) {
              return false;
            }
          }
        }
      } else if (field.type === 'checkbox') {
        if (value.length && value[0]?.length) {
          if (field.otherOption) {
            const otherOptionIndex = value[0].findIndex(
              (item) => field.otherOption.id === item.id
            );
            if (otherOptionIndex > -1 && !field.textExplanation) {
              return false;
            }
          }
        }
      }
    }
    return true;
  }

  // this needs to be called from parent component on Submit button.
  getAddedFields(): Array<any> {
    const allFields = [...this.mandatoryFields, ...this.nonMandatoryFields];
    const formValue = this.fieldForm.value;
    allFields.forEach((field) => {
      if (field.type === 'dropdown') {
        let value = formValue[field.field_unique_key].map((x) => x.value);
        if (value.length && value[0]?.id) {
          if (field.otherOption) {
            if (field.otherOption.id === value[0].id) {
              this.otherOptionValue = [
                {
                  id: field.otherOption.id,
                  value: field.textExplanation,
                },
              ];
            }
          }
          field.value =
            this.otherOptionValue && field.otherOption
              ? this.otherOptionValue
              : value;
        } else {
          field.value = [];
        }
      } else if (field.type === 'checkbox') {
        const value = formValue[field.field_unique_key].map((x) => x.value);
        if (value.length && value[0]?.length) {
          if (field.otherOption) {
            this.otherOptionIndex = value[0].findIndex(
              (item) => field.otherOption.id === item.id
            );
            if (this.otherOptionIndex > -1) {
              this.checkboxOtherOptionValue = {
                id: field.otherOption.id,
                value: field.textExplanation,
              };
            }
          }
          field.value = value[0];
          if (this.checkboxOtherOptionValue && field.otherOption) {
            field.value[this.otherOptionIndex] = this.checkboxOtherOptionValue;
          }
        } else {
          field.value = [];
        }
      } else if (field.type === 'dynamic') {
        const value = formValue[field.field_unique_key].map((x) => x.value);
        if (
          value.length &&
          ((field.has_multiple && value[0]?.length) ||
            (!field.has_multiple && value[0]?.id))
        ) {
          field.value = field.has_multiple ? value[0] : value;
        } else {
          field.value = [];
        }
      } else if (field.type === 'int') {
        // remove comma from value before saving
        const value = formValue[field.field_unique_key];
        if (value?.length) {
          field.value = value
            .filter((val) => val.value)
            .map((val) => {
              val.value = +String(val.value).replace(/\,/g, '');
              return val;
            });
        } else {
          field.value = [];
        }
      } else if (field.type === 'text') {
        // remove comma from value before saving
        const value = formValue[field.field_unique_key];
        if (value?.length) {
          field.value = value.filter((val) => val.value);
        } else {
          field.value = [];
        }
      } else if (field.type === 'link') {
        // remove comma from value before saving
        const value = formValue[field.field_unique_key];
        if (value?.length) {
          field.value = value.filter((val) => val.value);
        } else {
          field.value = [];
        }
      } else if (field.type === 'date') {
        const value = formValue[field.field_unique_key];
        if (value?.length && value[0].value) {
          value.forEach((val) => {
            if (val.value) {
              val.value = new Date(val.value).toISOString();
            }
          });
          field.value = value;
        } else {
          field.value = [];
        }
      } else if (field.type === 'datetime') {
        const value = formValue[field.field_unique_key];
        if (value?.length && value[0].value) {
          value.forEach((val) => {
            if (val.value) {
              val.value = new Date(val.value).toISOString();
            }
          });
          field.value = value;
        } else {
          field.value = [];
        }
      } else if (field.type === 'numeric') {
        // remove dot at the end or add 0 at the beginning if required before saving
        const value = formValue[field.field_unique_key];
        if (value?.length) {
          field.value = value
            .filter((val) => val.value)
            .map((val) => {
              if (val.value[0] === '.') {
                val.value = +('0' + String(val.value));
              } else if (val.value[val.value.length - 1] === '.') {
                val.value = +String(val.value).slice(0, val.value.length - 1);
              } else {
                val.value = +val.value;
              }
              return val;
            });
        } else {
          field.value = [];
        }
      } else {
        const value = formValue[field.field_unique_key];
        if (value?.length && value[0].value) {
          field.value = value;
        } else {
          field.value = [];
        }
      }
    });
    return allFields;
  }

  // this needs to be called from parent component to reset the form
  resetForm() {
    this.isSubmitted = false;
    this.fieldForm = new FormGroup({});
    this.fields = [...this.fieldsCopy];
    // params setValue false it will not add the value after resetting from the parent
    this.processCustomFields(false);
  }
}
