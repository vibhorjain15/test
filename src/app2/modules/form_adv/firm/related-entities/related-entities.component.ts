import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngxs/store';
import { RouterService } from 'src/app2/services/router.service';
import { realtedEntitiesService } from './related-entities.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-related-entities',
  templateUrl: './related-entities.component.html',
})
export class RelatedEntitiesComponent implements OnInit {
  firmCRD: any;
  loading_grid: boolean = false;
  formadv_firm: any = [];
  columnDefs: any;
  gridDatasource: any = [];

  constructor(
    private services: realtedEntitiesService,
    private router: RouterService,
    private store: Store,
    private readonly toaster: ToastrService,
    private readonly http: HttpClient,
    private routerState: ActivatedRoute
  ) {
    this.firmCRD = this.router.getState(this.routerState).params.firmCRD;
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

    this.columnDefs = this.services.getServiceProvidersColDef();
    this.store.dispatch(
      new SetDefaultColumnDef({ ['formadv-related-entities']: this.columnDefs })
    );
  }

  getGridDatasource(firmCRD) {
    let self = this;
    self.loading_grid = false;
    self.toaster.info('Please wait...');
    try {
      self.toaster.clear();
      self.http.get(`formadv_related_entities?id=${firmCRD}`).subscribe(
        (response: any) => {
          self.toaster.clear();
          self.loading_grid = true;
          self.gridDatasource = response;
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

