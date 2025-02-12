import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';
import { ComparisonAngularDataService } from 'src/app2/services/comparison/comparison.service';
import { RouterService } from 'src/app2/services/router.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { ratingConstants } from 'src/app2/shared/constants/constant';
import { Location } from '@angular/common';
import { UserState } from 'src/app2/store/user/user.state';
import { Select } from '@ngxs/store';
import { take } from 'rxjs/operators';
import { DateRangePickerComponent } from 'src/app2/shared/components/date-range-picker/date-range-picker.component';
import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'due-diligence-list',
  templateUrl: './due-diligence-list.component.html',
  styleUrls: ['./due-diligence-list.component.css'],
})
export class DueDiligenceList implements OnInit {
  ddlForm: FormGroup;
  dateRangeRatingScheme: any;

  due_diligences: any;
  selectedTemplate: any;
  selectedTemplateName: any;
  filters: any = {};
  selectedDueDiligences: any;
  is_manager: any;
  is_vendor: any;
  entity_sub_type: any;
  max_comparisons: number;
  isLoading: boolean;
  showPannel: boolean;
  ratingScheme: any;
  selectedDDsArray: any;
  rating_scale_id: any;
  templates: any;
  strategies: any;
  savedData: any;
  customDateFilter: {
    startDate: any;
    endDate: any;
    selectedRange: any;
    range?: any;
  };
  loading_prefs: boolean;
  defaultDateRange: any;
  defaultCustomDateFilter: any;

  tilesRendered: boolean = true;
  rating_scales: any;
  naValue: any;
  stateParams;
  @Select(UserState.getCurrentUserData) user;
  @Select(UserState.getSubscriptionLimitsData) subList;
  @Select(UserState.getFirmPreferenceData) firmPref;
  @ViewChild('dateRangePicker') dateRangePicker: DateRangePickerComponent;
  isTemplate: boolean;
  constructor(
    private readonly Utils: UtilsService,
    private readonly http: HttpClient,
    private readonly ComparisonService: ComparisonAngularDataService,
    private readonly toaster: ToastrService,
    private readonly router: RouterService,
    private readonly location: Location,
    private routerState: ActivatedRoute
  ) {}
  ngOnInit() {
    this.stateParams = this.router.getState(this.routerState).params;
    this.ddlForm = new FormGroup({
      templateName: new FormControl(null, Validators.required),
      entity_sub_type: new FormControl(null),
    });
    this.getFirmPref();
    this.due_diligences = [];
    this.selectedTemplate = null;
    this.selectedTemplateName = null;
    this.filters = {};
    this.selectedDueDiligences = [];
    this.max_comparisons = 10;
    this.isLoading = false;
    this.showPannel = false;
    this.ratingScheme = null;
    this.selectedDDsArray = [];
    this.user.pipe(take(1)).subscribe((user) => {
      if (user) {
        this.is_manager = user.isManager;
        this.is_vendor = user.isVendorSubscription;
        this.subList.pipe(take(2)).subscribe((sub) => {
          if (sub) this.entity_sub_type = this.Utils.getEntityType(sub[0]);
        });
      }
    });

    this.http
      .get('templates', { params: { in_use: true } })
      .subscribe((response: any) => {
        this.templates = response;
        this.isTemplate = false;
        if (this.stateParams?.keepData) {
          this.savedData = this.ComparisonService.getSelections();
          if (this.savedData != null && this.savedData.filters) {
            this.filters = this.savedData.filters;
            this.selectedDueDiligences = this.savedData.selectedDiligences;
            this.customDateFilter = {
              ...this.customDateFilter,
              startDate: this.filters?.start_date,
              endDate: this.filters?.end_date,
              selectedRange: this.filters?.selectedRange,
            };
            if (this.customDateFilter.selectedRange == 'No Filter') {
              this.dateRangeRatingScheme = null;
            } else {
              this.dateRangeRatingScheme = JSON.parse(
                JSON.stringify(this.customDateFilter)
              );
            }

            this.ddlForm.patchValue({
              templateName: this.filters.template_id,
              entity_sub_type: this.filters.strategy_id,
            });
            this.customDateFilter = {
              startDate: this.filters.start_date
                ? moment(this.filters.start_date)
                : null,
              endDate: this.filters.end_date
                ? moment(this.filters.end_date)
                : null,
              selectedRange: this.filters.selectedRange,
            };
            this.fetchDiligences(true);
            this.getRatingScale();
          } else {
            this.resetUrl();
          }
        }
      });

    if (this.is_vendor) {
      this.http.get('vendor_types').subscribe((response: any) => {
        this.strategies = response;
      });
    } else {
      this.http
        .get('strategies', { params: { in_use: true } })
        .subscribe((response: any) => {
          this.strategies = [
            { name: 'All Classifications', id: -1 },
            ...response,
          ];
          this.ddlForm.patchValue({
            entity_sub_type: -1,
          });
        });
    }
  }

