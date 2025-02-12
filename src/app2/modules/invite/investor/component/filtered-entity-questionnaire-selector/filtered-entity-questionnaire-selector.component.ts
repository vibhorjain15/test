import { HttpClient } from '@angular/common/http';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import * as moment from 'moment';
import { forkJoin } from 'rxjs';
import { UtilsService } from 'src/app2/services/utils.service';
import { CustomModalService } from '../../../../../services/modal/customModal.service';
import {
  FILTER_TERNARY_OPERATORS,
  FILTER_TYPES,
  hierarchyConstants,
} from 'src/app2/shared/constants/constant';
@Component({
  selector: 'filtered-entity-questionnaire-selector',
  templateUrl: './filtered-entity-questionnaire-selector.component.html',
})
export class FilteredEntityQestionnaireSelectorComponent
  implements OnInit
{
  @Input() selectedEntities;
  @Input() entitySearchData = [];
  @Input() globalTernaryOperator;
  @Input() selectedFilters;
  @Input() checkboxLabel = '';
  @Input() maxSelectedTemplates = 1000;
  @Input() templates = [];
  @Output() onChange = new EventEmitter();
  @Output() onUpdateSelectedData = new EventEmitter();
  @Output() onEntitySearchMapChange = new EventEmitter();

  $scope: any;
  @Input() showFilterBasedSelection: any;
  loadingEntityFilteredData: boolean;
  @Input() entityType: any;
  entitySearchMap: any = {};
  entityGroup: {};
  @Input() unfilteredSelectedEntities: any = {};
  duplicateFilteredEntites: any;
  isFilterFormValid: boolean;
  @Input() allFilterTemplateId: any = {};
  tagsList = {};
  selectedEntitiesMap = {};
  unFilterList = null;
  FILTER_TERNARY_OPERATORS = FILTER_TERNARY_OPERATORS;
  UNNFILTERED_ITEMS = 'UNFILTERED ITEMS';
  entitiesLength;
  loader = false;
  constructor(
    private readonly Utils: UtilsService,
    private readonly http: HttpClient,
    private readonly customModalService: CustomModalService
  ) {}


  ngOnInit(): void {
    let params: any = entitySearchApiMap[this.entityType].params;
    params.filters = { [`${this.globalTernaryOperator}`]: [] };
    if (this.globalTernaryOperator == FILTER_TERNARY_OPERATORS.OR) {
      let list: any = [];
      let paramsList = [];
      this.selectedFilters
        .filter((val) => val['advance_filter_value'] && val)
        .map(async (filter, index) => {
          list.push(this.getEntityData(filter, params, index));
          paramsList.push({ filter, params, index });
        });
      this.loader = true;
      forkJoin(list).subscribe((resp) => {
        this.loader = false;
        resp.map((val: any, i) => {
          let { filter, params, index } = paramsList[i];
          this.entitySearchMap[`${filter.criteria_obj.filter_key}_${index}`] = {
            allData: val.data,
            data: [],
            filter,
            template_id: null,
            hasDuplicate: false,
            selectedLength: 0,
          };
          if (!this.allFilterTemplateId)
            this.allFilterTemplateId = {
              ...this.allFilterTemplateId,
              [`${filter.criteria_obj.filter_key}_${index}`]: [],
            };
        });
        this.filterSelectedEntities();
        this.getUnfilteredAndDuplicateSelectedEntities(true, true);
        this.validateForm();
        if (Object.keys(this.entitySearchMap).length) {
          Object.keys(this.entitySearchMap).map((key) => {
            this.entitySearchMap[key].selectedLength = this.getSelectedLength(
              this.entitySearchMap[key].data
            );
            this.entitySearchMap[key].data.forEach((entity) => {
              const index = this.entityGroup[entity.id].indexOf(key);
              if (entity.selected && index === -1) {
                this.entityGroup[entity.id].push(key);
              } else if (!entity.selected && index > -1) {
                this.entityGroup[entity.id].splice(index, 1);
              }
            });
          });
        }
        this.onEntitySearchMapChange.emit(this.entitySearchMap);
      });
    } else {
      let filter_params = {};
      this.selectedFilters
        .filter((val) => val['advance_filter_value'] && val)
        .map(async (filter, index) => {
          if (filter.criteria_obj.type === FILTER_TYPES.DATE) {
            filter_params = {
              filter_key: filter.criteria_obj.filter_key,
              filter_name: filter.criteria_obj.filter_name,
              type: filter.criteria_obj.type,
              operations: filter.condition,
              filter_value: this.Utils.getLocalDateTime(
                filter.advance_filter_value
              ),
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
          params.filters[this.globalTernaryOperator].push(filter_params);
        });
      this.loader = true;
      let searchApi = entitySearchApiMap[this.entityType].api;
      this.http.post(searchApi, params).subscribe((res: any) => {
        this.loader = false;
        this.selectedFilters
          .filter((val) => val['advance_filter_value'] && val)
          .map(async (filter, index) => {
            this.entitySearchMap[`${filter.criteria_obj.filter_key}_${index}`] =
              {
                allData: res.data,
                data: [],
                filter,
                template_id: null,
                hasDuplicate: false,
                selectedLength: 0,
              };
            if (!this.allFilterTemplateId)
              this.allFilterTemplateId = {
                ...this.allFilterTemplateId,
                [`${filter.criteria_obj.filter_key}_${index}`]: [],
              };
          });
        this.filterSelectedEntities();
        this.getUnfilteredAndDuplicateSelectedEntities(false, true);
        this.validateForm();
        this.onEntitySearchMapChange.emit(this.entitySearchMap);
      });
    }
  }

  getEntityData(
    filter: {
      criteria_obj: { type: any; filter_key: any; filter_name: any };
      condition: any;
      advance_filter_value: any;
    },
    params: any,
    index: any
  ) {
    let filter_params: {
      filter_key: any;
      filter_name: any;
      type: any;
      operations: any;
      filter_value: any;
    };
    const searchApi = entitySearchApiMap[`${this.entityType}`]['api'];
    if (filter.criteria_obj.type === FILTER_TYPES.DATE) {
      filter_params = {
        filter_key: filter.criteria_obj.filter_key,
        filter_name: filter.criteria_obj.filter_name,
        type: filter.criteria_obj.type,
        operations: filter.condition,
        filter_value: this.Utils.getLocalDateTime(filter.advance_filter_value),
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
    const paramsCopy = JSON.parse(JSON.stringify(params));
    paramsCopy.filters[this.globalTernaryOperator] = [filter_params];

    return this.http.post(searchApi, paramsCopy);
  }

  filterSelectedEntities() {
    this.entityGroup = {};
    this.selectedEntities.forEach((selectedEntity) => {
      if (!(selectedEntity.id in this.entityGroup)) {
        this.entityGroup[selectedEntity.id] = [];
      }
      const entityKeys = Object.keys(this.entitySearchMap);
      entityKeys.forEach((entityKey: string | number) => {
        const entityList = this.entitySearchMap[entityKey].allData;
        entityList.forEach((entity: { id: any }) => {
          if (selectedEntity.id == entity.id) {
            selectedEntity.selected = true;
            this.entitySearchMap[entityKey].data.push(selectedEntity);
            const index =
              this.entityGroup[selectedEntity.id].indexOf(entityKey);
            if (index === -1) {
              this.entityGroup[selectedEntity.id].push(entityKey);
            }
          }
        });
        this.entitySearchMap[entityKey].selectedLength = this.getSelectedLength(
          this.entitySearchMap[entityKey].data
        );
      });
    });
  }

  getUnfilteredAndDuplicateSelectedEntities(
    checkDuplicate: boolean,
    checkUnfiltered: boolean
  ) {
    if (checkUnfiltered) {
      const templateId =
        this.unfilteredSelectedEntities &&
        this.unfilteredSelectedEntities.template_id
          ? this.unfilteredSelectedEntities.template_id
          : null;
      this.unfilteredSelectedEntities = {
        data: [],
        filter: null,
      };
      this.unfilteredSelectedEntities.template_id = templateId;
    }

    this.duplicateFilteredEntites = [];
    this.selectedEntities.forEach(
      (entity: { id: string | number; selected: boolean }) => {
        if (this.entityGroup[entity.id].length === 0 && checkUnfiltered) {
          entity.selected = true;
          this.unfilteredSelectedEntities.data.push(entity);
        } else if (this.entityGroup[entity.id].length === 1 && checkDuplicate) {
          this.entityGroup[entity.id].forEach((filter: string | number) => {
            if (!this.entitySearchMap[filter].hasDuplicate) {
              this.entitySearchMap[filter].hasDuplicate = false;
            }
          });
        } else if (this.entityGroup[entity.id].length > 1 && checkDuplicate) {
          this.duplicateFilteredEntites.push(entity);
          this.entityGroup[entity.id].forEach((filter: string | number) => {
            this.entitySearchMap[filter].hasDuplicate = true;
          });
        }
      }
    );
  }

  displayFilter(criterion) {
    if (!criterion) return;
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
        displayedDate = `${startDate} to ${endDate}`;
      } else {
        displayedDate = moment(criterion.advance_filter_value).format(
          'YYYY-MM-DD'
        );
      }
      displayedFilter = `${criterion.criteria_obj.filter_name} : ${displayedDate}`;
    } else {
      if (criterion.criteria_obj.hasOwnProperty('options')) {
        criterion.criteria_obj.options.map((option) => {
          if (option.id === criterion.advance_filter_value) {
            ({ value } = option);
          }
        });
      }

      displayedFilter = value
        ? `${criterion.criteria_obj.filter_name} : ${value}`
        : `${criterion.criteria_obj.filter_name} : ${criterion.advance_filter_value}`;
    }
    return displayedFilter;
  }

  viewSelectedEntities(criteria, filterName: any, readonly: any) {
    this.customModalService.invoke('view-selected-entities', {
      initialState: {
        entities: JSON.parse(JSON.stringify(criteria.data)),
        filter: filterName === 'Unfiltered' ? null : criteria.filter,
        entityType:  this.entityType == 'Strategy' ? 'Strategie' : this.entityType,
        readonly:
          this.globalTernaryOperator === FILTER_TERNARY_OPERATORS.AND ||
          readonly,
        entityGroup: this.entityGroup,
        success: (response: any) => {
          criteria.data = response;
          criteria.selectedLength = this.getSelectedLength(criteria.data);
          criteria.hasDuplicate = false;
          criteria.data.forEach((entity) => {
            if (this.entityGroup[entity.id]) {
              const index = this.entityGroup[entity.id].indexOf(filterName);
              if (entity.selected && index === -1) {
                this.entityGroup[entity.id].push(filterName);
              } else if (!entity.selected && index > -1) {
                this.entityGroup[entity.id].splice(index, 1);
              }
            }
          });
          this.resetDuplicate();
          this.getUnfilteredAndDuplicateSelectedEntities(true, false);
          this.validateForm();
          this.handleOnChangeTemplate(
            filterName === 'Unfiltered' ? 'un-filter' : 'template',
            {
              value: { hasDuplicate: criteria.hasDuplicate },
            }
          );
        },
      },
    });
  }

  resetDuplicate() {
    const entityKeys = Object.keys(this.entitySearchMap);
    entityKeys.forEach((entityKey: string | number) => {
      this.entitySearchMap[entityKey].hasDuplicate = false;
    });
    this.entitySearchMap = JSON.parse(JSON.stringify(this.entitySearchMap));
  }

  getSelectedLength(entityList: any) {
    return entityList.filter((entity: { selected: any }) => {
      return entity.selected;
    }).length;
  }

  validateForm() {
    this.isFilterFormValid = true;
    if (!this.showFilterBasedSelection) {
      return;
    }
    const entityKeys = Object.keys(this.entitySearchMap);
    entityKeys.forEach((entityKey: string | number) => {
      if (this.entitySearchMap[entityKey].hasDuplicate) {
        this.entitySearchMap[entityKey].valid = false;
        this.isFilterFormValid = false;
      }
      if (
        this.globalTernaryOperator === FILTER_TERNARY_OPERATORS.OR &&
        this.entitySearchMap[entityKey].selectedLength > 0 &&
        (this.entitySearchMap[entityKey].template_id === null ||
          this.entitySearchMap[entityKey].template_id.length === 0)
      ) {
        this.entitySearchMap[entityKey].valid = false;
        return (this.isFilterFormValid = false);
      } else if (
        this.globalTernaryOperator === FILTER_TERNARY_OPERATORS.AND &&
        this.entitySearchMap[entityKey].selectedLength > 0 &&
        (this.allFilterTemplateId === null ||
          this.allFilterTemplateId?.length === 0)
      ) {
        this.entitySearchMap[entityKey].valid = false;
        return (this.isFilterFormValid = false);
      }
    });

    if (
      this.unfilteredSelectedEntities.data.length > 0 &&
      (this.unfilteredSelectedEntities.template_id === null ||
        this.unfilteredSelectedEntities.template_id.length === 0)
    ) {
      this.unfilteredSelectedEntities.valid = false;
      return (this.isFilterFormValid = false);
    }
  }

  handleFilterChange() {
    this.onChange.emit(this.showFilterBasedSelection);
  }

  handleOnChangeTemplate(type: 'un-filter' | any, list) {
    if (type === 'un-filter') {
      this.unfilteredSelectedEntities.data.forEach((entity) => {
        if (entity.selected) {
          entity.templates = this.unfilteredSelectedEntities.template_id?.length
            ? this.unfilteredSelectedEntities.template_id
            : null;
        }
      });
      this.onUpdateSelectedData.emit({
        type: 'un-filter',
        data: this.unfilteredSelectedEntities,
        allFilter: this.allFilterTemplateId,
      });
    } else {
      let keys =
        this.globalTernaryOperator == FILTER_TERNARY_OPERATORS.OR
          ? Object.keys(this.entitySearchMap)
          : [Object.keys(this.entitySearchMap)[0]];
      list.value?.data?.forEach((entity) => {
        if (entity.selected) {
          entity.templates = this.allFilterTemplateId[list.key];
        }
      });
      if (list.key) {
        this.entitySearchMap[list.key] = JSON.parse(JSON.stringify(list.value));
      }
      this.onUpdateSelectedData.emit({
        type: 'filtered',
        data: this.entitySearchMap,
        allFilter: this.allFilterTemplateId,
        isUnfiltered:
          this.unfilteredSelectedEntities &&
          this.unfilteredSelectedEntities?.data?.length,
      });
    }
  }

  onSelectChange(dvSelectValue, type: 'un-filter' | any, list) {
    if (type === 'template') {
      this.allFilterTemplateId[list.key] = dvSelectValue;
    } else if (type === 'un-filter') {
      this.unfilteredSelectedEntities.template_id = dvSelectValue;
    }
    this.handleOnChangeTemplate(type, list);
  }
}

const entitySearchApiMap = {
  Firm: {
    api: 'service/dvapi_service/firm_search',
    params: {
      include_contacts: true,
      include_custom_fields: true,
      include_dates: true,
      is_active: true,
    },
  },
  Strategy: {
    api: 'service/dvapi_service/product_search',
    params: {
      include_contacts: false,
      include_custom_fields: false,
      include_dates: true,
      is_active: true,
      search_for: hierarchyConstants.Strategy,
    },
  },
  Product: {
    api: 'service/dvapi_service/fund_search',
    params: {
      include_contacts: true,
      include_custom_fields: true,
      include_dates: true,
      is_active: true,
    },
  },
  Vehicle: {
    api: 'service/dvapi_service/vehicle_search',
    params: {
      include_contacts: true,
      include_custom_fields: true,
      include_dates: true,
      is_active: true,
    },
  },
};
