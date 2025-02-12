import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { finalize, take } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { InterpolatePipe } from 'src/app2/shared/pipes/interpolate.pipe';
// import { FirmSettingsService } from '../firm-settings.service';
import { errorMessageMap, Regex } from 'src/app2/shared/constants/constant';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { FirmSettingsService } from '../firm-settings.service';
import { GetCurrentUser } from 'src/app2/store/user/user.action';
import {
  DvValidators,
  noHtmlValidator,
} from 'src/app2/shared/validators/no-white-space.validator';
import { validateAllFormFields } from 'src/app2/utils/validateAllFormFields';

@Component({
  selector: 'app-firm-profile',
  templateUrl: './firm-profile.component.html',
  styleUrls: ['./firm-profile.component.css'],
})
export class FirmProfileComponent implements OnInit {
  firm_profile_copy;
  firm_types;
  currencies;
  users;
  firm_profile: any;
  saving = false;
  profileForm: FormGroup;
  @Select(UserState.getLanguageCodeData) languageCode$;
  @Select(UserState.getCurrentUserData) user;
  firmId;
  assetLabel = ` Assets Under Management <br /> <small class="text-muted">(in millions)</small>`;
  constructor(
    private readonly http: HttpClient,
    private readonly toaster: ToastrService,
    private readonly interpolatePipe: InterpolatePipe,
    private readonly firmSettingsService: FirmSettingsService
  ) {}

  ngOnInit() {
    this.user.pipe(take(1)).subscribe((data) => {
      if (data) {
        this.firmId = data.firmInfo.id;
        this.initApi();
      }
    });
    this.profileForm = new FormGroup({
      nameControl: new FormControl('', [
        DvValidators.required,
        Validators.pattern(Regex.avoidFirstSplCharacter),
        noHtmlValidator,
      ]),
      descriptionControl: new FormControl(''),
      firmWebsiteControl: new FormControl('', [
        DvValidators.required,
        Validators.pattern(Regex.validFirmWebsite),
      ]),
      firmTypeControl: new FormControl(''),
      defaultCurrencyControl: new FormControl(null),
      assetsUnderManagementControl: new FormControl('', [
        Validators.pattern(/^[0-9]+(\.[0-9]{1,2})?$/),
      ]),
    });
  }

  initApi() {
    this.firmSettingsService
      .getFirmProfile(this.firmId)
      .subscribe((firm_profile) => {
        this.firm_profile = firm_profile;
        this.firm_profile_copy = { ...this.firm_profile };
        this.profileForm.patchValue({
          nameControl: this.firm_profile_copy.name ?? '',
          descriptionControl: this.firm_profile_copy.firmDescription ?? '',
          firmWebsiteControl: this.firm_profile_copy.website ?? '',
          firmTypeControl: this.firm_profile_copy.firm_type_id ?? '',
          defaultCurrencyControl:
            this.firm_profile_copy.currencyID > 0
              ? this.firm_profile_copy.currencyID
              : null,
          assetsUnderManagementControl: this.firm_profile_copy.aum ?? '',
        });
        this.profileForm.updateValueAndValidity();
      });
    this.http.get(`team_members/admin`).subscribe((response: any) => {
      response = response.map((user) => ({
        ...user,
        fullname: `${user.firstName} ${user.lastName}`,
      }));
      this.users = response;
    });
    this.http.get(`currency`).subscribe((response) => {
      this.currencies = response;
    });
    this.http.get(`firm_types`).subscribe((response) => {
      this.firm_types = response;
    });
  }

  submit() {
    validateAllFormFields(this.profileForm);
    if (this.profileForm.valid) {
      if (!this.firm_profile_copy.contactPerson?.id) {
        this.firm_profile_copy.contactPerson = null;
      }
      this.saving = true;
      this.firm_profile_copy = {
        ...this.firm_profile_copy,
        name: this.profileForm.value.nameControl,
        firmDescription: this.profileForm.value.descriptionControl,
        website: this.profileForm.value.firmWebsiteControl,
        firm_type_id: this.profileForm.value.firmTypeControl,
        currencyID: this.profileForm.value.defaultCurrencyControl ?? 0,
        aum: this.profileForm.value.assetsUnderManagementControl
          ? this.profileForm.value.assetsUnderManagementControl
          : 0,
      };
      if (!this.profileForm.value.assetsUnderManagementControl) {
        this.profileForm.patchValue({
          assetsUnderManagementControl: 0,
        });
      }

      this.firmSettingsService
        .saveFirmProfile(this.firmId, this.firm_profile_copy)
        .pipe(finalize(() => (this.saving = false)))
        .subscribe(() => this.toaster.success('Your changes have been saved'));
    }
  }

  updateContactPersonDetails() {
    this.firm_profile_copy.contactPerson = this.users.find(
      (user) => user.id === this.firm_profile_copy.contactPerson.id
    );
  }

  getErrorMessage(controlName: string, fieldName?: string): string {
    const control = this.profileForm.get(controlName);
    const hasError =
      control && control?.touched && control?.invalid && control?.errors;
    if (hasError && control.errors.required) {
      return this.interpolatePipe.transform(
        errorMessageMap?.required,
        fieldName
      );
    }
    if (hasError && control.errors.pattern) {
      if (controlName === 'nameControl') {
        return this.interpolatePipe.transform(
          errorMessageMap?.avoidFirstSplCharacter,
          fieldName
        );
      }
      if (controlName === 'assetsUnderManagementControl') {
        return this.interpolatePipe.transform(
          errorMessageMap?.pattern,
          'Non-negative integers up to 2 decimals are allowed'
        );
      }
    }
    if (controlName === 'nameControl') {
      return this.interpolatePipe.transform(
        errorMessageMap?.containsHtml,
        fieldName
      );
    }
    return '';
  }

  isControlInvalid(controlName: string): boolean {
    const control = this.profileForm.get(controlName);
    return control && control?.touched && control?.invalid;
  }

  isControlValid(controlName: string): boolean {
    const control = this.profileForm.get(controlName);
    return control && control?.touched && control?.valid;
  }
}

