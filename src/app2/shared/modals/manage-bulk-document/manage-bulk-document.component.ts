import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { FirmDataService } from 'src/app2/services/firm-data.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { VehicleDataService } from 'src/app2/services/vehicle-data.service';
import { FundDataService } from 'src/app2/services/fund-data.service';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { EntityType } from '../../constants/constant';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { UtilsService } from 'src/app2/services/utils.service';
@Component({
  selector: 'app-manage-bulk-document',
  templateUrl: './manage-bulk-document.component.html',
})
export class ManageBulkDocumentComponent implements OnInit {
  @Input() documentOptions: any;
  @Input() success: any;

  documentsList: any;
  sourceEntityType: any;
  loading = false;
  destinationEntityType = 'Firm';
  actionType: any;
  sourceEntityId: any;
  firms: any;
  global_hierarchy_option: any;
  strategies: any;
  strategy: any;
  vehicles: any;
  funds: any;
  documentForm: FormGroup;
  entityTypeValue = EntityType;
  destinationEntityId: any;
  firmLabel = this.utils.isManager() ? 'Investor' : 'Firm';
  entityTypes: any[] = [
    { id: 'Firm', name: this.firmLabel },
    { id: 'Strategy', name: 'Strategy' },
    { id: 'Fund', name: 'Product' },
    { id: 'Vehicle', name: 'Vehicle' },
  ];
  saving = false;
  constructor(
    private readonly firmDataService: FirmDataService,
    private readonly httpClient: HttpClient,
    private readonly vehicleDataService: VehicleDataService,
    private readonly toaster: ToastrService,
    private readonly customModalService: CustomModalService,
    private readonly fundDataService: FundDataService,
    private readonly formBuilder: FormBuilder,
    private readonly utils: UtilsService
  ) {}

  ngOnInit(): void {
    this.initDocumentForm();
    this.initialize();
  }

  initDocumentForm() {
    this.documentForm = this.formBuilder.group({
      destinationEntityType: new FormControl(this.destinationEntityType),
      destinationEntityId: new FormControl(null, Validators.required),
    });

    this.documentForm
      .get('destinationEntityType')
      .valueChanges.subscribe((response) => {
        this.documentForm.get('destinationEntityId').setValue(null);
      });
  }

  initialize() {
    this.destinationEntityType = 'Firm';
    this.actionType = this.documentOptions.type;
    this.sourceEntityType = this.documentOptions.sourceEntityType;
    this.documentsList = this.documentOptions.documentsList;
    this.sourceEntityId = this.documentOptions.sourceEntityId;

    const params = {
      include_contacts: false,
      include_custom_fields: false,
      include_dates: true,
      is_active: true,
      filters: {},
      search_for: this.global_hierarchy_option,
    };
    this.loading = true;
    forkJoin({
      firms: this.firmDataService.getAllFirms({ skip_pagination: true }),
      funds: this.fundDataService.getAllFunds(),
      vehicles: this.vehicleDataService.getVehicles(),
      strategies: this.httpClient.post(
        'service/dvapi_service/product_search',
        params
      ),
    })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe((response) => {
        if (response) {
          this.vehicles = response?.vehicles || [];
          this.firms = response?.firms || [];
          this.strategies = (response?.strategies as any)?.data || [];
          this.funds = response?.funds || [];
        }
      });
  }

  submit() {
    if (this.documentForm.valid) {
      if (this.actionType === 'move') {
        this.moveAllDocuments();
      } else if (this.actionType === 'copy') {
        this.copyAllDocuments();
      } else if (this.actionType === 'remove') {
        this.removeAllDocuments();
      }
    }
  }

  moveAllDocuments() {
    this.saving = true;
    const filter_params = {
      operation: 'CUT_PASTE',
      attachment_ids: this.documentsList,
      source_entity_id: this.sourceEntityId,
      source_entity_type: this.entityTypeValue[this.sourceEntityType],
      destination_entity_type:
        this.entityTypeValue[this.documentForm.value.destinationEntityType],
      destination_entity_id: this.documentForm.value.destinationEntityId,
    };
    return this.httpClient
      .post('service/dvapi_service/update_attachment_assignment', filter_params)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe((response: any) => {
        return this.httpClient
          .post('attachments/update_metadata', {
            attachment_ids: this.documentsList,
          })
          .subscribe((response_meta: any) => {
            this.saving = false;
            this.toaster.success('Document(s) successfully moved.');
            this.close();
          });
      });
  }

  close() {
    this.success();
    this.customModalService.close();
  }

  copyAllDocuments() {
    this.saving = true;
    const filter_params = {
      operation: 'COPY_PASTE',
      attachment_ids: this.documentsList,
      source_entity_id: this.sourceEntityId,
      source_entity_type: this.entityTypeValue[this.sourceEntityType],
      destination_entity_type:
        this.entityTypeValue[this.documentForm.value.destinationEntityType],
      destination_entity_id: this.documentForm.value.destinationEntityId,
    };
    return this.httpClient
      .post('service/dvapi_service/update_attachment_assignment', filter_params)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe((response: any) => {
        return this.httpClient
          .post(`attachments/update_metadata`, {
            attachment_ids: this.documentsList,
          })
          .subscribe((response_meta: any) => {
            this.toaster.success('Document(s) successfully copied.');
            return this.close();
          });
      });
  }

  removeAllDocuments() {
    this.saving = true;
    const filter_params = {
      operation: 'remove',
      attachment_ids: this.documentsList,
      source_entity_id: this.sourceEntityId,
      source_entity_type: this.entityTypeValue[this.sourceEntityType],
      destination_entity_type:
        this.entityTypeValue[this.documentForm.value.destinationEntityType],
      destination_entity_id: this.documentForm.value.destinationEntityId,
    };
    return this.httpClient
      .post('service/dvapi_service/update_attachment_assignment', filter_params)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe((response: any) => {
        return this.httpClient
          .post('attachments/update_metadata', {
            attachment_ids: this.documentsList,
          })
          .subscribe((response_meta: any) => {
            this.saving = false;
            this.toaster.success('Document(s) successfully removed.');
            this.close();
          });
      });
  }

  handleOnSelectChange(dvSelectEvent: any) {
    const control = this.documentForm.get('destinationEntityId');
    control.setValue(null);
    control.markAsUntouched();
  }
}
