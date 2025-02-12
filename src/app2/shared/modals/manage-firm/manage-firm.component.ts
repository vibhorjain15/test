import { HttpClient } from '@angular/common/http';
import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Subscription, forkJoin } from 'rxjs';
import {
  debounceTime,
  defaultIfEmpty,
  distinctUntilChanged,
  finalize,
  tap,
} from 'rxjs/operators';
import { CustomFieldsService } from 'src/app2/services/custom-fields.service';
import { FirmDataService } from 'src/app2/services/firm-data.service';
import { RouterService } from 'src/app2/services/router.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { CustomFieldSelectionComponent } from '../../components/custom-field-selection/custom-field-selection.component';
import { DvOwnersComponent } from '../../components/dv-owners/dv-owners.component';
import { EntityContactsComponent } from '../../components/entity-contacts/entity-contacts.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { errorMessageMap, Regex } from '../../constants/constant';
import { TeamSelectionComponent } from '../team-selection/team-selection.component';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { DomSanitizer } from '@angular/platform-browser';
import {
  DvValidators,
  noHtmlValidator,
} from 'src/app2/shared/validators/no-white-space.validator';

@Component({
  selector: 'app-manage-firm',
  templateUrl: './manage-firm.component.html',
  styleUrls: ['./manage-firm.component.css'],
})
export class ManageFirmModal implements OnInit, OnDestroy {
  @Input() firm: any;
  @Input() response: any;
  @Input() source: string;
  @Input() isDDqCloseModel: boolean;
  loading: boolean;
  secondaryLoading: boolean;
  edit_mode: boolean;
  existingFirm: string;
  showAddOwners: boolean;
  allRecentAddedFirms: any[];
  is_investor: boolean;
  current_user: any;
  currentFirmId: any;
  currentFirmObj: any;
  added_fields: {}[];
  all_fields: any[];
  fields: any[];
  permissions_enabled: any;
  showBackButton: boolean;
  createFirmTooltip: string;
  loadingFirms: boolean;
  websiteRegex: RegExp;
  websitePrefixRegex: RegExp;
  customFieldsCopy: any[];
  teams: any[];
  statuses: any[];
  firmForm: FormGroup;
  firm_types: any;
  disableSpecificFormControls: boolean;
  showFirmForm: boolean;
  hideAddAnother: boolean;
  filteredFirmList: any[];
  showAdvanceOptions: boolean;
  errorMessageMap = errorMessageMap;
  backButtonClicked: boolean;
  subscription: Subscription;
  @ViewChild('owners') ownersComponent: DvOwnersComponent;
  @ViewChild('permissions') teamSelectionComponent: TeamSelectionComponent;
  @ViewChild('contacts') entityContactsComponent: EntityContactsComponent;
  @ViewChild('firmModal') firmModal: ModalComponent;
  @ViewChild('customFields')
  customFieldsComponent: CustomFieldSelectionComponent;
  @Input() isAngularJs = false;
  firmIdType: number;
  errorMessageList = [];
  savingAnother: boolean;
  saving: boolean;
  newfirmCreate = false;
  firstbtnLabel;
  secondbtnLabel;
  thirdbtnLabel;
  duplicateFirms = [];
  addAnotherFlag = false;
  showEmptyState: boolean;
  constructor(
    private readonly Utils: UtilsService,
    private readonly http: HttpClient,
    private readonly SweetAlert: SweetAlertService,
    private readonly FirmDataService: FirmDataService,
    private readonly toaster: ToastrService,
    private readonly route: RouterService,
    private readonly customFieldsService: CustomFieldsService,
    private readonly customModalService: CustomModalService,
    private sanitizer: DomSanitizer,
    private renderer: Renderer2
  ) {
    Window['ManageFirmModal'] = this;
  }

