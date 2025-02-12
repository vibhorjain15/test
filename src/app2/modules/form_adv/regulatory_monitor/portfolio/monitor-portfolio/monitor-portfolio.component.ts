import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';
import { UserState } from 'src/app2/store/user/user.state';
import { Select, Store } from '@ngxs/store';
import { take } from 'rxjs/operators';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import { monitorPortfolioService } from './monitor-portfolio.service';
import { RouterService } from 'src/app2/services/router.service';
import { DownloadMedium } from 'src/app2/shared/constants/constant';
import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';

@Component({
  selector: 'app-monitor-portfolio',
  templateUrl: './monitor-portfolio.component.html',
})
export class MonitorPortfolioComponent implements OnInit {
  username: any;
  resource: any;
  frequency: any;
  columnDefs: any;
  gridDatasource: any = [];
  loading_grid: boolean;
  downloadMedium;
  @Select(UserState.getCurrentUserData) user$;

  constructor(
    private router: RouterService,
    private readonly toaster: ToastrService,
    private services: monitorPortfolioService,
    private store: Store,
    private readonly http: HttpClient,
    private readonly routerService: RouterService,
    private readonly dvDatePipe: DvDatePipe
  ) {}

  ngOnInit(): void {
    this.user$
      .pipe(
        take(1),
      )
      .subscribe((user) => {
        if (user) {
          this.username = JSON.parse(JSON.stringify(user)).userName;
          this.downloadMedium = user.firmInfo.preferences.doc_access_preference;
        }
      });
    this.getGridDatasource();
    this.getAlertFrequency();
    this.columnDefs = this.services.getActionsColDef();
    this.store.dispatch(
      new SetDefaultColumnDef({
        ['formadv-regulatory-monitor-portfolio']: this.columnDefs,
      })
    );
  }

  getAlertFrequency() {
    this.http
      .get('firm_preferences/alert_frequency')
      .subscribe((response: any) => {
        return (this.frequency = response);
      });
  }

  getGridDatasource() {
    let self = this;
    self.loading_grid = false;
    try {
      self.toaster.clear();
      self.http.get('formadv_firms').subscribe(
        (response: any) => {
          self.toaster.clear();
          self.loading_grid = true;
          response = response.map((item) => {
            item.filingDate = this.dvDatePipe.transform(item.filingDate, [
              'isLocaleDate',
            ]);
            return item;
          });
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

  downloadMyPortfolioToExcel() {
    this.toaster.info('Request being processed.');
    let email = this.username.replace(/\+/gi, '%2B');
    this.http
      .get(`firm_firmcrd_mappings/export?recipients=${email}`)
      .subscribe((response: any) => {
        let message =
          "Once the document is ready for download, it will be accessible in the 'My Downloads' section.";
        if (this.downloadMedium == DownloadMedium.BOTH) {
          message =
            "Once the document is ready for download, it will be accessible in the 'My Downloads' section and in your inbox.";
        }
        this.toaster.success(message, 'Request processed successfully.');
      });
  }

  redirectTo(url) {
    this.router.navigate(url);
  }

  ChangeAlertFrequency(url) {
    this.routerService.navigateWithParams(url, {
      '#': 'RegulatoryFilings',
    });
  }
}


