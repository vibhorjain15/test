import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';

@Component({
  selector: 'app-form-adv-actions',
  templateUrl: './form-adv-actions.component.html',
})
export class FormAdvActionsComponent implements ICellRendererAngularComp {
  params: any;
  value: number;
  field: string;
  constructor(
    private readonly http: HttpClient,
    private readonly toaster: ToastrService,
    private readonly SweetAlert: SweetAlertService
  ) {}

  refresh(params: ICellRendererParams): boolean {
    this.params = params;

    return true;
  }

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.field = this.params.colDef.field;
  }

  addFirmCRD(data) {
    const params = { firmCrd: data.firmCRD, assigned_to: null };
    params.assigned_to = this['activeTeamMember_id']
      ? this['activeTeamMember_id']
      : null;
    this.http
      .post(`Firm_FirmCRD_Mappings`, params)
      .subscribe((response: any) => {
        this.toaster.success(
          `Tracking added for CRD #${data.firmCRD}`
        );
        data.is_tracking = true;
        //this.params.refreshGrid();
      });
  }

  confirmMappingRemoval(data) {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to stop tracking this firm?',
      confirmButtonText: 'Yes',
      showLoaderOnConfirm: true,
      preConfirm: () => {
        this.http
          .delete(`Firm_FirmCRD_Mappings`, {
            params: {
              firmCrd: data.firmCRD,
            },
          })
          .subscribe((response: any) => {
            this.toaster.success(`Tracking removed for CRD #${data.firmCRD}`);
            //this.params.refreshGrid();
            data.is_tracking = false;
          });
      },
    });
  }
}
