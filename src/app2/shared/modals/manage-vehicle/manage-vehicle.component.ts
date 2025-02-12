import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { UtilsService } from 'src/app2/services/utils.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { errorMessageMap, Regex } from '../../constants/constant';
import * as moment from 'moment';
import { DatePipe } from '@angular/common';
import { DvOwnersComponent } from '../../components/dv-owners/dv-owners.component';
import { VehicleDataService } from 'src/app2/services/vehicle-data.service';
import { RouterService } from 'src/app2/services/router.service';
import { ToastrService } from 'ngx-toastr';
import { CustomFieldSelectionComponent } from '../../components/custom-field-selection/custom-field-selection.component';
import { CustomFieldsService } from 'src/app2/services/custom-fields.service';
import {
  DvValidators,
  noHtmlValidator,
} from '../../validators/no-white-space.validator';

@Component({
  selector: 'app-manage-vehicle',
  templateUrl: './manage-vehicle.component.html',
  styleUrls: ['./manage-vehicle.component.css'],
})
export class ManageVehicleModal implements OnInit {
  @Input() vehicle: any;
  @Input() source: any;
  @Input() response: any;
  @Input() isDDqCloseModel: boolean;
  loading: boolean;
  edit_mode: boolean;
  secondaryLoading: boolean;
  currentFirm: any;
  current_user: any;
  currentFirmId: any;
  is_investor: boolean;
  isFreeSubscription: boolean;
  edit_disabled: boolean;
  VehicleIdType: number;
  showAddOwners: boolean;
  statuses: any[];
  currency: any[];
  fields: any[];
  customFieldsCopy: any[];
  funds: any[];
  vehicleForm: FormGroup;
  @ViewChild('owners') ownersComponent: DvOwnersComponent;
  @ViewChild('customFields')
  customFieldsComponent: CustomFieldSelectionComponent;
  errorMessageMap = errorMessageMap;
  @Input() isAngularJs = false;
  minDate = new Date('01-01-1900');
  constructor(
    private readonly Utils: UtilsService,
    private readonly http: HttpClient,
    private datePipe: DatePipe,
    private readonly vehicleDataService: VehicleDataService,
    private readonly route: RouterService,
    private readonly toaster: ToastrService,
    private readonly customFieldsService: CustomFieldsService
  ) {}

  ngOnInit(): void {
    this.currentFirm = this.Utils.getCurrentFirm();
    this.current_user = this.Utils.getCurrentUser();
    this.currentFirmId = this.current_user.firmInfo.id;
    this.is_investor = this.Utils.isInvestor();
    this.isFreeSubscription = this.Utils.isFreeSubscription();
    this.edit_disabled = false;
    this.VehicleIdType = 1217;
    this.showAddOwners = true;
    this.edit_mode = false;
    this.createForm();
    this.getData();
  }

  createForm() {
    this.vehicleForm = new FormGroup({
      name: new FormControl(this.vehicle?.name ? this.vehicle.name : '', [
        DvValidators.required,
        Validators.pattern(Regex.avoidFirstSplCharacter),
        noHtmlValidator,
      ]),
      alternate_name: new FormControl(
        this.vehicle?.alternate_name ? this.vehicle.alternate_name : null,
        Validators.pattern(Regex.avoidFirstSplCharacter)
      ),
      key: new FormControl(
        this.vehicle?.key ? this.vehicle.key : null,
        Validators.pattern(Regex.avoidFirstSplCharacter)
      ),
      currency_id: new FormControl('', [Validators.required]),
      inception_at: new FormControl(
        this.vehicle?.inception_at
          ? moment(this.vehicle.inception_at).toDate()
          : ''
      ),
      owner_user_id: new FormControl(
        this.Utils.getCurrentUser().id,
        Validators.required
      ),
      fund_id: new FormControl('', Validators.required),
      relationship_status_id: new FormControl(''),
    });

    if (this.vehicle?.id) {
      this.edit_mode = true;
    }

    if (this.edit_mode && this.vehicle.owner_firm_id !== this.currentFirm.id) {
      this.edit_disabled = true;
    }
  }

  getData() {
    this.http
      .get('tags', { params: { type: 'Status' } })
      .subscribe((response: any) => {
        this.statuses = response;
        if (this.vehicle?.relationship_status_id) {
          this.vehicleForm
            .get('relationship_status_id')
            .patchValue(this.vehicle.relationship_status_id);
        }
      });

    this.http.get('currency').subscribe((response: any) => {
      this.currency = response;
      if (this.vehicle?.currency_id) {
        this.vehicleForm
          .get('currency_id')
          .patchValue(this.vehicle.currency_id);
      }
    });

    this.getFunds();
    this.loadCustomFields();
  }

  loadCustomFields() {
    const payload = {
      schema_type: 'vehicle',
    };
    this.customFieldsService
      .getCustomFields(payload)
      .subscribe((response: any) => {
        this.fields = response.custom_fields.vehicle;
        this.customFieldsCopy = [...this.fields];
      });
  }

