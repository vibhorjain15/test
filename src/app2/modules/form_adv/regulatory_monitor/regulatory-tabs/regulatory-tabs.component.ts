import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

import { SubscriptionLike } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Select, Store } from '@ngxs/store';
import { take, tap } from 'rxjs/operators';
import { RouterService } from 'src/app2/services/router.service';
import { dvTabsList } from 'src/app2/shared/components/dv-tabs/dv-tabs.model';
import { GetCurrentUser } from 'src/app2/store/user/user.action';
import { UserState } from 'src/app2/store/user/user.state';

const RegulatoryTabState = {
  MyPortfolio: 'app.form_adv.regulatory_monitor.portfolio',
  CustomizePortfolio: 'app.form_adv.regulatory_monitor.explore',
} as const; // makes the properties of object as read-only.

@Component({
  selector: 'app-regulatory-tabs',
  templateUrl: './regulatory-tabs.component.html',
  styleUrls: ['./regulatory-tabs.component.css'],
})
export class RegulatoryTabsComponent implements OnInit, OnDestroy {
  readonly baseState: string = 'app.form_adv.regulatory_monitor';
  currentTab: string;
  locationSubscription: SubscriptionLike;
  regulatoryTabState = RegulatoryTabState;
  tabList: Array<dvTabsList> = [
    {
      name: 'My Portfolio',
      link: RegulatoryTabState.MyPortfolio,
      active: false,
      condition: true,
    },
    {
      name: 'Customize Portfolio',
      link: RegulatoryTabState.CustomizePortfolio,
      active: false,
      condition: true,
    },
  ];
  @Select(UserState.getCurrentUserData) user$;

  constructor(
    private router: RouterService,
    private location: Location,
    private store: Store,
    private route: Router
  ) {}
  ngOnInit(): void {
    this.highlightTab();
    this.route.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.highlightTab();
      });
    this.locationSubscription = this.location.subscribe(
      (event: PopStateEvent) => {
        if (event.type === 'popstate') {
          this.highlightTab();
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.locationSubscription?.unsubscribe();
  }

  highlightTab(): void {
    const currentState = window.location.href;
    if (currentState.includes('portfolio')) {
      this.currentTab = 'app.form_adv.regulatory_monitor.portfolio';
    } else if (currentState.includes('explore')) {
      this.currentTab = 'app.form_adv.regulatory_monitor.explore';
    }
    this.tabList.forEach(
      (tab: dvTabsList) => (tab.active = tab.link === this.currentTab)
    );
  }

  handleTabChange(tabIndex: number): void {
    this.router.navigate(this.tabList[tabIndex].link);
  }
}