  getFirmPref() {
    this.loading_prefs = true;
    this.firmPref.pipe(take(2)).subscribe((response) => {
      if (response) {
        this.customDateFilter = this.Utils.getPredefinedDateRanges(
          response.default_daterange_months
        );
        this.customDateFilter.selectedRange = this.Utils.getDateRanges().find(
          (val) => `${val.value}` === `${response.default_daterange_months}`
        )?.label;
        this.dateRangeRatingScheme = {
          startDate: this.Utils.formatDatetime(this.customDateFilter.startDate),
          endDate: this.Utils.formatDatetime(this.customDateFilter.endDate),
          range: response?.default_daterange_months ?? 'null',
        };
        this.defaultDateRange = { ...this.dateRangeRatingScheme };
        this.customDateFilter = {
          ...this.customDateFilter,
          startDate: this.dateRangeRatingScheme?.startDate,
          endDate: this.dateRangeRatingScheme?.endDate,
        };
        this.defaultCustomDateFilter = { ...this.customDateFilter };
        this.loading_prefs = false;
      }
    });
  }

  notifyMaxTemplateSelection() {
    const message =
      'At most ' +
      this.max_comparisons +
      ' projects can be selected for comparison';

    this.toaster.info(message);
  }

  resetUrl() {
    this.location.go('/app/analyze/compare/due_diligence_list');
  }

  setTemplateName(id: any) {
    this.selectedTemplate = this.templates.find((val) => val.id === id);
    this.selectedTemplateName = this.selectedTemplate.name;
  }

  validateFilters() {
    let validity = true;
    if (this.filters.start_date > this.filters.end_date) {
      this.toaster.error('Please select an end date greater than start date');
      validity = false;
    }

    return validity;
  }

  fetchDiligences(isBack) {
    let { templateName, entity_sub_type } = this.ddlForm.value;
    entity_sub_type = entity_sub_type === -1 ? null : entity_sub_type;
    if (!templateName) {
      this.toaster.info('Please select a template');
      return;
    }
    const params: any = {};
    if (this.customDateFilter.selectedRange === 'No Filter') {
      params.start_date = null;
      params.end_date = null;
    } else {
      params.start_date = this.Utils.formatDatetime(
        this.customDateFilter.startDate
      );
      params.end_date = this.Utils.formatDatetime(
        this.customDateFilter.endDate
      );
    }
    if (!this.validateFilters()) {
      return;
    }

    this.isLoading = true;
    this.showPannel = true;
    this.tilesRendered = false;
    this.selectedDueDiligences = [];
    params.template_id = templateName;
    params.strategy_id = entity_sub_type;
    this.http
      .get(
        `compare?end_date=${params.end_date}&start_date=${params.start_date}&template_id=${templateName}&strategy_id=${entity_sub_type}`,
        params
      )
      .subscribe((response: any) => {
        this.due_diligences = JSON.parse(JSON.stringify(response));
        this.isLoading = false;
        this.setTemplateName(templateName);

        if (this.savedData?.selectedDiligences && isBack) {
          this.selectedDueDiligences = this.savedData.selectedDiligences;
        }
      });
    this.getRatingScale();
  }

