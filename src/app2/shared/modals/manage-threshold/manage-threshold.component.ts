import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ManageThresholdsService } from 'src/app2/services/manage-thresholds.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { errorMessageMap, Regex } from '../../constants/constant';

@Component({
  selector: 'manage-threshold',
  templateUrl: './manage-threshold.component.html',
  styleUrls: ['./manage-threshold.component.css'],
})
export class ManageThresholdModal implements OnInit {
  boolean_value_options: { label: string; value: boolean }[];
  editMode: boolean = false;
  @Input() threshold: any;
  @Input() types: any;
  @Input() questions: any;
  @Input() operators: any;
  thresholdForm: FormGroup;
  loading: boolean = false;
  secondaryLoading: boolean = false;
  selectedQuestion: any = {};
  errorMessageMap = errorMessageMap;
  questionConditions: any = [];
  constructor(
    private readonly thresholdService: ManageThresholdsService,
    private readonly Utils: UtilsService,
    private readonly BaseDataService: BaseDataService
  ) {}

  ngOnInit(): void {
    this.boolean_value_options = [
      { label: 'Yes', value: true },
      { label: 'No', value: false },
    ];
    if (this.threshold) {
      this.editMode = true;
    }

    this.thresholdForm = new FormGroup({
      id: new FormControl(this.editMode ? this.threshold.id : 0),
      type: new FormControl(
        this.editMode ? this.threshold.type : this.types[1].id,
        Validators.required
      ),
      question_id: new FormControl(
        this.editMode ? this.threshold.question_id : null,
        Validators.required
      ),
      operator_id: new FormControl(
        this.editMode ? this.threshold.operator_id : 'ac',
        Validators.required
      ),
      threshold_value: new FormControl(
        this.editMode ? this.threshold.threshold_value : null,
        Validators.pattern(Regex.avoidFirstSplCharacter)
      ),
    });

    this.questionConditions = this.getConditions();
    if (this.editMode) {
      this.selectedQuestion = this.questions.find(
        (x) => x.id === this.thresholdForm.get('question_id').value
      );
      this.operatorChanged();
    }
  }

  typeChanged() {
    if (this.thresholdForm.get('type').value === 1) {
      this.thresholdForm.get('operator_id').patchValue('ac'); // For Change thresholds, set default to Any Change
    } else {
      this.thresholdForm.get('operator_id').patchValue('eq'); // For Absolute thresholds, set default to Equals
    }
    this.operatorChanged();
  }

  questionChanged() {
    this.thresholdForm.get('threshold_value').patchValue(null);
    if (this.thresholdForm.get('question_id').value) {
      this.selectedQuestion = this.questions.find(
        (x) => x.id === this.thresholdForm.get('question_id').value
      );
    }
    this.typeChanged();
    this.questionConditions = this.getConditions();
  }

  operatorChanged() {
    // if operator is any change, remove the validator else apply the validator
    if (this.thresholdForm.get('operator_id').value !== 'ac') {
      this.thresholdForm
        .get('threshold_value')
        .setValidators([
          Validators.required,
          Validators.pattern(Regex.avoidFirstSplCharacter),
        ]);
    } else {
      this.thresholdForm.get('threshold_value').clearValidators();
    }
    this.thresholdForm.get('threshold_value').updateValueAndValidity();
  }

  save(modalCallback, saveAnother: boolean = false) {
    if (this.thresholdForm.valid) {
      if (saveAnother) {
        this.secondaryLoading = true;
      } else {
        this.loading = true;
      }

      if (this.editMode) {
        this.thresholdService.updateThreshold(
          this.thresholdForm.value,
          () => {
            this.successCallback(modalCallback, saveAnother);
          },
          (error: any) => {
            this.failureCallback(error);
          }
        );
      } else {
        this.thresholdService.addThreshold(
          this.thresholdForm.value,
          () => {
            this.successCallback(modalCallback, saveAnother);
          },
          (error: any) => {
            this.failureCallback(error);
          }
        );
      }
    } else {
      this.thresholdForm.markAllAsTouched();
      return;
    }
  }

  successCallback(modalCallback, saveAnother) {
    this.loading = this.secondaryLoading = false;
    if (saveAnother) {
      // re-initialize the modal
      this.editMode = false;
      this.threshold = null;
      this.selectedQuestion = {};
      this.ngOnInit();
    } else {
      // close the modal
      modalCallback();
    }
  }

  failureCallback(error: any) {
    this.loading = this.secondaryLoading = false;
    const avoid_error_logging_statuses =
      this.BaseDataService.getAvoidErrorLoggingStatusList();
    if (!Array.from(avoid_error_logging_statuses).includes(error.status)) {
      this.Utils.logError('Adding threshold failed', error);
    }
  }

  setDateValue(date: Date) {
    this.thresholdForm.get('threshold_value').patchValue(date);
  }

  getConditions() {
    let filterOptions: { id: string; name: string }[] = [];
    const numericResponse = ['Numeric', 'Integer', 'Percentage', 'Date'];
    const textResponse = [
      'Text',
      'TextMultiLine',
      'TextEmail',
      'TextPhone',
      'Dropdown',
      'CheckBox',
    ];
    if (this.thresholdForm.get('type').value === 1) {
      filterOptions.push({
        id: 'ac',
        name: 'Any change',
      });
    }
    if (numericResponse.includes(this.selectedQuestion.response_type)) {
      const options = [
        { id: 'gt', name: 'Greater Than' },
        { id: 'gte', name: 'Greater Than or Equal To' },
        { id: 'lt', name: 'Lesser Than' },
        { id: 'lte', name: 'Lesser Than or Equal To' },
      ];
      filterOptions = [...filterOptions, ...options];
    }
    filterOptions.push({
      id: 'eq',
      name: 'Equals',
    });
    filterOptions.push({
      id: 'noteq',
      name: 'Not Equals',
    });
    if (textResponse.includes(this.selectedQuestion.response_type)) {
      filterOptions.push({
        id: 'cont',
        name: 'Contains',
      });
    }
    return filterOptions;
  }
}
