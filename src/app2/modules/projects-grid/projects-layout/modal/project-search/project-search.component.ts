import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as moment from 'moment';

import { forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EntityUtilsService } from 'src/app2/utils/entity-utils.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import {
  FILTER_TERNARY_OPERATORS,
  FILTER_TYPES,
} from 'src/app2/shared/constants/constant';
const index = {};
@Component({
  selector: 'project-search',
  templateUrl: './project-search.component.html',
  styleUrls: ['./project-search.component.css'],
})
export class ProjectSearchComponent implements OnInit, OnDestroy {
  @Input() customFiltersData: any = {};
  @Input() success: any;
  globalTernaryOperator = FILTER_TERNARY_OPERATORS.OR;
  entityTernaryOperator = FILTER_TERNARY_OPERATORS.OR;
  entityOptionSelection = 'firm';

  FILTER_TERNARY_OPERATORS = FILTER_TERNARY_OPERATORS;
  FILTER_TYPES = FILTER_TYPES;
  logicConditionOptions = [
    { name: 'ANY', id: FILTER_TERNARY_OPERATORS.OR },
    { name: 'ALL', id: FILTER_TERNARY_OPERATORS.AND },
  ];
  entityOtions = [
    { name: 'Firms', id: 'firm' },
    { name: 'Products', id: 'fund' },
    { name: 'Vehicles', id: 'vehicle' },
    { name: 'Strategies', id: 'strategy' },
  ];
  yesNoList = [
    { name: 'Yes', id: true },
    { name: 'No', id: false },
  ];

  projectFilterForm;
  allPreselectedFilterName = {};
  filtersCopyMap = {};
  isEntityFilter = false;
  entityFiltersMap = {};
  loadingEntity = false;
  ngUnsubscribe = new Subject<void>();
  constructor(
    private readonly customModal: CustomModalService,
    private readonly datePipe: DatePipe,
    private fb: FormBuilder,
    private readonly http: HttpClient,
    private readonly entityUtilsService: EntityUtilsService
  ) {}

  ngOnInit(): void {
    this.customFiltersData.search_criterias.forEach((val) => {
      const id = `${val.criteria_obj.filter_key}-${val.criteria_obj.response_type}-${val.advance_filter_value}`;
      this.allPreselectedFilterName[id] = val;
      if (
        val.criteria_obj.type.toLowerCase() === 'date' ||
        val.criteria_obj.type.toLowerCase() === 'datetime'
      ) {
        val.filter_value = new Date(val.advance_filter_value);
      }
    });

    if (this.customFiltersData?.global_ternary_operator) {
      this.globalTernaryOperator =
        this.customFiltersData?.global_ternary_operator;
    }
    if (this.customFiltersData?.entity_ternary_operator) {
      this.entityTernaryOperator =
        this.customFiltersData?.entity_ternary_operator;
    }

    this.initializeForm();
    this.createFilterMap();
    // this.appendDefaultFilters();
    this.updateFiltersObj();
    this.getEntityFilters();
    if (!this.customFiltersData.search_criterias.length) this.addItem();
  }

  getEntityFilters() {
    this.loadingEntity = true;
    const promise = [];
    promise.push(
      this.entityUtilsService.getEntityFilter(
        'service/dvapi_service/search_filters',
        {
          entity_type: 'firm',
        }
      )
    );
    promise.push(
      this.entityUtilsService.getEntityFilter(
        'service/dvapi_service/search_filters',
        {
          entity_type: 'fund',
        }
      )
    );
    promise.push(
      this.entityUtilsService.getEntityFilter(
        'service/dvapi_service/search_filters',
        {
          entity_type: 'strategy',
        }
      )
    );
    promise.push(
      this.entityUtilsService.getEntityFilter(
        'service/dvapi_service/search_filters',
        {
          entity_type: 'vehicle',
        }
      )
    );

    forkJoin(promise).subscribe(([firm, fund, strategy, vehicle]: any) => {
      [firm, fund, strategy, vehicle].forEach((entity: any) => {
        entity.custom_filters.forEach((filter, index) => {
          filter.response_type = entity.response_type;
          const id = `${filter.filter_key}-${filter.response_type}`;
          this.filtersCopyMap[id] = filter;
          if (filter.hasOwnProperty('endpoint')) {
            this.getDynamicCustomFilterOptions(filter, index);
          }
        });
      });
      this.entityFiltersMap = {
        firm,
        fund,
        strategy,
        vehicle,
      };
      this.loadingEntity = false;
      if (!!this.entityFilters.controls.length) {
        this.isEntityFilter = true;
        this.entityOptionSelection =
          this.entityFilters.controls[0].get('response_type').value;
      }
    });
  }

  getDynamicCustomFilterOptions(filter, index) {
    this.entityUtilsService
      .getDynamicDefaultFilterOptions(filter)
      .pipe(takeUntil(this.ngUnsubscribe))
      ?.subscribe((response: any) => {
        const id = `${filter.filter_key}-${filter.response_type}`;
        this.filtersCopyMap[id].options = response.map((option) => {
          option['value'] = option?.name ?? option?.fullName;
          return option;
        });
      });
  }

