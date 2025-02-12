import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import {
  DeleteAllRecommendationData,
  deleteIssueTag,
  getIssuePriorities,
  getIssueStatuses,
  getIssueTags,
  updateIssuePriorities,
  updateIssueTags,
} from './recommendation.action';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { RecommendationTrackerService } from 'src/app2/apis/recommendationTracker.service';

@State<any>({
  name: 'recommendation',
  defaults: {
    isLoading: false,
    error: null,
  },
})
@Injectable()
export class RecommendationState {
  constructor(
    private readonly recommendationService: RecommendationTrackerService
  ) {}

  @Selector()
  static getIssuePrioritiesPref(state: any) {
    return state.recommendationPriorities;
  }
  @Selector()
  static getIssueStatusesPref(state: any) {
    return state.recommendationStatuses;
  }
  @Selector()
  static getIssueTagsPref(state: any) {
    return state.recommendationTags;
  }

  @Action(getIssuePriorities)
  getIssuePriorities({ patchState, getState }: StateContext<any>) {
    if (getState()?.recommendationPriorities) return;
    patchState({
      isLoading: true,
      error: null,
    });
    return this.recommendationService.getIssuePriorities().pipe(
      tap((res: any) => {
        patchState({
          recommendationPriorities: res,
          isLoading: false,
          error: null,
        });
      }),
      catchError((error) => {
        patchState({
          isLoading: false,
          error:
            'Something went wrong while fetching recommendation prioities data in store',
        });
        return of([]);
      })
    );
  }

  @Action(getIssueStatuses)
  getIssueStatuses({ patchState, getState }: StateContext<any>) {
    if (getState()?.recommendationStatuses) return;
    patchState({
      isLoading: true,
      error: null,
    });
    return this.recommendationService.getIssueStatuses().pipe(
      tap((res: any) => {
        patchState({
          recommendationStatuses: res,
          isLoading: false,
          error: null,
        });
      }),
      catchError((error) => {
        patchState({
          isLoading: false,
          error:
            'Something went wrong while fetching recommendation statuses data in store',
        });
        return of([]);
      })
    );
  }

  @Action(getIssueTags)
  getIssueTags({ patchState, getState }: StateContext<any>) {
    if (getState()?.recommendationTags) return;
    patchState({
      isLoading: true,
      error: null,
    });
    return this.recommendationService.getTag('Issue').pipe(
      tap((res: any) => {
        patchState({
          recommendationTags: res,
          isLoading: false,
          error: null,
        });
      }),
      catchError((error) => {
        patchState({
          isLoading: false,
          error:
            'Something went wrong while fetching recommendation tags data in store',
        });
        return of([]);
      })
    );
  }

  @Action(updateIssuePriorities)
  updateIssuePriorities(
    { patchState }: StateContext<any>,
    { payload }: updateIssuePriorities
  ) {
    patchState({
      isLoading: true,
      error: null,
    });
    return this.recommendationService.updateIssuePriorities(payload).pipe(
      tap((res: any) => {
        patchState({
          recommendationPriorities: JSON.parse(JSON.stringify(res)),
          isLoading: false,
          error: null,
        });
      }),
      catchError((error) => {
        patchState({
          isLoading: false,
          error:
            'Something went wrong while updating recommendation prioities data in store',
        });
        return of([]);
      })
    );
  }

  @Action(updateIssueTags)
  updateIssueTags({ patchState }: StateContext<any>, { tagsList }: any) {
    patchState({
      recommendationTags: [...tagsList],
    });
  }

  @Action(deleteIssueTag)
  deleteIssueTag({ getState, patchState }: StateContext<any>, { tag }: any) {
    let taglist = JSON.parse(JSON.stringify(getState().recommendationTags));
    if (taglist.length) {
      let index = taglist.findIndex((tags) => tags.id == tag.id);
      if (index != -1) {
        taglist.splice(index, 1);
        patchState({
          recommendationTags: taglist,
        });
      }
    }
  }

  @Action(DeleteAllRecommendationData)
  DeleteAllRecommendationData({ patchState }: StateContext<any>) {
    patchState({
      recommendationTags: null,
      recommendationPriorities: null,
      recommendationStatuses: null,
      isLoading: false,
      error: null,
    });
  }
}
