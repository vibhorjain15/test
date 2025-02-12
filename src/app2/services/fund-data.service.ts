import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { Subject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class FundDataService {
  constructor(private readonly http: HttpClient) {}

  getFunds(params = null) {
    if (!params) {
      params = {
        include_contacts: false,
        include_custom_fields: false,
        include_dates: false,
        include_ratings: true,
        is_active: true,
        filters: {},
      };
    }
    return this.http.post('service/dvapi_service/fund_search', params);
  }

  getAllFunds() {
    return this.http.get('funds');
  }

  getShareClass(id) {
    return this.http.get('shareclasses' + id);
  }

  getShareClassTable(id) {
    return this.http.get('shareclass_tables' + id);
  }

  getShareClassTables(firmId, fundId) {
    return this.http.get(
      `firms/${firmId}/funds/${fundId}/AumTrackRecordDefinitions`
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

  getShareClasses(fund_id) {
    return this.http.get('shareclasses', { params: { fundId: fund_id } });
  }

  getFund(id) {
    return this.http.get('funds/' + id);
  }

  getFundsWithParams(params) {
    return this.http.get('funds', { params });
  }

  updateFund(id, params) {
    return this.http.put('funds' + id, params);
  }

  newShareClassTableValue(aumtrackrecord_defintion_id, attrs) {
    // TODO
    /* const restangularized = this.http
      .one('AumTrackRecordDefinitions', aumtrackrecord_defintion_id)
      .one('AumTrackRecordValues');
    _(restangularized).extend(attrs);
    return restangularized; */
  }

  getAttachments(id, recordsPerPage?, pageNumber?) {
    return this.http.get('attachmentassignments', {
      params: {
        entity_type: 'Fund',
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
    return this.http.put('shareclasses' + id, params);
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
    return this.http.get('ShareClasses', { params: { fundID: id, type } }).pipe(
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

  getFundProfile(id) {
    return this.http.get(`funds/${id}/profile`);
  }

  getFundRatings(id) {
    return this.http.get('ratings', {
      params: {
        entity_id: id,
        entity_type: 'Fund',
      },
    });
  }

  getNotes(id) {
    return this.http.get('notes', {
      params: {
        entity_id: id,
        entity_type: 'Fund',
      },
    });
  }

  createNote(params) {
    return this.http.post('notes', params);
  }

  getEmails(id) {
    const params = {
      entity_id: id,
      entity_type: 'fund',
    };
    return this.http.get('emails', { params });
  }

  follow(id) {
    return this.http.put(`funds/${id}/follow`, {});
  }

  unfollow(id) {
    return this.http.put(`funds/${id}/unfollow`, {});
  }

  getProfileQuestionnaires(id) {
    return this.http.get('diligences/profile', {
      params: {
        entity_id: id,
        entity_type: 'Fund',
      },
    });
  }

  getRelatedEntities(id) {
    return this.http.get(`funds/${id}/related`);
  }

  getRelatedVehicles(params) {
    return this.http.get(
      `firms/${params.firmId}/funds/${params.fundId}/vehicles`
    );
  }

  getRelatedVehicleById(params) {
    return this.http.get(
      `firms/${params.firmId}/funds/${params.fundId}/vehicles/${params.id}`
    );
  }

  getRelatedContacts(id) {
    return this.http.get('contacts', {
      params: {
        entity_id: id,
        entity_type: 'Fund',
      },
    });
  }

  getRelatedContactCount(id) {
    return this.http.get('contacts', {
      params: {
        entity_id: id,
        entity_type: 'Fund',
        count: true,
      },
    });
  }

  getDiligences(id) {
    return this.http.get(`funds/${id}/diligences`);
  }

  addFund(payload, pageUrl) {
    const headers = new HttpHeaders();
    headers.set('page-url', pageUrl);
    return this.http.post('funds', payload, { headers: headers });
  }

  editFund(payload, pageUrl) {
    const headers = new HttpHeaders();
    headers.set('page-url', pageUrl);
    return this.http.put(`funds/${payload.id}`, payload, { headers: headers });
  }
}
