import { finalize, take, tap } from 'rxjs/operators';
import { Component, OnInit } from '@angular/core';
import { FundDataService } from 'src/app2/services/fund-data.service';
import { RouterService } from 'src/app2/services/router.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { of } from 'rxjs';
import * as moment from 'moment';
import { HttpClient } from '@angular/common/http';
import * as c3 from 'c3';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { GetCurrentUser } from 'src/app2/store/user/user.action';

@Component({
  selector: 'products-summary',
  templateUrl: './products-summary.component.html',
  styleUrls: ['./products-summary.component.css'],
})
export class ProductsSummaryComponent implements OnInit {
  fund;
  isEditable;
  track_record_end_date;
  track_record_start_date;
  default_track_record;
  default_aum;
  stateParams: any;
  fundId: any;
  entity_type: string;
  colorScheme: any;
  is_manager: boolean;
  toggling_fund_follow: boolean;
  return_chart_config: any;
  aum_chart_config: any;
  attachments: any;
  templates: any;
  frequencies: any;
  diligences: any;
  @Select(UserState.getFirmPreferenceData) firmPref;
  @Select(UserState.getCurrentUserData) user;
  @Select(UserState.getSubscriptionLimitsData) subscriptionLimits;

  constructor(
    private readonly routerService: RouterService,
    private readonly FundDataservice: FundDataService,
    private readonly Utils: UtilsService,
    private readonly ModalFactory: CustomModalService,
    private readonly BaseDataService: BaseDataService,
    private readonly http: HttpClient
  ) {}

  ngOnInit() {
    this.stateParams = this.routerService.getState().params;
    this.fundId = this.stateParams.fundId;
    this.subscriptionLimits.pipe(take(2)).subscribe((limits) => {
      if (limits?.length) {
        this.entity_type = this.Utils.getEntityType(limits[0]);
      }
    });
    this.firmPref.pipe(take(2)).subscribe((pref) => {
      if (pref) {
        this.colorScheme = this.Utils.getFirmColorScheme(pref);
      }
    });
    this.user.pipe(take(1)).subscribe((data) => {
      if (data) {
        this.isEditable = data.isManager;
        this.is_manager = data.isManager;
        this.FundDataservice.getFund(this.fundId).subscribe((fund: any) => {
          this.fund = fund;
          this.getDefaultShareClassTables();
        });
        this.getAttachments();
      }
    });
  }

  toggleFundFollow() {
    let promise;
    this.toggling_fund_follow = true;
    if (this.fund.status === 'Following') {
      promise = this.FundDataservice.unfollow(this.fund.id);
    } else {
      promise = this.FundDataservice.follow(this.fund.id);
    }
    promise
      .pipe(
        finalize(() => {
          this.toggling_fund_follow = false;
        })
      )
      .subscribe(() => {
        if (this.fund.status === 'Following') {
          this.fund.status = null;
        } else {
          this.fund.status = 'Following';
        }
      });
  }

  editFund() {
    this.ModalFactory.invoke('manage-fund', {
      initialState: {
        fund: this.fund,
        source: 'monitor',
        response: (fund: any) => {
          this.fund = fund;
        },
      },
      class: 'gray modal-lg',
    });
  }

  getDefaultShareClassTables() {
    this.FundDataservice.getShareClassTables(
      this.fund.parentFirm?.id || null,
      this.fund.id
    ).subscribe((responses: any) => {
      this.default_track_record = responses.find(
        (track) => track.type === 'track_record'
      );
      this.default_aum = responses.find((track) => track.type === 'aum');
      this.getDefaultShareClassReturnValues().subscribe((response: any) => {
        const config: any = this.getConfig(response);
        config.axis.y = {
          tick: {
            format(y) {
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
    let promise;
    if (this.default_track_record) {
      promise = this.BaseDataService.getShareClassTableValues(
        this.default_track_record.id
      ).pipe(
        tap((response: any) => {
          response = this.processDatesAndValues(response);
          // TODO: Replace sortBy
          /* response = _(response).sortBy(
          (fund_return: { end_date: any }) => +new Date(fund_return.end_date)
        ); */
          this.processReturns(response);
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
      promise = of([]);
    }
    return promise;
  }

  getDefaultShareClassAUMValues() {
    let promise;
    if (this.default_aum) {
      promise = this.BaseDataService.getShareClassTableValues(
        this.default_aum.id
      ).pipe(
        tap((response) => {
          this.processDatesAndValues(response);
        })
      );
    } else {
      promise = of([]);
    }
    return promise;
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

  processReturns(fund_returns) {
    fund_returns.forEach((fund_return, idx) => {
      if (idx === 0) {
        return;
      }
      const previous_return_value = fund_returns[idx - 1].value / 100;
      const value = fund_return.value / 100;
      fund_return.value = ((1 + previous_return_value) * (1 + value) - 1) * 100;
      fund_return.value = Number(fund_return.value.toFixed(2));
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
      bar: {
        width: {
          ratio: 0.5,
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
    this.FundDataservice.getAttachments(this.fundId).subscribe(
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
      .get(`funds/${this.fundId}/diligences`)
      .subscribe((response: any) => {
        this.diligences = response;
      });
  }

  navigateToRelatedEntities() {
    this.routerService.navigateWithParams(
      `app.firms.funds.profile.related_entities`,
      {
        firmId: this.fund.parentFirm.id,
        fundId: this.fundId,
      }
    );
  }

  navigateToShareClassTablesDetail(shareClassTableId) {
    const url = this.routerService.getState()._routerState.url.slice(1);
    const segments = url.split('/');
    segments.pop();
    segments.push('aum_tr');
    segments.join('/');
    window.open('/#/' + segments.join('/'), '_blank');
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

  navigateToDocumentsList() {
    this.routerService.navigateWithParams(
      `app.firms.funds.profile.documents.list`,
      {
        firmId: this.fund.parentFirm.id,
        fundId: this.fundId,
      }
    );
  }

  navigateToMonitor() {
    this.routerService.navigateWithParams(`app.firms.profile.monitor`, {
      firmId: this.fund.parentFirm.id,
    });
  }
}
