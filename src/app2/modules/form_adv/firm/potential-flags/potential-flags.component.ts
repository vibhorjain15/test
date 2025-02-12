import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';
import { UtilsService } from 'src/app2/services/utils.service';
import { RouterService } from 'src/app2/services/router.service';
import { forkJoin } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-potential-flags',
  templateUrl: './potential-flags.component.html',
})
export class PotentialFlagsComponent implements OnInit {
  firmCRD: any;
  displayFlags: any = [];
  loading_grid: boolean = false;
  formadv_firm: any = [];
  flags: any = [];
  grouped_flags: any = [];
  keyValuePipeDefaultOrder;
  constructor(
    private router: RouterService,
    private Utils: UtilsService,
    private readonly toaster: ToastrService,
    private readonly http: HttpClient,
    private routerState: ActivatedRoute
  ) {
    this.firmCRD = this.router.getState(this.routerState).params.firmCRD;
  }

  async ngOnInit() {
    this.keyValuePipeDefaultOrder = this.Utils.keyValuePipeDefaultOrder;
    this.displayFlags =
      this.Utils.isFormADVAnalyticsSubscription() ||
      this.Utils.isProductiveSubscription() ||
      this.Utils.isSmartSubscription();
    await this.loadAllData(this.firmCRD);
  }

  async loadAllData(firmCRD) {
    let self = this;
    self.loading_grid = false;
    this.toaster.info('Please wait...');
    return new Promise(async (resolve, reject) => {
      try {
        self.toaster.clear();
        let formadvReq = self.http.get(`formadv_firms/${firmCRD}`);
        let flagsReq = self.http.get(`formadv_flags/${firmCRD}`);
        forkJoin([formadvReq, flagsReq]).subscribe(
          (responseList: any) => {
            if (responseList?.length) {
              self.formadv_firm = responseList[0];
              self.flags = responseList[1];
            }

            if (self.flags.length) {
              self.groupFlags();
            }

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
  groupFlags() {
    this.grouped_flags = [];
    this.grouped_flags = this.Utils.groupBy(this.flags, 'type');
  }
}
