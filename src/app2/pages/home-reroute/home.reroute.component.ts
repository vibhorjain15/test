import { Component, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { HomePageService } from 'src/app2/services/home-page.service';
import { RouterService } from 'src/app2/services/router.service';
import {
  GetAiPromptFlag,
  GetCurrentUser,
  GetSubscriptionLimit,
  GetUserNotification,
} from 'src/app2/store/user/user.action';
import { UserState } from 'src/app2/store/user/user.state';

@Component({
  selector: 'home-reroute',
  template: `<router-outlet></router-outlet> `,
})
export class HomeReRoutePageComponent implements OnInit {
  isLoading = true;
  @Select(UserState.getCurrentUserData) user;
  constructor(
    private readonly routerService: RouterService,
    private readonly store: Store,
    private readonly homeService: HomePageService
  ) {}
  ngOnInit(): void {
    try {
      let params = this.routerService.getState().params;
      let { user } = this.store.snapshot();
      this.store.dispatch(new GetAiPromptFlag());
      this.homeService.navigateToHomePage(user.currentUser, params);
    } catch (e) {
      console.error('dv-home', e);
      // incase user data is cleared and we get error while switching between firms
      this.store
        .dispatch([
          new GetCurrentUser(),
          new GetSubscriptionLimit(),
          new GetUserNotification(),
        ])
        .subscribe((userData) => {
          this.ngOnInit();
        });
    }
  }
}
