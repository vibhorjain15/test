import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { GridFolderManagementService } from 'src/app2/services/grid-folder-management.service';
import { ColorTheme } from '../../themes/color.themes';
import { ICellRendererParams } from 'ag-grid-community';
import { ErrorStatusCode } from '../../constants/constant';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';

@Component({
  selector: 'create-document',
  templateUrl: './create-document.component.html',
  styleUrls: ['./create-document.component.css'],
})
export class CreateDocumentComponent implements OnInit {
  @Input() last_parent_folder: string;
  @Input() document_folder_type;
  @Input() is_file_path = false;
  @Input() documents;
  @Input() success;
  @Input() defaultSelectionPath: Array<string>;
  @Input() mode: 'new' | 'edit' = 'new';
  @Input() existingFolder; // used in edit flow to show name and path of the folder
  @Input() entityId;
  @Input() entityType;

  @ViewChild('folderPathInputElement', { read: ElementRef })
  folderPathInputElement: ElementRef<HTMLInputElement>;

  modalTitle: string;
  folderName: string;
  colorTheme = ColorTheme;
  folderNameError;
  folderNameModel = { invalid: false, error: '' };
  selectionPath: Array<string>;
  folderPath: string;
  folderSearch;
  folderViewToggle: boolean = false;
  isSaving: boolean = false;

  constructor(
    private readonly gridFolderService: GridFolderManagementService,
    private readonly SweetAlert: SweetAlertService
  ) {}

  ngOnInit(): void {
    if (!this.defaultSelectionPath) this.defaultSelectionPath = ['Documents'];
    this.selectionPath = [...this.defaultSelectionPath];
    if (this.mode == 'edit') {
      this.folderName = this.existingFolder.name;
      this.selectionPath = this.gridFolderService.getCurrentFolderPath(
        this.documents,
        this.existingFolder.path,
        this.defaultSelectionPath
      );
    }
    this.folderPath =
      this.selectionPath?.length > 1
        ? '/' + this.selectionPath.slice(1).join('/')
        : null;
    this.modalTitle = this.mode == 'new' ? 'New Folder' : 'Rename Folder';
  }

  handleSave(close) {
    this.mode == 'new' ? this.createFolder(close) : this.renameFolder(close);
  }

  createFolder(close) {
    this.isSaving = true;
    let payload: any = {
      base_attachment_hierarchy_id: this.last_parent_folder,
      is_file_path: this.is_file_path,
      document_folder_type: this.document_folder_type,
      paths: [this.folderName],
    };
    if (this.entityType && this.entityId) {
      payload = {
        ...payload,
        entity_id: this.entityId,
        entity_type: this.entityType,
      };
    }

    this.gridFolderService.createNewFolder(payload, true).subscribe(
      (value) => {
        this.success(value);
        close();
        this.isSaving = false;
      },
      (err) => {
        if (
          err.status === ErrorStatusCode.BadRequest &&
          err.error?.message?.includes('name already exists')
        ) {
          this.folderNameError =
            'Please use a different name. Folder with this name already exists in the same location.';
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
        this.isSaving = false;
      }
    );
  }

  renameFolder(close) {
    this.isSaving = true;
    this.gridFolderService
      .renameFolder(
        this.existingFolder.attachmentHierarchyId,
        this.folderName,
        true
      )
      .subscribe(
        (value) => {
          this.success(true);
          close();
          this.isSaving = false;
        },
        (err) => {
          if (
            err.status === ErrorStatusCode.BadRequest &&
            err.error?.message?.includes('name already exists')
          ) {
            this.folderNameError =
              'Please use a different name. Folder with this name already exists in the same location.';
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
          this.isSaving = false;
        }
      );
  }

  handleFolderNameChange(folderName) {
    this.folderName = folderName.trim();
    let obj = this.gridFolderService.isFolderNameValid(this.folderName);
    if (!obj.isValid) this.folderNameError = obj.reason;
    else this.folderNameError = null;
  }

  updatePath(params: ICellRendererParams): void {
    this.defaultSelectionPath = ['Documents'];
    if (params) {
      const path = params[0]?.data?.path || [];
      this.selectionPath = this.gridFolderService.getCurrentFolderPath(
        this.documents,
        path,
        this.defaultSelectionPath
      );
      this.last_parent_folder = path[path?.length - 1];
    } else {
      // root folder selection
      this.last_parent_folder = null;
      this.selectionPath = [...this.defaultSelectionPath];
    }

    this.folderPath =
      this.selectionPath?.length > 1
        ? this.gridFolderService.getTextToRenderOnOverflow(
            this.folderPathInputElement,
            '/' + this.selectionPath.slice(1).join('/')
          )
        : null;

    if (this.folderNameError?.includes('name already exists')) {
      this.folderNameError = null;
    }
  }

  updateRowData(data) {
    this.documents = data;
  }

  onFolderViewToggle() {
    this.folderViewToggle = !this.folderViewToggle;
  }
}
