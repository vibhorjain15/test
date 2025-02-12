import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { noWhitespaceValidator } from 'src/app2/shared/validators/no-white-space.validator';
import { validateAllFormFields } from 'src/app2/modules/firm-settings/tags-modal/tags-modal.util';
import { BulkUploadMappingAPIService } from 'src/app2/services/bulk-upload-mapping/bulk-upload-mapping.service';

@Component({
  selector: 'save-bulk-upload-mapping',
  templateUrl: './save-bulk-upload-mapping.component.html',
})
export class SaveBulkUploadMapping implements OnInit {
  @Input() mapping: any;
  @Input() source_id: number;
  @Input() entity_type: any;
  @Input() onSaveNewMapping: any;
  newMapping: any;
  mappingForm: FormGroup;
  isLoading: boolean;
  constructor(
    private readonly toastr: ToastrService,
    private readonly BulkUploadMappingApiService: BulkUploadMappingAPIService
  ) {}
  ngOnInit(): void {
    this.createForm();
  }
  createForm() {
    this.mappingForm = new FormGroup({
      name: new FormControl(null, [Validators.required, noWhitespaceValidator]),
      description: new FormControl(null, [
        Validators.required,
        noWhitespaceValidator,
      ]),
    });
  }
  saveMapping(closeModalEvent) {
    validateAllFormFields(this.mappingForm);
    if (!this.mappingForm.valid) {
      return;
    }
    this.isLoading = true;
    this.newMapping = {
      name: this.mappingForm.get('name').value,
      description: this.mappingForm.get('description').value,
      source_id: this.source_id,
      entity_type: this.entity_type,
      mapping_metadata: this.mapping,
    };

    this.BulkUploadMappingApiService.saveMapping(this.newMapping).subscribe(
      (res: any) => {
        this.newMapping = {
          id: res.mapping_id,
          ...this.newMapping,
        };
        this.onSaveNewMapping(this.newMapping);
        this.toastr.success('Mapping Saved successfully!');
        this.isLoading = false;
        closeModalEvent();
      },
      (err) => (this.isLoading = false)
    );
  }
  handleCancelClick(closeModalEvent) {
    closeModalEvent();
  }
}