  getFunds() {
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
        this.funds = response.data;
        if (
          this.vehicle?.fund_id &&
          // Added extra check incase if associated product is deleted
          // User will not able to edit the vehicle
          this.funds.find((fund) => fund.id == this.vehicle.fund_id)
        ) {
          this.vehicleForm.get('fund_id').patchValue(this.vehicle.fund_id);
        }
      });
  }

  setDateValue(date: Date) {
    this.vehicleForm.get('inception_at').patchValue(date);
  }

  generatePageUrl(fund_id, selectedFirmId) {
    if (this.edit_mode) {
      return `app/firms/${selectedFirmId}/funds/${fund_id}/vehicles/${this.vehicle.id}`;
    } else {
      return `app/firms/${selectedFirmId}/funds/${fund_id}/vehicles`;
    }
  }

  submit(modalCallback, addAnother = false) {
    if (!this.vehicleForm.valid) {
      this.vehicleForm.markAllAsTouched();
      return;
    }
    if (
      this.customFieldsComponent &&
      !this.customFieldsComponent.isFormValid()
    ) {
      return;
    }
    if (addAnother) {
      this.secondaryLoading = addAnother;
      this.loading = !addAnother;
    } else {
      this.loading = true;
    }
    const payload: any = this.vehicleForm.value;
    if (payload.inception_at) {
      payload.inception_at = this.datePipe.transform(
        payload.inception_at,
        'MM-dd-yyyy'
      );
    } else {
      payload.inception_at = null;
    }
    payload.is_active = true;
    if (this.edit_mode) {
      payload.id = this.vehicle.id;
    }
    const selectedFunctions = this.ownersComponent.getSelectedFunctions();
    payload.functions = selectedFunctions;
    const selectedFund = this.funds.find((x) => x.id === payload.fund_id);
    const selectedFirmId = selectedFund?.firm_id;
    if (!this.edit_mode) {
      const pageUrl = this.generatePageUrl(payload.fund_id, selectedFirmId);
      this.vehicleDataService
        .addVehicle(selectedFirmId, payload.fund_id, payload, pageUrl)
        .subscribe(
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
              this.toaster.success(`Vehicle successfully added`);
              this.loading = false;
              this.successCallback(response, modalCallback, addAnother);
            }
          },
          (e) => {
            this.stopLoading();
          }
        );
    } else {
      this.vehicleDataService
        .editVehicle(selectedFirmId, payload.fund_id, payload)
        .subscribe(
          (response: any) => {
            this.toaster.success('Vehicle successfully updated');
            this.successCallback(response, modalCallback, addAnother);
          },
          (e) => {
            this.stopLoading();
          }
        );
    }
  }

  successCallback(response, modalCallback, addAnother) {
    // this.loading = this.secondaryLoading = false;
    if (addAnother) {
      this.vehicleForm.reset();
      this.edit_mode = false;
      this.ownersComponent.resetForm();
      this.customFieldsComponent?.resetForm();

      this.vehicleForm.get('currency_id').patchValue('');
      this.vehicleForm.get('relationship_status_id').patchValue('');
      this.vehicleForm.get('fund_id').patchValue('');
      this.vehicleForm
        .get('owner_user_id')
        .patchValue(this.Utils.getCurrentUser().id);
    } else {
      if (this.response) {
        this.response(response);
      }
      if (!this.isDDqCloseModel) {
        this.redirectIfApplicable(response);
      }
      modalCallback();
    }
    this.stopLoading();
  }

  stopLoading() {
    this.loading = false;
    this.secondaryLoading = false;
  }

  redirectIfApplicable(response) {
    if (this.isAngularJs) {
      this.source = {
        text: 'main_menu_new',
      };
    }
    if (
      !this.edit_mode &&
      this.source &&
      (this.source.text === 'main_menu_new' || this.source.text === 'monitor')
    ) {
      if (this.isFreeSubscription) {
        this.route.navigateWithParams(
          'app.firms.funds.vehicles.profile.aum_tr',
          {
            firmId: response.firm_id,
            fundId: response.fund_id,
            vehicleId: response.id,
          }
        );
      } else {
        this.route.navigateWithParams(
          'app.firms.funds.vehicles.profile.monitor',
          {
            firmId: response.firm_id,
            fundId: response.fund_id,
            vehicleId: response.id,
          }
        );
      }
    }
  }

  saveCustomFieldsData(response, modalCallback, addAnother, addedFields) {
    const payload = {
      entity_id: response.id,
      owner_user_id: this.current_user.id,
      entity_type: this.VehicleIdType,
      schema_type: 'vehicle',
      custom_fields: addedFields,
    };
    this.customFieldsService.saveCustomFields(payload).subscribe((resp) => {
      this.toaster.success(`Vehicle successfully added`);
      this.loading = false;
      this.successCallback(response, modalCallback, addAnother);
    });
  }
}
