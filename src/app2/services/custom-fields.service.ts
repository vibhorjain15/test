import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CustomFieldsService {
  constructor(private readonly http: HttpClient) {}

  getCustomFields(payload) {
    return this.http.post('service/dvapi_service/get_custom_fields', payload);
  }

  getCustomFieldsData(payload) {
    return this.http.post(
      'service/dvapi_service/get_custom_fields_data',
      payload
    );
  }

  saveCustomFields(payload) {
    return this.http.post(
      'service/dvapi_service/post_custom_fields_data',
      payload
    );
  }

  deleteCustomFields(payload) {
    return this.http.delete('service/dvapi_service/get_custom_fields_data', {
      body: payload,
    });
  }

  getLatestResponses(payload) {
    return this.http.get('report_responses', { params: payload });
  }
}
