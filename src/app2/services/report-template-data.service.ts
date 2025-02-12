import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ReportTemplateDataservice {
  selected_report_template = {};
  constructor(private readonly http: HttpClient) {
    this.getHtmlReport = this.getHtmlReport.bind(this);
  }

  setReportTemplate(template: any) {
    return (this.selected_report_template = template);
  }

  getSelectedReportTemplate() {
    return this.selected_report_template;
  }

  getTemplates(params: any) {
    return this.http.get('report_templates', { params });
  }

  getTemplate(params: { id: any; is_new_report: any }) {
    return this.http.get('report_templates/' + params.id, {
      params: { is_new_report: params.is_new_report },
    });
  }

  getHtmlReport(id: any) {
    return this.http.get('reports/html/' + id);
  }

  downloadReportTemplate(id: any) {
    return this.http.get('reports/download/' + id);
  }

  updateTemplate(id: any, params: any) {
    return this.http.put('report_templates/' + id, params);
  }

  create(params: any) {
    return this.http.post('report_templates', params);
  }

  deleteReportTemplate(params: { id: any; is_new_report: any }) {
    return this.http.delete('report_templates/' + params.id, {
      params: { is_new_report: params.is_new_report },
    });
  }

  getReports() {
    return this.http.get('reports');
  }

  getReport(id: any) {
    return this.http.get('reports/' + id);
  }

  deleteRealtimeReport(id: any) {
    return this.http.delete('reports/' + id);
  }

  deleteNewReport(id: any) {
    return this.http.delete('reports/' + id, {
      params: { is_new_report: true },
    });
  }

  updateReport(id: any, params: any) {
    return this.http.put('report_templates/' + id, params);
  }

  addReportDocument(params) {
    return this.http.post('/reports/new/report_template_mapping', params);
  }
}
