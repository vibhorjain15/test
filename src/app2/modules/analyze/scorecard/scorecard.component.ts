import { HttpClient } from '@angular/common/http';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Select } from '@ngxs/store';

import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';
import { take, finalize } from 'rxjs/operators';
import { DvApiSearchService } from 'src/app2/services/dvapi-service/dvapi-service.service';
import { RatingScalesService } from 'src/app2/services/rating-scales/rating-scales.service';
import { RatingSchemesService } from 'src/app2/services/rating-schemes/rating-schemes.service';
import { IRatingSchemeServiceRoot } from 'src/app2/services/rating-schemes/rating-schemes.type';
import { RatingTypesService } from 'src/app2/services/rating-types/rating-types.service';
import { IRatingtypes } from 'src/app2/services/rating-types/rating-types.type';
import { UtilsService } from 'src/app2/services/utils.service';
import { IRatingScaleDefinition } from 'src/app2/shared/components/heatmap/heatmap.type';
import {
  FILTER_TERNARY_OPERATORS,
  headerConstants,
  hierarchyConstants,
  keywordConstants,
} from 'src/app2/shared/constants/constant';
import { UserState } from 'src/app2/store/user/user.state';
import { EntityUtilsService } from '../../../utils/entity-utils.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { ColorTheme } from 'src/app2/shared/themes/color.themes';
import { DateRangePickerComponent } from 'src/app2/shared/components/date-range-picker/date-range-picker.component';

type EntityType = {
  name: string;
  label: string;
  icon: string;
  size: string;
  getUrl: string;
};
@Component({
  selector: 'app-score-card',
  templateUrl: './scorecard.component.html',
  styleUrls: ['./scorecard.component.css'],
})
export class ScorecardComponent implements OnInit, OnDestroy {
  @ViewChild('dateRangePicker') dateRangePicker: DateRangePickerComponent;

  headerConstants = headerConstants;
  scorecardForm: FormGroup;
  showAdvanceOptions: boolean = true;
  heatmapColor: Map<number, IRatingScaleDefinition[]> = new Map<
    number,
    IRatingScaleDefinition[]
  >();
  currentRatingType;
  minDate: any;
  global_hierarchy_option: any;

  isInitialLoad: boolean = true;
  includeAverageLabel: string =
    '<span class="font-weight-600">Include Average </span>';
  includePeerAverageLabel: string =
    '<span class="font-weight-600">Include Peer Average </span>';
  includePortfolioAverageLabel: string =
    '<span class="font-weight-600">Include Portfolio Average </span>';
  portfolioDateLabel: string;
  filterApplied: boolean;
  entityTypes: EntityType[];

  global_ternary_operator: any;
  global_ternary_operator_for_peer: any;
  heatmap_options: {
    heatmap_orientation: string;
    invertColor: boolean;
    hide_dates: boolean;
  };
  entityList: any;
  peerEntityList: any = [];
  loading_prefs: boolean = false;
  predefinedDate: any;
  customDateFilter: any;
  entity_type: EntityType;
  search_filters_response: any;
  search_criterias: {};
  search_criterias_for_peer_search: {};
  filters_data_loaded: boolean;
  filters_peer_data_loaded: boolean;
  search_filters_for_peer_search: {
    response_type: any;
    default_filters: any;
    custom_filters: any;
  };
  rating_types: IRatingtypes[];
  loading_entities: boolean = true;
  loading_peer_entities: boolean;
  filterAppliedPeer: boolean;

  loading_heatmap: boolean;
  heatmapResponse: any;
  maxDate: Date;
  dateRangeRatingScheme;

  heatmapFilterConfig = {
    isAverage: true,
    isDecimal: true,
    isWeightage: true,
  };
  @Select(UserState.getFirmPreferenceData) firmPref;
  diligencesToRefresh: number[] = [];
  recalculating: boolean;
  submitted = false;

  colorTheme = ColorTheme;
  isFullScreenMode: boolean = false;

  constructor(
    private readonly http: HttpClient,
    private readonly toaster: ToastrService,
    private readonly Utils: UtilsService,
    private readonly RatingTypesService: RatingTypesService,
    private readonly DvApiSearchService: DvApiSearchService,
    private readonly RatingScalesService: RatingScalesService,
    private readonly RatingSchemesService: RatingSchemesService,
    private readonly customModalServuce: CustomModalService,
    private readonly entityUtilsService: EntityUtilsService
  ) {}

  ngOnInit() {
    this.setEntityTypes();
    this.init();
  }

