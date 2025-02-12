import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FirmDataService {
  constructor(
    private readonly http: HttpClient,
  ) {}

  getRelatedEntities(id, success, failure) {
    this.http.get(`firms/${id}/funds`).subscribe(
      (res) => success(res),
      () => failure()
    );
  }

  getRelatedContacts(id, is_active = null, success, failure) {
    this.http
      .get(`contacts?entity_id=${id}&entity_type=Firm&active=${is_active}`)
      .subscribe(
        (res) => success(res),
        () => failure()
      );
  }

  getRelatedContactCount(id, success, failure) {
    this.http
      .get(`contacts?entity_id=${id}&entity_type=Firm&count=true`)
      .subscribe(
        (res) => success(res),
        () => failure()
      );
  }

  getFirmProfile(id, success, failure) {
    this.http.get(`firms/${id}/profile`).subscribe(
      (res) => success(res),
      () => failure()
    );
  }

  getProfileQuestionnaires(id, success, failure) {
    this.http
      .get(`diligences/profile?entity_id=${id}&entity_type=Firm`)
      .subscribe(
        (res) => success(res),
        () => failure()
      );
  }

  getDefaultShareClassValues(id, type, success, failure) {
    this.http.get(`ShareClasses?firmID=${id}&type=${type}`).subscribe(
      (res) => success(res),
      () => failure()
    );
  }

  getDiligences(id, success, failure) {
    this.http.get(`firms/${id}/diligences`).subscribe(
      (res) => success(res),
      () => failure()
    );
  }

  getNotes(id, success, failure) {
    this.http.get(`notes?entity_id=${id}&entity_type=Firm`).subscribe(
      (res) => success(res),
      () => failure()
    );
  }

  getFirms(params, success, failure) {
    this.http.get(`firms/monitor`, { params }).subscribe(
      (res) => success(res),
      () => failure()
    );
  }

  getAttachments(id, recordsPerPage, pageNumber, success, failure) {
    this.http
      .get(
        `attachmentassignments?entity_id=${id}&entity_type=Firm&recordsPerPage=${recordsPerPage}&pageNumber=${pageNumber}`
      )
      .subscribe(
        (res) => success(res),
        () => failure()
      );
  }

  getAllFirmsOnDV(success, failure) {
    this.http.get(`firms/activation_list`).subscribe(
      (res) => success(res),
      () => failure()
    );
  }

  getTables(id, success, failure) {
    this.http.get(`firms/${id}/AumTrackRecordDefinitions`).subscribe(
      (res) => success(res),
      () => failure()
    );
  }
}
