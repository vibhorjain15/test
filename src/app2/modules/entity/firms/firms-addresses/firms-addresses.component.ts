import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { FirmDataService } from 'src/app2/services/firm-data.service';
import { ManageAddressService } from 'src/app2/services/manage-address.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { RouterService } from 'src/app2/services/router.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take } from 'rxjs/operators';

@Component({
  selector: 'firms-addresses',
  templateUrl: './firms-addresses.component.html',
  styleUrls: ['./firms-addresses.component.css'],
})
export class FirmsAddressesComponent implements OnInit, OnDestroy {
  firm;
  addresses;
  active_actions;
  stateParams: any;
  firmId: any;
  entity_type: string;
  is_admin: any;
  is_manager: boolean;
  subscription: Subscription;
  @Select(UserState.getCurrentUserData) user;
  addressActionList = [
    {
      label: 'Edit Address',
      key: 'edit',
    },
    {
      label: 'Delete Address',
      key: 'delete',
    },
  ];
  constructor(
    private readonly routerService: RouterService,
    private readonly firmDataService: FirmDataService,
    private readonly ModalFactory: CustomModalService,
    private readonly manageAddressService: ManageAddressService,
    private readonly SweetAlert: SweetAlertService,
  ) {}

  ngOnInit() {
    this.stateParams = this.routerService.getState().params;
    this.firmId = this.stateParams.firmId;
    this.entity_type = 'Firm';
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.is_admin = data.isAdmin;
          this.is_manager = data.isManager;
          this.firmDataService.getFirm(this.firmId).subscribe((firm) => {
            this.firm = firm;
          });
          this.getAddresses();
          this.subscribeForAddressChanges();
        }
      });
  }

  subscribeForAddressChanges() {
    this.subscription = this.manageAddressService.addressChanged$.subscribe(
      () => {
        this.addresses = this.manageAddressService.addresses;
      }
    );
  }

  getAddresses() {
    const params = {
      entity_id: this.firmId,
      entity_type: 'Firm',
    };
    this.manageAddressService.getAddresses(params, () => {
      this.addresses = this.manageAddressService.addresses;
    });
  }

  openAddressDialog() {
    this.ModalFactory.invoke('manage-address', {
      initialState: {
        entity_id: this.firmId,
        entity_type: 'Firm',
      },
    });
  }

  openEditAddressDialogue(address) {
    this.ModalFactory.invoke('manage-address', {
      initialState: {
        entity_id: this.firmId,
        entity_type: 'Firm',
        address: address,
      },
    });
  }

  deleteAddress(address) {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to delete this address?',
      confirmButtonText: 'Yes, please.',
      focusCancel: true,
      showLoaderOnConfirm: true,
      preConfirm: () => {
        this.manageAddressService.deleteAddress(address.id);
      },
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  handleDropdownClick(addressAction: any, address) {
    if (addressAction.key === 'edit') {
      this.openEditAddressDialogue(address);
    } else if (addressAction.key === 'delete') {
      this.deleteAddress(address);
    }
  }

  toggleDropdownActions(address) {
    this.addresses.map(x => x.isOpen = false);
    address.isOpen = true;
  }
}
