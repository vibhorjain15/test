import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, tap, shareReplay } from 'rxjs/operators';
import { NewRequestTypes } from 'src/app2/shared/constants/constant';

@Injectable({
  providedIn: 'root',
})
export class EntityUtilsService {
  responseCache: any = {};
  constructor(private readonly httpClient: HttpClient) {}

  getDynamicDefaultFilterOptions(filter: any): Observable<Object> {
    const path = (filter.endpoint as string).substring(
      filter.endpoint.indexOf('api/') + 4
    );

    const cacheKey = path + JSON.stringify(filter.request_params);
    const cacheData = this.responseCache[cacheKey];

    if (cacheData) {
      return cacheData;
    } else {
      const request$ = this.httpClient[filter.method.toLowerCase()](
        path,
        filter.request_params
      ).pipe(
        map((response: any) =>
          filter.method.toLowerCase() === 'get' ? response : response.data
        ),
        shareReplay(1) // This will cache the last (1) emitted value and share it amongst all the subscriptions of this observable hence preventing multiple API call
      );

      this.responseCache[cacheKey] = request$;

      return request$;
    }
  }

  getEntityFilter(api, params): Observable<Object> {
    const cacheKey = JSON.stringify(params);
    const cacheData = this.responseCache[cacheKey];

    if (cacheData) {
      return cacheData;
    } else {
      const request$ = this.httpClient.post(api, params).pipe(
        map((response: any) => response),
        shareReplay(1) // This will cache the last (1) emitted value and share it amongst all the subscriptions of this observable hence preventing multiple API call
      );

      this.responseCache[cacheKey] = request$;

      return request$;
    }
  }

  getCreateNewTooltip(modalType) {
    if (modalType === NewRequestTypes.InvestorRequest)
      return 'Manage a New Investor Request';
    else if (modalType === NewRequestTypes.StandardDDQ)
      return 'Create a New Standard DDQ';
    else return 'Add New Project';
  }

  skimCustomFilterData(filterData) {
    let customFilter = [];
    filterData.forEach((filterItem) => {
      if (filterItem.advance_filter_value) {
        customFilter.push({
          advance_filter_value: filterItem.advance_filter_value,
          condition: filterItem.condition,
          filter_key: filterItem.criteria_obj.filter_key,
          filter_name: filterItem.filter_name,
          filter_value: filterItem.filter_name,
        });
      }
    });
    return customFilter;
  }

  generateSearchFilter(filterData, search_filters_response) {
    let search_criterias = [];
    search_filters_response.default_filters.forEach((defaultFilter) => {
      let defaultFilterIndex = filterData.findIndex(
        (filterItem) => filterItem.filter_key == defaultFilter.filter_key
      );
      if (defaultFilterIndex > -1) {
        search_criterias.push({
          criteria_obj: defaultFilter,
          condition: filterData[defaultFilterIndex].condition,
          filter_name: filterData[defaultFilterIndex].filter_name,
          filter_value: filterData[defaultFilterIndex].filter_value,
          advance_filter_value:
            filterData[defaultFilterIndex].advance_filter_value ?? '',
        });
        filterData.splice(defaultFilterIndex, 1);
      } else {
        search_criterias.push({
          criteria_obj: defaultFilter,
          condition: defaultFilter.default_operation.value,
          filter_name: defaultFilter.filter_name,
          filter_value: defaultFilter.filter_name,
          advance_filter_value: '',
        });
      }
    });
    filterData.forEach((filterItem) => {
      let customFilterIndex = search_filters_response.custom_filters.findIndex(
        (customFilter) => customFilter.filter_key === filterItem.filter_key
      );
      if (customFilterIndex > -1)
        search_criterias.push({
          criteria_obj:
            search_filters_response.custom_filters[customFilterIndex],
          condition: filterItem.condition,
          filter_name: filterItem.filter_name,
          filter_value: filterItem.filter_value,
          advance_filter_value: filterItem.advance_filter_value ?? '',
        });
    });
    return search_criterias;
  }
}
