import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';
import { UtilsService } from 'src/app2/services/utils.service';
import { diligenceStatusConstant } from '../../constants/constant';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take } from 'rxjs/operators';
@Component({
  selector: 'app-add-verifier',
  templateUrl: './add-verifier.component.html',
  styleUrls: ['./add-verifier.component.css'],
})
export class AddVerifierModal implements OnInit {
  @Input() response: any;
  @Input() verificationLevel: string;
  @Input() verificationType: any;
  @Input() diligenceType: any;
  @Input() functions: any[];
  @Input() success: any;
  is_freeSubscription: boolean;
  is_manager: boolean;
  showForManager: boolean;
  minDate: Date;
  reviewerForm: FormGroup;
  edit_mode: boolean;
  loading: boolean;
  assigned_to_user: any;
  diligenceStatusConstant = diligenceStatusConstant;
  @Select(UserState.getCurrentUserData) user;

  constructor(
    private readonly Utils: UtilsService,
    private readonly toaster: ToastrService,
    private readonly http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.minDate = new Date();
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.is_freeSubscription = data.isFreeSubscription;
          this.is_manager = data.isManager;
          this.showForManager = this.is_manager && !this.is_freeSubscription;
          this.createForm();
        }
      });
  }

  createForm() {
    this.reviewerForm = new FormGroup({
      id: new FormControl(0),
      //  assigned_to_user: new FormControl(null),
      due_date: new FormControl(
        moment().add(3, 'days').toDate(),
        Validators.required
      ),
    });

    if (this.response.verifier && this.response.verifier.attributes.id) {
      this.edit_mode = true;
      this.reviewerForm
        .get('id')
        .patchValue(this.response.verifier.attributes.id);
      this.reviewerForm
        .get('due_date')
        .patchValue(
          moment(this.response.verifier.attributes.due_date).toDate()
        );

      if (this.response.verifier.attributes.assigned_to_function_id) {
        this.assigned_to_user = {
          id: this.response.verifier.attributes.assigned_to_function_id,
          fullName: this.response.verifier.attributes.assigned_to_function_name,
          type: 'function',
        };
      } else if (this.response.verifier.attributes.assigned_to) {
        this.assigned_to_user = {
          id: this.response.verifier.attributes.assigned_to,
          fullName: this.response.verifier.attributes.assigned_to_name,
          type: 'user',
        };
      }
    }
  }

  actionChanged(selection) {
    this.assigned_to_user = selection;
  }

  setDateValue(date) {
    this.reviewerForm.get('due_date').patchValue(date);
  }

  submit(modalCallback) {
    if (!this.assigned_to_user) {
      this.toaster.error('Please assign to a user role/team member');
      return;
    }
    if (!this.reviewerForm.valid) {
      this.reviewerForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    const payload = this.generatePayload();

    if (this.edit_mode) {
      this.http
        .put(`todos/${payload.id}`, payload)
        .subscribe((response: any) => {
          this.toaster.success('Verifier successfully updated');
          this.successCallback(response, modalCallback);
        });
    } else {
      this.http.post(`todos`, payload).subscribe((response: any) => {
        this.toaster.success('Verifier successfully added');
        this.successCallback(response, modalCallback);
      });
    }
  }

  generatePayload() {
    const payload = this.reviewerForm.value;
    if (this.assigned_to_user.type === 'function') {
      payload.assigned_to_function_id = this.assigned_to_user.id;
    } else {
      payload.assigned_to = this.assigned_to_user.id;
    }
    payload.due_date = this.Utils.getToDateTimeFormatted(payload.due_date);
    payload.type =
      this.verificationType ===
        this.diligenceStatusConstant.PRECOMPLETIONREVIEW ||
      (this.showForManager && this.diligenceType === 'dd_profile')
        ? 1702
        : 1701;
    payload.text = '';
    payload.entity_type = this.verificationLevel;
    if (this.verificationLevel === 'response') {
      payload.entity_id = this.response.id;
    } else {
      payload.entity_id = this.response.id;
      payload.parent_id = this.response.diligenceId;
    }
    return payload;
  }

  successCallback(response, modalCallback) {
    if (this.success) {
      this.success(response);
    }
    this.loading = false;
    modalCallback();
  }
}
