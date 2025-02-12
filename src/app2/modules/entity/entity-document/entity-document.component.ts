import { Component, OnInit } from '@angular/core';
import { Select, Selector, Store } from '@ngxs/store';
import { take, tap } from 'rxjs/operators';
import { DocumentDataService } from 'src/app2/services/document-data.service';
import { FirmDataService } from 'src/app2/services/firm-data.service';
import { FundDataService } from 'src/app2/services/fund-data.service';
import { RouterService } from 'src/app2/services/router.service';
import { StrategyDataService } from 'src/app2/services/strategy-data.service';
import { VehicleDataService } from 'src/app2/services/vehicle-data.service';
import { statusLabel } from 'src/app2/shared/constants/constant';
import { GetCurrentUser } from 'src/app2/store/user/user.action';
import { UserState } from 'src/app2/store/user/user.state';

@Component({
  selector: 'entity-document',
  templateUrl: './entity-document.component.html',
})
export class EntityDocumentComponent implements OnInit {
  stateParams: any;
  entity_type: string;
  entity_id: any;
  @Select(UserState.getFirmPreferenceData) getFirmPreferenceData;
  firm: Object;
  documentCount: number = 0;
  entity_label: string;
  pageurl: string;
  firmId: any;
  entity: any;
  @Select(UserState.getCurrentUserData) user;
  monitorPageUrl: string;
  is_manager: boolean;
  statusLabel = statusLabel;
  isEntityDeactivated: boolean;
  isEntityInactive: boolean;
  constructor(
    private readonly route: RouterService,
    private readonly store: Store,
    private readonly firmDataService: FirmDataService,
    private readonly fundDataservice: FundDataService,
    private readonly vehicleDataService: VehicleDataService,
    private readonly strategyDataservice: StrategyDataService,
    private readonly documentDataservice: DocumentDataService,
    private readonly routerService: RouterService
  ) {}

  ngOnInit(): void {
    this.stateParams = this.routerService.getState().params;
    this.pageurl = window.location.hash.slice(1);
    this.firmId = this.stateParams.firmId;
    if (this.stateParams.vehicleId) {
      this.entity_id = parseInt(this.stateParams.vehicleId);
      this.entity_type = 'Vehicle';
      this.monitorPageUrl = 'app.monitor.vehicles';
    } else if (this.stateParams.fundId) {
      this.entity_id = parseInt(this.stateParams.fundId);
      this.entity_type = 'Fund';
      this.monitorPageUrl = 'app.monitor.investments';
    } else if (this.stateParams.strategyId) {
      this.entity_id = parseInt(this.stateParams.strategyId);
      this.entity_type = 'Strategy';
      this.monitorPageUrl = 'app.monitor.strategies';
    } else {
      this.entity_id = parseInt(this.stateParams.firmId);
      this.entity_type = 'Firm';
      this.monitorPageUrl = 'app.monitor.firms';
    }
    this.entity_label =
      this.entity_type === 'Fund'
        ? 'Product'
        : this.entity_type === 'DueDiligence'
        ? 'Diligence'
        : this.entity_type;
    this.user.pipe(take(1)).subscribe((data) => {
      if (data) {
        if (!this.entity_id) {
          this.entity_id = data.firmInfo.id;
          this.firmId = data.firmInfo.id;
          this.is_manager = data.isManager;
        }
        this.getEntityDetails();
      }
    });
  }

  getEntityDetails() {
    if (this.entity_type === 'Firm') {
      this.firmDataService.getFirm(this.entity_id).subscribe(
        (firm) => {
          this.entity = firm;
          this.isEntityInactive = !this.entity.active;
        },
        (e) => {}
      );
    } else if (this.entity_type === 'Fund') {
      this.fundDataservice.getFund(this.entity_id).subscribe(
        (fund: any) => {
          this.entity = fund;
          this.isEntityInactive = !this.entity.active;
          this.isEntityDeactivated =
            !this.entity.platform_active && this.entity.active;
        },
        (e) => {}
      );
    } else if (this.entity_type === 'Strategy') {
      this.strategyDataservice.getStrategy(this.entity_id).subscribe(
        (strategy) => {
          this.entity = strategy;
          this.isEntityInactive = !this.entity.active;
          this.isEntityDeactivated =
            !this.entity.platform_active && this.entity.active;
        },
        (e) => {}
      );
    } else if (this.entity_type === 'Vehicle') {
      this.vehicleDataService
        .getVehicle(this.firmId, this.stateParams.fundId, this.entity_id)
        .subscribe(
          (vehicle: any) => {
            this.entity = vehicle;
            this.isEntityInactive = !this.entity.is_active;
            this.isEntityDeactivated =
              !this.entity.platform_active && this.entity.is_active;
          },
          (e) => {
            this.entity = [];
          }
        );
    }
    this.getDocumentCounts();
  }
  getDocumentCounts() {
    this.documentDataservice
      .getAttachmentAssignmentCount(this.entity_type, this.entity_id)
      .subscribe(
        (response: any) => {
          this.documentCount = response.count;
        },
        (e) => {
          this.documentCount = 0;
        }
      );
  }

  navigateToMonitorPage() {
    this.route.navigate(this.monitorPageUrl);
  }

  navigateToParentFirmPage() {
    this.route.navigateWithParams(`app.firms.profile.monitor`, {
      firmId: this.entity?.parentFirm?.id,
    });
  }
  navigateToParentProductMonitor() {
    this.route.navigateWithParams(`app.firms.funds.profile.monitor`, {
      firmId: this.entity.firm_id,
      fundId: this.entity.fund_id,
    });
  }

  navigateToProductAumTr() {
    this.routerService.navigateWithParams(`app.firms.funds.profile.aum_tr`, {
      firmId: this.entity.firm_id,
      fundId: this.entity.fund_id,
    });
  }
}
