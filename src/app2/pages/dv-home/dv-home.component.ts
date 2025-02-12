import { Component, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import {
  GetCurrentUser,
  GetSubscriptionLimit,
  GetUserNotification,
  UpdateCurrentUser,
} from '../../store/user/user.action';
import { UserState } from '../../store/user/user.state';
import { ReRouteService } from 'src/app2/services/re-reoute.service';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { RouterService } from 'src/app2/services/router.service';
import { MenubarService } from 'src/app2/services/menubar.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'dv-home',
  templateUrl: './dv-home.component.html',
})
export class DvHomeComponent implements OnInit {
  isAuthenticated = true;
  selectedNudge = {
    response: '',
  };
  currentRoute = '';
  @Select(UserState.getCurrentUserData) user;
  @Select(UserState.getSubscriptionLimitsData) subscriptionLimits;
  constructor(
    private readonly store: Store,
    private readonly reRoute: ReRouteService,
    private readonly router: Router,
    private readonly routerService: RouterService,
    private readonly menu: MenubarService,
    private readonly Utils: UtilsService
  ) {}

  ngOnInit(): void {
    if (!this.store.selectSnapshot((state) => state.user.currentUser)) {
      this.isAuthenticated = false;
    }
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.checkValidRoute(event.url.slice(1));
      }
      if (event instanceof NavigationEnd) {
        this.routerService.updateHistoryRoute(event.url);
      }
    });
    this.store
      .dispatch([
        new GetCurrentUser(),
        new GetSubscriptionLimit(),
        new GetUserNotification(),
      ])
      .pipe(take(1))
      .subscribe((userData) => {
        if (userData?.length) {
          try {
            let currentRoute = this.routerService
              .getState()
              ._routerState.url.slice(1);
            let { currentUser } = userData[0].user;
            let { subscriptionLimits } = userData[1].user;
            if (subscriptionLimits?.length) {
              let entity_type = this.Utils.getEntityType(subscriptionLimits[0]);
              this.Utils.currentUser = currentUser;
              this.menu.updateGrandMap(this.Utils.getGrantMap(currentUser));
              this.menu.updateAllMenuItem(entity_type);
            }
            this.checkValidRoute(currentRoute);
            this.loadUI();
            this.store.dispatch(new UpdateCurrentUser(currentUser));
          } catch (e) {
            console.error(e)
            this.ngOnInit();
          }
        }
      });
  }

  loadUI() {
    this.isAuthenticated = true;
    this.reRoute.routeToWelcome();
    this.reRoute.routeToEuc();
    this.reRoute.routeToLoadedUrl(this.menu);
  }

  checkValidRoute(currentRoute) {
    this.currentRoute = currentRoute;
    let val = this.menu.isAuthorized(currentRoute);
    if (!val) {
      this.routerService.navigate('app/home');
    }
  }
  ngOnDestroy() {
    this.routerService.clearHistoryRoute();
  }
}
