import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ProjectsService {
  constructor(private readonly http: HttpClient) {}

  fetchResponseHistory(params) {
    return this.http.get(
      `/diligences/${params.diligenceId}/review_history?review_type=${params.type}`
    );
  }

  revisionExportToDoc(params) {
    return this.http.post('service/excel_services/revision_export', params, {
      responseType: 'blob',
      observe: 'response',
    });
  }
}
