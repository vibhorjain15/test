import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { FirmDataService } from 'src/app2/services/firm-data.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { RouterService } from 'src/app2/services/router.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { UtilsService } from 'src/app2/services/utils.service';
import {
  keywordConstants,
  statusLabel,
} from 'src/app2/shared/constants/constant';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take } from 'rxjs/operators';
@Component({
  selector: 'firms-associated-contacts',
  templateUrl: './firms-associated-contacts.component.html',
  styleUrls: ['./firms-associated-contacts.component.css'],
})
export class FirmsAssociatedContactsComponent implements OnInit {
  firm;
  isFreeSubscription;
  related_contacts;
  statusLabel = statusLabel;
  public_contacts;
  visible_contacts;
  isFirmOwner;
  is_manager;
  stateParams: any;
  firmId: any;
  current_user: any;
  departmentsDict: {};
  departments: any;
  @Select(UserState.getCurrentUserData) user;

  constructor(
    private readonly routerService: RouterService,
    private readonly Utils: UtilsService,
    private readonly firmDataService: FirmDataService,
    private readonly http: HttpClient,
    private readonly BaseDataService: BaseDataService,
    private readonly SweetAlert: SweetAlertService,
    private readonly toaster: ToastrService,
    private readonly CustomModalFactory: CustomModalService,
  ) {}

  ngOnInit() {
    this.stateParams = this.routerService.getState().params;
    this.firmId = this.stateParams.firmId;
    this.public_contacts = [];
    this.related_contacts = [];
    this.visible_contacts = [];
    this.isFirmOwner = false;
    this.departmentsDict = {};
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.current_user = data;
          this.is_manager = data.isManager;
          this.isFreeSubscription = data.isFreeSubscription;
          if (Number(this.firmId) === this.current_user.firmInfo.id) {
            this.isFirmOwner = true;
          }
          this.firmDataService.getFirm(this.firmId).subscribe((firm) => {
            this.firm = firm;
          });
          this.getRelatedContacts();
          this.getDepartments();
          this.getPublicContacts();
          if (!this.isFirmOwner) {
            this.getInvestorPublicContacts();
          }
        }
      });
  }

  goToUserPage(user) {
    if (this.isFirmOwner || (!this.isFirmOwner && this.is_manager)) {
      this.routerService.navigateWithParams(
        `app.firm.settings.permission.detail`,
        { entity_id: user.id, entity_type: 'User', entity_name: user.fullName }
      );
    }
  }

  getPublicContacts() {
    const params = {
      entity_id: this.firmId,
      entity_type: keywordConstants.Firm,
    };
    this.http.get('internalcontacts', { params }).subscribe((response: any) => {
      this.public_contacts = response;
    });
  }

  getInvestorPublicContacts() {
    const params = {
      entity_id: this.firmId,
      entity_type: keywordConstants.Firm,
    };
    this.http.get('publicContacts', { params }).subscribe((response: any) => {
      this.visible_contacts = response;
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

  getRelatedContacts() {
    this.firmDataService
      .getRelatedContacts(this.firmId)
      .subscribe((response: any) => {
        this.related_contacts = response;
        this.related_contacts.forEach((contact) => {
          if (contact.tag_names) {
            contact.tag_names_arr = contact.tag_names.split(',');
          }
        });
      });
  }

  goToSelectedContact(entity) {
    this.BaseDataService.setContactPageUrl('');
    this.routerService.navigateWithParams(`app.monitor.contact`, {
      Id: entity.id,
    });
  }

  addContactToPortfolio(entity) {
    if (!this.isFreeSubscription && !entity.is_tracking) {
      const params = { ...entity };
      params.firstName = entity.firstname;
      params.lastName = entity.lastname;
      this.CustomModalFactory.invoke('manage-contact', {
        initialState: {
          entity_details: this.firm,
          entity_type: keywordConstants.Firm,
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

  editPublicContact(contact) {
    this.CustomModalFactory.invoke('manage-public-contacts', {
      initialState: {
        contact: contact,
        entity_details: this.firm,
        entity_type: keywordConstants.Firm,
        success: (contacts) => {
          this.getPublicContacts();
        },
      },
    });
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

  removeContact(contact) {
    this.http
      .delete('entityuserassignments', {
        params: {
          entity_id: this.firmId,
          entity_type: 'Firm',
          user_id: contact.id,
        },
      })
      .subscribe(
        () => {
          this.toaster.success('Contact deleted successfully');
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

  addPublicContact() {
    this.CustomModalFactory.invoke('manage-public-contacts', {
      initialState: {
        entity_details: this.firm,
        entity_type: keywordConstants.Firm,
        existing_contacts: this.public_contacts,
        success: (contacts) => {
          this.getPublicContacts();
        },
      },
    });
  }

  addContact() {
    if (!this.isFreeSubscription) {
      this.CustomModalFactory.invoke('manage-contact', {
        initialState: {
          entity_details: this.firm,
          entity_type: keywordConstants.Firm,
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

  handleGoToPremium() {
    if (this.is_manager) this.SweetAlert.premiumAlert();
  }

  navigateToContacts(entity) {
    this.routerService.navigateWithParams('app.contacts', { Id: entity.id });
  }
}
