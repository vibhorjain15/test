import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import * as angular from 'angular';
import { take, tap } from 'rxjs/operators';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import { UserState } from 'src/app2/store/user/user.state';
import {
  getIssuePriorities,
  getIssueStatuses,
  getIssueTags,
} from '../../store/recommendation.action';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'dv-recommendations',
  templateUrl: './recommendations.component.html',
})
export class RecommendationsComponent implements OnInit {
  @Input() entity_type: any;
  @Input() entity_id: any;
  @Input() onlyGrid = false;
  // Applicable only for project level recommendation
  @Input() diligence: boolean;
  @Input() showHeaderUpperCase: boolean;
  @Input() dateRangeFilter;
  @Input() recommendationsData = null; // if we need to pass data directly
  @Input() getRowClass? = null; // if we need to pass data directly
  @Input() onRowClicked = (e) => {};
  @Output() onUpdate = new EventEmitter()
  usertype = 'investor';
  @Select(UserState.getCurrentUserData) user;
  @Select(UserState.getActivePanelId) activePanelId;
  @Input() isDashboard = false;
  isSidePanelOpened = false;
  loading = true;
  constructor(
    private panelService: SidePanelService,
    private store: Store
  ) {}
  ngOnInit(): void {
    this.panelService.sidePanelSub.subscribe((val) => {
      this.isSidePanelOpened = val;
    });
    this.user.pipe(take(1))
      .subscribe((user) => {
        if (user) {
          this.usertype = user.type;
          forkJoin([
            this.store.dispatch(new getIssueStatuses()),
            this.store.dispatch(new getIssuePriorities()),
            this.store.dispatch(new getIssueTags()),
          ]).subscribe(() => {
            this.loading = false;
          });
        }
      });
  }
}

