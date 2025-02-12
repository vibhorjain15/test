import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { DueDiligenceDataService } from 'src/app2/services/due-diligence-data.service';
import { FirmDataService } from 'src/app2/services/firm-data.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take, tap } from 'rxjs/operators';
import { GetCurrentUser } from 'src/app2/store/user/user.action';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { EntityType } from 'src/app2/modules/questionnaire/constants/Response-type.constant';
import { RouterService } from 'src/app2/services/router.service';
import {
  NewRequestTypes,
  RequestTypes,
  keywordConstants,
} from 'src/app2/shared/constants/constant';
@Component({
  selector: 'my-firm-ddqs',
  templateUrl: './my-firm-ddqs.component.html',
  styleUrls: ['./my-firm-ddqs.component.css'],
})
export class MyFirmDdqsComponent implements OnInit {
  firm;
  is_manager;
  is_freeSubscriber;
  profileddqs;
  entity_type;
  firmId: any;
  pageUrl: string;
  is_admin: any;
  ddqs;
  investorDdqs;
  views: any;
  NewRequestTypes = NewRequestTypes;
  @Select(UserState.getCurrentUserData) user;
  @Select(UserState.getSubscriptionLimitsData) subscriptionLimits;

  constructor(
    private readonly Utils: UtilsService,
    private readonly firmDataService: FirmDataService,
    private readonly http: HttpClient,
    private readonly DueDiligenceDataservice: DueDiligenceDataService,
    private readonly router: RouterService,
    private readonly util: UtilsService
  ) {}

  ngOnInit(): void {
    this.pageUrl = `firms/${this.firmId}/profile/ddqs`;
    this.subscriptionLimits.pipe(take(2)).subscribe((limits) => {
      if (limits?.length) {
        this.entity_type = this.Utils.getEntityType(limits[0]);
      }
    });
    this.user.pipe(take(1)).subscribe((data) => {
      if (data) {
        this.is_manager = data.isManager;
        this.firmId = data.firmInfo.id;
        this.is_admin = data.isAdmin;
        this.is_freeSubscriber = data.isFreeSubscription;
        this.firmDataService.getFirm(this.firmId).subscribe((firm) => {
          this.firm = firm;
        });
        this.getDDQs();
        this.getProfileDDQs();
        this.getInvestorDDQs();
      }
    });
  }

  invokeAddDDQDialog() {
    if (!this.is_freeSubscriber) {
      this.router.navigateWithParams('app.diligence.newddq', {
        type: RequestTypes.SHAREABLE,
        entity_type: keywordConstants.Firm,
        entity_id: this.firm.id,
      });
    }
  }

  invokeAddInvestorDDQDialog() {
    if (!this.is_freeSubscriber) {
      this.router.navigateWithParams('app.diligence.newddq', {
        type: RequestTypes.INVESTOR,
        entity_type: keywordConstants.Firm,
        entity_id: this.firm.id,
      });
    }
  }

  invokeAddProfileDDQDialog() {
    if (!this.is_freeSubscriber) {
      this.router.navigateWithParams('app.diligence.newddq', {
        type: RequestTypes.PREAPPROVED,
        entity_type: keywordConstants.Firm,
        entity_id: this.firm.id,
      });
    }
  }

  getDDQs() {
    this.http
      .post('service/dvapi_service/diligence_search', {
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
              filter_value: EntityType.Firm,
            },
            {
              filter_key: 'entity_id',
              filter_name: 'Entity ID',
              type: 'int',
              operations: 'eq',
              filter_value: this.firmId,
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
              filter_value: this.firmId, //show only standard ddqs
              operations: 'eq',
              type: 'int',
            },
          ],
        },
        type: 'all',
      })
      .subscribe((response: any) => {
        this.ddqs = this.util.sortByDate(response.data, 'last_updated_at');
      });
  }

  getInvestorDDQs() {
    this.DueDiligenceDataservice.getInvestorDiligenceByFirm(
      this.firmId
    ).subscribe((response: any) => {
      this.investorDdqs = response;
    });
  }

  getProfileDDQs() {
    this.DueDiligenceDataservice.getProfileDDQ({
      entity_type: 'Firm',
      entity_id: this.firmId,
    }).subscribe((response: any) => {
      this.profileddqs = response;
    });
  }

  getViews() {
    if (!this.is_manager) {
      return;
    }
    this.DueDiligenceDataservice.getViews(this.firmId, 'Firm').subscribe(
      (response: any) => {
        this.views = response;
      }
    );
  }
}
