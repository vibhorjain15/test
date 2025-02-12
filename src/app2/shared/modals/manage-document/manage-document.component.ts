import { HttpHeaders } from '@angular/common/http';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import * as moment from 'moment';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { DocumentDataService } from 'src/app2/services/document-data.service';
import { FileHandlerService } from 'src/app2/services/file-handler.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { hierarchyConstants, keywordConstants } from '../../constants/constant';
import { VehicleDataService } from 'src/app2/services/vehicle-data.service';
import { ToastrService } from 'ngx-toastr';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { DatePipe } from '@angular/common';
import { FirmDataService } from 'src/app2/services/firm-data/firm-data.service';
import { FundDataService } from 'src/app2/services/fund-data.service';
import { UserState } from 'src/app2/store/user/user.state';
import { Select } from '@ngxs/store';
import { finalize, take } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { DvValidators } from '../../validators/no-white-space.validator';
import { ModalComponent } from '../../components/modal/modal.component';
import { ColorTheme } from '../../themes/color.themes';

@Component({
  selector: 'app-manage-document',
  templateUrl: './manage-document.component.html',
})
export class ManageDocumentComponent implements OnInit {
  @ViewChild('modal') appModal: ModalComponent;
  @Input() documentOptions: any = {
    mode: 'update',
    source: 'main_menu_new',
    editAccessGranted: true,
  };
  @Input() editMode = false;
  @Input() success: Function;
  @Input() isAngularJs = true;
  @Input() isFile: boolean = true;
  @Input() parentAttachmentHierarchyId = null;
  @Input() selectionPath: Array<string> = ['Documents'];
  @Input() showSelectionPath = true;
  @Input() isEntityIdRequired = true;
  loading = true;
  modalTitle = '';
  sourceType = 'existing';
  hierarchyConstants = hierarchyConstants;
  isManager: any;
  maxAsOfDate = new Date();
  entityId: Array<number> = [];
  showToggleButton = true;
  finishingDocsAssignments = false;
  entityType: any;
  dict: { originalAssigned: {}; unassigned: {}; newAssigned: {} };
  params: any = {};
  files: Array<any> = [];
  attachments: Array<any> = [];
  mode = '';
  firmId: any;
  maxFileSize = this.FileHandlerFactory.getMaxFileSize();
  allowed_file_extensions_str: any;

  editAccessGranted: any;
  document: any;
  source: any;
  showEntityRelatedFields = false;
  editAccess: any;
  uploaded_file: any;
  predefinedDate: any;
  customDateFilter: any = {};
  attachmentTypes = [];
  firms: any;
  strategies: any;
  vehicles: any;
  copyOfAttachments: any;
  keywordConstants = keywordConstants;
  new_document_uploaded: boolean;
  rejectedFiles: any;
  savingDocument: boolean;
  approvingDocument = false;
  funds = [];
  firmLabel = this.Utils.isManager() ? 'Investor' : 'Firm';
  entityTypes: any[] = [
    { id: 'Firm', name: this.firmLabel },
    { id: 'Strategy', name: 'Strategy' },
    { id: 'Fund', name: 'Product' },
    { id: 'Vehicle', name: 'Vehicle' },
  ];

  documentForm: FormGroup;
  existingDocForm: FormGroup;

  @Select(UserState.getFirmPreferenceData) firmPref$: any;
  documentsListLoading = false;
  isDocumentsAssigned = false;
  entitiesLoading = false;
  disabledSaveButton = true;
  uploadMultiple = false;
  dvUploaderLabel = 'Drag & Drop your file here';
  editDocumentCheckbox = true;
  colorTheme = ColorTheme;
  constructor(
    private readonly Utils: UtilsService,
    private readonly FileHandlerFactory: FileHandlerService,
    private readonly firmDataService: FirmDataService,
    private readonly baseDataService: BaseDataService,
    private readonly formBuilder: FormBuilder,
    private readonly documentDataService: DocumentDataService,
    private readonly vehicleDataService: VehicleDataService,
    private readonly toaster: ToastrService,
    private readonly customModalService: CustomModalService,
    private readonly datePipe: DatePipe,
    private readonly FundDataService: FundDataService
  ) {}

