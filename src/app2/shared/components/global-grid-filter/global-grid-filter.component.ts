import { HttpClient } from '@angular/common/http';
import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { EventEmitter } from '@angular/core';
import * as moment from 'moment';
import { forkJoin } from 'rxjs';
import { Output } from '@angular/core';
import { Regex } from 'src/app2/shared/constants/constant';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-global-grid-filter',
  templateUrl: './global-grid-filter.component.html',
})
export class GlobalGridFilterComponent implements OnInit, OnChanges {
  @Input() isDisplay;
  @Input() removeEvent;
  @Input() isInvestor: boolean;
  @Input() tab;
  @Input() filterData;
  @Output() onFilterApply = new EventEmitter<object>();

  globalTernaryOperator: string = 'and';
  oldGlobalOperator: string = 'and';
  minDate: Date;
  maxDate: Date;
  global_hierarchy_option: any;
  searchCriteria: any = [
    {
      criteriaObj: { items: [{ id: 'equals', name: 'Equals' }] },
      value: null,
      condition: null,
      id: Math.round(Math.random() * 1000),
    },
  ];
  previousCriteria: any;

  attachmentTypes: any = [];
  firms: any = [];
  strategies: any = [];
  funds: any = [];
  vehicles: any = [];
  isAPILoaded: boolean = false;
  isValidSearch: boolean = false;
  dateFormat: string = 'MM-DD-YYYYTHH:mm:ss';
  filterParams: any = {};
  oldQueryText: any = '';

  baseCriteriaOptions: any = [
    // keyword option is commented out for now as OR with keyword and multiple keywords using OR as well as AND are not supported currently. Can be enabled back once these options are handled.
    // { text: 'Keyword', responseType: 'Text', id: 'q' },
    { text: 'As of Date', responseType: 'Date', id: 'as_of_date' },
    { text: 'Document Type', responseType: 'Dropdown', id: 'type_ids' },
    { text: 'Associated Firm', responseType: 'Dropdown', id: 'firm_ids' },
    {
      text: 'Associated Strategy',
      responseType: 'Dropdown',
      id: 'strategy_ids',
    },
    { text: 'Associated Product', responseType: 'Dropdown', id: 'fund_ids' },
    { text: 'Associated Vehicle', responseType: 'Dropdown', id: 'vehicle_ids' },
  ];
  criteriaOptions: any = [];
  dropdownItems = [
    { key: 'or', label: 'ANY' },
    { key: 'and', label: 'ALL' },
  ];

  conditionDropdownItems = [
    { key: 'greater_than', label: 'Greater Than Or Equal To' },
    { key: 'lesser_than', label: 'Lesser Than Or Equal To' },
    { key: 'equals', label: 'Equals' },
  ];

  valueRegex = Regex.avoidFirstSplCharacter;
  constructor(private readonly http: HttpClient) {}

  ngOnInit() {
    this.updatePreviousCriteria();
    this.global_hierarchy_option = 'strategy';
    this.minDate = moment().subtract(5, 'years').toDate();
    this.maxDate = new Date();
    this.initializeCriteriaOptions();
    this.loadAllData();
  }

