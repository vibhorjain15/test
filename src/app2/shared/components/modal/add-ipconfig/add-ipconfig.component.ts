import { Component, DoCheck, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { IpConfigService } from 'src/app2/services/ip-configurations/ip-configuration.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { IpRequestType } from 'src/app2/services/ip-configurations/ip-configuration.type';
import { IpRegex } from './ad-ipconfig.util';
import { validateAllFormFields } from 'src/app2/modules/firm-settings/tags-modal/tags-modal.util';

@Component({
  selector: 'add-ipconfig',
  templateUrl: './add-ipconfig.component.html',
})
export class AddIpConfigModal implements OnInit, DoCheck {
  currentIp: string;
  loading: boolean = false;
  ipConfigForm: FormGroup;
  ip_configurations_length: number;
  rangeOfIPs: any;
  constructor(
    private readonly IpConfigService: IpConfigService,
    private readonly Util: UtilsService,
    private readonly BaseDataService: BaseDataService
  ) {}
  ngOnInit() {
    this.currentIp = this.IpConfigService.currentIpAddress;
    this.ip_configurations_length =
      this.IpConfigService.ip_configurations.length;
    let currentDate = new Date();
    const name =
      'IP ' +
      (currentDate.getMonth() + 1) +
      '-' +
      currentDate.getDate() +
      '-' +
      currentDate.getFullYear();
    this.ipConfigForm = new FormGroup({
      name: new FormControl(name, [Validators.required]),
      start_ip: new FormControl('', [IpRegex]),
      end_ip: new FormControl('', [IpRegex]),
      is_single_ip: new FormControl(false),
    });
  }

  ngDoCheck() {
    if (!this.ipConfigForm.value.is_single_ip) {
      this.ipConfigForm
        .get('end_ip')
        .setValidators([Validators.required, IpRegex]);
    } else {
      this.ipConfigForm.get('end_ip').clearValidators();
    }
    this.ipConfigForm.get('end_ip').updateValueAndValidity();
    if (this.ipConfigForm.value.start_ip && this.ipConfigForm.value.end_ip) {
      this.rangeOfIPs = this.Util.getRangeOfIP(
        this.ipConfigForm.value.start_ip,
        this.ipConfigForm.value.end_ip
      );
    }
  }

  addCurrentIP() {
    this.ipConfigForm.patchValue({
      start_ip: this.currentIp,
      is_single_ip: true,
    });
  }

  toggleIPAdditionMode() {
    this.ipConfigForm.patchValue({
      is_single_ip: !this.ipConfigForm.value.is_single_ip,
    });
  }

  save(callback) {
    validateAllFormFields(this.ipConfigForm);
    if (
      this.ipConfigForm.value.start_ip &&
      this.ipConfigForm.value.end_ip &&
      (this.rangeOfIPs < 0 || !this.rangeOfIPs)
    ) {
      return;
    } else if (this.ipConfigForm.valid) {
      this.loading = true;
      const { name, start_ip, end_ip, is_single_ip } = this.ipConfigForm.value;
      const params: IpRequestType = {
        name,
        start_ip,
        end_ip,
      };
      if (is_single_ip) params.end_ip = start_ip;
      this.IpConfigService.createIpConfig(
        params,
        () => {
          this.loading = false;
          callback();
        },
        (error) => {
          this.loading = false;
          const avoid_error_logging_statuses =
            this.BaseDataService.getAvoidErrorLoggingStatusList();
          if (
            !Array.from(avoid_error_logging_statuses).includes(error.status)
          ) {
            this.Util.logError('Deleting IP whitelisting failed', error);
          }
        }
      );
    }
  }
}
