import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TemplatesDataService {
  excel_parser_data = [];
  word_parser_data = {};
  selectedSheets = [];
  excel_file = {};
  word_file = [];
  templateParam = {};
  requestTrackerParams = {};
  diligenceParams = {};
  answerObj = {};

  constructor(private readonly http: HttpClient) {}

  createNewTemplate(params: any) {
    return this.http.post('templates', params);
  }

  setExcelParserData(data: any) {
    this.excel_parser_data = data;
  }

  setOriginalExcelFile(file: any) {
    this.excel_file = file;
  }

  getOriginalExcelFile() {
    return this.excel_file;
  }

  setWordParserData(data: any) {
    this.word_parser_data = data;
  }

  getWordParserData() {
    return this.word_parser_data;
  }

  setOriginalWordFile(file: any) {
    this.word_file = file;
  }

  getOriginalWordFile() {
    return this.word_file;
  }

  setRequestTrackerParams(params: any) {
    this.requestTrackerParams = params;
  }

  getRequestTrackerParams() {
    return this.requestTrackerParams;
  }

  getExcelParserData() {
    return this.excel_parser_data;
  }

  setSelectedSheets(sheets: any) {
    this.selectedSheets = sheets;
  }

  getSelectedSheets() {
    return this.selectedSheets;
  }

  setTemplateParams(params: any) {
    this.templateParam = params;
  }

  getTemplateParams() {
    return this.templateParam;
  }

  setDiligenceParams(params: any) {
    this.diligenceParams = params;
  }

  getDiligenceParams() {
    return this.diligenceParams;
  }

  getTemplates(params: any) {
    return this.http.get('templates', { params: params });
  }

  getTemplate(id: any) {
    return this.http.get('templates/' + id);
  }

  saveTemplate(id: any, params: any) {
    return this.http.put('templates/' + id, params);
  }

  getResponseTypes() {
    return this.http.get('response_types');
  }

  getSection(id: any) {
    return this.http.get('sections/' + id);
  }

  getSections(templateId: any, params: any) {
    return this.http.get('templates/' + templateId + '/sections', params);
  }

  getQuestions(params: any) {
    return this.http.get('questions', params);
  }

  getCustomQuestions(params: any) {
    return this.http.get('questions', params);
  }

  setAnswerObject(inputAnswerObj: any) {
    this.answerObj = inputAnswerObj;
  }

  getAnswerObject() {
    return this.answerObj;
  }

  createQuestion(id: any, params: any) {
    return this.http.post('sections/' + id + 'questions', params);
  }

  updateTemplate(id: any, params: any) {
    return this.http.put('templates/' + id, params);
  }

  createSection(params: any) {
    return this.http.post('sections', params);
  }

  deleteTemplate(id: any) {
    return this.http.delete('templates' + id);
  }

  cloneTemplate(id: any) {
    return this.http.post('templates/' + id + '/clone', {});
  }

  deleteQuestion(sectionId: any, questionId: any) {
    return this.http.delete(
      'sections' + sectionId + '/questions/' + questionId
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

  createOfflineDDGrid(id: any, params: any) {
    return this.http.put('dd_document_griditems', params, {
      params: { dd_document_lineitems_id: id },
    });
  }

  activateTemplate(id: any) {
    const params = { is_draft: false };

    return this.http.put('templates/' + id, params);
  }

  activatePatchTemplate(id: string) {
    return this.http.patch('templates/' + id + '/activate', {});
  }

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

  getPermissionsParams = () => this.templateParam;
}
