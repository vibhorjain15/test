import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { ModalComponent } from 'src/app2/shared/components/modal/modal.component';
@Component({
  selector: 'bulk-actions-mappings-count-preview',
  templateUrl: './bulk-actions-mapping-count-preview.component.html',
  styleUrls: ['./bulk-actions-mapping-count-preview.component.css'],
})
export class BulkActionMappingCountPreview implements OnInit {
  @Input() types = [];
  isLoading: boolean = false;
  @Input() cancelButtonText: any = 'Review';
  @Input() onCancelClick: any;
  @Input() onProceedClick: any;
  @ViewChild('modal') modal: ModalComponent;
  subTitle =
    'Please review the total count of the mapped fields. Click on “Review” button to review the mapped fields.';
  totalMappedCount: number = 0;
  constructor() {}
  ngOnInit(): void {
    this.totalMappedCount = this.types.reduce(
      (total, type) => total + type.sheet.mappedCount,
      0
    );
  }
  onFirstClick() {
    this.onProceedClick();
    this.closeModal();
  }
  closeModal() {
    this.modal.closeModal();
  }
}
