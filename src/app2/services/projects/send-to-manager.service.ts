import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SendToManagerService {

  constructor(private readonly http: HttpClient) {}

  getContact(params:any) {
    return this.http.get(`contacts?entity_id=${params.entity_id}&entity_type=${params?.entity_type}`);
  }
  SendRequestContact(data: any, pageUrl : any) {
    let params = {};
    if (pageUrl) {
      params = {
        headers: {
          'page-url': pageUrl,
        },
      };
    }
    return this.http.put(`diligences/${data.id}/mark_as_external`, data, params);
  }
}
