import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { DomainRequestType, IDomain } from './domain.type';

@Injectable({
  providedIn: 'root',
})
export class DomainService {
  constructor(
    private readonly http: HttpClient,
    private readonly toaster: ToastrService
  ) {}

  activeDomainsList: IDomain[] = [];
  usersDomains: string[] = [];
  activeDomainsListSub :Subject<any> = new Subject()

  get allUsersDomain() {
    return this.usersDomains;
  }

  getActiveDomains() {
    this.http.get(`firm_settings/firm_domains`).subscribe(
      (response: IDomain[]) => {
        this.activeDomainsList = response;
        this.activeDomainsListSub.next(this.activeDomainsList)
      },
      (error: any) => {
        this.toaster.error(error.message, '', {
          timeOut: 3000,
        });
      }
    );
  }

  getUserDomains(successCallback) {
    this.usersDomains.length !== 0
      ? successCallback(this.usersDomains)
      : this.http.get(`firm_settings/firm_domains/GetUserDomains`).subscribe(
          (response: string[]) => {
            this.usersDomains = response;
            successCallback(this.usersDomains);
          },
          (error: any) => {
            this.toaster.error(error.message);
          }
        );
  }

  removeDomain(domain: IDomain, index: number) {
    this.http
      .delete(`firm_settings/firm_domains/${domain.id}`)
      .subscribe((response: IDomain) => {
        this.activeDomainsList.splice(index, 1);
        this.activeDomainsListSub.next(this.activeDomainsList)
        this.toaster.success('Domain removed successfully');
      });
  }

  updateDomain(domain: IDomain, index: number, key = 'is_sso_enabled') {
    this.http.put(`firm_settings/firm_domains/${domain.id}`, domain).subscribe(
      (response: IDomain) => {
        this.activeDomainsList[index] = response;
        this.activeDomainsListSub.next(this.activeDomainsList)
        this.toaster.success('Domain updated successfully');
      },
      (error: any) => {
        domain[key] = !domain[key];
      }
    );
  }

  addDomain(domain: DomainRequestType, successCallback: () => void, failure) {
    this.http.post(`firm_settings/firm_domains`, domain).subscribe(
      (response: IDomain) => {
        this.activeDomainsList.push(response);
        this.activeDomainsListSub.next(this.activeDomainsList)
        successCallback();
        this.toaster.success('Domain added successfully');
      },
      (error: any) => {
        failure();
      }
    );
  }
}
