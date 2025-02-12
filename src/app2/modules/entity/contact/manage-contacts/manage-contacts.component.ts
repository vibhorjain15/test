import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as moment from 'moment';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { RouterService } from 'src/app2/services/router.service';
import {
  FILTER_TERNARY_OPERATORS,
  keywordConstants,
  platformLabels,
} from 'src/app2/shared/constants/constant';
import { ManageContactsService } from './manage-contacts.service';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import { CustomFieldsGridService } from 'src/app2/services/custom-fields-grid.service';
import { Select, Store } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take } from 'rxjs/operators';
import { EntityUtilsService } from '../../../../utils/entity-utils.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { PanelControl } from 'src/app2/shared/components/dv-panel-heading/dv-panel-heading.component';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';

@Component({
  selector: 'app-manage-contacts',
  templateUrl: './manage-contacts.component.html',
  styleUrls: ['./manage-contacts.component.css'],
})
export class ManageContactsComponent implements OnInit, OnDestroy {
  filters_data_loaded;
  filterApplied;
  search_criterias;
  initGridSection;
  contacts: any[] = [];
  columnDefs;
  isInvestor: boolean;
  isFreeSubscription: boolean;
  isFreeManager: boolean;
  customFields: any[];
  global_ternary_operator: string;
  search_filters_response: any;
  gridName = 'contacts';
  contactLabel = '';
  platformLabels = platformLabels;
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
  panelHeadingControls: PanelControl[] = [];

  constructor(
    private readonly customModalService: CustomModalService,
    private readonly BaseDataService: BaseDataService,
    private readonly routerService: RouterService,
    private readonly http: HttpClient,
    private readonly manageContactsService: ManageContactsService,
    private readonly store: Store,
    private readonly CustomModalFactory: CustomModalService,
    private readonly customFieldsGridService: CustomFieldsGridService,
    private readonly entityUtilsService: EntityUtilsService,
    private readonly sweetAlert: SweetAlertService
  ) {}

  ngOnInit(): void {
    this.customFields = [];
    this.filters_data_loaded = false;
    this.filterApplied = false;
    this.global_ternary_operator = FILTER_TERNARY_OPERATORS.AND;
    this.user.pipe(take(1)).subscribe((data) => {
      if (data) {
        this.isInvestor = data.isInvestor;
        this.contactLabel = this.isInvestor
          ? platformLabels.MANAGER
          : platformLabels.INVESTOR;
        this.isFreeSubscription = data.isFreeSubscription;
        this.isFreeManager = data.isManager && this.isFreeSubscription;
        this.getFiltersModalData();
      }
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
        condition: this.filters_data_loaded,
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
        text: `New ${this.isInvestor ? 'Responder' : 'Requestor'} Contact`,
        handleClick: this.addContact.bind(this),
        leftIcon: 'plus',
        condition: !this.isFreeManager,
        tooltip: this.isFreeSubscription
          ? 'This feature is available for premium users.'
          : this.isInvestor
          ? 'Add new responder contact'
          : 'Add new requestor contact',
        isDisabled: this.isFreeSubscription,
      },
      {
        text: '',
        handleClick: this.gotoPremium.bind(this),
        condition: this.isFreeManager,
        tooltip: 'This feature is available for premium users. Learn more',
        class: `route-link-disabled`,
        iconName: 'plus',
        type: 'default',
      },
    ];
  }

  ngOnDestroy(): void {
    this.entityUtilsService.responseCache = {};
  }

  addContact() {
    if (!this.isFreeSubscription) {
      this.CustomModalFactory.invoke('manage-contact', {
        initialState: {},
        class: 'gray modal-lg',
      });
    } else {
      if (this.isFreeManager) this.sweetAlert.premiumAlert();
    }
  }

  generatePageUrl(entity) {
    let pageUrl = '';
    if (entity.associated_funds.length === 0) {
      pageUrl = `app/firms/${entity.firmId}/contacts/${entity.id}`;
    } else if (entity.associated_funds.length >= 0) {
      entity.associated_funds.forEach((fund, index) => {
        pageUrl += `app/firms/${entity.firmId}/funds/${fund}/contacts/${entity.id}`;
        if (index !== entity.associated_funds.length - 1) {
          pageUrl += ',';
        }
      });
    }
    return pageUrl;
  }

  onRowClicked = (event) => {
    if (event?.data) {
      this.openRow(event.data);
    }
  };

  openRow(data) {
    const pageUrl = this.generatePageUrl(data.entity);
    this.BaseDataService.setContactPageUrl(pageUrl);
    this.routerService.navigateWithParams('app.contacts', {
      Id: data.entity.id,
    });
  }

  getFiltersModalData() {
    this.http
      .post('service/dvapi_service/search_filters', {
        entity_type: keywordConstants.Contact.toLowerCase(),
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
    const resource_params = {
      options: filter_params,
      dynamic_grids_options: this.customFields,
    };
    // TODO: Call Grid Service API
    // this.$scope.vm.DvGridController.fetchRecords(filter_params);
    this.initGridSection = false;
    this.contacts = [];
    this.manageContactsService
      .getManageContactsRowData(filter_params)
      .subscribe((contacts) => {
        this.contacts = contacts;
        this.customFieldsGridService.mapCustomFieldResponses(
          this.contacts,
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
        schema_type: 'contact',
      })
      .subscribe((response: any) => {
        this.customFields = response.custom_fields.contact;
        this.setColumnDefs();
        this.render_grid = true;
      });
  }

  setColumnDefs() {
    this.columnDefs = this.manageContactsService.getManageContactsColDef(
      this.customFields
    );
    this.store.dispatch(
      new SetDefaultColumnDef({ [this.gridName]: this.columnDefs })
    );
  }

  initGrid() {
    this.initGridSection = false;
    this.contacts = [];
    this.manageContactsService
      .getManageContactsRowData({
        include_contacts: false,
        include_custom_fields: true,
        include_dates: true,
        filters: {},
      })
      .subscribe((contacts) => {
        this.contacts = contacts;
        this.customFieldsGridService.mapCustomFieldResponses(
          this.contacts,
          this.customFields
        );
        this.initGridSection = true;
      });
  }

  gotoPremium() {
    this.sweetAlert.premiumAlert();
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
