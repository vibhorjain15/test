import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseDataService } from 'src/app2/services/base-data.service';

@Component({
  selector: 'fund-reroute',
  template: ` <router-outlet></router-outlet> `,
})
export class FundReRoutePageComponent implements OnInit {
  isLoading = true;
  constructor(
    private readonly router: ActivatedRoute,
    private readonly dataService: BaseDataService,
    private readonly route: Router
  ) {}
  ngOnInit(): void {
    const fundId = this.router.snapshot.params.fundId;

    const childState = window.location.href.split('funds')[1];
    this.dataService
      .getPermissionEntityDetails(fundId, 'Fund')
      .subscribe((response: any) => {
        const { entity_id } = response;

        this.route.navigateByUrl(`app/firms/${entity_id}/funds${childState}`, {
          replaceUrl: true,
        });
      });
  }
}
