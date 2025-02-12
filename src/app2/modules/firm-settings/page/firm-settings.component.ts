import { Component, OnInit } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { RouterService } from 'src/app2/services/router.service';
import { MenubarService } from 'src/app2/services/menubar.service';
import { Subject } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'firm-settings',
  templateUrl: './firm-settings.component.html',
  styleUrls: ['./firm-settings.component.css'],
})
export class FirmSettingsComponent implements OnInit {
  states: any = [];
  currentLabel = '';
  currentSubState;
  currentActive = {};
  ngUnsubscribe = new Subject();
  constructor(
    private readonly routerservice: RouterService,
    private readonly menu: MenubarService,
    private readonly router: Router
  ) {}
  ngOnInit(): void {
    this.router.events
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((event) => {
        if (event instanceof NavigationEnd) {
          let url = event.url.slice(1);
          let canReRoute = url == 'app/firm/settings';
          canReRoute && this.routerservice.navigateAngular('app/firm/settings/profile');
          this.currentActive = this.menu.findMenuItemByUrl(
            url,
            this.menu.firm_settings_items
          );
        }
      });
      let canReRoute = window.location.pathname == '/app/firm/settings';
      canReRoute && this.routerservice.navigateAngular('app/firm/settings/profile');
  }

  ngAfterViewInit(): void {
    if (this.menu.firm_settings_items.length) {
      let menu = [];
      this.menu.getMenuItems(this.menu.firm_settings_items, menu);
      this.states = menu[0].submenu_items;
      let currRoute = this.routerservice.getState()._routerState.url.slice(1);
      let canReRoute = currRoute == 'app/firm/settings';
      canReRoute &&
        this.handleMenuClick(
          !!this.states[0]?.submenu_items.length
            ? this.states[0]?.submenu_items[0]
            : this.states[0]
        );

      this.currentActive = this.menu.findMenuItemByUrl(
        currRoute,
        this.menu.firm_settings_items
      );
    }
  }

  handleMenuClick(state) {
    if (!state?.submenu_items?.length)
      this.routerservice.navigateAngular(state.stateName);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