  ngOnInit(): void {
    this.initDocumentForm();
    this.initExistingDocForm();
    this.initialize();
    this.setModalTitle(this.documentOptions.mode);
    this.getFirmPref();
    if (!this.isFile) {
      this.sourceType = 'new';
      this.showToggleButton = false;
      this.uploadMultiple = true;
    }
  }

  initExistingDocForm() {
    this.existingDocForm = this.formBuilder.group({
      entityType: new FormControl('Firm', Validators.required),
      entityId: this.isEntityIdRequired
        ? new FormControl([], Validators.required)
        : new FormControl([]),
      searchText: new FormControl(''),
      as_of_date: [null],
    });
  }

  initDocumentForm(documentDetails: any = {}) {
    this.documentForm = this.formBuilder.group({
      entityType: new FormControl(keywordConstants.Firm, Validators.required),
      entityId: this.isEntityIdRequired
        ? new FormControl(
            documentDetails?.entity_id || null,
            Validators.required
          )
        : new FormControl(documentDetails?.entity_id || null),
      searchText: new FormControl(''),
      params: new FormGroup({
        name: new FormControl(documentDetails?.name || '', Validators.required),
        as_of_date: new FormControl(
          documentDetails?.as_of_date
            ? new Date(documentDetails?.as_of_date)
            : null,
          Validators.required
        ),
        entity_id: new FormControl(documentDetails?.entity_id || null),
        tags: new FormControl(null),
      }),
    });
  }

  setModalTitle(type: string) {
    const titleMappings: Record<string, string> = {
      'new-upload': 'Add New Document',
      add: 'Add New Document(s) (Up to 10 files)',
      update_document_tags: 'Update Document Meta Data',
    };
    this.modalTitle =
      titleMappings[type] ||
      `${this.editMode ? 'Edit Document Details' : 'Add Document'}`;
  }

  initialize() {
    this.setUploadType('existing');
    this.mode = this.documentOptions.mode;
    this.isManager = this.Utils.isManager();
    this.firmId = this.Utils.getCurrentFirm().id;

    const allowed_file_extensions = this.FileHandlerFactory.getFileTypes();
    this.maxFileSize = this.FileHandlerFactory.getMaxFileSize();

    this.allowed_file_extensions_str = allowed_file_extensions.join(',');

    this.loading = true;
    const promises = [this.baseDataService.getAttachmentTypes()];
    switch (this.mode) {
      case 'update':
        this.editMode = this.documentOptions.document;
        // we dont't need tp depend on source of modal to set the sourceType,
        // we will use edit mode instead. Id edit mode is true then user can only upload new document
        if (this.editMode) {
          this.showToggleButton = false;
          this.sourceType = 'new';
        }
        // *************************
        this.editAccessGranted = this.documentOptions.editAccessGranted;
        if (this.documentOptions.entityId) {
          this.entityId = [this.documentOptions.entityId];
        }
        this.entityType = this.documentOptions.entityType;
        this.document = this.documentOptions.document;

        if (this.document) {
          this.initDocumentForm(this.document);
        }

        this.source = this.documentOptions.source;

        this.showEntityRelatedFields =
          this.source === 'all_documents' ||
          this.source === 'main_menu_new' ||
          (this.source === 'documentsEditClick' &&
            this.document?.owner_firm_id == this.firmId); // only allow associated entity update for owned documents
        this.entityType = 'Firm';
        this.getFirmsList();

        this.editAccess = this.editAccessGranted ?? true;

        if (this.editMode) {
          const { name, as_of_date, type_id, tags } = this.document;
          this.params = { name, as_of_date, type_id, tags };

          if (this.params.as_of_date != null) {
            this.params.as_of_date = new Date(this.params.as_of_date);
          }

          this.uploaded_file = { name: this.document.file_name };
        }

        // remove validation when only listig documents
        if (!this.showEntityRelatedFields) {
          this.removeValidationWhenOnlyListingDocuments();
        }
        break;
      case 'new-upload':
        this.editMode = this.documentOptions.document ? true : false;
        this.showToggleButton = false;
        this.editAccess = true;
        this.setUploadType('new-upload');
        break;
      case 'add':
        promises.push(this.getSourcesList());
        break;

      case 'update_document_tags':
        this.document = this.documentOptions.document;
        this.params = JSON.parse(JSON.stringify(this.document));

        this.params.as_of_date = new Date(this.params.as_of_date);
        this.params.tag_ids_copy = this.params.tag_ids;
        break;
    }

    forkJoin(promises)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(([attachments]) => {
        this.attachmentTypes = attachments as Array<any>;
        if (this.documentOptions && this.documentOptions.entityType) {
          this.setEntityData(
            [this.documentOptions.entityId],
            this.documentOptions.entityType
          );
        }
        if (this.document?.tags) {
          let result = this.document.tags.filter((o1) =>
            this.attachmentTypes.some((o2) => o1 === o2.id)
          );
          this.documentForm.controls.params.get('tags').setValue(result);
        }
      });
  }

