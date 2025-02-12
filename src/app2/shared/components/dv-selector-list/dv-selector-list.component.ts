import { HttpClient } from '@angular/common/http';
import {
  Component,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  EventEmitter,
} from '@angular/core';
import { Subject } from 'rxjs';
import { responseTypeList } from 'src/app2/modules/template-builder/constants/responseType.constant';
import { ModalService } from 'src/app2/services/modal.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { sortByFirstNames } from './dv-selector.util';
import { RouterService } from 'src/app2/services/router.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { debouncer } from 'src/app2/utils/debouce.util';
import {
  FILTER_TERNARY_OPERATORS,
  hierarchyConstants,
  keywordConstants,
} from '../../constants/constant';
import { DvApiSearchService } from 'src/app2/services/dvapi-service/dvapi-service.service';
import { EntityUtilsService } from 'src/app2/utils/entity-utils.service';
import { FirmDataService } from 'src/app2/services/firm-data.service';
import { FundDataService } from 'src/app2/services/fund-data.service';

@Component({
  selector: 'app-dv-selector-list',
  templateUrl: './dv-selector-list.component.html',
  styleUrls: ['./dv-selector-list.component.css'],
})
export class DvSelectorListComponent implements OnInit, OnChanges {
  @Input() name;
  @Input() entity_type;
  @Input() isMultiple = true;
  @Input() entities;
  @Input() edv;
  @Input() filter_params = {};
  @Input() displayParams;
  selected_entities = [];
  @Input() badgeLabel;
  @Input() sectionFilterSource;
  @Input() entity_type_plural = null;
  @Input() isExistingQuestion = false;
  @Input() reloading = false;
  @Input() KeepSelectionAfterOnChange = false;
  @Input() placeholder = null;
  @Input() emptyStateMessage;
  @Input() showTotalEntitiesCount = false;
  @Input() canSort = true;
  @Input() useLocalSearch = true;
  @Input() listPlaceholder = '';
  @Input() totalItemsPerPage = 10;
  @Input() selectAllOnLoad = false;
  @Input() disabledSearchOnEmptyList = true;
  @Input() showFilterModal: boolean;

  @Output() onChangeEntity: Subject<any> = new Subject();
  @Output() onChangeUnSelectEntity: EventEmitter<any> = new EventEmitter();
  @Output() onSearchChange: EventEmitter<string> = new EventEmitter();
  strategies;
  tags;
  statusTags;
  responseTypeMap = {};
  input;
  filters = {
    name: null,
    section_id: null,
    tag_id: null,
    relationship_status_id: null,
    strategyID: null,
  };
  selectedAll;
  @Input() filters_section;
  current_page = 1;
  entitiesInPage = [];
  entitiesBackup;
  loading_entities;
  objectLength: any;
  local_entity_type;
  debouceInst: any;
  disabledSearch = true;
  global_ternary_operator = FILTER_TERNARY_OPERATORS.AND;
  search_filters_response: any;
  search_criterias: {};
  filterApplied: boolean;
  global_hierarchy_option: any = hierarchyConstants.Strategy;
  filters_data_loaded: boolean;
  entityTypeForFilterApi: any;

  constructor(
    private readonly Utils: UtilsService,
    private readonly http: HttpClient,
    private readonly customModalFactory: CustomModalService,
    private readonly router: RouterService,
    private readonly dvApiSearchService: DvApiSearchService,
    private readonly entityUtilsService: EntityUtilsService,
    private readonly FirmDataService: FirmDataService,
    private readonly FundDataService: FundDataService
  ) {
    this.applyFilters = this.applyFilters.bind(this);
  }

