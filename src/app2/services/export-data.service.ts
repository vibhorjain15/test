import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ExportDataService {
  constructor(private readonly http: HttpClient) {}

  getTemplates() {
    return this.http.get('templates', { params: { in_use: true } });
  }

  createReport(params) {
    return this.http.get('diligences/generate_excel_report', { params });
  }

  createReportForQuestions(params) {
    return this.http.post(
      'service/excel_services/diligence_question_report',
      params
    );
  }

  getQuestionFilters(params) {
    return this.http.post('service/es_service/question_filters', params);
  }

  getQuestionSuggestions(params) {
    return this.http.post(
      'service/es_service/excel_question_suggestions',
      params
    );
  }

  generateBulkPresentationReports(payload) {
    return this.http.post(
      'service/excel_services/presentation_report_upload/upload',
      payload
    );
  }
}
