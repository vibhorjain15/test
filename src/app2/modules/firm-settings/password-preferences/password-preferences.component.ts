import { Component, OnInit } from '@angular/core';
import { FirmPreferenceDataService } from '../firm-preference-data.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { InterpolatePipe } from 'src/app2/shared/pipes/interpolate.pipe';
import { errorMessageMap } from 'src/app2/shared/constants/constant';
import { UtilsService } from 'src/app2/services/utils.service';
import { DvValidators } from 'src/app2/shared/validators/no-white-space.validator';

@Component({
  selector: 'app-password-preferences',
  templateUrl: './password-preferences.component.html',
  styleUrls: ['./password-preferences.component.css'],
})
export class PasswordPreferencesComponent implements OnInit {
  passwordPreferenceForm: FormGroup;
  firmPreferences: any;
  isSaveDisabled: boolean = false;
  isSaving: boolean = false;

  constructor(
    private readonly firmPreferenceService: FirmPreferenceDataService,
    private readonly toastr: ToastrService,
    private readonly interpolatePipe: InterpolatePipe,
    private readonly utils: UtilsService
  ) {}

  ngOnInit() {
    this.passwordPreferenceForm = new FormGroup({
      password_expiration_frequency: new FormControl(null, [
        Validators.required,
        DvValidators.isPureNumber(
          'Please enter a valid number between 1 and 999,999',
          6
        ),
        Validators.min(1),
      ]),
      password_reuse_limit: new FormControl(null, [
        Validators.required,
        DvValidators.isPureNumber(
          'Please enter a valid number between 1 and 999,999',
          6
        ),
        Validators.min(1),
      ]),
    });

    this.firmPreferenceService.getFirmPreferences().subscribe((data: any) => {
      this.firmPreferences = data;
      this.passwordPreferenceForm.setValue({
        password_expiration_frequency: data.password_expiration_frequency,
        password_reuse_limit: data.password_reuse_limit,
      });
    });
  }

  getErrorMessage(controlName: string, fieldName?: string): string {
    const control = this.passwordPreferenceForm.get(controlName);
    const hasError =
      control && control?.touched && control?.invalid && control?.errors;

    if (hasError && control.errors.type == 'isPureNumber') {
      return control.errors.message;
    }

    if (hasError && control.errors.required) {
      return this.interpolatePipe.transform(
        errorMessageMap?.required,
        fieldName
      );
    }

    if (hasError && control.errors.min) {
      return this.interpolatePipe.transform(
        errorMessageMap?.min,
        fieldName,
        '0'
      );
    }

    return '';
  }

  handleSubmit() {
    this.utils.validateAllFormFields(this.passwordPreferenceForm);
    if (this.passwordPreferenceForm.valid) {
      this.isSaving = true;
      this.firmPreferenceService
        .updateFirmPreferences({
          ...this.firmPreferences,
          password_expiration_frequency: this.passwordPreferenceForm.get(
            'password_expiration_frequency'
          ).value,
          password_reuse_limit: this.passwordPreferenceForm.get(
            'password_reuse_limit'
          ).value,
        })
        .subscribe(
          (data) => {
            this.isSaving = false;
            this.toastr.success(
              'Firm password preferences successfully saved',
              '',
              {
                timeOut: 5000,
              }
            );
          },
          (err) => {
            this.isSaving = false;
            this.toastr.error(
              'An error occurred while saving firm password preferences. Please try again.',
              '',
              {
                timeOut: 5000,
              }
            );
          }
        );
    }
  }
}