  searchWithFilters() {
    if (!this.ddlForm.valid) {
      this.ddlForm.markAllAsTouched();
      return;
    }
    this.fetchDiligences(false);
    this.getRatingScale();
  }

  getRatingScale() {
    return this.http
      .get(
        `templates/${this.ddlForm.value.templateName}/versions/${
          this.templates.find(
            (val) => val.id === this.ddlForm.value.templateName
          ).version
        }/TemplateRatingSchemeMappings`
      )
      .subscribe((response: { length: number }) => {
        const ratingScheme = response;
        if (response.length > 0) {
          this.ratingScheme = ratingScheme[0];
          if (this.ratingScheme.project_level_rating_scale_id) {
            this.rating_scale_id =
              this.ratingScheme.project_level_rating_scale_id;
            this.ratingScheme.primary_rating_scale_mode =
              this.ratingScheme.project_level_rating_scale_mode;
          } else {
            this.rating_scale_id = this.ratingScheme.rating_scale_id;
            this.ratingScheme.primary_rating_scale_mode =
              this.ratingScheme.rating_scale_mode;
          }
          return this.http
            .get(
              `v2/rating_scales/${this.rating_scale_id}/versions/0/rating_scale_definitions`
            )
            .subscribe((rating_scale: any) => {
              this.rating_scales = rating_scale;
              const noValueIndex = this.rating_scales.findIndex((scale) => {
                return parseInt(scale.value) === ratingConstants.naValue;
              });

              if (noValueIndex > -1) {
                this.naValue = this.rating_scales[noValueIndex];
                this.rating_scales.splice(noValueIndex, 1);
              }
            });
        }
      });
  }

  resetDates() {
    this.customDateFilter = { ...this.defaultCustomDateFilter };
    this.dateRangeRatingScheme = { ...this.defaultDateRange };
    this.dateRangePicker?.setDateRange(this.defaultDateRange, true);
  }

  clearFilters() {
    this.filters = {};
    this.due_diligences = [];
    this.selectedDDsArray = [];
    this.showPannel = false;
    this.selectedDueDiligences = [];
    this.savedData = null;
    this.ComparisonService.setSelections({});
    this.resetUrl();
    this.resetDates();
    this.ddlForm.reset();
    this.ddlForm.get('entity_sub_type').patchValue(-1);
  }

  saveSelections() {
    let { templateName, entity_sub_type } = this.ddlForm.value;
    let localFilter = {
      start_date: this.customDateFilter.startDate
        ? this.Utils.formatDatetime(this.customDateFilter.startDate)
        : null,
      end_date: this.customDateFilter.endDate
        ? this.Utils.formatDatetime(this.customDateFilter.endDate)
        : null,
      template_id: templateName,
      strategy_id: entity_sub_type,
      selectedRange: this.customDateFilter.selectedRange,
    };
    const selections = {
      filters: localFilter,
      selectedDiligences: this.selectedDueDiligences,
    };
    this.ComparisonService.setSelections(selections);
    this.router.navigateWithParams('app.analyze.compare.due_diligences', {
      ids: this.selectedDueDiligences.join(','),
      template_id: templateName,
    });
  }

  onDateChange(date) {
    this.customDateFilter = date;
    this.dateRangeRatingScheme = date;
    this.customDateFilter = {
      ...this.customDateFilter,
      startDate: date?.startDate,
      endDate: date?.endDate,
      selectedRange: date?.startDate ? date?.selectedRange : 'No Filter',
    };
  }

  onTemplateChange() {
    this.due_diligences = [];
    this.showPannel = false;
  }

  onClearDateFilter() {
    this.customDateFilter = {
      startDate: null,
      endDate: null,
      selectedRange: 'No Filter',
    };
  }

  handleSelectedData(data) {
    this.selectedDueDiligences = data;
  }
}