  setEntityTypes() {
    this.entityTypes = [
      {
        name: keywordConstants.Firm,
        label: this.Utils.getDisplayEntityType(keywordConstants.Firm),
        icon: 'institution',
        size: '1x',
        getUrl: 'service/dvapi_service/firm_search',
      },
      {
        name: keywordConstants.Strategy,
        label: this.Utils.getDisplayEntityType(keywordConstants.Strategy),
        icon: 'strategy',
        size: '1x',
        getUrl: 'service/dvapi_service/product_search',
      },
      {
        name: keywordConstants.Product,
        label: this.Utils.getDisplayEntityType(keywordConstants.Product),
        icon: 'fund',
        size: '1x',
        getUrl: 'service/dvapi_service/fund_search',
      },
      {
        name: keywordConstants.Vehicle,
        label: this.Utils.getDisplayEntityType(keywordConstants.Vehicle),
        icon: 'vehicle-car',
        size: '1x',
        getUrl: 'service/dvapi_service/vehicle_search',
      },
    ];
  }

  ngOnDestroy(): void {
    this.entityUtilsService.responseCache = {};
  }

  init() {
    this.scorecardForm = new FormGroup({
      rating_scheme: new FormControl(null, Validators.required),
      fetch_latest: new FormControl(false),
      include_portfolio_as_of_date: new FormControl(null),
      as_of_date: new FormControl(new Date()),
      include_peer_average: new FormControl(false, [
        this.validatePeerAverage.bind(this),
      ]),
      include_average: new FormControl(false),
    });

    this.minDate = moment().subtract(5, 'years').toDate();
    this.global_hierarchy_option = hierarchyConstants.Strategy;

    this.portfolioDateLabel = 'Include all data';
    this.filterApplied = false;
    this.global_ternary_operator = FILTER_TERNARY_OPERATORS.AND;
    this.global_ternary_operator_for_peer = FILTER_TERNARY_OPERATORS.AND;
    this.global_hierarchy_option = hierarchyConstants.Strategy;
    this.entityList = [];
    this.peerEntityList = [];
    this.getRatingSchemes();
    this.getFirmPref();
  }

  get form() {
    return this.scorecardForm.controls;
  }

  validatePeerAverage(control: AbstractControl): ValidationErrors | null {
    const include_peer_average: boolean = control.value;
    return include_peer_average &&
      (!this.peerEntityList || this.peerEntityList.length === 0)
      ? {
          include_peer_entities: `Please select peer ${this.entity_type.label}(s)`,
        }
      : null;
  }

  getFirmPref() {
    this.loading_prefs = true;
    this.firmPref.pipe(take(1)).subscribe((response) => {
      if (response) {
        if (response.default_daterange_months) {
          this.customDateFilter = this.Utils.getPredefinedDateRanges(
            response.default_daterange_months
          );
          this.dateRangeRatingScheme = {
            startDate: this.Utils.formatDatetime(
              this.customDateFilter.startDate
            ),
            endDate: this.Utils.formatDatetime(this.customDateFilter.endDate),
            range: response?.default_daterange_months ?? 'null',
          };
        } else {
          this.dateRangeRatingScheme = null;
        }
        if (response.set_firm_entity_default) {
          this.entityTypes?.forEach((entity) => {
            if (entity.name === response.set_firm_entity_default) {
              this.setEntityType(entity);
            }
          });
        } else {
          this.setEntityType(this.entityTypes[0]);
        }
        this.setPorfolioDateLabel();
        this.loading_prefs = false;
      }
    });
  }

  getSearchFilters() {
    this.DvApiSearchService.getSearchFilters(
      {
        entity_type: this.entity_type.name.toLowerCase(),
      },
      (response) => {
        let filter: { hasOwnProperty: (arg0: string) => any }, index: number;
        this.search_filters_response = response;
        this.search_criterias = [];
        this.search_criterias_for_peer_search = [];
        this.filters_data_loaded = true;
        this.filters_peer_data_loaded = true;
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

        return (this.search_filters_for_peer_search = {
          response_type: this.search_filters_response.response_type,
          default_filters: this.search_filters_response.default_filters.filter(
            (filter: { filter_key: string }) => {
              return filter.filter_key !== 'name';
            }
          ),
          custom_filters: this.search_filters_response.custom_filters.filter(
            (filter: { filter_key: string }) => {
              return filter.filter_key !== 'name';
            }
          ),
        });
      }
    );
  }

  setPorfolioDateLabel() {
    if (!this.dateRangeRatingScheme?.startDate) {
      this.portfolioDateLabel = 'Include all dates';
    } else {
      this.portfolioDateLabel =
        'Include from ' +
        moment(this.dateRangeRatingScheme?.startDate).format('ll') +
        ' to ' +
        moment(this.dateRangeRatingScheme.endDate).format('ll');
    }
  }

