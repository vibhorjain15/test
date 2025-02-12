import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Select, Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { CustomFieldsService } from 'src/app2/services/custom-fields.service';
import { FundDataService } from 'src/app2/services/fund-data.service';
import { RouterService } from 'src/app2/services/router.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { CustomFieldSelectionComponent } from '../../components/custom-field-selection/custom-field-selection.component';
import { DvOwnersComponent } from '../../components/dv-owners/dv-owners.component';
import { EntityContactsComponent } from '../../components/entity-contacts/entity-contacts.component';
import {
  errorMessageMap,
  hierarchyConstants,
  Regex,
} from '../../constants/constant';
import { TeamSelectionComponent } from '../team-selection/team-selection.component';
import { finalize } from 'rxjs/operators';
import { UserState } from 'src/app2/store/user/user.state';
import { take, tap } from 'rxjs/operators';
import {
  DvValidators,
  noHtmlValidator,
} from '../../validators/no-white-space.validator';

@Component({
  selector: 'app-manage-fund',
  templateUrl: './manage-fund.component.html',
  styleUrls: ['./manage-fund.component.css'],
})
export class ManageFundModal implements OnInit {
  @Input() entity_id: number;
  @Input() fund: any;
  @Input() parent_strategy: any;
  @Input() source: string;
  @Input() fund_name: string;
  @Input() isDDqCloseModel: boolean;
  @Input() response: any; //to get the final response
  @Input() fund_type: string = 'fund'; //fund or strategy
  @Input() fundType: string = 'fund'; //fund or strategy in angular js
  loading: boolean;
  edit_mode: boolean;
  hierarchyConstants = hierarchyConstants;
  global_hierarchy_option: string;
  showAddOwners: boolean;
  allRecentAddedFunds: any[];
  FundIdType: number;
  is_manager: boolean;
  is_investor: boolean;
  is_vendor: boolean;
  entity_type: string;
  entity_type_label: string;
  entity_sub_type: string;
  hasFirmWideRole: any;
  currentFirm: any;
  current_user: any;
  currentFirmId: number;
  permissions_enabled: boolean;
  isUserFirmOwner: boolean;
  statuses: any[];
  teams: any[];
  classifications: any[];
  fields: any[];
  customFieldsCopy: any[];
  parentStrategies: any[];
  getAllStrategiesData: any[];
  functions: any[];
  fundForm: FormGroup;
  hideAddAnother: boolean;
  errorMessageMap = errorMessageMap;
  firms: any[];
  @ViewChild('owners') ownersComponent: DvOwnersComponent;
  @ViewChild('permissions') teamSelectionComponent: TeamSelectionComponent;
  @ViewChild('contacts') entityContactsComponent: EntityContactsComponent;
  @ViewChild('customFields')
  customFieldsComponent: CustomFieldSelectionComponent;
  @Input() isAngularJs = false;
  showTeamsToAdd: boolean = false;
  secondaryLoading: boolean;
  productSearchAPIDataLoaded: boolean;
  productSearchAPIData: any;
  getAllProductsListData: any[];
  initialAssociatedProducts: any[];
  userData: any;
  @Select(UserState.getCurrentUserData) user$;
  firmsLoading = false;
  strategiesLoading = false;
  statusesLoading = false;
  classificationsLoading = false;
  constructor(
    private readonly Utils: UtilsService,
    private readonly http: HttpClient,
    private readonly FundDataService: FundDataService,
    private readonly route: RouterService,
    private readonly toaster: ToastrService,
    private readonly customFieldsService: CustomFieldsService,
    private store: Store
  ) {}

