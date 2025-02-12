import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { ComparisonAngularDataService } from 'src/app2/services/comparison/comparison.service';
import { DueDiligenceDataService } from 'src/app2/services/due-diligence-data.service';
import { RouterService } from 'src/app2/services/router.service';
import { TemplateDataService } from 'src/app2/services/templateData/template.service';
import { ratingConstants } from 'src/app2/shared/constants/constant';

@Component({
  selector: 'due-diligence-compare',
  templateUrl: './due-diligences.component.html',
  styleUrls: ['./due-diligences.component.css'],
})
export class CompareDueDiligences implements OnInit {
  copyOfOriginalData: any;
  selectedDueDiligences: any;
  max_comparisons: number;
  removedDdIds: any;
  compareResults: any;
  fundNames: any;
  allComparisonIds: any;
  flaggedIds: any;
  isLoading: boolean;
  activeTab: string;
  headersRow: string;
  headersRowBody: string;
  ratingScheme: any;
  rating_scales: any;
  secondary_rating_scales: any;
  naValue = null;
  secondaryNaValue = null;
  stateParams;
  compareResultsLocal: any;

  constructor(
    private readonly routerService: RouterService,
    private readonly TemplatesDataService: TemplateDataService,
    private readonly http: HttpClient,
    private readonly DueDiligenceDataservice: DueDiligenceDataService,
    private readonly ComparisonService: ComparisonAngularDataService,
    private readonly toaster: ToastrService,
  ) {}

  ngOnInit() {
    this.stateParams = this.routerService.getState().params;
    this.copyOfOriginalData = [];
    this.selectedDueDiligences = [];
    this.max_comparisons = 10;
    this.removedDdIds = [];
    this.compareResults = [];
    this.fundNames = [];
    this.allComparisonIds = [];
    this.flaggedIds = [];
    this.isLoading = true;
    this.activeTab = 'showAll';
    this.headersRow = 'headersRow';
    this.headersRowBody = 'headersRowBody';
    this.TemplatesDataService.getTemplate(
      this.stateParams?.template_id
    ).subscribe((template: { templateInfo: { id: any; version: any } }) => {
      return this.http
        .get(
          `templates/${template.templateInfo.id}/versions/${template.templateInfo.version}/TemplateRatingSchemeMappings`
        )
        .subscribe((response: { length: number }) => {
          const ratingScheme = response;
          if (response.length > 0) {
            this.ratingScheme = ratingScheme[0];
            this.ratingScheme.primary_rating_scale_mode =
              this.ratingScheme.rating_scale_mode;
            this.http
              .get(
                `v2/rating_scales/${ratingScheme[0].rating_scale_id}/versions/0/rating_scale_definitions`
              )
              .subscribe((rating_scale: any) => {
                this.rating_scales = rating_scale;
                let noValueIndex = -1;
                this.rating_scales.forEach((val, index) => {
                  if (Number(val.value) === ratingConstants.naValue) {
                    noValueIndex = index;
                  }
                });
                if (noValueIndex > -1) {
                  this.naValue = this.rating_scales[noValueIndex];
                  this.rating_scales.splice(noValueIndex, 1);
                }
                if (!this.ratingScheme.project_level_rating_scale_id) {
                  this.secondary_rating_scales = this.rating_scales;
                  this.secondaryNaValue = this.naValue;
                }

                if (this.ratingScheme.project_level_rating_scale_id) {
                  this.ratingScheme.primary_rating_scale_mode =
                    this.ratingScheme.project_level_rating_scale_mode;
                  this.http
                    .get(
                      `v2/rating_scales/${this.ratingScheme.project_level_rating_scale_id}/versions/0/rating_scale_definitions`
                    )
                    .subscribe((rating_scale: any) => {
                      this.secondary_rating_scales = rating_scale;
                      const noValueIndex =
                        this.secondary_rating_scales.findIndex((scale) => {
                          return (
                            parseInt(scale.value) === ratingConstants.naValue
                          );
                        });
                      if (noValueIndex > -1) {
                        this.secondaryNaValue =
                          this.secondary_rating_scales[noValueIndex];
                        this.secondary_rating_scales.splice(noValueIndex, 1);
                      }
                    });
                }
              });
          }
        });
    });
    // this.compare_dates = this.ComparisonDataService.getComparisonDates()
    if (this.activeTab === 'showAll') {
      this.ComparisonService.setComparisonIds(this.stateParams?.ids);
    }

    this.DueDiligenceDataservice.compare(
      this.stateParams?.ids.split(',')
    ).subscribe((response: { length: any }) => {
      this.isLoading = false;
      if (response.length) {
        this.ComparisonService.setComparisonData(response);
        this.copyOfOriginalData = this.ComparisonService.getComparisonData();
        this.compareResults = response;
        return this.loadSeletables(this.compareResults);
      }
    });
  }

