import { Component, OnInit } from '@angular/core';
import { FundDataService } from 'src/app2/services/fund-data.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { RouterService } from 'src/app2/services/router.service';
import { UtilsService } from 'src/app2/services/utils.service';
import {
  keywordConstants,
  statusLabel,
} from 'src/app2/shared/constants/constant';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take } from 'rxjs/operators';
@Component({
  selector: 'products-associated-vehicles',
  templateUrl: './products-associated-vehicles.component.html',
  styleUrls: ['./products-associated-vehicles.component.css'],
})
export class ProductsAssociatedVehiclesComponent implements OnInit {
  fund;
  statusLabel = statusLabel;
  entity_type;
  vehicles = [];
  isFreeSubscription;
  stateParams: any;
  fundId: number;
  parentFirmId: any;
  @Select(UserState.getCurrentUserData) user;

  constructor(
    private readonly routerService: RouterService,
    private readonly Utils: UtilsService,
    private readonly FundDataservice: FundDataService,
    private readonly ModalFactory: CustomModalService,
  ) {}

  ngOnInit() {
    this.stateParams = this.routerService.getState().params;
    this.fundId = Number(this.stateParams.fundId);
    this.parentFirmId = this.stateParams.firmId;
    this.entity_type = this.Utils.getDisplayEntityType(
      keywordConstants.Product
    );
    this.user.pipe(take(1)).subscribe((data) => {
      if (data) {
        this.isFreeSubscription = data.isFreeSubscription;
        this.FundDataservice.getFund(this.fundId).subscribe((fund: any) => {
          this.fund = fund;
        });
        this.getRelatedVehicles();
      }
    });
  }

  addNewVehicleModal() {
    this.ModalFactory.invoke('manage-vehicle', {
      initialState: {
        vehicle: {
          fund_id: Number(this.fundId),
        },
        response: (response) => {
          if (response.fund_id === this.fundId) {
            this.vehicles.push(response);
          }
        },
      },
      class: 'gray modal-lg',
    });
  }

  goBack() {
    window.history.back();
  }

  getRelatedVehicles() {
    const params = {
      fundId: this.fundId,
      firmId: this.parentFirmId,
      pageUrl: `app/firms/${this.parentFirmId}/funds/${this.fundId}/vehicles`,
    };
    this.FundDataservice.getRelatedVehicles(params).subscribe(
      (response: any) => {
        this.vehicles = response;
      }
    );
  }

  navigateToMonitor() {
    this.routerService.navigateWithParams(`app.firms.profile.monitor`, {
      firmId: this.fund.parentFirm.id,
    });
  }

  navigateToInvestments() {
    this.routerService.navigate(`app.monitor.investments`);
  }

  navigateToProfileMonitor(entity) {
    this.routerService.navigateWithParams(
      `app.firms.funds.vehicles.profile.monitor`,
      { firmId: entity.firm_id, fundId: entity.fund_id, vehicleId: entity.id }
    );
  }

  navigateToProfileAumTr(entity) {
    this.routerService.navigateWithParams(
      `app.firms.funds.vehicles.profile.aum_tr`,
      { firmId: entity.firm_id, fundId: entity.fund_id, vehicleId: entity.id }
    );
  }
}