  ngOnInit() {
    this.debouceInst = debouncer(this.applyFilters, 500);
    this.loadFilterOptions();
    this.objectLength = this.Utils.getObjectLength(this.filter_params);
    this.entityTypeForFilterApi =
      this.entity_type === 'Product'
        ? keywordConstants.Product
        : this.entity_type;
    this.listPlaceholder =
      this.entity_type === 'Product'
        ? 'Select Products Classification'
        : 'Select a ' + this.entity_type;
    if (!this.entity_type_plural) {
      this.entity_type = `${this.entity_type}s`;
    } else {
      this.entity_type = this.entity_type_plural;
    }

    if (this.disabledSearchOnEmptyList) {
      this.entitiesBackup = Object.assign({}, this.entities);
      this.disabledSearch = this.entitiesBackup.length > 0;
    } else {
      this.disabledSearch = false;
    }
    this.loading_entities = false;
    this.selectedAll = false;
    this.filters_section = {
      show: this.filters_section?.show ?? false,
      filterApplied: this.filters_section?.filterApplied ?? false,
    };
    responseTypeList.map((val) => {
      this.responseTypeMap[val.id] = val;
    });
    if (!this.placeholder) {
      this.placeholder =
        'Search ' + this.entity_type.toLowerCase() + ' by name';
    }
    if (this.selectAllOnLoad) {
      this.selectAll();
    }
    if (this.showFilterModal) {
      this.getSearchFilters();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes?.reloading?.currentValue !== changes?.reloading?.previousValue
    ) {
      this.loading_entities = JSON.parse(
        JSON.parse(changes.reloading.currentValue)
      );
    }
    if (
      changes.filters_section?.currentValue !=
      changes.filters_section?.previousValue
    ) {
      this.filters.name = changes.filters_section?.currentValue.name;
    }

    if (
      changes.entities &&
      changes?.entities?.currentValue !== changes?.entities?.previousValue
    ) {
      this.entitiesBackup = JSON.parse(
        JSON.stringify(changes.entities.currentValue)
      );
      this.entities = !!changes.entities.currentValue
        ? Object.values(changes.entities.currentValue)
        : [];
      this.loadNextPage();

      this.selected_entities = this.entities.filter((e) => e.is_selected);
      this.selectedAll = this.selected_entities.length === this.entities.length;
      this.selected_entities.length &&
        this.onChangeEntity.next(this.selected_entities);
      if (!this.KeepSelectionAfterOnChange) {
        if (this.canSort) this.entities = this.entities.sort(sortByFirstNames);
        this.unSelectAll();
      }
      this.loadFilterOptions();
    }
  }

  selectEntity(entity, emitValue = true) {
    if (!this.isMultiple) {
      this.selected_entities = [];
      this.entities.map((entity) => (entity.is_selected = false));
    }
    entity.is_selected = true;
    this.selected_entities.push(entity);
    this.selectedAll = this.KeepSelectionAfterOnChange
      ? this.entities.filter((entity) => !entity.is_selected).length == 0
      : this.selected_entities.length === this.entities.length;

    if (emitValue) {
      this.onChangeEntity.next(this.selected_entities);
    }
  }

  setSelectedEntities(entities) {
    if (entities && entities.length > 0) {
      entities.forEach((entity) => {
        let current_entity = this.entities.find(
          (item) =>
            item[this.displayParams.id] === entity[this.displayParams.id]
        );
        if (current_entity) {
          this.selectEntity(current_entity, false);
        }
      });

      this.onChangeEntity.next(this.selected_entities);
    }
  }

  unSelectEntity(entity, emitValue = true) {
    entity.is_selected = false;
    let index = this.selected_entities.findIndex(
      (item) => item[this.displayParams.id] === entity[this.displayParams.id]
    );
    this.selected_entities.splice(index, 1);
    this.selectedAll = this.selected_entities.length === this.entities.length;

    if (emitValue) {
      this.onChangeEntity.next(this.selected_entities);
      this.onChangeUnSelectEntity.emit([entity]);
    }
  }

  unselectEntities(entities) {
    if (entities && entities.length > 0) {
      entities.forEach((entity) => {
        let current_entity = this.entities.find(
          (item) =>
            item[this.displayParams.id] === entity[this.displayParams.id]
        );

        if (current_entity) {
          this.unSelectEntity(current_entity, false);
        }
      });

      this.onChangeEntity.next(this.selected_entities);
    }
  }

