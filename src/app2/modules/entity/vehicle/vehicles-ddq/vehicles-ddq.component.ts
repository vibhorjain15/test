import { Component, OnInit } from '@angular/core';
import { DueDiligenceDataService } from 'src/app2/services/due-diligence-data.service';
import { RouterService } from 'src/app2/services/router.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take } from 'rxjs/operators';
import { VehicleDataService } from 'src/app2/services/vehicle-data.service';
import { EntityType } from 'src/app2/modules/questionnaire/constants/Response-type.constant';
import {
  RequestTypes,
  keywordConstants,
  NewRequestTypes,
} from 'src/app2/shared/constants/constant';
import { CurrentUserModel } from 'src/app2/store/user/user.model';

@Component({
  selector: 'vehicles-ddq',
  templateUrl: './vehicles-ddq.component.html',
  styleUrls: ['./vehicles-ddq.component.css'],
})
export class VehiclesDdqComponent implements OnInit {
  vehicle;
  investorDdqs;
  entity_type;
  ddqs;
  profileddqs;
  stateParams: any;
  vehicleId: any;
  firmId: any;
  fundId: any;
  is_admin: any;
  is_manager: boolean;
  isFreeSubscription: boolean;
  views: any;
  NewRequestTypes = NewRequestTypes;
  @Select(UserState.getCurrentUserData) user;
  currentUser: CurrentUserModel;

  constructor(
    private readonly routerService: RouterService,
    private readonly VehicleDataService: VehicleDataService,
    private readonly DueDiligenceDataservice: DueDiligenceDataService,
    private readonly util: UtilsService
  ) {}

  ngOnInit() {
    this.stateParams = this.routerService.getState().params;
    this.vehicleId = this.stateParams.vehicleId;
    this.firmId = this.stateParams.firmId;
    this.fundId = this.stateParams.fundId;
    this.entity_type = 'Vehicle';
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.currentUser = data;
          this.is_admin = data.is_admin;
          this.is_manager = data.isManager;
          this.isFreeSubscription = data.isFreeSubscription;
          this.VehicleDataService.getVehicle(
            this.firmId,
            this.fundId,
            this.vehicleId
          ).subscribe((vehicle: any) => {
            this.vehicle = vehicle;
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
        entity_type: keywordConstants.Vehicle,
        entity_id: this.vehicle.id,
      });
    }
  }

  invokeAddInvestorDDQDialog() {
    if (!this.isFreeSubscription) {
      this.routerService.navigateWithParams('app.diligence.newddq', {
        type: RequestTypes.INVESTOR,
        entity_type: keywordConstants.Vehicle,
        entity_id: this.vehicle.id,
      });
    }
  }

  invokeAddProfileDDQDialog() {
    if (!this.isFreeSubscription) {
      this.routerService.navigateWithParams('app.diligence.newddq', {
        type: RequestTypes.PREAPPROVED,
        entity_type: keywordConstants.Vehicle,
        entity_id: this.vehicle.id,
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
            filter_value: EntityType.Vehicle,
          },
          {
            filter_key: 'entity_id',
            filter_name: 'Entity ID',
            type: 'int',
            operations: 'eq',
            filter_value: +this.vehicleId,
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
            filter_value: this.currentUser.firmInfo.id, //show only standard ddqs
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
    this.DueDiligenceDataservice.getInvestorDiligenceByVehicle(
      this.fundId,
      this.vehicleId
    ).subscribe((response: any) => {
      this.investorDdqs = response;
    });
  }

  getProfileDDQs() {
    this.DueDiligenceDataservice.getProfileDDQ({
      entity_type: 'Vehicle',
      entity_id: this.vehicleId,
    }).subscribe((response: any) => {
      this.profileddqs = response;
    });
  }
}
