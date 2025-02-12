import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ManageAddressService } from 'src/app2/services/manage-address.service';
import { errorMessageMap, Regex } from '../../constants/constant';

@Component({
  selector: 'app-manage-address',
  templateUrl: './manage-address.component.html',
  styleUrls: ['./manage-address.component.css'],
})
export class ManageAddressModal implements OnInit {
  edit_mode: boolean;
  addressForm: FormGroup;
  loading: boolean;
  countries: any[];
  @Input() address: any;
  @Input() entity_id: number;
  @Input() entity_type: string;
  errorMessageMap = errorMessageMap;

  constructor(private readonly manageAddressService: ManageAddressService) {}

  ngOnInit(): void {
    this.createAddressForm();
    this.countries = this.manageAddressService.countries;
    if (this.address) {
      this.edit_mode = true;
    }
  }

  createAddressForm() {
    this.addressForm = new FormGroup({
      address_line_1: new FormControl(
        this.address ? this.address.address_line_1 : '',
        [
          Validators.required,
          Validators.maxLength(250),
          Validators.pattern(Regex.avoidFirstSplCharacter),
        ]
      ),
      address_line_2: new FormControl(
        this.address ? this.address.address_line_2 : '',
        [
          Validators.maxLength(250),
          Validators.pattern(Regex.avoidFirstSplCharacter),
        ]
      ),
      city: new FormControl(this.address ? this.address.city : '', [
        Validators.required,
        Validators.maxLength(50),
        Validators.pattern(Regex.validCityName),
      ]),
      state: new FormControl(this.address ? this.address.state : '', [
        Validators.required,
        Validators.maxLength(50),
        Validators.pattern(Regex.validCityName),
      ]),
      zip_code: new FormControl(this.address ? this.address.zip_code : '', [
        Validators.maxLength(10),
        Validators.pattern(Regex.validZipcode),
      ]),
      country: new FormControl(
        this.address ? this.address.country : null,
        Validators.required
      ),
      phone_1: new FormControl(this.address ? this.address.phone_1 : '', [
        Validators.maxLength(30),
        Validators.pattern(Regex.validPhoneCharsOnly),
      ]),
      phone_2: new FormControl(this.address ? this.address.phone_2 : '', [
        Validators.maxLength(30),
        Validators.pattern(Regex.validPhoneCharsOnly),
      ]),
      fax: new FormControl(this.address ? this.address.fax : '', [
        Validators.maxLength(30),
        Validators.pattern(Regex.validPhoneCharsOnly),
      ]),
      is_headquarter: new FormControl(
        this.address ? this.address.is_headquarter : false
      ),
      entity_id: new FormControl(this.entity_id, Validators.required),
      entity_type: new FormControl(this.entity_type, Validators.required),
    });
  }

  onHeadquarterValueChange(event) {
    this.addressForm.get('is_headquarter').patchValue(event);
  }

  submit(modalCallback) {
    this.addressForm.markAllAsTouched();
    if (!this.addressForm.valid) {
      return;
    }
    this.loading = true;
    const formObj = this.addressForm.value;
    if (this.address) {
      formObj.id = this.address.id;
    }

    if (this.edit_mode) {
      this.manageAddressService.updateAddress(
        formObj,
        () => {
          this.successCallback(modalCallback);
        },
        () => {
          this.errorCallback(modalCallback);
        }
      );
    } else {
      this.manageAddressService.addAddress(
        formObj,
        () => {
          this.successCallback(modalCallback);
        },
        () => {
          this.errorCallback(modalCallback);
        }
      );
    }
  }

  successCallback(modalCallback) {
    this.loading = false;
    modalCallback();
  }

  errorCallback(errorCallback) {
    this.loading = false;
  }
}
