import { Component, Input, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { RouterService } from 'src/app2/services/router.service';
import { PartnershipService } from '../service/partnership.service';

@Component({
  selector: 'partners-detail',
  templateUrl: './partners-detail.component.html',
  styleUrls: ['./partners-detail.component.css'],
})
export class PartnersDetailComponent implements OnInit {
  @Input() partner;
  @Input() onSuccess;
  img;
  loader = false;
  buttonLabel = 'Request more information';
  constructor(
    private partnerService: PartnershipService,
    private toaster: ToastrService,
    private modal: CustomModalService,
    private readonly routerService: RouterService
  ) {}
  ngOnInit(): void {
    this.img = `<div>
      <img class='patnership-img' alt="${this.partner.name}" src="${this.partner.logo}" />
      <div class='partnership-link'><a target='_blank' href='https://${this.partner.website}'>${this.partner.website}</a> </div>
      </div>`;
  }

  handleModalFirstClick() {
    this.loader = true;
    let entity_id,
      entity_type,
      entity_name = null;
    let data = this.routerService.getState().params;
    if (data) {
      entity_id = data.entity_id;
      entity_type = data.entity_type;
      entity_name = data.entity_name;
    }
    this.partnerService
      .postPartnershipReferrals(this.partner.id, {
        signup_reason: 'new integration',
        entity_id,
        entity_type,
        entity_name,
      })
      .pipe(
        finalize(() => {
          this.loader = false;
        })
      )
      .subscribe((val) => {
        this.loader = false;
        this.modal.close();
        this.toaster.success(
          'Request successfully sent to ' + this.partner.name
        );
        if (data)
          this.routerService.navigateWithParams('app.partnership', {
            entity_id: null,
            entity_type: null,
            entity_name: null,
          });
        this.onSuccess();
      });
  }
}