  applyMethod(startDate: any, endDate: any) {
    this.customDateFilter = {
      startDate: moment(startDate),
      endDate: moment(endDate),
      range: this.customDateFilter.range,
    };
    this.getAllDocs(startDate, endDate);
  }

  getFirmPref() {
    this.loading = true;
    this.firmPref$
      .pipe(
        take(2),
        finalize(() => (this.loading = false))
      )
      .subscribe((response: any) => {
        if (response) {
          if (!response.default_daterange_months) {
            return this.getAllDocs(null, null);
          }
          this.predefinedDate = this.Utils.getPredefinedDateRanges(
            response.default_daterange_months
          );
          this.predefinedDate.selectedRange =
            this.Utils.getDateRanges()[
              response.default_daterange_months
            ]?.label;
          this.customDateFilter.selectedRange = this.Utils.getDateRanges().find(
            (val) => `${val.value}` === `${response.default_daterange_months}`
          ).label;
          this.customDateFilter = {
            startDate: this.Utils.formatDatetime(this.predefinedDate.startDate),
            endDate: this.Utils.formatDatetime(this.predefinedDate.endDate),
            range: response?.default_daterange_months ?? 'null',
          };
          this.existingDocForm
            .get('as_of_date')
            .setValue(this.customDateFilter);
          if (!(this.mode === 'update' && this.editMode)) {
            if (
              this.customDateFilter.selectedRange === 'No Filter' ||
              this.customDateFilter.range === 'null'
            ) {
              this.getAllDocs(null, null);
            } else {
              this.getAllDocs(
                this.Utils.formatDatetime(this.customDateFilter.startDate),
                this.Utils.formatDatetime(this.customDateFilter.endDate)
              );
            }
          }
        }
      });
  }

  getFirmsList() {
    this.entitiesLoading = true;
    this.firmDataService.getFirms(
      { skip_pagination: true },
      (res) => {
        if (!this.isManager) {
          const myFormOption = {
            id: this.firmId,
            display_name: 'My Firm',
          };
          res.unshift(myFormOption);
        }
        this.firms = res;
        this.entitiesLoading = false;
      },
      () => {
        this.entitiesLoading = false;
      }
    );
  }

  getAllStrategies() {
    const params = {
      include_contacts: false,
      include_custom_fields: false,
      include_dates: true,
      is_active: true,
      filters: {},
      search_for: this.hierarchyConstants.Strategy,
    };
    this.documentDataService
      .getFunds(params)
      .pipe(finalize(() => (this.entitiesLoading = false)))
      .subscribe((response: { data: any }) => {
        this.strategies = JSON.parse(JSON.stringify(response.data));
      });
  }

  getVehicles() {
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
      .subscribe((response: any) => (this.vehicles = response.data));
  }

  setEntityData(entity_id: any, entity_type: any) {
    const entityIdValue = entity_id.length ? entity_id : null;
    this.documentForm.get('entityId').setValue(entityIdValue);
    this.entityId = entity_id;
    this.entityType = entity_type;
    if (entity_id.length) {
      this.documentForm.get('entityId').setValue(entity_id.length);
    } else {
      this.documentForm.get('entityId').setValue(null);
    }
  }

  getAllDocs(start_date: any, end_date: any) {
    this.documentsListLoading = true;
    let params: any = {
      sort_by: 'as_of_date',
      sort_direction: 'Ascending',
    };
    if (start_date && end_date) {
      params = {
        ...params,
        start_date,
        end_date,
      };
    }
    this.documentDataService
      .getDocuments(params)
      .pipe(finalize(() => (this.documentsListLoading = false)))
      .subscribe((response: any) => {
        this.attachments = response.filter(
          (attachment: any) => attachment.owner_firm_id === this.firmId
        );

        this.copyOfAttachments = JSON.parse(JSON.stringify(this.attachments));
        this.filterByAssociatedEntity(this.entityId);
      });
  }

