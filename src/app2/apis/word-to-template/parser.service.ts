import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ParserApiService {
  constructor(private readonly http: HttpClient) { }

  saveMetadata(params) {
    return this.http.post('service/excel_services/save_document_metadata', params);
  }

  getSimilarDocumentStyles(params) {
    return this.http.post('service/excel_services/get_similar_document/upload', params);
  }

}