  getRatingSchemes() {
    this.RatingTypesService.getAllRatingType(
      (response: IRatingtypes[]) => {
        this.rating_types = response;
      },
      () => {}
    );
  }

  onDateRangeRatingSchemeChange(event) {
    if (event && event.startDate && event.endDate) {
      this.applyMethod(
        this.Utils.formatDatetime(event.startDate),
        this.Utils.formatDatetime(event.endDate),
        event.range
      );
    }
  }

  onClearDateFilter() {
    this.dateRangePicker.dateRange = null;
    setTimeout(() => {
      this.dateRangeRatingScheme = null;
    });
  }

  applyMethod(startDate, endDate, range) {
    this.dateRangeRatingScheme = {
      startDate,
      endDate,
      range,
    };
  }

  setEntityType(type: EntityType) {
    this.submitted = false;
    this.entity_type = type;
    this.loading_entities = true;
    this.getEntities({
      include_contacts: true,
      include_custom_fields: true,
      include_dates: true,
      is_active: true,
      filters: { [this.global_ternary_operator]: [] },
    }),
      this.getSearchFilters();
    this.filterApplied = false;
  }

  filterEntities() {
    this.customModalServuce.invoke('manage-custom-search', {
      initialState: {
        custom_filters_data: {
          global_ternary_operator: this.global_ternary_operator,
          search_filters_response: this.search_filters_response,
          search_criterias: this.search_criterias,
        },
        success: (response: {
          search_criterias: any;
          global_ternary_operator: any;
          searchByFiltersParams: { [x: string]: boolean };
        }) => {
          this.search_criterias = response.search_criterias;
          this.global_ternary_operator = response.global_ternary_operator;
          this.loading_entities = true;
          if (Object.keys(response.searchByFiltersParams).length !== 0) {
            this.filterApplied = true;
            response.searchByFiltersParams['search_for'] =
              this.global_hierarchy_option;
            response.searchByFiltersParams['is_active'] = true;
            this.getEntities(response.searchByFiltersParams);
          } else {
            this.filterApplied = false;
            this.getEntities({
              include_contacts: true,
              include_custom_fields: true,
              include_dates: true,
              is_active: true,
              search_for: this.global_hierarchy_option,
              filters: { [this.global_ternary_operator]: [] },
            });
          }
        },
      },
      class: 'modal-xl',
    });
  }

  filterPeerEntities() {
    this.customModalServuce.invoke('manage-custom-search', {
      initialState: {
        custom_filters_data: {
          global_ternary_operator: this.global_ternary_operator_for_peer,
          search_filters_response: this.search_filters_for_peer_search,
          search_criterias: this.search_criterias_for_peer_search,
        },
        success: (response: {
          search_criterias: any;
          global_ternary_operator: any;
          searchByFiltersParams: { [x: string]: any };
        }) => {
          this.search_criterias_for_peer_search = response.search_criterias;
          this.global_ternary_operator_for_peer =
            response.global_ternary_operator;
          this.loading_peer_entities = true;
          if (Object.keys(response.searchByFiltersParams).length !== 0) {
            this.filterAppliedPeer = true;
            response.searchByFiltersParams['search_for'] =
              this.global_hierarchy_option;
            this.getPeerEntities(response.searchByFiltersParams as any);
          } else {
            this.filterAppliedPeer = false;
            this.getPeerEntities({
              include_contacts: true,
              include_custom_fields: true,
              is_active: true,
              include_dates: true,
              search_for: this.global_hierarchy_option,
              filters: { [this.global_ternary_operator]: [] },
            });
          }
        },
      },
      class: 'modal-xl',
    });
  }

  getEntities(filters: {
    include_contacts?: boolean;
    include_custom_fields?: boolean;
    include_dates?: boolean;
    is_active?: boolean;
    filters?: { [x: number]: {} } | { [x: number]: {} };
    search_for?: any;
  }) {
    if (this.entity_type.name === keywordConstants.Strategy) {
      filters.search_for = this.global_hierarchy_option;
    }

    let currentType = this.entity_type;

    this.DvApiSearchService.getEntityTypeData(
      currentType.getUrl,
      filters,
      (response) => {
        if (currentType === this.entity_type) {
          this.entityList = response;
        }
        this.loading_entities = false;
        this.filterApplied = false;
      }
    );
  }

