import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { ColorTheme } from '../../themes/color.themes';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { UtilsService } from 'src/app2/services/utils.service';
import { keywordConstants, Regex } from '../../constants/constant';
import { DatePipe } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { DocumentDataService } from 'src/app2/services/document-data.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { VehicleDataService } from 'src/app2/services/vehicle-data.service';
import { FundDataService } from 'src/app2/services/fund-data.service';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { FirmDataService } from 'src/app2/services/firm-data.service';
import { forkJoin } from 'rxjs';
import { CurrentUserModel } from 'src/app2/store/user/user.model';
import { GridFolderManagementService } from 'src/app2/services/grid-folder-management.service';
import { ModalComponent } from '../../components/modal/modal.component';

@Component({
  selector: 'upload-document-folder',
  templateUrl: './upload-document-folder.component.html',
  styleUrls: ['./upload-document-folder.component.css'],
})

/* This modal will handle
    1. Folder add
    2. File add
    3. Single file edit
  */
export class UploadDocumentFolderComponent implements OnInit {
  @ViewChild('modal') appModal: ModalComponent;
  @Input() uploadType: 'folder' | 'file' = 'folder';
  @Input() flow: 'add' | 'edit' = 'add';
  @Input() isQuestionnaireUpload: boolean = false;
  @Input() entity_id;
  @Input() entity_type;
  @Input() defaultSelectionPath: Array<string>;
  @Input() documents;
  @Input() parentAttachmentHierarchyId;
  @Input() success: Function;
  @Input() isAngularJs: boolean = false;
  @Input() showUploadTypeToggler: boolean = false;
  @Input() selectedFolderId: number = null; // default selection id for root folder.
  @ViewChild('folderPathInputElement', { read: ElementRef })
  folderPathInputElement: ElementRef<HTMLInputElement>;
  modalTitle: string = 'Upload Folder';
  colorTheme = ColorTheme;
  selectionPath;
  isManager = this.Utils.isManager();
  uploadFolderForm: FormGroup;
  selectedEntityList: any[] = [];
  entitiesLoading;
  currentEntityTypeList;
  entityTypes: any[] = [
    { id: 'Strategy', name: 'Strategy' },
    { id: 'Fund', name: 'Product' },
    { id: 'Vehicle', name: 'Vehicle' },
  ];
  strategies;
  uploadMultiple;
  products;
  vehicles;
  firms;
  tagList = [];
  new_document_uploaded;
  dvUploaderLabel;
  folderMapper = {};
  files = [];
  savingDocument;
  finishingDocsAssignments;
  currentUser: CurrentUserModel;
  keyWordConstants = keywordConstants;
  folderViewToggle;
  parentFolderId: number;
  folderSearch;

