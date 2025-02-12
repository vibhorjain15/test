import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import { HttpClient } from '@angular/common/http';
import { UtilsService } from 'src/app2/services/utils.service';
import { Store } from '@ngxs/store';
import { RouterService } from 'src/app2/services/router.service';
import { privateFundsDetailService } from './private-funds-detail.service';
import { Location } from '@angular/common'
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-private-fund-detail',
  templateUrl: './private-fund.component.html',
})
export class PrivateFundComponent implements OnInit {
  firmCRD: any;
  loading_grid: boolean = false;
  columnDefs: any;
  sequence_id: any;
  defaultColorScheme: any;
  fund: any;
  columns_asset: any;
  //advOwnershipBreakdownConfig: any;
  gridDatasource: any = [];

  constructor(private _location: Location, private services: privateFundsDetailService, private router: RouterService, private store: Store, private Utils: UtilsService, private readonly toaster: ToastrService, private readonly http: HttpClient,private routerState: ActivatedRoute) {
    this.firmCRD =this.router.getState(this.routerState).params.firmCRD;
    this.sequence_id = this.router.getState(this.routerState).params.sequence_id;
    this.defaultColorScheme = this.Utils.getFirmColorScheme;
  }

  ngOnInit(): void {
    this.loading_grid = false;
    this.http.get(`formadv_funds?id=${this.firmCRD}&sequence_id=${this.sequence_id}`).subscribe((response: any) => {
      this.fund = response;
      this.columns_asset = [];
      this.columns_asset.push(['Related Parties (%)', this.fund.owner_related]);
      this.columns_asset.push(['Fund of Funds (%)', this.fund.owner_fof]);
      this.columns_asset.push(['Non-us Persons(%)', this.fund.owner_non_us]);
      this.columns_asset.push(['Others (%)', this.fund.owner_other]);

      //this.advOwnershipBreakdownConfig.data.columns = this.columns_asset;

      this.http.get(`formadv_service_providers?id=${this.firmCRD}&sequence_id=${this.sequence_id}`).subscribe((response: any) => {
        this.gridDatasource = response;
        this.loading_grid = true;
      });

    });

    this.columnDefs = this.services.getServiceProvidersColDef();
    this.store.dispatch(
      new SetDefaultColumnDef({ ['formadv-private-fund-service-provider']: this.columnDefs })
    );
  }

  goBack() {
    this._location.back();
  }
  returnToList() {
    this.router.navigate('app.form_adv.regulatory_monitor.portfolio');
  }
}


