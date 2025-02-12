import { HttpClient, HttpContext, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TodoType } from 'src/app2/modules/questionnaire/types/todo.type';
import { canSetDefaultRating } from 'src/app2/modules/questionnaire/util/question-status.util';
import { RouterService } from 'src/app2/services/router.service';
import {
  FollowUpType,
  SKIP_BAD_GATEWAY_ALERT,
  SKIP_INTERNAL_SERVER_ERROR_ALERT,
} from 'src/app2/shared/constants/constant';

@Injectable({
  providedIn: 'root',
})
export class QuestionnaireService {
  constructor(
    private readonly http: HttpClient,
    private router: RouterService,
    private store: Store
  ) {}

  getQuestionCounts(diligenceId) {
    return this.http.get(`diligences/${diligenceId}/QuestionCounts`);
  }

  getDiligence(diligenceId) {
    return this.http.get(`diligences/${diligenceId}`);
  }

  getLinkedProjects(diligenceId) {
    return this.http.get(`diligences/${diligenceId}/linked_projects`);
  }

  getDisclaimerAssigments(params) {
    return this.http.get(`disclaimerassignments`, {
      params: {
        ...params,
      },
    });
  }

  updateReviewDefinition(definition) {
    return this.http.put(`review_definitions/${definition.id}`, definition);
  }

  UpdateDiligenceUpdateData(id, params) {
    return this.http.put(`diligences/${id}/update_data`, params);
  }

  updateDiligenceReview(id) {
    return this.http.put(`diligences/${id}/exit_review`, {});
  }
  updateDiligenceStatus(id, params) {
    const headers = new HttpHeaders().set(
      'diligence-status',
      params.status.toLowerCase()
    );

    return this.http.put(`diligences/${id}`, params, { headers: headers });
  }
  writetoOriginalDoc(params) {
    return this.http.post(
      `service/doc_processing_service/export_to_original`,
      params
    );
  }
  writetoDocWithoutTemplate(id) {
    return this.http.get(`diligences/document_export`, {
      params: { diligence_id: id },
    });
  }
  exportToWord(params) {
    return this.http.post(`service/excel_services/word_export`, params);
  }

  exportToExcel(params) {
    return this.http.post(`service/excel_services/diligence_report`, params);
  }
  exportQuestions(payload) {
    return this.http.post(
      `service/excel_services/diligence_question_report`,
      payload
    );
  }

  deleteQuestionanire(id, params) {
    const headers = new HttpHeaders().set(
      'diligence-status',
      params.status.toLowerCase()
    );
    return this.http.put(`diligences/${id}`, params, { headers: headers });
  }

  getCategoriesList(id, task_type, filter = 'default', q = '', rating = null) {
    let params: any = {};
    if (q) {
      params.q = q;
      params.filter = filter;
    } else
      params = {
        filter,
      };
    if (rating) {
      params.rating_scheme_id = rating.rating_scheme_id;
      params.rating_scheme_version = rating.rating_scheme_version;
    }
    params.task_type = task_type;
    return this.http.get(`v3/diligences/${id}/sections`, {
      params,
    });
  }
  getSubCategoriesList(id, parentId) {
    return this.http.get(
      `v2/diligences/${id}/sections?StatusFilter=default&parentID=${parentId}`
    );
  }

  getQuestionData(
    id,
    parentId,
    task_type,
    filter = 'default',
    q = '',
    rating = null,
    defaultScheme = null
  ) {
    let params: any = {};
    if (q) {
      params.q = q;
      params.filter = filter;
    } else
      params = {
        filter,
      };
    if (rating) {
      params.rating_scheme_id = rating.rating_scheme_id;
      params.rating_scheme_version = rating.rating_scheme_version;
      if (!defaultScheme && canSetDefaultRating(this.store))
        this.updateDefaultRatingScheme({
          rating_scheme_id: rating.rating_scheme_id,
          entity_id: +this.router.getState().params.diligenceId,
          entity_type: 'Duediligence',
        }).subscribe();
    }
    return this.http.get(
      `v3/diligences/${id}/sections/${parentId}/questions?task_type=${task_type}`,
      {
        params,
      }
    );
  }

