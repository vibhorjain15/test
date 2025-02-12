import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { RouterService } from 'src/app2/services/router.service';

@Component({
  selector: 'app-recent-sec-adv-updates',
  templateUrl: './recent-sec-adv-updates.component.html',
})
export class RecentSecAdvUpdatesComponent implements OnInit {
  public gridDataSource: any = [];
  isLoading = false;
  constructor(
    private router: RouterService,
    private readonly toaster: ToastrService,
    private readonly http: HttpClient
  ) {}

  ngOnInit(): void {
    this.getDataSource();
  }

  getDataSource() {
    let self = this;
    self.isLoading = true;
    // this.toaster.info('Please wait...');
    let url = '/formadv_firms';
    try {
      self.toaster.clear();
      self.http.get(url).subscribe(
        (response: any) => {
          self.toaster.clear();
          self.gridDataSource = response;
          self.isLoading = false;
        },
        (error: any) => {
          self.toaster.clear();
        }
      );
    } catch (error) {
      self.toaster.clear();
    }
  }

  redirectToFirmSnapShot(firmId) {
    this.router.navigateWithParams('app.form_adv.firm.snapshot', {
      firmCRD: firmId,
    });
  }

  redirectToPage() {
    this.router.navigate('app.form_adv.regulatory_monitor.explore');
  }
}
