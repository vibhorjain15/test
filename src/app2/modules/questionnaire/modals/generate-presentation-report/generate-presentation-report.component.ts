import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import { RouterService } from 'src/app2/services/router.service';
import { ErrorStatusCode } from '../../../../shared/constants/constant';

@Component({
  selector: 'generate-presentation-report',
  templateUrl: './generate-presentation-report.component.html',
  styleUrls: ['./generate-presentation-report.component.css'],
})
export class GeneratePresentationReportModal implements OnInit {
  loading: boolean;
  templates: any[];
  presentationReportConfigurationForm: FormGroup;
  isGeneratingReport = false;
  @Input() diligence: DiligenceType;

  constructor(
    private readonly httpClient: HttpClient,
    private readonly toaster: ToastrService,
    private route: RouterService
  ) {}

  ngOnInit(): void {
    this.presentationReportConfigurationForm = new FormGroup({
      templateControl: new FormControl(null, [Validators.required]),
      nameControl: new FormControl(this.diligence.template_name, [
        Validators.required,
      ]),
    });
    this.getTemplates();
  }

  getTemplates() {
    this.loading = true;
    this.httpClient
      .get('reports/new/mappings/template/' + this.diligence.template_id)
      .subscribe(
        (data) => {
          this.templates = data as any[];
          if (this.templates?.length) {
            this.handleTemplateValueChange(this.templates[0].id);
          }
          this.loading = false;
        },
        (err) => {
          this.loading = false;
          if (
            !(
              err &&
              err.status &&
              Object.values(ErrorStatusCode).includes(err.status)
            )
          ) {
            this.toaster.error(
              '',
              'Something went wrong while loading report design. Please try again.',
              {
                timeOut: 1500,
              }
            );
          }
        }
      );
  }

  handleTemplateValueChange(value) {
    this.presentationReportConfigurationForm
      .get('templateControl')
      .patchValue(value);
  }

  submit(modalCallback) {
    if (this.presentationReportConfigurationForm.invalid) {
      this.presentationReportConfigurationForm.markAllAsTouched();
      return;
    }

    this.isGeneratingReport = true;
    this.httpClient
      .post('reports/new/generate', {
        document_id:
          this.presentationReportConfigurationForm.get('templateControl').value,
        name: this.presentationReportConfigurationForm.get('nameControl').value,
        as_of_date: new Date(),
        diligence_ids: [this.diligence.id],
        save_report: false,
      })
      .subscribe(
        (data) => {
          this.isGeneratingReport = false;
          this.toaster.success(
            '',
            'Once the presentation is ready for download, it will be accessible under Reports > Presentation Reports.'
          );
          modalCallback();
        },
        (err) => {
          this.isGeneratingReport = false;
          if (
            !(
              err &&
              err.status &&
              Object.values(ErrorStatusCode).includes(err.status)
            )
          ) {
            this.toaster.error(
              '',
              'Something went wrong while exporting the presentation report. Please try again.',
              {
                timeOut: 1500,
              }
            );
          }
        }
      );
  }

  redirectToTemplateDefinitions() {
    this.route.navigate('app.reports.templates.list');
  }
}
