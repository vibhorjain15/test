import { Component, OnInit } from '@angular/core';
import { RouterService } from 'src/app2/services/router.service';
import { StrategyDataService } from 'src/app2/services/strategy-data.service';
import { IssueType } from 'src/app2/shared/constants/constant';
import { statusLabel } from 'src/app2/shared/constants/constant';
@Component({
  selector: 'strategies-recommendations',
  templateUrl: './strategies-recommendations.component.html',
})
export class StrategiesRecommendationsComponent implements OnInit {
  stateParams: any;
  entity_id: any;
  entity_type: string;
  strategy: any;
  statusLabel = statusLabel;
  constructor(
    private readonly route: RouterService,
    private readonly StrategyDataservice: StrategyDataService
  ) {}

  ngOnInit(): void {
    this.stateParams = this.route.getState().params;
    this.entity_id = this.stateParams.strategyId;
    this.entity_type = IssueType.Strategy;
    this.StrategyDataservice.getStrategy(this.entity_id).subscribe(
      (strategy: any) => {
        this.strategy = strategy;
      }
    );
  }
  navigateToStrategies() {
    this.route.navigate(`app.monitor.strategies`);
  }
  navigateToProfileMonitor() {
    this.route.navigateWithParams(`app.firms.profile.monitor`, {
      firmId: this.strategy.parentFirm.id,
    });
  }
}
