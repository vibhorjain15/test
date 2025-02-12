import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { RouterService } from 'src/app2/services/router.service';

@Component({
  selector: 'vehicle-reroute',
  template: `<router-outlet></router-outlet>`,
})
export class VehicleReRoutePageComponent implements OnInit {
  isLoading = true;
  constructor(
    private readonly router: ActivatedRoute,
    private readonly dataService: BaseDataService,
    private readonly route: Router
  ) {}
  ngOnInit(): void {
    const vehicleId = this.router.snapshot.params.vehicleId;

    const childState = window.location.href.split('vehicles')[1];
    this.dataService
      .getPermissionEntityDetails(vehicleId, 'Vehicle')
      .subscribe((response: any) => {
        const { firm_id, fund_id } = response;

        this.route.navigateByUrl(
          `app/firms/${firm_id}/funds/${fund_id}/vehicles${childState}`,
          {
            replaceUrl: true,
          }
        );
      });
  }
}
