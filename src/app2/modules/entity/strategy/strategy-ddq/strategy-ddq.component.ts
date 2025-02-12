import { Component, OnInit } from '@angular/core';
import { DueDiligenceDataService } from 'src/app2/services/due-diligence-data.service';
import { RouterService } from 'src/app2/services/router.service';
import { StrategyDataService } from 'src/app2/services/strategy-data.service';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take, tap } from 'rxjs/operators';
import { GetCurrentUser } from 'src/app2/store/user/user.action';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { EntityType } from 'src/app2/modules/questionnaire/constants/Response-type.constant';
import {
  NewRequestTypes,
  RequestTypes,
  keywordConstants,
} from 'src/app2/shared/constants/constant';
import { CurrentUserModel } from 'src/app2/store/user/user.model';
import { UtilsService } from 'src/app2/services/utils.service';
@Component({
  selector: 'strategy-ddq',
  templateUrl: './strategy-ddq.component.html',
  styleUrls: ['./strategy-ddq.component.css'],
})
export class StrategyDdqComponent implements OnInit {
  strategy;
  investorDdqs;
  entity_type;
  ddqs;
  stateParams: any;
  strategyId: any;
  is_admin: any;
  is_manager: boolean;
  isFreeSubscription: boolean;
  profileddqs;
  views: any;
  NewRequestTypes = NewRequestTypes;
  @Select(UserState.getCurrentUserData) user;
  currentUser: CurrentUserModel;

  constructor(
    private readonly routerService: RouterService,
    private readonly StrategyDataservice: StrategyDataService,
    private readonly DueDiligenceDataservice: DueDiligenceDataService,
    private readonly util: UtilsService
  ) {}

  ngOnInit(): void {
    this.stateParams = this.routerService.getState().params;
    this.strategyId = this.stateParams.strategyId;
    this.entity_type = 'Strategy';
    this.user.pipe(take(1)).subscribe((data) => {
      if (data) {
        this.currentUser = data;
        this.is_manager = data.isManager;
        this.is_admin = data.isAdmin;
        this.is_manager = data.isManager;
        this.isFreeSubscription = data.isFreeSubscription;
        this.StrategyDataservice.getStrategy(this.strategyId).subscribe(
          (strategy) => (this.strategy = strategy)
        );
        this.getDDQs();
        this.getProfileDDQs();
        this.getInvestorDDQs();
      }
    });
  }

  invokeAddDDQDialog() {
    if (!this.isFreeSubscription) {
      this.routerService.navigateWithParams('app.diligence.newddq', {
        type: RequestTypes.SHAREABLE,
        entity_type: keywordConstants.Strategy,
        entity_id: this.strategy.id,
      });
    }
  }

  invokeAddInvestorDDQDialog() {
    if (!this.isFreeSubscription) {
      this.routerService.navigateWithParams('app.diligence.newddq', {
        type: RequestTypes.INVESTOR,
        entity_type: keywordConstants.Strategy,
        entity_id: this.strategy.id,
      });
    }
  }

  invokeAddProfileDDQDialog() {
    if (!this.isFreeSubscription) {
      this.routerService.navigateWithParams('app.diligence.newddq', {
        type: RequestTypes.PREAPPROVED,
        entity_type: keywordConstants.Strategy,
        entity_id: this.strategy.id,
      });
    }
  }

  getDDQs() {
    this.DueDiligenceDataservice.getDiligences({
      include_contacts: false,
      include_custom_fields: false,
      include_dates: false,
      filters: {
        and: [
          {
            filter_key: 'is_internal',
            filter_name: 'Is Internal',
            type: 'bool',
            operations: 'eq',
            filter_value: true,
          },
          {
            filter_key: 'entity_type',
            filter_name: 'Entity Type',
            type: 'int',
            operations: 'eq',
            filter_value: EntityType.Strategy,
          },
          {
            filter_key: 'entity_id',
            filter_name: 'Entity ID',
            type: 'int',
            operations: 'eq',
            filter_value: +this.strategyId,
          },
          {
            filter_key: 'status',
            filter_name: 'Status',
            filter_value: 33, // Code for retired projects
            operations: 'neq',
            type: 'dropdown',
          },
          {
            filter_key: 'status',
            filter_name: 'Status',
            filter_value: 14, // Code for deleted projects
            operations: 'neq',
            type: 'dropdown',
          },
          {
            filter_key: 'investor_firm_id',
            filter_name: 'Investor Firm ID',
            filter_value: this.currentUser.firmInfo.id,
            operations: 'eq',
            type: 'int',
          },
        ],
      },
      type: 'all',
    }).subscribe((response: any) => {
      this.ddqs = this.util.sortByDate(response.data, 'last_updated_at');
    });
  }

  getInvestorDDQs() {
    this.DueDiligenceDataservice.getInvestorDiligenceByFund(
      this.strategyId
    ).subscribe((response: any) => {
      this.investorDdqs = response;
    });
  }

  getProfileDDQs() {
    this.DueDiligenceDataservice.getProfileDDQ({
      entity_type: 'Strategy',
      entity_id: this.strategyId,
    }).subscribe((response: any) => {
      this.profileddqs = response;
    });
  }

  getViews() {
    if (!this.is_manager) {
      return;
    }
    this.DueDiligenceDataservice.getViews(
      this.strategyId,
      'Strategy'
    ).subscribe((response: any) => {
      this.views = response;
    });
  }
}
