import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { MenubarService } from '../services/menubar.service';

export const CanAccessGaurd: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const router = inject(Router);
  const hiddenRole = route?.data['hidden_from'] || [];
  const accessibleTo = route?.data['accessible_to'] || [];
  const canUpgrade = route?.data['can_upgrade'] || false;
  const menu = inject(MenubarService);

  if (menu.isgrantMap()) {
    let isValid = menu.canAccessHelper(hiddenRole, accessibleTo);
    if (
      !isValid &&
      canUpgrade &&
      (menu.grant_map.FreeInvestor || menu.grant_map.FreeManager)
    ) {
      router.navigate(['/app/premium']);
      return false;
    }
    if (!isValid) {
      // Added this to route to home page if user does not have access to page
      menu.updateLoadedUrl(state.url);
      router.navigate(['/app/home']);
    }
    return isValid;
  }
  menu.updateLoadedUrl(state.url);
  router.navigate(['/app/home']);
  return false;
};