  setUploadType(type: string) {
    this.sourceType = type;
    this.existingDocForm.get('searchText').setValue('');
    this.existingDocForm.get('searchText').markAsUntouched();
    if (type === 'new') {
      // resetting form state on tab change
      this.resetDocumentForm();
    }
  }

  resetDocumentForm() {
    const selectedEntityType = this.documentForm.get('entityType').value;
    this.documentForm.reset();
    this.documentForm.get('entityType').setValue(selectedEntityType);
    if (this.showEntityRelatedFields) {
      this.existingDocForm.get('entityId').setValue(null);
      this.existingDocForm.get('entityId').updateValueAndValidity();
      this.existingDocForm.get('entityId').markAsUntouched();
    } else {
      // do not reset if modal opened from the dv-documents component
      // on UI not showing the entity id selection dropdown
      this.documentForm.get('entityId').setValue(this.entityId);
    }
    this.files = [];
    this.uploadMultiple = false;
    this.uploaded_file = null;
  }

  uploadAttachment(files: File[]) {
    if (!this.uploadMultiple) this.files = [];
    this.files.push(...files);
    this.setDocumentName();
  }

  deleteFile(index) {
    const deletedFile: any = this.files.splice(index, 1);
    if (deletedFile[0].name === this.documentForm.value.params.name) {
      // removing file name if file name is same as deleted document file name
      this.documentForm.get('params').patchValue({
        name: '',
      });
    }
    this.setDocumentName();
  }

  /* Refactor this function - This should be the entry point for the form submission function.
      Based of the mode, preprocess params and call appropriate submit function */
  submit() {
    switch (this.mode) {
      case 'update':
      case 'new-upload':
        return this.updateDocumentSubmit();
      case 'add':
        return this.addDocumentSubmit();
      case 'update_document_tags':
        return this.updateDocumentTagSubmit();
    }
  }

  async updateDocumentSubmit() {
    if (!this.documentForm.valid) return;
    const finalizeOpt = () => {
      this.savingDocument = false;
    };
    if (this.editMode) {
      if (
        !(this.rejectedFiles != null ? this.rejectedFiles.length : undefined) &&
        this.uploaded_file != null
      ) {
        this.savingDocument = true;

        const id = this.document.attachment_id
          ? this.document.attachment_id
          : this.document.id;
        const header = this.getAttachmentHeaders();
        const formData: FormData = this.getFormData(); // Add remaining params after this.
        const apiCalls = [
          this.documentDataService.updateDocumentV2(id, formData, header),
        ];

        // Check if entity_ids assignment needs to be done
        const formValues = this.documentForm.getRawValue();
        if (
          formValues.entityType &&
          formValues.entityId &&
          Array.isArray(formValues.entityId) &&
          formValues.entityId.length
        ) {
          const params = {
            firm_ids: [],
            unassigned: [],
            newassigned: [id],
            entity_type: formValues.entityType,
            entity_ids: formValues.entityId,
          };
          apiCalls.push(this.documentDataService.assignBulkDocuments(params));
        }

        if (this.files.length) {
          formData.append(`file`, this.files[0]);
        }

        forkJoin(apiCalls)
          .pipe(finalize(finalizeOpt))
          .subscribe((response) => {
            this.toaster.success('Document successfully updated');
            this.handleSuccess(response);
            this.customModalService.close();
          });
      }
    } else {
      // check files not selected or multiple files selected but not multiple option
      let invalidFilesErrorMessage = !this.files?.length
        ? `Please select a file`
        : !this.uploadMultiple && this.files.length > 1
        ? `Please select only one file or enable multiple upload`
        : null;
      if (invalidFilesErrorMessage) {
        this.toaster.error(invalidFilesErrorMessage);
        return;
      }

      this.savingDocument = true;

      let attachmentPayloads: any[] = [];

      if (this.isFile) {
        // const headers = this.getAttachmentHeaders();
        for (let index = 0; index < this.files.length; index++) {
          const formData: FormData = this.getFormData();
          formData.append(`file[${index}]`, this.files[index]);
          formData.append(
            'parent_attachment_hierarchy_id',
            this.parentAttachmentHierarchyId?.toString() ?? null
          );
          if (this.uploadMultiple) {
            formData.delete(`name`);
            formData.append(`name`, this.files[index].name);
          }
          attachmentPayloads.push(
            this.documentDataService.saveAttachmentWithFolder(formData)
          );
        }
      } else {
        attachmentPayloads = await this.saveAttachments();
      }
      forkJoin(attachmentPayloads)
        .pipe(finalize(finalizeOpt))
        .subscribe((attachmentResponse: any[]) => {
          const bulkInvitePayload = [];
          const attachmentId = [];
          attachmentResponse.forEach((response) => {
            response.forEach((x: any) => {
              attachmentId.push(x.id);
            });
          });
          this.finishingDocsAssignments = true;
          const params = {
            unassigned: Object.keys(this.dict?.unassigned || {}),
            newassigned: attachmentId,
            entity_type: this.entityType,
            Entity_ids: this.entityId,
            firm_ids: [],
          };
          bulkInvitePayload.push(params);
          this.documentUploadCompleteBulk(params);
        });
    }
  }

