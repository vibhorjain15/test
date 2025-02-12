import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as moment from 'moment';
import { RouterService } from 'src/app2/services/router.service';
import {
  FILTER_TERNARY_OPERATORS,
  hierarchyConstants,
  keywordConstants,
} from 'src/app2/shared/constants/constant';
import { ManageStrategiesService } from './manage-strategies.service';
import { Select, Store } from '@ngxs/store';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import { CustomFieldsGridService } from 'src/app2/services/custom-fields-grid.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { DvGridComponent } from 'src/app2/shared/components/dv-grid/dv-grid.component';
import { UserState } from 'src/app2/store/user/user.state';
import { take } from 'rxjs/operators';
import { PanelControl } from 'src/app2/shared/components/dv-panel-heading/dv-panel-heading.component';
import { EntityUtilsService } from '../../../../utils/entity-utils.service';

@Component({
  selector: 'app-manage-strategies',
  templateUrl: './manage-strategies.component.html',
  styleUrls: ['./manage-strategies.component.css'],
})
export class ManageStrategiesComponent implements OnInit, OnDestroy {
  entity_type;
  filters_data_loaded;
  filterApplied;
  search_criterias;
  initGridSection;
  strategies: any[] = [];
  columnDefs;
  customFields: any[];
  global_ternary_operator: any;
  global_hierarchy_option: any;
  search_filters_response: any;
  isFreeInvestor: boolean;
  gridName = 'manage_strategy';
  show_bulk_actions;
  gridSelectedData;
  totalSelectedRecords: number = 0;
  is_manager: boolean;
  additionalColumns = [];
  filterData = {
    global_ternary_operator: FILTER_TERNARY_OPERATORS.AND,
    search_criterias: [],
  };
  filterInitValue = {
    global_ternary_operator: FILTER_TERNARY_OPERATORS.AND,
    search_criterias: [],
  };
  render_grid = false;
  @Select(UserState.getCurrentUserData) user;
  @ViewChild('strategiesGrid') commonGridComponent: DvGridComponent;
  panelHeadingControls: PanelControl[] = [];
  constructor(
    private readonly CustomModalFactory: CustomModalService,
    private readonly routerService: RouterService,
    private readonly http: HttpClient,
    private readonly ManageStrategiesService: ManageStrategiesService,
    private readonly store: Store,
    private readonly customFieldsGridService: CustomFieldsGridService,
    private readonly customModalService: CustomModalService,
    private readonly entityUtilsService: EntityUtilsService
  ) {}

