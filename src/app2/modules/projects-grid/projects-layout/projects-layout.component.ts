import { Component, OnInit, ViewChild } from '@angular/core';
import * as moment from 'moment';
import { RouterService } from 'src/app2/services/router.service';
import { UtilsService } from 'src/app2/services/utils.service';
import {
  DateRanges,
  FILTER_TERNARY_OPERATORS,
  diligenceStatusConstant,
  keywordConstants,
} from 'src/app2/shared/constants/constant';
import { ProjectsGridInvestorService } from 'src/app2/services/projects-grid-investor.service';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take } from 'rxjs/operators';
import { EntityUtilsService } from '../../../utils/entity-utils.service';
import { ChardinService } from 'src/app2/services/chardin.service';
import { ProjectsGridComponent } from './projects-grid/projects-grid.component';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { dvTabsList } from 'src/app2/shared/components/dv-tabs/dv-tabs.model';
import { CustomFieldsService } from 'src/app2/services/custom-fields.service';

export interface IPendingItems {
  key: string;
  alias: string;
  count: number;
  isSelected: boolean;
  property: string;
  rightIcon?: string;
  iconTooltip?: string;
}
@Component({
  selector: 'app-projects-layout',
  templateUrl: './projects-layout.component.html',
  styleUrls: ['./projects-layout.component.css'],
})
export class ProjectsLayoutComponent implements OnInit {
  type: string;
  is_investor: boolean;
  is_manager: boolean;
  counts_promise_deferred: any;
  counts_promise: any;
  entity_cta: any;
  current_user: any;
  filters_data_loaded: boolean;
  filterApplied: boolean;
  FILTER_TERNARY_OPERATORS = FILTER_TERNARY_OPERATORS;
  global_ternary_operator = this.FILTER_TERNARY_OPERATORS.AND;
  entity_ternary_operator = this.FILTER_TERNARY_OPERATORS.AND;
  filters: { startDate: any; endDate: any };
  showNudges: boolean;
  selectedNudge: any;
  minDate: Date;
  maxDate: Date;
  search_criterias: any[] = new Array<any>();
  loading_prefs: boolean;
  customDateFilter: any;
  is_loading: boolean;
  no_dds: boolean;
  due_diligence_counts: Array<dvTabsList> = [];
  keywordConstants = keywordConstants;
  search_filters_response: any;
  processing_data: boolean;
  loading: boolean;
  filters_final: any = null;
  subscription: any;
  filterData = {
    global_ternary_operator: FILTER_TERNARY_OPERATORS.AND,
    search_criterias: [],
    pendingItems: [],
    dateRange: {},
  };
  filterInitValue = {
    global_ternary_operator: FILTER_TERNARY_OPERATORS.AND,
    search_criterias: [],
    pendingItems: [],
    dateRange: {},
  };
  @Select(UserState.getCurrentUserData) user;
  @Select(UserState.getSubscriptionLimitsData) subscriptionLimits;
  @Select(UserState.getFirmPreferenceData) firmPref;
  dateRange: any;
  @ViewChild('grid') projectsGridComponent: ProjectsGridComponent;
  @ViewChild('dropdown') filterDropdown: any;
  showPendingItemsFilter: boolean;
  isDropdownOpen: boolean;
  pendingItems: IPendingItems[];
  pendingItemsSelectedCount: number = 0;
  totalPendingItems: number = 0;
  gridServiceData: any[];
  defaultDateRange;
  dateMap = {
    1: DateRanges[0].value,
    3: DateRanges[1].value,
    6: DateRanges[2].value,
    12: DateRanges[3].value,
    null: DateRanges[4].value,
  };
  customFields;
  constructor(
    private readonly Utils: UtilsService,
    private readonly routerService: RouterService,
    private readonly projectsGridInvestorService: ProjectsGridInvestorService,
    private readonly entityUtilsService: EntityUtilsService,
    private readonly chardinService: ChardinService,
    private readonly customModal: CustomModalService,
    private readonly customFieldsService: CustomFieldsService
  ) {}

