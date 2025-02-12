import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { UtilsService } from 'src/app2/services/utils.service';
import {
  ErrorStatusCode,
  keywordConstants,
  USER_ROLES,
} from '../../constants/constant';

@Component({
  selector: 'app-add-internal-contacts',
  templateUrl: './add-internal-contacts.component.html',
  styleUrls: ['./add-internal-contacts.component.css'],
})
export class AddInternalContactsModal implements OnInit {
  is_saving: boolean = false;
  loading: boolean = true;
  internal_contact_types: any[] = [];
  firm_id: number;
  all_users: any[] = [];
  selector_params = {
    id: 'id',
    name: 'fullName',
  };
  internal_contacts_form: FormGroup;
  is_primary_contact: boolean = false;
  entity_type_name = '';

  @Input() entity_type: string;
  @Input() selected_entities: { id: number; name: string }[];
  @Input() help_text: string;
  @Input() entities: { id: number; name: string }[];
  @Input() successCallback;

  constructor(
    private readonly toastr: ToastrService,
    private readonly http: HttpClient,
    private utilsService: UtilsService,
    private customModalService: CustomModalService
  ) {}

  ngOnInit(): void {
    switch (this.entity_type) {
      case keywordConstants.Firm:
        this.entity_type_name = 'investor firms';
        break;
      case keywordConstants.Product:
        this.entity_type_name = 'products';
        break;
      case keywordConstants.Strategy:
        this.entity_type_name = 'strategies';
        break;
    }

    this.firm_id = this.utilsService.getCurrentUser().firmInfo.id;

    forkJoin([
      this.getInternalContactTypes(),
      this.getUsers(this.firm_id),
    ]).subscribe(
      () => {
        this.loading = false;
      },
      (err) => {
        this.loading = false;
        this.toastr.error('Something went wrong. Please try again.');
      }
    );

    this.internal_contacts_form = new FormGroup({
      userRolesControl: new FormControl(null, Validators.required),
      usersControl: new FormControl(null, Validators.required),
      selectedEntitiesControl: new FormControl(
        this.selected_entities.map((entity) => entity.id),
        Validators.required
      ),
    });
  }

  getInternalContactTypes() {
    let request = this.http.get('internalContactTypes');
    request.subscribe((response: any[]) => {
      this.internal_contact_types = response;
    });

    return request;
  }

  getUsers(firm_id: number) {
    let request = this.http.get(`firms/${firm_id}/users`);
    request.subscribe((response: any[]) => {
      this.all_users = response?.filter(
        (user) =>
          user.firmwide_role_name.toLowerCase() != USER_ROLES.SECURITYADMIN
      );
    });

    return request;
  }

  selectUsers(users: any[]) {
    this.internal_contacts_form.get('usersControl').setValue(users);
  }

  assignInternalContactsToEntities() {
    let selected_internal_contact_types =
      this.internal_contacts_form.get('userRolesControl').value;
    let selected_users = this.internal_contacts_form.get('usersControl').value;
    let selected_entities = this.internal_contacts_form.get(
      'selectedEntitiesControl'
    ).value;
    return this.http.post('entityUserAssignments/bulk_assignment', {
      entity_ids: selected_entities,
      entity_type: this.entity_type,
      is_primary: this.is_primary_contact,
      internal_tags: this.internal_contact_types
        .filter((internal_contact_type) =>
          selected_internal_contact_types.includes(internal_contact_type.id)
        )
        .map((internalContactType) => internalContactType.text),
      user_ids: selected_users.map((user) => user.id),
    });
  }

  submit(modalCallback) {
    if (this.internal_contacts_form.invalid) {
      this.internal_contacts_form.markAllAsTouched();
      return;
    }

    this.is_saving = true;
    try {
      this.assignInternalContactsToEntities().subscribe(
        () => {
          this.toastr.success('Internal contacts assigned successfully', '', {
            timeOut: 5000,
          });
          this.is_saving = false;
          this.successCallback();
          modalCallback();
        },
        (err) => {
          this.is_saving = false;
          if (
            !(
              err &&
              err.status &&
              Object.values(ErrorStatusCode).includes(err.status)
            )
          ) {
            this.toastr.error('Something went wrong. Please try again.');
          }
        }
      );
    } catch (err) {
      this.is_saving = false;
      this.toastr.error('Something went wrong. Please try again.');
    }
  }

  handleCancelClick() {
    this.customModalService.close();
  }
}