  ngOnInit(): void {
    if (this.isAngularJs) {
      this.fund_type = this.fundType;
    }
    this.global_hierarchy_option = this.hierarchyConstants.Strategy;
    this.showAddOwners = true;
    this.edit_mode = false;
    this.allRecentAddedFunds = [];
    this.is_manager = this.Utils.isManager();
    this.is_investor = this.Utils.isInvestor();
    this.is_vendor = this.Utils.isVendorSubscription();
    if (this.fund_type === 'strategy') {
      this.entity_type = 'Strategy';
      this.entity_type_label = 'Strategy';
      this.FundIdType = 5004;
    } else {
      this.entity_type_label = this.Utils.getEntityType();
      this.entity_type = 'Fund';
      this.FundIdType = 1219;
    }
    this.store.selectSnapshot((state) => {
      this.userData = state.user;
    });
    this.entity_sub_type = this.Utils.getEntitySubType(
      this.userData.subscriptionLimits[0]
    );
    this.isUserFirmOwner = false;
    this.user$.pipe(take(1)).subscribe((user) => {
      if (user) {
        this.current_user = JSON.parse(JSON.stringify(user));
        this.hasFirmWideRole = this.current_user.hasFirmWideRole;
        this.currentFirm = this.current_user.firmInfo;
        this.currentFirmId = this.current_user.firmInfo.id;
        this.permissions_enabled =
          this.current_user.firmInfo.hasPermissionEnabled;
      }
    });
    this.createForm();
    this.getData();
  }

  getData() {
    this.loadCustomFields();
    this.statusesLoading = true;
    this.http
      .get('tags', { params: { type: 'Status' } })
      .pipe(finalize(() => (this.statusesLoading = false)))
      .subscribe((response: any) => {
        this.statuses = response;
        if (this.fund && this.fund.relationship_status_id)
          this.fundForm
            .get('relationship_status_id')
            .patchValue(this.fund.relationship_status_id);
      });

    this.http
      .get(`firms/${this.currentFirm.id}/teams`)
      .subscribe((response: any) => {
        this.teams = response;
      });

    if (this.fund_type === 'fund') {
      this.getAllParentStrategies();
      if (!this.classifications) {
        if (this.is_vendor) {
          this.classificationsLoading = true;
          this.http
            .get('vendor_types')
            .pipe(finalize(() => (this.classificationsLoading = false)))
            .subscribe((response: any) => {
              this.classifications = response;
              if (this.fund && this.fund.strategyID) {
                this.fundForm
                  .get('classification')
                  .patchValue(this.fund.strategyID);
              }
            });
        } else {
          this.classificationsLoading = true;
          this.http
            .get('strategies')
            .pipe(finalize(() => (this.classificationsLoading = false)))
            .subscribe((response: any) => {
              this.classifications = response;
              if (this.fund && this.fund.strategyID) {
                this.fundForm
                  .get('classification')
                  .patchValue(this.fund.strategyID);
                response.push({
                  id: this.fund.strategyID,
                  name: this.fund.strategyName,
                });
              }
            });
        }
      }
    } else if (this.fund_type === 'strategy') {
      this.getAllProductsList();
    }

    if (!this.is_manager) {
      if (this.hasFirmWideRole) {
        this.getFirms();
      } else {
        this.getFundPermissionsFilter();
      }
    } else {
      this.fundForm
        .get('parentFirm')
        .patchValue(this.Utils.getCurrentFirm().id);
    }
  }

  createForm() {
    this.fundForm = new FormGroup({
      name: new FormControl(this.fund ? this.fund.name : '', [
        DvValidators.required,
        Validators.pattern(Regex.avoidFirstSplCharacter),
        noHtmlValidator,
      ]),
      alternate_name: new FormControl(
        this.fund ? this.fund.alternate_name : null,
        Validators.pattern(Regex.avoidFirstSplCharacter)
      ),
      key: new FormControl(
        this.fund ? this.fund.key : null,
        Validators.pattern(Regex.avoidFirstSplCharacter)
      ),
      owner_user_id: new FormControl(
        this.Utils.getCurrentUser().id,
        Validators.required
      ),
      parentFirm: new FormControl(null, Validators.required),
      relationship_status_id: new FormControl(null),
    });

    if (this.fund_type === 'fund') {
      this.fundForm.addControl(
        'classification',
        new FormControl(null, Validators.required)
      );
      this.fundForm.addControl(
        'parent_id',
        new FormControl(
          this.fund && this.fund.parent_id ? this.fund.parent_id : null
        )
      );
    } else if (this.fund_type === 'strategy') {
      this.fundForm.addControl('associated_products', new FormControl([]));
    }

    if (this.fund) {
      this.edit_mode = true;
      this.isUserFirmOwner = this.Utils.isCurrentUserFirmOwner(
        this.fund.owner_firm_id
      );
      if (this.fund.parent_id) {
        this.parent_strategy = this.fund.parent_id;
      }
    }

    if (this.source && this.source === 'InformationRequestFlow') {
      this.fundForm.get('name').patchValue(this.fund_name);
      this.hideAddAnother = true;
    }
  }

