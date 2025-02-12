import { Component, OnInit } from '@angular/core';
import { MenubarService } from 'src/app2/services/menubar.service';
import { AuthService } from '../../../services/auth.service';
import { LayoutUtilsService } from '../../../services/layout-utils.service';
import { NotificationsService } from '../../../services/notifications.service';
import { RouterService } from '../../../services/router.service';
import { UtilsService } from '../../../services/utils.service';

@Component({
  selector: 'app-topnav',
  templateUrl: './topnav.component.html',
  styleUrls: ['./topnav.component.css'],
})
export class TopnavComponent implements OnInit {
  unread_notification_count;
  has_multiple_accounts;
  is_admin;
  has_help;
  showPageHelp;
  is_manager;
  is_investor: boolean;
  is_freeSubscription: any;
  routeState: any;
  toggleFeedbackPanel: () => void;
  previous_notification_count: any;
  platform_activity: any;
  menu_items;

  constructor(
    private readonly LayoutUtils: LayoutUtilsService,
    private readonly Utils: UtilsService,
    private readonly routerService: RouterService,
    private readonly NotificationsFactory: NotificationsService,
    private readonly AuthService: AuthService,
    private readonly MenubarFactory: MenubarService
  ) {}

  ngOnInit(): void {
    // TODO: Handle Feedback panel
    this.toggleFeedbackPanel = this.LayoutUtils.toggleFeedbackPanel;
    this.is_investor = this.Utils.isInvestor();
    this.is_manager = this.Utils.isManager();
    this.is_admin = this.Utils.isAdmin();
    this.has_multiple_accounts = this.Utils.hasMultipleAccounts();
    this.is_freeSubscription = this.Utils.isFreeSubscription();
    const restrictedRouteStates = [
      'app.diligence.project.questionnaire',
      'app.diligence.project.questionnaire.category',
    ];
    this.routeState = this.routerService.getState().current.name;
    if (restrictedRouteStates.includes(this.routeState)) {
      this.showPageHelp = false;
    } else {
      this.showPageHelp = true;
    }
    // TODO: Replace rootS
    /* this.$rootScope.$on(
      '$stateChangeSuccess',
      (
        event: any,
        toState: { name: any },
        toParams: any,
        fromState: any,
        fromParams: any
        ) => {
          if (Array.from(restrictedRouteStates).includes(toState.name)) {
            return (this.showPageHelp = false);
          } else {
            return (this.showPageHelp = true);
          }
        }
        ); */
    this.NotificationsFactory.onload((response) => {
      this.setNotificationCount(response.count);
    });
    // TODO: $rootScope
    /* this.$rootScope.$on('questionnaire:render', () => {
          this.showPageHelp = true;
        }); */
    this.menu_items = this.MenubarFactory.getMenuItems();
  }

  setNotificationCount(count: any) {
    this.previous_notification_count = this.unread_notification_count;
    this.unread_notification_count = count;
    if (count !== this.previous_notification_count) {
      this.platform_activity.refreshNotifications();
    }
  }

  productTour() {
    const redirectToState = this.routerService.getState().current.name;
    const redirectToParams = JSON.stringify(
      this.routerService.getState().params
    );
    this.routerService.navigateWithParams('app.welcome_to_dv', {
      redirectToState,
      redirectToParams,
    });
  }

  logout() {
    this.AuthService.logoutViaRequest();
    // TODO: heap??
    /* if (typeof heap !== 'undefined' && heap !== null) {
      heap.resetIdentity();
    } */
  }

  closeMenu() {
    // TODO: Replace $
    // $('.navbar-collapse').collapse('hide');
  }

  triggerHelp() {
    this.LayoutUtils.triggerHelp();
  }

  navigate(path: string) {
    this.routerService.navigate(path);
  }

  navigateToHelp() {
    this.routerService.navigateWithParams('app.welcome', { help: true });
  }
}
