import { Component, OnInit, Input } from '@angular/core';
@Component({
  selector: 'bulk-actions-mappings-preview',
  templateUrl: './bulk-actions-mappings-preview.component.html',
  styleUrls: ['./bulk-actions-mappings-preview.component.css'],
})
export class BulkActionMappingPreview implements OnInit {
  isLoading: boolean = false;
  @Input() mappings: any;
  @Input() mappingName: any;
  @Input() canSelect: boolean = false;
  @Input() cancelButtonText: any = 'Close';
  @Input() updateWithoutPreview = false;
  @Input() onCancelClick: any;
  @Input() onProceedClick: any;
  mappingKeys: string[];
  selectedRows = {};
  selectedMappingKeys: any = [];
  selectMappings: { [key: string]: any } = {};
  selectAllCheckbox: boolean;
  constructor() {}
  ngOnInit(): void {
    this.mappingKeys = Object.keys(this.mappings);
    this.allSelectCheckbox(true);
    this.updateSelectedKeysArray();
    if (this.updateWithoutPreview) {
      this.proceedClick();
    }
  }
  updateSelectedKeysArray() {
    this.selectedMappingKeys = Object.keys(this.selectedRows).filter(
      (key) => this.selectedRows[key]
    );
    this.selectAllCheckbox =
      this.selectedMappingKeys.length == this.mappingKeys.length;
  }
  allSelectCheckbox(isTrue) {
    this.mappingKeys.forEach((key) => {
      this.selectedRows[key] = isTrue;
    });
    this.updateSelectedKeysArray();
  }
  onFirstClick(closeModalCallback) {
    this.proceedClick();
    closeModalCallback();
  }
  proceedClick() {
    this.selectedMappingKeys.forEach((key) => {
      if (this.mappings[key]) {
        this.selectMappings[key] = this.mappings[key];
      }
    });
    this.onProceedClick(this.selectMappings);
  }
  handleCancelClick(closeModalCallback) {
    if (this.canSelect) {
      this.onCancelClick();
    }
    closeModalCallback();
  }
}
