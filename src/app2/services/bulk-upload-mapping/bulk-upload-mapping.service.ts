import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BulkUploadMappingAPIService {
  mappingsSub = new Subject();
  constructor(
    private readonly http: HttpClient,
  ) {}

  getAllMappings() {
    return this.http.get(`service/excel_services/dynamic_mapping`);
  }
  getMapping(id) {
    return this.http.get(`service/excel_services/dynamic_mapping/${id}`);
  }
  saveMapping(payload) {
    return this.http.post(`service/excel_services/dynamic_mapping`, payload);
  }
  updateMapping(payload) {
    return this.http.put(`service/excel_services/dynamic_mapping`, payload);
  }
  deleteMappings(payload) {
    return this.http.delete(`service/excel_services/dynamic_mapping`, {
      body: { ids: payload },
    });
  }
  bulkEntityUpload(payload) {
    return this.http.post(
      'service/excel_services/bulk_entity_upload/upload',
      payload
    );
  }
  getCustomFields() {
    return this.http.get(`service/excel_services/dynamic_mapping_fields`);
  }
  getSavedMappings() {
    return this.http.get(`service/excel_services/dynamic_mapping`);
  }
  downloadEmptySampleFile() {
    return this.http.get('bulk_import/download', {
      params: {
        download_blank: 'true',
      },
      responseType: 'arraybuffer',
      observe: 'response',
    });
  }
  downloadSampleFile() {
    return this.http.get('bulk_import/download', {
      responseType: 'arraybuffer',
      observe: 'response',
    });
  }
  downloadInstructionFile() {
    return this.http.get(
      'service/excel_services/custom_bulk_upload_instruction',
      {
        responseType: 'blob',
      }
    );
  }
  getMappingRowsData() {
    return this.http.get(`service/excel_services/dynamic_mapping`);
  }
}
