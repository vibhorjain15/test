import { Component, OnInit } from '@angular/core';
import { RouterService } from 'src/app2/services/router.service';
import { IssueType } from 'src/app2/shared/constants/constant';
import { statusLabel } from 'src/app2/shared/constants/constant';
import { VehicleDataService } from 'src/app2/services/vehicle-data.service';
import { take } from 'rxjs/operators';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
@Component({
  selector: 'vehicles-recommendations',
  templateUrl: './vehicles-recommendations.component.html',
})
export class VehiclesRecommendationsComponent implements OnInit {
  stateParams: any;
  vehicleId: any;
  entity_type = IssueType.Vehicle;
  statusLabel = statusLabel;
  firmId: any;
  fundId: any;
  vehicle: any;
  is_manager: any;
  is_investor: any;
  @Select(UserState.getCurrentUserData) user;

  constructor(
    private readonly route: RouterService,
    private readonly VehicleDataService: VehicleDataService,
  ) {}

  ngOnInit(): void {
    this.stateParams = this.route.getState().params;
    this.firmId = this.stateParams.firmId;
    this.fundId = this.stateParams.fundId;
    this.vehicleId = this.stateParams.vehicleId;
    this.VehicleDataService.getVehicle(
      this.firmId,
      this.fundId,
      this.vehicleId
    ).subscribe((vehicle: any) => {
      this.vehicle = vehicle;
    });
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.is_manager = data.isManager;
          this.is_investor = data.isInvestor;
        }
      });
  }
  navigateToVehicles() {
    this.route.navigate(`app.monitor.vehicles`);
  }
  navigateToProfileMonitor() {
    this.route.navigateWithParams(`app.firms.funds.profile.monitor`, {
      firmId: this.vehicle.firm_id,
      fundId: this.vehicle.fund_id,
    });
  }
  navigateToProfileAumTr() {
    this.route.navigateWithParams(`app.firms.funds.profile.aum_tr`, {
      firmId: this.vehicle.firm_id,
      fundId: this.vehicle.fund_id,
    });
  }
}
