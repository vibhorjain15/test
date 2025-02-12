import { DatePipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import { BsModalRef } from 'ngx-bootstrap/modal';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';

import { UtilsService } from 'src/app2/services/utils.service';
import { ColorTheme } from 'src/app2/shared/themes/color.themes';
import { CurrentUserModel } from 'src/app2/store/user/user.model';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { FundDataService } from 'src/app2/services/fund-data.service';
import {
  ErrorStatusCode,
  keywordConstants,
} from 'src/app2/shared/constants/constant';
import { VehicleDataService } from 'src/app2/services/vehicle-data.service';
import { DocumentDataService } from 'src/app2/services/document-data.service';
import { FirmDataService } from 'src/app2/services/firm-data.service';
import { GridFolderManagementService } from 'src/app2/services/grid-folder-management.service';
import { RowNode } from 'ag-grid-community';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';

@Component({
  selector: 'bulk-edit-documents-modal',
  templateUrl: './bulk-edit-documents-modal.component.html',
  styleUrls: ['./bulk-edit-documents-modal.component.css'],
})
export class BulkEditDocumentsModalComponent implements OnInit {
  @Input() selectedDocuments: Array<any> = [];
  @Input() selectedRowNodes: RowNode[] = [];
  @Input() folderDetails: any; // required in case of single folder edit.
  @Input() modalTitle: string = 'Edit Document Details';
  @Input() selectedViewType: 'file' | 'folder' = 'folder';
  @Input() operationMode: 'single' | 'bulk' = 'bulk';
  @Input() selectionPath: Array<string> = ['Documents'];
  @Input() callback: () => void;
  @Input() allowBulkAddAssociatedEntity;
  @Input() isProjectGrid;

  colorTheme = ColorTheme;
  bulkEditInfoMessage: string =
    'As of Date changes will apply to all selected documents. Existing entity associations and document types cannot be deleted in bulk and can only be updated with new values.';
  currentUser: CurrentUserModel;
  entityTypes: Array<any> = [
    { id: keywordConstants.Strategy, name: keywordConstants.Strategy },
    { id: keywordConstants.Product, name: 'Product' },
    { id: keywordConstants.Vehicle, name: keywordConstants.Vehicle },
  ];
  isManager: boolean = false;
  tagList: Array<any> = [];
  emptyFolderCount = 0;
  maxAsOfDate = new Date();
  documentEditForm: FormGroup;
  initialFormValues: any = {};
  keywordConstants = keywordConstants;
  entitiesLoading: boolean = false;
  associatedEntitiesList = {
    [keywordConstants.Product]: [],
    [keywordConstants.Vehicle]: [],
    [keywordConstants.Strategy]: [],
    [keywordConstants.Firm]: [],
    [keywordConstants.MyFirm]: [],
  };
  currentEntityTypeList: Array<any> = [];
  isUpdateInProgress: boolean = false;
  isNameUpdateRequired: boolean = false;
  documentCounts = { folders: 0, total: 0 };

  constructor(
    private readonly datePipe: DatePipe,
    private readonly bsModalRef: BsModalRef,
    private readonly utilsService: UtilsService,
    private readonly toastrService: ToastrService,
    private readonly baseDataService: BaseDataService,
    private readonly firmDataService: FirmDataService,
    private readonly fundDataService: FundDataService,
    private readonly vehicleDataService: VehicleDataService,
    private readonly documentDataService: DocumentDataService,
    private readonly gridFolderManagementService: GridFolderManagementService,
    private readonly SweetAlert: SweetAlertService
  ) {}

  //#region Angular Lifecycle

  ngOnInit(): void {
    this.currentUser = this.utilsService.getCurrentUser();
    this.isManager = this.utilsService.isManager();
    if (this.isManager) {
      this.entityTypes.unshift(
        { id: keywordConstants.MyFirm, name: 'My Firm' },
        { id: keywordConstants.Firm, name: 'Investor' }
      );
    } else {
      this.entityTypes.unshift({
        id: keywordConstants.Firm,
        name: keywordConstants.Firm,
      });
    }
    if (this.selectedViewType == 'folder') {
      this.selectedRowNodes?.forEach((nodes: RowNode) => {
        if (nodes.data.document.type === 0) {
          if (!nodes.allLeafChildren.find((row) => row.data.type == 1))
            this.emptyFolderCount++;
        }
      });
    }
    this.setDocumentCounts();
    this.getDocumentTags();
    this.initializeForm();
  }

  //#endregion

  updateDocuments(event: any = null): void {
    if (this.documentEditForm.invalid) {
      return;
    }

    if (this.documentCounts.total === 0) {
      this.toastrService.error('Please select documents to update.');
      return;
    }

    // If folder name update is required
    // then update it first and come back.
    if (this.isNameUpdateRequired) {
      this.renameFolder();
      return;
    }

    const payload = this.getPayloadForUpdate();
    // If payload is empty then close modal.
    // Count will be at least 1 because of `attachment_ids`
    if (Object.keys(payload).length === 1) {
      this.closeModal();
      return;
    }

    this.isUpdateInProgress = true;
    this.gridFolderManagementService
      .updateDocuments(payload)
      .pipe(finalize(() => (this.isUpdateInProgress = false)))
      .subscribe({
        next: (response: any) => {
          this.toastrService.success('Document details updated successfully.');
          this.closeModal();
        },
        error: (error: any) => {
          this.toastrService.error('Failed to update document details.');
        },
      });
  }

  renameFolder(): void {
    this.isUpdateInProgress = true;
    const folderName = this.documentEditForm.get('folderName').value;
    this.gridFolderManagementService
      .renameFolder(this.folderDetails.id, folderName, true)
      .pipe(finalize(() => (this.isUpdateInProgress = false)))
      .subscribe({
        next: (response: any) => {
          this.isNameUpdateRequired = false;
          this.toastrService.success('Folder name updated successfully.');
          this.updateDocuments();
        },
        error: (err: any) => {
          if (
            err.status === ErrorStatusCode.BadRequest &&
            err.error?.message?.includes('name already exists')
          ) {
            this.documentEditForm.get('folderName').setErrors({
              invalidFolderName:
                'Please use a different name. Folder with this name already exists in the same location.',
            });
          } else if (err.status === ErrorStatusCode.BadRequest) {
            // same alert as present in interceptor. since we're skipping bad request alerts for the request
            let errorMessages: any = '';
            if (err.error.modelState) {
              errorMessages = Object.values(err.error.modelState)[0];
            }
            this.SweetAlert.error({
              title: err.error.error_description
                ? err.error.error_description
                : err.error.message,
              text: errorMessages,
              confirmButtonText: 'Okay',
            });
          }
          this.toastrService.error('Failed to update folder name.');
        },
      });
  }

  closeModal(): void {
    if (this.callback) {
      this.callback();
    }

    this.bsModalRef.hide();
  }

  handleAsOfDateChange(date: Date) {
    this.documentEditForm.patchValue({
      as_of_date: date,
    });

    if (date) {
      this.documentEditForm.get('as_of_date').markAsTouched();
    }
  }

  onEntityTypeChange(entityType: string | null) {
    this.documentEditForm.patchValue({ associated_entities: null });

    if (entityType && this.associatedEntitiesList[entityType].length) {
      this.currentEntityTypeList = this.associatedEntitiesList[entityType];
    } else {
      // If entity list not available then fetch it.
      switch (entityType) {
        case keywordConstants.Product:
          this.getFunds();
          break;
        case keywordConstants.Vehicle:
          this.getVehicles();
          break;
        case keywordConstants.Strategy:
          this.getAllStrategies();
          break;
        case keywordConstants.Firm:
          this.getFirms();
          break;
        case keywordConstants.MyFirm:
          this.documentEditForm.patchValue({
            associated_entities: [this.currentUser.firmInfo.id],
          });
          this.currentEntityTypeList = [];
          this.entitiesLoading = false;
          break;
        default:
          this.currentEntityTypeList = [];
          this.entitiesLoading = false;
          break;
      }
    }

    setTimeout(() => {
      this.updateValidators();
    });
  }

  private getDocumentTags() {
    this.baseDataService
      .getAttachmentTypes()
      .subscribe((tags: any[]) => (this.tagList = tags));
  }

  private getFirms() {
    this.entitiesLoading = true;
    const params = {
      include_contacts: false,
      include_custom_fields: false,
      include_dates: false,
      is_active: true,
      filters: {},
    };
    this.firmDataService
      .getFirms(params)
      .pipe(finalize(() => (this.entitiesLoading = false)))
      .subscribe({
        next: (response: any) => {
          if (!this.isManager) {
            const myFirmOption = {
              id: this.currentUser.firmInfo.id,
              display_name: 'My Firm',
            };
            response.data.unshift(myFirmOption);
          }
          this.associatedEntitiesList[keywordConstants.Firm] = response.data;
          this.currentEntityTypeList =
            this.associatedEntitiesList[keywordConstants.Firm];
        },
      });
  }

  private getAllStrategies() {
    this.entitiesLoading = true;
    const params = {
      include_contacts: false,
      include_custom_fields: false,
      include_dates: true,
      is_active: true,
      filters: {},
      search_for: 'strategy',
    };
    this.documentDataService
      .getFunds(params)
      .pipe(finalize(() => (this.entitiesLoading = false)))
      .subscribe((response: { data: any }) => {
        this.associatedEntitiesList[keywordConstants.Strategy] = JSON.parse(
          JSON.stringify(response.data)
        );
        this.currentEntityTypeList =
          this.associatedEntitiesList[keywordConstants.Strategy];
      });
  }

  private getFunds() {
    this.entitiesLoading = true;
    this.fundDataService
      .getFunds()
      .pipe(finalize(() => (this.entitiesLoading = false)))
      .subscribe((response: any) => {
        this.associatedEntitiesList[keywordConstants.Product] = response.data;
        this.currentEntityTypeList =
          this.associatedEntitiesList[keywordConstants.Product];
      });
  }

  private getVehicles() {
    this.entitiesLoading = true;
    const payload = {
      include_contacts: true,
      include_custom_fields: false,
      include_dates: true,
      filters: {},
      is_active: true,
      search_for: 'vehicle',
    };
    this.vehicleDataService
      .getVehiclesV2(payload)
      .pipe(finalize(() => (this.entitiesLoading = false)))
      .subscribe((response: any) => {
        this.associatedEntitiesList[keywordConstants.Vehicle] = response.data;
        this.currentEntityTypeList =
          this.associatedEntitiesList[keywordConstants.Vehicle];
      });
  }

  private setDocumentCounts(): void {
    this.documentCounts.total = this.selectedDocuments.length;
    this.documentCounts.folders = this.selectedDocuments.filter(
      (document) => document.type === 0
    ).length;
  }

  //#region Document edit form

  private initializeForm(): void {
    this.documentEditForm = new FormGroup(
      {
        entityType: new FormControl(null),
        associated_entities: new FormControl(null),
        tags: new FormControl(null),
        as_of_date: new FormControl(null),
      },
      this.fieldsAvailableForUpdate.bind(this)
    );

    // Add folder name control while editing single folder.
    if (
      this.operationMode === 'single' &&
      this.selectedViewType === 'folder' &&
      this.folderDetails
    ) {
      this.documentEditForm.addControl(
        'folderName',
        new FormControl(this.folderDetails.name, [
          this.validateFolderName.bind(this),
        ])
      );
    }

    this.initialFormValues = this.documentEditForm.getRawValue();
    this.updateValidators();
  }

  private updateValidators(): void {
    const values = this.documentEditForm.getRawValue();
    if (values.entityType === undefined || values.entityType === null) {
      this.documentEditForm.get('associated_entities').clearValidators();
    } else {
      this.documentEditForm
        .get('associated_entities')
        .addValidators(Validators.required);
    }

    this.documentEditForm.get('associated_entities').updateValueAndValidity();
  }

  /**
   * Checks whether any form field is available to update or not.
   * @param control The form group.
   * @returns The validation error.
   */
  private fieldsAvailableForUpdate(
    control: AbstractControl
  ): ValidationErrors | null {
    const values = control.getRawValue();
    for (const property in values) {
      const value = values[property];
      if (property === 'folderName') {
        this.isNameUpdateRequired =
          !!value && this.initialFormValues.folderName !== value;
        if (this.isNameUpdateRequired) {
          return null;
        }

        continue;
      }

      // Check for non-empty array.
      if (value && Array.isArray(value)) {
        if (value.length) {
          return null;
        }
      } else if (value) {
        return null;
      }
    }

    return { fieldsAvailableForUpdate: false };
  }

  private validateFolderName(
    control: AbstractControl
  ): ValidationErrors | null {
    const folderName = control.value;
    const result =
      this.gridFolderManagementService.isFolderNameValid(folderName);
    if (result && !result.isValid) {
      return { invalidFolderName: result.reason ?? '' };
    }

    return null;
  }

  //#endregion

  //#region Payload

  private getPayloadForUpdate(): any {
    const payload = {};
    const values = this.documentEditForm.getRawValue();
    for (const property in values) {
      const value = values[property];
      // Check for non-empty array.
      if (value && Array.isArray(value)) {
        if (value.length) {
          payload[property] = value;
        }
      } else if (value) {
        payload[property] = value;
      }
    }

    delete payload['entityType']; // entity type is not required in payload.
    delete payload['folderName']; // not required in payload.
    this.addAsOfDate(payload);
    this.addAttachmentIds(payload);
    this.addAssociatedEntities(payload);
    return payload;
  }

  private addAttachmentIds(payload: any): void {
    payload.attachment_ids = this.selectedDocuments
      .filter((document) => document.type === 1 || this.isProjectGrid)
      .map((document) => document.attachment_id ?? document.id); // in case of attachment assignments,
  }

  private addAssociatedEntities(payload: any): void {
    if (
      !payload ||
      !payload.hasOwnProperty('associated_entities') ||
      !this.allowBulkAddAssociatedEntity
    ) {
      return;
    }

    const entityType = this.documentEditForm.get('entityType').value;
    if (entityType === keywordConstants.MyFirm) {
      payload.associated_entities = [
        { id: payload.associated_entities[0], entity_type: 'Firm' },
      ];
    } else {
      payload.associated_entities = this.currentEntityTypeList
        .filter((entity) => payload.associated_entities.includes(entity.id))
        .map((entity) => ({ id: entity.id, entity_type: entityType }));
    }
  }

  private addAsOfDate(payload: any): void {
    if (!payload || !payload.hasOwnProperty('as_of_date')) {
      return;
    }

    payload.as_of_date = this.datePipe.transform(
      payload.as_of_date,
      'yyyy-MM-dd'
    );
  }

  //#endregion
}
