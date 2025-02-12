import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import { MyFlagScoreService } from '../../service/flagscores.service';
import { Store } from '@ngxs/store';
import { ratingConstants } from 'src/app2/shared/constants/constant';
import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';

@Component({
  selector: 'app-recent-flags-scores-rating',
  templateUrl: './recent-flags-scores-rating.component.html',
})
export class RecentFlagsScoresRatingComponent implements OnInit {
  public gridDataSource: any = [];
  public columnDefs: any = [];
  @Input('dateRange') public dateRange;
  loading = false;

  constructor(
    private services: MyFlagScoreService,
    private store: Store,
    private readonly toaster: ToastrService,
    private readonly http: HttpClient,
    private readonly dvDatePipe: DvDatePipe
  ) {}

  ngOnInit(): void {
    this.getDataSource();
    this.columnDefs = this.services.getActionsColDef();
    this.store.dispatch(
      new SetDefaultColumnDef({
        ['investor-recent-flags-scores']: this.columnDefs,
      })
    );
  }

  getDataSource() {
    let self = this;
    self.loading = true;
    // self.toaster.info('Please wait...');
    let url =
      self.dateRange && self.dateRange.startDate
        ? `flags_scores_summary?start_date=${self.dateRange.startDate}&end_date=${self.dateRange.endDate}`
        : 'flags_scores_summary';
    try {
      self.toaster.clear();
      self.http.get(url).subscribe(
        (response: any) => {
          self.toaster.clear();
          response = response.map((item) => {
            item.as_of_date = this.dvDatePipe.transform(item.as_of_date, [
              'isLocaleDate',
            ]);
            item.as_of_date_for_sorting = item.as_of_date ?? null;
            return item;
          });
          self.gridDataSource = response;
          this.getDistinctRatingScales(response);
        },
        (error: any) => {
          self.toaster.clear();
        }
      );
    } catch (error) {
      self.toaster.clear();
    }
  }

  getDistinctRatingScales(dataGrid) {
    const rating_scales = this.gridDataSource.map((element) => ({
      rating_scale_id: element.rating_scale_id,
    }));
    const distinctThings = rating_scales.filter(
      (el, i, arr) =>
        arr.findIndex(
          (item) =>
            item.rating_scale_id === el.rating_scale_id &&
            el.rating_scale_id !== null
        ) === i
    );
    this.setRatingScaleDefinition(distinctThings, dataGrid);
  }

  async setRatingScaleDefinition(distinctThings, dataGrid) {
    for (let i = 0; i < distinctThings.length; i++) {
      let data: any = await this.getRatingScaleDefinition(
        distinctThings[i].rating_scale_id,
        0
      );
      if (data.length > 0) {
        dataGrid
          .filter((x) => x.rating_scale_id == data[0].rating_scale_id)
          .map((ele: any) => {
            ele['ratingScaleDefinition'] = data;
            let noValueIndex = ele.ratingScaleDefinition.findIndex(
              (item: any) => parseInt(item.value) == ratingConstants.naValue
            );
            if (noValueIndex > -1) {
              ele.naValue = ele.ratingScaleDefinition[noValueIndex];
              ele.ratingScaleDefinition.splice(noValueIndex, 1);
            }
          });
        dataGrid = dataGrid;
      }
    }
    this.gridDataSource = dataGrid;
    this.loading = false;
  }

  async getRatingScaleDefinition(id, version) {
    let self = this;
    return new Promise(async function (resolve, reject) {
      try {
        self.toaster.clear();
        self.http
          .get(
            'v2/rating_scales/' +
              id +
              '/versions/' +
              version +
              '/rating_scale_definitions'
          )
          .subscribe(
            (response: any) => {
              resolve(response);
            },
            (error: any) => {
              reject(error);
            }
          );
      } catch (error) {
        reject(error);
      }
    });
  }
}
