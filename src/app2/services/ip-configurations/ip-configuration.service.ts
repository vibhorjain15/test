import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { UtilsService } from '../utils.service';
import { IIpConfigurations, IpRequestType } from './ip-configuration.type';

@Injectable({
  providedIn: 'root',
})
export class IpConfigService {
  constructor(
    private readonly http: HttpClient,
    private readonly toaster: ToastrService,
    private readonly Utils: UtilsService
  ) {}

  ip_configurations: IIpConfigurations[] = [];
  currentIP: string;

  get ipConfigurations() {
    return this.ip_configurations;
  }

  get currentIpAddress() {
    return this.currentIP;
  }

  getIpConfigurations(success) {
    this.http.get(`ip_configurations`).subscribe((response: any) => {
      this.ip_configurations = response;
      this.ip_configurations.forEach((config) => {
        config.number_of_IPs = this.Utils.getRangeOfIP(
          config.start_ip,
          config.end_ip
        );
      });
      success();
    });
  }

  getCurrentIP(success) {
    this.http
      .get(`ip_configurations/logged_in_ip_address`)
      .subscribe((response: any) => {
        this.currentIP = response.ip_address;
        success();
      });
  }

  removeIPConfiguration(
    configuration: any,
    idx: any,
    successCallback,
    failCallback
  ) {
    this.http.delete(`ip_configurations/${configuration.id}`).subscribe(
      (response: any) => {
        this.ip_configurations.splice(idx, 1);
        this.toaster.success('IP whitelisting successfully removed!');
        successCallback();
      },
      (error: any) => {
        this.toaster.error('Unable to remove IP whitelisting!');
        failCallback(error);
      }
    );
  }

  createIpConfig(request: IpRequestType, success, failure) {
    this.http.post(`ip_configurations`, request).subscribe(
      (response: IIpConfigurations) => {
        response.number_of_IPs = this.Utils.getRangeOfIP(
          response.start_ip,
          response.end_ip
        );
        this.ip_configurations.push(response);
        this.toaster.success('IP whitelisting updated successfully!');
        success();
      },
      (error) => {
        this.toaster.error('Something went wrong. Please try again!');
        failure(error);
      }
    );
  }
}
