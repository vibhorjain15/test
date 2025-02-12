import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DueDiligenceDataService {
  constructor(private readonly http: HttpClient) {}

  setStatus(id, status) {
    const headers = new HttpHeaders().set(
      'diligence-status',
      status.toLowerCase()
    );
    return this.http.put(
      `diligences/${id}`,
      { status: status },
      { headers: headers }
    );
  }

  extendDueDate(payload) {
    return this.http.post('dd_dueDate_extensions', payload);
  }

  updateDueDate(dueDateId: any, params: any) {
    const payload = {
      status: params.status,
      action_reason: params.action_reason,
    };
    return this.http.put(`dd_dueDate_extensions/${dueDateId}`, payload);
  }

  updateResponseStatus(
    id,
    status,
    diligenceId,
    reviewId,
    stepId,
    assignmentId
  ) {
    const payload = {
      status: status,
    };
    return this.http.patch(
      `diligences/${diligenceId}/ratings/${id}/reviews/${reviewId}/steps/${stepId}/assignments/${assignmentId}/status`,
      payload
    );
  }

  getReviewerForSection(diligenceId, sectionId) {
    return this.http.get(
      `diligences/${diligenceId}/sections/${sectionId}/reviews`
    );
  }
  saveRequest(payload) {
    return this.http.put('requesttrackers', payload);
  }


  createDiligence(payload:any) {
    return this.http.post(`v2/diligences`,payload);
  }

  saveDocument(endPoint:any,payload:any) {
    return this.http.post(endPoint,payload);
  }
}
