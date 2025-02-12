import { HttpClient } from '@angular/common/http';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import * as moment from 'moment';
import {
  FILTER_TERNARY_OPERATORS,
  hierarchyConstants,
  keywordConstants,
} from 'src/app2/shared/constants/constant';
import { debouncer } from '../../../../../utils/debouce.util';
import { InvestorService, filterEnum } from '../../service/investor.service';
import { EntityUtilsService } from 'src/app2/utils/entity-utils.service';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';

@Component({
  selector: 'entity-selector',
  templateUrl: './entity-selector.component.html',
  styleUrls: ['./entity-selector.component.css'],
})
export class EntitySelectorComponent implements OnInit, OnChanges, OnDestroy {
  filters_data_loaded: boolean;
  filterApplied: boolean;
  hierarchyConstants: any;
  filters: any = {
    include_custom_fields: true,
    include_dates: true,
    filters: {},
    name: '',
  };
  @Input() standalone: any = true;
  filters_section: { show: boolean };
  selected_list_filters_section: any;
  disable_select_all: boolean;
  display_selection_warning: boolean;
  search_filters_response: any;
  loading_entities: boolean = false;
  contact_tags;
  @Input() entityList = [];
  @Input() search_criterias: any = null;
  @Input() selection_list: any = [];
  @Output() changeList = new EventEmitter();
  @Input() is_admin = false;
  @Input() emptyContactMessage = '';
  @Input() emptySearchResultMessage = '';

  entities = [];
  entities_copy = [];
  @Input() global_ternary_operator: any;
  select_all_entities: any;
  @Input() global_hierarchy_option = hierarchyConstants.Strategy;
  @Input() entity_type = 'Strategy';
  loading_data;
  entity_type_plural;
  entity_type_singular;

  lastFilters;

  debouceInst;
  isSeachFilterLoaded = false
  keywordConstants = keywordConstants;
  filteredListMeta = { count: 0, items: [] };
  entityID = filterEnum.entitiesSelection;
  private cancelOnNewRequest$: Subject<void> = new Subject<void>();
  firmwide_role_has_access = false;
  constructor(
    private readonly http: HttpClient,
    private readonly entityUtilsService: EntityUtilsService,
    private readonly investor: InvestorService,
    private readonly customModalService: CustomModalService
  ) {
    this.searchByFilters = this.searchByFilters.bind(this);
  }
  ngOnInit() {
    if (this.entityList.length > 0) {
      this.entityID = filterEnum.subEntitiesSection;
    }
    this.debouceInst = debouncer(this.searchByFilters, 500);
    this.getFiltersModalData();
    this.loading_entities = false;
    this.filters_data_loaded = false;
    this.filterApplied = false;

    const nameMapper = {
      Fund: 'Product',
      Firm: 'Firm',
      Strategy: 'Strategy',
      Vehicle: 'Vehicle',
      Investor: 'Investor',
    };
    this.entity_type_plural = nameMapper[this.entity_type] + 's';
    this.entity_type_singular = nameMapper[this.entity_type];
    if (this.entity_type === 'Strategy') {
      this.entity_type_plural = 'Strategies';
    }
    this.emptyContactMessage =
      this.emptyContactMessage ||
      ` This ${this.entity_type_singular} cannot be processed as no contact / recipient is associated with it!`;
    this.emptySearchResultMessage =
      this.emptySearchResultMessage ||
      `No ${this.entity_type_plural} available `;
    this.global_hierarchy_option = this.global_hierarchy_option.toLowerCase();

    this.filters = {
      include_contacts: this.standalone ? true : false,
      include_custom_fields: true,
      include_dates: true,
      filters: {},
      name: '',
    };
    this.filters_section = { show: false };
    this.select_all_entities = false;
    this.selected_list_filters_section = { show: false };
    this.selected_list_filters_section = this.investor.getEntitySelectorFilters(
      this.entityID
    );
    let tags = this.investor.getContactTags(this.entityID);
    this.contact_tags = tags.length ? tags : null;
    this.loadSelectedListFilterOptions();
    this.searchByFilters();
    this.watchForContactTagSelection();
  }

