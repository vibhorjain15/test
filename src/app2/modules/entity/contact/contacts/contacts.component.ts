import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { MentionsFactoryService } from 'src/app2/services/mentions-factory.service';
import { RouterService } from 'src/app2/services/router.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { statusLabel } from 'src/app2/shared/constants/constant';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { Select, Store } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-contacts',
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.css'],
})
export class ContactsComponent implements OnInit {
  contact;
  statusLabel = statusLabel;
  customDateFilter;
  vehicleId;
  customFields;
  all_products = [];
  associated_products = [];
  is_manager;
  contactId;
  pageUrl;
  dateRangeForDirectives;
  stateParams: any;
  entityType: string;
  current_user: any;
  ContactsIdType: number;
  notesOptions: { fullscreen: boolean; undoRedo: boolean; height: number };
  loading_prefs: boolean;
  teamMembers = [];
  maxDate: Date;
  due_date: Date;
  action_types: any;
  selected_action_type: any;
  note_types: any;
  filteredTeamMembers: any[];
  @Select(UserState.getCurrentUserData) user;
  @Select(UserState.getFirmPreferenceData) firmPref;
  @Select(UserState.getTeamMembersData) teamMembers$;
  contactActions = [
    {
      label: 'Add task',
      key: 'add-task',
      leftIcon: 'tasks',
    },
    {
      label: 'Request background check',
      key: 'bg-check',
      leftIcon: 'bg-check',
    },
    {
      label: 'Edit contact',
      key: 'pencil',
      leftIcon: 'pencil',
    },
  ];
  constructor(
    private readonly routerService: RouterService,
    private readonly Utils: UtilsService,
    private readonly BaseDataService: BaseDataService,
    private readonly http: HttpClient,
    private readonly MentionsFactory: MentionsFactoryService,
    private readonly toaster: ToastrService,
    private readonly SweetAlert: SweetAlertService,
    private readonly customModalService: CustomModalService,
    private readonly store: Store
  ) {}