  initializeCriteriaOptions() {
    this.criteriaOptions = [...this.baseCriteriaOptions];
    if (this.tab === 'MyAttachments') {
      this.criteriaOptions = [
        ...this.criteriaOptions,
        {
          text: 'Uploaded On',
          responseType: 'Date',
          id: 'created_at',
        },
        {
          text: 'Uploaded By',
          responseType: 'Dropdown',
          id: 'created_by',
        },
        {
          text: 'Shared With',
          responseType: 'Dropdown',
          id: 'shared_with_firms',
        },
      ];
    } else if (this.tab === 'Received') {
      this.criteriaOptions = [
        ...this.criteriaOptions,
        {
          text: 'Received On',
          responseType: 'Date',
          id: 'received_at',
        },
        {
          text: 'Shared By',
          responseType: 'Dropdown',
          id: 'shared_by',
        },
      ];
    } else if (this.tab === 'All') {
      this.criteriaOptions = [
        ...this.criteriaOptions,
        {
          text: 'Uploaded By',
          responseType: 'Dropdown',
          id: 'created_by',
        },
        {
          text: 'Shared By',
          responseType: 'Dropdown',
          id: 'shared_by',
        },
        {
          text: 'Shared With',
          responseType: 'Dropdown',
          id: 'shared_with_firms',
        },
        {
          text: 'Uploaded On',
          responseType: 'Date',
          id: 'created_at',
        },
        {
          text: 'Received On',
          responseType: 'Date',
          id: 'received_at',
        },
      ];
    }

    if (this.isInvestor) {
      this.criteriaOptions.push({
        text: 'Project Name',
        responseType: 'Dropdown',
        id: 'associated_project_names',
      });
    } else {
      this.criteriaOptions.push({
        text: 'Client Name',
        responseType: 'Dropdown',
        id: 'associated_project_names',
      });
    }
  }