  ngOnDestroy(): void {
    this.entityUtilsService.responseCache = {};
    this.cancelOnNewRequest$.next();
    this.cancelOnNewRequest$.complete();
  }

  ngOnChanges(change: SimpleChanges) {
    if (change?.selection_list && change?.selection_list.currentValue) {
      this.selection_list.map((ent) => {
        if (!ent.is_selected) {
          this.removeFromSelection(ent);
        }
      });
      if (this.selection_list.length === 0) {
        this.entities = this.entities.map((val) => {
          val.is_selected = false;
          return { ...val };
        });
      }
    }
  }

  checkIfAnyBouncedEmail() {
    let bouncedEmailsList = [];
    this.selection_list.forEach((entity) => {
      entity.notification_contacts?.forEach((contact) => {
        if (contact?.has_bounce_history && !contact?.is_removed) {
          bouncedEmailsList.push(contact);
        }
      });
    });
    return bouncedEmailsList.length > 0;
  }

  deleteAllBouncedEmails() {
    this.selection_list.forEach((entity) => {
      entity.notification_contacts.forEach((contact) => {
        if (contact.has_bounce_history && !contact.is_removed) {
          contact.is_removed = true;
        }
      });
    });
  }

  /**
   * Added dvDropdownEvent from dv-select component
   * modifying list if filter is applied adding flag for filter
   */
  watchForContactTagSelection(dvDropdownEvent = null) {
    let value = dvDropdownEvent
      ? dvDropdownEvent
      : this.selected_list_filters_section.contact_id;
    this.disable_select_all = false;
    if (this.selection_list.length > 0) {
      this.selection_list.map((item) => {
        item.filter = false;
        if (item) {
          item.notification_contacts.map((fund_contact) => {
            fund_contact.is_removed = false;
            fund_contact.isFilterApplied = false;
          });
          item.total_recipients_count = this.getRecipientsCount(item);
        }
      });
      this.filteredListMeta.count = this.selection_list.length;
    }
    if (value) {
      this.selection_list.forEach((item) => {
        if (item) {
          item.filter = true; // added flag for recognize filter is applied
          item.notification_contacts.map((fund_contact) => {
            if (
              fund_contact.tag_ids != null &&
              !fund_contact.tag_ids.includes(value)
            ) {
              fund_contact.is_removed = true;
              fund_contact.isFilterApplied = false; // added flag for recognize record is filter out by the applied filter
            } else {
              fund_contact.is_removed = false;
              fund_contact.isFilterApplied = true; // added flag for recognize record is filter out by the applied filter
            }
          });
          item.total_recipients_count = this.getRecipientsCount(item);
        }
      });
      this.filteredListMeta.count = this.selection_list.filter(
        (x) => x.total_recipients_count
      ).length;
    }
    this.investor.updatedEntitySelectorFilters(
      this.entityID,
      this.selected_list_filters_section
    );
    this.updateSelectedlist();
  }

  getValidFunds(funds: any) {
    const valid_funds = [];
    funds.forEach((fund: { total_recipients_count: number }) => {
      if (fund.total_recipients_count > 0) {
        valid_funds.push(fund);
      }
    });
    return valid_funds;
  }
  updateSelectedlist() {
    let isValid = false;
    this.search_criterias.forEach((tag) => {
      if (tag?.advance_filter_value) {
        isValid = true;
      }
    });
    if (!isValid) {
      this.selection_list.forEach((en) => {
        delete en.search;
        delete en.ternaryOperator;
      });
    }
    this.changeList.emit({
      list: this.selection_list,
      search: this.search_criterias,
      ternaryOperator: this.global_ternary_operator,
      entities: this.entities,
      loadingEntities: this.loading_entities
    });
  }

  addToSelection(entities) {
    if (entities.is_disabled) return;
    const ids = this.selection_list.map((val) => val.id);
    if (!ids.includes(entities.id)) {
      entities.is_selected = true;
      if (this.global_ternary_operator == FILTER_TERNARY_OPERATORS.AND) {
        entities.search = this.search_criterias;
      } else {
        entities.search = this.lastFilters;
      }
      entities.ternaryOperator = this.global_ternary_operator;
      this.selection_list.push(entities);
      this.watchForContactTagSelection();
      this.updateSelectedlist();
    }
  }

