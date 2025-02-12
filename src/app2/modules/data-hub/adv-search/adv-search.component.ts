import { Component, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { ColDef } from 'ag-grid-community';
import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';
import { ADVSearchService } from 'src/app2/services/adv-search-service';
import { RouterService } from 'src/app2/services/router.service';
import { UtilsService } from 'src/app2/services/utils.service';
import {
  errorMessageMap,
  FILTER_TERNARY_OPERATORS,
  FILTER_TYPES,
} from 'src/app2/shared/constants/constant';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import { Select, Store } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take } from 'rxjs/operators';
@Component({
  selector: 'app-adv-search',
  templateUrl: './adv-search.component.html',
  styleUrls: ['./adv-search.component.css'],
})
export class AdvSearchComponent implements OnInit {
  columnDefs: ColDef[];
  advGridData: any;
  render_grid: boolean;
  loading_data: boolean = false;
  views = {
    FIRM: 'firm',
    FUND: 'fund',
    SERVICE_PROVIDER: 'service_provider',
  };
  activeView: any;
  isFreeSubscription: boolean;
  global_ternary_operator: any;
  FILTER_TERNARY_OPERATORS = FILTER_TERNARY_OPERATORS;
  FILTER_TYPES = FILTER_TYPES;
  showingSearchResults: boolean;
  defaultParams: any = {};
  advanceAdvSearch: boolean;
  entity_search_text: any = null;
  entity_search_text_backup: any = null;
  search_criterias: any = {};
  search_criterias_backup: any = {};
  recordsCount: number = 0;
  totalRecordsCount: number = 0;
  isSearchPanelCollapsed: boolean;
  criteria_options: any;
  default_search_criteria_index: any;
  filters: FormArray;
  selectedFilter: any[];
  gridName: string = '';
  errorMessageMap = errorMessageMap;
  @Select(UserState.getCurrentUserData) user;
  matchingCriteria = [
    { id: FILTER_TERNARY_OPERATORS.OR, name: 'ANY' },
    { id: FILTER_TERNARY_OPERATORS.AND, name: 'ALL' },
  ];
  filterOptions = {
    items: [],
  };
  constructor(
    private readonly ADVSearchService: ADVSearchService,
    private readonly utils: UtilsService,
    private readonly toaster: ToastrService,
    private readonly routerService: RouterService,
    private readonly store: Store
  ) {}

