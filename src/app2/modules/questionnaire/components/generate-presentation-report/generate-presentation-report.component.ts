import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import { RouterService } from 'src/app2/services/router.service';
import { ErrorStatusCode } from '../../../../shared/constants/constant';

@Component({
  selector: 'generate-presentation-report-component',
  templateUrl: './generate-presentation-report.component.html',
  styleUrls: ['./generate-presentation-report.component.css'],
})
export class GeneratePresentationReportComponent implements OnInit {
  loading: boolean;
  templates: any[];
  presentationReportConfigurationForm: FormGroup;
  isGeneratingReport = false;
  @Input() diligence: DiligenceType;
  @Input() current_user;
  @Input() show_presentation_module;
  @Output() isLoading = new EventEmitter();
  @Output() isExporting = new EventEmitter();

  constructor(
    private readonly httpClient: HttpClient,
    private readonly toaster: ToastrService,
    private route: RouterService
  ) {}

  ngOnInit(): void {
    this.isLoading.emit(true);
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
          this.isLoading.emit(false);
        },
        (err) => {
          this.loading = false;
          this.isLoading.emit(false);
          if (
            !(
              err &&
              err.status &&
              Object.values(ErrorStatusCode).includes(err.status)
            )
          ) {
            this.toaster.error(
              '',
              'Something went wrong while loading presentation design. Please try again.',
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
    if (!this.templates?.length) {
      this.toaster.error('No reporting definition available to export');
      this.isLoading.emit(false);
      return;
    }
    if (this.presentationReportConfigurationForm.invalid) {
      this.presentationReportConfigurationForm.markAllAsTouched();
      this.isLoading.emit(false);
      return;
    }

    this.isGeneratingReport = true;
    this.isExporting.emit(true);
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
          this.isExporting.emit(false);
          this.toaster.success(
            '',
            'Exported successfully. Please expect an email with the presentation report attached.'
          );
          modalCallback();
        },
        (err) => {
          this.isGeneratingReport = false;
          this.isExporting.emit(false);
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
