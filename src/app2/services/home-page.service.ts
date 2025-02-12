import { Injectable } from '@angular/core';
import { RouterService } from './router.service';
import { UtilsService } from './utils.service';
import { Router } from '@angular/router';
import { BaseDataService } from './base-data.service';
import { keywordConstants } from '../shared/constants/constant';
import { catchError, map, switchMap } from 'rxjs/operators';
import { from, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HomePageService {
  constructor(
    private readonly router: RouterService,
    readonly util: UtilsService,
    private readonly dataService: BaseDataService,
    private readonly route: Router
  ) {}

  // Replaces Home component of angularJS. Handles the initial redirection
  navigateToHomePage(user, params) {
    const isFreeSubscription = user.isFreeSubscription;
    const isManager = user.isManager;
    let isDefault = this.util.isDefaultHomePage();

    if (params?.redirectId && isManager && !user.isSecurityAdmin) {
      this.router.navigateWithParams('app.inbound.review_request', {
        redirectId: params.redirectId,
      });
    } else if (!user.isSecurityAdmin && !isDefault) {
      this.router.navigateWithParams('app.dash', { dashType: 'my-work' });
    } else if (isFreeSubscription) {
      this.router.navigateWithParams('app.dash', { dashType: isManager ? 'Dashboard' : 'Monitor' });
    } else {
      if (user.isSecurityAdmin) {
        this.router.navigate('app.firm.settings.employees');
      } else if (
        user.isFormADVSubscription ||
        user.isFormADVAnalyticsSubscription
      ) {
        this.router.navigate('app.form_adv.regulatory_monitor.portfolio');
      } else if (isManager && !isFreeSubscription) {
        this.router.navigate('app.monitor.investments');
      } else {
        this.router.navigateWithParams('app.diligence.projects.activity', {
          type: 'in-progress',
        });
      }
    }
  }

  navigateToProjectPage(diligenceId, url) {
    const childState = url.split('projects')[1];
    return this.dataService
      .getPermissionEntityDetails(diligenceId, 'Duediligence')
      .pipe(
        switchMap((diligence: any) => {
          let currentRoute = '';
          const { fromfirm_id, tofirm_id, entity_id, parent_entity_id } =
            diligence;
          if (
            diligence.entity_type.toLowerCase() ==
              keywordConstants.Product.toLowerCase() &&
            !diligence.linked_duediligence_id
          ) {
            return from(
              this.route.navigateByUrl(
                `app/diligence/${fromfirm_id}/firms/${tofirm_id}/funds/${entity_id}/projects${childState}`,
                {
                  replaceUrl: true,
                }
              )
            ).pipe(
              map((success) => success), // Transform the navigation success into true/false
              catchError(() => of(false)) // Handle navigation failures gracefully
            );
            currentRoute = `app/diligence/${fromfirm_id}/firms/${tofirm_id}/funds/${entity_id}/projects${childState}`;
          }
          if (
            diligence.entity_type.toLowerCase() ==
            keywordConstants.Strategy.toLowerCase()
          ) {
            return from(
              this.route.navigateByUrl(
                `app/diligence/${fromfirm_id}/firms/${tofirm_id}/strategies/${entity_id}/projects${childState}`
              )
            ).pipe(
              map((success) => success), // Transform the navigation success into true/false
              catchError(() => of(false)) // Handle navigation failures gracefully
            );
          } else if (
            diligence.entity_type.toLowerCase() ==
            keywordConstants.Firm.toLowerCase()
          ) {
            return from(
              this.route.navigateByUrl(
                `app/diligence/${fromfirm_id}/firms/${tofirm_id}/projects${childState}`
              )
            ).pipe(
              map((success) => success), // Transform the navigation success into true/false
              catchError(() => of(false)) // Handle navigation failures gracefully
            );
          } else if (
            diligence.entity_type.toLowerCase() ==
            keywordConstants.Vehicle.toLowerCase()
          ) {
            return from(
              this.route.navigateByUrl(
                `app/diligence/${fromfirm_id}/firms/${tofirm_id}/funds/${parent_entity_id}/vehicles/${entity_id}/projects${childState}`
              )
            ).pipe(
              map((success) => success), // Transform the navigation success into true/false
              catchError(() => of(false)) // Handle navigation failures gracefully
            );
          } else if (
            diligence.entity_type.toLowerCase() ==
              keywordConstants.Product.toLowerCase() &&
            diligence.linked_duediligence_id
          ) {
            return from(
              this.route.navigateByUrl(
                `app/diligence/${fromfirm_id}/firms/${tofirm_id}/strategies/${parent_entity_id}/funds/${entity_id}/projects${childState}`
              )
            ).pipe(
              map((success) => success), // Transform the navigation success into true/false
              catchError(() => of(false)) // Handle navigation failures gracefully
            );
          } else {
            let sepRou = childState.split('/');
            let newChildState = childState;
            if (sepRou.length < 3) {
              newChildState = sepRou.join('/') + '/summary';
            }
            return from(
              this.route.navigateByUrl(`app/diligence/projects${newChildState}`)
            ).pipe(
              map((success) => success), // Transform the navigation success into true/false
              catchError(() => of(false)) // Handle navigation failures gracefully
            );
          }
        }),
        catchError(() => of(false)) // Block navigation on error
      );
  }
}
