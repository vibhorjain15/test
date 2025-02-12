import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class VehicleDataService {
  constructor(private readonly http: HttpClient) {}

  getVehicle(firmId, fundId, vehicleId) {
    return this.http.get(
      `firms/${firmId}/funds/${fundId}/vehicles/${vehicleId}`
    );
  }

  getRelatedVehicles(firmId, fundId, vehicleId) {
    return this.http.get(
      `firms/${firmId}/funds/${fundId}/vehicles/${vehicleId}/related_vehicles`
    );
  }

  getVehicles() {
    return this.http.get('vehicles');
  }

  getVehiclesV2(payload: any) {
    return this.http.post(`service/dvapi_service/vehicle_search`, payload);
  }

  deactivateVehicle(firmId, fundId, vehicleId) {
    return this.http.delete(
      `firms/${firmId}/funds/${fundId}/vehicles/${vehicleId}`
    );
  }

  getShareClassTables(firmId, fundId, vehicleId) {
    return this.http.get(
      `firms/${firmId}/funds/${fundId}/vehicles/${vehicleId}/AumTrackRecordDefinitions`
    );
  }

  addVehicle(firmId, fundId, payload, header) {
    const headers = new HttpHeaders();
    headers.set('page-url', header);
    return this.http.post(`firms/${firmId}/funds/${fundId}/vehicles`, payload, {
      headers: headers,
    });
  }

  editVehicle(firmId, fundId, payload) {
    return this.http.put(
      `firms/${firmId}/funds/${fundId}/vehicles/${payload.id}`,
      payload
    );
  }
}
