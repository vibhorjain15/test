import { Component, OnDestroy, OnInit } from '@angular/core';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { DomainService } from 'src/app2/services/domain/domain.service';
import { IDomain } from 'src/app2/services/domain/domain.type';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { finalize } from 'rxjs/operators';
import swal from 'sweetalert2/dist/sweetalert2.js';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { PanelControl } from 'src/app2/shared/components/dv-panel-heading/dv-panel-heading.component';

@Component({
  selector: 'app-domain',
  templateUrl: './domain.component.html',
  styleUrls: ['./domain.component.css'],
})
export class DomainComponent implements OnInit, OnDestroy {
  filterDomains = '';
  domains;
  ssoObject: {};
  domainSub;
  panelHeadingControls: PanelControl[] = [];
  constructor(
    private readonly SweetAlert: SweetAlertService,
    private readonly ModalFactory: CustomModalService,
    private readonly domainService: DomainService,
    private readonly http: HttpClient,
    private readonly toaster: ToastrService
  ) {}

  ngOnInit() {
    this.ssoObject = {};
    this.domains = [];
    this.getDomains();
    this.setPanelHeadingControls();
    this.domainSub = this.domainService.activeDomainsListSub.subscribe(
      (domains) => {
        this.domains = domains;
      }
    );
  }

  confirmDomainDeletion(domain: any, index: any) {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to remove this domain?',
      focusCancel: true,
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.removeDomain(domain, index, resolve);
        });
      },
    }).then(() => {
      swal.close();
    });
  }

  setPanelHeadingControls() {
    this.panelHeadingControls = [
      {
        text: 'New Domain',
        handleClick: this.addNewDomain.bind(this),
        tooltip: 'Add New Domain',
        leftIcon: 'plus',
      },
    ];
  }

  toggleSSO(domainObj: IDomain, index: number) {
    this.domainService.updateDomain(domainObj, index);
  }

  toggleWhiteListing(domainObj: IDomain, index: number) {
    this.domainService.updateDomain(
      domainObj,
      index,
      'is_auto_approve_enabled'
    );
  }

  removeDomain(domain: any, index: any, resolve) {
    this.http
      .delete(`firm_settings/firm_domains/${domain.id}`)
      .pipe(finalize(() => resolve()))
      .subscribe((response: any) => {
        this.domains.splice(index, 1);
        this.toaster.success('Domain removed successfully', '', {
          timeOut: 3000,
        });
      });
  }

  getDomains() {
    this.domainService.getActiveDomains();
  }

  addNewDomain() {
    this.ModalFactory.invoke('add-domain');
  }

  ngOnDestroy(): void {
    this.domainSub.unsubscribe();
  }
}
