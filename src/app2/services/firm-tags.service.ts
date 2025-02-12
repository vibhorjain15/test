import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TagsType } from '../shared/types/Tags.type';

@Injectable({
  providedIn: 'root',
})
export class FirmTagService {
  constructor(private readonly http: HttpClient) {}

  private custum_tags: TagsType[] = [];

  get getAllTags() {
    return this.custum_tags;
  }
  addCustomTag(requestBody, successCallback, failureCallback) {
    return this.http
      .post(`service/dvapi_service/create_custom_fields`, requestBody)
      .subscribe(
        (response: any) => {
          this.#updateAllTags(response.custom_fields);
          successCallback();
        },
        (error: any) => {
          failureCallback();
        }
      );
  }

  updateCustumTag(requestBody, successCallback, failureCallback) {
    return this.http
      .post(`service/dvapi_service/update_custom_fields`, requestBody)
      .subscribe(
        (response: any) => {
          this.#updateAllTags(response.custom_fields);
          successCallback();
        },
        (error: any) => {
          failureCallback();
        }
      );
  }
  deleteCustumTag(requestBody, successCallback, failureCallback) {
    this.http
      .post('service/dvapi_service/update_custom_fields', requestBody)
      .subscribe(
        (response: any) => {
          this.#updateAllTags(response.custom_fields);
          successCallback();
        },
        (error: any) => {
          failureCallback();
        }
      );
  }

  getCustumTags(requestBody, successCallback, failureCallback) {
    this.http
      .post('service/dvapi_service/get_custom_fields', requestBody)
      .subscribe(
        (response: any) => {
          this.#updateAllTags(response.custom_fields[requestBody.schema_type]);
          successCallback(response.schema_format);
        },

        (error: any) => {
          failureCallback();
        }
      );
  }

  #updateAllTags(custum_tags: TagsType[]) {
    this.custum_tags = custum_tags;
  }

  getAllQuestions() {
    return this.http.get('questions');
  }

  getAllActiveTemplates() {
    return this.http.get(
      `templates?detail=${false}&is_new_information_request=${true}`
    );
  }
  getAllAnalystEvaluationTemplates() {
    return this.http.get(`review_templates`);
  }

  getTemplateQuestions(templateId) {
    return this.http.get(`questions?template_id=${templateId}`);
  }

  getTemplateCategories(templateId: any, version: any) {
    return this.http.get(
      `templates/${templateId}/versions/${version}/sections`
    );
  }

  getAllCustomFields(schema_type) {
    return this.http.post('service/dvapi_service/get_custom_fields', {
      schema_type: schema_type,
    });
  }
}
