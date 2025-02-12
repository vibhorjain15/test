import { Component, Input, OnInit } from '@angular/core';
import {
  FILTER_TERNARY_OPERATORS,
  FILTER_TYPES,
} from '../../constants/constant';
import { ExportDataService } from 'src/app2/services/export-data.service';

@Component({
  selector: 'app-manage-question-selection',
  templateUrl: './manage-question-selection.component.html',
  styleUrls: ['./manage-question-selection.component.css'],
})
export class ManageQuestionSelectionModal implements OnInit {
  @Input() selectedQuestions: any[];
  @Input() responseTypes: any[];
  @Input() response: any;
  loading: boolean;
  activeTab: string;
  searchText: string;
  FILTER_TERNARY_OPERATORS = FILTER_TERNARY_OPERATORS;
  global_ternary_operator: string;
  allFilterOptions: any[] = [];
  allSearchFilterOptions: any[] = [];
  allSortFilterOptions: any[] = [];
  search_criterias: any[] = [];
  selection_list: any[] = [];
  filters_data_loaded: boolean;
  showFilters: boolean;
  showAddNewQuestion: boolean;
  filterApplied: boolean;
  processing_data: boolean;
  frequentlyUsedFilterValue: any;
  mostAnsweredFilterValue: any;
  currentSortFilterSelected: any;
  selectAll: boolean;
  filters: any;
  questions: any;
  FILTER_TYPES = FILTER_TYPES;
  currentSortFilters = [
    {
      id: 'ma-false',
      name: 'Sort by: most answered ↑ ',
    },
    {
      id: 'ma-true',
      name: 'Sort by: most answered ↓ ',
    },
    {
      id: 'fu-false',
      name: 'Sort by: frequently used ↑',
    },
    {
      id: 'fu-true',
      name: 'Sort by: frequently used ↓ ',
    },
  ];
  questionMatchingList = [
    {
      id: FILTER_TERNARY_OPERATORS.OR,
      name: 'ANY'
    },
    {
      id: FILTER_TERNARY_OPERATORS.AND,
      name: 'ALL',
    }
  ]
  constructor(private readonly ExportDataService: ExportDataService) {}

  ngOnInit(): void {
    this.activeTab = 'Question';
    this.searchText = '';
    this.global_ternary_operator = this.FILTER_TERNARY_OPERATORS.AND;
    this.processing_data = true;
    this.filters = { name: '' };
    this.frequentlyUsedFilterValue = 'not-selected';
    this.mostAnsweredFilterValue = false;
    this.currentSortFilterSelected = 'ma-false';
    this.getAllFilterOptions();
  }

  getAllFilterOptions() {
    const params = { filters: { type: 'excel' } };
    this.ExportDataService.getQuestionFilters(params).subscribe(
      (response: any) => {
        if (response.status === 200) {
          this.allFilterOptions = response.data;
          this.allSearchFilterOptions = this.allFilterOptions.filter(
            (option) => option.filter_function === 'search'
          );
          this.allSortFilterOptions = this.allFilterOptions.filter(
            (option) => option.filter_function === 'sort'
          );
          this.filters_data_loaded = true;
          let newCriteria = {};
          newCriteria = { criteria_obj: this.allSearchFilterOptions[0] };
          this.setConditionDefaultValue(newCriteria);
          this.search_criterias.push(newCriteria);
          this.searchByFilters();
        } else {
          this.allFilterOptions = response.data;
          this.filters_data_loaded = true;
          this.searchByFilters();
        }
      }
    );
  }

  searchByFilters() {
    let filter: any;
    const searchByFiltersData = [];
    for (let index = 0; index < this.search_criterias.length; index++) {
      filter = this.search_criterias[index];
      if (filter) {
        if (
          filter.hasOwnProperty('condition') &&
          filter.hasOwnProperty('advance_filter_value') &&
          filter.condition &&
          filter.advance_filter_value
        ) {
          searchByFiltersData.push(filter);
        }
      }
    }
    const params = { filters: { [this.global_ternary_operator]: [] } };
    for (filter of Array.from(searchByFiltersData)) {
      const filter_params = {
        filter_name: filter.criteria_obj.filter_name,
        filter_type: filter.criteria_obj.filter_type,
        search_type: filter.condition,
        filter_value: filter.advance_filter_value,
      };
      params.filters[this.global_ternary_operator].push(filter_params);
    }
    this.applyFiltersSearch(params);
  }

