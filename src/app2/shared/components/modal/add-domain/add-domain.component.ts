import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DomainService } from 'src/app2/services/domain/domain.service';
import { validateAllFormFields } from '../../../../modules/firm-settings/tags-modal/tags-modal.util';

@Component({
  selector: 'add-domain',
  templateUrl: './add-domain.component.html',
})
export class AddDomainModal implements OnInit {
  userDomains: any[] = [];
  domainForm: FormGroup;
  loading: boolean = false;
  activeDomains = [];
  userDomainsLoading = false;
  constructor(private readonly domainService: DomainService) {}

  ngOnInit() {
    this.domainForm = new FormGroup({
      domain_name: new FormControl(null, [Validators.required]),
      is_sso_enabled: new FormControl(false),
      is_auto_approve_enabled: new FormControl(false),
    });
    this.userDomainsLoading = true;
    this.domainService.getUserDomains((userDomains) => {
      const userDomainsList = userDomains.filter(
        (el) =>
          this.domainService.activeDomainsList.findIndex(
            (obj) => obj.domain_name === el
          ) === -1
      );
      this.userDomains = userDomainsList.map((domain) => {
        return {
          id: domain,
          name: domain,
        };
      });

      this.domainForm.patchValue({
        domain_name: this.userDomains[0].id,
      });
      this.userDomainsLoading = false;
    });
  }

  save(callback) {
    validateAllFormFields(this.domainForm);
    if (this.domainForm.valid) {
      this.loading = true;
      this.domainService.addDomain(
        this.domainForm.value,
        () => {
          this.loading = false;
          callback();
        },
        () => {
          this.loading = false;
        }
      );
    }
  }
}
