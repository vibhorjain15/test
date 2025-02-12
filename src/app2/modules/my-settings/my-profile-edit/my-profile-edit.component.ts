import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Regex } from 'src/app2/shared/constants/constant';
import { validateAllFormFields } from 'src/app2/utils/validateAllFormFields';
import { languageCodeMap } from './../../../shared/constants/constant';
import { DvValidators } from 'src/app2/shared/validators/no-white-space.validator';

@Component({
  selector: 'app-my-profile-edit',
  templateUrl: './my-profile-edit.component.html',
  styleUrls: ['./my-profile-edit.component.css'],
})
export class MyProfileEditComponent implements OnInit, OnChanges {
  @Input() userModel;
  @Input() countries;
  @Input() languageCode;
  @Input() loader = false;
  @Output() onSubmit = new EventEmitter();
  @Output() cancelMode = new EventEmitter();
  userProfileForm: FormGroup;
  languageCodeMap = languageCodeMap;
  userProfilePic = {
    avatarURL: '',
    type: '',
  };
 nameValidationError = 'Only Letters, Numbers, and limited special characters (Underscore, Single Quote, Round brackets, Comma, Hyphen, Period) allowed';
  constructor() {}

  ngOnInit(): void {
    this.userProfilePic.avatarURL = this.userModel?.picture_url;
    this.userProfileForm = new FormGroup({
      firstname: new FormControl(this.userModel.firstname || '', [
        DvValidators.required,
        Validators.pattern(Regex.validPersonNames),
      ]),
      lastname: new FormControl(this.userModel.lastname || '', [
        DvValidators.required,
        Validators.pattern(Regex.validPersonNames),
      ]),
      title: new FormControl(this.userModel.title || '', [
        Validators.pattern(Regex.alphaNumericPlus),
      ]),
      userName: new FormControl({
        value: this.userModel.userName || '',
        disabled: true,
      }),
      firm_name: new FormControl({
        value: this.userModel.firm_name || '',
        disabled: true,
      }),
      phoneNumber: new FormControl(this.userModel.phoneNumber || '', [
        Validators.pattern(Regex.validPhoneCharsOnly),
      ]),
      address: new FormControl(this.userModel.address || '', [
        Validators.pattern(Regex.avoidFirstSplCharacter),
      ]),
      city: new FormControl(this.userModel.city || '', [
        Validators.pattern(Regex.validCityName),
      ]),
      state: new FormControl(this.userModel.state || '', [
        Validators.pattern(Regex.validCityName),
      ]),
      zipcode: new FormControl(this.userModel.zipcode || '', [
        Validators.pattern(Regex.validZipcode),
      ]),
      country_id: new FormControl({
        value: this.userModel.country_id || '',
        disabled: !this.countries,
      }),
      languageCode: new FormControl(this.languageCode || 'en'),
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.userModel?.currentValue) {
      this.userProfilePic = {
        avatarURL: changes.userModel?.currentValue.picture_url,
        type: changes.userModel?.currentValue.type,
      };
    }
  }

  submit() {
    if (this.userProfileForm.invalid) return;
    Object.keys(this.userProfileForm.controls).forEach((field) => {
      const control = this.userProfileForm.get(field);
      if (control instanceof FormControl && typeof control.value === 'string') {
        control.patchValue(control.value.trim());
      }
    });
    validateAllFormFields(this.userProfileForm);
    if (this.userProfileForm.valid) {
      this.onSubmit.emit({ ...this.userModel, ...this.userProfileForm.value });
    }
  }
  cancel() {
    this.cancelMode.emit();
  }
}
