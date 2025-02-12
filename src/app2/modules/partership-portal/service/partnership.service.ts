import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PartnershipService {
  constructor(
    private readonly http: HttpClient,
  ) {}

  getPartners() {
    return this.http.get('partners');
  }

  getPartnershipTypes() {
    return this.http.get('partnertypes');
  }

  getPartnerByTypeId(id) {
    return this.http.get(`partners?type_id=${id}`);
  }

  getReferralsByPartnerId(id) {
    return this.http.get(`partners/${id}/referrals`);
  }

  getViewsByPartnerId(id) {
    return this.http.get(`partners/${id}/views`);
  }

  postPartnershipReferrals(id, data) {
    return this.http.post(`partners/${id}/referrals`, data);
  }

  postPartnershihViews(id, data) {
    return this.http.post(`partners/${id}/views`, data);
  }
}
