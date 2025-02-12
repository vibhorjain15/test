import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { RouterService } from 'src/app2/services/router.service';

@Component({
  selector: 'app-form-adv-change-count',
  templateUrl: './form-adv-change-count.component.html'
})
export class FormAdvChangeCountComponent implements ICellRendererAngularComp {
  params: any;
  value: number;
  field: string;

  constructor(private readonly routerService: RouterService) { }

  refresh(): boolean {
    return false;
  }

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.field = this.params.colDef.field;
  }

  navigateToUrl(firmCRD) {
    this.routerService.navigateWithParams('app.form_adv.firm.filings_history', {
      firmCRD: firmCRD
    });
  }

}