  async saveAttachments() {
    const observables = [];
    let folders: any = [];
    let paths = this.files.map((file: any) => file.relativePath);
    folders = await this.documentDataService
      .createFolders({
        paths,
        base_attachment_hierarchy_id: this.parentAttachmentHierarchyId,
      })
      .toPromise();
    this.files.forEach((file: any, index: number) => {
      // const payload = this.getPayload();
      const tags = JSON.stringify(this.documentForm.value.params.tags);
      const date = this.datePipe.transform(
        this.documentForm.value.params.as_of_date,
        'yyyy-MM-dd'
      );
      const payload = new FormData();
      payload.append('tags', tags);
      payload.append('As_of_date', date);
      payload.append(`file`, file);
      payload.append('name', file.name);
      let folderPath = file.relativePath.split('/').slice(0, -1).join('/');
      let parentAttachmentHierarchyId =
        this.parentAttachmentHierarchyId ?? null;
      if (folderPath) {
        parentAttachmentHierarchyId =
          folders.find((folder) => folder.path == folderPath)?.id ?? null;
      }
      payload.append(
        'parent_attachment_hierarchy_id',
        parentAttachmentHierarchyId?.toString() ?? null
      );

      observables.push(
        this.documentDataService.saveAttachmentWithFolder(payload)
      );
    });
    return observables;
  }

  getPayload() {
    let payload: any = {};
    const date = this.datePipe.transform(
      this.documentForm.value.params.as_of_date,
      'MM-dd-yyyy'
    );
    payload.tags = JSON.stringify(this.documentForm.value.params.tags);
    payload.as_of_date = date;
    payload.name = this.documentForm.value.params.name;
    return payload;
  }

  getAttachmentHeaders() {
    const headers = new HttpHeaders();
    headers.set('Content-Type', null);
    headers.set('Accept', 'multipart/form-data');
    return headers;
  }

  getFormData() {
    const formData: FormData = new FormData();
    const payload = this.getPayload();
    Object.entries(payload).forEach(([key, value]) => {
      formData.append(key, value as string);
    });

    return formData;
  }

  closeModal(reason = null) {
    if (!this.isAngularJs) this.customModalService.close();
    else this.appModal.closeModal();
    if (reason) this.handleSuccess(reason);
  }

  documentUploadCompleteBulk(params: any) {
    this.savingDocument = true;
    this.documentDataService
      .assignBulkDocuments(params)
      .pipe(
        finalize(() => {
          this.savingDocument = false;
        })
      )
      .subscribe(
        () => {
          this.toaster.success('Document(s) assignments saved');
          this.savingDocument = false;
          this.finishingDocsAssignments = false;
          this.closeModal('refresh');
        },
        (error: { status: any }) => {
          const avoid_error_logging_statuses =
            this.baseDataService.getAvoidErrorLoggingStatusList();
          this.savingDocument = false;
          if (
            !Array.from(avoid_error_logging_statuses).includes(error.status)
          ) {
            this.Utils.logError('Documents bulk assignment failed', error);
          }
        }
      );
  }

  removeAttachment(attachment: { assigned: boolean; id: string | number }) {
    attachment.assigned = false;
    if (this.dict.originalAssigned.hasOwnProperty(attachment.id)) {
      this.dict.unassigned[attachment.id] = attachment.id;
      return;
    }

    if (this.dict.newAssigned.hasOwnProperty(attachment.id)) {
      delete this.dict.newAssigned[attachment.id];
    }

    this.disabledSaveButton =
      Object.keys(this.dict.newAssigned).length === 0 &&
      Object.keys(this.dict.unassigned).length === 0;
  }

