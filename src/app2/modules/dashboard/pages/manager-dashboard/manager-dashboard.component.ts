import { Component } from '@angular/core';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { filter, take, takeUntil, tap } from 'rxjs/operators';
import { RouterService } from 'src/app2/services/router.service';
import { GetCurrentUser } from 'src/app2/store/user/user.action';
import { UserState } from 'src/app2/store/user/user.state';

@Component({
  selector: 'manager-dashboard',
  templateUrl: './manager-dashboard.component.html',
  styleUrls: ['./manager-dashboard.component.css'],
})
export class ManagerDashboardComponent {
  dateRange;
  currentTab = 'myWork';
  loading = true;
  dashType = null;
  stateParams;
  isFreeSubscription: boolean;
  @Select(UserState.getCurrentUserData) user;
  constructor(
    private router: Router,
    private params: RouterService,
    private routerState: ActivatedRoute,
    private store: Store
  ) {}
  ngOnInit() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationStart),
        takeUntil(this.destroy$)
      )
      .subscribe((event: any) => {
        const urlTree = this.router.parseUrl(event.url);
        const queryParams = urlTree.queryParams;
        this.dashType = !queryParams.dashType
          ? 'my-work'
          : queryParams.dashType;
      });

    this.routerState.params
      .pipe(takeUntil(this.destroy$))
      .subscribe((routeParams) => {
        this.stateParams = this.params.getState(this.routerState).params;
        this.dashType = !this.stateParams.dashType
          ? 'my-work'
          : this.stateParams.dashType;
      });
  }
  onDateRangeChange(event) {
    this.dateRange = {
      startDate: event.startDate,
      endDate: event.endDate,
    };
  }
  protected destroy$ = new Subject<void>();

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
