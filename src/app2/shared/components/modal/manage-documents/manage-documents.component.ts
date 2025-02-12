import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { DocumentDataService } from 'src/app2/services/document-data.service';
import { ModalComponent } from '../modal.component';

@Component({
  selector: 'manage-documents',
  templateUrl: './manage-documents.component.html',
  styleUrls: ['./manage-documents.component.css'],
})
export class ManageDocumentsComponent implements OnInit {
  @Input() entityId: number;
  @Input() entityType: string;
  @Input() isFile: boolean = true;
  @Input() parentAttachmentHierarchyId = null;
  sourceType: string = 'existing';
  @ViewChild('modal') modal: ModalComponent;
  constructor(private readonly documentService: DocumentDataService) {}

  ngOnInit(): void {
    if (!this.isFile) {
      this.sourceType = 'new';
    }
  }

  setSourceType(type: string): void {
    this.sourceType = type;
  }

  bulkAssignDocuments(attachmentIds: number[]) {
    const payload = {
      entity_ids: [this.entityId],
      entity_type: this.entityType,
      firm_ids: [],
      newassigned: attachmentIds,
      unassigned: [],
    };
    this.documentService.assignBulkDocuments(payload).subscribe(() => {
      this.modal.closeModal();
    });
  }
}