  selectAll() {
    this.selectedAll = true;
    if (!this.KeepSelectionAfterOnChange) {
      this.selected_entities.length = 0;
    }
    this.entities.forEach((entity) => {
      entity.is_selected = true;
      if (
        !this.KeepSelectionAfterOnChange ||
        !this.selected_entities.find(
          (item) =>
            item[this.displayParams.id] === entity[this.displayParams.id]
        )
      ) {
        this.selected_entities.push(entity);
      }
    });
    this.onChangeEntity.next(this.selected_entities);
  }

  viewQuestionTags(template) {
    this.customModalFactory.invoke('view-question-tags', {
      initialState: {
        template: template,
        onSuccess: () => {
          this.customModalFactory.close();
          this.router.navigateWithParams('app.diligence.template.preview', {
            templateId: template.id,
          });
        },
      },
      class: 'modal-lg',
    });
  }

  unSelectAll() {
    this.selectedAll = false;
    this.selected_entities.length = 0;
    this.entities.forEach((entity) => {
      entity.is_selected = false;
    });
    this.onChangeEntity.next(this.selected_entities);
    this.onChangeUnSelectEntity.emit(this.entities);
  }

  toggleFiltersSection() {
    if (!this.showFilterModal) {
      this.filters_section.show = !this.filters_section.show;
    } else {
      this.openFilterModal();
    }
  }

  loadFilterOptions() {
    if (this.filter_params['strategyID'] && !this.strategies) {
      this.http.get('strategies/tagged').subscribe((res) => {
        this.strategies = res;
      });
    }
    if (this.filter_params['tag_id'] && !this.tags) {
      this.http.get('tags', { params: { in_use: true } }).subscribe((res) => {
        this.tags = res;
      });
    }
    if (this.filter_params['relationship_status_id'] && !this.statusTags) {
      this.http.get('tags', { params: { type: 'Status' } }).subscribe((res) => {
        this.statusTags = res;
      });
    }
    if (this.filter_params['section_id']) {
      this.sectionFilterSource = Object.values(this.sectionFilterSource);
      this.filters.section_id = null;
    }
  }

  resetFilters() {
    this.entities = Object.assign({}, this.entitiesBackup);
    this.entities = Object.values(this.entities);
    if (this.KeepSelectionAfterOnChange) {
      this.entities.map((entity) => {
        entity.is_selected = !!this.selected_entities.find(
          (selected_entity) => selected_entity.id == entity.id
        );
      });
      this.selectedAll =
        this.entities.filter((entity) => !entity.is_selected).length == 0;
    } else {
      this.selectedAll = false;
      this.selected_entities.length = 0;
    }

    if (!this.isExistingQuestion) {
      if (this.canSort) this.entities = this.entities.sort(sortByFirstNames);
    }
    this.filters = {
      name: null,
      section_id: null,
      tag_id: null,
      relationship_status_id: null,
      strategyID: null,
    };
    this.loadNextPage();
  }

  applyFilters() {
    if (!this.useLocalSearch) {
      return this.onSearchChange.emit(this.filters.name);
    }
    this.entities = [];
    Object.values(this.entitiesBackup).forEach((entity: any) => {
      let status = true;
      Object.keys(this.filters).forEach((key) => {
        if (
          key === 'name' &&
          this.filters[key] !== null &&
          entity[this.displayParams[key]]
            .toLowerCase()
            .indexOf(this.filters[key].toLowerCase()) == -1
        ) {
          status = false;
        } else if (
          key == 'tag_id' &&
          this.filters[key] &&
          entity.tags.indexOf(this.filters[key]) == -1
        ) {
          status = false;
        } else if (
          key !== 'name' &&
          key != 'tag_id' &&
          this.filters[key] !== null &&
          entity[this.filter_params[key]] != this.filters[key]
        ) {
          status = false;
        }
      });
      if (status) {
        this.entities.push(Object.assign({}, entity));
      }
    });
    if (!this.isExistingQuestion) {
      if (this.canSort) this.entities = this.entities.sort(sortByFirstNames);
    }
    if (this.KeepSelectionAfterOnChange) {
      this.entities.map((entity) => {
        entity.is_selected = !!this.selected_entities.find(
          (selected_entity) => selected_entity.id == entity.id
        );
      });
      this.selectedAll =
        this.entities.filter((entity) => !entity.is_selected).length == 0;
    } else {
      this.selectedAll = false;
      this.selected_entities.length = 0;
    }
    this.loadNextPage();
  }

