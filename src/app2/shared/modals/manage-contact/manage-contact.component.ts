import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { UtilsService } from 'src/app2/services/utils.service';
import {
  errorMessageMap,
  hierarchyConstants,
  keywordConstants,
  Regex,
  platformLabels,
} from '../../constants/constant';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { forkJoin, Subscription } from 'rxjs';
import { ModalComponent } from '../../components/modal/modal.component';
import { RouterService } from 'src/app2/services/router.service';
import { ToastrService } from 'ngx-toastr';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';
import { CustomFieldSelectionComponent } from '../../components/custom-field-selection/custom-field-selection.component';
import { CustomFieldsService } from 'src/app2/services/custom-fields.service';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take } from 'rxjs/operators';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { ModalService } from 'src/app2/services/modal.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';

@Component({
  selector: 'app-manage-contact',
  templateUrl: './manage-contact.component.html',
  styleUrls: ['./manage-contact.component.css'],
})
export class ManageContactModal implements OnInit, OnDestroy {
  @Input() entity_details: any;
  @Input() entity_type: string;
  @Input() contact: any;
  @Input() source: string;
  @Input() response: any;
  @Input() isDDqCloseModel: boolean;
  loading: boolean;
  contactForm: FormGroup;
  hierarchyConstants = hierarchyConstants;
  global_hierarchy_option: string;
  edit_mode: boolean;
  fundsCopy: any[];
  strategiesCopy: any[];
  user_check_obj: any[];
  is_owner: boolean;
  current_user: any;
  show_address_details: boolean;
  hasFirmWideRole: any;
  addedContacts: any[];
  loading_data: boolean;
  contactIdType: number;
  user_exists_in_current_firm: boolean;
  currentFirmId: any;
  countries: any;
  firms: any;
  tags: any;
  funds: any;
  strategies: any;
  teamMembers: any;
  fields: any;
  disableParentFirm: boolean;
  keywordConstants = keywordConstants;
  errorMessageMap = errorMessageMap;
  hideInviteContact: boolean;
  user_exists_in_dv: boolean;
  secondaryLoading: boolean;
  @ViewChild('contactModal') contactModal: ModalComponent;
  @ViewChild('customFields')
  customFieldsComponent: CustomFieldSelectionComponent;
  checking_user_existence: boolean;
  conversionDateTime: any;
  subscription: Subscription;
  platformLabels = platformLabels;
  contactLabel = '';
  isInvestor: boolean;
  firstbtnLabel;
  secondbtnLabel;
  @Input() isAngularJs = false;
  @Select(UserState.getCurrentUserData) user$;
  addAnother: boolean = false;
  constructor(
    private readonly Utils: UtilsService,
    private readonly http: HttpClient,
    private readonly BaseDataService: BaseDataService,
    private readonly toaster: ToastrService,
    private readonly route: RouterService,
    private readonly customFieldsService: CustomFieldsService,
    public bsModalNewRef: BsModalRef,
    public customModalService: CustomModalService
  ) {}

  ngOnInit(): void {
    this.global_hierarchy_option = this.hierarchyConstants.Strategy;
    this.edit_mode = false;
    this.fundsCopy = [];
    this.strategiesCopy = [];
    this.user_check_obj = [];
    this.is_owner = false;
    this.isInvestor = this.Utils.isInvestor();
    this.show_address_details = false;
    this.addedContacts = [];
    this.loading_data = true;
    this.contactIdType = 1218;
    this.user_exists_in_current_firm = false;
    this.user_exists_in_dv = false;
    this.contactLabel = this.isInvestor
      ? platformLabels.MANAGER
      : platformLabels.INVESTOR;

    this.user$.pipe(take(1)).subscribe((user) => {
      if (user) {
        this.current_user = JSON.parse(JSON.stringify(user));
        this.hasFirmWideRole = this.current_user.hasFirmWideRole;
        this.currentFirmId = this.current_user.firmInfo.id;
        this.createForm();
        this.getData();
      }
    });
  }

