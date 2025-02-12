import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, tap } from 'rxjs/operators';
import { BaseDataService } from './base-data.service';
import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root',
})
export class DueDiligenceDataService {
  constructor(
    private readonly http: HttpClient,
    private readonly BaseDataService: BaseDataService,
    private readonly Utils: UtilsService
  ) {}

  setStatus(id, status) {
    const headers = new HttpHeaders().set(
      'diligence-status',
      status.toLowerCase()
    );
    const params = { status };
    return this.http.put('diligences/' + id, params, { headers: headers });
  }

  deleteDiligence(id, reason) {
    return this.http.delete('v2/diligences' + id, {
      params: {
        statusReason: reason,
      },
    });
  }

  deleteSubscriber(entity_type, entity_id, user_id) {
    // { 'Content-Type': 'application/json; charset=utf-8' }
    return this.http.delete('entitysubscribers', {
      params: { entity_id, entity_type, user_id },
    });
  }

  getTodos(id) {
    return this.http.get('todos', {
      params: { entity_id: id, entity_type: 'Response' },
    });
    /* .subscribe((todos: any) =>
        _(todos).map((todo: any) =>
          Restangular.restangularizeElement(null, todo, 'todos')
        )
      ); */
  }

  saveTodo(todo, id) {
    todo.entity_id = id;
    todo.entity_type = 'Response';
    return this.http.post('todos', todo);
    /* .then((response: any) => {
      return Restangular.restangularizeElement(null, response, 'todos');
    }); */
  }

  getResponseHistory(id) {
    return this.http.get(`responses/${id}/history`);
    // .then((response: any) => response);
  }

  getFollowUps(entity_id, entity_type) {
    return this.http
      .get('followups', { params: { entity_id, entity_type } })
      .pipe(
        map((response: any) => {
          response.forEach(
            (response: { updateTimeStamp }) =>
              (response.updateTimeStamp = new Date(response.updateTimeStamp))
          );
        })
      );
  }

  saveFollowup(response: any) {
    return this.http.post('followups', response).pipe(
      map((response: any) => {
        response.updateTimeStamp = new Date(response.updateTimeStamp);
        return response;
      })
    );
  }

  subscribe(entity_id, entity_type) {
    const params = {
      entity_id,
      entity_type,
    };
    return this.http.post('EntitySubscribers', params);
  }

  getQuestionCounts(diligenceId) {
    return this.http.get(`diligences/${diligenceId}/QuestionCounts`);
  }

  getList(questionId) {
    return this.http.get(`questions/${questionId}/options`);
  }

  getAttachmentTypes() {
    return this.BaseDataService.getAttachmentTypes();
  }

  getDiligences(params) {
    return this.http.post('service/dvapi_service/diligence_search', {
      ...params,
    });
  }

  getDiligenceByFirm(firm_id, params) {
    return this.http.get(`firms/${firm_id}/diligences`, { params });
  }

  getDiligenceByFund(fund_id, params) {
    return this.http.get(`funds/${fund_id}/diligences`, { params });
  }

  getDiligenceInfo(id) {
    return this.http.get('diligences' + id);
  }

  getDiligence(Id) {
    const params = {
      headers: { entity_id: Id, entity_type: 'DueDiligence' },
    };
    return this.http
      .get('diligences/' + Id, params)
      .pipe(tap((response: any) => response.data));
  }

  getSections(diligenceId, status) {
    const params = {
      ReadWrite: true,
      StatusFilter: status || 'Default',
    };
    this.http
      .get(`diligences/${diligenceId}/sections`, {
        params,
        headers: { entity_id: diligenceId, entity_type: 'DueDiligence' },
      })
      .pipe(
        tap((response: any) => {
          {
            return this.Utils.groupSections(response.data);
          }
        })
      );
  }

  getDiligenceAttachments(targetId: any, recordsPerPage: any, pageNumber: any) {
    return this.http.get('attachmentassignments', {
      params: {
        entity_type: 'DueDiligence',
        entity_id: targetId,
        recordsPerPage,
        pageNumber,
      },
    });
  }