  getFirms() {
    const params = { skip_pagination: true };
    this.firmsLoading = true;
    this.http
      .get('firms/monitor', { params: params })
      .pipe(finalize(() => (this.firmsLoading = false)))
      .subscribe((response: any) => {
        this.firms = response;
        if (this.fund && this.fund.parentFirm) {
          this.fundForm.get('parentFirm').patchValue(this.fund.parentFirm.id);
        } else if (this.entity_id) {
          this.fundForm.get('parentFirm').patchValue(+this.entity_id);
        }
        if (this.fundForm.get('parentFirm').value) {
          this.parentFirmSelected(this.fundForm.get('parentFirm').value);
        }
      });
  }

  getFundPermissionsFilter() {
    this.http
      .get('firms/fund_permissions_filters')
      .subscribe((response: any) => {
        this.firms = response;
        if (this.firms.length != 0) {
          if (this.fund && this.fund.parentFirm) {
            this.fundForm.get('parentFirm').patchValue(this.fund.parentFirm.id);
          } else if (this.entity_id) {
            this.fundForm.get('parentFirm').patchValue(+this.entity_id);
          }
        }
      });
  }

  loadCustomFields() {
    const payload = {
      schema_type: this.fund_type,
    };
    this.customFieldsService
      .getCustomFields(payload)
      .subscribe((response: any) => {
        if (this.fund_type === 'fund') {
          this.fields = response.custom_fields.fund;
        } else if (this.fund_type === 'strategy') {
          this.fields = response.custom_fields.strategy;
        }
        this.customFieldsCopy = [...this.fields];
      });
  }

  getAllParentStrategies() {
    const params = {
      include_contacts: false,
      include_custom_fields: false,
      include_dates: true,
      is_active: true,
      filters: {},
      search_for: this.global_hierarchy_option,
    };
    this.strategiesLoading = true;
    this.http
      .post('service/dvapi_service/product_search', params)
      .pipe(finalize(() => (this.strategiesLoading = false)))
      .subscribe((response: any) => {
        this.parentStrategies = response.data;
        this.getAllStrategiesData = [];
        if (this.parent_strategy) {
          this.fundForm.get('parent_id').patchValue(this.parent_strategy);
        }
        if (this.edit_mode) {
          this.parentFirmSelected(this.fundForm.get('parentFirm').value);
        } else {
          if (this.is_manager) {
            this.parentFirmSelected(this.Utils.getCurrentFirm().id);
          } else if (this.fundForm.get('parentFirm').value) {
            this.parentFirmSelected(this.fundForm.get('parentFirm').value);
          }
        }
      });
  }

  getAllProductsList() {
    const params = {
      include_contacts: false,
      include_custom_fields: false,
      include_dates: false,
      is_active: true,
      filters: {},
    };
    this.http
      .post('service/dvapi_service/fund_search', params)
      .subscribe((response: any) => {
        this.productSearchAPIData = response.data;
        this.getAllProductsListData = [];
        this.productSearchAPIDataLoaded = true;
        if (this.fund && this.edit_mode) {
          setTimeout(() => {
            this.parentFirmSelected(this.fundForm.get('parentFirm').value);
          }, 1000);
        } else {
          if (this.is_manager) {
            this.parentFirmSelected(this.Utils.getCurrentFirm().id);
          } else if (this.fundForm.get('parentFirm').value) {
            this.parentFirmSelected(this.fundForm.get('parentFirm').value);
          }
        }
      });
  }

  parentFirmSelected(firmId: any, changedByUser: boolean = false) {
    if (this.fund_type === 'fund') {
      this.getAllStrategiesListByFirmId(+firmId);
    } else if (this.fund_type === 'strategy') {
      this.getAllProductsListByFirmId(+firmId);
      if (this.edit_mode && !changedByUser) {
        this.setInitialProducts(+firmId);
      }
    }
  }

