import { Component, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Subscription } from 'rxjs';
import { RouterService } from 'src/app2/services/router.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { DeleteCurrentTemplateData } from '../../store/reports.actions';
import swal from 'sweetalert2/dist/sweetalert2.js';
import { ReportState } from '../../store/reports.state';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { ReportUtilsService } from '../../util/reportUtil.service';
@Component({
  selector: 'report-template-list-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.css'],
})
export class ReportTemplatesListPreviewComponent implements OnInit {
  template: any;
  selectedTemplateSub: Subscription;
  @Select(ReportState.getCurrentTemplate) selectedTemplate;

  constructor(
    private store: Store,
    private readonly router: RouterService,
    private ModalFactory: CustomModalService,
    private readonly SweetAlert: SweetAlertService,
    private readonly reportUtilService: ReportUtilsService
  ) {}

  ngOnDestroy() {
    this.selectedTemplateSub.unsubscribe();
  }

  ngOnInit() {
    this.selectedTemplateSub = this.selectedTemplate.subscribe((val) => {
      this.template = val;
    });
  }

  editNewTemplate() {
    this.ModalFactory.invoke('add-report-template', {
      initialState: {
        report: this.template,
      },
      class: 'gray modal-lg',
    });
  }

  downloadReport() {
    this.reportUtilService.downloadReport(
      `/report_templates/download/${this.template.id}`
    );
  }

  deleteCurrentTemplate(template: { id: any; is_new_report: any }) {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to delete this presentation design?',
      showLoaderOnConfirm: true,
      focusCancel: true,
      preConfirm: () => {
        this.store
          .dispatch(
            new DeleteCurrentTemplateData({
              id: template.id,
              is_new_report: template.is_new_report,
            })
          )
          .subscribe((val) => {
            swal.close();
          });
        this.router.navigateWithParams('app.reports.templates.list', null, {
          reload: true,
        });
      },
    });
  }

  handlenotNewReportEdit() {
    this.router.navigateWithParams('app.reports.templates.detail', {
      templateId: this.template.id,
    });
  }

  handlenotNewReportView() {
    this.router.navigateWithParams('app.reports.templates.detail.preview', {
      templateId: this.template.id,
    });
  }
}
