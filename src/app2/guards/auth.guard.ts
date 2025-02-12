import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlSegmentGroup,
  UrlTree,
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RouterService } from '../services/router.service';

export const AuthCanActivateGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(RouterService);

  const { refresh, jwt } = authService.currentToken;

  if (refresh && jwt) return true;
  const urlParts = state.url.split('#');
  const path = urlParts[0];
  const fragment = urlParts[1] || null;
  const queryParams = new URLSearchParams(path.split('?')[1]);
  let queryParamsObj = Object.fromEntries(queryParams.entries());
  const pathWithoutQuery = path.split('?')[0];

  router.navigate('/login', {
    queryParams:
      pathWithoutQuery !== 'app/home'
        ? {
            redirectToState: pathWithoutQuery,
            redirectToParams: JSON.stringify(queryParamsObj),
            redirectToFragment: fragment,
          }
        : {},
  });
  return false;
};
