import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { RouterService } from 'src/app2/services/router.service';

@Component({
  selector: 'strategy-reroute',
  template: `<router-outlet></router-outlet>`,
})
export class StrategyReRoutePageComponent implements OnInit {
  isLoading = true;
  constructor(
    private readonly router: ActivatedRoute,
    private readonly dataService: BaseDataService,
    private readonly route: Router
  ) {}
  ngOnInit(): void {
    const strategyId = this.router.snapshot.params.strategyId;

    const childState = window.location.href.split('strategies')[1];
    this.dataService
      .getPermissionEntityDetails(strategyId, 'Strategy')
      .subscribe((response: any) => {
        const { entity_id } = response;

        this.route.navigateByUrl(
          `app/firms/${entity_id}/strategies${childState}`,
          {
            replaceUrl: true,
          }
        );
      });
  }
}
