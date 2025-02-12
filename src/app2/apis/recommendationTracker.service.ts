import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RecommendationTrackerService {
  constructor(private readonly http: HttpClient) {}

  getIssueList() {
    return this.http.post(`service/dvapi_service/get_issues`, {});
  }

  createIssue(payload: any) {
    return this.http.post(`service/dvapi_service/issue`, payload);
  }

  updateIssue(payload: any) {
    return this.http.put(`service/dvapi_service/issue`, payload);
  }

  deleteIssue(payload: any) {
    return this.http.delete(`service/dvapi_service/issue`, { body: payload });
  }

  getIssueWithId(payload: any) {
    return this.http.post(`service/dvapi_service/get_issues`, payload);
  }

  getIssueStatuses() {
    return this.http.get(`Issue_statuses`);
  }

  getIssuePriorities() {
    return this.http.get(`Issue_priorities`);
  }

  updateIssuePriorities(payload) {
    return this.http.put(`Issue_priorities`, payload);
  }

  getIssueCounts(payload: any) {
    return this.http.post(`service/dvapi_service/get_issue_count`, payload);
  }

  getTag(type: any) {
    return this.http.get('tags', { params: { type: type } });
  }

  getComments(payload: any) {
    return this.http.post(`service/dvapi_service/get_issue_comments`, payload);
  }

  createComment(payload: any) {
    return this.http.post(`service/dvapi_service/issue_comment`, payload);
  }

  updateComment(payload: any) {
    return this.http.put(`service/dvapi_service/issue_comment`, payload);
  }

  deleteComment(payload: any) {
    return this.http.delete(`service/dvapi_service/issue_comment`, payload);
  }

  getAssociatedContacts(entity_id: any, entity_type: any) {
    return this.http.get(
      `contacts?entity_id=${entity_id}&entity_type=${entity_type}`
    );
  }

  getEntityExternalSubscribers(entity_id: any, entity_type: any, firm_id: any) {
    return this.http.get(
      `entitysubscribers?entity_id=${entity_id}&entity_type=${entity_type}&firm_id=${firm_id}`
    );
  }
}