  updateDefaultRatingScheme(params) {
    return this.http.put(`rating_scheme_defaults/system`, params);
  }

  undoReviewStatus(params) {
    return this.http.patch(
      `diligences/${params.diligenceId}/sections/${params.sectionId}/undo_status`,
      []
    );
  }

  getQuestionOptions(id) {
    return this.http.get(`questions/${id}/options`);
  }

  updateQuestionResponse(params) {
    return this.http.put(`v3/responses`, params);
  }

  updateQuestionSequenceId(params) {
    return this.http.put(`sequences`, params);
  }
  createQuestionSequenceId(params) {
    return this.http.post(`sequences`, params);
  }

  updateEntityAssignments(params) {
    return this.http.put(`EntityAssignments`, params);
  }

  updateWIPAllResposne(id) {
    return this.http.put(
      `api/diligences/${id}/mark_wip?mode=all_responses`,
      {}
    );
  }

  deleteQuestionResponse(id) {
    return this.http.delete(`v2/responses/${id}`);
  }

  getQuestionGridData(id, version, response_id) {
    if (response_id)
      return this.http.get(
        `grids/${id}/versions/${version}?response_id=${response_id}`
      );
    else return this.http.get(`grids/${id}/versions/${version}`);
  }

  deleteSequence(id) {
    return this.http.delete(`sequences/${id}`);
  }

  getTags(id) {
    return this.http.get(
      `tag_assignments?entity_id=${id}&entity_type=Question`
    );
  }

  fetchDefinitionById(id) {
    return this.http.get(`review_definitions/${id}`);
  }

  getAllProductEntities(entity_id) {
    return this.http.get(`funds/${entity_id}/related`);
  }

  getAllStrategies(params) {
    return this.http.post('service/dvapi_service/product_search', params);
  }

  getAllDiligences(entity_id, entity_type, diligence_id) {
    return this.http.get(
      `diligences/history?entity_id=${entity_id}&entity_type=${entity_type}&parent_diligence_id=${diligence_id}`
    );
  }

  getVehicles(params) {
    return this.http.post(`service/dvapi_service/vehicle_search`, params);
  }

  getRelatedDiligences(diligenceId) {
    return this.http.get(`diligences/${diligenceId}/rated_projects`);
  }

  postAutoFill(params) {
    return this.http.post('v2/diligences/autoFill', params);
  }

  postAutoFillMappedResponses(params) {
    return this.http.post('v2/diligences/autoFill', params);
  }

  postAutoFillRatings(params, diligenceId, project_id) {
    return this.http.post(
      `diligences/${diligenceId}/autofill_ratings?source_diligence_id=${project_id}`,
      params
    );
  }

  esServiceStatus() {
    return this.http
      .get(`service/es_service/health`, {
        context: new HttpContext()
          .set(SKIP_BAD_GATEWAY_ALERT, true)
          .set(SKIP_INTERNAL_SERVER_ERROR_ALERT, true),
      })
      .pipe(catchError(() => of([{ service_running: false }])));
  }

  postESAutoFill(payload) {
    return this.http.post('service/es_service/autofill_es', payload);
  }

  getAutofillHistory(diligenceId) {
    return this.http.get(`v3/diligences/${diligenceId}/autofill_audits`);
  }

  getAutoFillHistoryDetail(diligenceId, id) {
    return this.http.get(`v3/diligences/${diligenceId}/autofill_audits/${id}`);
  }

  undoAutofill(diligenceId, auditId) {
    return this.http.delete(
      `v3/diligences/${diligenceId}/autofill_audits/${auditId}/responses`
    );
  }

  deleteAllAutofillResponses(diligenceId) {
    return this.http.delete(`v3/diligences/${diligenceId}/responses`);
  }

