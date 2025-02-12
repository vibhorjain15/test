import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import { HttpClient } from '@angular/common/http';
import { UtilsService } from 'src/app2/services/utils.service';
import { Store } from '@ngxs/store';
import { RouterService } from 'src/app2/services/router.service';
import { privateFundsService } from './private-funds.service';
import { toMillionPipe } from 'src/app2/shared/pipes/to-million.pipe';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-private-funds',
  templateUrl: './private-funds.component.html',
})
export class PrivateFundsComponent implements OnInit {
  firmCRD: any;
  loading_grid: boolean = false;
  isFormADVSubscription: any;
  formadv_firm: any = [];
  regulatorsColumnDefs: any;
  gridDatasource: any = [];

  constructor(
    private services: privateFundsService,
    private router: RouterService,
    private store: Store,
    private Utils: UtilsService,
    private readonly toaster: ToastrService,
    private readonly http: HttpClient,
    private readonly pipe: toMillionPipe,
    private routerState: ActivatedRoute
  ) {
    this.firmCRD = this.router.getState(this.routerState).params.firmCRD;
    this.isFormADVSubscription = this.Utils.isFormADVSubscription;
  }
  ngOnInit(): void {
    this.loading_grid = false;
    this.getGridDatasource(this.firmCRD);
    this.http
      .get(`formadv_firms/${this.firmCRD}`)
      .subscribe((response: any) => {
        this.formadv_firm = response;
        this.loading_grid = true;
      });

    this.regulatorsColumnDefs = this.services.getServiceProvidersColDef();
    this.store.dispatch(
      new SetDefaultColumnDef({
        ['formadv-private-funds']: this.regulatorsColumnDefs,
      })
    );
  }

  getGridDatasource(firmCRD) {
    let self = this;
    self.loading_grid = false;
    self.toaster.info('Please wait...');
    try {
      self.toaster.clear();
      self.http.get(`formadv_funds?id=${firmCRD}`).subscribe(
        (response: any) => {
          self.toaster.clear();
          self.loading_grid = true;
          self.gridDatasource = response.map((firm) => {
            if (firm.assets)
              firm.assets = this.pipe.convertToMillion(firm.assets);
            return firm;
          });
        },
        (error: any) => {
          self.loading_grid = false;
          self.toaster.clear();
        }
      );
    } catch (error) {
      self.toaster.clear();
    }
  }
}
