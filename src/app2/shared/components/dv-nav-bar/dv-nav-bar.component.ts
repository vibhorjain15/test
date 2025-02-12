import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { take, takeUntil } from 'rxjs/operators';
import { RouterService } from 'src/app2/services/router.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { ToggleWritetoUs } from 'src/app2/store/user/user.action';
import { UserState } from 'src/app2/store/user/user.state';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { AuthService } from 'src/app2/services/auth.service';
import { NotificationsService } from 'src/app2/services/notifications.service';
import { Subject } from 'rxjs';
import { MenubarService } from 'src/app2/services/menubar.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { HttpClient } from '@angular/common/http';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'dv-nav-bar',
  templateUrl: './dv-nav-bar.component.html',
  styleUrls: ['./dv-nav-bar.component.css'],
})
export class DvNavBarComponent implements OnInit, OnDestroy {
  uiSref: any;
  is_freeSubscription: any;
  toggleDropDown = {};
  currentActive = null;
  currentActiveSubMenu = null;
  localMenu = [];
  currentUser = {};
  dropdownOpen = 'null';
  userProfilePic = {
    avatarURL: 'avatarURL',
    type: '',
  };
  currentRoute;
  menuItemsUpdated = [];
  isNavbarTransitioning: boolean = false;
  @ViewChild('navbar') navbar: ElementRef<HTMLElement>;
  @Select(UserState.getCurrentUserData) user;
  @Select(UserState.getSubscriptionLimitsData) subscriptionLimits;
  //   @Select(UserState.getUnreadNotificationsCount) stateUnreadNotifications;
  entity_type;
  unreadNotification = 0;
  routeMap = {
    mySetting: '/app/settings/profile',
    switchAccounts: '/app/settings/my-accounts',
    usersTeams: '/app/firm/settings/employees',
    firmSetting: '/app/firm/settings/profile',
    termsConditions: '/app/terms-and-conditions',
    AItermsConditions: '/app/ai-terms-of-use',
  };
  loading = true;
  showPlatfromActivity = false;
  ngUnsubscribe = new Subject<void>();
  showPageHelp;
  constructor(
    private readonly Utils: UtilsService,
    private readonly store: Store,
    private readonly route: RouterService,
    private readonly router: Router,
    private readonly modal: CustomModalService,
    private readonly notification: NotificationsService,
    private readonly auth: AuthService,
    private readonly customModalService: CustomModalService,
    private readonly http: HttpClient,
    private readonly menu: MenubarService,
    private readonly sweetAlert: SweetAlertService
  ) {}
  pageName;
  queryParams;
  ngOnInit(): void {
    //Active subscription to listen to any route changes
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.queryParams = JSON.stringify(
          this.route.getState()._routerState._root.value.queryParams
        );
        this.pageName = this.route.getState().data.state_name;
        this.currentActive = '';
        this.currentActiveSubMenu = '';
        this.currentUser && this.updateMenuItems();
      }
    });

    this.subscriptionLimits.pipe(take(2)).subscribe((limits) => {
      if (limits?.length) {
        this.entity_type = this.Utils.getEntityType(limits[0]);
        this.updateMenuItems();
      }
    });
    this.loading = true;
    this.user.pipe(takeUntil(this.ngUnsubscribe)).subscribe((data) => {
      if (data) {
        this.showPlatfromActivity = false
        this.currentUser = data;
        this.loading = false;
        this.userProfilePic.avatarURL = data.avatarURL;
        this.userProfilePic.type = data.type;
        this.updateMenuItems();
        this.getUnreadNotifications();
        setTimeout(() => {
          this.showPlatfromActivity = true
        }, 1000);

        let canRedirect = this.menu.canRouteToPremium(
          window.location.hash.split('#')[1],
          this.localMenu
        );
        if (canRedirect) {
          this.route.navigate('app/premium');
          return;
        }
      }
    });

    this.notification.onload((response) => {
      this.setNotificationCount(response.count);
    });
  }

  setNotificationCount(count) {
    this.unreadNotification = count;
  }

  canShowProductHelp(url) {
    if (url?.includes('questionnaire')) {
      this.showPageHelp = true;
    } else {
      this.showPageHelp = false;
    }
  }

  updateProfileItems() {
    Object.keys(this.routeMap).forEach((route) => {
      if (window.location.hash.indexOf(this.routeMap[route]) > -1) {
        this.currentActiveSubMenu = route;
        this.currentActive = 'profile';
      }
    });
  }

  updateMenuItems() {
    let menu = [];
    this.menu.getMenuItems(this.menu.menu_items, menu);
    this.localMenu = menu;
    this.localMenu.forEach((item) => (this.toggleDropDown[item.label] = false));
    this.updateActiveMenu(this.localMenu, false);
    if (!this.currentActive && !this.currentActiveSubMenu)
      this.updateProfileItems();
    this.localMenu.forEach((menu) => {
      menu.url = this.handleLinkClickUrl(menu);
      if (menu.submenu_items) {
        menu.submenu_items.forEach((submenu) => {
          submenu.url = this.getHref(submenu);
        });
      }
    });
  }

  updateActiveMenu(localMenu, isSubMenuRendering = false) {
    if (this.currentActiveSubMenu) return;
    let url = this.route.getState()._routerState.url.slice(1);
    localMenu.forEach((menu) => {
      if (
        (menu.matcher && url.search(menu?.matcher) > -1) ||
        url.indexOf(menu?.stateName) > -1
      ) {
        if (!isSubMenuRendering) this.currentActive = menu.label;
        if (isSubMenuRendering) {
          if (menu?.stateParams && !url.includes('app/content/documents')) {
            if (this.queryParams == JSON.stringify(menu?.stateParams)) {
              this.currentActiveSubMenu = menu.label;
            }
          } else {
            this.currentActiveSubMenu = menu.label;
          }
        }
      }
      if (menu?.submenu_items?.length) {
        let lastactiveSubMenu = JSON.parse(
          JSON.stringify(this.currentActiveSubMenu)
        );
        this.updateActiveMenu(menu?.submenu_items, true);
        if (lastactiveSubMenu != this.currentActiveSubMenu) {
          this.currentActive = menu.label;
          return;
        }
      }
    });
  }

  addTeamMembers() {
    let source = 'navbar';
    this.modal.invoke('new-user', {
      initialState: {
        existing_user: false,
        source: source,
        newUser: (user) => {
          this.Utils.scrollId = user.id + user.firm_id;
          this.route.navigate('app/firm/settings/employees');
        },
      },
    });
  }

  handleLinkClickUrl(menu_item) {
    if (!menu_item?.stateName) return;
    return this.route.href(menu_item?.stateName, {
      ...(menu_item.stateParams || {}),
    });
  }
  handleLinkSubClick(menu_item, sub_menu) {
    this.currentActiveSubMenu = sub_menu.label;
    this.currentActive = menu_item.label;
    if (sub_menu.modal_name && !sub_menu?.upgrade) {
      this.customModalService.invoke(
        sub_menu.modal_name,
        sub_menu.modal_options
      );
      return;
    }

    if (sub_menu?.upgrade) {
      this.sweetAlert.premiumAlert({
        title: sub_menu.premiumTitle,
        text: sub_menu.premiumText,
      });
    }
  }
  handleLinkSubClickUrl(sub_menu) {
    return this.route.href(sub_menu?.stateName, {
      ...(sub_menu.stateParams || {}),
    });
  }
  getHref(item: any) {
    if (item?.upgrade) {
      return this.route.href('app.premium', {});
    } else if (item?.modal_name) {
      return null;
    } else {
      return this.handleLinkSubClickUrl(item);
    }
  }

  productTour() {
    window.open('https://app.storylane.io/share/o29issisoqou', '_blank');
  }

  handleFaqClick() {
    this.route.navigateWithParams('app.welcome', { help: true });
  }

  logout() {
    this.auth.logoutViaRequest();
  }

  handleFeedbackPanel() {
    this.store.dispatch(new ToggleWritetoUs());
  }

  triggerHelp() {
    console.log('Not Integrated yet');
  }

  toggleNavbar(): void {
    this[
      this.navbar.nativeElement.classList.contains('in')
        ? 'hideNavbar'
        : 'showNavbar'
    ]();
  }

  showNavbar(): void {
    const element = this.navbar.nativeElement;
    if (this.isNavbarTransitioning || element.classList.contains('in')) {
      return;
    }

    this.isNavbarTransitioning = true;
    element.classList.remove('collapse');
    element.classList.add('collapsing');
    element.style.height = '0';

    const scrollSize = element.scrollHeight + 'px';
    element.style.height = scrollSize;

    setTimeout(() => {
      element.classList.remove('collapsing');
      element.classList.add(...['collapse', 'in']);
      element.style.height = '';
      this.isNavbarTransitioning = false;
    }, 350); // 350ms is the default for bootstrap collapse
  }

  hideNavbar(): void {
    const element = this.navbar.nativeElement;
    if (this.isNavbarTransitioning || !element.classList.contains('in')) {
      return;
    }

    this.isNavbarTransitioning = true;
    element.style.height = element.offsetHeight + 'px';
    element.classList.add('collapsing');

    // Angular change detector not detecting the previous change
    // so wrapped the next set of instructions inside setTimeout
    setTimeout(() => {
      element.classList.remove(...['collapse', 'in']);
      element.style.height = '0px';
    }, 10);

    setTimeout(() => {
      this.isNavbarTransitioning = false;
      element.classList.remove('collapsing');
      element.classList.add('collapse');
    }, 350); // 350ms is the default for bootstrap collapse
  }

  getUnreadNotifications() {
    this.notification.getUnreadNotificationCount();
  }

  ngOnDestroy(): void {
    this.route.destroyListener();
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
