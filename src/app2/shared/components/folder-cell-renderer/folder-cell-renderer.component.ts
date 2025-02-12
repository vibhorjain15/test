import { Component, OnDestroy, OnInit } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams, RowNode } from 'ag-grid-community';
import { EntityDocumentsService } from 'src/app2/services/entity-documents.service';
import { UtilsService } from 'src/app2/services/utils.service';

@Component({
  selector: 'app-folder-cell-renderer',
  templateUrl: './folder-cell-renderer.component.html',
  styleUrls: ['./folder-cell-renderer.component.css'],
})
export class FolderCellRendererComponent
  implements OnInit, ICellRendererAngularComp, OnDestroy
{
  params: any;
  showPreview = false;
  actions = [];
  is_investor = false;
  freeSubscription = false;
  showNotes = false;
  disableButtons = false;
  subscription;
  isDropdownOpen = false;
  constructor(
    private readonly Utils: UtilsService,
    private readonly entityDocumentsService: EntityDocumentsService,
  ) {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.is_investor = this.params.currentUser.isInvestor;
    this.freeSubscription = this.params.currentUser.isFreeSubscription;
    if (this.params.data && this.params.tab != 'All') {
      if (this.params.data.document?.type == 1) {
        this.actions.push({
          label: 'Edit',
          key: 'edit',
          leftIcon: 'pencil',
        });

        this.actions.push({
          label: 'Move',
          key: 'move',
          leftIcon: 'move1',
        });
        if (this.params.tab == 'MyAttachments') {
          this.actions.push({
            label: 'Copy',
            key: 'copy',
            leftIcon: 'copy-2',
          });
        }

        if (this.showNotes) {
          this.actions.push({
            label: 'Add/View Notes',
            key: 'notes',
            leftIcon: 'notepad',
          });
        }

        if (
          this.showDocumentAction(this.params.data.document) &&
          !this.freeSubscription
        ) {
          this.actions.push({
            label: 'Share',
            key: 'share',
            leftIcon: 'share',
          });
        }

        if (this.showDocumentAction(this.params.data.document)) {
          this.actions.push({
            label: this.params.gridType == 'entity' ? 'Remove' : 'Delete',
            key: 'delete',
            leftIcon: 'trashcan',
          });
        }
      } else {
        this.actions.push({
          label: 'Rename',
          key: 'rename',
          leftIcon: 'rename',
        });
        if (
          (this.params.node as RowNode).allLeafChildren.find(
            (row) => row.data.type == 1
          )
        )
          this.actions.push({
            label: 'Edit',
            key: 'editFolder',
            leftIcon: 'pencil',
          });
        this.actions.push({
          label: 'Move',
          key: 'move',
          leftIcon: 'move1',
        });
        if (this.params.tab == 'MyAttachments') {
          this.actions.push({
            label: 'Copy',
            key: 'copy',
            leftIcon: 'copy-2',
          });
          this.actions.push({
            label: this.params.gridType == 'entity' ? 'Remove' : 'Delete',
            key: 'delete',
            leftIcon: 'trashcan',
          });
        }
      }
    }
    this.actions.push({
      label: 'Download',
      key: 'download',
      leftIcon: 'download-install-line',
    });
  }
  ngOnInit(): void {}
  subscribeForEntityLoad() {
    if (!this.entityDocumentsService.entityLoaded$) return;
    this.subscription = this.entityDocumentsService.entityLoaded$.subscribe(
      (entity) => {
        if (entity) {
          this.disableButtons = this.disableActionButtons(entity);
          this.actions = this.actions.map((action) => {
            return {
              ...action,
              disabled: this.disableButtons,
            };
          });
          this.showNotes =
            this.is_investor && entity.entity_type === 'DueDiligence';
        }
      }
    );
  }
  disableActionButtons(entityDetails) {
    if (entityDetails.entity_type !== 'DueDiligence') {
      return false;
    }
    if (!this.is_investor && entityDetails.entity.status === 'Completed') {
      return true;
    }
    return false;
  }
  handleActionClick(action) {
    switch (action.key) {
      case 'edit':
        this.openDocumentUpdateDialog();
        break;
      case 'editFolder':
        this.editFolder();
        break;
      case 'notes':
        this.openNotesSidebar();
        break;
      case 'share':
        this.openDocumentShareDialog();
        break;
      case 'delete':
        this.confirmDocumentDeletion();
        break;
      case 'move':
        this.moveOrCopyDocument('move');
        break;
      case 'copy':
        this.moveOrCopyDocument('copy');
        break;
      case 'rename':
        this.renameDocument();
        break;
      case 'download':
        this.params.handleDownload(this.params.data.document);
        break;
    }
  }
  editFolder(): void {
    const folderDetails = this.params.data;
    const documents = (this.params.node as RowNode).allLeafChildren.map(
      (row) => row.data
    );

    this.params.editFolder(folderDetails, documents);
  }
  openDocumentUpdateDialog() {
    this.params.openDocumentUpdateDialog(this.params.data.document);
  }
  openDocumentShareDialog() {
    this.params.openDocumentShareDialog(this.params.data.document);
  }
  confirmDocumentDeletion() {
    this.params.confirmDocumentDeletion(this.params.data.document);
  }
  openNotesSidebar() {
    this.params.openNotesSidebar(this.params.data.document);
  }
  showPreviewIcon(document) {
    return Boolean(
      document.highlights && Object.keys(document.highlights).length !== 0
    );
  }
  previewClicked(document) {
    this.params.clickedPreview(document);
  }
  moveOrCopyDocument(operationType: 'move' | 'copy'): void {
    this.params.moveOrCopyDocument(operationType, this.params.data.document);
  }
  renameDocument() {
    this.params.renameDocument(this.params.data.document);
  }
  showDocumentAction(document) {
    return this.Utils.isDocumentUploadByCurrentFirm(
      this.params.currentUser,
      document.owner_firm_id
    );
  }
  ngOnDestroy(): void {
    if (this.subscription) this.subscription.unsubscribe();
  }

  click(event: any) {
    event.stopPropagation();
    event.preventDefault();
    const rowNode = this.params.node;
    const api = this.params.api;

    if (rowNode && api) {
      api.dispatchEvent({
        type: 'cellClicked',
        event: event,
        rowIndex: rowNode.rowIndex,
        rowNode: rowNode,
        data: rowNode.data,
      });
    }
  }
}
