import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AccessLevelDataService {
  constructor(private readonly http: HttpClient) {}
  deleteRole(id) {
    return this.http.delete(`roles/${id}`);
  }
  updateRoleConfigurationWithRoleId(roleId, updatePayload) {
    return this.http.put(`roles/${roleId}`, updatePayload);
  }
  getDefaultConfigurations() {
    return this.http.get(`role_configurations`);
  }
  getRoleWiseConfiguration(roleId) {
    return this.http.get(`roles/${roleId}/role_configurations`);
  }
  saveNewRoleConfiguration(savePayload) {
    return this.http.post(`Roles`, savePayload);
  }
  assignAccessLevelsAPI(payload) {
    //assign role to bulk selected users
    return this.http.put(`User_AccessLevels/bulk_update`, payload);
  }
  getEmployeesAPI(firmId) {
    //get userlist to assign role
    return this.http.get(`firms/${firmId}/users`);
  }
}