  loadSeletables(response) {
    this.fundNames = [];
    this.allComparisonIds = [];
    this.flaggedIds = [];
    this.selectedDueDiligences = [];
    response[0].response.forEach((item, i: any) => {
      if (item.total_flags) {
        this.flaggedIds.push(item.id);
      }
      this.allComparisonIds.push(item.id);
      return this.fundNames.push({
        name: item.fundName,
        created_at: item.created_at,
        lastupdate_at: item.lastupdate_at,
        id: item.id,
        aggregate_score: item.aggregate_score,
        aggregate_total: item.aggregate_total,
        total_flags: item.total_flags,
        idx: i,
        aggregate_rating: item.aggregate_rating,
      });
    });
    if (this.allComparisonIds.length === 2) {
      return (this.selectedDueDiligences = this.allComparisonIds);
    }
  }

  filterFlagged() {
    this.compareResults = this.ComparisonService.getComparisonData();
    const protoArray = [];
    this.compareResults.forEach(function (item: { response: any }) {
      let found = false;
      item.response.forEach(function (innerResponse: { is_flagged: boolean }) {
        if (innerResponse.is_flagged === true) {
          found = true;
          return false;
        }
      });
      if (found) {
        protoArray.push(item);
      }
    });
    this.compareResults = protoArray;
  }

  filterScored() {
    this.compareResults = this.ComparisonService.getComparisonData();
    const protoArray = [];
    this.compareResults.forEach(function (item: { response: any }) {
      let found = false;
      item.response.forEach(function (innerResponse: { score: any }) {
        if (innerResponse.score) {
          found = true;
          return false;
        }
      });
      if (found) {
        protoArray.push(item);
      }
    });
    this.compareResults = protoArray;
  }

  loadTrackChanges() {
    this.compareResults = this.ComparisonService.getComparisonData();
    if (this.removedDdIds.length > 0) {
      this.compareResults = this.ComparisonService.filterRemoved(
        this.removedDdIds,
        this.compareResults
      );
    }
    this.compareResults = this.ComparisonService.sortByLastUpdated(
      this.compareResults
    );
    this.ComparisonService.setComparisonData(this.compareResults);
    this.loadSeletables(this.compareResults);
    return this.compareResults;
  }

  loadShowAll() {
    this.compareResults = [];
    this.compareResults = this.ComparisonService.getComparisonData();
    if (this.removedDdIds.length > 0) {
      this.compareResults = this.ComparisonService.filterRemoved(
        this.removedDdIds,
        this.compareResults
      );
    }
    this.loadSeletables(this.compareResults);
    this.ComparisonService.setComparisonData(this.compareResults);
  }

  toggleComparisonTab(tab: string) {
    if (
      this.activeTab !== 'trackChanges' &&
      tab === 'trackChanges' &&
      this.selectedDueDiligences.length !== 2
    ) {
      return;
    }
    if (tab === 'trackChanges' && this.selectedDueDiligences.length !== 2) {
      return;
    }
    if (tab === 'trackChanges' && this.selectedDueDiligences.length === 2) {
      this.compareResults = this.loadTrackChanges();
    }
    if (tab === 'showAll') {
      this.loadShowAll();
    }
    if (tab === 'showFlagged') {
      this.filterFlagged();
    }
    if (tab === 'showScoreMap') {
      this.filterScored();
    }
    this.activeTab = tab;
  }

  selectedIds() {
    if (
      (this.selectedDueDiligences != null
        ? this.selectedDueDiligences.length
        : undefined) > 1
    ) {
      this.selectedDueDiligences.join(',');
    }
  }

  notifyMaxTemplateSelection() {
    const message =
      'At most ' +
      this.max_comparisons +
      ' projects can be selected for comparison';

    this.toaster.info(message);
  }

  returnToDDList() {
    const state_params = { keepData: true };
    this.routerService.navigateWithParams(
      'app.analyze.compare.due_diligence_list',
      state_params
    );
  }

  handleScrollChange(scrollObject) {
    this.compareResultsLocal = scrollObject.list;
  }

  removeSelectedItem(id: any, idx: any) {
    let indexToRemove = null;
    let removedId = null;
    this.compareResults[0].response.forEach((innerRes: { id: any }, i: any) => {
      if (innerRes.id === id) {
        removedId = id;
        indexToRemove = i;
        return false;
      }
    });
    this.compareResults.forEach(
      (
        item: { response: { splice: (arg0: any, arg1: number) => any } },
        i: any
      ) => {
        item.response.splice(indexToRemove, 1);
      }
    );

    if (removedId) {
      this.removedDdIds.push(removedId);
    }
    if (this.activeTab === 'showAll') {
      this.ComparisonService.setComparisonData(this.compareResults);
    }

    this.loadSeletables(this.compareResults);
    this.compareResults;
  }
}
