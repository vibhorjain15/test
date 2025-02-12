import { Component, OnInit } from '@angular/core';
import { RouterService } from 'src/app2/services/router.service';
import { statusLabel } from 'src/app2/shared/constants/constant';
import { FundDataService } from 'src/app2/services/fund-data.service';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take } from 'rxjs/operators';
@Component({
  selector: 'products-related-products',
  templateUrl: './products-related-products.component.html',
  styleUrls: ['./products-related-products.component.css'],
})
export class ProductsRelatedProductsComponent implements OnInit {
  fund;
  statusLabel = statusLabel;
  related_entities = [];
  stateParams: any;
  fundId: any;
  is_manager: boolean;
  @Select(UserState.getCurrentUserData) user;

  constructor(
    private readonly routerService: RouterService,
    private readonly FundDataservice: FundDataService,
  ) {}

  ngOnInit(): void {
    this.stateParams = this.routerService.getState().params;
    this.fundId = this.stateParams.fundId;
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.is_manager = data.isManager;
          this.FundDataservice.getFund(this.fundId).subscribe((fund: any) => {
            this.fund = fund;
          });
          this.getRelatedFunds();
        }
      });
  }

  getRelatedFunds() {
    this.FundDataservice.getRelatedEntities(this.fundId).subscribe(
      (response: any) => {
        this.related_entities = response;
        const index = this.related_entities?.findIndex(
          (fund) => fund.id === +this.fundId
        );
        if (index > -1) {
          this.related_entities.splice(index, 1);
        }
      }
    );
  }

  navigateToMonitor() {
    this.routerService.navigateWithParams(`app.firms.profile.monitor`, {
      firmId: this.fund.parentFirm.id,
    });
  }
}
