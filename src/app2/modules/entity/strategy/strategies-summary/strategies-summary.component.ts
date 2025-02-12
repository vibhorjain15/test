import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';
import { of } from 'rxjs';
import { finalize, take, tap } from 'rxjs/operators';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { RouterService } from 'src/app2/services/router.service';
import { StrategyDataService } from 'src/app2/services/strategy-data.service';
import { UtilsService } from 'src/app2/services/utils.service';
import * as c3 from 'c3';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { keywordConstants } from 'src/app2/shared/constants/constant';
@Component({
  selector: 'strategies-summary',
  templateUrl: './strategies-summary.component.html',
  styleUrls: ['./strategies-summary.component.css'],
})
export class StrategiesSummaryComponent implements OnInit {
  strategy;
  track_record_end_date;
  track_record_start_date;
  default_track_record;
  default_aum;
  strategyId: any;
  stateParams: any;
  isEditable: boolean;
  entity_type: string;
  colorScheme: any;
  is_manager: boolean;
  toggling_strategy_follow: boolean;
  templates: any;
  frequencies: any;
  diligences: any;
  attachments = [];
  return_chart_config: any;
  aum_chart_config: any;
  @Select(UserState.getFirmPreferenceData) firmPref;
  @Select(UserState.getCurrentUserData) user;
  currentUser: any;

  constructor(
    private readonly routerService: RouterService,
    private readonly Utils: UtilsService,
    private readonly ModalFactory: CustomModalService,
    private readonly BaseDataService: BaseDataService,
    private readonly http: HttpClient,
    private readonly StrategyDataservice: StrategyDataService
  ) {}

  ngOnInit(): void {
    this.stateParams = this.routerService.getState().params;
    this.strategyId = this.stateParams.strategyId;
    this.entity_type = 'Strategy';
    this.firmPref.pipe(take(2)).subscribe((pref) => {
      if (pref) {
        this.colorScheme = this.Utils.getFirmColorScheme(pref);
      }
    });
    this.user.pipe(take(1)).subscribe((data) => {
      if (data) {
        this.currentUser = data;
        this.is_manager = data.isManager;
        this.isEditable = data.isManager;
        this.StrategyDataservice.getStrategy(this.strategyId).subscribe(
          (strategy) => {
            this.strategy = strategy;
            this.getDefaultShareClassTables(strategy);
          }
        );
        this.getAttachments();
      }
    });
  }

  toggleStrategyFollow() {
    let promise;
    this.toggling_strategy_follow = true;
    if (this.strategy.status === 'Following') {
      promise = this.StrategyDataservice.unfollow(this.strategy.id);
    } else {
      promise = this.StrategyDataservice.follow(this.strategy.id);
    }
    promise
      .pipe(
        finalize(() => {
          this.toggling_strategy_follow = false;
        })
      )
      .subscribe(() => {
        if (this.strategy.status === 'Following') {
          this.strategy.status = null;
        } else {
          this.strategy.status = 'Following';
        }
      });
  }

  editStrategy() {
    this.ModalFactory.invoke('manage-fund', {
      initialState: {
        fund: this.strategy,
        source: 'monitor',
        fund_type: keywordConstants.Strategy.toLowerCase(),
        response: (strategy) => {
          this.strategy = strategy;
        },
      },
      class: 'gray modal-lg',
    });
  }

  getDefaultShareClassTables(strategy) {
    this.StrategyDataservice.getShareClassTables(
      strategy.parentFirm.id,
      strategy.id
    ).subscribe((responses: any) => {
      this.default_track_record = responses.find(
        (response) => response.type === 'track_record'
      );
      this.default_aum = responses.find((response) => response.type === 'aum');
      this.getDefaultShareClassReturnValues().subscribe((response: any) => {
        const config: any = this.getConfig(response);
        config.axis.y = {
          tick: {
            format(y: { toFixed: (arg0: number) => any }) {
              y = Number(y.toFixed(2));
              return `${y}%`;
            },
          },
        };
        this.return_chart_config = config;
        c3.generate({
          bindto: '#chart1',
          ...this.return_chart_config,
          data: {
            ...this.return_chart_config.data,
            empty: {
              label: {
                text: 'No data, no chart :)',
              },
            },
          },
        });
      });
      this.getDefaultShareClassAUMValues().subscribe((response: any) => {
        this.aum_chart_config = this.getConfig(response);
        this.aum_chart_config.data.type = 'bar';
        c3.generate({
          // #RouterBug:: TypeError: can't access property "format", d3.time is undefined
          bindto: '#chart2',
          ...this.aum_chart_config,
          data: {
            ...this.aum_chart_config.data,
            empty: {
              label: {
                text: 'No data, no chart :)',
              },
            },
          },
        });
      });
    });
  }

