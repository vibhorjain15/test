import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { RouterService } from 'src/app2/services/router.service';
@Component({
  selector: 'app-investor-view',
  templateUrl: './investor-view.component.html',
  styleUrls: ['./investor-view.component.css'],
})
export class InvestorViewComponent implements OnInit {
  dashType;
  stateParams: any;
  private ngUnsubscribe = new Subject<void>();
  constructor(
    private router: Router,
    private params: RouterService,
    private routerState: ActivatedRoute
  ) {}
  ngOnInit() {
    this.routerState.params.subscribe((routeParams) => {
      this.stateParams = this.params.getState(this.routerState).params;
      this.dashType = !this.stateParams.dashType
        ? 'my-work'
        : this.stateParams.dashType;
    });
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe((event: any) => {
        const urlTree = this.router.parseUrl(event.url);
        const queryParams = urlTree.queryParams;
        this.dashType = !queryParams.dashType
          ? 'my-work'
          : queryParams.dashType;
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
