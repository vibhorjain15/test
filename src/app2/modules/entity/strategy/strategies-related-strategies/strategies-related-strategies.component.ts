import { Component, OnInit } from '@angular/core';
import { RouterService } from 'src/app2/services/router.service';
import { StrategyDataService } from 'src/app2/services/strategy-data.service';
import { Select, Store } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take } from 'rxjs/operators';
import { statusLabel } from 'src/app2/shared/constants/constant';
@Component({
  selector: 'strategies-related-strategies',
  templateUrl: './strategies-related-strategies.component.html',
  styleUrls: ['./strategies-related-strategies.component.css'],
})
export class StrategiesRelatedStrategiesComponent implements OnInit {
  strategy;
  related_entities = [];
  stateParams: any;
  strategyId: any;
  is_manager: boolean;
  statusLabel = statusLabel;
  @Select(UserState.getCurrentUserData) user;

  constructor(
    private readonly routerService: RouterService,
    private readonly StrategyDataservice: StrategyDataService,
  ) {}

  ngOnInit(): void {
    this.stateParams = this.routerService.getState().params;
    this.strategyId = this.stateParams.strategyId;
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.is_manager = data.isManager;
          this.StrategyDataservice.getStrategy(this.strategyId).subscribe(
            (strategy) => {
              this.strategy = strategy;
            }
          );
          this.getRelatedStrategies();
        }
      });
  }

  getRelatedStrategies() {
    this.StrategyDataservice.getRelatedEntities(this.strategyId).subscribe(
      (response: any) => {
        this.related_entities = response;
        const index = this.related_entities?.findIndex(
          (strategy) => strategy.id === +this.strategyId
        );
        if (index > -1) {
          this.related_entities.splice(index, 1);
        }
      }
    );
  }

  navigateToProfileMonitor(entity) {
    this.routerService.navigateWithParams(
      `app.firms.strategies.profile.monitor`,
      { firmId: entity.parentFirm.id, strategyId: entity.id }
    );
  }
}
