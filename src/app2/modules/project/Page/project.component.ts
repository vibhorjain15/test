import { Component, OnInit } from '@angular/core';
import { HomePageService } from 'src/app2/services/home-page.service';
import { RouterService } from 'src/app2/services/router.service';

@Component({
  selector: 'app-project',
  template: `
    <div *ngIf="loading" class="print-preview-spinner">
      <app-spinner></app-spinner>
    </div>

    <ng-container *ngIf="!loading">
      <app-dv-tab></app-dv-tab>
      <router-outlet></router-outlet>
    </ng-container>
  `,
})
export class ProjectComponent implements OnInit {
  loading = true;
  constructor(
    private readonly home: HomePageService,
    private readonly routerService: RouterService
  ) {}
  ngOnInit() {
    let state = this.routerService.getState();
    this.home
      .navigateToProjectPage(state.params.diligenceId, state._routerState.url)
      .subscribe((val) => {
        if (val)
          setTimeout(() => {
            this.loading = false;
          }, 1000);
      });
  }
}
