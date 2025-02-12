import { Component, OnInit, OnDestroy } from '@angular/core';
import { Event, NavigationEnd, Router } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { RouterService } from 'src/app2/services/router.service';
import { dvTabsList } from 'src/app2/shared/components/dv-tabs/dv-tabs.model';
import { UserModel } from 'src/app2/store/user/user.model';
import { entityTabs } from './entity-tabs.constants';
import { UserState } from 'src/app2/store/user/user.state';
import { take, tap, filter } from 'rxjs/operators';
import { GetCurrentUser } from 'src/app2/store/user/user.action';
import { SubscriptionLike } from 'rxjs';
import { UnsavedChangeService } from '../shared/unsaved-change.service';

@Component({
  selector: 'entity-tabs',
  templateUrl: './entity-tabs.component.html',
  styleUrls: ['./entity-tabs.component.css'],
})
export class EntityTabsComponent implements OnInit, OnDestroy {
  user: UserModel;
  currentTabList: dvTabsList[] = [];
  loading: boolean;
  firmPref: any;
  activeTab: string;
  route;
  issue_tracker_default_name;
  @Select(UserState.getCurrentUserData) userData;
  @Select(UserState.getFirmPreferenceData) firmPref$;
  observableSubscriptions: SubscriptionLike[] = [];
  constructor(
    private store: Store,
    private router: RouterService,
    private angularRouter: Router,
    private unsavedChangeService: UnsavedChangeService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.init();
    this.observableSubscriptions.push(
      this.angularRouter.events
        .pipe(filter((e: Event) => e instanceof NavigationEnd))
        .subscribe((e: Event) => {
          this.getTabList();
        })
    );
  }

  init() {
    this.userData.pipe(take(1)).subscribe((user) => {
      if (user) {
        this.user = user;

        this.observableSubscriptions.push(
          this.firmPref$.subscribe((data) => (this.firmPref = data))
        );
        this.issue_tracker_default_name =
          this.firmPref.issue_tracker_default_name;

        this.getTabList();
      }
    });
  }

  getTabList() {
    const routerState = this.router.getState();
    this.currentTabList = entityTabs[routerState.data.entityType](
      this.user,
      this.issue_tracker_default_name,
      routerState.params
    );
    this.highlightTab();
    this.loading = false;
  }

  highlightTab() {
    let routerParams = this.router.getState();
    let route = routerParams._routerState.url;
    const recommendationId = routerParams?.params?.recommendationId;
    if (recommendationId) {
      route = route.split('recommendations')[0] + 'recommendations';
    }
    if (!route?.split('profile')[1]?.length) {
      this.router.navigateAngular(this.currentTabList[0].link);
    }
    this.activeTab = route;
    this.currentTabList.forEach(
      (tab) => (tab.active = this.activeTab.indexOf(tab.link) > -1)
    );
  }

  handleTabChange(index) {
    if (this.unsavedChangeService.unsavedChanges)
      this.unsavedChangeService.showUnsavedChangeAlert(
        this.currentTabList[index].link
      );
    else this.router.navigateAngular(this.currentTabList[index].link);
  }

  ngOnDestroy(): void {
    this.unsavedChangeService.onUnsavedTableCountChange(0); // reset to zero.
    this.observableSubscriptions.forEach((subscription) =>
      subscription?.unsubscribe()
    );
  }
}
