import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { UtilsService } from 'src/app2/services/utils.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { IpConfigService } from 'src/app2/services/ip-configurations/ip-configuration.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { finalize } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-ip-configurations',
  templateUrl: './ip-configurations.component.html',
  styleUrls: ['./ip-configurations.component.css'],
})
export class IpConfigurationsComponent implements OnInit {
  ip_configurations;
  currentIP;
  is_admin: any;
  panelHeadingControls = [];

  constructor(
    private readonly Utils: UtilsService,
    private readonly ModalFactory: CustomModalService,
    private readonly IpConfig: IpConfigService,
    private readonly SweetAlert: SweetAlertService,
    private readonly BaseDataService: BaseDataService,
    private readonly http: HttpClient,
    private readonly toaster: ToastrService
  ) {}

  ngOnInit(): void {
    this.setPanelHeadingControls();
    this.IpConfig.getIpConfigurations(() => {
      this.ip_configurations = this.IpConfig.ipConfigurations;
    });
    this.IpConfig.getCurrentIP(() => {
      this.currentIP = this.IpConfig.currentIpAddress;
    });
  }

  setPanelHeadingControls() {
    this.panelHeadingControls = [
      {
        handleClick: this.addIPConfig.bind(this),
        text: '  New whitelisting',
        leftIcon: 'plus',
        tooltip: 'Add new whitelisting',
      },
    ];
  }

  addIPConfig() {
    this.ModalFactory.invoke('add-ipconfig', { class: 'gray modal-lg' });
  }

  removeIPConfiguration(configuration: any, idx: any, resolve) {
    this.http
      .delete(`ip_configurations/${configuration.id}`)
      .pipe(finalize(() => resolve()))
      .subscribe(
        (response: any) => {
          this.ip_configurations.splice(idx, 1);
          this.toaster.success('IP whitelisting successfully removed!');
        },
        (error: any) => {
          this.toaster.error('Unable to remove IP whitelisting!');
          const avoid_error_logging_statuses =
            this.BaseDataService.getAvoidErrorLoggingStatusList();
          if (
            !Array.from(avoid_error_logging_statuses).includes(error.status)
          ) {
            this.Utils.logError('Deleting IP whitelisting failed', error);
          }
        }
      );
  }

  confirmRemoveIP(configuration: any, idx: any) {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to remove this IP whitelisting?',
      confirmButtonText: 'Remove',
      focusCancel: true,
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.removeIPConfiguration(configuration, idx, resolve);
        });
      },
    }).then(() => {
      Swal.close();
    });
  }

  trackByIndex(index: number, element): number {
    return index;
  }
}
