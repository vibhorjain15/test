import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { FirmDataService } from 'src/app2/services/firm-data.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take } from 'rxjs/operators';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { ManageAddressService } from 'src/app2/services/manage-address.service';
@Component({
  selector: 'my-firm-address',
  templateUrl: './my-firm-address.component.html',
  styleUrls: ['./my-firm-address.component.css'],
})
export class MyFirmAddressComponent implements OnInit {
  firm;
  addresses = [];
  active_actions;
  firmId: any;
  is_admin: any;
  entity_type: string;
  is_manager: boolean;
  countries = [];
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
    private readonly firmDataService: FirmDataService,
    private readonly BaseDataService: BaseDataService,
    private readonly http: HttpClient,
    private readonly SweetAlert: SweetAlertService,
    private readonly toaster: ToastrService,
    private customModalService: CustomModalService,
    private readonly manageAddressService: ManageAddressService
  ) {}

  ngOnInit(): void {
    this.entity_type = 'Firm';
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.is_admin = data.is_admin;
          this.is_manager = data.isManager;
          this.firmId = data.firmInfo.id;
          this.firmDataService.getFirm(this.firmId).subscribe((firm) => {
            this.firm = firm;
          });
          this.getAddresses();
        }
      });
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

  getCountries() {
    this.http.get('country').subscribe((response: any) => {
      this.countries = response;
      this.addresses.forEach((address) => {
        address.country_name = this.getCountryNameFromId(address.country);
      });
    });
  }

  getCountryNameFromId(id) {
    const country = this.countries.find((country) => country.id === id);
    return country ? country.value : '';
  }

  openAddressDialog() {
    this.customModalService.invoke('manage-address', {
      initialState: {
        entity_id: this.firmId,
        entity_type: 'Firm',
      },
    });
  }

  openEditAddressDialogue(address) {
    this.customModalService.invoke('manage-address', {
      initialState: {
        entity_id: this.firmId,
        entity_type: 'Firm',
        address: address,
      },
    });
  }

  deleteAddress(address) {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to delete this address ?',
      confirmButtonText: 'Yes, please.',
      showLoaderOnConfirm: true,
      customClass: 'danger',
      focusCancel: true,
      preConfirm: () => {
        this.BaseDataService.deleteAddress(address.id).subscribe(() => {
          const idx = this.addresses.findIndex(
            (address) => address.id === address.id
          );
          this.addresses.splice(idx, 1);
          this.toaster.success('Address deleted successfully');
        });
      },
    });
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
