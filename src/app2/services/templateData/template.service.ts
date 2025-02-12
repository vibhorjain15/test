import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TemplateDataService {
  excel_parser_data;
  word_parser_data;
  selectedSheets;
  excel_file;
  word_file;
  templateParams;
  requestTrackerParams;
  diligenceParams;
  templateService; // RouterBUg
  constructor(private readonly http: HttpClient) {
    this.excel_parser_data = [];
    this.word_parser_data = {};
    this.selectedSheets = [];
    this.excel_file = {};
    this.word_file = [];
    this.templateParams = {};
    this.requestTrackerParams = {};
    this.diligenceParams = {};
  }

  createNewTemplate(params: any) {
    return this.http.post('templates', params);
  }

  setExcelParserData(data: any) {
    return this.templateService.setExcelParcerData(data);
  }

  setOriginalExcelFile(file: any) {
    return this.templateService.setOriginalExcelFile(file);
  }

  getOriginalExcelFile() {
    return this.templateService.getOriginalExcelFile();
  }

  setWordParserData(data: any) {
    return this.templateService.setWordParcerData(data);
  }

  getWordParserData() {
    return this.templateService.getWordParcerData();
  }

  setOriginalWordFile(file: any) {
    return this.templateService.setOriginalWordFile(file);
  }

  getOriginalWordFile() {
    return this.templateService.getOriginalWordFile();
  }

  setRequestTrackerParams(params: any) {
    return this.templateService.setRequestTrackerParams(params);
  }

  getRequestTrackerParams() {
    return this.templateService.getRequestTrackerParams();
  }

  getExcelParserData() {
    return this.templateService.getExcelParcerData();
  }

  setSelectedSheets(sheets: any) {
    return this.templateService.setSelectedSheets(sheets);
  }

  getSelectedSheets() {
    return this.templateService.getSelectedSheets();
  }

  setTemplateParams(params: any) {
    return this.templateService.setTemplateParams(params);
  }

  getTemplateParams() {
    return this.templateService.getTemplateParams();
  }

  setDiligenceParams(params: any) {
    return this.templateService.setDiligenceParams(params);
  }

  getDiligenceParams() {
    return this.templateService.getDiligenceParams();
  }

  getTemplates(params: any) {
    return this.http.get('templates', { params: params });
  }

  getTemplate(id: any) {
    return this.http.get(`templates/${id}`);
  }

  saveTemplate(id: any, params: any) {
    return this.http.put(`templates/${id}`, params);
  }

  getResponseTypes() {
    return this.http.get('response_types');
  }

  getSection(id: any) {
    return this.http.get(`sections/${id}`);
  }

  getSections(templateId: any, params: any) {
    return this.http.get(`templates/${templateId}/sections`, params);
  }

  getQuestions(params: any) {
    return this.http.get('questions', params);
  }
  getaggregations(params: any) {
    return this.http.get('response_aggregations', params);
  }

  getCustomQuestions(params: any) {
    return this.http.get('questions', params);
  }

  createQuestion(id: any, params: any) {
    return this.http.post(`sections/${id}/questions`, params);
  }

  updateTemplate(id: any, params: any) {
    return this.http.put(`templates/${id}`, params);
  }

  createSection(params: any) {
    return this.http.post('sections', params);
  }

  deleteTemplate(id: any) {
    return this.http.delete(`templates/${id}`);
  }

  // Need to understand
  cloneTemplate(id: any) {
    // return this.http.one('templates', id).all('clone').post();
  }

  deleteQuestion(sectionId: any, questionId: any) {
    return this.http.delete(
      'sections/' + sectionId + '/questions/' + questionId
    );
  }

  updateQuestion(id: any, params: any) {
    return this.http.put('questions/' + id, params);
  }

  removeSection(id: any) {
    return this.http.delete('sections/' + id);
  }

  updateSection(id: any, params: any) {
    return this.http.put('sections/' + id, params);
  }

  createGrid(id: any, params: any) {
    return this.http.post('templates/' + id + '/grids', params);
  }

  //TODO:
  //   createOfflineDDGrid(id: any, params: any) {
  //     return Restangular.one('dd_document_griditems').customPUT(params, '', {
  //       dd_document_lineitems_id: id,
  //     });
  //   }

  activateTemplate(id: any) {
    const params = { is_draft: false };
    return this.http.put('templates/' + id, params);
  }

  //TODO:
  //   activatePatchTemplate(id: string) {
  //     return this.http.patch('templates/' + id + '/activate');
  //   }

  getMappedQuestions(templateId: any, questionId: any) {
    return this.http.get(
      'templates/' +
        templateId +
        '/questions/' +
        questionId +
        '/mapped_questions'
    );
  }

  createVersion(templateId: any, templateVersion: any) {
    return this.http.post(
      'templates/' +
        templateId +
        '/versions/' +
        templateVersion +
        '/create_version',
      {}
    );
  }
}
