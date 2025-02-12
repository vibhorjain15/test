import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { FundDataService } from 'src/app2/services/fund-data.service';
import { RouterService } from 'src/app2/services/router.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { UtilsService } from 'src/app2/services/utils.service';
import {
  keywordConstants,
  statusLabel,
} from 'src/app2/shared/constants/constant';

import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take } from 'rxjs/operators';
@Component({
  selector: 'products-associated-contacts',
  templateUrl: './products-associated-contacts.component.html',
  styleUrls: ['./products-associated-contacts.component.css'],
})
export class ProductsAssociatedContactsComponent implements OnInit {
  fund;
  statusLabel = statusLabel;
  related_contacts = [];
  public_contacts = [];
  isFirmOwner;
  is_manager;
  stateParams: any;
  fundId: any;
  current_user: any;
  departmentsDict;
  departments: any;
  isFreeSubscription: any;
  @Select(UserState.getCurrentUserData) user;

  constructor(
    private readonly routerService: RouterService,
    private readonly Utils: UtilsService,
    private readonly FundDataservice: FundDataService,
    private readonly http: HttpClient,
    private readonly SweetAlert: SweetAlertService,
    private readonly toaster: ToastrService,
    private readonly BaseDataService: BaseDataService,
    private readonly customModalService: CustomModalService
  ) {}

  ngOnInit() {
    this.stateParams = this.routerService.getState().params;
    this.fundId = this.stateParams.fundId;
    this.public_contacts = [];
    this.isFirmOwner = false;
    this.departmentsDict = {};
    this.user.pipe(take(1)).subscribe((data) => {
      if (data) {
        this.current_user = data;
        this.is_manager = data.isManager;
        this.isFreeSubscription = data.isFreeSubscription;
        if (Number(this.stateParams.firmId) === this.current_user.firmInfo.id) {
          this.isFirmOwner = true;
        }
        this.FundDataservice.getFund(this.fundId).subscribe((fund: any) => {
          this.fund = fund;
        });
        this.getDepartments();
        this.getRelatedContacts();
        if (this.isFirmOwner) {
          this.getPublicContacts();
        } else {
          this.getInvestorPublicContacts();
        }
      }
    });
  }

  goToUserPage(user) {
    if (this.isFirmOwner) {
      this.routerService.navigateWithParams(
        'app.firm.settings.permission.detail',
        {
          entity_id: user.id,
          entity_type: 'User',
          entity_name: user.fullName,
        }
      );
    }
  }

  getPublicContacts() {
    const params = {
      entity_id: this.fundId,
      entity_type: keywordConstants.Product,
    };
    this.http.get('internalcontacts', { params }).subscribe((response: any) => {
      this.public_contacts = response;
    });
  }

  getDepartments() {
    this.http.get('internalContactTypes').subscribe((response: any) => {
      this.departments = response;
      this.departmentsDict = {};
      this.departments.forEach(
        (department) =>
          (this.departmentsDict[department.text] = department.description)
      );
    });
  }

  getFunctionDescription(key) {
    const department = this.departmentsDict[key];
    return department;
  }

  addContactToPortfolio(entity) {
    if (!this.isFreeSubscription && !entity.is_tracking) {
      const params = { ...entity };
      params.firstName = entity.firstname;
      params.lastName = entity.lastname;
      this.customModalService.invoke('manage-contact', {
        initialState: {
          entity_details: this.fund,
          entity_type: keywordConstants.Product,
          contact: params,
          source: 'Public',
          response: (contacts) => {
            this.getInvestorPublicContacts();
            this.getRelatedContacts();
          },
        },
        class: 'gray modal-lg',
      });
    }
  }

  getInvestorPublicContacts() {
    const params = {
      entity_id: this.fundId,
      entity_type: keywordConstants.Product,
    };
    this.http.get('publicContacts', { params }).subscribe((response: any) => {
      this.public_contacts = response;
    });
  }

  getRelatedContacts() {
    this.FundDataservice.getRelatedContacts(this.fundId).subscribe(
      (response: any) => {
        this.related_contacts = response;
        this.related_contacts.forEach((contact) => {
          if (contact.tag_names) {
            contact.tag_names_arr = contact.tag_names.split(',');
          }
        });
      }
    );
  }

  displayContactRemovalConfirmation(contact) {
    this.SweetAlert.confirm({
      title: `Are you sure you want to remove \"${contact.fullName}\"?`,
      confirmButtonText: 'Yes, delete contact',
      showLoaderOnConfirm: true,
      focusCancel: true,
      preConfirm: () => {
        this.removeContact(contact);
      },
    });
  }

  addPublicContact() {
    this.customModalService.invoke('manage-public-contacts', {
      initialState: {
        entity_details: this.fund,
        entity_type: keywordConstants.Product,
        existing_contacts: this.public_contacts,
        success: (contacts) => {
          this.getPublicContacts();
        },
      },
    });
  }

  editPublicContact(contact) {
    this.customModalService.invoke('manage-public-contacts', {
      initialState: {
        contact: contact,
        entity_details: this.fund,
        entity_type: keywordConstants.Product,
        success: (contacts) => {
          this.getPublicContacts();
        },
      },
    });
  }

  removeContact(contact) {
    this.http
      .delete('entityuserassignments', {
        params: {
          entity_id: this.fundId,
          entity_type: keywordConstants.Product,
          user_id: contact.id,
        },
      })
      .subscribe(
        (response: any) => {
          this.toaster.success('', 'Contact deleted successfully');
          this.public_contacts.splice(this.public_contacts.indexOf(contact), 1);
        },
        (error: any) => {
          const avoid_error_logging_statuses =
            this.BaseDataService.getAvoidErrorLoggingStatusList();
          if (!avoid_error_logging_statuses.includes(error.status)) {
            this.Utils.logError('Deleting internal contact failed', error);
          }
        }
      );
  }

  goToSelectedContact(entity) {
    this.BaseDataService.setContactPageUrl('');
    this.routerService.navigateWithParams('app.monitor.contact', {
      Id: entity.id,
    });
  }

  addContact() {
    if (!this.isFreeSubscription) {
      this.fund.firm_id = this.fund.parentFirm.id;
      this.customModalService.invoke('manage-contact', {
        initialState: {
          entity_details: this.fund,
          entity_type: keywordConstants.Product,
          response: (contacts) => {
            if (contacts && contacts.length > 0) {
              this.related_contacts = this.related_contacts.concat(contacts);
            }
          },
        },
        class: 'gray modal-lg',
      });
    }
  }

  navigateToMonitor() {
    this.routerService.navigateWithParams(`app.firms.profile.monitor`, {
      firmId: this.fund.parentFirm.id,
    });
  }

  navigateToContacts(entity) {
    this.routerService.navigateWithParams(`app.contacts`, { Id: entity.id });
  }

  trackByIndex(index: number, element): number {
    return index;
  }

  gotoPremium() {
    this.SweetAlert.premiumAlert();
  }
}
