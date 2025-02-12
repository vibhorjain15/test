import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Select } from '@ngxs/store';

import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';
import { finalize, take } from 'rxjs/operators';
import { RouterService } from 'src/app2/services/router.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { UserState } from 'src/app2/store/user/user.state';

@Component({
  selector: 'analyze-templates',
  templateUrl: './templates.component.html',
  styleUrls: ['./templates.component.css'],
})
export class AnalyzeTemplatesComponent implements OnInit {
  benchmarkingForm: FormGroup;
  stateParams: any;
  customDateFilter: { startDate: any; endDate: any; selectedRange: any };
  loading_prefs: boolean;
  predefinedDate: any;
  tagId: any;
  start_date: any;
  end_date: any;
  templates: any;
  loadingTemplates = false;
  tags: any;
  loadingTags = false;
  dateRangeRatingScheme;
  isTemplate: boolean;
  @Select(UserState.getFirmPreferenceData) firmPref;
  constructor(
    private readonly Utils: UtilsService,
    private readonly http: HttpClient,
    private readonly router: RouterService,
    private readonly toaster: ToastrService,
    private routerState: ActivatedRoute
  ) {}

  ngOnInit() {
    this.stateParams = this.router.getState(this.routerState).params;
    this.benchmarkingForm = new FormGroup({
      templateId: new FormControl(null, Validators.required),
      portfolioId: new FormControl(null),
    });

    this.initializeDates();
    this.getTemplates();
    this.getTags();
  }

  initializeDates() {
    // if url has the details of dates, use those dates and assign to objects
    if (this.stateParams?.selectedRange === 'No Filter') {
      this.customDateFilter = {
        startDate: null,
        endDate: null,
        selectedRange: this.stateParams.selectedRange,
      };
      this.dateRangeRatingScheme = {
        startDate: null,
        endDate: null,
        range: 'null',
      };
    } else if (this.stateParams?.start_date && this.stateParams?.end_date) {
      this.customDateFilter = {
        startDate: moment(this.stateParams.start_date),
        endDate: moment(this.stateParams.end_date),
        selectedRange: this.stateParams.selectedRange,
      };
      this.dateRangeRatingScheme = {
        startDate: moment(this.stateParams.start_date),
        endDate: moment(this.stateParams.end_date),
        range: this.stateParams.range,
      };
    } else {
      // get dates based on firm pref if url doesn't have dates
      this.getFirmPref();
    }
  }

  getFirmPref() {
    this.loading_prefs = true;
    this.firmPref.pipe(take(1)).subscribe((response) => {
      if (response) {
        this.customDateFilter = this.Utils.getPredefinedDateRanges(
          response.default_daterange_months
        );
        this.customDateFilter.selectedRange = this.Utils.getDateRanges().find(
          (val) => `${val.value}` === `${response.default_daterange_months}`
        ).label;
        this.dateRangeRatingScheme = {
          startDate: this.Utils.formatDatetime(this.customDateFilter.startDate),
          endDate: this.Utils.formatDatetime(this.customDateFilter.endDate),
          range: response?.default_daterange_months ?? 'null',
        };
        this.customDateFilter = {
          ...this.customDateFilter,
          startDate: this.dateRangeRatingScheme?.startDate,
          endDate: this.dateRangeRatingScheme?.endDate,
        };
        this.loading_prefs = false;
        this.predefinedDate = this.Utils.getPredefinedDateRanges(
          response.default_daterange_months
        );
      }
    });
  }

  onDateChange(date) {
    this.dateRangeRatingScheme = date;
    this.customDateFilter = {
      startDate: date?.startDate,
      endDate: date?.endDate,
      selectedRange: date?.startDate
        ? this.Utils.getDateRanges().find((val) => val.value == date.range)
            ?.label
        : 'No Filter',
    };
  }

  onClearDateFilter() {
    this.customDateFilter = {
      startDate: null,
      endDate: null,
      selectedRange: 'No Filter',
    };
  }

  getAnalytics() {
    if (!this.benchmarkingForm.valid) {
      this.toaster.info('Please select a template');
      this.benchmarkingForm.markAllAsTouched();
      return;
    }
    this.gotoTemplateResponseAnalysisRoute();
  }

  reset() {
    this.router.navigate('app.analyze.templates');
    this.benchmarkingForm.reset();
    this.dateRangeRatingScheme = this.predefinedDate;
  }

  gotoTemplateResponseAnalysisRoute() {
    let { templateId, portfolioId } = this.benchmarkingForm.value;
    this.tagId = portfolioId;

    if (this.customDateFilter.selectedRange === 'No Filter') {
      this.start_date = null;
      this.end_date = null;
    } else {
      this.start_date = this.Utils.formatDatetime(
        this.customDateFilter.startDate
      );
      this.end_date = this.Utils.formatDatetime(this.customDateFilter.endDate);
    }

    this.router.navigateWithParams('app.analyze.templates.categories', {
      templateId: templateId,
      tagId: this.tagId,
      start_date: this.start_date,
      end_date: this.end_date,
      selectedRange: this.customDateFilter.selectedRange,
      range: this.dateRangeRatingScheme.range,
    });
  }

  getTemplates() {
    this.loadingTemplates = true;
    this.http
      .get('templates', { params: { in_use: true } })
      .pipe(finalize(() => (this.loadingTemplates = false)))
      .subscribe((response: any) => {
        this.templates = response;
        this.isTemplate = false;
        if (this.stateParams?.templateId) {
          this.benchmarkingForm.patchValue({
            templateId: +this.stateParams.templateId,
          });
        }
      });
  }

  getTags() {
    this.loadingTags = true;
    this.http
      .get('tags', { params: { in_use: true } })
      .pipe(finalize(() => (this.loadingTags = false)))
      .subscribe((response: any) => {
        this.tags = response;
        if (this.stateParams?.tagId) {
          this.benchmarkingForm.patchValue({
            portfolioId: +this.stateParams.tagId,
          });
        }
      });
  }
}
