import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { BaseDataService } from './base-data.service';

@Injectable({
  providedIn: 'root',
})
export class ManageAddressService {
  constructor(
    private readonly http: HttpClient,
    private readonly baseDataService: BaseDataService,
    private toaster: ToastrService
  ) {}

  private addressList: Array<any> = new Array<any>();
  get addresses() {
    return this.addressList;
  }

  private countryList: Array<any> = new Array<any>();
  get countries() {
    return this.countryList;
  }

  private addressChanges = new Subject<any>();
  addressChanged$ = this.addressChanges.asObservable();

  getAddresses(params, success) {
    this.baseDataService.getAddresses(params).subscribe((response: any) => {
      this.addressList = response;
      this.getCountries(success);
    });
  }

  getCountries(success) {
    this.http.get('country').subscribe((response: any) => {
      this.countryList = response;
      this.addressList.forEach((address) => {
        address.country_name = this.getCountryNameFromId(address.country);
      });
      success();
    });
  }

  getCountryNameFromId(id) {
    const country = this.countryList.find((country) => country.id === id);
    return country ? country.value : '';
  }

  addAddress(payload, callback, errorCallback) {
    this.http.post(`entity_addresses`, payload).subscribe(
      (response: any) => {
        this.toaster.success('Address successfully added');
        response.country_name = this.getCountryNameFromId(response.country);
        this.addressList.unshift(response);
        this.addressChanges.next();
        callback();
      },
      (error) => {
        errorCallback(error);
      }
    );
  }

  updateAddress(payload, callback, errorCallback) {
    this.http.put(`entity_addresses/${payload.id}`, payload).subscribe(
      (response: any) => {
        this.toaster.success('Address successfully updated');
        response.country_name = this.getCountryNameFromId(response.country);
        const index = this.addressList.findIndex((x) => x.id === response.id);
        this.addressList[index] = response;
        this.addressChanges.next();
        callback();
      },
      (error) => {
        errorCallback(error);
      }
    );
  }

  deleteAddress(id) {
    this.baseDataService.deleteAddress(id).subscribe(() => {
      this.toaster.success('Address successfully deleted');
      const index = this.addressList.findIndex((x) => x.id === id);
      this.addressList.splice(index, 1);
      this.addressChanges.next();
    });
  }
}
