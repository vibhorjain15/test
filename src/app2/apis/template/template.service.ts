import { HttpClient, HttpUrlEncodingCodec } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class TemplateService {
  responseCache = {};
  constructor(private readonly http: HttpClient) {}
  
  clearCache() {
    this.responseCache = {};
  }

  getTemplateSections(templateId, version) {
    return this.http.get(
      `templates/${templateId}/versions/${version}/sections`
    );
  }

  createBulkTemplateSection(templateId, params) {
    return this.http.post(`templates/${templateId}/bulk_sections`, params);
  }

  createTemplateSection(params) {
    return this.http.post(`sections`, params);
  }

  updateTemplateSection(id, params) {
    return this.http.put(`sections/${id}`, params);
  }

  deleteTemplateSection(id) {
    return this.http.delete(`sections/${id}`);
  }

  moveQuestions(params) {
    return this.http.patch('questions/move', params);
  }

  moveSubCategories(params) {
    return this.http.patch('sections/move', params);
  }

  deleteQuestionsTemplateSection(id, questionsId) {
    return this.http.delete(`sections/${id}/questions/${questionsId}`);
  }

  CreateQuestionsTemplateSection(id, payload) {
    return this.http.post(`sections/${id}/questions`, payload);
  }

  createQuestionsGrid(params) {
    return this.http.post(`grids`, params);
  }

  createQuestionsDropdown(params) {
    return this.http.post(`question_dropdowns`, params);
  }

  getStrategies() {
    return this.http.get('strategies');
  }
  getQuestions(params) {
    return this.http.get(`questions`, {
      params: params,
    });
  }

  updateQuestions(id, params) {
    return this.http.put(`questions/${id}`, params);
  }

  getQuestionsResponseType() {
    return this.http.get(`response_types`);
  }

  getQuestionsOptions(id) {
    const api = `questions/${id}/options`;
    const cacheKey = api;
    const cacheData = this.responseCache[cacheKey];
    if (cacheData) return cacheData;
    else {
      const request$ = this.http.get(api).pipe(shareReplay(1));
      this.responseCache[cacheKey] = request$;
      return request$;
    }
  }

  getQuestionsGrid(gridId, gridVersion) {
    const api = `grids/${gridId}/versions/${gridVersion}`;
    const cacheKey = api;
    const cacheData = this.responseCache[cacheKey];
    if (cacheData) return cacheData;
    else {
      const request$ = this.http.get(api).pipe(shareReplay(1));
      this.responseCache[cacheKey] = request$;
      return request$;
    }
  }

  convertCategory(payload) {
    return this.http.patch(`sections/make_parent_sections`, payload);
  }

  createQuestionSuggestionNew(payload) {
    return this.http.post(
      'service/es_service/question_suggestions_new',
      payload
    );
  }
  copyQuestions(payload) {
    return this.http.post(
      `templates/${payload.destination_template_id}/versions/${payload.template_version}/clone_questions`,
      payload
    );
  }

  getFrequency() {
    return this.http.get('frequency');
  }

  getTemplateData(templateID) {
    return this.http.get(`templates/v2/${templateID}`);
  }

  getMappedQuestions(templateId, questionId) {
    return this.http.get(
      `templates/${templateId}/questions/${questionId}/mapped_questions`
    );
  }
  getQuestionsFromTemplateId(templateId) {
    return this.http.get(`questions?template_id=${templateId}`);
  }
  getAllTemplated() {
    return this.http.get(`templates`);
  }

  createQuestionMapping(payload) {
    return this.http.post(`review_projects/mapping`, payload);
  }
  deleteQuestionMapping(payload) {
    return this.http.delete(`review_projects/mapping`, { body: payload });
  }

  getNestedQuestions(qID, tID) {
    return this.http.get(`nestedquestions?questionId=${qID}&templateId=${tID}`);
  }

  editTemplate(templateID: number, payload: any) {
    return this.http.put(`templates/${templateID}`, payload);
  }
  getWidgets() {
    return this.http.get(`widgets`);
  }

  getProjectTags() {
    return this.http.get(`reports/new/project_tags`);
  }

  updateWidget(id, payload) {
    return this.http.put(`widgets/${id}`, payload);
  }

  createWidget(payload) {
    return this.http.post(`widgets/`, payload);
  }

  updateStandardizedText(payload) {
    return this.http.put(`standardized_texts`, payload);
  }
  getStandardizedText(tID, qID) {
    return this.http.get(
      `templates/${tID}/questions/${qID}/standardized_texts`
    );
  }
  getQuestionInfo(TemplateID, version) {
    return this.http.get(
      `templates/${TemplateID}/versions/${version}/complexity`
    );
  }

  getScoreRules(tID, tVersion) {
    return this.http.get(
      `v2/entity_score_rules?template_id=${tID}&version=${tVersion}`
    );
  }

  getSectionRatingScales(tID) {
    return this.http.get(`rating_scales/GetSectionRatingScales/${tID}`);
  }

  getRatingScales(id, version = 0) {
    return this.http.get(
      `v2/rating_scales/${id}/versions/${version}/rating_scale_definitions`
    );
  }

  getRatingScalesByRatingSchemeId(ratingSchemeId) {
    return this.http.get(
      `v2/rating_scale_definitions?rating_scheme_id=${ratingSchemeId}`
    );
  }

  getTemplateRatingSchemeMapping(id, version) {
    return this.http.get(
      `templates/${id}/versions/${version}/TemplateRatingSchemeMappings`
    );
  }

  createNestedQuestions(sectionId, payload) {
    return this.http.post(`sections/${sectionId}/NestedQuestions`, payload);
  }

  updateQuetionListIndexAfterSort(sectionId, questionId, payload) {
    return this.http.put(
      `sections/${sectionId}/questions/${questionId}`,
      payload
    );
  }
  updateNestedQuetionIndex(sectionId, questionId, nestedQuestionId, payload) {
    return this.http.patch(
      `sections/${sectionId}/questions/${questionId}/nestedQuestions/${nestedQuestionId}`,
      payload
    );
  }
  updateCategoryIndexAfterSort(sectionId, payload) {
    return this.http.put(`sections/${sectionId}`, payload);
  }
  addNotes(payload) {
    return this.http.post(`notes`, payload);
  }

  updateNotes(payload) {
    return this.http.put(`notes/${payload.id}`, payload);
  }

  getNotes(params) {
    return this.http.get(`/notes`, { params });
  }

  scoreRules(rule) {
    return this.http.post(`v2/entity_score_rules`, rule);
  }

  getAllTemplates() {
    return this.http.get('templates');
  }

  deleteTemplate(templateID: number) {
    return this.http.delete(`templates/${templateID}`);
  }

  cloneTemplate(templateID: number) {
    return this.http.post(`templates/${templateID}/clone`, []);
  }
  getPublicDocuments() {
    return this.http.get(`PublicDocuments`);
  }
  uploadAttachment(payload) {
    return this.http.post(`PublicDocuments/Upload`, payload, {
      reportProgress: true,
      observe: 'events',
    });
  }
  downloadAttachment(filename) {
    return this.http.get(
      `PublicDocuments/Download/firm2?file_name=${filename}`,
      { responseType: 'blob' }
    );
  }
  getColumnTypes() {
    return this.http.get(`column_types`);
  }
  getExistingQuestions(payload) {
    const api = 'service/es_service/question_suggestions';
    return this.http.post(api, payload)
  }
  getQuestionFilter(payload) {
    const api = 'service/es_service/question_filters';
    return this.http.post(api, payload)
  }
  getTemplateRatingScale() {
    return this.http.get('v2/rating_scales');
  }

  postRatingAutoMap(payload) {
    return this.http.post(
      `/templates/${payload.template_id}/versions/${payload.template_version}/TemplateRatingSchemeMappings/auto_map`,
      payload
    );
  }

  getFirmTeams(firmsId) {
    return this.http.get(`/firms/${firmsId}/teams`);
  }

  getPermissionLevels() {
    return this.http.get(`/PermissionLevels`);
  }

  getVendors() {
    return this.http.get('/vendor_types');
  }

  uploadTemplateFile(url, payload) {
    return this.http.post(url, payload);
  }

  addGridFormulas(grid, payload) {
    return this.http.patch(`grids/${grid}/formulas`, payload);
  }

  deleteScoreRules(id) {
    return this.http.delete(`v2/entity_score_rules/${id}`);
  }

  editScoreRules(id, payload) {
    return this.http.put(`v2/entity_score_rules/${id}`, payload);
  }

  deleteNotes(id) {
    return this.http.delete(`notes/${id}`);
  }

  downloadTemplateAsExcel(payload) {
    return this.http.post(
      `service/excel_services/excel_template_export`,
      payload,
      { responseType: 'blob' }
    );
  }

  activateTemplate(templateID: number, payload: any) {
    return this.http.patch(`templates/${templateID}/activate`, payload);
  }

  getAllNestedRules(templateId: number, payload: any) {
    return this.http.post(`nestingrules/get_rules`, {
      question_ids: payload,
      template_id: templateId,
    });
  }

  getPresetTags(templateId: number, questionGroupId: number) {
    return this.http
      .get(
        `templates/${templateId}/questions/${questionGroupId}/predefined_document_tags`
      )
      .pipe(
        map((response: any) => {
          return response.map((tag) => ({
            id: tag.document_tag_id,
            name: tag.document_tag_name,
          }));
        })
      );
  }

  getReusablePresetTags(questionIds: number[]) {
    return this.http
      .post(`reusable_predefined_documents_tags`, questionIds)
      .pipe(
        map((response: any) => {
          const tagsData = {};
          for (const key in response) {
            const tags = response[key].map((tag) => ({
              id: tag.document_tag_id,
              name: tag.document_tag_name,
            }));
            tagsData[key] = tags;
          }
          return tagsData;
        })
      );
  }
}