  getDefaultShareClassReturnValues() {
    if (this.default_track_record) {
      return this.BaseDataService.getShareClassTableValues(
        this.default_track_record.id
      ).pipe(
        tap((response: any) => {
          response = this.processDatesAndValues(response);
          // TODO: Replace sortBy
          /* response = _(response).sortBy(
          (strategy_return: { end_date: any }) =>
            +new Date(strategy_return.end_date)
        ); */
          if (response.length === 1) {
            this.track_record_start_date = response[0].start_date;
            this.track_record_end_date = response[0].end_date;
          } else if (response.length > 1) {
            this.track_record_start_date = response[0].end_date;
            this.track_record_end_date = response[response.length - 1].end_date;
          }
          return response;
        })
      );
    } else {
      // const defer = this.$q.defer();
      // defer.resolve([]);
      // return defer.promise;
      return of([]);
    }
  }

  getDefaultShareClassAUMValues() {
    if (this.default_aum) {
      return this.BaseDataService.getShareClassTableValues(
        this.default_aum.id
      ).pipe(
        tap((response) => {
          this.processDatesAndValues(response);
        })
      );
    } else {
      /* const defer = this.$q.defer();
      defer.resolve([]);
      return defer.promise; */
      return of([]);
    }
  }

  processDatesAndValues(response) {
    response.forEach((item) => {
      if (!item.value) {
        item.value = 0;
      }
      item.end_date = moment(item.end_date).format('YYYY-MM-DD');
    });
    return response;
  }

  processReturns(strategy_returns) {
    strategy_returns.forEach((strategy_return, idx) => {
      if (idx === 0) {
        return;
      }
      const previous_return_value = strategy_returns[idx - 1].value / 100;
      const value = strategy_return.value / 100;
      strategy_return.value =
        ((1 + previous_return_value) * (1 + value) - 1) * 100;
      strategy_return.value = Number(strategy_return.value.toFixed(2));
    });
  }

  getConfig(data) {
    return {
      data: {
        json: data,
        x_format: '%M-%Y',
        names: {
          value: '',
        },
        xs: {
          value: 'end_date',
        },
        keys: {
          value: ['value'],
          x: 'end_date',
        },
      },
      legend: {
        show: false,
      },
      grid: {
        y: {
          lines: [{ value: 0, text: '', class: 'dashed-line' }],
        },
      },
      axis: {
        x: {
          type: 'timeseries',
          tick: {
            rotate: 60,
            format(x: any) {
              return moment(x).format('MMM-YYYY');
            },
          },
        },
      },
      color: { pattern: this.colorScheme },
    };
  }

  getAttachments() {
    this.StrategyDataservice.getAttachments(this.strategyId).subscribe(
      (response: any) => {
        this.attachments = response;
      }
    );
  }

  getTemplates() {
    this.http.get('templates').subscribe((response: any) => {
      this.templates = response;
    });
  }

  getFrequencies() {
    this.http.get('frequency').subscribe((response: any) => {
      this.frequencies = response;
    });
  }

  getDiligences() {
    this.http
      .get(`strategies/${this.strategyId}/diligences`)
      .subscribe((response: any) => {
        this.diligences = response;
      });
  }

  navigateToProfileDdq() {
    this.routerService.navigateAngular(
      `/app/firms/${this.stateParams.firmId}/strategies/${this.strategyId}/profile/ddq`
    );
  }

  navigateToDocumentsList() {
    this.routerService.navigateAngular(
      `/app/firms/${this.stateParams.firmId}/strategies/${this.strategyId}/profile/documents/list`
    );
  }

  navigateToProfileRelatedEntities() {
    this.routerService.navigateAngular(
      `/app/firms/${this.stateParams.firmId}/strategies/${this.strategyId}/profile/related_entities`
    );
  }

  navigateToMonitor() {
    this.routerService.navigateWithParams(`app.firms.profile.monitor`, {
      firmId: this.strategy.parentFirm.id,
    });
  }

  getStatusClass(status) {
    let type;
    switch (status) {
      case 'Completed':
      case 'Approved':
      case 'APPROVED':
      case 'Unanswered':
      case 'ExtensionApproved':
      case 'Registered':
        type = 'success';
        break;
      case 'NotApproved':
      case 'Deleted':
      case 'Answered':
      case 'Withdrawn':
      case 'ExtensionDeclined':
      case 'Retired':
        type = 'danger';
        break;
      case 'Started':
      case 'Following':
      case 'Scheduled':
      case 'ACTIVE':
        type = 'default';
        break;
      case 'Followup':
      case 'Invested':
      case 'Invited':
      case 'PendingRestart':
      case 'APPROVED-120':
      case 'WIP':
      case 'Extension Requested':
      case 'ExtensionRequested':
      case 'ERA':
        type = 'warning';
        break;
      case 'Reminded':
      case 'Restarted':
      case 'RestartApproved':
      case 'InReview':
      case 'Evaluation':
        type = 'info';
        break;
      case 'Sent':
        type = 'orange';
        break;
    }
    return `label-${type}`;
  }
}