  ngOnInit(): void {
    this.allRecentAddedFirms = [];
    this.showAddOwners = true;
    this.is_investor = this.Utils.isInvestor();
    this.current_user = this.Utils.getCurrentUser();
    this.currentFirmId = this.current_user.firmInfo.id;
    this.currentFirmObj = this.Utils.getCurrentFirm();
    this.filteredFirmList = [];
    this.firmIdType = 1220;
    this.permissions_enabled = this.current_user.firmInfo.hasPermissionEnabled;
    // this.showBackButton = false;
    this.createFirmTooltip =
      "Please start by entering domain or name of the firm. If you don't find your firm, you can always add a New Firm.";
    this.websiteRegex =
      /^(?:(?:https?|ftp):\/\/)?(?:www\.)?((?!(www|http))[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,10})(?:\/[\w-]+(?:\/[\w-]+)*)?(?!.*[:\s])\/?(?:#.*)?$/;
    this.websitePrefixRegex =
      /((?:https\:\/\/)|(?:http\:\/\/)|(?:www\.)){1}([a-zA-Z0-9\-\.]+\.?[a-zA-Z]{1,3}(?:\??)[a-zA-Z0-9\-\._\?\,\'\/\\\+&%\$#\=~]+)/i;
    this.createForm();
    this.getData();
    if (this.edit_mode) {
      this.firstbtnLabel = 'Update Firm';
      this.secondbtnLabel = 'Update & Add Another';
      this.thirdbtnLabel = 'Yes, Please update the firm';
    } else {
      this.firstbtnLabel = 'Create Firm';
      this.secondbtnLabel = 'Create & Add Another';
      this.thirdbtnLabel = 'Yes, Please create the firm';
    }
  }

  createForm() {
    this.firmForm = new FormGroup({
      search: new FormControl(''),
      id: new FormControl(this.firm ? this.firm.id : null),
      name: new FormControl(this.firm ? this.firm.name : '', [
        Validators.required,
        Validators.pattern(Regex.avoidFirstSplCharacter),
        noHtmlValidator,
      ]),
      alternate_name: new FormControl(
        this.firm ? this.firm.alternate_name : null,
        Validators.pattern(Regex.avoidFirstSplCharacter)
      ),
      website: new FormControl(this.firm ? this.firm.website : null, [
        Validators.required,
        Validators.pattern(this.websiteRegex),
      ]),
      firm_type_id: new FormControl(''),
      key: new FormControl(
        this.firm ? this.firm.key : null,
        Validators.pattern(Regex.avoidFirstSplCharacter)
      ),
      owner_user_id: new FormControl(
        this.Utils.getCurrentUser().id,
        Validators.required
      ),
      relationship_status_id: new FormControl(''),
    });

    if (this.firm) {
      this.edit_mode = true;
      this.showFirmForm = true;
      this.disableSpecificFormControls = !this.firm.is_owner;
    } else {
      this.firmForm.get('search').setValidators(DvValidators.required);
      this.firmForm.get('search').updateValueAndValidity();
      this.subscribeToSearchChanges();

      if (this.source && this.source === 'InformationRequestFlow') {
        //this.params.search = this.firm_name;
        this.hideAddAnother = true;
        this.getFirmDetails();
      }

      if (this.source && this.source === 'NewContact') {
        this.getFirmDetails();
        this.hideAddAnother = true;
        // this.$timeout(() => {
        //   return this.prePopulateFirmForm(this.firm_name);
        // });
      }
      this.disableSpecificFormControls = false;
    }
  }

  subscribeToSearchChanges() {
    this.subscription = this.firmForm
      .get('search')
      .valueChanges.pipe(debounceTime(1000), distinctUntilChanged())
      .subscribe(() => {
        if (!this.firmForm.get('search').hasError('required')) {
          this.getFirmDetails();
        } else {
          this.filteredFirmList = [];
          this.showEmptyState = false;
        }
      });
  }

  getData() {
    this.loadCustomFields();
    this.http
      .get('tags', { params: { type: 'Status' } })
      .subscribe((response: any) => {
        this.statuses = response;
        if (this.firm && this.firm.relationship_status_id) {
          this.firmForm
            .get('relationship_status_id')
            .patchValue(this.firm.relationship_status_id);
        }
      });

    this.http.get('firm_types').subscribe((response: any) => {
      this.firm_types = response;
      if (this.firm && this.firm.firm_type_id) {
        this.firmForm.get('firm_type_id').patchValue(this.firm.firm_type_id);
      } else {
        if (this.is_investor) {
          this.firmForm.get('firm_type_id').patchValue(7);
        } else {
          this.firmForm.get('firm_type_id').patchValue(8);
        }
      }
    });

    this.http
      .get(`firms/${this.currentFirmId}/teams`)
      .subscribe((response: any) => {
        this.teams = response;
      });
  }

  loadCustomFields() {
    const payload = {
      schema_type: 'firm',
    };
    this.customFieldsService
      .getCustomFields(payload)
      .subscribe((response: any) => {
        this.fields = response.custom_fields.firm;
        this.customFieldsCopy = [...this.fields];
      });
  }

  getFirmDetails() {
    const search = this.firmForm.get('search').value;
    if (!search) {
      this.createFirmTooltip =
        "Please start by entering domain or name of the firm. If you don't find your firm, you can always add a New Firm.";
      this.filteredFirmList = [];
      return;
    }

    this.loadingFirms = true;
    this.createFirmTooltip = 'Loading Firms ...';
    const params: any = {};
    if (
      this.websiteRegex.test(search) ||
      this.websitePrefixRegex.test(search)
    ) {
      params.website = search;
    } else {
      params.name = search;
    }
    this.http
      .get('v2/firms', { params })
      .pipe(finalize(() => (this.loadingFirms = false)))
      .subscribe((response: any) => {
        this.filteredFirmList = response.map((res) => ({
          websiteUrl:
            res.website && res.website.startsWith('http')
              ? res.website
              : `https://${res.website}`,
        }));
        this.filteredFirmList = response;
        if (this.filteredFirmList.length) {
          this.showEmptyState = false;
          this.createFirmTooltip = 'Create a New Firm';
          this.showFirmForm = false;
          this.backButtonClicked = true;
        } else {
          this.showEmptyState = true;
          this.backButtonClicked = false;
          this.showFirmForm = true;
          this.showBackButton = true;
          this.preFillFirmNameOrWebsite();
          this.createFirmTooltip = 'No related firms found. Create a New Firm';
        }
      });
  }

  prePopulateFirmForm(firm: any) {
    this.firmForm.patchValue({
      id: firm.id,
      name: firm.name,
      website: firm.website,
      firm_type_id: firm.firm_type_id,
    });
    this.backButtonClicked = false;
    this.showFirmForm = true;
    this.showBackButton = true;
    this.disableSpecificFormControls = true;
  }

  preFillFirmNameOrWebsite() {
    const search = this.firmForm.get('search').value;
    if (this.websiteRegex.test(search)) {
      this.firmForm.get('website').patchValue(search);
    } else {
      this.firmForm.get('name').patchValue(search);
    }
  }

  createNewFirmClick() {
    this.disableSpecificFormControls = false;
    this.showFirmForm = true;
    this.showBackButton = true;
    this.backButtonClicked = false;
    const search = this.firmForm.get('search').value;
    this.firmForm.reset();
    this.firmForm.get('search').patchValue(search);
    this.firmForm
      .get('owner_user_id')
      .patchValue(this.Utils.getCurrentUser().id);
    if (this.is_investor) {
      this.firmForm.get('firm_type_id').patchValue(7);
    } else {
      this.firmForm.get('firm_type_id').patchValue(8);
    }
    this.preFillFirmNameOrWebsite();
  }

  cancel() {
    this.closeModal();
  }

  backToSearch() {
    this.disableSpecificFormControls = false;
    this.showFirmForm = false;
    this.showBackButton = false;
    this.backButtonClicked = true;
    this.errorMessageList = [];
  }

  clearSearchInput() {
    this.firmForm.get('search').patchValue('');
    this.filteredFirmList = [];
  }

  openDuplicateFirmsModal() {
    this.customModalService.invoke('view-duplicate-firm', {
      initialState: {
        duplicateFirms: this.duplicateFirms,
        source: 'manage_firm',
        onSuccess: (res) => {
          this.errorMessageList = [];
          this.edit_mode = false;
          this.prePopulateFirmForm(res);
        },
      },
    });
  }

  submit(addAnother = false) {
    this.addAnotherFlag = addAnother;
    if (!this.firmForm.valid) {
      this.firmForm.markAllAsTouched();
      return;
    }
    if (
      this.teamSelectionComponent &&
      !this.teamSelectionComponent.isFormValid()
    ) {
      return;
    }
    if (
      this.entityContactsComponent &&
      !this.entityContactsComponent.isFormValid()
    ) {
      return;
    }
    if (
      this.customFieldsComponent &&
      !this.customFieldsComponent.isFormValid()
    ) {
      return;
    }
    const payload: any = this.firmForm.value;
    const addedContacts = this.entityContactsComponent?.getAddedContacts();
    if (addedContacts) {
      payload.contacts = addedContacts;
    } else {
      payload.contacts = [{}];
    }

    this.errorMessageList = [];
    if (!this.checkContactsDomain(payload) && !this.edit_mode) {
      this.errorMessageList.push(
        "One or more contact(s) domain do not match firm's."
      );
    }

    if (addAnother) {
      this.secondaryLoading = true;
    } else {
      this.loading = true;
    }

    const name = this.firmForm.get('name').value;
    const website = this.firmForm.get('website').value;
    const id = this.firmForm.get('id').value;
    const hasNoNameDomainChanges =
      name == this.firm?.name && website == this.firm?.website;
    let promises = [];
    if (!(id && (this.disableSpecificFormControls || hasNoNameDomainChanges))) {
      promises.push(
        this.http
          .get('v2/firms', { params: { website: website, name: name } })
          .pipe(
            tap((response: any) => {
              if (response.length > 0) {
                this.duplicateFirms = [];
                response.forEach((res) => {
                  if (!(this.edit_mode && res.id == id)) {
                    (res.websiteUrl =
                      res.website && res.website.startsWith('http')
                        ? res.website
                        : `https://${res.website}`),
                      (res.name = res.name),
                      (res.is_tracking = res.is_tracking),
                      (res.firm_type = res.firm_type),
                      (res.id = res.id),
                      (res.website = res.website),
                      (res.firm_type_id = res.firm_type_id);
                    this.duplicateFirms.push(res);
                  }
                });
              }
              if (this.duplicateFirms.length > 0) {
                const error = this.sanitizer.bypassSecurityTrustHtml(
                  `${this.Utils.convertNumber(
                    this.duplicateFirms.length
                  )} possible matching firms found, click <a onClick="Window.ManageFirmModal.openDuplicateFirmsModal()">` +
                    'here' +
                    '</a>  to view.'
                );
                this.errorMessageList.push(error);
              }
            }),
            finalize(() => {
              this.loading = false;
              this.loadingFirms = false;
            })
          )
      );
    }

    forkJoin(promises)
      .pipe(defaultIfEmpty(null))
      .subscribe(
        () => {
          if (this.errorMessageList.length == 0) {
            this.saveData(payload, addAnother);
          } else {
            this.loading = false;
            this.secondaryLoading = false;
          }
        },
        (e) => {
          this.loading = false;
          this.secondaryLoading = false;
        }
      );
  }

  saveData(payload, addAnother) {
    if (addAnother) {
      this.secondaryLoading = true;
    } else {
      this.loading = true;
    }

    if (!payload.id) {
      delete payload.id;
    }
    const selectedFunctions = this.ownersComponent.getSelectedFunctions();
    const selectedPermissions =
      this.teamSelectionComponent?.getSelectedPermissions();
    if (selectedFunctions?.length) {
      payload.functions = selectedFunctions;
    }
    if (selectedPermissions?.length) {
      payload.permissions = selectedPermissions;
    }
    payload.display_duplicate_warning =
      this.errorMessageList.length > 0 &&
      this.duplicateFirms &&
      this.duplicateFirms.length > 0;
    if (this.edit_mode) {
      this.FirmDataService.editFirm(payload)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe(
          (response: any) => {
            this.toaster.success('Firm successfully updated');
            this.successCallback(response, addAnother);
          },
          (e) => (this.secondaryLoading = false)
        );
    } else {
      this.FirmDataService.addFirm(payload).subscribe(
        (response: any) => {
          const addedFields = this.customFieldsComponent?.getAddedFields();
          if (addedFields?.length) {
            this.saveCustomFieldsData(response, addAnother, addedFields);
          } else {
            this.toaster.success(`Firm successfully added`);
            this.successCallback(response, addAnother);
          }
        },
        (e) => {
          this.loading = false;
        }
      );
    }
  }

  saveNewFirm() {
    this.loading = true;
    if (this.firmForm.invalid) {
      return;
    }
    this.saving = true;
    let addAnother = this.addAnotherFlag;
    const payload: any = this.firmForm.value;
    this.saveData(payload, addAnother);
  }

  successCallback(response, addAnother) {
    this.loading = this.secondaryLoading = false;
    if (addAnother) {
      this.firmForm.reset();
      this.edit_mode = false;
      this.disableSpecificFormControls = false;
      this.ownersComponent.resetForm();
      this.teamSelectionComponent?.resetForm();
      this.entityContactsComponent?.resetForm();
      this.customFieldsComponent?.resetForm();
      this.firmForm
        .get('owner_user_id')
        .patchValue(this.Utils.getCurrentUser().id);
      this.errorMessageList = [];
      this.subscribeToSearchChanges();
      this.firstbtnLabel = 'Create Firm';
      this.secondbtnLabel = 'Create & Add Another';
      this.thirdbtnLabel = 'Yes, Please create the firm';
      this.createNewFirmClick();
      if (this.is_investor) {
        this.firmForm.get('firm_type_id').patchValue(7);
      } else {
        this.firmForm.get('firm_type_id').patchValue(8);
      }
      this.preFillFirmNameOrWebsite();
      const search = this.firmForm.get('search').value;
      this.firmForm.get('search').patchValue(search);
      this.showFirmForm = false;
      this.showBackButton = false;
      this.secondaryLoading = false;
    } else {
      if (this.response) {
        this.response(response);
      }
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
      entity_type: this.firmIdType,
      schema_type: 'firm',
      custom_fields: addedFields,
    };
    this.customFieldsService
      .saveCustomFields(payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe((resp) => {
        this.toaster.success(`Firm successfully added`);
        this.successCallback(response, addAnother);
      });
  }

  closeModal() {
    this.firmModal.closeModal();
  }

  redirectIfApplicable(response) {
    if (!this.edit_mode) {
      if (
        this.source !== 'InformationRequestFlow' &&
        this.source !== 'NewContact'
      ) {
        this.redirectToFirmMonitor(response.id);
      }
    }
  }

  redirectToFirmMonitor(firmId, redirectToNew?: boolean) {
    if (redirectToNew) {
      let url = this.route.href('app.firms.profile.monitor', {
        firmId: firmId,
      });
      this.openInNewTab(url);
    } else {
      this.route.navigateWithParams('app.firms.profile.monitor', {
        firmId: firmId,
      });
    }
  }
  openInNewTab(url: string): void {
    const newTab = this.renderer.createElement('a');
    this.renderer.setAttribute(newTab, 'href', url);
    this.renderer.setAttribute(newTab, 'target', '_blank');
    newTab.click();
  }

  checkContactsDomain(payload) {
    if (!payload.website) {
      return true;
    }
    const firmDomain = this.extractDomainFromWebsite(payload.website);
    let differentDomain = false;
    payload.contacts=payload.contacts.filter(contact => contact?.username?.trim() !== "");
    for (let contact of payload.contacts) {
      const userEmailDomain = contact?.username?.substring(
        contact?.username?.lastIndexOf('@') + 1
      );
      if (firmDomain?.toLowerCase() !== userEmailDomain?.toLowerCase()) {
        differentDomain = true;
        break;
      }
    }

    if (differentDomain) {
      // this.openDifferentDomainConfirmation(payload, addAnother);
      return false; //promise will directly call save function based on user input
    } else {
      return true;
    }
  }

  extractDomainFromWebsite(website: string) {
    return website
      .toLowerCase()
      .replace('http://', '')
      .replace('https://', '')
      .replace('www.', '')
      .split(/[/?#]/)[0];
  }

  openDifferentDomainConfirmation(payload, addAnother) {
    this.SweetAlert.confirm({
      title:
        "One or more contacts domain do not match firm's. Are you sure you want to proceed?",
      confirmButtonText: 'Yes, Please Create the Firm',
      focusCancel: true,
    }).then((isConfirm: { value: boolean }) => {
      if (isConfirm.value && isConfirm.value === true) {
        this.saveData(payload, addAnother);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