  // Helper text
  visibleHelperText: string = '';
  hiddenHelperText: string = '';
  maxAsOfDate = new Date();
  finalizeOpt = () => {
    this.savingDocument = false;
  };
  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly Utils: UtilsService,
    private readonly documentDataService: DocumentDataService,
    private readonly vehicleDataService: VehicleDataService,
    private readonly toaster: ToastrService,
    private readonly customModalService: CustomModalService,
    private readonly datePipe: DatePipe,
    private readonly FundDataService: FundDataService,
    private readonly firmDataService: FirmDataService,
    private readonly baseDataService: BaseDataService,
    private readonly gridFolderService: GridFolderManagementService,
  ) {}

  ngOnInit(): void {
    if (this.isManager) {
      this.entityTypes.unshift(
        { id: 'Myfirm', name: 'My Firm' },
        { id: 'Firm', name: 'Investor' }
      );
    } else {
      this.entityTypes.unshift({ id: 'Firm', name: 'Firm' });
    }

    if (!this.defaultSelectionPath?.length)
      this.defaultSelectionPath = ['Documents'];
    this.selectionPath = [...this.defaultSelectionPath];
    this.setTitleAndLabel();
    this.currentUser = this.Utils.getCurrentUser();

    this.getDocumentTags();
    this.formInit();
    this.setHelperText();
  }

  setTitleAndLabel(): void {
    this.dvUploaderLabel = `Drag & Drop your ${
      this.uploadType === 'file' ? 'documents(s)' : 'folder(s)'
    } here`;
    this.uploadMultiple = this.uploadType === 'folder';

    if (this.showUploadTypeToggler) this.modalTitle = 'Upload New';
    else if (this.uploadType === 'file' && this.flow === 'add')
      this.modalTitle = 'Upload Document';
    else if (this.uploadType === 'file' && this.flow === 'edit')
      this.modalTitle = 'Edit Document';
  }

  formInit() {
    if (this.flow === 'add' && !this.isQuestionnaireUpload) {
      this.uploadFolderForm = this.formBuilder.group({
        entityType: new FormControl(this.entity_type, Validators.required),
        entityId: new FormControl(
          this.entity_id ? [this.entity_id] : null,
          Validators.required
        ),
        tags: new FormControl([]),
        as_of_date: new FormControl(new Date(), Validators.required),
        folder_location: new FormControl(
          this.selectionPath?.length > 1
            ? '/' + this.selectionPath.slice(1).join('/')
            : null
        ),
        folders: new FormControl([], Validators.required),
        file_name: new FormControl(
          '',
          this.uploadType === 'file'
            ? [
                Validators.required,
                Validators.pattern(Regex.validName),
                Validators.maxLength(255),
              ]
            : []
        ),
      });
    } else if (this.flow === 'add' && this.isQuestionnaireUpload) {
      this.uploadFolderForm = this.formBuilder.group({
        tags: new FormControl([]),
        as_of_date: new FormControl(new Date(), Validators.required),
        folder_location: new FormControl(
          this.selectionPath?.length > 1
            ? '/' + this.selectionPath.slice(1).join('/')
            : null
        ),
        folders: new FormControl([], Validators.required),
        file_name: new FormControl(
          '',
          this.uploadType === 'file'
            ? [
                Validators.required,
                Validators.pattern(Regex.validName),
                Validators.maxLength(255),
              ]
            : []
        ),
      });
    }
  }

  handleViewChange(uploadType: 'file' | 'folder'): void {
    this.uploadType = uploadType;
    const formValues = this.uploadFolderForm.getRawValue();
    this.setTitleAndLabel();
    this.formInit();

    // Set the required form values again after the form init
    this.uploadFolderForm
      .get('folder_location')
      .setValue(formValues.folder_location);
  }

  onEntityTypeChange(entityType) {
    this.uploadFolderForm.patchValue({
      entityId: [],
    });
    if (entityType === keywordConstants.Product) {
      if (!this.products?.length) this.getFunds();
      this.currentEntityTypeList = this.products;
    } else if (entityType === keywordConstants.Vehicle) {
      if (!this.vehicles?.length) this.getVehicles();
      this.currentEntityTypeList = this.vehicles;
    } else if (entityType === keywordConstants.Strategy) {
      if (!this.strategies?.length) this.getAllStrategies();
      this.currentEntityTypeList = this.strategies;
    } else if (entityType === keywordConstants.Firm) {
      if (!this.firms?.length) this.getFirmsList();
      this.currentEntityTypeList = this.firms;
    } else if (entityType === keywordConstants.MyFirm) {
      this.uploadFolderForm.patchValue({
        entityId: [this.currentUser.firmInfo.id],
      });
    } else {
      this.entitiesLoading = false;
    }
  }

  getFirmsList() {
    let params = {
      filters: {},
      include_contacts: false,
      include_custom_fields: false,
      include_dates: false,
      is_active: true,
    };
    this.firmDataService.getFirms(params).subscribe((res: any) => {
      if (!this.isManager) {
        const myFirmOption = {
          id: this.currentUser.firmInfo.id,
          display_name: 'My Firm',
        };
        res.data.unshift(myFirmOption);
      }
      this.firms = res.data;
      this.currentEntityTypeList = this.firms;
      this.entitiesLoading = false;
    });
  }

  getAllStrategies() {
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
        this.strategies = JSON.parse(JSON.stringify(response.data));
        this.currentEntityTypeList = this.strategies;
      });
  }

  getFunds() {
    this.FundDataService.getFunds()
      .pipe(finalize(() => (this.entitiesLoading = false)))
      .subscribe((response: any) => {
        this.products = response.data;
        this.currentEntityTypeList = this.products;
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
      .subscribe((response: any) => {
        this.vehicles = response.data;
        this.currentEntityTypeList = this.vehicles;
      });
  }

  getDocumentTags() {
    this.baseDataService
      .getAttachmentTypes()
      .subscribe((tags: any[]) => (this.tagList = tags));
  }

  toggleNameControl(value) {
    if (value) this.uploadFolderForm.get('file_name').clearValidators();
    else if (!value && this.uploadType === 'file')
      this.uploadFolderForm
        .get('file_name')
        .setValidators([
          Validators.required,
          Validators.pattern(Regex.validName),
          Validators.maxLength(255),
        ]);
    this.uploadFolderForm.get('file_name').updateValueAndValidity();
  }

  asOfDateChange(date) {
    this.uploadFolderForm.patchValue({
      as_of_date: date,
    });
  }

  handleOnFileDrop(files: any[]) {
    this.new_document_uploaded = true;

    if (this.uploadMultiple && this.uploadType === 'folder') {
      this.files.push(
        ...files.filter(
          (file) =>
            !this.files.some((item) => item.relativePath == file.relativePath)
        )
      );
      let folderMapper = {};
      this.files.forEach((file) => {
        file.parentFolderName = file.relativePath.split('/')[0];
        if (!folderMapper[file.parentFolderName])
          folderMapper[file.parentFolderName] = [];
        folderMapper[file.parentFolderName].push(file);
      });
      this.folderMapper = folderMapper;
    } else {
      this.files = this.uploadMultiple
        ? this.files.concat(files)
        : (this.files = files);
    }

    if (
      !this.uploadMultiple &&
      this.uploadType === 'file' &&
      !this.uploadFolderForm.get('file_name').value
    ) {
      this.uploadFolderForm.patchValue({
        file_name: this.files[0].name,
      });
    }

    if (files && files?.length) {
      this.uploadFolderForm.patchValue({
        folders: files,
      });
    }
  }

  deleteFile(index, isFolder) {
    if (isFolder) {
      delete this.folderMapper[index];
      this.files = this.files.filter((file) => file.parentFolderName !== index);
    } else {
      if (!this.uploadMultiple) {
        if (
          this.files[index].name ===
          this.uploadFolderForm.get('file_name').value
        )
          this.uploadFolderForm.patchValue({
            file_name: null,
          });
      }
      this.files.splice(index, 1);
    }
    this.uploadFolderForm.patchValue({
      folders: this.files,
    });
  }

  submit() {
    if (this.uploadType === 'folder' && this.flow === 'add')
      this.uploadFolder();
    else if (this.uploadType === 'file' && this.flow === 'add')
      this.uploadFile();
  }

  async uploadFolder() {
    if (!this.uploadFolderForm.valid) return;

    let attachmentPayloads: any[] = [];

    attachmentPayloads = await this.saveAttachments();
    if (attachmentPayloads) this.savingDocument = true;
    this.documentUploadCompleteBulk(attachmentPayloads);
  }

  // Saving all the files in the folder
  async saveAttachments() {
    const observables = [];
    let folders: any = [];
    let paths = this.files.map((file: any) => file.relativePath);
    let params: any = {
      paths,
      base_attachment_hierarchy_id: this.parentAttachmentHierarchyId,
      document_folder_type: 1,
    };
    if (this.entity_type && this.entity_id) {
      params = {
        ...params,
        entity_type: this.entity_type,
        entity_id: this.entity_id,
      };
    }
    folders = await this.documentDataService.createFolders(params).toPromise();
    this.files.forEach((file: any, index: number) => {
      const tags = JSON.stringify(this.uploadFolderForm.get('tags').value);
      const date = this.datePipe.transform(
        this.uploadFolderForm.get('as_of_date').value,
        'MM-dd-YYYY'
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

  // Function to associate an document with 1 or multiple entities
  documentEntityAssociate(params: any) {
    this.documentDataService
      .assignBulkDocuments(params)
      .pipe(finalize(() => {}))
      .subscribe(
        () => {
          this.closeModal();
          this.savingDocument = false;
          this.toaster.success('Document(s) uploaded successfully');
          this.handleSuccess('refresh');
          this.finishingDocsAssignments = false;
        },
        (error: { status: any }) => {
          this.savingDocument = false;
          const avoid_error_logging_statuses =
            this.baseDataService.getAvoidErrorLoggingStatusList();
          if (
            !Array.from(avoid_error_logging_statuses).includes(error.status)
          ) {
            this.Utils.logError('Documents bulk assignment failed', error);
          }
        }
      );
  }

  // Function to upload files to the grid
  uploadFile() {
    if (!this.uploadFolderForm.valid) return;
    this.savingDocument = true;
    let attachmentPayloads: any[] = [];
    for (let index = 0; index < this.files.length; index++) {
      const formData: FormData = this.getFormData(index);
      formData.append(`file`, this.files[index]);
      formData.append(
        'parent_attachment_hierarchy_id',
        this.parentAttachmentHierarchyId?.toString() ?? null
      );
      attachmentPayloads.push(
        this.documentDataService.saveAttachmentWithFolder(formData)
      );
    }

    this.documentUploadCompleteBulk(attachmentPayloads);
  }

  getFormData(index) {
    const formData: FormData = new FormData();
    const payload = this.getPayload(index);
    Object.entries(payload).forEach(([key, value]) => {
      formData.append(key, value as string);
    });

    return formData;
  }

  getPayload(index) {
    let payload: any = {};
    const date = this.datePipe.transform(
      this.uploadFolderForm.get('as_of_date').value,
      'MM-dd-yyyy'
    );
    payload.tags = JSON.stringify(this.uploadFolderForm.get('tags').value);
    payload.as_of_date = date;
    payload.name = this.uploadMultiple
      ? this.files[index].name
      : this.uploadFolderForm.get('file_name').value;
    return payload;
  }

  // Function to upload the attachments and get their ids
  documentUploadCompleteBulk(attachmentPayloads) {
    forkJoin(attachmentPayloads).subscribe(
      (attachmentResponse: any[]) => {
        if (!this.isQuestionnaireUpload) {
          const bulkInvitePayload = [];
          const attachmentId = [];
          attachmentResponse.forEach((response) => {
            response.forEach((x: any) => {
              attachmentId.push(x.id);
            });
          });
          this.finishingDocsAssignments = true;
          const params = {
            unassigned: Object.keys({}),
            newassigned: attachmentId,
            entity_type:
              this.uploadFolderForm.get('entityType').value ===
              keywordConstants.MyFirm
                ? 'Firm'
                : this.uploadFolderForm.get('entityType').value,
            Entity_ids: this.uploadFolderForm.get('entityId').value,
          };
          bulkInvitePayload.push(params);
          this.documentEntityAssociate(params);
        } else {
          let attachments = [];
          attachmentResponse.forEach((attach) => {
            attach.forEach((file) => attachments.push(file));
          });
          this.success(attachments);
          this.closeModal();
          this.savingDocument = false;
        }
      },
      (err) => {
        this.savingDocument = false;
      }
    );
  }

  updatePath(params: any): void {
    this.defaultSelectionPath = ['Documents'];
    if (params) {
      const path = params[0]?.data?.path || [];
      this.selectedFolderId = params[0]?.data?.id;
      this.selectionPath = this.gridFolderService.getCurrentFolderPath(
        this.documents,
        path,
        this.defaultSelectionPath
      );
      this.parentAttachmentHierarchyId = path[path?.length - 1];
    } else {
      // root folder selection
      this.selectedFolderId = null;
      this.parentAttachmentHierarchyId = null;
      this.selectionPath = [...this.defaultSelectionPath];
    }

    this.uploadFolderForm.patchValue({
      folder_location:
        this.selectionPath?.length > 1
          ? this.gridFolderService.getTextToRenderOnOverflow(
              this.folderPathInputElement,
              '/' + this.selectionPath.slice(1).join('/')
            )
          : null,
    });
  }

  updateRowData(data) {
    this.documents = data;
  }

  onFolderViewToggle() {
    this.folderViewToggle = !this.folderViewToggle;
    this.appModal.setModalSizeClass(
      !this.folderViewToggle ? 'modal-lg' : 'modal-xl'
    );
  }

  handleSuccess(response: any = '') {
    if (this.success) this.success(response);
  }

  closeModal(reason = null) {
    !this.isAngularJs
      ? this.customModalService.close()
      : this.appModal.closeModal();
    if (reason) {
      this.handleSuccess(reason);
    }
  }

  private setHelperText(): void {
    let visibleHelperText =
      'As of Date and Document Type will only apply to the documents within the folders. Uploads are permitted for documents with the following extensions:';
    if (!this.entity_id) {
      visibleHelperText = 'The Entity Association, ' + visibleHelperText;
    }

    let hiddenHelperText =
      ' .pdf, .doc, .docx, .jpg, .png, .jpeg, .xls, .xlsm, .xlsx, .odt, .csv, .vsd, .vsdx, .pptx, .ppt, .pps, .ppsx, .key, .msg, .eml, .zip, .rar, .txt';
    if (this.entity_type === 'DueDiligence') {
      hiddenHelperText =
        hiddenHelperText +
        `<div class="space-on-top">
          Note: File(s) within the uploaded folders will be extracted and added to this project's documents tab.
        </div>`;
    }

    this.visibleHelperText = visibleHelperText;
    this.hiddenHelperText = hiddenHelperText;
  }
}
