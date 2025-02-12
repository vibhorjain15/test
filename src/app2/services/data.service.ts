import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';

import { GridService } from './grid.service';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import {
  GetCurrentUser,
  GetSubscriptionLimit,
  GetTeamMembers,
} from '../store/user/user.action';
import { BehaviorSubject } from 'rxjs';
@Injectable()
export class DataService {
  userData;
  gridState;
  workflowData;
  obsWorkflow = new BehaviorSubject(null);
  private feedBack$ = new BehaviorSubject<any>({});
  selectedfeedBack$ = this.feedBack$.asObservable();

  setfeedBack(product: any) {
    this.feedBack$.next(product);
  }
  constructor(
    private store: Store,
    private gridService: GridService,
    private readonly http: HttpClient
  ) {}
  setUserData(userData) {
    this.userData = userData;
    this.gridState = {};
    this.store.dispatch(new GetCurrentUser());
    this.store.dispatch(new GetTeamMembers());
    this.store.dispatch(new GetSubscriptionLimit());
    this.gridService.getGridSates().subscribe((response: any) => {
      this.gridState = response;
    });
  }

  async getUserData() {
    return await new Promise((res, rej) => {
      if (!this.userData) {
        forkJoin([
          this.http.get('account'),
          this.http.get('subscription_limits'),
          this.http.get('users/me'),
          this.http.get('team_members'),
        ]).subscribe(
          ([currentUser, subscription_limits, user_profile, team_members]) => {
            this.setUserData({
              currentUser,
              subscription_limits,
              user_profile,
              team_members,
            });
            res(this.userData);
          }
        );
      } else {
        res(this.userData);
      }
    });
  }

  getGridState(gridName: string) {
    if (this.gridState[gridName]) return this.gridState[gridName];
    else return [];
  }

  setGridState(state) {
    this.gridState = state;
  }

  getWorkflowData() {
    this.obsWorkflow.next(this.workflowData);
    return this.obsWorkflow;
  }

  setWorkflowData(data) {
    this.workflowData = data;
    this.obsWorkflow.next(this.workflowData);
  }
}
