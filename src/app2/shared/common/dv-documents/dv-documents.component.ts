import { Component, Input, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { DocumentDataService } from 'src/app2/services/document-data.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { RouterService } from 'src/app2/services/router.service';

@Component({
  selector: 'dv-documents',
  templateUrl: './dv-documents.component.html',
  styleUrls: ['./dv-documents.component.css'],
})
export class DvDocumentsComponent implements OnInit {
  @Input() entityId: number;
  @Input() entityType: string;
  loadingDocuments: boolean;
  documents: any[];
  newOptions = [];
  toggleNewOptionDropdown: boolean = false;
  constructor(
    private readonly documentService: DocumentDataService,
    private readonly ModalFactory: CustomModalService,
    private readonly routerService: RouterService,
    private readonly toaster: ToastrService
  ) {}

  ngOnInit(): void {
    this.newOptions = [
      { label: 'Add Existing Documents', key: 1 },
      {
        label: 'Upload New Document / Folder',
        key: 2,
      },
    ];
    this.getDocuments();
  }

  getDocuments() {
    this.loadingDocuments = true;
    this.documentService
      .getDocumentsAssignment(this.entityType, this.entityId)
      .subscribe((response: any[]) => {
        this.documents = response;
        this.loadingDocuments = false;
      });
  }

  addDocument() {
    this.ModalFactory.invoke('upload-document-folder', {
      initialState: {
        uploadType: 'file',
        flow: 'add',
        showUploadTypeToggler: true,
        entity_id: this.entityId,
        entity_type: this.entityType,
        documents: [...this.documents],
        success: (action) => {
          this.documentService.clearDocumentPageUrl();
          if (action === 'refresh') {
            this.getDocuments();
          }
        },
      },
      class: 'modal-lg',
    });
  }

  redirectToDetailsPage(document) {
    this.documentService.setDocumentPageUrl(window.location.hash.slice(1));
    this.routerService.navigateWithParams('app.content.document.detail', {
      documentId: document.attachment_id,
    });
  }

  handleNewDropdownClick(item) {
    switch (item.key) {
      case 1:
        this.useExistingDocument();
        break;
      case 2:
        this.addDocument();
        break;
    }
  }

  useExistingDocument() {
    this.ModalFactory.invoke('use-existing-document', {
      initialState: {
        entityId: this.entityId,
        entityType: this.entityType,
        success: (action) => {
          this.getDocuments();
          this.toaster.success('Selected documents were added successfully');
        },
      },
    });
  }

  handleNewDropdownToggle(isOpen, $event = null) {
    this.toggleNewOptionDropdown = isOpen;
    if ($event) {
      $event.preventDefault();
      $event.stopPropagation();
    }
  }
}