  removeFromSelection(strategy: any) {
    this.handleDeselection([strategy]);
    this.selection_list.splice(this.selection_list.indexOf(strategy), 1);
    this.selection_list = JSON.parse(JSON.stringify(this.selection_list));
    this.updateSelectedlist();
    this.filteredListMeta.count = this.selection_list.length;
  }

  clearSelection() {
    this.handleDeselection(this.selection_list);
    this.selection_list.length = 0;
    this.disable_select_all = false;
    this.select_all_entities = false;
    this.display_selection_warning = false;
    this.selected_list_filters_section.show = false;
    this.selection_list = JSON.parse(JSON.stringify(this.selection_list));
    this.selected_list_filters_section.contact_id = null;
    this.investor.updatedEntitySelectorFilters(
      this.entityID,
      this.selected_list_filters_section
    );
    this.updateSelectedlist();
  }

  handleDeselection(entity) {
    entity.forEach((ent: any) => {
      const strategy_from_main_list = this.entities.find(
        (val) => val.id === ent.id
      );
      if (strategy_from_main_list != null) {
        strategy_from_main_list.is_selected = false;
      }
      this.select_all_entities = false;
      this.display_selection_warning = false;
    });
  }

  selectAll() {
    const ids = this.selection_list.map((val) => val.id);
    this.entities.forEach((entities: any) => {
      if (entities.is_disabled) return;
      if (!ids.includes(entities.id)) {
        entities.is_selected = true;
        if (this.global_ternary_operator == FILTER_TERNARY_OPERATORS.AND) {
          entities.search = this.search_criterias;
        } else {
          entities.search = this.lastFilters;
        }
        entities.notification_contacts.map((fund_contact) => {
          fund_contact.is_removed = false;
          fund_contact.isFilterApplied = false;
        });
        entities.ternaryOperator = this.global_ternary_operator;
        this.selection_list.push(entities);
      }
      this.display_selection_warning = true;
      this.disable_select_all = true;
    });
    this.filteredListMeta.count = this.selection_list.length;
    this.watchForContactTagSelection();
    this.updateSelectedlist();
  }

  openNewEntityDialog() {
    const nameMapper = {
      Fund: 'manage-fund',
      Firm: 'manage-firm',
      Strategy: 'manage-fund',
      Vehicle: 'manage-vehicle',
      Investor: 'manage-firm',
    };
    this.customModalService.invoke(nameMapper[this.entity_type], {
      initialState: {
        fund_type: this.entity_type == 'Strategy' ? 'strategy' : 'fund',
        isDDqCloseModel: true,
        response: (multipleEntities: any) => {
          if (this.entity_type.toLowerCase() === 'vehicle') {
            this.entities = [...this.entities, multipleEntities];
            this.entities_copy = [...this.entities_copy, multipleEntities];
            this.addToSelection(multipleEntities);
          } else {
            this.entities = [...this.entities, multipleEntities];
            this.entities_copy = [...this.entities_copy, multipleEntities];
            this.addToSelection(multipleEntities);
          }
        },
      },
      class: 'gray modal-lg',
    });
  }

  markStrategySelection(entities: any) {
    const ids = this.selection_list.map((val) => val.id);
    let dic = {};
    this.selection_list.forEach((val) => {
      dic[val.id] = val;
    });
    entities.filter((ent: { is_selected: any; id: any }) => {
      if (ids.includes(ent.id)) {
        ent.is_selected = true;
        if (this.global_ternary_operator == FILTER_TERNARY_OPERATORS.AND) {
          dic[ent.id].search = this.search_criterias;
          dic[ent.id].ternaryOperator = this.global_ternary_operator;
        } else {
          if (!dic[ent.id].search) dic[ent.id].search = this.lastFilters;
        }
      } else ent.is_selected = false;
    });
    this.selection_list = Object.values(dic);
    dic = {};
    this.updateSelectedlist();
  }