  getPeerEntities(filters: {
    include_contacts: boolean;
    include_custom_fields: boolean;
    is_active: boolean;
    include_dates: boolean;
    search_for: any;
    filters: { [x: number]: {} };
  }) {
    return this.http
      .post(this.entity_type.getUrl, filters)
      .subscribe((response: { data: any }) => {
        this.peerEntityList = response.data;
        this.loading_peer_entities = false;
        this.filterAppliedPeer = false;
        const control = this.scorecardForm.get('include_peer_average');
        control.markAsTouched();
        control.updateValueAndValidity();
      });
  }

  getRatingsData() {
    this.submitted = true;
    this.scorecardForm.markAllAsTouched();
    if (this.scorecardForm.invalid) {
      return;
    }
    if (!this.entityList || this.entityList.length === 0) {
      this.toaster.error(
        'Please select peer ' + this.entity_type.label + '(s)'
      );
      return;
    }
    if (
      this.scorecardForm.value.include_peer_average &&
      (!this.peerEntityList || this.peerEntityList.length === 0)
    ) {
      this.toaster.error(
        'Please select peer ' + this.entity_type.label + '(s)'
      );
      return;
    }

    this.isInitialLoad = false;
    this.loading_heatmap = true;
    this.heatmapResponse = null;
    if (!!this.scorecardForm.value.rating_scheme) {
      this.getRatingScalesData();
    }
  }

  getRatingScalesData() {
    this.RatingScalesService.getRatingScaleDefinitionsByRatingScheme(
      this.scorecardForm.value.rating_scheme
    ).subscribe(
      (response) => {
        Object.keys(response).forEach((key) => {
          this.heatmapColor.set(parseInt(key), response[key]);
        });
        this.getHeatmapResponse();
      },
      (e) => {
        this.loading_heatmap = false;
      }
    );
  }

  getHeatmapResponse() {
    const {
      rating_scheme,
      include_average,
      include_peer_average,
      fetch_latest,
      include_portfolio_as_of_date,
      as_of_date,
    } = this.scorecardForm.value;
    const params: any = {
      fetch_latest: fetch_latest,
      entity_ids: {
        [this.entity_type.name.toLowerCase()]: this.entityList.map(
          (val) => val.id
        ),
      },
      include_portfolio:
        !!include_portfolio_as_of_date &&
        include_portfolio_as_of_date !== 'specificDate',
      include_peer: !!include_peer_average,
      peer_entity_ids: !!include_peer_average
        ? {
            [this.entity_type.name.toLowerCase()]: this.peerEntityList.map(
              (val) => val.id
            ),
          }
        : undefined,
      include_portfolio_with_as_of_date:
        include_portfolio_as_of_date === 'specificDate',
      as_of_date:
        include_portfolio_as_of_date === 'specificDate'
          ? this.Utils.formatDatetime(as_of_date)
          : undefined,
      include_average: !!include_average,
    };
    params.start_date = this.dateRangeRatingScheme?.startDate;
    params.end_date = this.dateRangeRatingScheme?.endDate;
    this.RatingSchemesService.getRatingScoreAnalysis(
      rating_scheme,
      params,
      (response: IRatingSchemeServiceRoot) => {
        this.heatmapResponse = response;
        this.diligencesToRefresh = this.heatmapResponse?.data
          ?.filter((x) => x.recalculation_needed)
          .map((y) => y.duediligence_id);
        this.currentRatingType = this.rating_types.find(
          (val) => val.id === this.scorecardForm.value.rating_scheme
        );
        this.loading_heatmap = false;
      }
    );
  }

  recalculate() {
    this.recalculating = true;
    const params = {
      duediligence_ids: this.diligencesToRefresh,
      from_heatmap: true,
    };
    this.http
      .post('diligences/recalculate_score', params)
      .pipe(finalize(() => (this.recalculating = false)))
      .subscribe((response: any) => {
        this.toaster.success(
          'You will receive an email once it is done.',
          'Recalculation in progress'
        );
        this.diligencesToRefresh = [];
      });
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

  onChangePortfolioAverage(date) {
    this.scorecardForm.patchValue({
      as_of_date: date,
    });
  }

  clearFilters() {
    this.scorecardForm.reset();
    this.onChangePortfolioAverage(new Date());
    this.onClearDateFilter();
  }

  resetAdvancedFiltersOnly(): void {
    this.scorecardForm.patchValue({
      include_portfolio_as_of_date: null,
      as_of_date: new Date(),
      include_peer_average: false,
      include_average: false,
    });
  }

  onFullScreenModeToggle(isFullScreenMode: boolean): void {
    this.isFullScreenMode = isFullScreenMode;
  }
}
