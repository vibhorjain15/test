import {
  Component,
  DoCheck,
  Input,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { FirmTagService } from 'src/app2/services/firm-tags.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { HttpClient } from '@angular/common/http';
import { Select } from '@ngxs/store';
import { finalize, take } from 'rxjs/operators';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { UserState } from 'src/app2/store/user/user.state';
import swal from 'sweetalert2/dist/sweetalert2.js';
import { TagsType } from '../../types/Tags.type';

@Component({
  selector: 'app-custom-field-viewer',
  templateUrl: './custom-field-viewer.component.html',
  styleUrls: ['./custom-field-viewer.component.css'],
})
export class CustomFieldViewerComponent implements OnInit, DoCheck {
  @Input() entityType? = '';
  @Input() entityTypeId?: any;
  @Input() entityId?: any;
  @Input() source? = '';
  entity_type_name;
  loading_data;
  custom_fields: TagsType[] = [];
  is_admin;
  schema_format: any;
  @Select(UserState.getCurrentUserData) user;
  constructor(
    private readonly Utils: UtilsService,
    private readonly tagsService: FirmTagService,
    private readonly SweetAlert: SweetAlertService,
    private readonly NewModalFactory: CustomModalService,
    private readonly http: HttpClient
  ) {}

  ngOnInit(): void {
    this.user.pipe(take(1)).subscribe((data) => {
      if (data) {
        this.is_admin = data.isAdmin;
      }
    });
    this.entity_type_name = this.Utils.getDisplayEntityType(this.entityType);
    this.loadCustomFields();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.entityId?.currentValue) {
      this.custom_fields = [];
      this.ngOnInit();
    }
  }

  loadCustomFields() {
    this.loading_data = true;
    const params = {
      schema_type: this.entityType,
      entity_id: this.entityId ? this.entityId : 0,
    };
    this.tagsService.getCustumTags(
      params,
      (schema_format) => {
        this.schema_format = schema_format;
        this.loading_data = false;
      },
      () => {
        this.loading_data = false;
      }
    );
  }

  displayFieldRemovalConfirmation(entry: any, index: any) {
    this.SweetAlert.confirm({
      title: `Are you sure you want to remove the custom field for ${this.entity_type_name.toLowerCase()} tags?`,
      confirmButtonText: 'Yes',
      focusCancel: true,
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.removeCustomField(entry, index, resolve);
        });
      },
    }).then(() => {
      swal.close();
    });
  }

  removeCustomField(entry, index: any, resolve) {
    entry.status = false;
    const params = {
      entity_type: this.entityTypeId ? this.entityTypeId : 0,
      custom_fields: [entry],
      schema_type: this.entityType,
      entity_id: this.entityId ? this.entityId : 0,
    };
    this.tagsService.deleteCustumTag(
      params,
      () => swal.close(),
      () => swal.close()
    );
    // commented below code as it seems not required -- Karan
    // this.http
    //   .post('service/dvapi_service/update_custom_fields', params)
    //   .pipe(finalize(() => resolve()))
    //   .subscribe((response: any) => {
    //     this.custom_fields.splice(index, 1);
    //   });
  }

  ngDoCheck() {
    let custum_tags: TagsType[] = this.tagsService.getAllTags;
    if (custum_tags !== this.custom_fields) {
      this.custom_fields = custum_tags;
    }
  }

  addNewCustomTags() {
    !this.loading_data &&
      this.NewModalFactory.invoke('firm-tags', {
        initialState: {
          entityType: this.entityType,
          entityTypeId: this.entityTypeId,
          entityId: this.entityId,
          existing_tags: { ...this.custom_fields },
          schema_format: this.schema_format,
          source: this.source,
        },
      });
  }

  editCustomFields(index: any) {
    this.NewModalFactory.invoke('firm-tags', {
      initialState: {
        entityType: this.entityType,
        entityTypeId: this.entityTypeId,
        entityId: this.entityId,
        existing_tags: { ...this.custom_fields },
        schema_format: this.schema_format,
        source: this.source,
        editIndex: index,
      },
    });
  }
}
