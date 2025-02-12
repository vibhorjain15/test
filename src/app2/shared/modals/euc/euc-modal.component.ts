import { Component, OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { UpdateEUCAccepted } from 'src/app2/store/user/user.action';
@Component({
  selector: 'euc-modal',
  templateUrl: './euc-modal.component.html',
  styleUrls: ['./euc-modal.component.css'],
})
export class EucModalComponent implements OnInit {
  showDetails = false;
  title = 'Terms and Conditions';
  loading = false;
  acceptedAgreement = false;

  constructor(
    private readonly store: Store,
    private readonly modal: CustomModalService
  ) {}

  ngOnInit(): void {}
  acceptAgreement(close) {
    if (this.acceptedAgreement) {
      this.loading = true;
      this.store.dispatch(new UpdateEUCAccepted()).subscribe((store) => {
        this.loading = false;
        if (store.user?.error) return;
        this.modal.close();
      });
    }
  }
}
