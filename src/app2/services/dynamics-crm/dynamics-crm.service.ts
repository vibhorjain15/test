import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DynamicsCrmService {
  constructor(private readonly http: HttpClient) {}

  getUserConfiguration(crmTypeId: any) {
    return this.http.get(
      `service/integration_service/v1/crm/token?crm_type_id=${crmTypeId}`
    );
  }

  setUserConfiguration(payload: any) {
    return this.http.post('service/integration_service/v1/crm/token', payload);
  }

  updateUserConfiguration(params: any) {
    return this.http.put('service/integration_service/v1/crm/token', params);
  }

  getUserFieldSettings(crmTypeId: any) {
    return this.http.get(
      `service/integration_service/v1/crm/fields?crm_type_id=${crmTypeId}`
    );
  }

  getCrmData(crmTypeId: any, startDate: Date, endDate: Date, schema: any) {
    return this.http.get(
      `service/integration_service/v1/crm/data/${schema}?crm_type_id=${crmTypeId}&start_date=${startDate}&end_date=${endDate}`
    );
  }

  setCrmData(payload: any, schema: any) {
    return this.http.post(
      `service/integration_service/v1/crm/data/${schema}`,
      payload
    );
  }

  countData(enytityType: any, crmTypeId: any) {
    return this.http.get(
      `service/integration_service/v1/crm/count?entity_type=${enytityType}&crm_type_id=${crmTypeId}`
    );
  }
}
