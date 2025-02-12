import { Component, OnInit } from '@angular/core';
import { RouterService } from 'src/app2/services/router.service';
import { StrategyDataService } from 'src/app2/services/strategy-data.service';
import { statusLabel } from 'src/app2/shared/constants/constant';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take } from 'rxjs/operators';
@Component({
  selector: 'strategies-associated-products',
  templateUrl: './strategies-associated-products.component.html',
  styleUrls: ['./strategies-associated-products.component.css'],
})
export class StrategiesAssociatedProductsComponent implements OnInit {
  strategy;
  associated_products = [];
  stateParams: any;
  strategyId: any;
  firmId: any;
  is_manager: boolean;
  statusLabel = statusLabel;
  @Select(UserState.getCurrentUserData) user;

  constructor(
    private readonly routerService: RouterService,
    private readonly StrategyDataservice: StrategyDataService,
    private readonly ModalFactory: CustomModalService,
  ) {}

  ngOnInit() {
    this.stateParams = this.routerService.getState().params;
    this.strategyId = this.stateParams.strategyId;
    this.firmId = this.stateParams.firmId;
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.is_manager = data.isManager;
          this.StrategyDataservice.getStrategy(this.strategyId).subscribe(
            (strategy: any) => {
              this.strategy = strategy;
              this.associated_products = strategy.associated_products;
            }
          );
        }
      });
  }

  addNewProductModal() {
    this.ModalFactory.invoke('manage-fund', {
      initialState: {
        entity_id: this.firmId,
        parent_strategy: this.strategy.id,
        response: (fund) => {
          if (fund) {
            this.associated_products.push(fund);
          }
        },
      },
      class: 'gray modal-lg',
    });
  }

  navigateToStrategies() {
    this.routerService.navigate(`app.monitor.strategies`);
  }

  navigateToProfileMonitor(entity) {
    this.routerService.navigateWithParams(`app.funds.profile.monitor`, {
      firmId: entity.parentFirm?.id,
      fundId: entity.id,
    });
  }
}
