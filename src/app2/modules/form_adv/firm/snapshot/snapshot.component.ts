import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';
import { UtilsService } from 'src/app2/services/utils.service';
import { RouterService } from 'src/app2/services/router.service';
import { forkJoin } from 'rxjs';
import { snapshotService } from './snapshot-service';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import { UserState } from 'src/app2/store/user/user.state';
import { Select, Store } from '@ngxs/store';
import { take } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import * as c3 from 'c3';

@Component({
  selector: 'app-snapshot',
  templateUrl: './snapshot.component.html',
})
export class SnapshotComponent implements OnInit {
  firmCRD: any;
  colorScheme: any;
  formadv_firm: any = [];
  printOptions: { pageTitle: string };
  private advAssetBreakdownConfig;
  profile: any = [];
  gridServiceDatasource: any = [];
  gridRegulatorsDatasource: any = [];
  columns_asset: any;
  private advClientBreakdownConfig;
  client_total: any;
  client: any = [];
  columns_status: any;
  loading_grid: boolean = false;
  toggling_ADV_tracking: boolean = false;
  serviceColumnDefs: any;
  regulatorsColumnDefs: any;
  @Select(UserState.getFirmPreferenceData) firmPref;

  constructor(
    private services: snapshotService,
    private router: RouterService,
    private store: Store,
    private Utils: UtilsService,
    private readonly toaster: ToastrService,
    private readonly http: HttpClient,
    private routerState: ActivatedRoute
  ) {
    this.firmCRD = this.router.getState(this.routerState).params.firmCRD;
  }

  async ngOnInit() {
    this.firmPref.pipe(take(2)).subscribe((pref) => {
      if (pref) {
        this.colorScheme = this.Utils.getFirmColorScheme(pref);
      }
    });
    this.advAssetBreakdownConfig = {
      bindto: '#advAssetBreakdown',
      data: {
        columns: [],
        type: 'donut',
        empty: {
          label: {
            text: 'Loading...',
          },
        },
      },
      donut: {
        title: '',
      },
      color: {
        pattern: this.colorScheme || ['#008C97', '#C0CA33'],
      },
    };

    this.advClientBreakdownConfig = {
      bindto: '#advClientBreakdown',
      data: {
        columns: [],
        type: 'donut',
        empty: {
          label: {
            text: 'Loading...',
          },
        },
      },
      donut: {
        title: '',
      },
      color: {
        pattern: this.colorScheme || [
          '#073336',
          '#C0CA33',
          '#7FCCC1',
          '#008C97',
          'ff6666',
        ],
      },
    };

    await this.loadAllData(this.firmCRD);

    setTimeout(() => {
      c3.generate(this.advAssetBreakdownConfig);
      c3.generate(this.advClientBreakdownConfig);
    }, 100);

    this.serviceColumnDefs = this.services.getServiceProvidersColDef();
    this.store.dispatch(
      new SetDefaultColumnDef({
        ['formadv-firm-service-providers']: this.serviceColumnDefs,
      })
    );

    this.regulatorsColumnDefs = this.services.getRegulatorsColDef();
    this.store.dispatch(
      new SetDefaultColumnDef({
        ['formadv-firm-regulators']: this.regulatorsColumnDefs,
      })
    );
  }

  async loadAllData(firmCRD) {
    let self = this;
    self.loading_grid = false;
    this.toaster.info('Please wait...');
    return new Promise(async (resolve, reject) => {
      try {
        self.toaster.clear();
        let request = self.http.get(`formadv_firms/${firmCRD}`);
        let clientReq = self.http.get(`formadv_firms/${firmCRD}/clients`);
        let profileReq = self.http.get(`formadv_firms/${firmCRD}/profile`);
        let serviceReq = self.http.get(
          `formadv_service_providers?id=${firmCRD}`
        );
        let regularReq = self.http.get(`formadv_regulators?id=${firmCRD}`);
        forkJoin([
          request,
          clientReq,
          profileReq,
          serviceReq,
          regularReq,
        ]).subscribe(
          (responseList: any) => {
            self.formadv_firm = responseList[0];
            self.client = responseList[1];
            self.profile = responseList[2];

            self.printOptions = {
              pageTitle: `DiligenceVault ADV Summary - ${self.formadv_firm.businessName}`,
            };
            self.columns_asset = [];
            self.columns_asset.push([
              'Discretionary AUM (%)',
              self.profile.discretionary_aum,
            ]);
            self.columns_asset.push([
              'Non Discretionary AUM (%)',
              self.profile.non_discretionary_aum,
            ]);
            self.advAssetBreakdownConfig.data.columns = self.columns_asset;

            self.client_total = self.client.length;

            if (!self.client_total) {
              self.advClientBreakdownConfig.data.empty.label.text =
                'No data available';
              return;
            }

            self.columns_status = [];
            self.client.map((item: { label: any; value: any }) => {
              const current_obj = [];
              current_obj.push(item.label);
              current_obj.push(item.value);
              self.columns_status.push(current_obj);
            });

            // Initialising the colums data with the response from json
            self.advClientBreakdownConfig.data.columns = self.columns_status;
            self.gridServiceDatasource = responseList[3];
            self.gridRegulatorsDatasource = responseList[4];

            self.loading_grid = true;
            self.toaster.clear();
            resolve([]);
          },
          (error: any) => {
            self.toaster.clear();
            reject(error);
          }
        );
      } catch (error) {
        self.toaster.clear();
        reject(error);
      }
    });
  }

  toggleADVTracking() {
    let params: { firmCrd: any };
    this.toggling_ADV_tracking = true;
    if (this.formadv_firm.is_tracking) {
      params = { firmCrd: this.formadv_firm.id };

      this.http.delete('Firm_FirmCRD_Mappings', { params }).subscribe(
        (_: any) => {
          this.formadv_firm.is_tracking = false;
          this.toaster.success(
            `Tracking removed for CRD# ${this.formadv_firm.id}`
          );
          this.toggling_ADV_tracking = false;
        },
        (_) => (this.toggling_ADV_tracking = false)
      );
    } else {
      params = { firmCrd: this.formadv_firm.id };

      this.http.post('Firm_FirmCRD_Mappings', params).subscribe(
        (_: any) => {
          this.formadv_firm.is_tracking = true;
          this.toaster.success(
            `Tracking added for CRD# ${this.formadv_firm.id}`
          );
          this.toggling_ADV_tracking = false;
        },
        (_) => (this.toggling_ADV_tracking = false)
      );
    }
  }

  goBack() {
    if (this.formadv_firm.is_tracking) {
      this.router.navigate('app.form_adv.regulatory_monitor.portfolio');
    } else {
      this.router.navigate('app.form_adv.regulatory_monitor.explore');
    }
  }
}
