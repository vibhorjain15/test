import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { CustomFieldsService } from 'src/app2/services/custom-fields.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { CustomFieldSelectionComponent } from '../../components/custom-field-selection/custom-field-selection.component';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-manage-custom-fields',
  templateUrl: './manage-custom-fields.component.html',
  styleUrls: ['./manage-custom-fields.component.css'],
})
export class ManageCustomFieldsModal implements OnInit {
  @Input() entityTypeId: Number;
  @Input() entityType: string;
  @Input() entityId: Number;
  @Input() customFields: any[];
  @Input() customUrl: string;
  @Input() response: any;
  loading: boolean;
  current_user: any;
  @ViewChild('fields')
  customFieldsComponent: CustomFieldSelectionComponent;

  constructor(
    private readonly Utils: UtilsService,
    private readonly customFieldsService: CustomFieldsService,
    private readonly toaster: ToastrService
  ) {}

  ngOnInit(): void {
    this.current_user = this.Utils.getCurrentUser();
  }

  submit(modalCallback) {
    if (!this.customFieldsComponent.isFormValid()) {
      return;
    }
    this.loading = true;
    const payload = {
      entity_id: +this.entityId,
      owner_user_id: this.current_user.id,
      entity_type: +this.entityTypeId,
      schema_type: this.entityType.toLowerCase(),
      custom_fields: this.customFieldsComponent.getAddedFields(),
    };
    if (payload.custom_fields.length) {
      this.customFieldsService.saveCustomFields(payload)
      .pipe(finalize(() => this.loading = false))
      .subscribe((resp) => {
        if (this.response) {
          this.response(resp);
        }
        this.successCallback(modalCallback);
      });
    } else {
      this.successCallback(modalCallback);
    }
  }

  successCallback(modalCallback) {
    this.toaster.success('Custom fields updated successfully');
    this.loading = false;
    modalCallback();
  }
}
