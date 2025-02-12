import { Component, OnInit } from '@angular/core';
import { DueDiligenceDataService } from 'src/app2/services/due-diligence-data.service';
import { FundDataService } from 'src/app2/services/fund-data.service';
import { RouterService } from 'src/app2/services/router.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take, tap } from 'rxjs/operators';
import { GetCurrentUser } from 'src/app2/store/user/user.action';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { EntityType } from 'src/app2/modules/questionnaire/constants/Response-type.constant';
import {
  RequestTypes,
  keywordConstants,
} from 'src/app2/shared/constants/constant';
import { CurrentUserModel } from 'src/app2/store/user/user.model';
@Component({
  selector: 'products-ddq',
  templateUrl: './products-ddq.component.html',
  styleUrls: ['./products-ddq.component.css'],
})
export class ProductsDdqComponent implements OnInit {
  fund;
  investorDdqs;
  entity_type;
  ddqs;
  profileddqs;
  stateParams: any;
  fundId: any;
  is_admin: any;
  is_manager: boolean;
  isFreeSubscription: boolean;
  views: any;
  currUser: CurrentUserModel;
  @Select(UserState.getCurrentUserData) user;
  @Select(UserState.getSubscriptionLimitsData) subscriptionLimits;

  constructor(
    private readonly routerService: RouterService,
    private readonly Utils: UtilsService,
    private readonly FundDataservice: FundDataService,
    private readonly DueDiligenceDataservice: DueDiligenceDataService,
    private readonly util: UtilsService
  ) {}

  ngOnInit() {
    this.stateParams = this.routerService.getState().params;
    this.fundId = this.stateParams.fundId;
    this.subscriptionLimits.pipe(take(2)).subscribe((limits) => {
      if (limits?.length) {
        this.entity_type = this.Utils.getEntityType(limits[0]);
      }
    });
    this.user.pipe(take(1)).subscribe((data) => {
      if (data) {
        this.is_admin = data.is_admin;
        this.currUser = data;
        this.is_manager = data.isManager;
        this.isFreeSubscription = data.isFreeSubscription;
        this.FundDataservice.getFund(this.fundId).subscribe((fund) => {
          this.fund = fund;
        });
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
        entity_type: keywordConstants.Product,
        entity_id: this.fund.id,
      });
    }
  }

  invokeAddInvestorDDQDialog() {
    if (!this.isFreeSubscription) {
      this.routerService.navigateWithParams('app.diligence.newddq', {
        type: RequestTypes.INVESTOR,
        entity_type: keywordConstants.Product,
        entity_id: this.fund.id,
      });
    }
  }

  invokeAddProfileDDQDialog() {
    if (!this.isFreeSubscription) {
      this.routerService.navigateWithParams('app.diligence.newddq', {
        type: RequestTypes.PREAPPROVED,
        entity_type: keywordConstants.Product,
        entity_id: this.fund.id,
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
            filter_value: EntityType.Product,
          },
          {
            filter_key: 'entity_id',
            filter_name: 'Entity ID',
            type: 'int',
            operations: 'eq',
            filter_value: +this.fundId,
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
            filter_value: this.currUser.firmInfo.id, //show only standard ddqs
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
      this.fundId
    ).subscribe((response: any) => {
      this.investorDdqs = response;
    });
  }

  getProfileDDQs() {
    this.DueDiligenceDataservice.getProfileDDQ({
      entity_type: 'Fund',
      entity_id: this.fundId,
    }).subscribe((response: any) => {
      this.profileddqs = response;
    });
  }

  getViews() {
    if (!this.is_manager) {
      return;
    }

    this.DueDiligenceDataservice.getViews(this.fundId, 'Fund').subscribe(
      (response: any) => {
        this.views = response;
      }
    );
  }
}
