import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { FirmDataService } from 'src/app2/services/firm-data.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { RouterService } from 'src/app2/services/router.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { keywordConstants } from 'src/app2/shared/constants/constant';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take } from 'rxjs/operators';
@Component({
  selector: 'my-firm-contacts',
  templateUrl: './my-firm-contacts.component.html',
  styleUrls: ['./my-firm-contacts.component.css'],
})
export class MyFirmContactsComponent implements OnInit {
  firm;
  public_contacts;
  adjust_entity_list;
  isFirmOwner;
  is_manager;
  related_contacts: any[];
  isFreeSubscription: boolean;
  current_user: any;
  firmId: any;
  departments = [];
  departmentsDict = {};
  @Select(UserState.getCurrentUserData) user;

  constructor(
    private readonly Utils: UtilsService,
    private readonly firmDataService: FirmDataService,
    private readonly http: HttpClient,
    private readonly routerService: RouterService,
    private readonly BaseDataService: BaseDataService,
    private readonly SweetAlert: SweetAlertService,
    private readonly toaster: ToastrService,
    private readonly CustomModalFactory: CustomModalService,
  ) {}

  ngOnInit(): void {
    this.public_contacts = [];
    this.related_contacts = [];
    this.isFirmOwner = false;
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.current_user = data;
          this.is_manager = data.isManager;
          this.isFreeSubscription = data.isFreeSubscription;
          this.firmId = data.firmInfo.id;
          this.firmDataService.getFirm(this.firmId).subscribe((firm) => {
            this.firm = firm;
            if (Number(this.firmId) === this.current_user.firmInfo.id) {
              this.isFirmOwner = true;
            }
            this.getRelatedContacts();
            this.getDepartments();
            this.getPublicContacts();
          });
        }
      });
  }

  getDepartments() {
    this.http.get('internalContactTypes').subscribe((response: any) => {
      this.departments = response;
      this.departmentsDict = {};
      this.departments.map(
        (department) =>
          (this.departmentsDict[department.text] = department.description)
      );
    });
  }

  goToUserPage(user) {
    this.routerService.navigateWithParams(
      'app.firm.settings.permission.detail',
      {
        entity_id: user.id,
        entity_type: 'User',
        entity_name: user.fullName,
      }
    );
  }

  getFunctionDescription(key) {
    const department = this.departmentsDict[key];
    return department;
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
    this.routerService.navigateWithParams('app.monitor.contact', {
      Id: entity.id,
    });
  }

  editPublicContact(contact) {
    this.CustomModalFactory.invoke('manage-public-contacts', {
      initialState: {
        contact: contact,
        entity_details: this.firm,
        entity_type: keywordConstants.Firm,
        source: 'Public',
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
        (response: any) => {
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
}