  uploadAttachment(files, fields) {}

  uploadBulkExcel(file, fields) {}

  updateAttachment(files, fields, id) {}

  uploadDiligenceAttachment(params) {
    return this.http.post(
      `diligences/${params.assignments.targetId}/attachments`,
      params
    );
  }

  saveResponse(response: any) {
    const params = {
      headers: {
        entity_id: response.duediligence_id,
        entity_type: 'DueDiligence',
      },
    };
    return this.http
      .put('v3/responses', response, params)
      .pipe(tap((response: any) => response.data));
  }

  deleteResponse(id: any, diligenceId: any) {
    const params = {
      headers: { entity_id: diligenceId, entity_type: 'DueDiligence' },
    };
    return this.http.delete(`v2/responses/${id}`, params);
  }

  assignUserToSection(section, user, diligenceId) {
    const params = {
      userID: user != null ? user.id : undefined,
      sectionID: section.id,
      ddMasterID: diligenceId,
    };
    return this.http.post('userassignments', params);
  }

  assignUserToEntity(params) {
    return this.http.put('EntityAssignments', params);
  }

  sendRecommendation(recommendation, diligenceId) {
    return this.http.post(
      `diligences/${diligenceId}/recommendation`,
      recommendation
    );
  }

  getNotes(diligenceId, questionId, childEntityType, pageUrl) {
    const params = {
      entity_id: diligenceId,
      child_entity_id: questionId,
      child_entity_type: childEntityType,
      entity_type: 'Duediligence',
    };
    return this.http.get(`${pageUrl}/notes`, { params });
  }

  saveNotes(params, pageUrl) {
    return this.http.post(`${pageUrl}/notes`, params);
  }
  compare(ids) {
    if ([...ids].length) {
      ids = ids.join(',');
    }
    return this.http.get(`compare/peer`, { params: { Ids: ids } });
  }

  getDueDiligences(params) {
    return this.http.get('diligences', { params });
  }

  getViews(id, type) {
    return this.http.get(`entity_viewers`, {
      params: {
        entity_id: id,
        entity_type: type,
      },
    });
  }

  createSequence(ddMasterID, sectionID) {
    return this.http.post('sequences', {
      duediligence_id: ddMasterID,
      sectionID,
    });
  }

  ensureSequence(ddMasterID, sectionID) {
    return this.http.put('sequences', {
      duediligence_id: ddMasterID,
      sectionID,
    });
  }

  removeSequence(id) {
    return this.http.delete('sequences' + id);
  }

  getGridRows(id) {
    return this.http.get(`grids/${id}/grid_rows_columns`, {
      params: { type: 'row' },
    });
  }

  getGridColumns(id) {
    return this.http.get(`grids/${id}/grid_rows_columns`, {
      params: { type: 'column' },
    });
  }

  getGridRowsAndColumns(id) {
    return this.http.get(`grids/${id}/grid_rows_columns`);
  }

  getGridData(id, response) {
    return this.http.get('grids' + id, {
      params: {
        response_id: response,
      },
    });
  }

  getGridRowsAndColumnsOfOfflineDD(id) {
    return this.http.get('dd_document_griditems', {
      params: {
        dd_document_lineitems_id: id,
      },
    });
  }

  getProfileQuestionnaire(id) {
    return this.http.get(`grids/${id}/grid_rows_columns`, {
      params: { type: 'row' },
    });
  }

  getAvailableQuestionsAndResponses(params) {
    return this.http.get(
      'nlp_mappings?entity_id=' +
        params.entity_id +
        '&include_response=' +
        params.include_response +
        '&strategy_id=' +
        params.strategy_id +
        '&entity_type=' +
        params.entity_type +
        '&type=' +
        params.type,
      { params: { q: encodeURIComponent(params.q) } }
    );
  }