  getAllStrategiesListByFirmId(firmId: number) {
    this.getAllStrategiesData = this.parentStrategies.filter(
      (x) => x.firm_id === firmId
    );
    if (
      !this.getAllStrategiesData.find(
        (val) => val.id == this.fundForm.get('parent_id').value
      )
    ) {
      this.fundForm.get('parent_id').patchValue(null);
    }
  }

  getAllProductsListByFirmId(firmId: number) {
    this.getAllProductsListData = [];
    this.fundForm.get('associated_products').patchValue([]);
    this.productSearchAPIData.forEach((result) => {
      let product: {
        id: any;
        type: string;
        description: any;
        is_active: number;
      };
      if (this.fund) {
        if (
          result.firm_id === firmId &&
          (!result.parent_id || result.parent_id === this.fund.id)
        ) {
          product = {
            id: result.id,
            type: 'fund',
            description: result.name,
            is_active: 1,
          };
          this.getAllProductsListData.push(product);
        }
      } else {
        if (result.firm_id === firmId && !result.parent_id) {
          product = {
            id: result.id,
            type: 'fund',
            description: result.name,
            is_active: 1,
          };
          this.getAllProductsListData.push(product);
        }
      }
    });
  }

  setInitialProducts(firmId: number) {
    this.initialAssociatedProducts = [];
    if (this.fund && this.fund.parentFirm.id === firmId) {
      const selectedData: any[] = this.fund.associated_products;
      if (!selectedData || !selectedData.length) {
        this.fundForm.get('associated_products').patchValue([]);
      } else {
        const filteredSelection: any[] = this.getAllProductsListData.filter(
          (x) => selectedData.some((y) => x.id === y.id)
        );
        this.fundForm.get('associated_products').patchValue(filteredSelection);
        this.initialAssociatedProducts = filteredSelection;
      }
    }
  }

  generatePageUrl(payload) {
    //For investor, they have to select a parent firm, so use the selected firm id
    if (payload.parentFirm) {
      if (this.edit_mode) {
        return `app/firms/${payload.parentFirm.id}/funds/${payload.id}`;
      } else {
        return `app/firms/${payload.parentFirm.id}/funds`;
      }
      //for manager, they don't have to select a parent firm, so use the logged in firm id
    } else {
      if (this.edit_mode) {
        return `app/firms/${this.currentFirm.id}/funds/${payload.id}`;
      } else {
        return `app/firms/${this.currentFirm.id}/funds`;
      }
    }
  }

