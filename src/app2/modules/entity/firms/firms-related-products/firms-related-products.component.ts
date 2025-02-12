import { Component, OnInit } from '@angular/core';
import { FirmDataService } from 'src/app2/services/firm-data.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { RouterService } from 'src/app2/services/router.service';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take } from 'rxjs/operators';
import { statusLabel } from 'src/app2/shared/constants/constant';
@Component({
  selector: 'firms-related-products',
  templateUrl: './firms-related-products.component.html',
  styleUrls: ['./firms-related-products.component.css'],
})
export class FirmsRelatedProductsComponent implements OnInit {
  firm;
  related_entities = [];
  statusLabel = statusLabel;
  stateParams: any;
  is_manager: boolean;
  firmId: any;
  @Select(UserState.getCurrentUserData) user;

  constructor(
    private readonly routerService: RouterService,
    private readonly firmDataService: FirmDataService,
    private readonly ModalFactory: CustomModalService,
  ) {}

  ngOnInit(): void {
    this.stateParams = this.routerService.getState().params;
    this.firmId = this.stateParams.firmId;
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.is_manager = data.isManager;
          this.firmDataService.getFirm(this.firmId).subscribe((firm) => {
            this.firm = firm;
          });
          this.getRelatedFunds();
        }
      });
  }

  getRelatedFunds() {
    this.firmDataService
      .getRelatedEntities(this.firmId)
      .subscribe((response: any) => {
        this.related_entities = response;
      });
  }

  addProduct() {
    this.ModalFactory.invoke('manage-fund', {
      initialState: {
        entity_id: this.firm.id,
        response: (fund) => {
          if (fund) {
            this.related_entities.push(fund);
          }
        }
      },
      class: 'gray modal-lg',
    });
  }

  navigateToProfileMonitor(entity) {
    this.routerService.navigateWithParams(`app.firms.funds.profile.monitor`, {
      firmId: entity.parentFirm.id,
      fundId: entity.id,
    });
  }
}