  ngOnInit(): void {
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.isFreeInvestor = data.isInvestor && data.isFreeSubscription;
          this.is_manager = data.isManager;
          this.isFreeInvestor = data.isInvestor && data.isFreeSubscription;
          this.init();
        }
      });
  }
  ngOnDestroy(): void {
    this.entityUtilsService.responseCache = {};
  }

  init() {
    this.customFields = [];
    this.gridSelectedData = new Array<any>();
    this.entity_type = 'Strategy';
    this.getFiltersModalData();
    this.filters_data_loaded = false;
    this.filterApplied = false;
    this.global_ternary_operator = FILTER_TERNARY_OPERATORS.AND;
    this.global_hierarchy_option = hierarchyConstants.Strategy;
  }

  setPenalHeadingControls() {
    this.panelHeadingControls = [
      {
        text: '',
        handleClick: this.toggleFiltersSection.bind(this),
        iconName: 'filter',
        type: 'default',
        iconClass: this.filterApplied ? 'text-orange' : '',
        tooltip: 'Apply Filters',
      },
      {
        text: '',
        handleClick: this.resetFiltersData.bind(this),
        iconName: 'refresh',
        condition: this.filterApplied,
        type: 'default',
        tooltip: 'Clear Filters',
      },
      {
        text: `New ${this.entity_type}`,
        handleClick: this.addFund.bind(this),
        leftIcon: 'plus',
        tooltip: this.isFreeInvestor
          ? 'This feature is available for premium users.'
          : 'Add New ' + this.entity_type,
        isDisabled: this.isFreeInvestor,
      },
    ];
  }

  addFund() {
    if (!this.isFreeInvestor) {
      this.CustomModalFactory.invoke('manage-fund', {
        initialState: {
          fund_type: 'strategy',
        },
        class: 'gray modal-lg',
      });
    }
  }

  openRow(row, col) {
    if (!row.internalRow && col.field !== 'selectionRowHeaderCol') {
      this.routerService.navigateWithParams(
        'app.firms.strategies.profile.monitor',
        {
          firmId: row.entity.firm_id,
          strategyId: row.entity.id,
        }
      );
    }
  }

  getFiltersModalData() {
    this.http
      .post('service/dvapi_service/search_filters', {
        entity_type: keywordConstants.Strategy.toLowerCase(),
      })
      .subscribe((response: any) => {
        let filter, index;
        this.search_filters_response = response;
        this.search_criterias = [];
        this.filterData = {
          global_ternary_operator: this.global_ternary_operator,
          search_criterias: this.entityUtilsService.skimCustomFilterData(
            this.search_criterias
          ),
        };
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
        this.setPenalHeadingControls();
        this.loadCustomFields();
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

  getDynamicDefaultFilterOptions(filter, index) {
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

  renameUsenameToValue(obj, key) {
    obj['value'] = obj[key];
    //delete obj[key];
  }

  toggleFiltersSection() {
    this.customModalService.invoke('manage-custom-search', {
      initialState: {
        custom_filters_data: {
          global_ternary_operator: this.global_ternary_operator,
          search_filters_response: this.search_filters_response,
          search_criterias: this.search_criterias,
        },
        success: (response) => {
          this.search_criterias = response.search_criterias;
          this.global_ternary_operator = response.global_ternary_operator;
          this.filterData = {
            global_ternary_operator: this.global_ternary_operator,
            search_criterias: this.entityUtilsService.skimCustomFilterData(
              this.search_criterias
            ),
          };
          if (
            response.searchByFiltersParams &&
            Object.keys(response.searchByFiltersParams).length
          ) {
            this.filterApplied = true;
            this.applyFiltersSearch(response.searchByFiltersParams);
          } else {
            this.filterApplied = false;
            this.searchByFilters();
          }
          this.setPenalHeadingControls();
        },
      },
      class: 'modal-xl',
    });
  }

  applyFiltersSearch(filter_params) {
    filter_params.include_contacts = false;
    filter_params.search_for = this.global_hierarchy_option;
    this.initGridSection = false;
    this.strategies = [];
    this.ManageStrategiesService.getManageStrategiesRowData(
      filter_params
    ).subscribe((strategies: any) => {
      this.strategies = strategies;
      this.customFieldsGridService.mapCustomFieldResponses(
        this.strategies,
        this.customFields
      );
      this.initGridSection = true;
    });
  }

  resetFiltersData() {
    this.global_ternary_operator = FILTER_TERNARY_OPERATORS.AND;
    this.search_criterias = [];
    this.filterData = {
      global_ternary_operator: this.global_ternary_operator,
      search_criterias: this.entityUtilsService.skimCustomFilterData(
        this.search_criterias
      ),
    };
    this.filterApplied = false;
    this.searchByFilters();
    this.setPenalHeadingControls();
  }

  removeFilterCriterion(index) {
    if (index < this.search_filters_response.default_filters.length) {
      this.search_criterias[index].advance_filter_value = '';
    } else {
      this.search_criterias.splice(index, 1);
    }
    this.filterData = {
      global_ternary_operator: this.global_ternary_operator,
      search_criterias: this.entityUtilsService.skimCustomFilterData(
        this.search_criterias
      ),
    };
    this.searchByFilters();
  }

  searchByFilters() {
    let filter;
    const searchByFiltersData = [];
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
          searchByFiltersData.push(filter);
        }
      }
    }
    if (searchByFiltersData.length === 0) {
      this.filterApplied = false;
    }
    const params = {
      include_contacts: false,
      include_custom_fields: true,
      include_dates: true,
      filters: { [this.global_ternary_operator]: [] },
    };
    for (filter of searchByFiltersData) {
      const filter_params = {
        filter_key: filter.criteria_obj.filter_key,
        filter_name: filter.criteria_obj.filter_name,
        type: filter.criteria_obj.type,
        operations: filter.condition,
        filter_value: filter.advance_filter_value,
      };
      params.filters[this.global_ternary_operator].push(filter_params);
    }
    this.applyFiltersSearch(params);
  }

  displayFilter(criterion) {
    let displayedFilter = '';
    let value = '';
    if (criterion.criteria_obj.type.toLowerCase() === 'date') {
      let displayedDate;
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
        `${criterion.criteria_obj.filter_name} : ` + displayedDate;
    } else {
      for (let filter of this.search_filters_response.custom_filters) {
        if (
          filter.filter_key === criterion.criteria_obj.filter_key &&
          filter.hasOwnProperty('options')
        ) {
          for (let option of filter.options) {
            if (option.id === criterion.advance_filter_value) {
              value = option.value;
            }
          }
        }
      }
      if (value !== '') {
        displayedFilter = `${criterion.criteria_obj.filter_name} : ` + value;
      } else {
        displayedFilter =
          `${criterion.criteria_obj.filter_name} : ` +
          criterion.advance_filter_value;
      }
    }
    return displayedFilter;
  }

  loadCustomFields() {
    this.http
      .post('service/dvapi_service/get_custom_fields', {
        schema_type: 'strategy',
      })
      .subscribe((response: any) => {
        this.customFields = response.custom_fields.strategy;
        this.setColumnDefs();
        this.render_grid = true;
      });
  }

  setColumnDefs() {
    if (this.is_manager) {
      this.additionalColumns = [
        {
          colId: 'selectAll',
          field: 'selectAll',
          checkboxSelection: true,
          headerCheckboxSelection: true,
          headerCheckboxSelectionFilteredOnly: true,
          lockPosition: true,
          width: 50,
          headerClass: 'my-permission-checkbox',
          cellClass: 'my-permission-checkbox',
          suppressColumnsToolPanel: true,
          suppressMovable: true,
          resizable: false,
          suppressHeaderMenuButton: true,
          suppressAutoSize: true,
        },
      ];
    }

    this.columnDefs = this.ManageStrategiesService.getManageStrategiesColDef(
      this.customFields,
      !this.is_manager
    );

    // allowing additional columns to propagate to dv-grid
    setTimeout(() => {
      this.store.dispatch(
        new SetDefaultColumnDef({ [this.gridName]: this.columnDefs })
      );
    }, 100);
  }

  initGrid() {
    this.strategies = [];
    this.ManageStrategiesService.getManageStrategiesRowData({
      include_contacts: false,
      include_custom_fields: true,
      include_dates: true,
      filters: {},
      search_for: this.global_hierarchy_option,
    }).subscribe((strategies: any) => {
      this.strategies = strategies;
      this.customFieldsGridService.mapCustomFieldResponses(
        this.strategies,
        this.customFields
      );

      this.initGridSection = true;
    });
  }

  onRowClicked = (event) => {
    if (event?.data) {
      this.routerService.navigateWithParams(
        'app.firms.strategies.profile.monitor',
        {
          firmId: event.data.strategy.firm_id,
          strategyId: event.data.strategy.id,
        }
      );
    }
  };

  closeQuickActions() {
    this.show_bulk_actions = false;
    this.deSelectAllRows();
  }

  deSelectAllRows() {
    this.gridSelectedData = new Array<any>();
    this.totalSelectedRecords = 0;
    this.commonGridComponent.deSelectAllRows();
  }

  onSelectionChanged = (event) => {
    this.show_bulk_actions = this.gridSelectedData.length ? true : false;
    this.totalSelectedRecords = this.gridSelectedData.length;
  };

  onRowSelected = (row) => {
    if (row.data) {
      if (row.node.selected) {
        this.gridSelectedData.push(row.data.entity);
      } else {
        const index = this.gridSelectedData.findIndex(
          (x) => x.id === row.data.entity.id
        );
        if (index !== -1) {
          this.gridSelectedData.splice(index, 1);
        }
      }
    }
  };

  assignInternalContacts() {
    this.customModalService.invoke('add-internal-contacts', {
      initialState: {
        selected_entities: this.gridSelectedData.map((entity) => {
          return { id: entity.id, name: entity.name };
        }),
        entity_type: keywordConstants.Strategy,
        entities: this.strategies?.map((strategy) => {
          return { id: strategy.entity.id, name: strategy.entity.name };
        }),
        help_text:
          '<p>You can select one or more internal contacts to be assigned to the selected strategy(ies). New contacts will be added alongside any existing contacts.<br/>Tip: Check ‘Mark selected users as primary contacts’ for them to be notified of any activites related to these strategy(ies).',
        successCallback: () => {
          this.closeQuickActions();
        },
      },
      ignoreBackdropClick: true,
    });
  }

  loadView(filterData) {
    if (filterData.search_criterias)
      this.search_criterias = this.entityUtilsService.generateSearchFilter(
        filterData?.search_criterias,
        this.search_filters_response
      );
    else this.search_criterias = [];
    this.global_ternary_operator =
      filterData?.global_ternary_operator ?? FILTER_TERNARY_OPERATORS.AND;
    this.filterData = {
      global_ternary_operator: this.global_ternary_operator,
      search_criterias: this.entityUtilsService.skimCustomFilterData(
        this.search_criterias
      ),
    };
    if (this.search_criterias.length > 0) this.filterApplied = true;
    this.searchByFilters();
  }
}