  getAutofillPreviewCounts(params) {
    return this.http.post(`service/es_service/autofill_preview_count`, params);
  }

  getDBAutofillPreviewCounts(params) {
    return this.http.post('v2/diligences/autoFill_preview', params);
  }

  getAutofillProjects(diligenceId, params) {
    return this.http.get(`v3/diligences/${diligenceId}/autofill_diligences`, {
      params: params,
    });
  }

  getQuestionTags() {
    return this.http.get(`tags?type=Question`);
  }

  getAumTrackRecordDefinition({ firmId, isEditable, type, resourceUri = '' }) {
    let uri = resourceUri
      ? `firms/${firmId}/${resourceUri}/AumTrackRecordDefinitions?is_editable=${isEditable}&type=${type}`
      : `firms/${firmId}/AumTrackRecordDefinitions?is_editable=${isEditable}&type=${type}`;
    return this.http.get(uri);
  }

  getAumTrackRecordDefinitionGrid(id) {
    return this.http.get(
      `AumTrackRecordDefinitions/${id}/AumTrackRecordValues`
    );
  }

  getReviewDefinitions() {
    return this.http.get('review_definitions');
  }

  getQuestionInternalNotes(
    child_entity_id,
    child_entity_type,
    entity_id,
    entity_type
  ) {
    return this.http.get(
      `notes?child_entity_id=${child_entity_id}&child_entity_type=${child_entity_type}&entity_id=${entity_id}&entity_type=${entity_type}`
    );
  }

  getSectionReviewStatus(id, sectonId) {
    return this.http.get(`diligences/${id}/sections/${sectonId}/status`);
  }

  postNotes(params) {
    return this.http.post(`notes`, params);
  }

  deleteInternalNotes(params) {
    return this.http.delete(`notes/${params.id}`, params);
  }

  editInternalNotes(params) {
    return this.http.put(`notes/${params.id}`, params);
  }

  getRevisionHistory(diligenceId, responseId, type) {
    return this.http.get(
      `diligences/${diligenceId}/responses/${responseId}/review_history?review_type=${type}`
    );
  }

  trackStatus(payload: any) {
    return this.http.patch(`responses/${payload.id}/track_status`, payload);
  }

  restoreResponses(payload) {
    return this.http.put(`v3/responses`, payload);
  }

  responseSelectedMarkTextRemove(payload) {
    return this.http.delete(
      `diligences/${payload.diligenceId}/responses/${payload.id}/mark_selected_text_removed`
    );
  }