  createForm() {
    this.contactForm = new FormGroup({
      id: new FormControl(this.contact ? this.contact.id : null),
      userName: new FormControl(this.contact ? this.contact.userName : '', [
        Validators.required,
        Validators.pattern(Regex.validEmail),
      ]),
      send_invitation: new FormControl(false),
      key: new FormControl(
        this.contact ? this.contact.key : null,
        Validators.pattern(Regex.avoidFirstSplCharacter)
      ),
      firstName: new FormControl(this.contact ? this.contact.firstName : '', [
        Validators.required,
        Validators.pattern(/^[a-zA-Z0-9 ,.'-]{2,30}$/),
      ]),
      lastName: new FormControl(this.contact ? this.contact.lastName : '', [
        Validators.required,
        Validators.pattern(/^[a-zA-Z0-9 ,.'-]{2,30}$/),
      ]),
      title: new FormControl(
        this.contact ? this.contact.title : null,
        Validators.pattern(Regex.avoidFirstSplCharacter)
      ),
      firmId: new FormControl('', Validators.required),
      associated_funds: new FormControl([]),
      associated_strategies: new FormControl([]),
      owner_user_id: new FormControl(''),
      contact_type_ids: new FormControl([]),
      street_address_1: new FormControl(
        this.contact ? this.contact.street_address_1 : '',
        [
          Validators.maxLength(200),
          Validators.pattern(Regex.avoidFirstSplCharacter),
        ]
      ),
      street_address_2: new FormControl(
        this.contact ? this.contact.street_address_2 : '',
        [
          Validators.maxLength(200),
          Validators.pattern(Regex.avoidFirstSplCharacter),
        ]
      ),
      city: new FormControl(this.contact ? this.contact.city : '', [
        Validators.maxLength(60),
        Validators.pattern(Regex.validCityName),
      ]),
      state: new FormControl(this.contact ? this.contact.state : '', [
        Validators.maxLength(60),
        Validators.pattern(Regex.validCityName),
      ]),
      zipcode: new FormControl(this.contact ? this.contact.zipcode : null, [
        Validators.maxLength(10),
        Validators.pattern(Regex.validZipcode),
      ]),
      country_id: new FormControl(null),
      phone_1: new FormControl(this.contact ? this.contact.phone_1 : null, [
        Validators.maxLength(30),
        Validators.pattern(Regex.validPhoneCharsOnly),
      ]),
      phone_2: new FormControl(this.contact ? this.contact.phone_2 : null, [
        Validators.maxLength(30),
        Validators.pattern(Regex.validPhoneCharsOnly),
      ]),
      fax: new FormControl(this.contact ? this.contact.fax : null, [
        Validators.maxLength(30),
        Validators.pattern(Regex.validPhoneCharsOnly),
      ]),
    });

    if (this.contact) {
      this.edit_mode = true;
      if (this.source && this.source === 'Public') {
        this.edit_mode = false;
      }
      this.is_owner = this.contact.is_owner;
      this.conversionDateTime = this.contact.conversionDateTime;
    } else {
      this.subscribeToEmailChanges();
    }
    if (this.edit_mode) {
      this.firstbtnLabel = 'Update Contact';
      this.secondbtnLabel = 'Update & Add Another';
    } else {
      this.firstbtnLabel = 'Create Contact';
      this.secondbtnLabel = 'Create & Add Another';
    }
  }

  getData() {
    const observables = this.getObservables();
    forkJoin(observables).subscribe((responses: Array<any>) => {
      this.countries = responses[0];
      if (this.contact?.country_id && this.contact.country_id !== 0) {
        this.contactForm.get('country_id').patchValue(this.contact.country_id);
      }
      if (this.hasFirmWideRole) {
        this.firms = responses[1].data;
      } else {
        this.firms = responses[1];
      }
      this.tags = responses[2];
      if (this.contact?.contact_types?.length) {
        this.contactForm
          .get('contact_type_ids')
          .patchValue(this.contact.contact_types.map((x) => x.id));
      }
      this.funds = responses[3].data;
      if (this.funds.length) {
        this.fundsCopy = [...this.funds];
      }
      this.strategies = responses[4].data;
      if (this.strategies.length) {
        this.strategiesCopy = [...this.strategies];
      }
      this.teamMembers = responses[5];
      this.teamMembers.map(
        (x) => (x.fullname = x.firstName + ' ' + x.lastName)
      );
      this.fields = responses[6].custom_fields.contact;
      this.loading_data = false;
      this.processData();
    });
  }

  getObservables(): Array<any> {
    const observables = [];
    observables.push(this.http.get('country'));
    if (this.hasFirmWideRole) {
      const params = {
        include_contacts: false,
        include_custom_fields: false,
        include_dates: true,
        is_active: true,
        filters: {},
      };
      observables.push(
        this.http.post('service/dvapi_service/firm_search', params)
      );
    } else {
      observables.push(this.http.get('firms/fund_permissions_filters'));
    }
    observables.push(this.http.get('tags', { params: { Type: 'Contact' } }));

    const fundParams = {
      include_contacts: false,
      include_custom_fields: false,
      include_dates: true,
      is_active: true,
      filters: {},
    };
    observables.push(
      this.http.post('service/dvapi_service/fund_search', fundParams)
    );

    const strategyParams = {
      include_contacts: false,
      include_custom_fields: false,
      include_dates: true,
      is_active: true,
      filters: {},
      search_for: this.global_hierarchy_option,
    };
    observables.push(
      this.http.post('service/dvapi_service/product_search', strategyParams)
    );

    observables.push(this.BaseDataService.getTeamMembers());
    const payload = {
      schema_type: 'contact',
    };
    observables.push(this.customFieldsService.getCustomFields(payload));
    return observables;
  }

  processData() {
    if (this.contact) {
      if (this.source && this.source === 'Public') {
        const contactFirmId = this.contact.firm_id;
        if (contactFirmId) {
          this.funds = this.fundsCopy.filter(
            (fund) => fund.firm_id === contactFirmId
          );
          this.disableParentFirm = true;
        }
        if (
          this.entity_type.toLowerCase() ===
            this.keywordConstants.Strategy.toLowerCase() ||
          this.entity_type.toLowerCase() ===
            this.keywordConstants.Firm.toLowerCase() ||
          this.entity_type.toLowerCase() ===
            this.keywordConstants.Product.toLowerCase()
        ) {
          this.contactForm.patchValue({
            firmId: contactFirmId,
            owner_user_id: this.entity_details.owner_user_id,
            firstName: this.contact.firstName,
            lastName: this.contact.lastName,
          });
          this.hideInviteContact = true;
          if (
            this.entity_type.toLowerCase() ===
            this.keywordConstants.Product.toLowerCase()
          ) {
            const associated_funds = this.funds.find(
              (x) => x.id === this.entity_details.id
            );
            if (associated_funds) {
              this.contactForm
                .get('associated_funds')
                .value.push(associated_funds.id);
            }
          } else if (
            this.entity_type.toLowerCase() ===
            this.keywordConstants.Strategy.toLowerCase()
          ) {
            const associated_strategies = this.strategies.find(
              (x) => x.id === this.entity_details.id
            );
            if (associated_strategies) {
              this.contactForm
                .get('associated_strategies')
                .value.push(associated_strategies.id);
            }
          }
        }
      } else {
        this.setAssociatedStrategies();
        this.setAssociatedFunds();
        this.funds = this.fundsCopy.filter(
          (fund) => fund.firm_id === this.contact.firmInfo.id
        );
        this.contactForm.get('firmId').patchValue(this.contact.firmInfo.id);
      }
    } else {
      if (
        this.entity_type?.toLowerCase() ===
        this.keywordConstants.Product.toLowerCase()
      ) {
        this.contactForm.patchValue({
          associated_funds: [this.entity_details.id],
          owner_user_id: this.Utils.getCurrentUser().id,
          firmId: this.entity_details.firm_id,
        });
        this.funds = this.fundsCopy.filter(
          (fund) => fund.firm_id === this.entity_details.firm_id
        );
      } else if (
        this.entity_type?.toLowerCase() ===
        this.keywordConstants.Strategy.toLowerCase()
      ) {
        this.contactForm.patchValue({
          associated_strategies: [this.entity_details.id],
          owner_user_id: this.Utils.getCurrentUser().id,
          firmId: this.entity_details.firm_id,
        });
        this.funds = this.fundsCopy.filter(
          (fund) => fund.firm_id === this.entity_details.firm_id
        );
      } else if (
        this.entity_type?.toLowerCase() ===
        this.keywordConstants.Firm.toLowerCase()
      ) {
        this.contactForm.patchValue({
          firmId: this.entity_details.id,
          owner_user_id: this.Utils.getCurrentUser().id,
        });
        this.funds = this.fundsCopy.filter(
          (fund) => fund.firm_id === this.entity_details.id
        );
        this.filterAssociatedFunds(this.entity_details.id);
      }
    }
  }

  setAssociatedFunds() {
    if (this.funds?.length && this.contact.associated_funds?.length) {
      const associatedFunds = this.contact.associated_funds.filter((x) =>
        this.funds.some((y) => x === y.id)
      );
      this.contactForm.get('associated_funds').patchValue(associatedFunds);
    }
  }

  setAssociatedStrategies() {
    if (this.strategies?.length && this.contact.associated_strategies?.length) {
      const associatedStrategies = this.contact.associated_strategies.filter(
        (x) => this.strategies.some((y) => x === y.id)
      );
      this.contactForm
        .get('associated_strategies')
        .patchValue(associatedStrategies);
    }
  }

  filterAssociatedFunds(firmId: number) {
    if (this.fundsCopy?.length) {
      this.contactForm.get('associated_funds').patchValue([]);
      this.funds = this.fundsCopy.filter((fund) => fund.firm_id === firmId);
      this.strategies = this.strategiesCopy.filter(
        (strategy) => strategy.firm_id === firmId
      );
    }
    if (this.strategiesCopy?.length) {
      this.contactForm.get('associated_strategies').patchValue([]);
      this.strategies = this.strategiesCopy.filter(
        (strategy) => strategy.firm_id === firmId
      );
    }
  }

  subscribeToEmailChanges() {
    this.subscription = this.contactForm
      .get('userName')
      .valueChanges.pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(() => this.checkUserExistence());
  }

  onInviteValueChange(event) {
    this.contactForm.get('send_invitation').patchValue(event.target.checked);
  }

  checkUserExistence() {
    this.user_exists_in_current_firm = false;
    this.user_check_obj = [];
    if (!this.contactForm.get('userName').valid) {
      return;
    }
    this.contactForm.get('send_invitation').patchValue(false);
    this.checking_user_existence = true;
    const params = { email: this.contactForm.get('userName').value };
    this.http
      .get('v2/contacts', { params: params })
      .subscribe((response: Array<any>) => {
        this.checking_user_existence = false;
        this.user_check_obj = response.filter(
          (contact) =>
            contact.firmInfo.is_tracking &&
            contact.firmInfo.id !== this.currentFirmId
        );
        if (this.user_check_obj.length) {
          this.user_exists_in_current_firm = true;
        }
      });
  }

  prePopulateContactForm(contact) {
    this.contactForm.patchValue({
      firmId: contact.firmInfo.id,
      id: contact.id,
      firstName: contact.firstName,
      lastName: contact.lastName,
    });
    this.conversionDateTime = contact.conversionDateTime;
    this.checking_user_existence = false;
    this.user_exists_in_current_firm = false;
    this.user_check_obj = [];
    this.disableParentFirm = true;
    this.filterAssociatedFunds(contact.firmInfo.id);
  }

  createNewContactClick() {
    this.checking_user_existence = false;
    this.user_exists_in_current_firm = false;
    this.user_check_obj = [];
  }

  submit(addAnother: boolean = false) {
    if (!this.contactForm.valid) {
      this.contactForm.markAllAsTouched();
      if (this.customFieldsComponent) {
        this.customFieldsComponent.isFormValid();
      }
      return;
    }
    if (
      this.customFieldsComponent &&
      !this.customFieldsComponent.isFormValid()
    ) {
      return;
    }
    if (addAnother) {
      this.secondaryLoading = true;
    } else {
      this.loading = true;
    }
    const payload: any = this.contactForm.value;
    if (!payload.id) {
      delete payload.id;
    }
    if (!payload.country_id) {
      delete payload.country_id;
    }
    payload.firmInfo = {
      id: this.contactForm.get('firmId').value,
    };
    delete payload.firmId;

    let pageUrl: string = '';
    if (payload.associated_funds?.length) {
      payload.associated_funds.forEach((fundId) => {
        pageUrl += this.generatePageUrl(payload.firmInfo.id, fundId);
        pageUrl += ',';
      });
      pageUrl = pageUrl.slice(0, pageUrl.length - 2);
    } else if (payload.associated_strategies?.length) {
      payload.associated_strategies.forEach((strategyId) => {
        pageUrl += this.generatePageUrl(payload.firmInfo.id, strategyId);
        pageUrl += ',';
      });
      pageUrl = pageUrl.slice(0, pageUrl.length - 2);
    } else {
      pageUrl = this.generatePageUrl(payload.firmInfo.id);
    }

    const headers = new HttpHeaders();
    headers.set('page-url', pageUrl);
    const addedFields = this.customFieldsComponent?.getAddedFields();
    if (this.edit_mode) {
      this.http
        .put(`contacts/${payload.id}`, payload)
        .pipe(
          finalize(() => {
            this.secondaryLoading = false;
            this.loading = false;
          })
        )
        .subscribe(
          (response: any) => {
            this.toaster.success('Contact successfully updated');
            this.successCallback(response, addAnother);
          },
          (e) => {
            this.stopLoading();
          }
        );
    } else {
      this.http
        .post(`contacts`, payload)
        .pipe(
          finalize(() => {
            if (!addedFields?.length) {
              this.secondaryLoading = false;
              this.loading = false;
            }
          })
        )
        .subscribe(
          (response: any) => {
            const addedFields = this.customFieldsComponent?.getAddedFields();
            if (addedFields?.length) {
              this.saveCustomFieldsData(response, addAnother, addedFields);
            } else {
              this.toaster.success(`Contact successfully added`);
              this.successCallback(response, addAnother);
            }
          },
          () => {
            this.secondaryLoading = false;
            this.loading = false;
          }
        );
    }
  }

  generatePageUrl(firmId: number, fundId: number = null) {
    if (fundId) {
      return `app/firms/${firmId}/funds/${fundId}/contacts`;
    } else {
      return `app/firms/${firmId}/contacts`;
    }
  }

  successCallback(response, addAnother) {
    this.loading = this.secondaryLoading = false;
    this.addedContacts.push(response);
    if (this.response) {
      this.response(this.addedContacts);
    }
    if (addAnother) {
      this.contactForm.reset();
      this.edit_mode = false;
      this.is_owner = false;
      this.conversionDateTime = false;
      this.show_address_details = false;
      this.customFieldsComponent?.resetForm();
      this.firstbtnLabel = 'Create Contact';
      this.secondbtnLabel = 'Create & Add Another';
      this.subscribeToEmailChanges();
    } else {
      if (!this.isDDqCloseModel) {
        this.redirectIfApplicable(response);
      }
      this.closeModal();
    }
  }

  saveCustomFieldsData(response, addAnother, addedFields) {
    const payload = {
      entity_id: response.id,
      owner_user_id: this.current_user.id,
      entity_type: this.contactIdType,
      schema_type: 'contact',
      custom_fields: addedFields,
    };

    this.customFieldsService
      .saveCustomFields(payload)
      .pipe(
        finalize(() => {
          this.secondaryLoading = false;
          this.loading = false;
        })
      )
      .subscribe(
        (resp) => {
          this.toaster.success(`Contact successfully added`);
          this.successCallback(response, addAnother);
        },
        () => {
          this.secondaryLoading = false;
          this.loading = false;
        }
      );
  }

  redirectIfApplicable(response) {
    if (!this.edit_mode) {
      if (!this.source || this.source !== 'InformationRequestFlow') {
        this.redirectToContactDetail(response.id);
      }
    }
  }

  redirectToContactDetail(contactId) {
    this.closeModal();
    this.route.navigateWithParams('app.contacts', {
      Id: contactId,
    });
  }
  redirectToContactTags() {
    this.customModalService.closeAllActiveModals();
    this.route.navigate('app.firm.settings.contact_tags');
  }

  cancel() {
    this.closeModal();
  }

  closeModal() {
    this.contactModal.closeModal();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
  stopLoading() {
    this.loading = this.secondaryLoading = false;
  }
}