  toggleSelectedListFiltersSection() {
    this.selected_list_filters_section.show =
      !this.selected_list_filters_section.show;

    if (this.selected_list_filters_section.show) {
      this.loadSelectedListFilterOptions();
    }
    this.investor.updatedEntitySelectorFilters(
      this.entityID,
      this.selected_list_filters_section
    );
  }

  resetSelectedListFilters() {
    this.selected_list_filters_section.contact_id = null;
    this.watchForContactTagSelection();
  }

  loadSelectedListFilterOptions() {
    if (!this.contact_tags) {
      const params = { Type: 'Contact' };
      this.http
        .get('tags', { params: params })
        .pipe(takeUntil(this.cancelOnNewRequest$))
        .subscribe((response: any) => {
          this.contact_tags = response;
          this.investor.storeContactTags(this.entityID, response);
        });
    }
  }

  getRecipientsCount(fund: any) {
    let selected_contacts = 0;
    fund.notification_contacts.forEach((contact: { is_removed: any }) => {
      if (!contact.is_removed) {
        selected_contacts += 1;
      }
    });
    return selected_contacts;
  }

  setContactRemovalState(
    fund: { total_recipients_count: number },
    contact: { is_removed: any },
    state: any
  ) {
    contact.is_removed = state;
    fund.total_recipients_count = this.getRecipientsCount(fund);
    this.updateSelectedlist();
  }

  addNewContact(entity) {
    let fund = {
      id: entity.fund_id,
      name: entity.fund_name,
      firm_id: entity.firm_id,
      firm_name: entity.firm_name,
      notification_contacts: entity.notification_contacts,
      display_name: entity.display_name,
    };
    this.customModalService.invoke('manage-contact', {
      initialState: {
        isDDqCloseModel: true,
        entity_details:
          this.entity_type.toLowerCase() ===
          this.keywordConstants.Vehicle.toLowerCase()
            ? fund
            : entity,
        entity_type:
          this.entity_type.toLowerCase() ===
          this.keywordConstants.Vehicle.toLowerCase()
            ? this.keywordConstants.Product.toLowerCase()
            : this.entity_type.toLowerCase(),
        response: (contacts) => {
          if (contacts.length > 0) {
            contacts.forEach((contact) => {
              if (contact.associated_funds.length > 0) {
                // vehicle and product
                contact.associated_funds.forEach((association: any) => {
                  const notifContact = {
                    email: contact.userName,
                    entity_id: association,
                    id: contact.id,
                    name: contact.fullName,
                    relationship_status_id: contact.relationship_status_id,
                    relationship_status_name: contact.relationship_status,
                    tag_ids: contact.contact_types.map((val) => val.id),
                  };

                  let localComparator =
                    this.entity_type.toLowerCase() === 'fund'
                      ? 'id'
                      : 'fund_id';
                  this.setNotificationContact(
                    notifContact,
                    association,
                    localComparator
                  );
                });
              }
              // strategies
              if (contact.associated_strategies.length > 0) {
                contact.associated_strategies.forEach((association: any) => {
                  const notifContact = {
                    email: contact.userName,
                    entity_id: association,
                    id: contact.id,
                    name: contact.fullName,
                    relationship_status_id: contact.relationship_status_id,
                    relationship_status_name: contact.relationship_status,
                    tag_ids: contact.contact_types.map((val) => val.id),
                  };
                  this.setNotificationContact(notifContact, association);
                });
              }
              // firm
              if (
                this.entity_type.toLowerCase() ===
                this.keywordConstants.Firm.toLowerCase()
              ) {
                let comparator = contact.firmInfo.id;
                const notifContact = {
                  email: contact.userName,
                  entity_id: comparator,
                  id: contact.id,
                  name: contact.fullName,
                  relationship_status_id: contact.relationship_status_id,
                  relationship_status_name: contact.relationship_status,
                  tag_ids: contact.contact_types.map((val) => val.id),
                };
                this.setNotificationContact(notifContact, comparator);
              }
            });
          }
        },
      },
      class: 'gray modal-lg',
    });
  }

