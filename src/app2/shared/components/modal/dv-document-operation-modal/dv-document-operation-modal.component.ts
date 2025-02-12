import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';

import { GridReadyEvent, RowNode } from 'ag-grid-community';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { ToastrService } from 'ngx-toastr';

import { GridFolderManagementService } from 'src/app2/services/grid-folder-management.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { ErrorStatusCode } from 'src/app2/shared/constants/constant';
import { ColorTheme } from 'src/app2/shared/themes/color.themes';

@Component({
  selector: 'dv-document-operation-modal',
  templateUrl: './dv-document-operation-modal.component.html',
  styleUrls: ['./dv-document-operation-modal.component.css'],
})
export class DvDocumentOperationModalComponent implements OnInit {
  @Input() rowData: Array<any>;
  @Input() selectedDocuments: Array<any>;
  @Input() operationType: 'move' | 'copy' = 'move';
  @Input() documentFolderType: number; // 1 for MyAttachments, 2 for received
  @Input() callback: () => void;
  @Input() defaultSelectionPath: Array<string> = ['Documents'];
  @Input() entityId;
  @Input() entityType;

  modalTitle: string = '';
  newFolderName: string = '';
  newFolderErrorMessage: string = '';
  seletedDestinationNode: RowNode;
  isPathSelected: boolean = false;
  filterValue: string = '';
  selectionPath: Array<string> = [];
  isAddNewFolderEnabled: boolean = false;
  baseAttachmentHierarchyId: number | null = null;
  isOperationInProgress: boolean = false;
  folderViewToggle: boolean = false;
  folderPath: string;

  colorTheme = ColorTheme;

  @ViewChild('folderPathInputElement', { read: ElementRef })
  folderPathInputElement: ElementRef<HTMLInputElement>;

  constructor(
    private bsModalRef: BsModalRef,
    private toastrService: ToastrService,
    private readonly gridFolderManagementService: GridFolderManagementService,
    private readonly SweetAlert: SweetAlertService
  ) {}

  ngOnInit(): void {
    this.setModalTitle();
    this.selectionPath = [...this.defaultSelectionPath];
  }

  filterDocument(value: string): void {
    this.filterValue = value;
  }

  onFolderViewToggle() {
    this.folderViewToggle = !this.folderViewToggle;
  }

  handleOnCancelClick(type: 'newFolder' | 'closeModal' = 'closeModal'): void {
    if (type === 'newFolder') {
      this.isAddNewFolderEnabled = false;
    } else {
      this.closeModal();
    }
  }

  createNewFolder(): void {
    this.isAddNewFolderEnabled = true;
  }

  moveOrCopyToDestination(destinationFolderId: number = null): void {
    this.isOperationInProgress = true;
    const payload = {
      Destination_attachment_hierarchy_id: destinationFolderId
        ? destinationFolderId
        : this.gridFolderManagementService.getDestinationAttachmentHierarchyId({
            node: this.seletedDestinationNode,
          } as any),
      Root_attachment_hierarchy_ids:
        this.gridFolderManagementService.getRootAttachmentHierarchyIds(
          this.selectedDocuments
        ),
      Is_cut: this.operationType === 'move',
      Attachment_ids: this.selectedDocuments
        ?.filter((item) => !item.attachmentHierarchyId && item.type == 1)
        .map((item) => item.attachment_id ?? item.id),
      Entity_type: this.entityType,
      Entity_id: this.entityId,
      Type: this.documentFolderType,
    };
    this.gridFolderManagementService
      .pasteDocument(payload, true)
      .subscribe({
        next: (response: any) => {
          if (this.callback) {
            this.callback();
          }

          this.toastrService.success(
            `${this.selectedDocuments.length} items successfully ${
              this.operationType === 'move' ? 'moved' : 'copied'
            }.`
          );
          this.closeModal();
        },
        error: (err: any) => {
          if (err.status === ErrorStatusCode.BadRequest && err.error?.message) {
            this.toastrService.error(
              err.error.message,
              `Failed to ${this.operationType} documents.`
            );
          } else {
            this.toastrService.error(
              `Failed to ${this.operationType} documents.`
            );
          }
        },
      })
      .add(() => {
        this.isOperationInProgress = false;
      });
  }

  createAndApplyOperation(): void {
    this.isOperationInProgress = true;
    let payload: any = {
      base_attachment_hierarchy_id: this.baseAttachmentHierarchyId, // parent folder id
      is_file_path: false,
      document_folder_type: this.documentFolderType, // tab id
      paths: [this.newFolderName],
    };

    if (this.entityId && this.entityType) {
      payload = {
        ...payload,
        entity_id: this.entityId,
        entity_type: this.entityType,
      };
    }

    this.gridFolderManagementService.createNewFolder(payload, true).subscribe({
      next: (response: any) => {
        this.toastrService.success('New folder successfully created.');
        this.moveOrCopyToDestination(response[0].id);
      },
      error: (err: any) => {
        if (
          err.status === ErrorStatusCode.BadRequest &&
          err.error?.message?.includes('name already exists')
        ) {
          this.newFolderErrorMessage =
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
        this.toastrService.error('Failed to create new folder.');
        this.isOperationInProgress = false;
      },
    });
  }

  updatePath(nodes: Array<RowNode>): void {
    if (nodes) {
      const path = nodes[0]?.data?.path || [];
      this.seletedDestinationNode = nodes[0];
      this.baseAttachmentHierarchyId =
        this.seletedDestinationNode?.data?.document?.id;
      this.selectionPath =
        this.gridFolderManagementService.getCurrentFolderPath(
          this.rowData,
          path,
          this.defaultSelectionPath
        );
    } else {
      // root folder selection
      this.selectionPath = [...this.defaultSelectionPath];
      this.seletedDestinationNode = null;
      this.baseAttachmentHierarchyId = null;
    }

    this.folderPath =
      this.selectionPath?.length > 1
        ? this.gridFolderManagementService.getTextToRenderOnOverflow(
            this.folderPathInputElement,
            '/' + this.selectionPath.slice(1).join('/')
          )
        : null;

    if (this.newFolderErrorMessage?.includes('name already exists')) {
      this.newFolderErrorMessage = null;
    }
  }

  updateRowData(data) {
    this.rowData = data;
  }

  closeModal(): void {
    this.bsModalRef.hide();
  }

  handleFolderNameChange(name: string) {
    const result = this.gridFolderManagementService.isFolderNameValid(name);
    if (!result.isValid) {
      this.newFolderErrorMessage = result.reason;
    } else {
      this.newFolderErrorMessage = null;
    }
  }

  onGridReady(event: GridReadyEvent): void {
    this.isPathSelected = true; // The default root path (i.e., '/') will be selected by default.
  }

  private setModalTitle(): void {
    const documentCount = this.selectedDocuments.length;
    this.modalTitle = `${
      this.operationType === 'move' ? 'Move' : 'Copy'
    } ${documentCount} item${documentCount === 1 ? '' : 's'}`;
  }
}
