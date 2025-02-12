
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class QABulkService {
  constructor(private readonly http: HttpClient) {}

  bulkUpdate(params) {
    return this.http.post('service/dvapi_service/qabank_bulk_update', {
      filters: params,
    });
  }

  getEntityNames(params, type) {
    return this.http.post(`service/dvapi_service/${type}`, params);
  }

  getDuplicates(params) {
    return this.http.post(`service/es_service/find_duplicates`, params);
  }

  manageDuplicates(params) {
    return this.http.post(`service/es_service/manage_duplicates`, params);
  }

  getExactDuplicateArray(params) {
    return this.http.post(
      `service/es_service/remove_duplicates_preview`,
      params
    );
  }

  removeExactDuplicate(params) {
    return this.http.post(`service/es_service/remove_duplicates`, params);
  }

  deactivateResponse(params) {
    return this.http.post('response_actions', params);
  }
}