  setNotificationContact(
    notifContact: any,
    comparator: any,
    localComparator = 'id'
  ) {
    const updatedEntity = (entityItem: any) => {
      if (entityItem[localComparator] === comparator) {
        entityItem.notification_contacts.push(notifContact);
      }
      return JSON.parse(JSON.stringify(entityItem));
    };
    this.selection_list = this.selection_list.map(updatedEntity);
    this.entities = this.entities.map(updatedEntity);
    this.entities_copy = this.entities_copy.map(updatedEntity);
  }

  getFiltersModalData() {
    this.http
      .post('service/dvapi_service/search_filters', {
        entity_type:
          this.entity_type.toLowerCase() === 'investor'
            ? 'firm'
            : this.entity_type.toLowerCase(),
      })
      .pipe(takeUntil(this.cancelOnNewRequest$))
      .subscribe((response: any) => {
        this.search_filters_response = response;
        this.filters_data_loaded = true;

        this.search_filters_response.default_filters.map((val, index) => {
          if (val.hasOwnProperty('endpoint')) {
            this.getDynamicDefaultFilterOptions(val, index);
          }
        });
        this.search_filters_response.custom_filters.map((val, index) => {
          if (val.hasOwnProperty('endpoint')) {
            this.getDynamicCustomFilterOptions(val, index);
          }
        });
        this.isSeachFilterLoaded = true
      });
  }