  updateFiltersObj() {
    if (!!Object.keys(this.allPreselectedFilterName).length) {
      Object.keys(this.allPreselectedFilterName).forEach((key: any) => {
        const filter = this.allPreselectedFilterName[key];
        if (filter.criteria_obj.type == FILTER_TYPES.DATE) {
          filter.advance_filter_value = new Date(filter.advance_filter_value);
        }
        let isDiligence = filter.criteria_obj.response_type == 'duediligence';
        const item = this.fb.group({
          id: index,
          response_type: isDiligence
            ? 'duediligence'
            : filter.criteria_obj.response_type,
          isDefault: false,
          filter_key: [filter.criteria_obj.filter_key],
          filter_name: [filter.criteria_obj],
          filter_category: [filter.criteria_obj.filter_category],
          type: [filter.criteria_obj.type],
          operations: [filter.condition],
          filter_value: [filter.advance_filter_value || null],
        });
        if (isDiligence) this.filters.push(item);
        else this.entityFilters.push(item);
        this.handleSubscription(item);
      });
    }
    if (
      Object.keys(this.allPreselectedFilterName).length &&
      this.filters.length == 0
    ) {
      this.addItem();
    }
    this.allPreselectedFilterName = {};
  }

  get filters(): FormArray {
    return this.projectFilterForm.get('filters') as FormArray;
  }
  get entityFilters(): FormArray {
    return this.projectFilterForm.get('entityFilters') as FormArray;
  }

  initializeForm() {
    this.projectFilterForm = this.fb.group({
      filters: this.fb.array([]),
      entityFilters: this.fb.array([]),
    });
  }

  appendDefaultFilters() {
    this.customFiltersData.search_filters_response.default_filters.forEach(
      (defaultFilter, index) => {
        const id = `${defaultFilter.filter_key}-duediligence-${this.customFiltersData.search_criterias?.[index]?.advance_filter_value}`;
        if (id in this.allPreselectedFilterName) {
          this.filters.push(
            this.fb.group({
              id: index,
              response_type: 'duediligence',
              isDefault: true,
              filter_key: [defaultFilter.filter_key],
              filter_name: [defaultFilter],
              filter_category: [defaultFilter.filter_category],
              type: [defaultFilter.type],
              operations: [this.allPreselectedFilterName[id].condition],
              filter_value: [
                this.allPreselectedFilterName[id].advance_filter_value || null,
              ],
            })
          );
          delete this.allPreselectedFilterName[id];
        } else
          this.filters.push(
            this.fb.group({
              id: index,
              isDefault: true,
              response_type: 'duediligence',
              filter_key: [defaultFilter.filter_key],
              filter_name: [defaultFilter],
              filter_category: [defaultFilter.filter_category],
              type: [defaultFilter.type],
              operations: [defaultFilter.default_operation.value],
              filter_value: [defaultFilter.filter_value || null],
            })
          );
      }
    );
  }

  newEntityItem(): FormGroup {
    return this.fb.group({
      id: this.entityFilters.length,
      isDefault: false,
      response_type: this.entityOptionSelection,
      filter_key: [
        this.entityFiltersMap[this.entityOptionSelection].custom_filters[0]
          .filter_key,
      ],
      filter_category: [
        this.entityFiltersMap[this.entityOptionSelection].custom_filters[0]
          .filter_category,
      ],
      filter_name: ['', Validators.required],
      type: [''],
      operations: [
        this.entityFiltersMap[this.entityOptionSelection].custom_filters[0]
          .default_operation.value,
      ],
      filter_value: [null, Validators.required],
    });
  }

  newItem(): FormGroup {
    return this.fb.group({
      id: this.filters.length,
      isDefault: false,
      response_type: 'duediligence',
      filter_key: [
        this.customFiltersData.search_filters_response.custom_filters[0]
          .filter_key,
      ],
      filter_name: ['', Validators.required],
      type: [''],
      filter_category: [
        this.customFiltersData.search_filters_response.custom_filters[0]
          .filter_category,
      ],
      operations: [
        this.customFiltersData.search_filters_response.custom_filters[0]
          .default_operation.value,
      ],
      filter_value: [null, Validators.required],
    });
  }

  addItem(isEntity = false): void {
    const item = isEntity ? this.newEntityItem() : this.newItem();
    if (isEntity) this.entityFilters.push(item);
    else this.filters.push(item);
    this.handleSubscription(item);
  }

  handleSubscription(item) {
    item
      .get('filter_name')
      ?.valueChanges.pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((value) => {
        item.get('filter_key').patchValue(value.filter_key);
        item.get('filter_category').patchValue(value.filter_category);
        item.get('type').patchValue(value.type);
        item.get('operations').patchValue(value.default_operation.value);
        item.get('filter_value').patchValue(null);
      });
  }