  applyFiltersSearch(filter_params: { filters: any }) {
    let nameFilterParams: any;
    if (
      (filter_params.filters.hasOwnProperty('and') ||
        filter_params.filters.hasOwnProperty('or')) &&
      filter_params.filters[this.global_ternary_operator].length === 0
    ) {
      this.filterApplied = false;
    } else {
      this.filterApplied = true;
    }
    if (this.filters.name) {
      nameFilterParams = {
        filter_name: 'question_text',
        filter_type: 'str',
        search_type: 'contains',
        filter_value: this.filters.name,
      };
      filter_params.filters[this.global_ternary_operator].push(
        nameFilterParams
      );
    }
    if (this.mostAnsweredFilterValue !== 'not-selected') {
      nameFilterParams = {
        filter_name: 'response_count_sort',
        filter_type: 'bool',
        search_type: 'exact',
        filter_value: this.mostAnsweredFilterValue,
      };
      filter_params.filters[this.global_ternary_operator].push(
        nameFilterParams
      );
    }

    if (this.frequentlyUsedFilterValue !== 'not-selected') {
      nameFilterParams = {
        filter_name: 'template_count',
        filter_type: 'bool',
        search_type: 'exact',
        filter_value: this.frequentlyUsedFilterValue,
      };
      filter_params.filters[this.global_ternary_operator].push(
        nameFilterParams
      );
    }
    this.processing_data = true;
    this.ExportDataService.getQuestionSuggestions(filter_params).subscribe(
      (response: any) => {
        this.questions = response.data;
        if (this.selectedQuestions?.length) {
          this.questions.forEach((entry: any) => {
            if (
              this.selectedQuestions.find(
                (x) => x.question_group_id === entry.question_group_id
              )
            ) {
              entry.is_selected = true;
            }
          });
        }
        this.processing_data = false;
        this.showFilters = false;
      },
      (error) => (this.processing_data = false)
    );
  }

  getResponseTypeById(id: any) {
    return this.responseTypes.find((x) => x.id === id);
  }

  formatTemplatesTooltip(entity: { templates: any }) {
    let templatesNames = entity.templates.map((x) => x.template_name);
    templatesNames = templatesNames.join(', ');
    return templatesNames;
  }

  toggleFiltersSection() {
    this.showFilters = !this.showFilters;
  }

  toggleSelectAll(select: any) {
    if (this.questions?.length) {
      this.questions.map((x) => (x.is_selected = select));
    }
  }

  selectSortCriteriaFilter(dvSelectValue: any) {
    this.currentSortFilterSelected = dvSelectValue;
    if (this.currentSortFilterSelected === 'ma-true') {
      this.mostAnsweredFilterValue = true;
      this.frequentlyUsedFilterValue = 'not-selected';
    } else if (this.currentSortFilterSelected === 'ma-false') {
      this.mostAnsweredFilterValue = false;
      this.frequentlyUsedFilterValue = 'not-selected';
    } else if (this.currentSortFilterSelected === 'fu-true') {
      this.frequentlyUsedFilterValue = true;
      this.mostAnsweredFilterValue = 'not-selected';
    } else if (this.currentSortFilterSelected === 'fu-false') {
      this.frequentlyUsedFilterValue = false;
      this.mostAnsweredFilterValue = 'not-selected';
    } else {
      this.frequentlyUsedFilterValue = 'not-selected';
      this.mostAnsweredFilterValue = 'not-selected';
    }
    this.searchByFilters();
  }

  selectCriteria(criteria: any) {
    criteria.condition = criteria.criteria_obj.search_type[0].value;
    if (criteria.advance_filter_value) {
      criteria.advance_filter_value = null;
    }
  }
  setConditionDefaultValue(criteria: any) {
    if (criteria.condition) {
      criteria.condition = criteria.condition;
    } else {
      criteria.condition = criteria.criteria_obj.search_type[0].value;
    }
    criteria.advance_filter_value = null;
  }

  setOptionsDefaultValue(criteria: any) {
    if (criteria.condition) {
      criteria.condition = criteria.condition;
    } else {
      criteria.condition = criteria.criteria_obj.search_type[0].value;
    }
  }

  addNewCriteria() {
    const newCriteria: any = {
      criteria_obj: this.allSearchFilterOptions[0],
    };
    this.search_criterias.push(newCriteria);
    this.setConditionDefaultValue(newCriteria);
  }

  removeCurrentFilter(criteria: any, index: number) {
    if (
      index < this.search_criterias.length &&
      this.search_criterias.length === 1
    ) {
      criteria.advance_filter_value = '';
    } else {
      this.search_criterias.splice(index, 1);
    }
  }

  resetFilters() {
    this.global_ternary_operator = this.FILTER_TERNARY_OPERATORS.AND;
    this.search_criterias = [];
    this.showFilters = false;
    this.filters.name = '';
    this.frequentlyUsedFilterValue = 'not-selected';
    this.mostAnsweredFilterValue = 'not-selected';
    this.addNewCriteria();
    this.searchByFilters();
  }

  setDateValue(date, criteria) {
    criteria.advance_filter_value = date;
  }

  submit(modalCallback) {
    this.response(this.questions.filter((x) => x.is_selected));
    modalCallback();
  }
}
