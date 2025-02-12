import { DatePipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { UtilsService } from 'src/app2/services/utils.service';
import {
  FILTER_TERNARY_OPERATORS,
  FILTER_TYPES,
} from 'src/app2/shared/constants/constant';
@Component({
  selector: 'app-manage-custom-search',
  templateUrl: './manage-custom-search.component.html',
})
export class ManageCustomSearchComponent implements OnInit {
  @Input() custom_filters_data: any;
  @Input() success: any;

  loadingData = true;
  search_filters_response: any;
  search_criterias_filters_backup = [];
  search_criterias = [];
  default_criteria_options: any;
  custom_criteria_options: any;
  entityType: any;
  global_ternary_operator: any;
  custom_search_form: FormGroup;
  FILTER_TERNARY_OPERATORS = FILTER_TERNARY_OPERATORS;
  FILTER_TYPES = FILTER_TYPES;
  dropdownItems = [
    { key: FILTER_TERNARY_OPERATORS.OR, label: 'ANY' },
    { key: FILTER_TERNARY_OPERATORS.AND, label: 'ALL' },
  ];
  advanceFilterItems = [{ key: true, label: 'Yes' }];
  constructor(
    private readonly customerModalService: CustomModalService,
    private readonly formBuilder: FormBuilder,
    private readonly utils: UtilsService,
    private readonly datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.initialize();
  }

  initForm = () => {
    this.custom_search_form = this.formBuilder.group({
      globalTernaryOperator: [this.custom_filters_data.global_ternary_operator],
      search_criterias: new FormArray([]),
    });
  };

  criteriaDetails = (filter = null, isEditMode = false) =>
    this.formBuilder.group(
      isEditMode
        ? filter
        : {
            criteria_obj: filter,
            condition: filter?.default_operation?.value || '',
            advance_filter_value: filter?.advance_filter_value || '',
            filter_name: filter.filter_name,
            filter_value: filter.filter_name,
          }
    );

  get criterias() {
    return this.custom_search_form.controls.search_criterias as FormArray;
  }

  initialize() {
    try {
      this.search_filters_response =
        this.custom_filters_data.search_filters_response;
      this.search_criterias_filters_backup = [];
      this.search_criterias = [];
      this.search_criterias_filters_backup =
        this.custom_filters_data.search_criterias;
      this.default_criteria_options =
        this.search_filters_response.default_filters;
      this.custom_criteria_options =
        this.search_filters_response.custom_filters;
      this.entityType = this.utils.getDisplayEntityType(
        this.search_filters_response.response_type
      );
      this.global_ternary_operator =
        this.custom_filters_data.global_ternary_operator;
      if (this.search_criterias_filters_backup.length === 0) {
        for (let filter of Array.from(this.default_criteria_options)) {
          this.addNewDefaultFilterCriteria(filter);
        }
      } else {
        for (
          let index = 0;
          index < this.search_criterias_filters_backup.length;
          index++
        ) {
          const filter = this.search_criterias_filters_backup[index];
          if (
            filter.criteria_obj.type.toLowerCase() == FILTER_TYPES.DATE &&
            filter.condition != 'between'
          ) {
            filter.advance_filter_value = this.convertToDate(
              filter.advance_filter_value
            );
          }

          this.setsearch_criteriasOptions(filter, index);
        }
        setTimeout(() => {
          this.makeFormAsPristUnamrked();
        }, 200);
      }
    } catch (error) {
    } finally {
      this.loadingData = false;
    }
  }

  setsearch_criteriasOptions(
    filter: {
      condition: any;
      advance_filter_value: any;
      criteria_obj: { filter_key: any };
      filter_name: string;
      filter_value: string;
    },
    index: number
  ) {
    this.criterias.push(this.criteriaDetails(filter, true));
  }

  addNewDefaultFilterCriteria(filter: any) {
    this.criterias.push(this.criteriaDetails(filter));
    this.makeFormAsPristUnamrked();
  }

  addNewCriteria() {
    const newFilter = this.custom_criteria_options[0];
    this.criterias.push(this.criteriaDetails(newFilter));
    this.criterias.controls[this.criterias.controls.length - 1].patchValue({
      filter_name: newFilter.filter_name,
    });
    this.criterias.controls[
      this.criterias.controls.length - 1
    ].updateValueAndValidity();
    this.makeFormAsPristUnamrked();
  }

  removeCriteria() {
    this.search_criterias.splice(this.search_criterias.length - 1, 1);
    this.makeFormAsPristUnamrked();
  }

  removeCurrentFilter(criteria: FormGroup, index: number) {
    if (index < this.default_criteria_options.length) {
      this.criterias.controls[index].patchValue({
        advance_filter_value: '',
      });
    } else {
      this.criterias.controls.splice(index, 1);
    }
    if (this.criterias.controls[index]) {
      this.makeFormAsPristUnamrked();
    }
  }

  clearAllFilters() {
    this.search_criterias = [];
    this.custom_search_form.controls.search_criterias = new FormArray([]);
    return Array.from(this.default_criteria_options).map((filter: any) =>
      this.addNewDefaultFilterCriteria(filter)
    );
  }

  selectCriteria(dvSelectEvent: any, criteria: FormGroup, index: any) {
    let custom_criteria_option = this.custom_criteria_options.find(
      (x: any) => x.filter_name === dvSelectEvent
    );
    this.criterias.controls[index].patchValue({
      criteria_obj: custom_criteria_option,
      condition: custom_criteria_option.default_operation.value,
      advance_filter_value:
        custom_criteria_option.type == 'date'
          ? new Date()
          : custom_criteria_option.filter_value,
      filter_name: custom_criteria_option.filter_name,
    });
    // this.setOptionsDefaultValue(criteria, index);
  }

  setOptionsDefaultValue(criteria: FormGroup, index: any) {
    const criteria_obj = criteria.value;
    if (criteria_obj.condition) {
      criteria_obj.condition = criteria_obj.condition;
    } else {
      criteria_obj.condition =
        criteria_obj.criteria_obj.default_operation.value;
    }
    this.criterias.controls[index].patchValue({
      condition: criteria_obj.condition,
    });
  }

  resetFilters() {
    this.global_ternary_operator = this.FILTER_TERNARY_OPERATORS.AND;
    this.search_criterias = [];
    this.makeFormAsPristUnamrked();

    for (let filter of Array.from(this.default_criteria_options)) {
      this.addNewDefaultFilterCriteria(filter);
    }
    const reset_response = {
      global_ternary_operator: this.global_ternary_operator,
      searchByFiltersParams: {},
      search_criterias: this.search_criterias,
    };
    return this.close(reset_response);
  }
  close(reset_response: {
    global_ternary_operator: any;
    searchByFiltersParams: {};
    search_criterias: any;
  }) {
    this.success(reset_response);
    this.customerModalService.close();
  }

  searchByFilters() {
    let filter: any = {};
    const searchByFiltersData = [];
    const searchCriterias = this.criterias.controls.filter((x) => x.value);
    this.search_criterias = [];
    for (let index = 0; index < searchCriterias.length; index++) {
      filter = searchCriterias[index].value;
      this.search_criterias.push(filter);
      if (filter) {
        if (
          filter.condition &&
          filter.advance_filter_value &&
          filter.condition !== null &&
          filter.advance_filter_value !== null &&
          filter.advance_filter_value !== '' &&
          filter.advance_filter_value !== undefined
        ) {
          searchByFiltersData.push(filter);
        }
      }
    }
    if (searchByFiltersData.length === 0) {
      this.resetFilters();
    }
    const params = {
      include_contacts: true,
      include_custom_fields: true,
      include_dates: true,
      include_ratings: true,
      filters: { [this.global_ternary_operator]: [] },
    };
    for (filter of Array.from(searchByFiltersData)) {
      var filter_params: {
        filter_key: any;
        filter_name: any;
        type: any;
        operations: any;
        filter_value: any;
      };
      if (
        filter.criteria_obj.type === this.FILTER_TYPES.DATE ||
        filter.criteria_obj.type === this.FILTER_TYPES.DATETIME
      ) {
        filter_params = {
          filter_key: filter.criteria_obj.filter_key,
          filter_name: filter.criteria_obj.filter_name,
          type: filter.criteria_obj.type,
          operations: filter.condition,
          filter_value: new Date(filter.advance_filter_value).toISOString(),
        };
      } else {
        filter_params = {
          filter_key: filter.criteria_obj.filter_key,
          filter_name: filter.criteria_obj.filter_name,
          type: filter.criteria_obj.type,
          operations: filter.condition,
          filter_value: filter.advance_filter_value,
        };
      }
      params.filters[this.global_ternary_operator].push(filter_params);
    }
    const response = {
      global_ternary_operator: this.global_ternary_operator,
      searchByFiltersParams: params,
      search_criterias: this.search_criterias,
    };
    this.success(response);
    this.customerModalService.close();
  }

  setGlobalTernaryOperator(dvSelectEvent: any) {
    this.global_ternary_operator = dvSelectEvent;
  }

  setDateValue(
    selectedDate: Date,
    index: number,
    isDateTime = false,
    criteria
  ) {
    if (selectedDate) {
      let formatedDate;
      if (criteria?.value.criteria_obj.filter_category == 'custom_fields') {
        formatedDate = isDateTime
          ? this.datePipe.transform(selectedDate, 'dd-MMMM-yyyy, h:mm:ss a')
          : selectedDate;
      }
      setTimeout(() => {
        this.criterias.controls[index].patchValue({
          advance_filter_value:
            criteria?.value.criteria_obj.filter_category == 'custom_fields'
              ? formatedDate
              : selectedDate,
        });
      }, 100);
    }
  }

  onChange(value: Date, i: number) {
    this.criterias.controls[i].patchValue({
      advance_filter_value: value,
    });
  }

  convertToDate = (date: string) => new Date(date);

  makeFormAsPristUnamrked() {
    this.custom_search_form.markAsPristine();
    this.custom_search_form.markAsUntouched();
  }
}
