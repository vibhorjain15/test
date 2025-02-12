import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class StrategyDataService {
  constructor(private readonly http: HttpClient) {}

  getStrategies() {
    return this.http.get('funds');
  }

  getShareClass(id) {
    return this.http.get('shareclasses' + id);
  }

  getShareClassTable(id) {
    return this.http.get('shareclass_tables' + id);
  }

  getShareClassTables(firmId, strategyId) {
    return this.http.get(
      `firms/${firmId}/funds/${strategyId}/AumTrackRecordDefinitions`
    );
  }

  getShareClassTableValues(params) {
    return this.http.get('shareclass_table_values', { params });
  }

  createShareClassTable(params) {
    return this.http.post('shareclass_tables', params);
  }

  createShareClass(params) {
    return this.http.post('shareclasses', params);
  }

  getShareClasses(strategy_id) {
    return this.http.get('shareclasses', {
      params: { strategyId: strategy_id },
    });
  }

  getStrategy(id: any) {
    return this.http.get('funds/' + id,{
      params: {fund_type: 'Strategy'}
    });
  }

  getStrategiesWithParam(params) {
    return this.http.get('funds', { params });
  }

  updateStrategy(id, params) {
    return this.http.put(`funds/${id}`, params);
  }

  newShareClassTableValue(aumtrackrecord_defintion_id, attrs) {
    return this.http.get(
      `AumTrackRecordDefinitions/${aumtrackrecord_defintion_id}/AumTrackRecordValues`,
      { params: attrs }
    );
  }

  getAttachments(id, recordsPerPage?, pageNumber?) {
    return this.http.get('attachmentassignments', {
      params: {
        entity_type: 'Strategy',
        entity_id: id,
        recordsPerPage,
        pageNumber,
      },
    });
  }

  removeShareClass(id) {
    return this.http.delete('shareclasses' + id);
  }

  updateShareClass(id, params) {
    return this.http.put(`shareclasses/${id}`, params);
  }

  processDatesAndValues(response) {
    response.forEach((item) => {
      if (!item.value) {
        item.value = 0;
      }
      item.end_date = moment(item.end_date).format('YYYY-MM-DD');
    });
    return response;
  }

  getDefaultShareClassValues(id, type) {
    return this.http
      .get('ShareClasses', { params: { strategyID: id, type } })
      .pipe(
        tap((response) => {
          this.processDatesAndValues(response);
        })
      );
  }

  getValuationChartValues(id) {
    return this.http.get(`funds/${id}/valuations`);
  }

  getTimelineValues() {
    return this.http.get('audit_trail');
  }

  getStrategyProfile(id) {
    return this.http.get(`funds/${id}/profile`);
  }

  getStrategyRatings(id) {
    return this.http.get('ratings', {
      params: {
        entity_id: id,
        entity_type: 'Strategy',
      },
    });
  }

  getNotes(id) {
    return this.http.get('notes', {
      params: {
        entity_id: id,
        entity_type: 'Strategy',
      },
    });
  }

  createNote(params) {
    return this.http.post('notes', params);
  }

  getEmails(id) {
    const params = {
      entity_id: id,
      entity_type: 'strategy',
    };
    return this.http.get('emails', { params });
  }

  follow(id) {
    return this.http.put(`funds/${id}/follow`, {});
  }

  unfollow(id: any) {
    return this.http.put(`funds/${id}/unfollow`, {});
  }

  getProfileQuestionnaires(id) {
    return this.http.get('diligences/profile', {
      params: {
        entity_id: id,
        entity_type: 'Strategy',
      },
    });
  }

  getRelatedEntities(id) {
    return this.http.get(`funds/${id}/related`);
  }

  getAssociatedEntities(productId, firmId) {
    return this.http.post('service/dvapi_service/product_hierarchy', {
      product_id: productId,
      firm_id: firmId,
    });
  }

  getRelatedVehicles(params) {
    return this.http.get(
      `firms/${params.firmId}/funds/${params.strategyId}/vehicles`
    );
  }

  getRelatedVehicleById(params) {
    return this.http.get(
      `firms/${params.firmId}/funds/${params.strategyId}/vehicles/${params.id}`
    );
  }

  getRelatedContacts(id) {
    return this.http.get('contacts', {
      params: {
        entity_id: id,
        entity_type: 'Strategy',
      },
    });
  }

  getRelatedContactCount(id) {
    return this.http.get('contacts', {
      params: {
        entity_id: id,
        entity_type: 'Strategy',
        count: true,
      },
    });
  }

  getDiligences(id) {
    return this.http.get(`funds/${id}/diligences`);
  }
}