  loadAllData() {
    const paramsStrategy = {
      include_contacts: false,
      include_custom_fields: false,
      include_dates: true,
      is_active: true,
      filters: {},
      search_for: this.global_hierarchy_option,
    };

    let defReq = this.http.get(`document_tag_definitions`);
    let firmsReq = this.http.get(`firms/monitor?skip_pagination=true`);
    let productReq = this.http.post(
      `service/dvapi_service/product_search`,
      paramsStrategy
    );
    let fundsReq = this.http.get(`funds?skip_pagination=true`);
    let vehiclesReq = this.http.get(`vehicles`);
    let filterOptionsReq = this.http.get(
      'v2/attachments/filter_options?type=' + this.tab
    );
    const filterOptionsTab = this.tab;

    forkJoin([
      defReq,
      firmsReq,
      productReq,
      fundsReq,
      vehiclesReq,
      filterOptionsReq,
    ])
      .pipe(finalize(() => (this.isAPILoaded = true)))
      .subscribe((responses: Array<any>) => {
        if (responses.length) {
          if (responses[0]?.length) {
            this.attachmentTypes = responses[0];
            let attachmentTypeCriteria = this.criteriaOptions.find(
              (item) => item.id == 'type_ids'
            );
            attachmentTypeCriteria.childOptions = responses[0];
          }
          if (responses[1]?.length) {
            this.firms = responses[1];
            let associatedFirmCriteria = this.criteriaOptions.find(
              (item) => item.id == 'firm_ids'
            );
            associatedFirmCriteria.childOptions = responses[1];
          }
          if (responses[2].data) {
            this.strategies = responses[2].data;
            let associatedStrategyCriteria = this.criteriaOptions.find(
              (item) => item.id == 'strategy_ids'
            );
            associatedStrategyCriteria.childOptions = responses[2].data;
          }

          if (responses[3].length) {
            this.funds = responses[3];
            let associatedFundCriteria = this.criteriaOptions.find(
              (item) => item.id == 'fund_ids'
            );
            associatedFundCriteria.childOptions = responses[3];
          }

          if (responses[4].length) {
            this.vehicles = responses[4];
            let associatedVehicleCriteria = this.criteriaOptions.find(
              (item) => item.id == 'vehicle_ids'
            );
            associatedVehicleCriteria.childOptions = responses[4];
          }

          if (responses[5]?.data && filterOptionsTab == this.tab) {
            let project_names_criteria = this.criteriaOptions.find(
              (criteria) => criteria.id == 'associated_project_names'
            );

            project_names_criteria.childOptions =
              responses[5].data.project_options.map((project) => {
                return {
                  ...project,
                  name: project.display_name,
                };
              });

            if (this.tab == 'MyAttachments') {
              let uploaded_by_criteria = this.criteriaOptions.find(
                (criteria) => criteria.id == 'created_by'
              );

              uploaded_by_criteria.childOptions =
                responses[5].data.uploaded_by_options.map((user) => {
                  return {
                    ...user,
                    name: user.created_by_name,
                  };
                });

              let shared_with_criteria = this.criteriaOptions.find(
                (criteria) => criteria.id == 'shared_with_firms'
              );

              shared_with_criteria.childOptions =
                responses[5].data.shared_with_options;
            } else if (this.tab == 'Received') {
              let shared_by_criteria = this.criteriaOptions.find(
                (criteria) => criteria.id == 'shared_by'
              );

              shared_by_criteria.childOptions =
                responses[5].data.shared_by_options.map((user) => {
                  return {
                    ...user,
                    name: user.shared_by_name,
                  };
                });
            } else if (this.tab == 'All') {
              let uploaded_by_criteria = this.criteriaOptions.find(
                (criteria) => criteria.id == 'created_by'
              );

              uploaded_by_criteria.childOptions =
                responses[5].data.uploaded_by_options.map((user) => {
                  return {
                    ...user,
                    name: user.created_by_name,
                  };
                });

              let shared_by_criteria = this.criteriaOptions.find(
                (criteria) => criteria.id == 'shared_by'
              );

              shared_by_criteria.childOptions =
                responses[5].data.shared_by_options.map((user) => {
                  return {
                    ...user,
                    name: user.shared_by_name,
                  };
                });

              let shared_with_criteria = this.criteriaOptions.find(
                (criteria) => criteria.id == 'shared_with_firms'
              );

              shared_with_criteria.childOptions =
                responses[5].data.shared_with_options;
            }
          }
        }
      });
    this.criteriaOptions = this.criteriaOptions.sort((a, b) =>
      a.text.localeCompare(b.text)
    );
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes.filterData &&
      changes.filterData.currentValue !== changes.filterData.previousValue
    ) {
      this.searchCriteria = this.filterData.searchCriteria.map((filter) => {
        if (filter?.criteriaObj?.responseType == 'Date') {
          filter.value = new Date(filter.value);
          return filter;
        } else return filter;
      });
      this.updatePreviousCriteria();
      this.filterParams = this.filterData.filterParams;
      this.globalTernaryOperator = this.filterParams.global_operator ?? 'and';
    }
    if (changes.tab) {
      this.initializeCriteriaOptions();
      this.loadAllData();
    }
  }

  removeCriteriaById(id) {
    const index = this.searchCriteria.findIndex((item) => id && item.id === id);
    if (index >= 0) {
      this.removeCriteria(index);
    }
  }

  selectCriteria(criteria, index, dvDropdownValue) {
    this.searchCriteria[index].value = '';
    let findDataItem = this.criteriaOptions.filter(
      (x) => x.id == dvDropdownValue
    );
    this.searchCriteria[index].criteriaObj =
      findDataItem.length > 0 ? findDataItem[0] : {};
    criteria.condition = 'equals';
    this.searchCriteria[index].criteriaObj.items = [];
    if (this.searchCriteria[index].criteriaObj.responseType === 'Date') {
      this.searchCriteria[index].criteriaObj.items = [
        { id: 'greater_than', name: 'Greater Than Or Equal To' },
        { id: 'lesser_than', name: ' Lesser Than Or Equal To' },
      ];
    }
    this.searchCriteria[index].criteriaObj.items.push({
      id: 'equals',
      name: 'Equals',
    });
    this.changeOption(criteria);
    if (!this.searchCriteria[index].id) {
      this.searchCriteria[index].id = Math.round(Math.random() * 1000);
    }
  }

  setDateValue(evnt, criteria) {
    if (evnt) {
      criteria.value = evnt;
      this.changeOption(criteria);
    }
  }

  changeOption(item) {
    this.isValidSearch = (this.searchCriteria as Array<any>).every(
      (x) => x.value
    );
    if (item.criteriaObj.text === 'Keyword') {
      this.isValidSearch = true;
    }
  }

  addNewCriteria(criteria) {
    this.isValidSearch = false;
    this.searchCriteria.push({
      criteriaObj: { items: [{ id: 'equals', name: 'Equals' }] },
      value: null,
      condition: null,
      id: Math.round(Math.random() * 1000),
    });
  }

  removeCriteria(index) {
    this.searchCriteria.splice(index, 1);
    this.isValidSearch = (this.searchCriteria as Array<any>).every(
      (x) => x.value
    );
    if (!this.searchCriteria?.length) {
      this.searchCriteria.push({
        criteriaObj: null,
        value: null,
        condition: null,
        id: Math.round(Math.random() * 1000),
      });
    }
  }

  getSearchResults() {
    this.isDisplay = true;
    this.updatePreviousCriteria();
    this.initializeFiltering();
  }

  initializeFiltering() {
    this.filterParams = this.createSearchQuery();
    const keywordParam = this.filterParams.q || '';
    this.onFilterApply.emit({
      q: keywordParam,
      data: this.filterParams,
      isFilterApplied: true,
      searchCriteria: [...this.searchCriteria],
      global_operator: this.globalTernaryOperator,
      isResetAction: false,
    });
  }

  revertSearchCriteria() {
    this.searchCriteria = (
      this.previousCriteria
        ? JSON.parse(JSON.stringify(this.previousCriteria))
        : []
    ).map((filter) => {
      if (filter?.criteriaObj?.responseType == 'Date') {
        filter.value = new Date(filter.value);
        return filter;
      } else return filter;
    });
  }

  updatePreviousCriteria() {
    this.previousCriteria = this.searchCriteria
      ? JSON.parse(JSON.stringify(this.searchCriteria))
      : [];
  }

  createSearchQuery() {
    const params: any = { global_operator: this.globalTernaryOperator };
    this.searchCriteria.map((criteria) => {
      switch (criteria.criteriaObj?.text) {
        case 'Keyword':
          params.q = criteria.value;
          break;
        case 'As of Date':
          if (criteria.condition === 'equals') {
            if (!params.eq_as_of_date) {
              params.eq_as_of_date = [];
            }
            params.eq_as_of_date.push(
              moment(criteria.value).startOf('day').format(this.dateFormat)
            );
          }
          if (criteria.condition === 'greater_than') {
            if (!params.gt_as_of_date) {
              params.gt_as_of_date = [];
            }
            params.gt_as_of_date.push(
              moment(criteria.value).startOf('day').format(this.dateFormat)
            );
          }
          if (criteria.condition === 'lesser_than') {
            if (!params.lt_as_of_date) {
              params.lt_as_of_date = [];
            }
            params.lt_as_of_date.push(
              moment(criteria.value).endOf('day').format(this.dateFormat)
            );
          }
          break;
        case 'Document Type':
          this.addOrUpdateFilterCriteriaIds(
            params,
            'type_ids',
            criteria.value,
            'id'
          );
          break;
        case 'Document Group':
          this.addOrUpdateFilterCriteriaIds(
            params,
            'group_ids',
            criteria.value,
            'id'
          );
          break;
        case 'Associated Firm':
          this.addOrUpdateFilterCriteriaIds(
            params,
            'firm_ids',
            criteria.value,
            'id'
          );
          params.entity_type = 'Firm';
          break;
        case 'Associated Product':
          this.addOrUpdateFilterCriteriaIds(
            params,
            'fund_ids',
            criteria.value,
            'id'
          );
          params.entity_type = 'Fund';
          break;
        case 'Associated Vehicle':
          this.addOrUpdateFilterCriteriaIds(
            params,
            'vehicle_ids',
            criteria.value,
            'id'
          );
          params.entity_type = 'Vehicle';
          break;
        case 'Associated Strategy':
          this.addOrUpdateFilterCriteriaIds(
            params,
            'strategy_ids',
            criteria.value,
            'id'
          );
          params.entity_type = 'Strategy';
          break;
        case 'Uploaded On':
          if (criteria.condition === 'equals') {
            if (!params.eq_created_at_date) {
              params.eq_created_at_date = [];
            }
            params.eq_created_at_date.push(
              moment(criteria.value).startOf('day').format(this.dateFormat)
            );
          }
          if (criteria.condition === 'greater_than') {
            if (!params.gt_created_at_date) {
              params.gt_created_at_date = [];
            }
            params.gt_created_at_date.push(
              moment(criteria.value).startOf('day').format(this.dateFormat)
            );
          }
          if (criteria.condition === 'lesser_than') {
            if (!params.lt_created_at_date) {
              params.lt_created_at_date = [];
            }
            params.lt_created_at_date.push(
              moment(criteria.value).endOf('day').format(this.dateFormat)
            );
          }
          break;
        case 'Received On':
          if (criteria.condition === 'equals') {
            if (!params.eq_received_at_date) {
              params.eq_received_at_date = [];
            }
            params.eq_received_at_date.push(
              moment(criteria.value).startOf('day').format(this.dateFormat)
            );
          }
          if (criteria.condition === 'greater_than') {
            if (!params.gt_received_at_date) {
              params.gt_received_at_date = [];
            }
            params.gt_received_at_date.push(
              moment(criteria.value).startOf('day').format(this.dateFormat)
            );
          }
          if (criteria.condition === 'lesser_than') {
            if (!params.lt_received_at_date) {
              params.lt_received_at_date = [];
            }
            params.lt_received_at_date.push(
              moment(criteria.value).endOf('day').format(this.dateFormat)
            );
          }
          break;
        case 'Uploaded By':
          params.created_by =
            criteria.value && criteria.value.length > 0
              ? criteria.value.map((a) => a.created_by)
              : null;
          this.addOrUpdateFilterCriteriaIds(
            params,
            'created_by',
            criteria.value,
            'created_by'
          );
          break;
        case 'Shared By':
          this.addOrUpdateFilterCriteriaIds(
            params,
            'shared_by',
            criteria.value,
            'shared_by'
          );
          break;
        case 'Shared With':
          this.addOrUpdateFilterCriteriaIds(
            params,
            'shared_with_firms',
            criteria.value,
            null
          );
          break;
        case 'Project Name':
        case 'Client Name':
          this.addOrUpdateFilterCriteriaIds(
            params,
            'diligence_ids',
            criteria.value,
            'entity_id'
          );
          break;
      }
    });
    return params;
  }

  addOrUpdateFilterCriteriaIds(params, paramsArrayName, options, mappedProp) {
    if (!params[paramsArrayName]) {
      params[paramsArrayName] = [];
    }

    if (options?.length > 0) {
      params[paramsArrayName].push(
        mappedProp ? options.map((item) => item[mappedProp]) : options
      );
    }
  }

  resetFiltersData() {
    this.oldQueryText = '';
    this.oldGlobalOperator = 'and';
    this.globalTernaryOperator = 'and';
    this.filterParams = {};
    this.searchCriteria = [
      {
        criteriaObj: { items: [{ id: 'equals', name: 'Equals' }] },
        value: null,
        condition: null,
        id: Math.round(Math.random() * 1000),
      },
    ];
    this.updatePreviousCriteria();
    this.onFilterApply.emit({
      q: '',
      data: this.filterParams,
      isFilterApplied: false,
      searchCriteria: [...this.searchCriteria],
      global_operator: this.globalTernaryOperator,
      isResetAction: true,
    });
    this.isValidSearch = false;
  }

  handleOnSelectChange(dvSelectChangeEvent: any, criteria: any) {
    criteria.value = dvSelectChangeEvent;
    this.isValidSearch =
      dvSelectChangeEvent?.length > 0 &&
      (this.searchCriteria as Array<any>).every((x) => x.value);
  }

  // this method is used in dv-documents-grid to update the filter data and search query synchronously in the same cycle
  updateFilterDataAndGenerateSearchQuery(filterData) {
    this.filterData = filterData;
    this.searchCriteria = this.filterData.searchCriteria.map((filter) => {
      if (filter?.criteriaObj?.responseType == 'Date') {
        filter.value = new Date(filter.value);
        return filter;
      } else return filter;
    });
    this.updatePreviousCriteria();
    this.filterParams = this.filterData.filterParams;
    this.globalTernaryOperator = this.filterParams.global_operator ?? 'and';
  }
}
