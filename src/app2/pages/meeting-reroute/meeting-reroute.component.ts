import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { RouterService } from 'src/app2/services/router.service';
import { keywordConstants } from 'src/app2/shared/constants/constant';

@Component({
  selector: 'meeting-reroute',
  template: `<router-outlet></router-outlet>`,
})
export class MeetingReRoutePageComponent implements OnInit {
  isLoading = true;
  constructor(
    private readonly router: ActivatedRoute,
    private readonly routerS: RouterService,
    private readonly dataService: BaseDataService
  ) {}
  ngOnInit(): void {
    const Id = this.router.snapshot.params.Id;

    this.dataService
      .getPermissionEntityDetails(Id, 'Meeting')
      .subscribe((response: any) => {
        let newRoute;
        if (
          response.entity_type.toLowerCase() ==
          keywordConstants.Firm.toLowerCase()
        ) {
          newRoute = `app/firms/${response.entity_id}/meetings/${Id}/detail`;
        } else if (
          response.entity_type.toLowerCase() ==
          keywordConstants.Product.toLowerCase()
        ) {
          newRoute = `app/firms/${response.firm_id}/funds/${response.entity_id}/meetings/${Id}/detail`;
        } else if (
          response.entity_type.toLowerCase() ==
          keywordConstants.Strategy.toLowerCase()
        ) {
          newRoute = `app/firms/${response.firm_id}/strategies/${response.entity_id}/meetings/${Id}/detail`;
        }
        this.routerS.navigate(newRoute, {
          replaceUrl: true,
        });
      });
  }
}
