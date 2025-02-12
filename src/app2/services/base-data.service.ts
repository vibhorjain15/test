import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DataService } from './data.service';
import { USER_ROLES } from '../shared/constants/constant';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class BaseDataService {
  private currentUser;
  contactPageUrl: any;

  constructor(
    private readonly http: HttpClient,
    private readonly dataService: DataService
  ) {}

  loadBaseData() {
    this.loadCurrentUser();
    this.loadSubscriptions();
  }

  getCurrentUser() {
    return this.http.get('account');
  }

  getSubscriptionLimits() {
    return this.http.get('subscription_limits');
  }
  getUserNotification() {
    return this.http.get('user_notification_settings');
  }

  async loadCurrentUser() {
    // TODO: Uncomment after migration
    /* this.userservice.getCurrentUser().subscribe((response: any) => {
      const currentUser = response;
      currentUser.hasFirmWideRole = this.hasFirmWideRole(currentUser);
      this.currentUser = currentUser;
    }); */
    this.currentUser = await this.dataService.getUserData();
    /* this.store.selectSnapshot((state) => {
      this.currentUser = {...state.user.currentUser};
    }); */
    this.currentUser.hasFirmWideRole = this.hasFirmWideRole(this.currentUser);
    // this.currentUser.currentUser.hasFirmWideRole = this.hasFirmWideRole(
    //   this.currentUser.currentUser
    // );
  }

  hasFirmWideRole(user): boolean {
    return user.firmwide_role?.toLowerCase() !== USER_ROLES.RESTRICTED;
  }

  loadSubscriptions() {
    // TODO: Uncomment after migration
    /* this.http.get(`${baseUrl}/subscription_limits`).subscribe((response) => {
      this.subscriptionLimits = response;
    }); */
    // this.subscriptionLimits =
    //   this.dataService.getUserData().subscription_limits;
    /* this.store.selectSnapshot((state) => {
      this.subscriptionLimits = { ...state.user.subscriptionLimits };
    }); */
  }

  // TODO: Complete Implementation
  getAvoidErrorLoggingStatusList() {
    return [403];
  }

  getAttachmentTypes() {
    return this.http.get(`document_tag_definitions`);
    // TODO: Need to replace _.sortBy()
    /* .subscribe((response: any) => {
        return (response = _(response).sortBy(
          (tag: { name: { toLowerCase: () => any } }) => {
            return tag.name.toLowerCase();
          }
        ));
      }); */
  }

  getTeamMembers() {
    return this.http.get('team_members');
  }

  getOperators() {
    return this.http.get('operators').pipe(
      map((response: any) => {
        const symbol_map = {
          eq: '=',
          gt: '>',
          gte: '>=',
          lt: '<',
          lte: '<=',
          noteq: '≠',
          ac: 'Δ',
          cont: '⊂',
        };
        const label_map = {
          eq: 'Equal To',
          gt: 'Greater Than',
          gte: 'Greater Than or Equal To',
          lt: 'Less Than',
          lte: 'Less Than or Equal To',
          noteq: 'Not Equal To',
          ac: 'Any Change',
          cont: 'Contains',
        };

        response.forEach((element) => {
          element.display_symbol = symbol_map[element.value];
          element.display_label = label_map[element.value];
        });
        return response;
      })
    );
  }

  getFunctions() {
    return this.http.get('functions');
  }

  getPermissionEntityDetails(entityId, entityType) {
    return this.http.get('permissionurls', {
      params: {
        entity_id: entityId.toString(),
        entity_type: entityType,
      },
      headers: {
        'page-url': 'app/permissionurls',
      },
    });
  }

  getStatuses() {
    return this.http.get('tags', { params: { type: 'Status' } });
  }

  setContactPageUrl(url) {
    this.contactPageUrl = url;
  }

  getShareClassTableValues(id) {
    return this.http.get(
      `AumTrackRecordDefinitions/${id}/AumTrackRecordValues`
    );
  }

  getAddresses(params) {
    return this.http.get('entity_addresses', { params });
  }

  deleteAddress(id) {
    return this.http.delete('entity_addresses/' + id);
  }

  getAvoidErrorDisplayStatusList() {
    return [400, 403, 404, 405, 500, 502, 503, 401];
  }

  deleteEmail(id) {
    return this.http.delete('emails/' + id);
  }

  deleteNote(id) {
    return this.http.delete('notes/' + id);
  }

  getWebsocketToken() {
    return this.http.get('service/dvapi_service/pubsub_token');
  }

  getRoles(firmId, params) {
    return this.http.get('firms/' + firmId + '/roles', {
      params: params,
    });
  }

  getDefaultRole() {
    return this.http.get('roles/default');
  }

  getPermissionTypes(called_from_firm_pref = false) {
    return this.http.get('Permission_Types', {
      params: { called_from_firm_pref },
    });
  }
}
