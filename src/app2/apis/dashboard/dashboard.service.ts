import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { map, tap, shareReplay } from 'rxjs/operators';
@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  responseCache: any = {};
  constructor(
    private readonly http: HttpClient,
    private readonly store: Store
  ) {}
  fetchCounts(params) {
    const cacheKey = `/dashboard_counts/${JSON.stringify(params)}`;
    const cacheData = this.responseCache[cacheKey];
    if (cacheData) return cacheData;
    else {
      const request$ = this.http.post('/dashboard_counts', params).pipe(
        map((response: any) => response),
        shareReplay(1)
      );

      this.responseCache[cacheKey] = request$;
      return request$;
    }
  }

  updateUnReadItem(params) {
    return this.http.post('/dashboard_entities/read', params);
  }
  getLastView(params) {
    const cacheKey = `dashboard_entities?tab_name=${params}`;
    return this.http.get(cacheKey)
  }

  getTaskData(type = 'total', dateRange) {
    const cacheKey = `/v2/dashboard_tasks?filter_type=total&${dateRange}`;
    const cacheData = this.responseCache[cacheKey];
    if (cacheData) return cacheData;
    else {
      const request$ = this.http.get(cacheKey).pipe(
        map((response: any) => response),
        shareReplay(1)
      );

      this.responseCache[cacheKey] = request$;
      return request$;
    }
  }
  getIssuesData(type = 'total', dateRange) {
    const api = `/service/dvapi_service/get_issues`;
    const payload = {
      ...dateRange,
      status: [1, 2, 3],
      assigned_to: this.store.selectSnapshot(
        (state) => state.user.currentUser.id
      ),
    };
    const cacheKey = api + JSON.stringify(payload);
    const cacheData = this.responseCache[cacheKey];
    if (cacheData) return cacheData;
    else {
      const request$ = this.http.post(api, payload).pipe(
        map((response: any) => response),
        shareReplay(1)
      );

      this.responseCache[cacheKey] = request$;
      return request$;
    }
  }

  getWorkflowData(type = 'pending', dateRange) {
    const cacheKey = `/v2/dashboard_workflows?filter_type=total&${dateRange}`;
    const cacheData = this.responseCache[cacheKey];
    if (cacheData) return cacheData;
    else {
      const request$ = this.http.get(cacheKey).pipe(
        map((response: any) => response),
        shareReplay(1)
      );

      this.responseCache[cacheKey] = request$;
      return request$;
    }
  }
  getMyProjectsData(type = 'pending', dateRange: any) {
    const api = '/service/dvapi_service/diligence_search';
    const payload = {
      include_contacts: true,
      include_custom_fields: true,
      include_dates: true,
      filters: {
        and: [],
      },
      start_date: dateRange.start_date || null,
      end_date: dateRange.end_date || null,
      type: 'my-work-projects',
      include_counts: true,
    };

    if (dateRange.end_due_date) {
      payload.filters.and = [
        ...payload.filters.and,
        {
          filter_key: 'due_at',
          filter_name: 'Due At',
          type: 'date',
          operations: 'lte',
          filter_value: dateRange.end_due_date,
        },
      ];
    }
    if (dateRange.start_due_date) {
      payload.filters.and = [
        ...payload.filters.and,
        {
          filter_key: 'due_at',
          filter_name: 'Due At',
          type: 'date',
          operations: 'gte',
          filter_value: dateRange.start_due_date,
        },
      ];
    }
    const cacheKey = api + JSON.stringify(payload);

    const cacheData = this.responseCache[cacheKey];
    if (cacheData) return cacheData;
    else {
      const request$ = this.http.post(api, payload).pipe(
        map((response: any) => response),
        shareReplay(1)
      );

      this.responseCache[cacheKey] = request$;
      return request$;
    }
  }

  clearAllCache() {
    this.responseCache = {};
  }
}