  ngOnInit(): void {
    this.is_loading = true;
    this.type = this.routerService.getState().params?.type?.toLowerCase();
    if (
      !['all', 'my projects', 'in-progress', 'closed', 'sent'].includes(
        this.type
      )
    ) {
      this.routerService.navigateWithParams('app.diligence.projects.activity', {
        type: 'in-progress',
      });
      this.type = 'in-progress';
    }
    this.filters = {
      startDate: null,
      endDate: null,
    };

    this.subscriptionLimits.pipe(take(2)).subscribe((limits) => {
      if (limits?.length) {
        this.entity_cta = this.Utils.getEntityCTA(limits[0]);
      }
    });

    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.current_user = data;
          this.is_investor = data.isInvestor;
          this.is_manager = data.isManager;
          this.init();
          this.initPendingItems();
        }
      });
    this.minDate = moment().subtract(5, 'years').toDate();
    this.maxDate = new Date();
    this.subscribeToMethodCall();
  }

  async init() {
    const dueDiligenceCustomFields: any = await this.loadCustomFields();
    this.customFields = dueDiligenceCustomFields || [];
    this.getFirmPref();
  }

  loadCustomFields() {
    return new Promise((resolve, reject) => {
      this.customFieldsService
        .getCustomFields({
          schema_type: 'duediligence',
        })
        .subscribe(
          (response: any) => {
            const fields = response.custom_fields.duediligence;
            resolve(fields);
          },
          (e) => {
            reject(false);
          }
        );
    });
  }

  initPendingItems() {
    this.pendingItems = [
      {
        key: 'sent_followups',
        alias: 'Awaiting Follow-up Responses',
        count: 0,
        isSelected: false,
        property: 'last_sent_followup_timestamp',
      },
      {
        key: 'received_followups',
        alias: 'Received Follow-ups',
        count: 0,
        isSelected: false,
        property: 'last_received_followup_timestamp',
        rightIcon: 'info',
        iconTooltip: `Filter for projects containing new and unreplied follow-up messages from ${
          this.is_investor ? 'responders' : 'requestors'
        }.`,
      },
      {
        key: 'external_resolved_followups',
        alias: 'Externally Resolved Follow-ups',
        count: 0,
        isSelected: false,
        property: 'last_external_resolved_followup_timestamp',
      },
      {
        key: 'internal_resolved_followups',
        alias: 'Internally Resolved Follow-ups',
        count: 0,
        isSelected: false,
        property: 'last_internal_resolved_followup_timestamp',
      },
    ];
    if (this.is_investor) {
      this.pendingItems.push({
        key: 'responses_with_revisions',
        alias: 'Responses With Revisions',
        count: 0,
        isSelected: false,
        property: 'response_with_revisions_latest_timestamp',
      });
    }
    this.resetPendingItemsFilter();
    this.filterData = {
      ...this.filterData,
      pendingItems: JSON.parse(JSON.stringify(this.pendingItems)),
    };

    this.filterInitValue = {
      ...this.filterInitValue,
      pendingItems: JSON.parse(JSON.stringify(this.pendingItems)),
    };
  }

  subscribeToMethodCall() {
    this.subscription =
      this.projectsGridInvestorService.fetchCountsMethodCalled$.subscribe(
        () => {
          this.fetchCounts();
        }
      );
  }

  getDateObject() {
    let dateObj;
    if (this.dateRange?.range) {
      dateObj = {
        range: parseInt(this.dateRange.range),
      };
    } else if (this.dateRange?.startDate && this.dateRange?.endDate) {
      dateObj = {
        startDate: this.dateRange?.startDate,
        endDate: this.dateRange?.endDate,
      };
    } else {
      dateObj = null;
    }
    return dateObj;
  }

  onDateRangeChange(event) {
    if (event && event.startDate && event.endDate) {
      this.dateRange = {
        startDate: event.startDate,
        endDate: event.endDate,
        range: event.range,
      };
      this.fetchCounts();
      this.filters.startDate = event.startDate;
      this.filters.endDate = event.endDate;
      this.filterData = {
        ...this.filterData,
        dateRange: this.getDateObject(),
      };
      this.searchByFilters();
    }
  }

  onClearDateFilter() {
    setTimeout(() => {
      this.dateRange = null;
      this.fetchCounts();
      this.filters.startDate = null;
      this.filters.endDate = null;
      this.filterData = {
        ...this.filterData,
        dateRange: this.dateRange,
      };
      this.searchByFilters();
    });
  }

  getFirmPref() {
    this.loading_prefs = true;
    this.firmPref.pipe(take(1)).subscribe((response) => {
      if (response) {
        this.defaultDateRange = response;
        this.getFiltersModalData();
        this.fetchCounts();
      }
    });
  }

  fetchCounts() {
    const params: any = {};
    params.start_date = this.dateRange ? this.dateRange.startDate : null;
    params.end_date = this.dateRange ? this.dateRange.endDate : null;
    this.projectsGridInvestorService
      .getDiligenceCounts(params)
      .subscribe((response: any) => {
        this.no_dds = !response.has_projects;
        this.parseCounts(response.counts);
        this.is_loading = false;
        this.showNudges = false;
      });
  }

  parseCounts(counts: Array<any>): void {
    this.due_diligence_counts = counts.map((item: any) => {
      const type = item.id.toLowerCase();
      let tabLabel = `<span class="align-middle">${item.id} </span>`;
      if (item.new_counts > 0) {
        tabLabel = tabLabel.concat(
          `<span class="align-middle label label-info-light inline-block">
            <small class='project-status-label'>${item.new_counts} New</small>
          </span>`
        );
      }

      return {
        name: tabLabel,
        link: type,
        active: this.type === type,
        condition: true,
      };
    });
  }

  handleTabChange(index: number): void {
    this.switchTabs(this.due_diligence_counts[index].link);
  }

  showInviteDDHelp() {
    const config = {
      reveal_menubar: true,
      intros: [
        {
          target: '.js-menu-new-action',
          intro:
            'Hover & click "' +
            this.entity_cta +
            '" to create a new diligence / survey request',
          visible_elements: '.js-navbar-default',
        },
      ],
    };
    this.chardinService.show(config);
  }

  getFiltersModalData() {
    const params = {
      entity_type: this.keywordConstants.Project.toLowerCase(),
      type: this.type,
    };
    this.projectsGridInvestorService
      .getSearchFilters(params)
      .subscribe((response: any) => {
        let filter: any, index: number;
        this.search_filters_response = response;
        this.search_criterias = [];
        this.filters_data_loaded = true;
        for (
          index = 0;
          index < this.search_filters_response.default_filters.length;
          index++
        ) {
          filter = this.search_filters_response.default_filters[index];
          if (filter.hasOwnProperty('endpoint')) {
            this.getDynamicDefaultFilterOptions(filter, index);
          }
        }
        for (
          index = 0;
          index < this.search_filters_response.custom_filters.length;
          index++
        ) {
          filter = this.search_filters_response.custom_filters[index];
          if (filter.hasOwnProperty('endpoint')) {
            this.getDynamicCustomFilterOptions(filter, index);
          }
        }
        this.filterData = {
          ...this.filterData,
          global_ternary_operator: this.global_ternary_operator,
          search_criterias: this.skimCustomFilterData(this.search_criterias),
        };
      });
  }

  getDynamicCustomFilterOptions(filter, index) {
    this.entityUtilsService
      .getDynamicDefaultFilterOptions(filter)
      ?.subscribe((response) => {
        this.search_filters_response.custom_filters[index].options = response;
        this.search_filters_response.custom_filters[index].options.map(
          (option) =>
            this.renameUsenameToValue(
              option,
              this.search_filters_response.custom_filters[index]
                .display_attribute
            )
        );
      });
  }

  getDynamicDefaultFilterOptions(filter: any, index: any) {
    this.entityUtilsService
      .getDynamicDefaultFilterOptions(filter)
      ?.subscribe((response) => {
        this.search_filters_response.custom_filters[index].options = response;
        this.search_filters_response.custom_filters[index].options.map(
          (option) =>
            this.renameUsenameToValue(
              option,
              this.search_filters_response.custom_filters[index]
                .display_attribute
            )
        );
      });
  }

  renameUsenameToValue(obj: any, key: any) {
    obj['value'] = obj[key];
  }

  toggleFiltersSection() {
    this.customModal.invoke('project-search', {
      initialState: {
        customFiltersData: {
          global_ternary_operator: this.global_ternary_operator,
          entity_ternary_operator: this.entity_ternary_operator,
          search_filters_response: this.search_filters_response,
          search_criterias: this.search_criterias,
        },
        success: (response) => {
          this.search_criterias = response.search_criterias;
          this.global_ternary_operator = response.global_ternary_operator;
          this.entity_ternary_operator = response.entity_ternary_operator;
          this.filterData = {
            ...this.filterData,
            global_ternary_operator: this.global_ternary_operator,
            search_criterias: this.skimCustomFilterData(this.search_criterias),
          };
          if (
            response.searchByFiltersParams &&
            (response.searchByFiltersParams?.filters[
              this.global_ternary_operator
            ].length ||
              response.searchByFiltersParams?.advance_filters)
          ) {
            this.filterApplied = true;
            this.applyFiltersSearch(response.searchByFiltersParams);
          } else {
            this.resetFiltersData();
          }
        },
      },
      class: 'gray modal-lg',
    });
  }

  applyFiltersSearch(filter_params: any) {
    filter_params.include_custom_fields = true;
    filter_params.start_date = this.dateRange ? this.dateRange.startDate : null;
    filter_params.end_date = this.dateRange ? this.dateRange.endDate : null;
    this.processing_data = true;
    filter_params.type = this.type;
    this.filters_final = filter_params; // NEW
  }

  resetFiltersData() {
    this.global_ternary_operator = this.FILTER_TERNARY_OPERATORS.AND;
    this.search_criterias = [];
    this.filterData = {
      ...this.filterData,
      global_ternary_operator: this.global_ternary_operator,
      search_criterias: this.skimCustomFilterData(this.search_criterias),
    };
    this.filterApplied = false;
    this.searchByFilters();
  }

  removeFilterCriterion(index: number) {
    if (index > -1) this.search_criterias.splice(index, 1);
    this.filterData = {
      ...this.filterData,
      global_ternary_operator: this.global_ternary_operator,
      search_criterias: this.skimCustomFilterData(this.search_criterias),
    };
    this.searchByFilters();
  }

  searchByFilters() {
    let filter: any;
    const searchByFiltersData = [];
    let isEntityFilter = '';
    for (let index = 0; index < this.search_criterias.length; index++) {
      filter = this.search_criterias[index];
      if (filter) {
        if (
          filter.hasOwnProperty('condition') &&
          filter.hasOwnProperty('advance_filter_value') &&
          filter.condition !== null &&
          filter.advance_filter_value !== null &&
          filter.advance_filter_value !== '' &&
          filter.advance_filter_value !== undefined
        ) {
          if (filter.criteria_obj.response_type !== 'duediligence') {
            this.entity_ternary_operator = filter.criteria_obj.operator;
            isEntityFilter = filter.criteria_obj.response_type;
          } else {
            this.global_ternary_operator = filter.criteria_obj.operator;
          }
          searchByFiltersData.push(filter);
        }
      }
    }
    if (searchByFiltersData.length === 0) {
      this.filterApplied = false;
    }
    const params: any = {
      include_custom_fields: true,
      filters: {
        [this.global_ternary_operator]: [],
      },
    };
    if (isEntityFilter) {
      params.advance_filter_condition = 'and';
      params.advance_filters = {
        [isEntityFilter]: {
          [this.entity_ternary_operator]: [],
        },
      };
    }
    for (filter of Array.from(searchByFiltersData)) {
      const filter_params = {
        filter_key: filter.criteria_obj.filter_key,
        filter_name: filter.criteria_obj.filter_name,
        type: filter.criteria_obj.type,
        operations: filter.condition,
        filter_value: filter.advance_filter_value,
      };
      if (
        filter.criteria_obj.response_type !== 'duediligence' &&
        params?.advance_filters
      ) {
        params.advance_filters[filter.criteria_obj.response_type][
          this.entity_ternary_operator
        ].push(filter_params);
      } else params.filters[this.global_ternary_operator].push(filter_params);
    }
    this.applyFiltersSearch(params);
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  areBulkActionsShown() {
    return !!this.projectsGridComponent?.show_bulk_actions;
  }

  switchTabs(newType: string) {
    this.type = newType;
    // this.search_criterias = [];
    // this.getFiltersModalData();
    // this.filters_data_loaded = false;
    // this.filterApplied = false;
    // this.global_ternary_operator = this.FILTER_TERNARY_OPERATORS.AND;
    // this.filterData = {
    //   global_ternary_operator: this.global_ternary_operator,
    //   search_criterias: this.skimCustomFilterData(this.search_criterias),
    // };
    // this.filters = {
    //   startDate: null,
    //   endDate: null,
    // };
    // change type in the url
    this.routerService.navigateWithParams(
      `app.diligence.projects.activity`,
      {
        type: this.type,
      },
      { reload: true }
    );
  }

  loadView(filterData) {
    let dateFilter = this.Utils.getPredefinedDateRanges(
      this.defaultDateRange.default_daterange_months
    );
    if (
      !filterData.hasOwnProperty('dateRange') ||
      (filterData.dateRange && Object.keys(filterData.dateRange).length == 0)
    ) {
      if (this.defaultDateRange.default_daterange_months) {
        this.dateRange = {
          startDate: this.Utils.formatDatetime(dateFilter.startDate),
          endDate: this.Utils.formatDatetime(dateFilter.endDate),
          range: this.defaultDateRange?.default_daterange_months ?? 'null',
        };
      } else {
        this.dateRange = null;
      }
    } else {
      if (filterData.dateRange?.range) {
        this.dateRange = this.dateMap[filterData.dateRange.range];
        this.dateRange = {
          startDate: this.Utils.getFromDateTimeFormatted(this.dateRange[0]),
          endDate: this.Utils.getToDateTimeFormatted(this.dateRange[1]),
          range: filterData.dateRange.range,
        };
      } else if (
        filterData.dateRange?.startDate &&
        filterData.dateRange?.endDate
      ) {
        this.dateRange = {
          startDate: this.Utils.getFromDateTimeFormatted(
            filterData.dateRange.startDate
          ),
          endDate: this.Utils.getToDateTimeFormatted(
            filterData.dateRange.endDate
          ),
        };
      } else {
        this.dateRange = null;
      }
    }
    this.customDateFilter = dateFilter;
    if (filterData.pendingItems) {
      this.pendingItems = filterData?.pendingItems;
      this.pendingItemsSelectedCount = this.pendingItems.filter(
        (x) => x.isSelected
      ).length;
    } else {
      this.removeAllPendingItemsFilters();
    }
    if (filterData.search_criterias) {
      this.search_criterias =
        filterData?.search_criterias.length > 0
          ? filterData?.search_criterias.map((filterItem) => {
              let obj: any = {
                advance_filter_value: filterItem.advance_filter_value,
                condition: filterItem.condition,
                criteria_obj: {
                  type: filterItem.type,
                  response_type: filterItem.response_type,
                  filter_key: filterItem.filter_key,
                  filter_name: filterItem.filter_name,
                  filter_value: filterItem.advance_filter_value,
                  operator: filterItem.operator,
                  filter_category: filterItem.filter_category,
                  operations: [
                    {
                      label: filterItem.condition,
                      value: filterItem.condition,
                    },
                  ],
                },
              };

              if ('options' in filterItem) {
                obj.criteria_obj.options = filterItem.options;
              }
              return obj;
            })
          : [];
    } else {
      this.search_criterias = [];
    }
    this.global_ternary_operator =
      filterData?.global_ternary_operator ?? this.FILTER_TERNARY_OPERATORS.AND;
    this.filterData = {
      ...this.filterData,
      global_ternary_operator: this.global_ternary_operator,
      search_criterias: this.skimCustomFilterData(this.search_criterias),
      dateRange: this.getDateObject(),
      pendingItems: JSON.parse(JSON.stringify(this.pendingItems)),
    };

    this.filterInitValue = {
      ...this.filterInitValue,
      dateRange: this.getDateObject(),
      pendingItems: JSON.parse(JSON.stringify(this.pendingItems)),
    };

    if (this.search_criterias.length > 0) this.filterApplied = true;
    this.searchByFilters();
  }

  skimCustomFilterData(filterData) {
    let customFilter = [];
    filterData.forEach((filterItem) => {
      if (filterItem.advance_filter_value) {
        let displayValue = filterItem.advance_filter_value;
        if (filterItem.criteria_obj.hasOwnProperty('options')) {
          displayValue = filterItem.criteria_obj.options.find(
            (val) => val.id == filterItem.advance_filter_value
          ).value;
        }

        if (filterItem.criteria_obj.type.toLowerCase() === 'date') {
          let displayedDate;
          if (filterItem.condition === 'between') {
            const startDate = moment(
              filterItem.advance_filter_value.startDate
            ).format('YYYY-MM-DD');
            const endDate = moment(
              filterItem.advance_filter_value.endDate
            ).format('YYYY-MM-DD');
            displayedDate = startDate + ' to ' + endDate;
          } else {
            displayedDate = moment(filterItem.advance_filter_value).format(
              'YYYY-MM-DD'
            );
            filterItem.advance_filter_value = displayedDate + ' 23:59:59';
          }
          displayValue = displayedDate;
        }
        customFilter.push({
          advance_filter_value: filterItem.advance_filter_value,
          condition: filterItem.condition,
          filter_key: filterItem.criteria_obj.filter_key,
          filter_name: filterItem.criteria_obj.filter_name,
          filter_value: filterItem.advance_filter_value,
          operations: filterItem.condition,
          type: filterItem.criteria_obj.type,
          response_type: filterItem.criteria_obj.response_type,
          filter_category: filterItem.criteria_obj.filter_category,
          displayValue: displayValue,
          operator: filterItem.criteria_obj.operator,
          options: filterItem.criteria_obj?.options?.filter(
            (val) => val.id == filterItem.advance_filter_value
          ),
        });
      }
    });
    return customFilter;
  }

  resetPendingItemsFilter() {
    this.pendingItems.forEach((x) => {
      x.count = 0;
      x.isSelected = false;
    });
    this.pendingItemsSelectedCount = 0;
    this.totalPendingItems = 0;
    this.showPendingItemsFilter = [
      'all',
      'my projects',
      'in-progress',
    ].includes(this.type);
  }

  onPendingItemsFilterChange(value: boolean, item: IPendingItems) {
    item.isSelected = value;
    this.pendingItemsSelectedCount = this.pendingItems.filter(
      (x) => x.isSelected
    ).length;
    this.filterGridData();
    this.filterData = {
      ...this.filterData,
      pendingItems: JSON.parse(JSON.stringify(this.pendingItems)),
    };
  }

  filterGridData() {
    let filteredData = [];
    if (!this.pendingItemsSelectedCount) {
      filteredData = [...this.gridServiceData];
    } else {
      this.pendingItems.forEach((filter) => {
        if (filter.isSelected && filter.count) {
          filteredData.push(
            ...this.gridServiceData.filter((x) => !!x[filter.property])
          );
        }
      });
      // remove duplicates if any
      filteredData = [...new Map(filteredData.map((x) => [x.id, x])).values()];
      // exclude these statuses
      filteredData = filteredData.filter(
        (diligence) =>
          ![
            diligenceStatusConstant.NotApproved,
            diligenceStatusConstant.Deleted,
            diligenceStatusConstant.Withdrawn,
            diligenceStatusConstant.Approved,
          ].includes(diligence.status)
      );
      filteredData = this.sortFilteredData(filteredData);
    }
    this.projectsGridComponent.gridData = [...filteredData];
    this.projectsGridComponent.clearQuickActions();
  }

  sortFilteredData(filteredData) {
    // get latest(max) value from all the pending item timestamps for every row based on the selected filters
    // ex. if two filters are selected, max timestamp is the latest one from those two actions for that row
    const selectedProperties = this.pendingItems
      .filter((filter) => filter.isSelected)
      .map((filter) => filter.property);
    let applicableTimestamps = [];

    filteredData.forEach((data) => {
      applicableTimestamps = [];
      selectedProperties.forEach((property: string) => {
        applicableTimestamps.push(new Date(data[property]));
      });
      data.max_pending_timestamp = Math.max(
        ...applicableTimestamps.map((date) => date.getTime())
      );
    });

    // now that we have got max timestamp for each row, sort by that timestamp
    return this.Utils.sortByDate(filteredData, 'max_pending_timestamp');
  }

  removeAllPendingItemsFilters() {
    if (!this.pendingItemsSelectedCount) {
      return;
    }
    this.pendingItems.map((x) => (x.isSelected = false));
    this.pendingItemsSelectedCount = 0;
    this.projectsGridComponent.gridData = [...this.gridServiceData];
    this.filterDropdown.hide();
    this.isDropdownOpen = false;
    this.filterData = {
      ...this.filterData,
      pendingItems: this.pendingItems,
    };
  }

  onProjectsDataChanged(gridData: any[]) {
    if (this.showPendingItemsFilter) {
      this.gridServiceData = [...gridData];
      this.totalPendingItems = 0;
      this.pendingItems.forEach((filter) => {
        filter.count = this.gridServiceData.filter(
          (diligence) =>
            !!diligence[filter.property] &&
            ![
              diligenceStatusConstant.NotApproved,
              diligenceStatusConstant.Deleted,
              diligenceStatusConstant.Withdrawn,
              diligenceStatusConstant.Approved,
            ].includes(diligence.status)
        ).length;
        this.totalPendingItems += filter.count;
      });
      if (this.pendingItemsSelectedCount) {
        this.filterGridData();
      }
      this.filterData = {
        ...this.filterData,
        pendingItems: JSON.parse(JSON.stringify(this.pendingItems)),
      };

      let pendingItems = JSON.parse(JSON.stringify(this.pendingItems));
      pendingItems.map((x) => (x.isSelected = false));
      this.filterInitValue = {
        ...this.filterInitValue,
        pendingItems: pendingItems,
      };
    }
  }
}