  ngOnInit(): void {
    this.selectedFilter = new Array<any>();
    this.activeView = this.views.FIRM;
    this.gridName = `${this.activeView}-adv-search`;
    this.global_ternary_operator = this.FILTER_TERNARY_OPERATORS.AND;
    this.isSearchPanelCollapsed = true;
    this.loading_data = true;
    this.filters = new FormArray([]);
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.isFreeSubscription = data.isFreeSubscription;
          this.getCriteriaList();
        }
      });
  }

  initGrid() {
    this.render_grid = false;
    this.totalRecordsCount = this.recordsCount = 0;
    this.columnDefs = this.ADVSearchService.getADVSearchGridColDef(
      this.activeView
    );
    this.store.dispatch(
      new SetDefaultColumnDef({ [this.gridName]: this.columnDefs })
    );
    this.ADVSearchService.getADVSearchGridData(this.defaultParams).subscribe(
      (response: any) => {
        this.advGridData = response;
        this.ModifyDataForDisplay();
        this.render_grid = true;
      }
    );
  }

  ModifyDataForDisplay() {
    this.totalRecordsCount = this.recordsCount = this.advGridData.length;
  }

  setActiveView(mode: any) {
    //dont not allow them to change active view for free users
    if (this.isFreeSubscription) {
      return;
    }
    this.activeView = mode;
    this.gridName = `${this.activeView}-adv-search`;
    this.search_criterias = [
      {
        criteria_obj: this.criteria_options[this.default_search_criteria_index],
      },
    ];
    this.search_criterias_backup = JSON.parse(
      JSON.stringify(this.search_criterias)
    );
    this.resetFiltersData(false);
  }

  onRowClicked = (event) => {
    if (event?.data) {
      this.routerService.navigateWithParams(`app.form_adv.firm.snapshot`, {
        firmCRD: event.data.firmcrd,
      });
    }
  };

  getCriteriaList() {
    this.ADVSearchService.getCriteriaList().subscribe((response: any) => {
      this.criteria_options = response;
      this.default_search_criteria_index = this.getDefaultSearchCriteria();
      this.search_criterias = [
        {
          criteria_obj:
            this.criteria_options[this.default_search_criteria_index],
        },
      ];
      this.search_criterias_backup = JSON.parse(
        JSON.stringify(this.search_criterias)
      );
      this.setDefaultView();
      this.loading_data = false;
      const group = new FormGroup({
        criteria_obj: new FormControl(
          this.search_criterias[0].criteria_obj.filter_name,
          Validators.required
        ),
        condition: new FormControl('', Validators.required),
        advance_filter_value: new FormControl('', Validators.required),
        filter_type: new FormControl(
          this.search_criterias[0].criteria_obj.filter_type
        ),
      });
      this.selectedFilter[0] = this.search_criterias[0].criteria_obj;
      this.filterOptions[0] = {};
      this.filterOptions[0].items = this.getFilterOptions(0);
      this.filters.push(group);
      this.selectDefault(group, this.search_criterias.length - 1);
    });
  }

  getDefaultSearchCriteria() {
    //return the index of the default search criteria
    const value = 'pf_id';
    return this.criteria_options.findIndex((option: any) => {
      return option.filter_name.toLowerCase() === value;
    });
  }

  initDefaultFiltersSyntex() {
    this.defaultParams = {};
    this.defaultParams.filters = {};
  }

  setDefaultView() {
    this.advanceAdvSearch = false;
    this.initDefaultFiltersSyntex();
    this.defaultParams.type = this.activeView;
    this.defaultParams.response_type = this.activeView;
    this.initGrid();
  }

  searchByEntity() {
    if (this.entity_search_text && this.entity_search_text.length > 2) {
      this.showingSearchResults = true;
      this.entity_search_text_backup = JSON.parse(
        JSON.stringify(this.entity_search_text)
      );
      this.getSearchResults();
    } else {
      this.toaster.warning('Please enter a valid text');
    }
  }
  getSearchResults() {
    if (this.isFreeSubscription) {
      return;
    }
    this.getPayload();
    this.defaultParams.type = this.activeView;
    this.defaultParams.response_type = this.activeView;
    this.initGrid();
  }

  getPayload() {
    this.defaultParams.filters = {};
    if (this.search_criterias_backup.length) {
      for (let params of Array.from(this.search_criterias_backup)) {
        const param: any = params;
        if (param.advance_filter_value != null) {
          this.generatePayloadParams(this.global_ternary_operator, param);
        }
      }
    }

    if (this.entity_search_text_backup) {
      this.defaultParams.filters[this.FILTER_TERNARY_OPERATORS.GENERAL] = {
        filter_type: 'general',
        filter_value: this.entity_search_text_backup,
        search_type: 'contains',
      };
    }
  }

  generatePayloadParams(ternary_operator: any, params: any) {
    let operatorObject = {};
    let innerObject = {};
    if (this.defaultParams.filters[ternary_operator]) {
      operatorObject = this.defaultParams.filters[ternary_operator];
    } else {
      this.defaultParams.filters[ternary_operator] = {};
      operatorObject = this.defaultParams.filters[ternary_operator];
    }

    const parent_entity = params.criteria_obj.parent;
    innerObject = this.getInnerObject(params);
    if (operatorObject.hasOwnProperty(parent_entity)) {
      operatorObject[parent_entity].push(innerObject);
    } else {
      operatorObject[parent_entity] = [];
      operatorObject[parent_entity].push(innerObject);
    }
  }

  getInnerObject(criteria: any) {
    const innerObject: any = {};
    if (
      criteria.criteria_obj.filter_type.toLowerCase() === this.FILTER_TYPES.DATE
    ) {
      innerObject.filter_type = criteria.criteria_obj.filter_name;
      innerObject.search_type = 'range';
      innerObject.range_type = criteria.condition;
      if (criteria.condition === 'between') {
        innerObject.filter_value_min = this.utils.formatDatetime(
          criteria.advance_filter_value.startDate
        );
        innerObject.filter_value_max = this.utils.formatDatetime(
          criteria.advance_filter_value.endDate
        );
      } else {
        innerObject.filter_value_min = this.utils.formatDatetime(
          criteria.advance_filter_value
        );
      }
    } else if (
      criteria.criteria_obj.filter_type.toLowerCase() ===
      this.FILTER_TYPES.NUMBER
    ) {
      innerObject.filter_type = criteria.criteria_obj.filter_name;
      innerObject.filter_value_min = criteria.advance_filter_value;
      innerObject.search_type = 'range';
      innerObject.range_type = criteria.condition;
    } else {
      innerObject.filter_type = criteria.criteria_obj.filter_name;
      innerObject.filter_value = criteria.advance_filter_value;
      innerObject.search_type = criteria.condition;
    }
    return innerObject;
  }

  clearSearchText() {
    this.entity_search_text = null;
    this.entity_search_text_backup = null;
    this.getSearchResults();
  }

  resetFilters(key) {
    this.entity_search_text = null;
    this.entity_search_text_backup = null;
    this.showingSearchResults = false;
    this.setDefaultView();
    if (key == true) {
      this.clearFilters(key);
      this.toggleSearchPanel();
    }
  }

  globalOperatorChanged(operator: any) {
    this.initDefaultFiltersSyntex();
  }

  clearFilters(key) {
    this.resetFiltersData(key);
    this.toggleSearchPanel();
  }

  resetFiltersData(key) {
    this.global_ternary_operator = this.FILTER_TERNARY_OPERATORS.AND;
    this.search_criterias = [
      {
        criteria_obj: this.criteria_options[this.default_search_criteria_index],
      },
    ];
    this.search_criterias_backup = JSON.parse(
      JSON.stringify(this.search_criterias)
    );
    this.filters = new FormArray([]);
    const group = new FormGroup({
      criteria_obj: new FormControl(
        this.search_criterias[0].criteria_obj.filter_name,
        Validators.required
      ),
      condition: new FormControl('', Validators.required),
      advance_filter_value: new FormControl('', Validators.required),
      filter_type: new FormControl(
        this.search_criterias[0].criteria_obj.filter_type
      ),
    });
    this.selectedFilter = new Array<any>();
    this.selectedFilter[0] = this.search_criterias[0].criteria_obj;
    this.filters.push(group);
    this.selectDefault(group, this.search_criterias.length - 1);
    this.filters.markAsPristine();
    this.filters.markAsUntouched();
    if (key != true) {
      this.resetFilters(false);
    }
  }

  toggleSearchPanel() {
    this.isSearchPanelCollapsed = !this.isSearchPanelCollapsed;
    // no need of the code that was there previously
  }

  selectCriteria(criteria: FormGroup, index: any) {
    this.selectedFilter[index] = this.criteria_options.find(
      (x) => x.filter_name === criteria.get('criteria_obj').value
    );
    this.search_criterias[index].criteria_obj = this.selectedFilter[index];
    if (
      this.selectedFilter[index].filter_type.toLowerCase() ===
      this.FILTER_TYPES.DATE
    ) {
      this.search_criterias[index].advance_filter_value = '';
      criteria.get('advance_filter_value').setValue('');
    } else {
      this.search_criterias[index].advance_filter_value = null;
      criteria.get('advance_filter_value').setValue(null);
    }
    criteria
      .get('filter_type')
      .setValue(this.selectedFilter[index].filter_type);
    this.selectDefault(criteria, index);
    // added conditions
    this.filterOptions[index] = {};
    this.filterOptions[index].items = this.getFilterOptions(index);
    // added values as per selected filter
    if (this.selectedFilter[index]?.filter_value?.length) {
      this.filterOptions[index].values = this.selectedFilter[
        index
      ]?.filter_value.map((value) => {
        return {
          id: value,
          name: value,
        };
      });
    }
  }

  selectDefault(criteria: FormGroup, index: number) {
    // for formgroup critera
    if (
      this.selectedFilter[index].filter_type.toLowerCase() ===
      this.FILTER_TYPES.RANGE
    ) {
      criteria.get('condition').setValue('exact');
    } else if (
      this.selectedFilter[index].filter_type.toLowerCase() ===
      this.FILTER_TYPES.STRING
    ) {
      criteria.get('condition').setValue('phrase');
    } else if (
      this.selectedFilter[index].filter_type.toLowerCase() ===
        this.FILTER_TYPES.NUMBER ||
      this.selectedFilter[index].filter_type.toLowerCase() ===
        this.FILTER_TYPES.DATE
    ) {
      criteria.get('condition').setValue('gt');
    }

    // for array object criteria
    if (
      this.search_criterias[index].criteria_obj.filter_type.toLowerCase() ===
      this.FILTER_TYPES.RANGE
    ) {
      this.search_criterias[index].condition = 'exact';
    } else if (
      this.search_criterias[index].criteria_obj.filter_type.toLowerCase() ===
      this.FILTER_TYPES.STRING
    ) {
      this.search_criterias[index].condition = 'phrase';
    } else if (
      this.search_criterias[index].criteria_obj.filter_type.toLowerCase() ===
        this.FILTER_TYPES.NUMBER ||
      this.search_criterias[index].criteria_obj.filter_type.toLowerCase() ===
        this.FILTER_TYPES.DATE
    ) {
      this.search_criterias[index].condition = 'gt';
    }
  }

  setDateValue(date: Date, criteria: FormGroup, index: number) {
    this.search_criterias[index].advance_filter_value = date;
    criteria.get('advance_filter_value').setValue(date);
  }

  searchByFilters() {
    this.checkForDatesValidity();
    if (!this.filters.valid) {
      this.filters.markAllAsTouched();
      return;
    }
    this.copyFormGroupAttributesToArray();
    this.search_criterias_backup = JSON.parse(
      JSON.stringify(this.search_criterias)
    );
    this.advanceAdvSearch = true;
    this.isSearchPanelCollapsed = true;
    this.getSearchResults();
  }

  checkForDatesValidity() {
    this.filters.controls.forEach((formGroup: FormGroup) => {
      if (
        formGroup.get('filter_type').value &&
        formGroup.get('filter_type').value.toLowerCase() ===
          this.FILTER_TYPES.DATE
      ) {
        const condition = formGroup.get('condition').value;
        const value = formGroup.get('advance_filter_value').value;
        if (condition === 'between') {
          // Date Range
          if (!this.checkIfValidDateRangeObject(value)) {
            formGroup
              .get('advance_filter_value')
              .setErrors({ inValidDateRange: true });
          } else {
            formGroup
              .get('advance_filter_value')
              .setErrors({ inValidDateRange: null });
            formGroup.get('advance_filter_value').updateValueAndValidity();
          }
        } else {
          // Date
          if (!moment(new Date(value)).isValid()) {
            formGroup
              .get('advance_filter_value')
              .setErrors({ inValidDate: true });
          } else {
            formGroup
              .get('advance_filter_value')
              .setErrors({ inValidDate: null });
            formGroup.get('advance_filter_value').updateValueAndValidity();
          }
        }
      }
    });
  }

  checkIfValidDateRangeObject(object: any) {
    return (
      object && object.selectedRange && object.selectedRange !== 'No Filter'
    );
  }

  copyFormGroupAttributesToArray() {
    this.filters.value.forEach((group, index) => {
      this.search_criterias[index].advance_filter_value =
        group.advance_filter_value;
      this.search_criterias[index].condition = group.condition;
    });
  }

  addNewCriteria() {
    const newCriteria = {
      criteria_obj: this.criteria_options[this.default_search_criteria_index],
    };
    this.search_criterias.push(newCriteria);
    const group = new FormGroup({
      criteria_obj: new FormControl(
        newCriteria.criteria_obj.filter_name,
        Validators.required
      ),
      condition: new FormControl('', Validators.required),
      advance_filter_value: new FormControl('', Validators.required),
      filter_type: new FormControl(newCriteria.criteria_obj.filter_type),
    });
    this.selectedFilter[this.search_criterias.length - 1] =
      newCriteria.criteria_obj;
    this.filters.push(group);
    this.selectDefault(group, this.search_criterias.length - 1);
    this.filters.markAsPristine();
    this.filters.markAsUntouched();
    this.filterOptions[this.search_criterias.length - 1] = {};
    this.filterOptions[this.search_criterias.length - 1].items =
      this.getFilterOptions(this.search_criterias.length - 1);
  }
  validateInput(eve) {
    if (eve.target.value.length > 16) {
      eve.preventDefault();
      eve.target.value = eve.target.value.slice(0, 16);
    }
  }

  removeCriteria(index) {
    this.search_criterias.splice(index, 1);
    this.filters.removeAt(index);
    this.filters.markAsPristine();
    this.filters.markAsUntouched();
  }

  displayFilter(criterion: any) {
    let displayedDate: string;
    let displayedFilter = '';
    switch (criterion.criteria_obj.filter_type.toLowerCase()) {
      case this.FILTER_TYPES.STRING:
        displayedFilter =
          `${criterion.criteria_obj.filter_label} : ` +
          criterion.advance_filter_value;
        break;
      case this.FILTER_TYPES.NUMBER:
        displayedFilter =
          `${criterion.criteria_obj.filter_label} : ` +
          criterion.advance_filter_value;
        break;
      case this.FILTER_TYPES.RANGE:
        displayedFilter =
          `${criterion.criteria_obj.filter_label} : ` +
          criterion.advance_filter_value;
        break;
      case this.FILTER_TYPES.DATE:
        if (criterion.condition === 'between') {
          const startDate = moment(
            criterion.advance_filter_value.startDate
          ).format('YYYY-MM-DD');
          const endDate = moment(criterion.advance_filter_value.endDate).format(
            'YYYY-MM-DD'
          );
          displayedDate = startDate + ' to ' + endDate;
        } else {
          displayedDate = moment(criterion.advance_filter_value).format(
            'YYYY-MM-DD'
          );
        }
        displayedFilter =
          `${criterion.criteria_obj.filter_label} : ` + displayedDate;
        break;
    }
    return displayedFilter;
  }

  showFilters() {
    return (
      this.search_criterias.length > 0 &&
      this.search_criterias[0].advance_filter_value != null &&
      this.isSearchPanelCollapsed
    );
  }

  removeFilterCriterion(index: any) {
    this.search_criterias.splice(index, 1);
    this.filters.removeAt(index);

    if (!this.search_criterias.length) {
      this.resetFiltersData(false);
    } else {
      this.searchByFilters();
    }
  }

  getFilterOptions(index: number): { id: string; name: string }[] {
    const selectedFilterType =
      this.selectedFilter[index].filter_type.toLowerCase();
    const filterOptions: { id: string; name: string }[] = [];

    if (selectedFilterType === FILTER_TYPES.STRING) {
      filterOptions.push({ id: 'phrase', name: 'Contains' });
    }

    if (
      selectedFilterType === FILTER_TYPES.NUMBER ||
      selectedFilterType === FILTER_TYPES.DATE
    ) {
      filterOptions.push({ id: 'gt', name: 'Greater than' });
      filterOptions.push({ id: 'lt', name: 'Smaller than' });
      if (selectedFilterType === FILTER_TYPES.DATE) {
        filterOptions.push({ id: 'between', name: 'Between' });
        filterOptions.push({ id: 'gte', name: 'Greater than Equals to' });
        filterOptions.push({ id: 'lte', name: 'Lesser than Equals to' });
      }
    } else {
      filterOptions.push({ id: 'exact', name: 'Equals' });
    }

    return filterOptions;
  }
}
