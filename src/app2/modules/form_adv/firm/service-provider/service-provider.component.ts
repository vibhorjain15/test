import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';
import { UtilsService } from 'src/app2/services/utils.service';
import { RouterService } from 'src/app2/services/router.service';
import { forkJoin } from 'rxjs';
import { Location } from '@angular/common';
import { UserState } from 'src/app2/store/user/user.state';
import { Select } from '@ngxs/store';
import { take } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import * as c3 from 'c3';

@Component({
  selector: 'app-service-provider',
  templateUrl: './service-provider.component.html',
})
export class ServiceProviderComponent implements OnInit {
  unique_name: any;
  type: any;
  defaultColorScheme: any;
  Restangular: any;
  provider: any;
  private advClientBreakdownConfig;
  client_total: any;
  client: any;
  columns_status: any;
  clients: any;
  sum_of_gross_assets: number;
  roles: any;
  $window: any;
  loading_grid: boolean = false;
  @Select(UserState.getFirmPreferenceData) firmPref;

  constructor(
    private _location: Location,
    private readonly routerService: RouterService,
    private router: RouterService,
    private Utils: UtilsService,
    private readonly toaster: ToastrService,
    private readonly http: HttpClient,
    private routerState: ActivatedRoute
  ) {
    this.unique_name = this.router.getState(
      this.routerState
    ).params.unique_name;
    this.type = this.router.getState(this.routerState).params.type;
    this.firmPref.pipe(take(2)).subscribe((pref) => {
      if (pref) {
        this.defaultColorScheme = this.Utils.getFirmColorScheme(pref);
      }
    });
  }

  async ngOnInit() {
    this.advClientBreakdownConfig = {
      bindto: '#advClientsBreakdown',
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
        pattern: this.defaultColorScheme || ['#008C97', '#C0CA33'],
      },
    };

    await this.loadAllData(`name=${this.unique_name}&type=${this.type}`);

    setTimeout(() => {
      c3.generate(this.advClientBreakdownConfig);
    }, 100);
  }

  async loadAllData(params) {
    let self = this;
    self.loading_grid = false;
    this.toaster.info('Please wait...');
    return new Promise(async function (resolve, reject) {
      try {
        self.toaster.clear();
        let requestOne = self.http.get(`formadv_service_providers?${params}`);
        let requestTwo = self.http.get(
          `formadv_service_providers/client_breakdown?${params}`
        );
        let requestThree = self.http.get(
          `formadv_service_providers/top_clients?${params}`
        );
        let requestFour = self.http.get(
          `formadv_service_providers/focus_areas?${params}`
        );

        forkJoin([requestOne, requestTwo, requestThree, requestFour]).subscribe(
          (responseList: any) => {
            self.provider = responseList[0];
            self.client = responseList[1];
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

            self.clients = responseList[2];

            let sum_of_gross_assets = 0;
            self.clients.map((client: { value: number }, i: any) => {
              sum_of_gross_assets += client.value;
            });

            self.sum_of_gross_assets = sum_of_gross_assets;

            self.client_total = self.client.length;

            if (!self.client_total) {
              self.advClientBreakdownConfig.data.empty.label.text =
                'No data available';
              return;
            }

            self.roles = responseList[3];
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

  goBack() {
    this._location.back();
  }

  navigateToUrl(obj) {
    this.routerService.navigateWithParams(
      'app.form_adv.service_provider',
      obj,
      { reload: true }
    );
  }
}