  removeItem(index: number, isEntity = false): void {
    if (isEntity) this.entityFilters.removeAt(index);
    else this.filters.removeAt(index);
  }

  searchByFilters() {
    const payload: any = {
      global_ternary_operator: this.globalTernaryOperator,
      entity_ternary_operator: this.entityTernaryOperator,
      searchByFiltersParams: {
        include_contacts: true,
        include_custom_fields: true,
        include_dates: true,
        filters: {
          [this.globalTernaryOperator]: [],
        },
      },
      search_criterias: [],
    };
    let duplicateData = {};

    let filterValues = this.filters.value.filter((val) => {
      let id = `${val.filter_key}-${val.response_type}-${val.filter_value}`;
      if (id in duplicateData) return false;
      duplicateData[id] = true;
      return val.filter_value;
    });
    let allfilterval = filterValues.map((val) => {
      this.dateFormat(val);
      return {
        filter_key: val.filter_key,
        filter_name: val.filter_name.filter_name,
        type: val.type,
        operations: val.operations,
        filter_value: val.filter_value,
      };
    });
    let searchCriteriasValues = filterValues.map((val) => {
      const id = `${val.filter_key}-${val.response_type}`;
      return {
        criteria_obj: {
          ...this.filtersCopyMap[id],
          operator: this.globalTernaryOperator,
        },
        condition: val.operations,
        advance_filter_value: val.filter_value,
      };
    });
    payload.searchByFiltersParams.filters[this.globalTernaryOperator] =
      allfilterval;
    payload.search_criterias = searchCriteriasValues;

    // Entity Filters
    if (!!this.entityFilters.length) {
      payload.searchByFiltersParams.advance_filter_condition = 'and';
      payload.searchByFiltersParams.advance_filters = {
        [this.entityOptionSelection]: {
          [this.entityTernaryOperator]: [],
        },
      };

      let entityFilterValues = this.entityFilters.value.filter((val) => {
        let id = `${val.filter_key}-${val.response_type}-${val.filter_value}`;
        if (id in duplicateData) return false;
        duplicateData[id] = true;
        return val.filter_value;
      });

      let allEntityFilters = entityFilterValues.map((val) => {
        this.dateFormat(val);
        return {
          filter_key: val.filter_key,
          filter_name: val.filter_name.filter_name,
          type: val.type,
          operations: val.operations,
          filter_value: val.filter_value,
        };
      });

      payload.searchByFiltersParams.advance_filters[this.entityOptionSelection][
        this.entityTernaryOperator
      ] = allEntityFilters;

      let searchEntityCriteriasValues = entityFilterValues.map((val) => {
        const id = `${val.filter_key}-${val.response_type}`;
        return {
          criteria_obj: {
            ...this.filtersCopyMap[id],
            operator: this.entityTernaryOperator,
          },
          condition: val.operations,
          advance_filter_value: val.filter_value,
        };
      });

      if (allEntityFilters.length == 0) {
        delete payload.searchByFiltersParams.advance_filter_condition;
        delete payload.searchByFiltersParams.advance_filters;
      }

      payload.search_criterias.push(...searchEntityCriteriasValues);
    }
    this.success(payload);
    this.customModal.close();
  }
  cancel() {
    this.customModal.close();
  }

  clearFilters() {
    this.filters.clear();
    this.addItem();
    // this.appendDefaultFilters();
  }

  clearEntityFilters() {
    this.entityFilters.clear();
    this.addItem(true);
  }

  dateFormat(val) {
    if (val.type == FILTER_TYPES.DATE) {
      val.filter_value =
        moment(val.filter_value).format('YYYY-MM-DD') + ' 23:59:59';
    }
    if (val.type == FILTER_TYPES.DATETIME) {
      val.filter_value = this.datePipe.transform(
        val.filter_value,
        'dd-MMMM-yyyy, h:mm:ss a'
      );
    }
  }

  setDateValue(date: Date, criteria: FormGroup, index: number) {
    criteria.get('filter_value').setValue(date);
  }

  setDateTimeValue(date: Date, criteria: FormGroup, index: number) {
    criteria.get('filter_value').setValue(date);
  }

  createFilterMap() {
    this.customFiltersData.search_filters_response.custom_filters.forEach(
      (filter) => {
        filter.response_type =
          this.customFiltersData.search_filters_response.response_type;
        const id = `${filter.filter_key}-${filter.response_type}`;
        this.filtersCopyMap[id] = filter;
      }
    );
  }

  handleEntityOptionSelection(entityType) {
    this.entityOptionSelection = entityType;
    this.entityFilters.clear();
    this.addItem(true);
  }

  handleEntityFilterToggle(toggle) {
    this.isEntityFilter = toggle;
    this.entityFilters.clear();
    this.entityOptionSelection = 'firm';
    if (this.isEntityFilter) {
      this.addItem(true);
    }
  }
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