  getDynamicCustomFilterOptions(filter: any, index: string | number) {
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

  getDynamicDefaultFilterOptions(filter: any, index: string | number) {
    this.entityUtilsService
      .getDynamicDefaultFilterOptions(filter)
      ?.subscribe((response) => {
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

  toggleFiltersSection() {
    this.customModalService.invoke('manage-custom-search', {
      initialState: {
        custom_filters_data: {
          global_ternary_operator: this.global_ternary_operator,
          search_filters_response: this.search_filters_response,
          search_criterias: this.search_criterias,
        },
        success: (response: {
          search_criterias: any;
          global_ternary_operator: any;
          searchByFiltersParams: any;
        }) => {
          this.search_criterias.length = 0;
          this.search_criterias = response.search_criterias;
          this.global_ternary_operator = response.global_ternary_operator;
          let tempFilters = JSON.parse(JSON.stringify(this.search_criterias));
          this.lastFilters = tempFilters;
          if (Object.keys(response.searchByFiltersParams).length > 0) {
            this.filterApplied = true;
            this.applyFiltersSearch(response.searchByFiltersParams);
          } else {
            this.resetFiltersData();
          }
        },
      },
      class: 'modal-xl',
    });
  }

  handleFilterChange() {
    if (this.filters.name.trim().length) {
      this.entities = this.entities_copy.filter((x) =>
        `${x.name}`
          .toLowerCase()
          .includes(`${this.filters.name}`.trim().toLowerCase())
      );
    } else {
      this.entities = JSON.parse(JSON.stringify(this.entities_copy));
    }

    this.entities.map((x) => {
      x.is_selected = this.selection_list.find(
        (se) => se.id === x.id
      )?.is_selected;
    });
  }

  applyFiltersSearch(filter_params) {
    if (this.filters.name) {
      const nameFilterParams = {
        filter_key: 'name',
        filter_name: 'Name',
        type: 'text',
        operations: 'contains',
        filter_value: this.filters.name,
      };
      filter_params.filters[this.global_ternary_operator].push(
        nameFilterParams
      );
    }
    filter_params.include_custom_fields = false;
    filter_params.is_active = true;
    filter_params.new_request = true;
    this.modifyFilters(filter_params);
    this.loading_entities = true;

    const apiMap = {
      strategy: 'product_search',
      fund: 'fund_search',
      firm: 'firm_search',
      investor: 'firm_search',
      vehicle: 'vehicle_search',
    };

    const promises = [
      this.http.post(
        'service/dvapi_service/' + apiMap[this.entity_type.toLowerCase()],
        filter_params
      ),
      this.http.get(
        `project_entity_permissions?entity_type=${this.entity_type}`
      ),
    ];

    forkJoin(promises)
      .pipe(takeUntil(this.cancelOnNewRequest$))
      .subscribe(([response, permissionEntities]) => {
        const { firmwide_role_has_access, permissions } =
          permissionEntities as any;
        this.firmwide_role_has_access = firmwide_role_has_access;
        let entityPermissions = [];
        if (!firmwide_role_has_access) {
          entityPermissions = permissions;
        }
        this.loading_entities = false;
        this.modifyList(response, entityPermissions);
        this.disable_select_all = false;
        this.markStrategySelection(this.entities);
      });
  }

  setRestrictedEntities(entities: any[], permissions = []) {
    entities.forEach((entity) => {
      if (!permissions.includes(entity.id) && !this.firmwide_role_has_access) {
        entity.is_disabled = true;
      } else {
        entity.is_disabled = false;
      }
    });
  }

  modifyList(response, permissions = []) {
    if (
      this.entityList &&
      this.entity_type.toLowerCase() === 'vehicle' &&
      this.entityList.length > 0
    ) {
      const ids = this.entityList.map((val) => val.id);
      this.entities = response.data.filter((vehicle) =>
        ids.includes(vehicle.fund_id)
      );
    } else {
      this.entities = JSON.parse(JSON.stringify(response.data));
    }
    this.setRestrictedEntities(this.entities, permissions);
    this.entities_copy = JSON.parse(JSON.stringify(this.entities));
  }

  modifyFilters(filter_params) {
    if (this.entity_type.toLowerCase() === 'fund') {
      if (this.entityList && this.entityList.length > 0) {
        filter_params['fund_like_entities_id'] = [];
        this.entityList.map((val) => {
          filter_params.fund_like_entities_id.push(val.id);
        });
      } else {
        filter_params.fund_like_entities_id = [];
      }
    } else {
      filter_params.search_for = this.global_hierarchy_option;
      if (filter_params.filters[this.global_ternary_operator].length === 0) {
        filter_params.filters = {};
        filter_params.search_for = this.global_hierarchy_option;
      }
    }
  }

  resetFiltersData() {
    this.global_ternary_operator = FILTER_TERNARY_OPERATORS.AND;
    this.search_criterias.length = 0;
    this.filterApplied = false;
    this.searchByFilters();
  }

  removeFilterCriterion(index: number) {
    if (index < this.search_filters_response.default_filters.length) {
      this.search_criterias[index].advance_filter_value = '';
    } else {
      this.search_criterias.splice(index, 1);
    }
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
    } else {
      this.filterApplied = true;
    }
    const params = {
      include_contacts: true,
      include_custom_fields: false,
      include_dates: true,
      filters: { [this.global_ternary_operator]: [] },
    };
    searchByFiltersData.map((filter) => {
      const filter_params = {
        filter_key: filter.criteria_obj.filter_key,
        filter_name: filter.criteria_obj.filter_name,
        type: filter.criteria_obj.type,
        operations: filter.condition,
        filter_value: filter.advance_filter_value,
      };
      params.filters[this.global_ternary_operator].push(filter_params);
    });
    this.applyFiltersSearch(params);
  }

  displayFilter(criterion: any) {
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
        displayedDate = `${startDate} to  ${endDate}`;
      } else {
        displayedDate = moment(criterion.advance_filter_value).format(
          'YYYY-MM-DD'
        );
      }
      displayedFilter = `${criterion.criteria_obj.filter_name} : ${displayedDate}`;
    } else {
      if (criterion.criteria_obj.hasOwnProperty('options')) {
        for (let option of Array.from(criterion.criteria_obj.options)) {
          if (option['id'] === criterion.advance_filter_value) {
            value = option['value'];
          }
        }
      }

      displayedFilter = value
        ? `${criterion.criteria_obj.filter_name} : ${value}`
        : `${criterion.criteria_obj.filter_name} : ${criterion.advance_filter_value}`;
    }
    return displayedFilter;
  }

  trackById(index: number, val: any): number {
    return val.id;
  }
}
