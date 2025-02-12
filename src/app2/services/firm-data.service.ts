import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FirmDataService {
  constructor(private readonly http: HttpClient) {}

  /* getAttachments() {
    const firmId = this.Utils.getCurrentFirm().id;
    return this.http.get(`firms/${firmId}/attachments`);
  } */

  getAllFirms(params) {
    return this.http.get(`firms/monitor`, {
      params,
    });
  }

  getFirm(firmId) {
    return this.http.get(`firms/${firmId}/profile`);
  }

  getRelatedEntities(id) {
    return this.http.get(`firms/${id}/funds`);
  }

  getRelatedContacts(id, is_active = null) {
    return this.http.get('contacts', {
      params: { entity_id: id, entity_type: 'Firm', active: is_active },
    });
  }

  getRelatedContactCount(id) {
    return this.http.get('contacts', {
      params: { entity_id: id, entity_type: 'Firm', count: true },
    });
  }

  getFirmProfile(id) {
    return this.http.get(`firms/${id}profile`);
  }

  getProfileQuestionnaires(id) {
    return this.http.get('diligences/profile', {
      params: { entity_id: id, entity_type: 'Firm' },
    });
  }

  getDefaultShareClassValues(id, type) {
    return this.http.get('ShareClasses', {
      params: { firmID: id, type: type },
    });
    // .pipe(tap(response => {this.processDatesAndValues()})
  }

  getDiligences(id) {
    return this.http.get(`firms/${id}/diligences`);
  }

  getNotes(id) {
    return this.http.get('notes', {
      params: { entity_id: id, entity_type: 'Firm' },
    });
  }

  getFirms(params) {
    return this.http.post('service/dvapi_service/firm_search', params);
  }

  getAttachments(id, recordsPerPage, pageNumber) {
    return this.http.get('attachmentassignments', {
      params: {
        entity_type: 'Firm',
        entity_id: id,
        recordsPerPage: recordsPerPage,
        pageNumber: pageNumber,
      },
    });
  }

  getAllFirmsOnDV() {
    return this.http.get('firms/activation_list');
  }

  getTables(firmId) {
    return this.http.get(`firms/${firmId}/AumTrackRecordDefinitions`);
  }

  addFirm(payload) {
    return this.http.post('firms', payload);
  }

  editFirm(payload) {
    return this.http.put(`firms/${payload.id}`, payload);
  }
}
