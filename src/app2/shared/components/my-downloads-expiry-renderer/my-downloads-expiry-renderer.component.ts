import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import * as moment from 'moment';
import { UtilsService } from 'src/app2/services/utils.service';
import { DvDatePipe } from '../../pipes/dv-date.pipe';

@Component({
  selector: 'app-my-downloads-expiry-renderer',
  templateUrl: './my-downloads-expiry-renderer.component.html',
})
export class MyDownloadExpiryRenderer implements ICellRendererAngularComp {
  params;
  expiry_date;
  constructor(
    private readonly utils: UtilsService,
    private dvDatePipe: DvDatePipe
  ) {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
    if (moment().isAfter(params?.data?.expiry_date) || params?.data?.expired) {
      this.expiry_date = this.dvDatePipe.transform(params?.data?.expiry_date, [
        'isLocaleDate',
      ]);
    } else {
      this.expiry_date = this.utils.convertDateIntoExpiryDate(
        params?.data?.expiry_date
      );
    }
  }
}
