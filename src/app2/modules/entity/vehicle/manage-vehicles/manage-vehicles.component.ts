import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as moment from 'moment';
import { ColDef } from 'ag-grid-community';
import { RouterService } from 'src/app2/services/router.service';
import { UtilsService } from 'src/app2/services/utils.service';
import {
  FILTER_TERNARY_OPERATORS,
  keywordConstants,
} from 'src/app2/shared/constants/constant';
import { ManageVehiclesService } from './manage-vehicles.service';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import { CustomFieldsGridService } from 'src/app2/services/custom-fields-grid.service';
import { Select, Store } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take } from 'rxjs/operators';
import { EntityUtilsService } from '../../../../utils/entity-utils.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { PanelControl } from 'src/app2/shared/components/dv-panel-heading/dv-panel-heading.component';

@Component({
  selector: 'app-manage-vehicles',
  templateUrl: './manage-vehicles.component.html',
  styleUrls: ['./manage-vehicles.component.css'],
})
export class ManageVehiclesComponent implements OnInit, OnDestroy {
  isFreeInvestor;
  filters_data_loaded;
  filterApplied;
  search_criterias;
  vehicles: any = [];
  initGridSection;
  customFields: any[];
  is_admin: any;
  is_freeSubscription: boolean;
  entity_type: string;
  global_ternary_operator: string;
  search_filters_response: any;
  columnDefs;
  gridName = 'manage_vehicle';
  filterData = {
    global_ternary_operator: FILTER_TERNARY_OPERATORS.AND,
    search_criterias: [],
  };
  filterInitValue = {
    global_ternary_operator: FILTER_TERNARY_OPERATORS.AND,
    search_criterias: [],
  };
  render_grid = false;
  isInvestor;
  @Select(UserState.getCurrentUserData) user;
  @Select(UserState.getSubscriptionLimitsData) subscriptionLimits;
  panelHeadingControls: PanelControl[] = [];
  constructor(
    private readonly Utils: UtilsService,
    private readonly CustomModalFactory: CustomModalService,
    private readonly routerService: RouterService,
    private readonly http: HttpClient,
    private readonly manageVehiclesService: ManageVehiclesService,
    private readonly store: Store,
    private readonly customFieldsGridService: CustomFieldsGridService,
    private readonly entityUtilsService: EntityUtilsService,
    private readonly customModalService: CustomModalService
  ) {}

  ngOnInit(): void {
    this.customFields = [];
    this.initGridSection = false;
    this.filters_data_loaded = false;
    this.global_ternary_operator = FILTER_TERNARY_OPERATORS.AND;
    this.filterApplied = false;
    this.subscriptionLimits.pipe(take(2)).subscribe((limits) => {
      if (limits?.length) {
        this.entity_type = this.Utils.getEntityType(limits[0]);
      }
    });
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.is_admin = data.isAdmin;
          this.is_freeSubscription = data.isFreeSubscription;
          this.isFreeInvestor = data.isFreeInvestor;
          this.isInvestor = data.isInvestor;
          this.getFiltersModalData();
        }
      });
  }

  ngOnDestroy(): void {
    this.entityUtilsService.responseCache = {};
  }

  refreshVehicles() {
    this.initGridSection = false;
    this.initGridSection = true;
  }

  openNewVehicleDialog() {
    if (!this.isFreeInvestor) {
      this.CustomModalFactory.invoke('manage-vehicle', {
        initialState: {
          source: {
            text: 'monitor',
          },
        },
        class: 'gray modal-lg',
      });
    }
  }

  onRowClicked = (event) => {
    if (event?.data) {
      this.openRow(event.data);
    }
  };

  openRow(data) {
    const url = this.is_freeSubscription
      ? 'app.firms.funds.vehicles.profile.aum_tr'
      : 'app.firms.funds.vehicles.profile.monitor';
    this.routerService.navigateWithParams(url, {
      firmId: data.entity.firm_id,
      fundId: data.entity.fund_id,
      vehicleId: data.entity.id,
    });
  }

  getFiltersModalData() {
    this.http
      .post('service/dvapi_service/search_filters', {
        entity_type: keywordConstants.Vehicle.toLowerCase(),
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
        handleClick: this.openNewVehicleDialog.bind(this),
        leftIcon: 'plus',
        tooltip: this.isFreeInvestor
          ? 'This feature is available for premium users.'
          : 'Add New ' + this.entity_type,
        isDisabled: this.isFreeInvestor,
      },
    ];
  }

  getDynamicCustomFilterOptions(filter, index) {
    const entityService =
      this.entityUtilsService.getDynamicDefaultFilterOptions(filter);
    if (entityService) {
      entityService.subscribe((options: Array<any>) => {
        this.search_filters_response.custom_filters[index].options = options;
        this.search_filters_response.custom_filters[index].options.map(
          (option: any) =>
            this.renameUsenameToValue(
              option,
              this.search_filters_response.custom_filters[index]
                .display_attribute
            )
        );
      });
    }

    // this.http[filter.method.toLowerCase()](
    //   path,
    //   filter.request_params
    // ).subscribe((response: any) => {
    //   this.search_filters_response.custom_filters[index].options =
    //     filter.method.toLowerCase() == 'get' ? response : response.data;
    //   response;
    //   this.search_filters_response.custom_filters[index].options.map(
    //     (option: any) =>
    //       this.renameUsenameToValue(
    //         option,
    //         this.search_filters_response.custom_filters[index].display_attribute
    //       )
    //   );
    // });
  }

  getDynamicDefaultFilterOptions(filter, index) {
    this.http.get(filter.endpoint).subscribe((response: any) => {
      this.search_filters_response.default_filters[index].options =
        response.data;
      this.search_filters_response.default_filters[index].options.map(
        (option) =>
          this.renameUsenameToValue(
            option,
            this.search_filters_response.default_filters[index]
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
    this.initGridSection = false;
    this.vehicles = [];
    this.manageVehiclesService
      .getManageVehiclesRowData(filter_params)
      .subscribe((vehicles) => {
        this.vehicles = vehicles;
        this.customFieldsGridService.mapCustomFieldResponses(
          this.vehicles,
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
      include_contacts: true,
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
      let displayedDate: string;
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
              ({ value } = option);
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
        schema_type: 'vehicle',
      })
      .subscribe((response: any) => {
        this.customFields = response.custom_fields.vehicle;
        this.setColumnDefs();
        this.render_grid = true;
      });
  }

  setColumnDefs() {
    this.columnDefs = this.manageVehiclesService.getManageVehiclesColDef(
      this.customFields,
      this.isInvestor
    );
    const vehicleNameColDef = this.columnDefs.find(
      (colDef: ColDef) => colDef.colId === 'vehicle_name'
    );
    vehicleNameColDef.cellRendererParams.isFreeSubscription =
      this.is_freeSubscription;
    this.store.dispatch(
      new SetDefaultColumnDef({ [this.gridName]: this.columnDefs })
    );
  }

  initGrid() {
    this.initGridSection = false;
    this.vehicles = [];
    this.manageVehiclesService
      .getManageVehiclesRowData({
        include_contacts: false,
        include_custom_fields: true,
        include_dates: true,
        filters: {},
      })
      .subscribe((vehicles) => {
        this.vehicles = vehicles;
        this.customFieldsGridService.mapCustomFieldResponses(
          this.vehicles,
          this.customFields
        );
        this.initGridSection = true;
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
