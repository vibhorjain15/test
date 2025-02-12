import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { RouterService } from 'src/app2/services/router.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take } from 'rxjs/operators';
@Component({
  selector: 'products-monitor-manager',
  templateUrl: './products-monitor-manager.component.html',
  styleUrls: ['./products-monitor-manager.component.css'],
})
export class ProductsMonitorManagerComponent implements OnInit {
  entity_type;
  is_freeSubscription;
  loading_funds;
  fund_list;
  is_admin: any;
  adjust_fund_list = true;
  @Select(UserState.getCurrentUserData) user;
  @Select(UserState.getSubscriptionLimitsData) subscriptionLimits;

  constructor(
    private readonly Utils: UtilsService,
    private readonly http: HttpClient,
    private readonly ModalFactory: CustomModalService,
    private readonly SweetAlert: SweetAlertService,
    private readonly toaster: ToastrService,
    private readonly BaseDataService: BaseDataService,
    private readonly routerService: RouterService,
  ) {}

  ngOnInit(): void {
    this.loading_funds = true;
    this.subscriptionLimits.pipe(take(2)).subscribe((limits) => {
      if (limits?.length) {
        this.entity_type = this.Utils.getEntityType(limits[0]);
      }
    });
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.is_admin = data.isAdmin;
          this.is_freeSubscription = data.isFreeSubscription;
          this.http
            .get('funds', { params: { profile: 'true' } })
            .subscribe((response: any) => {
              this.fund_list = response;
              this.fund_list = this.fund_list.map((fund) => ({
                ...fund,
                display_action_buttons: false,
              }));
              this.loading_funds = false;
            });
        }
      });
  }

  editFund(fund) {
    this.ModalFactory.invoke('manage-fund', {
      initialState: {
        fund: fund,
        source: 'monitor',
        response: (updated_fund: any) => {
          const idx = this.fund_list.findIndex(
            (fund) => fund.id === updated_fund.id
          );
          this.fund_list[idx] = updated_fund;
          this.adjust_fund_list = true;
        },
      },
      class: 'gray modal-lg',
    });
  }

  displayFundRemovalConfirmation(fund) {
    this.SweetAlert.confirm({
      title: `Are you sure you want to remove \"${fund.name}\"?`,
      confirmButtonText: 'Yes, delete fund',
      showLoaderOnConfirm: true,
      focusCancel: true,
      preConfirm: () => {
        return this.removeFund(fund);
      },
    });
  }

  removeFund(fund) {
    this.http.delete(`funds/${fund.id}`).subscribe(
      (response: any) => {
        this.toaster.success(this.entity_type + ' deleted successfully');
        this.fund_list.splice(this.fund_list.indexOf(fund), 1);
        this.adjust_fund_list = true;
      },
      (error: any) => {
        this.toaster.error('Something went wrong. Please try again.');
        const avoid_error_logging_statuses =
          this.BaseDataService.getAvoidErrorLoggingStatusList();
        if (!Array.from(avoid_error_logging_statuses).includes(error.status)) {
          this.Utils.logError('Deleting fund failed', error);
        }
      }
    );
  }

  openNewFundDialog() {
    this.ModalFactory.invoke('manage-fund', {
      initialState: {
        response: (fund) => {
          if (fund) {
            this.fund_list.push(fund);
            this.adjust_fund_list = true;
          }
        },
      },
      class: 'gray modal-lg',
    });
  }

  navigate(fund) {
    const params = {
      firmId: fund.parentFirm.id,
      fundId: fund.id,
    };
    this.is_freeSubscription
      ? this.routerService.navigateWithParams(
          'app.firms.funds.profile.aum_tr',
          params
        )
      : this.routerService.navigateWithParams(
          'app.firms.funds.profile.ddq',
          params
        );
  }
}
