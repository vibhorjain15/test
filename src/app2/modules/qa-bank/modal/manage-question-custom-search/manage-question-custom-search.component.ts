import { DatePipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import * as moment from 'moment';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import {
  FILTER_TERNARY_OPERATORS,
  FILTER_TYPES,
} from 'src/app2/shared/constants/constant';

@Component({
  selector: 'app-manage-question-custom-search',
  templateUrl: './manage-question-custom-search.component.html',
})
export class ManageQuestionCustomSearchComponent implements OnInit {
  @Input() customFiltersData: any = {};
  @Input() success: any;
  searchFiltersResponse: any;
  searchCriteriasFiltersBackup: Array<any> = [];
  customCriteriaOptionsPreapproved: Array<any> = [];
  searchCriterias: Array<any> = [];
  defaultCriteriaOptions: any;
  customCriteriaOptions: any;
  globalTernaryOperator = FILTER_TERNARY_OPERATORS.AND;
  activeView: any;
  customSearchForm: FormGroup;
  utils: any;

  FILTER_TERNARY_OPERATORS = FILTER_TERNARY_OPERATORS;
  FILTER_TYPES = FILTER_TYPES;
  logicConditionOptions = [
    { name: 'ANY', id: FILTER_TERNARY_OPERATORS.OR },
    { name: 'ALL', id: FILTER_TERNARY_OPERATORS.AND },
  ];
  yesNoList = [
    { name: 'Yes', id: true },
    { name: 'No', id: false },
  ];
  constructor(
    private readonly customModal: CustomModalService,
    private readonly datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    // this.initForm();
    this.initialize();
  }

  initialize() {
    this.searchFiltersResponse = this.customFiltersData.search_filters_response;
    this.searchCriteriasFiltersBackup = this.customFiltersData.search_criterias;
    this.defaultCriteriaOptions = this.searchFiltersResponse.default_filters;
    this.customCriteriaOptions = this.searchFiltersResponse.custom_filter;
    this.globalTernaryOperator = this.customFiltersData.global_ternary_operator;
    this.activeView = this.customFiltersData.active_view;
    this.customCriteriaOptionsPreapproved =
      this.activeView === 'preapproved'
        ? this.customCriteriaOptions.filter(
            (x: any) => x.filter_label !== 'Project type'
          )
        : [];

    if (this.searchCriteriasFiltersBackup.length === 0) {
      this.defaultCriteriaOptions.forEach((filter) =>
        this.addNewDefaultFilterCriteria(filter)
      );
    } else {
      this.searchCriteriasFiltersBackup.forEach((filter, index) =>
        this.setSearchCriteriasOptions(filter, index)
      );
    }
  }

  get Criterias() {
    return this.customSearchForm.controls.searchCriterias as FormArray;
  }

  setSearchCriteriasOptions(filter: any, index) {
    setTimeout(() => {
      let newCriteria = {};
      let criteriaObj;
      if (index < this.defaultCriteriaOptions.length)
        criteriaObj = this.defaultCriteriaOptions.find(
          (criteria) => criteria.filter_name === filter.criteria_obj.filter_name
        );
      else
        criteriaObj = this.customCriteriaOptions.find(
          (criteria) => criteria.filter_name === filter.criteria_obj.filter_name
        );
      newCriteria = {
        criteria_obj: criteriaObj,
        condition: filter.condition ?? criteriaObj.default_operation.value,
        advance_filter_value: filter.advance_filter_value,
      };
      this.searchCriterias.push(newCriteria);
    }, 200);
  }

  addNewDefaultFilterCriteria(filter: any) {
    setTimeout(() => {
      let newCriteria = {};
      newCriteria = {
        criteria_obj: filter,
        condition: filter.default_operation.value,
      };
      this.searchCriterias.push(newCriteria);
    }, 200);
  }

  addNewCriteria() {
    let newCriteria = {
      criteria_obj: this.customCriteriaOptions[0],
      condition: this.customCriteriaOptions[0].default_operation.value,
    };
    this.searchCriterias.push(newCriteria);
  }

  removeCriteria() {
    this.searchCriterias.splice(this.searchCriterias.length - 1, 1);
  }

  removeCurrentFilter(
    criteria: {
      advance_filter_value: string;
      condition: any;
      criteria_obj: { default_operation: { value: any } };
    },
    index: number
  ) {
    if (index < this.defaultCriteriaOptions.length) {
      criteria.advance_filter_value = null;
      return (criteria.condition =
        criteria.criteria_obj.default_operation.value);
    } else {
      return this.searchCriterias.splice(index, 1);
    }
  }

  handleDateChange(date, criteria) {
    criteria.advance_filter_value = this.datePipe.transform(date, 'MM-dd-yy');
  }

  clearAllFilters() {
    this.searchCriterias = [];
    return Array.from(this.defaultCriteriaOptions).map((filter: any) =>
      this.addNewDefaultFilterCriteria(filter)
    );
  }

  selectCriteria(
    selectedCriteria: any,
    criteria: {
      condition: any;
      criteria_obj: { default_operation: { value: any } };
      advance_filter_value: any;
    },
    index: any
  ) {
    criteria.criteria_obj = selectedCriteria;
    criteria.condition = selectedCriteria.default_operation.value;
    criteria.advance_filter_value = null;
  }

  setOptionsDefaultValue(
    criteria: {
      condition: any;
      criteria_obj: { default_operation: { value: any } };
    },
    index: any
  ) {
    if (criteria.condition) {
      return (criteria.condition = criteria.condition);
    } else {
      return (criteria.condition =
        criteria.criteria_obj.default_operation.value);
    }
  }

  resetFilters() {
    this.globalTernaryOperator = FILTER_TERNARY_OPERATORS.AND;
    this.searchCriterias = [];

    for (let filter of Array.from(this.defaultCriteriaOptions)) {
      this.addNewDefaultFilterCriteria(filter);
    }
    const reset_response = {
      global_ternary_operator: this.globalTernaryOperator,
      searchByFiltersParams: {},
      search_criterias: this.searchCriterias,
    };
    this.success(reset_response);
    this.customModal.close();
  }

  searchByFilters() {
    let filter: any = {};
    const searchByFiltersData = [];
    for (let index = 0; index < this.searchCriterias.length; index++) {
      filter = this.searchCriterias[index];
      if (filter) {
        if (
          filter.condition &&
          filter.advance_filter_value !== null &&
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
    const params = { filters: { [this.globalTernaryOperator]: [] } };
    for (filter of Array.from(searchByFiltersData)) {
      var filter_params: {
        filter_label: any;
        filter_name: any;
        filter_type: any;
        search_type: any;
        filter_value: any;
      };

      filter_params = {
        filter_label: filter.criteria_obj.filter_label,
        filter_name: filter.criteria_obj.filter_name,
        filter_type: filter.criteria_obj.filter_type,
        search_type: filter.condition,
        filter_value: filter.advance_filter_value,
      };

      params.filters[this.globalTernaryOperator].push(filter_params);
    }
    const response = {
      global_ternary_operator: this.globalTernaryOperator,
      searchByFiltersParams: params,
      search_criterias: this.searchCriterias,
    };

    this.success(response);
    this.customModal.close();
  }

  removeAndSearch() {
    this.globalTernaryOperator = FILTER_TERNARY_OPERATORS.AND;
    this.searchCriterias = [];

    this.defaultCriteriaOptions.forEach((filter) =>
      this.addNewDefaultFilterCriteria(filter)
    );

    let reset_response = {
      global_ternary_operator: this.globalTernaryOperator,
      searchByFiltersParams: {},
      search_criterias: this.searchCriterias,
    };
    this.success(reset_response);
    this.customModal.close();
  }

  getDate(value) {
    if (value) {
      let date = value.replace(/-/g, '/');
      date = moment(date).toDate();
      return date;
    } else return new Date();
  }

  clearFilters() {
    this.searchCriterias = [];
    this.defaultCriteriaOptions.forEach((filter) =>
      this.searchCriterias.push({
        criteria_obj: filter,
        condition: filter.default_operation.value,
      })
    );
  }
}
