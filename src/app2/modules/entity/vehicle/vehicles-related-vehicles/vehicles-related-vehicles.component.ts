import { Component, OnInit } from '@angular/core';
import { RouterService } from 'src/app2/services/router.service';
import { VehicleDataService } from 'src/app2/services/vehicle-data.service';
import { statusLabel } from 'src/app2/shared/constants/constant';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take } from 'rxjs/operators';
@Component({
  selector: 'vehicles-related-vehicles',
  templateUrl: './vehicles-related-vehicles.component.html',
  styleUrls: ['./vehicles-related-vehicles.component.css'],
})
export class VehiclesRelatedVehiclesComponent implements OnInit {
  vehicle;
  statusLabel = statusLabel;
  related_entities = [];
  isFreeSubscription;
  stateParams: any;
  firmId: any;
  fundId: any;
  vehicleId: any;
  is_manager: boolean;
  @Select(UserState.getCurrentUserData) user;

  constructor(
    private readonly routerService: RouterService,
    private readonly VehicleDataService: VehicleDataService,
  ) {}

  ngOnInit() {
    this.stateParams = this.routerService.getState().params;
    this.firmId = this.stateParams.firmId;
    this.fundId = this.stateParams.fundId;
    this.vehicleId = this.stateParams.vehicleId;
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.is_manager = data.isManager;
          this.isFreeSubscription = data.isFreeSubscription;
          this.VehicleDataService.getVehicle(
            this.firmId,
            this.fundId,
            this.vehicleId
          ).subscribe((vehicle: any) => {
            this.vehicle = vehicle;
          });
          this.getRelatedVehicles();
        }
      });
  }

  getRelatedVehicles() {
    this.VehicleDataService.getRelatedVehicles(
      this.firmId,
      this.fundId,
      this.vehicleId
    ).subscribe((response: any) => {
      this.related_entities = response;
      const index = this.related_entities?.findIndex(
        (vehicle) => vehicle.id === +this.vehicleId
      );
      if (index > -1) {
        this.related_entities.splice(index, 1);
      }
    });
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
