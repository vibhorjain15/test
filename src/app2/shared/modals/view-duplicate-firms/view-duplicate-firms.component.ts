import { Component, Input } from '@angular/core';
import { RouterService } from 'src/app2/services/router.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { ModalService } from 'src/app2/services/modal.service';
import { BsModalRef } from 'ngx-bootstrap/modal';
@Component({
  selector: 'app-view-duplicate-firms',
  templateUrl: './view-duplicate-firms.component.html',
  styleUrls: ['./view-duplicate-firms.component.css'],
})
export class ViewDuplicateFirmsComponent {
  loading: boolean;
  @Input() duplicateFirms: any;
  @Input() onSuccess;
  @Input() source: string;
  constructor(
    private readonly routerService: RouterService,
    private modal: CustomModalService,
    public bsModalNewRef: BsModalRef
  ) {}

  ngOnInit(): void {}

  addToPortfolio(firm) {
    this.onSuccess(firm);
    this.modal.close();
  }

  selectFirm(firm) {
    this.onSuccess(firm);
    this.modal.close();
  }

  navigateToRelatedFirms(firmId) {
    this.modal.closeAllActiveModals();
    this.routerService.navigateWithParams(`app.firms.profile.monitor`, {
      firmId: firmId,
    });
  }
}
