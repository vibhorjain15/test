import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { PartnershipService } from '../../service/partnership.service';
import { ToastrService } from 'ngx-toastr';
import { UserState } from 'src/app2/store/user/user.state';
import { Select, Store } from '@ngxs/store';
import { finalize, take } from 'rxjs/operators';
import { RouterService } from 'src/app2/services/router.service';

@Component({
  selector: 'dv-partnership-list',
  templateUrl: './partnership-list.component.html',
  styleUrls: ['./partnership-list.component.css'],
})
export class PartnershipListComponent implements OnInit, OnChanges {
  name = '';
  @Input() partners = [];
  @Input() partnerTypeIndex = 1;
  @Input() loader;
  buttonLoader = false;
  partnersCopy;
  constructor(
    private readonly modal: CustomModalService,
    private partnerService: PartnershipService,
    private toaster: ToastrService,
    private readonly routerService: RouterService
  ) {}

  ngOnInit(): void {
    this.partnersCopy = this.partners;
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.partners.currentValue !== changes.partners.previousValue) {
      this.partnersCopy = changes.partners.currentValue;
      this.partners = changes.partners.currentValue;
      this.name = '';
    }
  }

  handleCardClick(partner) {
    this.partnerService
      .postPartnershihViews(partner.id, {
        signup_reason: 'new integration',
      })
      .subscribe();
    this.modal.invoke('partners-detail', {
      initialState: {
        partner,
        onSuccess: () => {
          this.partners.forEach((partner) => {
            partner.isChecked = false;
          });
          this.partners = JSON.parse(JSON.stringify(this.partners));
        },
      },
      class: 'modal-lg',
    });
  }

  handleRequestClick() {
    let ids = [];
    this.partners.forEach((partner) => {
      if (partner.isChecked) ids.push(partner);
    });
    if (!ids.length) {
      this.toaster.error('please select atleast one partner');
      return;
    }
    let entity_id,
      entity_type,
      entity_name = null;
    let data = this.routerService.getState().params;
    if (data) {
      entity_id = data.entity_id;
      entity_type = data.entity_type;
      entity_name = data.entity_name;
    }
    ids.map((partner) => {
      this.buttonLoader = true;
      this.partnerService
        .postPartnershipReferrals(partner.id, {
          signup_reason: 'new integration',
          entity_id,
          entity_type,
          entity_name,
        })
        .pipe(
          finalize(() => {
            this.buttonLoader = false;
          })
        )
        .subscribe(() => {
          this.toaster.success(`Request successfully sent to ${partner.name}`);
          this.buttonLoader = false;
          this.partners.forEach((partner) => {
            partner.isChecked = false;
          });
          this.partners = JSON.parse(JSON.stringify(this.partners));
          if (data)
            this.routerService.navigateWithParams('app.partnership', {
              entity_id: null,
              entity_type: null,
              entity_name: null,
            });
        });
    });
  }

  handleChange() {
    this.partners = this.partnersCopy.filter((val) =>
      val.name.toLowerCase().includes(this.name.toLowerCase())
    );
  }
}
