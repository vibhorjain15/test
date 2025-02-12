import { Component, Input, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import { IDisclaimerObject } from 'src/app2/services/manage-disclaimer/manage-disclaimer.types';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';

@Component({
  selector: 'view-disclaimer',
  templateUrl: './view-disclaimer.component.html',
  styleUrls: ['./view-disclaimer.component.css'],
})
export class ViewDisclaimerModal implements OnInit {
  @Input() disclaimerObj: IDisclaimerObject;
  @Input() entityId: any;
  @Input() editDisclaimer: any;
  @Input() deleteDisclaimer: any;
  @Input() isManager: boolean;

  text: string;
  constructor(
    private readonly SweetAlert: SweetAlertService,
    private readonly questionnaireService: QuestionnaireService,
    private readonly toaster: ToastrService
  ) {}
  ngOnInit() {
    this.text = this.disclaimerObj.text.replace(/&nbsp;/g, ' ');
  }
  handleDeleteClick(closeModalEvent) {
    this.confirmRemoveDisclaimer(closeModalEvent);
  }
  showUpdateDisclaimerModal(closeModal) {
    closeModal();
    this.editDisclaimer();
  }
  confirmRemoveDisclaimer(closeModalEvent) {
    const title = 'Are you sure you want to delete this disclaimer?';
    this.SweetAlert.confirm({
      title,
      confirmButtonText: 'Yes',
      focusCancel: true,
      showLoaderOnConfirm: true,
      preConfirm: () => {
        this.questionnaireService
          .removeDisclaimerFromProject(this.entityId)
          .subscribe(
            () => {
              this.toaster.success('', 'Disclaimer removed successfully');
              this.deleteDisclaimer();
              closeModalEvent();
            },
            () => {}
          );
      },
    });
  }
}
