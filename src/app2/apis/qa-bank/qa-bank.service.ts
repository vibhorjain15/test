import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class QaBankApiService {
  constructor(private readonly http: HttpClient) {}

  questionSearch(params) {
    return this.http.post('service/es_service/qa_search_v1', params);
  }

  getQAFilters(params) {
    return this.http.post('service/es_service/qa_filters_v1', params);
  }

  getFirmLastUpdatedAt(params) {
    return this.http.post('service/es_service/firm_last_updation', params);
  }

  updateQaServer(params) {
    return this.http.post('service/es_service/update_qna', params);
  }

  getCustomFilter(params) {
    return this.http.get(params.endpoint);
  }

  updateQuestionData(params) {
    return this.http.post('response_actions', params);
  }

  reactivateQuestionData(params) {
    return this.http.post('service/es_service/reactive_responses', params);
  }
}
