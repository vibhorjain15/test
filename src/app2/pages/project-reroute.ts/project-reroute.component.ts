import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { keywordConstants } from 'src/app2/shared/constants/constant';

@Component({
  selector: 'project-reroute',
  template: `<div class="print-preview-spinner"><app-spinner *ngIf=isLoading></app-spinner></div>`,
})
export class ProjectReRoutePageComponent implements OnInit {
  isLoading = true;
  constructor(
    private readonly router: ActivatedRoute,
    private readonly dataService: BaseDataService,
    private readonly route: Router
  ) {}
  ngOnInit(): void {
    const diligenceId = this.router.snapshot.params.diligenceId;
    const childState = window.location.href.split('projects')[1];
    this.dataService
      .getPermissionEntityDetails(diligenceId, 'Duediligence')
      .subscribe((diligence: any) => {
        this.isLoading= false
        const { fromfirm_id, tofirm_id, entity_id, parent_entity_id } =
          diligence;
        if (
          diligence.entity_type.toLowerCase() ==
            keywordConstants.Product.toLowerCase() &&
          !diligence.linked_duediligence_id
        ) {
          this.route.navigateByUrl(
            `app/diligence/${fromfirm_id}/firms/${tofirm_id}/funds/${entity_id}/projects${childState}`,
            {
              replaceUrl: true,
            }
          );
        }
        if (
          diligence.entity_type.toLowerCase() ==
          keywordConstants.Strategy.toLowerCase()
        ) {
          this.route.navigateByUrl(
            `app/diligence/${fromfirm_id}/firms/${tofirm_id}/strategies/${entity_id}/projects${childState}`,
            {
              replaceUrl: true,
            }
          );
        } else if (
          diligence.entity_type.toLowerCase() ==
          keywordConstants.Firm.toLowerCase()
        ) {
          this.route.navigateByUrl(
            `app/diligence/${fromfirm_id}/firms/${tofirm_id}/projects${childState}`,
            {
              replaceUrl: true,
            }
          );
        } else if (
          diligence.entity_type.toLowerCase() ==
          keywordConstants.Vehicle.toLowerCase()
        ) {
          this.route.navigateByUrl(
            `app/diligence/${fromfirm_id}/firms/${tofirm_id}/funds/${parent_entity_id}/vehicles/${entity_id}/projects${childState}`,
            {
              replaceUrl: true,
            }
          );
        } else if (
          diligence.entity_type.toLowerCase() ==
            keywordConstants.Product.toLowerCase() &&
          diligence.linked_duediligence_id
        ) {
          this.route.navigateByUrl(
            `app/diligence/${fromfirm_id}/firms/${tofirm_id}/strategies/${parent_entity_id}/funds/${entity_id}/projects${childState}`,
            {
              replaceUrl: true,
            }
          );
        }
      });
  }
}