  assignAttachment(attachment: any) {
    if (!this.entityId && !this.entityType) return;

    // remove key from unassigned if exist
    if (this.dict.unassigned.hasOwnProperty(attachment.id)) {
      delete this.dict.unassigned[attachment.id];
    }

    // remove key from new assigned if exist
    if (this.dict.newAssigned.hasOwnProperty(attachment.id)) {
      delete this.dict.newAssigned[attachment.id];
    }

    if (this.dict.originalAssigned.hasOwnProperty(attachment.id)) {
      attachment.assigned = true;
      // check if the state is back to where it started
      return;
    }

    if (
      !this.dict.newAssigned.hasOwnProperty(attachment.id) &&
      !this.dict.unassigned.hasOwnProperty(attachment.id) &&
      !this.dict.originalAssigned.hasOwnProperty(attachment.id)
    ) {
      attachment.assigned = true;
      this.dict.newAssigned[attachment.id] = attachment.id;
      this.disabledSaveButton = false;
    }
  }

  getAttachments(id: any, type: any) {
    if (id.length) {
      this.existingDocForm.get('entityId').setValue(id);
    } else {
      this.existingDocForm.get('entityId').setValue(null);
    }
    this.entityId = id;
    this.entityType = type;
    if (this.customDateFilter?.selectedRange === 'No Filter') {
      this.getAllDocs(null, null);
    } else if (
      this.customDateFilter?.startDate &&
      this.customDateFilter?.endDate
    ) {
      this.getAllDocs(
        this.Utils.formatDatetime(this.customDateFilter.startDate),
        this.Utils.formatDatetime(this.customDateFilter.endDate)
      );
    }
  }

  filterByAssociatedEntity(entityId: any) {
    this.entityId = entityId;
    const typeOfEntity = this.entityType?.toUpperCase();
    this.dict = {
      originalAssigned: {},
      unassigned: {},
      newAssigned: {},
    };

    const entityRelationMap = {
      FUND: `associated_funds`,
      FIRM: `associated_firms`,
      DUEDILIGENCE: `associated_duediligences`,
      MEETING: `associated_meetings`,
    };

    this.attachments.forEach((attachment: any) => {
      attachment.assigned = false;
      if (
        this.entityId.some((value) =>
          attachment[entityRelationMap[typeOfEntity]]?.includes(value)
        )
      ) {
        this.dict.newAssigned[attachment.id] = attachment.id;
        attachment.assigned = true;
        attachment.allReadyAssigned = true;
      }
    });
    this.disabledSaveButton = true;
  }

  finishAssignDocuments() {
    if (
      Object.keys(this.dict.unassigned).length > 0 ||
      Object.keys(this.dict.newAssigned).length > 0
    ) {
      this.finishingDocsAssignments = true;
      const params = {
        unassigned: Object.keys(this.dict.unassigned),
        newassigned: Object.keys(this.dict.newAssigned),
        entity_type: this.entityType,
        Entity_ids: this.entityId,
        firm_ids: [],
      };
      this.savingDocument = true;
      this.documentDataService
        .assignBulkDocuments(params)
        .pipe(finalize(() => (this.savingDocument = false)))
        .subscribe(
          () => {
            this.toaster.success('Document(s) assignments saved');
            this.finishingDocsAssignments = false;
            this.handleSuccess('refresh');
            this.closeModal();
          },
          (error: { status: any }) => {
            const avoid_error_logging_statuses =
              this.baseDataService.getAvoidErrorLoggingStatusList();
            this.finishingDocsAssignments = false;
            if (
              !Array.from(avoid_error_logging_statuses).includes(error.status)
            ) {
              this.Utils.logError('Documents bulk assignment failed', error);
            }
          }
        );
    } else {
      this.toaster.error('', 'Please select atleast one document');
    }
  }

  getSourcesList() {
    return this.documentDataService.getSources();
  }

