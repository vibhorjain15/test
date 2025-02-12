import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RouterService } from '../services/router.service';

export const PublicRoutesRedirectsGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const routerService = inject(RouterService);

  const { refresh, jwt } = authService.currentToken;

  if (refresh && jwt) {
    const urlParts = state.url.split('#');
    const path = urlParts[0];
    const fragment = urlParts[1] || null;
    const queryParams = new URLSearchParams(path.split('?')[1]);
    let queryParamsObj = Object.fromEntries(queryParams.entries());
    const pathWithoutQuery: any = path.split('?')[0];
    if (refresh && jwt) {
      if (
        pathWithoutQuery.includes('login') ||
        pathWithoutQuery.includes('signup')
      ) {
        routerService.navigate('/app/home', {
          queryParams: queryParamsObj,
          fragment: fragment,
        });
      }
    }
  }

  return true;
};
