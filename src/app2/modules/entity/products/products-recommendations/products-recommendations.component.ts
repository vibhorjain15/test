import { Component, OnInit } from '@angular/core';
import { FundDataService } from 'src/app2/services/fund-data.service';
import { RouterService } from 'src/app2/services/router.service';
import { IssueType } from 'src/app2/shared/constants/constant';
import {
  statusLabel,
} from 'src/app2/shared/constants/constant';
@Component({
  selector: 'products-recommendations',
  templateUrl: './products-recommendations.component.html',
})
export class ProductsRecommendationsComponent implements OnInit {
  stateParams: any;
  fundId: any;
  entity_type = IssueType.Product;
  statusLabel = statusLabel;
  fund: any;

  constructor(
    private readonly route: RouterService,
    private readonly FundDataservice: FundDataService
  ) {}

  ngOnInit(): void {
    this.stateParams = this.route.getState().params;
    this.fundId = this.stateParams.fundId;
    this.FundDataservice.getFund(this.fundId).subscribe((fund: any) => {
      this.fund = fund;
    });
  }

  navigateToInvestments() {
    this.route.navigate(`app.monitor.investments`);
  }

  navigateToMonitor() {
    this.route.navigateWithParams(`app.firms.profile.monitor`, {
      firmId: this.fund.parentFirm.id,
    });
  }
}