  submit(modalCallback, addAnother = false) {
    if (!this.fundForm.valid) {
      this.fundForm.markAllAsTouched();
      return;
    }
    if (
      (this.teamSelectionComponent &&
        !this.teamSelectionComponent.isFormValid()) ||
      (this.entityContactsComponent &&
        !this.entityContactsComponent.isFormValid()) ||
      (this.customFieldsComponent && !this.customFieldsComponent.isFormValid())
    ) {
      return;
    }
    if (addAnother) {
      this.secondaryLoading = true;
    } else {
      this.loading = true;
    }

    const payload: any = this.fundForm.value;
    if (this.is_manager) {
      payload.contacts = [];
    }
    payload.fund_type = this.fund_type;
    if (payload.classification) {
      payload.strategyID = payload.classification;
      delete payload.classification;
    }
    if (this.is_investor) {
      payload.parentFirm = {
        id: this.fundForm.get('parentFirm').value,
      };
    } else {
      delete payload.parentFirm;
    }

    if (!payload.parent_id) {
      delete payload.parent_id;
    }
    if (this.edit_mode) {
      payload.id = this.fund.id;
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
    const addedContacts = this.entityContactsComponent?.getAddedContacts();
    if (addedContacts) {
      payload.contacts = addedContacts;
    }
    if (this.edit_mode && this.initialAssociatedProducts?.length) {
      // add all de-selected products with is_active 0 for db to remove
      const selectedIds = payload.associated_products.map((x) => x.id);
      const removedFunds = this.initialAssociatedProducts.filter(
        (x) => !selectedIds.includes(x.id)
      );
      removedFunds.map((x) => (x.is_active = 0));
      payload.associated_products.push(...removedFunds);
    }
    const pageUrl = this.generatePageUrl(payload);
    if (!this.edit_mode) {
      this.FundDataService.addFund(payload, pageUrl).subscribe(
        (response: any) => {
          const addedFields = this.customFieldsComponent?.getAddedFields();
          if (addedFields?.length) {
            this.saveCustomFieldsData(
              response,
              modalCallback,
              addAnother,
              addedFields
            );
          } else {
            this.toaster.success(
              `${this.entity_type_label} successfully added`
            );
            if (!addAnother) {
              this.loading = false;
            }
            this.successCallback(response, modalCallback, addAnother);
          }
        },
        (e) => {
          this.stopLoading();
        }
      );
    } else {
      this.FundDataService.editFund(payload, pageUrl).subscribe(
        (response: any) => {
          this.toaster.success(
            `${this.entity_type_label} successfully updated`
          );
          this.successCallback(response, modalCallback, addAnother);
        },
        (e) => {
          this.stopLoading();
        }
      );
    }
  }

  successCallback(response, modalCallback, addAnother) {
    if (addAnother) {
      this.fundForm.reset();
      this.edit_mode = false;
      this.ownersComponent.resetForm();
      this.teamSelectionComponent?.resetForm();
      this.entityContactsComponent?.resetForm();
      setTimeout(() => {
        this.customFieldsComponent?.resetForm(); // reset custom fields after success response
      }, 100);
      this.fundForm
        .get('owner_user_id')
        .patchValue(this.Utils.getCurrentUser().id);
      if (this.is_manager) {
        this.fundForm
          .get('parentFirm')
          .patchValue(this.Utils.getCurrentFirm().id);
      } else {
        this.fundForm.get('parentFirm').patchValue(null);
      }
      if (this.fund_type === 'strategy') {
        this.fundForm.get('associated_products').patchValue([]);
      }
      this.fundForm.get('relationship_status_id').patchValue(null);
      if (this.fund_type === 'fund') {
        this.fundForm.get('parent_id').patchValue(null);
        this.fundForm.get('classification').patchValue(null);
      }
    } else {
      if (!this.isDDqCloseModel) this.redirectIfApplicable(response);
      modalCallback();
    }
    if (this.response) this.response(response);

    this.stopLoading();
  }

  redirectIfApplicable(response) {
    if (!this.edit_mode) {
      if (this.source !== 'InformationRequestFlow') {
        if (this.fund_type === 'fund') {
          this.redirectToProductDetail(response.id, response.parentFirm.id);
        } else if (this.fund_type === 'strategy') {
          this.redirectToStrategyDetail(response.id, response.parentFirm.id);
        }
      }
    }
  }

  redirectToProductDetail(id: any, firmId: any) {
    if (this.is_manager) {
      this.route.navigateWithParams('app.firms.funds.profile.aum_tr', {
        firmId,
        fundId: id,
      });
    } else {
      this.route.navigateWithParams('app.firms.funds.profile.monitor', {
        firmId,
        fundId: id,
      });
    }
  }

  redirectToStrategyDetail(id: any, firmId: any) {
    if (this.is_manager) {
      this.route.navigateWithParams('app.firms.strategies.profile.aum_tr', {
        firmId,
        strategyId: id,
      });
    } else {
      this.route.navigateWithParams('app.firms.strategies.profile.monitor', {
        firmId,
        strategyId: id,
      });
    }
  }

  saveCustomFieldsData(response, modalCallback, addAnother, addedFields) {
    const payload = {
      entity_id: response.id,
      owner_user_id: this.current_user.id,
      entity_type: this.FundIdType,
      schema_type: this.fund_type,
      custom_fields: addedFields,
    };
    this.customFieldsService.saveCustomFields(payload).subscribe((resp) => {
      this.toaster.success(`${this.entity_type_label} successfully added`);
      this.successCallback(response, modalCallback, addAnother);
      if (!addAnother) {
        this.loading = false;
      }
    });
  }

  stopLoading() {
    this.loading = false;
    this.secondaryLoading = false;
  }
}