  getAvailableQuestionsAndResponsesEs(params) {
    return this.http.post('service/es_service/qa_recommendation', params);
  }

  updateResponsesUsed(diligenceId, params) {
    return this.http.post(`diligences/${diligenceId}/response_used`, params);
  }

  WritetoDoc(params) {
    return this.http.get('diligences/document_export', { params });
  }

  WritetoDocWithoutTemplate(diligenceId) {
    return this.http.get('diligences/document_export', {
      params: { diligence_id: diligenceId },
    });
  }

  WritetoOriginalDoc(diligenceId) {
    return this.http.post('jobs', {
      job_type: 'doc_insertion',
      job_params: {
        diligence_id: diligenceId,
        send_email: true,
      },
    });
  }

  GetDoc(diligenceId) {
    return this.http
      .get(`diligences/${diligenceId}/document`)
      .pipe(tap((response: any) => response.data));
  }

  getExtendedDueDate(diligenceId, status) {
    const params = {
      dueDiligence_id: diligenceId,
      status,
      recordsPerPage: 500,
    };
    return this.http.get('dd_dueDate_extensions', { params });
  }

  extendDueDate(params) {
    return this.http.post('dd_dueDate_extensions', params);
  }

  updateDueDate(dueDateId, params) {
    return this.http.put('dd_dueDate_extensions' + dueDateId, {
      status: params.status,
      action_reason: params.action_reason,
    });
  }

  getSectionsV2(diligenceId, params) {
    return this.http.get(`v2/diligences/${diligenceId}/sections`, { params });
  }

  getReportQuestionResponse(params) {
    return this.http.get('report_responses', { params });
  }

  createNewVersion(id) {
    return this.http.post(`diligences/${id}/clone`, {});
  }

  createNewDDV2(data, pageUrl) {
    let params = {};
    if (pageUrl) {
      params = {
        headers: {
          'page-url': pageUrl,
        },
      };
    }
    return this.http.post(`v2/diligences`, data, params);
  }

  updateDiligenceStatus(status, diligenceId, pageUrl) {
    const params = { status };
    const params2 = {
      headers: {
        'page-url': pageUrl,
        'diligence-status': status.toLowerCase(),
      },
    };
    return this.http.put('diligences/' + diligenceId, params, params2);
  }

  unMarkWIP(projectId, type) {
    return this.http.put(`diligences/${projectId}/mark_wip`, { mode: type });
  }

  saveRequest(request) {
    return this.http.put('requesttrackers', request);
  }

  getRequest(requestId) {
    return this.http.get('requesttrackers' + requestId);
  }

  getProfileDDQ(param, pageUrl?) {
    return this.http.get(`diligences/profile`, { params: param });
  }

  getInvestorDiligenceByFirm(firm_id, params?) {
    return this.http.get(`firms/${firm_id}/investor_diligences`, { params });
  }

  getInvestorDiligenceByFund(fund_id, params?) {
    return this.http.get(`funds/${fund_id}/investor_diligences`, { params });
  }

  getInvestorDiligenceByVehicle(fund_id, vehicle_id, params?) {
    return this.http.get(
      `funds/${fund_id}/vehicles/${vehicle_id}/investor_diligences`,
      { params }
    );
  }

  updateResponseStatus(responseId, status) {
    const params = {
      id: responseId,
      response_status: status,
    };
    return this.http.patch(`responses/${responseId}/status`, params);
  }

  getAllSectionVerifiers(diligenceId, sectionId, isReadOnlyNotEditable) {
    const params = {
      type: isReadOnlyNotEditable ? 1701 : 1702,
    };
    return this.http.get(
      `diligences/${diligenceId}/sections/${sectionId}/todos`,
      { params }
    );
  }

  updatePostResponseStatus(responseId, status) {
    const params = {
      id: responseId,
      response_status: status,
    };
    return this.http.patch(`responses/${responseId}/post_status`, params);
  }

  bulkInvite(payload: any) {
    return this.http.put('v2/diligences/bulk_invite', payload);
  }
}
