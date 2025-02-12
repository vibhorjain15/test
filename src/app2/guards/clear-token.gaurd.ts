import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  RouterStateSnapshot,
} from '@angular/router';

export const ClearTokenGaurd: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  localStorage.removeItem('dv_refresh_token');
  localStorage.removeItem('dv_access_token');
  localStorage.removeItem('jwt');
  return true;
};
