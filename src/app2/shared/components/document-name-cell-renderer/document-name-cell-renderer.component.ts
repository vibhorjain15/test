import { Component, OnInit } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { DocumentDataService } from 'src/app2/services/document-data.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { ColorTheme } from '../../themes/color.themes';

@Component({
  selector: 'app-document-name-cell-renderer',
  templateUrl: './document-name-cell-renderer.component.html',
  styleUrls: ['./document-name-cell-renderer.component.css'],
})
export class DocumentNameCellRendererComponent
  implements OnInit, ICellRendererAngularComp
{
  params: any;
  showPreview = false;
  pageUrl = '';
  href = '';
  documentDataServiceFactory; // RouterBug

  isDropdownOpen = false;
  actions = [];
  showNotes = false;
  freeSubscription = false;
  colorTheme = ColorTheme;
  constructor(
    private readonly documentDataService: DocumentDataService,
    private readonly Utils: UtilsService
  ) {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.freeSubscription = this.params.currentUser.isFreeSubscription;
    if (this.params.tab != 'All') {
      this.actions.push({
        label: 'Edit',
        key: 'edit',
        leftIcon: 'pencil',
      });

      if (this.showNotes) {
        this.actions.push({
          label: 'Add/View Notes',
          key: 'notes',
          leftIcon: 'notepad',
        });
      }

      if (
        this.params.data?.document &&
        this.params.showShareAction !== false &&
        this.showDocumentAction(this.params.data.document) &&
        !this.freeSubscription
      ) {
        this.actions.push({
          label: 'Share',
          key: 'share',
          leftIcon: 'share',
        });
      }

      if (
        this.params.data?.document &&
        this.showDocumentAction(this.params.data.document)
      ) {
        this.actions.push({
          label: this.params.gridType == 'entity' ? 'Remove' : 'Delete',
          key: 'delete',
          leftIcon: 'trashcan',
        });
      }
    }

    this.actions.push({
      label: 'Download',
      key: 'download',
      leftIcon: 'download-install-line',
    });
  }
  ngOnInit(): void {
    const pageUrl = this.documentDataService.getDocumentPageUrl();
    this.documentDataService.setDocumentPageUrl(pageUrl);
    const documentId =
      this.params.data?.document?.attachment_id ||
      this.params.data?.document?.id;
    this.href = `#/app/content/document/${documentId}/detail`;
  }
  showPreviewIcon(document) {
    return Boolean(
      document.highlights && Object.keys(document.highlights).length !== 0
    );
  }
  previewClicked(event, document) {
    this.params.clickedPreview(document);
    event.stopPropagation();
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
  showDocumentAction(document) {
    return this.Utils.isDocumentUploadByCurrentFirm(
      this.params.currentUser,
      document.owner_firm_id
    );
  }

  handleActionClick(action) {
    switch (action.key) {
      case 'edit':
        this.openDocumentUpdateDialog();
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
      case 'download':
        this.params.handleDownload(this.params.data.document);
        break;
    }
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
}