  responseNoteAttribute(diligenceId, responseId, payload) {
    return this.http.put(
      `diligences/${diligenceId}/responses/${responseId}/notes_attributes`,
      payload
    );
  }
  getComments(payload: any) {
    return this.http.post(`service/dvapi_service/issue_comments`, payload);
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
  getEntityInternalSubscribers(entity_id: any, entity_type: any) {
    return this.http.get(
      `entitysubscribers?entity_id=${entity_id}&entity_type=${entity_type}`
    );
  }
  getEntityExternalSubscribers(entity_id: any, entity_type: any, firm_id: any) {
    return this.http.get(
      `entitysubscribers?entity_id=${entity_id}&entity_type=${entity_type}&firm_id=${firm_id}`
    );
  }
  getAssociateContacts(entity_id: any, entity_type: any) {
    return this.http.get(
      `contacts?entity_id=${entity_id}&entity_type=${entity_type}`
    );
  }
  createFollowUp(payload) {
    return this.http.post(`Followups/bulk_add`, payload);
  }
  deleteFollowUp(id) {
    return this.http.delete(`followups/${id}`);
  }
  getWorkFlow(entity_type) {
    return this.http.get(`workflows?entity_type=${entity_type}`);
  }

  getFunctionAssignment(params) {
    return this.http.get(
      `function_assignments?entity_id=${params.entity_id}&entity_type=${params.entity_type}`
    );
  }

  getFirmPreferences() {
    return this.http.get('firm_preferences');
  }

  getDiligences(params) {
    return this.http.get(
      `diligences?review_type=${params.task_type}&diligence_id=${params.diligence_id}`
    );
  }

  getReviewers(id, params) {
    return this.http.get(
      `diligences/${id}/reviewers?review_type=${params.task_type}`
    );
  }

  copyReviewers(id, params) {
    return this.http.post(`diligences/${id}/assign_reviewers`, params);
  }
  assignReviewer(id, params) {
    return this.http.post(`diligences/${id}/Reviews`, params);
  }

  updateReviewer(sectionId, diligenceId, responseId, reviewId, steps) {
    return this.http.put(
      `diligences/${diligenceId}/sections/${sectionId}/responses/${responseId}/reviews/${reviewId}`,
      steps
    );
  }

  updateRatingReviewer(diligenceId, responseId, reviewId, steps) {
    return this.http.put(
      `diligences/${diligenceId}/ratings/${responseId}/reviews/${reviewId}`,
      steps
    );
  }

  updateFinalizeDraft(projectId, type) {
    return this.http.put(`diligences/${projectId}/mark_wip?mode=${type}`, {
      mode: type,
    });
  }
  updateRatingFlag(params) {
    return this.http.put(`ratings/flags`, params);
  }

  submitResponseRevision(responseId, diligenceId) {
    return this.http.patch(
      `diligences/${diligenceId}/responses/${responseId}/submit_response_revision`,
      {}
    );
  }

  bulkSubmitResponseRevision(diligenceId) {
    return this.http.patch(
      `diligences/${diligenceId}/bulk_submit_response_revision`,
      {}
    );
  }

  getCustomFieldData(params) {
    return this.http.post(
      'service/dvapi_service/get_custom_fields_data',
      params
    );
  }

  getTemplateRatingSchemeMapping(id, version) {
    return this.http.get(
      `templates/${id}/versions/${version}/TemplateRatingSchemeMappings`
    );
  }
  getRatingSchemeDefaults(id) {
    return this.http.get(
      `rating_scheme_defaults?entity_id=${id}&entity_type=DueDiligence`
    );
  }

  getRatingScaleDef(id, version) {
    return this.http.get(
      `v2/rating_scales/${id}/versions/${version}/rating_scale_definitions`
    );
  }

  getResponseComments(diligenceId, resid) {
    return this.http.get(
      `diligences/${diligenceId}/responses/${resid}/comments `
    );
  }

  updateRating(params) {
    return this.http.put(`ratings`, params);
  }
  postResponseAction(params) {
    return this.http.post(`response_actions `, params);
  }

  patchAnswerResponseStatus(resid, params) {
    return this.http.patch(`responses/${resid}/status`, params);
  }
  patchResponseStatus(params) {
    return this.http.patch(
      `diligences/${params.diligenceId}/responses/${params.id}/reviews/${params.definition.id}/steps/${params.activeStep.id}/assignments/${params.assignmentId}/status`,
      { status: params.status, note: params.note }
    );
  }

  getResponseAuthors(diligenceId) {
    return this.http.get(`diligences/${diligenceId}/response_authors`);
  }

  patchSectionResponse(diligenceId, sectionId, param) {
    return this.http.patch(
      `diligences/${diligenceId}/sections/${sectionId}/bulk_response_status`,
      param
    );
  }

  getTodos(responseId) {
    return this.http.get(`todos?entity_id=${responseId}&entity_type=Response`);
  }

  updateTodo(todo: TodoType) {
    return this.http.put(`todos/${todo.id}`, todo);
  }

  createTodo(params) {
    return this.http.post('todos', params);
  }

  deleteTodo(id) {
    return this.http.delete(`todos/${id}`);
  }

  getResponseTrackChange(id, sectionId) {
    return this.http.get(
      `diligences/${id}/categories/${sectionId}/track_change_responses`
    );
  }

  recalculateScore(params) {
    return this.http.post(`diligences/recalculate_score`, params);
  }

  getTemplateDesc(id) {
    return this.http.get(`templates/${id}/description`);
  }

  updateAssignReview(params) {
    return this.http.put(`todos/${params.id}`, params);
  }
  getDisclaimers() {
    return this.http.get('disclaimers');
  }
  saveDisclaimerAssignment(params) {
    return this.http.post('disclaimerassignments', params);
  }
  getReviewComments(diligenceId, responseId, params = null) {
    return this.http.get(
      `diligences/${diligenceId}/responses/${responseId}/comments`,
      { params: params }
    );
  }
  addReviewComment(params) {
    return this.http.post('response_comments', params);
  }
  editReviewComment(id, params) {
    return this.http.put(`response_comments/${id}`, params);
  }
  deleteReviewComment(id) {
    return this.http.delete(`response_comments/${id}`);
  }
  bulkResolveComments(diligenceId, responseId, params) {
    return this.http.put(
      `diligences/${diligenceId}/responses/${responseId}/bulk_resolve_comments`,
      params
    );
  }

  getReviewMappingsData(diligenceId) {
    return this.http.get(`diligences/${diligenceId}/review_mappings_data`);
  }

  getMappedQuestionResponses(params) {
    return this.http.post('review_projects/responses', params);
  }

  getMyFunctions(id) {
    return this.http.get(`diligences/${id}/MyFunctions`);
  }

  getLinkedProjectsCountTrue(id) {
    return this.http.get(
      `diligences/${id}/linked_projects?include_counts=true`
    );
  }
  saveAttachment(params) {
    return this.http.post('attachments', params);
  }

  updateAttachment(id, params) {
    return this.http.put(`attachments/${id}`, params);
  }
  getDocumentTags(documentId) {
    const params = {
      attachment_id: documentId,
    };
    return this.http.get(`document_tags`, { params });
  }

  getQaItems(params) {
    return this.http.post('service/es_service/qa_search_v1', params);
  }

  getRatings(params) {
    return this.http.post('service/dvapi_service/get_custom_fields', params);
  }

  deleteReviewAssignment(diligenceId, reviewId) {
    return this.http.delete(`diligences/${diligenceId}/reviews/${reviewId}`);
  }

  getModalPopUpInfo(param) {
    return this.http.get(
      `intro_modals?entity_id=${param.entity_id}&entity_type=${param.entity_type}`
    );
  }

  putModalPopUpInfo(param) {
    return this.http.put(`intro_modals`, param);
  }

  getTemplateInfo(TemplateID, version) {
    return this.http.get(
      `templates/${TemplateID}/versions/${version}/complexity`
    );
  }

  getFollowupByQuestionId(diligenceId, questionId, sequenceId) {
    const params = {
      entity_id: questionId,
      entity_type: FollowUpType.Question,
      diligence_id: diligenceId,
      sequence_id: sequenceId,
    };
    return this.http.get('followups', { params: params });
  }
  resolveFollowUpComment(comment_id) {
    return this.http.put(`Followups/${comment_id}/resolve`, {});
  }
  bulkResolveFollowups(payload) {
    return this.http.put(`Followups/bulk_resolve`, payload);
  }
  getProjectTagsValues(diligenceId) {
    return this.http.get(`diligences/${diligenceId}/project_tag_values`);
  }

  getDiligenceResponses(diligenceId) {
    return this.http.get(`v2/diligences/${diligenceId}/responses`);
  }

  getEvaluatedScoreRulesByDiligenceId(diligenceId) {
    return this.http.get(`diligences/${diligenceId}/entity_score_rules`);
  }

  addDefinition(definition) {
    return this.http.post('review_definitions', definition);
  }

  getReviewerForSection(param) {
    return this.http.get(
      `diligences/${param.diligenceId}/sections/${param.sectionId}/reviews`
    );
  }
  removeDisclaimerFromProject(entityId) {
    return this.http.delete(
      `disclaimerassignments?entity_id=${entityId}&entity_type=DueDiligence`
    );
  }
}
