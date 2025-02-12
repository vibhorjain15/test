import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { RouterService } from './router.service';
import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root',
})
export class ReRouteService {
  constructor(
    private readonly store: Store,
    private readonly router: RouterService,
    private readonly util: UtilsService
  ) {}

  routeToWelcome() {
    let { user } = this.store.snapshot();
    user = user.currentUser;

    if (user.isFirstLogin && user.endUserAgreementAccepted) {
      if (user.isManager && !user.getSkipIntro) {
        this.router.navigate('app/welcome_to_dv');
      } else {
        this.router.navigate('app/welcome');
      }
      return true;
    }
    return false;
  }
  routeToEuc() {
    let { user } = this.store.snapshot();
    user = user.currentUser;
    if (user.isFirstLogin && !user.endUserAgreementAccepted) {
      this.router.navigate('app/euc');
    }
  }
  routeToHome() {
    let { user } = this.store.snapshot();
    user = user.currentUser;
    if (user.endUserAgreementAccepted) {
      this.router.navigate('app/home');
      return true;
    }
    return false;
  }
  routeToLoadedUrl(menu) {
    let loadedUrl = menu.getLoadedUrl();
    if (!!loadedUrl) {
      const { pathWithoutQuery, queryParamsObj, fragment } =
        this.util.getUrlWithParam(loadedUrl);
      menu.clearLoadedUrl();
      this.router.navigate(pathWithoutQuery, {
        queryParams: queryParamsObj,
        fragment: fragment,
      });
    }
  }
}