  loadNextPage(event?) {
    if (this.canSort) this.entities = this.entities.sort(sortByFirstNames);
    if (event) {
      this.current_page = event.page;
    }
    this.entitiesInPage = [];
    const startItem = (this.current_page - 1) * this.totalItemsPerPage;
    const endItem = this.current_page * this.totalItemsPerPage;
    this.entitiesInPage = this.entities.slice(startItem, endItem);
  }

  handleKeyUp() {
    this.debouceInst();
  }

  openFilterModal() {
    this.customModalFactory.invoke('manage-custom-search', {
      initialState: {
        custom_filters_data: {
          global_ternary_operator: this.global_ternary_operator,
          search_filters_response: this.search_filters_response,
          search_criterias: this.search_criterias,
        },
        success: (response) => {
          this.search_criterias = response.search_criterias;
          this.global_ternary_operator = response.global_ternary_operator;
          this.loading_entities = true;
          if (Object.keys(response.searchByFiltersParams).length !== 0) {
            this.filterApplied = true;
            response.searchByFiltersParams['is_active'] = true;
            this.getFilteredEntities(response.searchByFiltersParams);
          } else {
            this.filterApplied = false;
            this.getFilteredEntities({
              include_contacts: false,
              include_custom_fields: false,
              include_dates: false,
              is_active: true,
              filters: { [this.global_ternary_operator]: [] },
            });
          }
        },
      },
      class: 'modal-xl',
    });
  }

  getFilteredEntities(params) {
    if (this.entityTypeForFilterApi === keywordConstants.Strategy) {
      params.search_for = this.global_hierarchy_option;
    }
    if (this.entityTypeForFilterApi === keywordConstants.Firm) {
      this.FirmDataService.getFirms(params).subscribe((response: any) => {
        this.processDataAfterFilter(response);
      });
    } else if (this.entityTypeForFilterApi === keywordConstants.Product) {
      this.FundDataService.getFunds(params).subscribe((response: any) => {
        this.processDataAfterFilter(response);
      });
    }
  }

  processDataAfterFilter(response) {
    this.entities = response.data;
    this.loading_entities = false;
    this.selectedAll = false;
    this.selected_entities.length = 0;
    this.onChangeEntity.next(this.selected_entities);
    this.current_page = 1;
    this.loadNextPage();
  }

  getSearchFilters() {
    this.dvApiSearchService.getSearchFilters(
      {
        entity_type: this.entityTypeForFilterApi.toLowerCase(),
      },
      (response) => {
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
            this.getDynamicDefaultFilterOptions(filter as any, index);
          }
        }
        for (
          index = 0;
          index < this.search_filters_response.custom_filters.length;
          index++
        ) {
          filter = this.search_filters_response.custom_filters[index];
          if (filter.hasOwnProperty('endpoint')) {
            this.getDynamicCustomFilterOptions(filter as any, index);
          }
        }
      }
    );
  }

  getDynamicCustomFilterOptions(filter, index: string | number) {
    this.entityUtilsService
      .getDynamicDefaultFilterOptions(filter)
      ?.subscribe((response: { data: any }) => {
        this.search_filters_response.custom_filters[index].options = response;
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

  getDynamicDefaultFilterOptions(filter, index: string | number) {
    this.entityUtilsService
      .getDynamicDefaultFilterOptions(filter)
      ?.subscribe((response: { data: any }) => {
        this.search_filters_response.default_filters[index].options = response;

        this.search_filters_response.default_filters[index].options.map(
          (option: any) =>
            this.renameUsenameToValue(
              option,
              this.search_filters_response.default_filters[index]
                .display_attribute
            )
        );
      });
  }

  renameUsenameToValue(obj: { [x: string]: any }, key: string | number) {
    obj['value'] = obj[key];
    delete obj[key];
  }
  /// filter modal related functions end
  ////////////////////////////////////////////////////////////////
}
