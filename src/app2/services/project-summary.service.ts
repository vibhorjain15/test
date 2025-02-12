import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { diligenceStatusConstant } from '../shared/constants/constant';

@Injectable({
  providedIn: 'root',
})
export class ProjectSummaryService {
  constructor(
    private readonly http: HttpClient,
  ) {}

  private loadLatestDiligence = new Subject<any>();
  loadLatestDiligence$ = this.loadLatestDiligence.asObservable();

  private loadLatestAudit = new Subject<any>();
  loadLatestAudit$ = this.loadLatestAudit.asObservable();

  loadLatestDiligenceTrigger() {
    this.loadLatestDiligence.next();
  }

  loadLatestAuditTrigger() {
    this.loadLatestAudit.next();
  }

  getCurrentDiligence(diligenceId: number, currentUser: any) {
    return this.http.get(`diligences/${diligenceId}`).pipe(
      map((diligence: any) => {
        //These are locked status for both Investor and Manager
        const locked_statuses = [
          'Approved',
          'NotApproved',
          'Deleted',
          'Retired',
          'Withdrawn',
        ];

        // Get diligence, type and if diligence is internal
        const status = diligence.status;
        const internalOnly = diligence.is_internal;
        const diligenceType = diligence.diligence_type;
        const readOnlyAccess = currentUser.isReadOnly;

        diligence.alwaysOpen = diligenceType === 'dd_profile';
        diligence.isLocked =
          locked_statuses.includes(status) && !diligence.alwaysOpen;
        diligence.isCompleted = status === 'Completed';

        diligence.hasReadOnlyAccess = readOnlyAccess;

        if (currentUser.isManager) {
          diligence.isReadOnly =
            status === 'Completed' ||
            status === 'PendingRestart' ||
            status === diligenceStatusConstant.POSTCOMPLETIONREVIEW;
          diligence.review_allowed = !(
            internalOnly === false && status === 'Completed'
          );
        } else if (currentUser.isInvestor) {
          diligence.notVisible =
            (status === 'Started' ||
              status === 'ExtensionRequested' ||
              status === diligenceStatusConstant.PRECOMPLETIONREVIEW) &&
            internalOnly === false &&
            !diligence.alwaysOpen;
          diligence.isReadOnly =
            (status === 'Completed' ||
              status === 'Followup' ||
              status === 'PendingRestart' ||
              status === diligenceStatusConstant.POSTCOMPLETIONREVIEW) &&
            !diligence.alwaysOpen;
          diligence.review_allowed = !(
            internalOnly === false &&
            (status === 'Started' ||
              status === 'ExtensionRequested' ||
              status === 'Followup')
          );
        }
        return diligence;
      })
    );
  }

  getCustomFields(payload) {
    return this.http.post(
      'service/dvapi_service/get_custom_fields_data',
      payload
    );
  }

  getMyFunctions(payload) {
    return this.http.get('function_assignments', { params: payload });
  }

  getRelatedDiligences(diligenceId: number) {
    return this.http.get(`diligences/${diligenceId}/linked_projects`, {
      params: { include_counts: true },
    });
  }

  getFollowUps(entity_id, entity_type) {
    return this.http
      .get('followups', {
        params: { entity_id: entity_id, entity_type: entity_type },
      })
      .pipe(
        map((responses: Array<any>) => {
          responses.map((x) => (x.updated_at = new Date(x.updated_at)));
          responses.sort(
            (a, b) => a.updated_at.getTime() - b.updated_at.getTime()
          );
          return responses;
        })
      );
  }

  getFollowUpsWithProjectId(id) {
    return this.http.get(
      `followups?entity_id=${id}&entity_type=${'Duediligence'}`
    );
  }

  saveFollowup(payload) {
    return this.http.post('followups', payload);
  }

  fetchHistoricDDs(entity_id: number) {
    return this.http
      .get('diligences/history', {
        params: { entity_id: entity_id, entity_type: 'Fund' },
      })
      .pipe(
        map((responses: Array<any>) => {
          if (responses.length > 1) {
            // right now we allow only 3 dd comparisons
            return responses
              .map((x) => x.id)
              .slice(0, 3)
              .join(',');
          }
          return null;
        })
      );
  }

  getQuestionCounts(diligenceId: number) {
    return this.http.get(`diligences/${diligenceId}/QuestionCounts`);
  }

  getRelatedContacts(entity_id, entity_type, is_active = null) {
    const params = {
      entity_id: entity_id,
      entity_type: entity_type,
      active: is_active,
    };
    return this.http.get('contacts', { params: params });
  }

  addSubscriber(params: any) {
    return this.http.post('entitysubscribers', params);
  }

  removeSubscriber(params: any) {
    return this.http.delete('entitysubscribers', { params: params });
  }

  getSubscribers(diligenceId, diligenceTypeId, functions) {
    const params = {
      entity_id: diligenceId,
      entity_type: diligenceTypeId,
    };
    return this.http.get('entitysubscribers', { params: params }).pipe(
      map((response: Array<any>) => {
        return response.map((subscriber: any) => {
          if (subscriber.function_id) {
            subscriber.fullName = functions.find(
              (x) => x.function_id === subscriber.function_id
            )?.function_name;
            subscriber.id = subscriber.function_id;
            subscriber.type = 'function';
          } else if (subscriber.user_id) {
            subscriber.id = subscriber.user_id;
            subscriber.type = 'user';
          }
          return subscriber;
        });
      })
    );
  }

  getExternalSubscribers(diligenceId, entityType, firmId) {
    const params = {
      entity_id: diligenceId,
      entity_type: entityType,
      firm_id: firmId,
    };
    return this.http.get('entitysubscribers', { params: params });
  }

  getReviewProjects(diligenceId) {
    return this.http.get(`diligences/${diligenceId}/review_projects`);
  }

  getEmailTemplates() {
    return this.http.get('EmailTemplateMessages');
  }

  shareProject(payload: any) {
    return this.http.post(`diligences/share_project`, payload);
  }

  revokeAccess(entityId: any) {
    return this.http.delete(`diligences/share_project/${entityId}`);
  }

  updateData(payload: any) {
    return this.http.put(`diligences/${payload.id}/update_data`, payload);
  }
}