  addDocumentSubmit() {
    if (!this.documentForm.valid) return;

    if (!this.files?.length)
      return this.toaster.error('Please select at least one file');

    this.savingDocument = true;

    const file_handler1 = this.FileHandlerFactory.get('file-handler-one');
    const file_handler2 = this.FileHandlerFactory.get('file-handler-two');
    let selected_file_handler: any = {};

    [file_handler1, file_handler2].forEach((handler: { files?: any }) => {
      if (
        handler !== undefined &&
        handler.files !== undefined &&
        handler.files.length > 0 &&
        handler.files[0].name === this.files[0].name
      ) {
        return (selected_file_handler = handler);
      }
    });
    return selected_file_handler.upload();
  }

  getFunds() {
    this.FundDataService.getFunds()
      .pipe(finalize(() => (this.entitiesLoading = false)))
      .subscribe((response: any) => {
        this.funds = response.data;
      });
  }

  updateDocumentTagSubmit() {
    if (!this.documentForm.valid) return;

    this.params.tag_ids = [];
    this.params.tag_ids_copy.forEach((tag: { value: any }) => {
      return this.params.tag_ids.push(tag.value);
    });

    this.savingDocument = true;
    this.documentDataService
      .updateDocumentTags(this.document.id, this.params)
      .pipe(finalize(() => (this.savingDocument = false)))
      .subscribe(() => {
        this.toaster.success('Document tags successfully updated');
        this.closeModal('refresh');
      });
  }

  onChange(dateRangeValue: any) {
    if (dateRangeValue.startDate && dateRangeValue.endDate) {
      this.applyMethod(dateRangeValue.startDate, dateRangeValue.endDate);
    }
  }

  onClearDateFilter() {
    this.getAllDocs(null, null);
  }

  entityTypeChange() {
    this.existingDocForm.controls.entityId.setValue([]);
  }

  asOfDateChange(selectedDate: Date) {
    if (selectedDate)
      this.documentForm.controls.params
        .get('as_of_date')
        .setValue(selectedDate);
  }

  clearEntityId(dvDropDownEvent: string) {
    this.existingDocForm.controls.entityId.setValue([]);
    this.existingDocForm.controls.entityId.markAsPristine();
    this.existingDocForm.controls.entityId.markAsUntouched();
    this.entityId = [];
    this.attachments.forEach((x) => (x.assigned = false));
    this.getEntities(dvDropDownEvent);
  }

  clearDocumentFormEntityId(dvDropDownEvent) {
    this.documentForm.controls.entityId.setValue([]);
    this.documentForm.controls.entityId.markAsPristine();
    this.documentForm.controls.entityId.markAsUntouched();
    this.entityId = [];
    this.attachments.forEach((x) => (x.assigned = false));
    this.getEntities(dvDropDownEvent);
  }

  removeValidationWhenOnlyListingDocuments() {
    if (this.existingDocForm) {
      Object.keys(this.existingDocForm?.controls || {}).forEach((key) => {
        this.existingDocForm.get(key).setValidators(null);
        this.existingDocForm.get(key).setErrors(null);
      });
    }
    this.existingDocForm.updateValueAndValidity();
  }

  clearSearchText() {
    this.existingDocForm.controls.searchText.setValue('');
  }

  // get entities after changing entity type
  getEntities(type: string) {
    this.entitiesLoading = true;
    if (type === this.keywordConstants.Product) {
      this.getFunds();
    } else if (type === this.keywordConstants.Vehicle) {
      this.getVehicles();
    } else if (type === this.keywordConstants.Strategy) {
      this.getAllStrategies();
    } else {
      this.entitiesLoading = false;
    }
  }

  toggleNameControl(dvCheckBoxEvent: boolean) {
    this.uploadMultiple = dvCheckBoxEvent;
    if (!dvCheckBoxEvent) {
      const file = this.files[0];
      if (file) {
        this.documentForm.controls.params.get('name').setValue(file.name);
      }
      this.documentForm.controls.params
        .get('name')
        .setValidators([DvValidators.required]);
    }
    this.dvUploaderLabel = `Drag & Drop your ${
      dvCheckBoxEvent ? 'documents' : 'document'
    } here`;
  }

  handleSuccess(response: any = '') {
    if (this.success) this.success(response);
  }

  /**
   * Setting up file name if not present in form value
   */
  setDocumentName() {
    const existingFile: any = this.files[0];
    const fileNameControl = this.documentForm.get('params').get('name');
    if (existingFile && !fileNameControl.value)
      fileNameControl.setValue(existingFile.name);
    fileNameControl.setValidators([DvValidators.required]);
  }
}