  ngOnInit() {
    this.stateParams = this.routerService.getState().params;
    this.contactId = this.stateParams.Id;
    this.entityType = 'User';
    // this.pageUrl = this.BaseDataService.getContactPageUrl();
    this.ContactsIdType = 1218;
    this.notesOptions = {
      fullscreen: true,
      undoRedo: true,
      height: 180,
    };
    this.maxDate = new Date();
    this.due_date = new Date();
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.current_user = data;
          this.is_manager = data.isManager;
          this.getContact(this.contactId);
          this.getCustomFields();
        }
      });
  }

  getCustomFields() {
    this.http
      .post('service/dvapi_service/get_custom_fields_data', {
        entity_id: this.contactId,
        entity_type: this.ContactsIdType,
        schema_type: 'contact',
        sub_entity_id: 0,
      })
      .subscribe((response: any) => {
        this.customFields = response.data;
      });
  }

  applyMethod(startDate, endDate, range) {
    this.dateRangeForDirectives = {
      startDate,
      endDate,
      range,
    };
  }

  getFirmPref() {
    this.loading_prefs = true;
    this.firmPref.pipe(take(1)).subscribe((response) => {
      this.customDateFilter = this.Utils.getPredefinedDateRanges(
        response.default_daterange_months
      );
      if (response.default_daterange_months) {
        this.dateRangeForDirectives = {
          startDate: this.Utils.formatDatetime(this.customDateFilter.startDate),
          endDate: this.Utils.formatDatetime(this.customDateFilter.endDate),
          range: response?.default_daterange_months ?? 'null',
        };
      } else {
        this.dateRangeForDirectives = null;
      }
      this.loading_prefs = false;
    });
  }

  findName(id) {
    const member = this.teamMembers.find((member) => member.id === id);
    return member.fullname;
  }

  setActionType(index) {
    this.selected_action_type = this.action_types[index];
    // TODO: Method not available
    // this.initAddActivityForm();
  }

  getContact(Id) {
    this.init();
    this.http.get(`contacts/${Id}`).subscribe((response: any) => {
      this.contact = response;
      this.contact.fullName = response.firstName ? `${response.firstName} ${(response.lastName || '')}` : response.email;
      this.sortTags();
      this.updateMoreActions();
    });
  }

  updateMoreActions() {
    const inActiveOptionIndex = this.contactActions.findIndex(
      (x) => x.key == 'ban'
    );
    if (this.contact?.active && inActiveOptionIndex === -1) {
      // if product is active and mark as inactive not present
      this.contactActions.push({
        label: '',
        key: 'divider',
        leftIcon: null,
      });
      this.contactActions.push({
        key: 'ban',
        label: 'Mark as inactive',
        leftIcon: 'ban',
      });
    } else if (!this.contact?.active && inActiveOptionIndex !== -1) {
      this.contactActions.splice(inActiveOptionIndex - 1); // divider and mark as inactive option
    }
  }

  init() {
    this.getFirmPref();
    this.getAssociatedProducts(this.contactId);
    this.getTeamMembers();
    if (!this.pageUrl || this.pageUrl.length === 0) {
      this.pageUrl = this.generatePageUrl();
    }
    this.http.get('touch_points').subscribe((response: any) => {
      this.note_types = response;
    });
  }

  sortTags() {
    // TODO: Replace sortBy
    /* this.contact.contact_types = _(this.contact.contact_types).sortBy((tag) => {
      return tag.name.toLowerCase();
    }); */
  }

  editContact() {
    this.customModalService.invoke('manage-contact', {
      initialState: {
        contact: this.contact,
        response: (contact) => {
          if (Array.isArray(contact)) {
            this.contact = contact[0];
          } else {
            this.contact = contact;
          }
          this.getAssociatedProducts(this.contactId);
          this.sortTags();
        },
      },
      class: 'gray modal-lg',
    });
  }

  getTeamMembers() {
    this.teamMembers$.pipe(take(2)).subscribe((teamMembers) => {
      if (teamMembers)
        this.teamMembers = teamMembers.map((teamMember) => ({
          ...teamMember,
          fullname: `${teamMember.firstName} ${teamMember.lastName}`,
        }));
    });
  }

  generatePageUrl() {
    let pageUrl = '';
    if (this.contact) {
      if (this.contact.associated_funds.length === 0) {
        pageUrl = `app/firms/${this.contact.firmInfo.id}/contacts/${this.contact.id}`;
      } else if (this.contact.associated_funds.length >= 0) {
        this.contact.associated_funds.forEach((fund, index) => {
          pageUrl += `app/firms/${this.contact.firmInfo.id}/funds/${fund}/contacts/${this.contact.id}`;
          if (index !== this.contact.associated_funds.length - 1) {
            pageUrl += ',';
          }
        });
      }
    }
    return pageUrl;
  }

  addTask() {
    this.pageUrl = this.generatePageUrl();
    this.customModalService.invoke('manage-task', {
      initialState: {
        task: {
          entity_type: this.entityType,
          entity_id: this.contactId,
          pageUrl: this.pageUrl,
        },
      },
    });
  }

  getAssociatedProducts(Id) {
    this.http
      .get('v2/funds/assigned_contacts', { params: { contact_id: Id } })
      .subscribe((response: any) => {
        this.all_products = response;
        this.associated_products = response.slice(0, 5);
      });
  }

  filterTeamMembers(term) {
    this.filteredTeamMembers = this.MentionsFactory.getFilteredMembers(term);
  }

  getDisplayName(user) {
    // this.tinymceEditor.insertContent('');
    this.MentionsFactory.getDisplayName(user, true);
  }

  markTaskAsComplete(task) {
    task.is_complete = true;
    task.completed_at = new Date();
    this.http.put('todos/' + task.id, task).subscribe((response: any) => {
      const message = 'The task has been as completed!';
      this.toaster.success('', message);
      task = response;
    });
  }

  removeProductAssociation(product, idx) {
    this.http
      .delete('v2/funds/assigned_contacts', {
        params: {
          contact_id: this.contactId,
          product_id: product.id,
        },
      })
      .subscribe(
        (response: any) => {
          this.toaster.success('', 'Product association successfully removed', {
            timeOut: 5000,
          });
          const index = this.all_products.findIndex(
            (item) => item.id === product.id
          );
          this.all_products.splice(index, 1);
          this.associated_products = this.all_products.slice(0, 5);
          this.getContact(this.contactId);
        },
        (error: { status: any }) => {
          const avoid_error_logging_statuses =
            this.BaseDataService.getAvoidErrorLoggingStatusList();
          this.toaster.error('', 'Something went wrong. Please try again.');
          if (!avoid_error_logging_statuses.includes(error.status)) {
            this.Utils.logError('Removing Product Association failed', error);
          }
        }
      );
  }

  confirmRemoveProductAssociation(product, idx) {
    const title = 'Are you sure you want to remove this product association?';
    this.SweetAlert.confirm({
      title,
      confirmButtonText: 'Yes',
      focusCancel: true,
    }).then((isConfirm) => {
      if (isConfirm.value && isConfirm.value === true) {
        this.removeProductAssociation(product, idx);
      }
    });
  }

  deactivateContact() {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to inactivate this contact ?',
      confirmButtonText: 'Yes, inactivate!',
      showLoaderOnConfirm: true,
      focusCancel: true,
      preConfirm: () => {
        const params = {
          entity_id: this.contactId,
          entity_type: this.entityType,
        };
        this.http.delete('firm_relationships', { params }).subscribe(() => {
          this.contact.active = false;
          this.toaster.success('', 'Contact marked inactive');
          this.updateMoreActions();
        });
      },
    });
  }

  manageCustomfield() {
    this.customModalService.invoke('manage-custom-fields', {
      initialState: {
        entityTypeId: this.ContactsIdType,
        entityType: 'contact',
        entityId: this.contactId,
        customFields: JSON.parse(JSON.stringify(this.customFields)),
        customUrl: 'contact_tags',
        response: (response) => {
          this.customFields = response.data;
        },
      },
      class: 'gray modal-lg',
    });
  }

  navigateToMonitorContacts() {
    this.routerService.navigate(`app.monitor.contacts`);
  }

  navigateToProfileSummary(productId) {
    this.routerService.navigateWithParams(`app.funds.profile.summary`, {
      fundId: productId,
    });
  }
  navigateToProfileMonitor(productId) {
    this.routerService.navigateWithParams(`app.funds.profile.monitor`, {
      fundId: productId,
    });
  }

  trackByIndex(index: number, element): number {
    return index;
  }

  onChange(event) {
    if (event && event.startDate && event.endDate && event.range) {
      this.applyMethod(
        this.Utils.formatDatetime(event.startDate),
        this.Utils.formatDatetime(event.endDate),
        event.range
      );
    }
  }

  onClearDateFilter() {
    this.dateRangeForDirectives = null;
  }

  backgroundCheck() {
    this.routerService.navigateWithParams('app.partnership', {
      entity_id: this.contactId,
      entity_type: 'Contact',
      entity_name: this.contact.fullName,
    });
  }

  navigateToAssociatedFirm() {
    this.routerService.navigateWithParams('app.firms.profile.monitor', {
      firmId: this.contact.firmInfo.id,
    });
  }

  onDropdownClick(contactAction: any) {
    switch (contactAction.key) {
      case 'add-task':
        this.addTask();
        break;
      case 'bg-check':
        this.backgroundCheck();
        break;
      case 'pencil':
        this.editContact();
        break;
      case 'ban':
        this.deactivateContact();
        break;
      default:
        break;
    }
  }
}

