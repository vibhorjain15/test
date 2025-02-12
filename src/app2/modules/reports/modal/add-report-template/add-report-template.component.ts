import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Select, Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { take } from 'rxjs/operators';
import { FileHandlerService } from 'src/app2/services/file-handler.service';
import { ReportTemplateDataservice } from 'src/app2/services/report-template-data.service';
import { TemplatesDataService } from 'src/app2/services/template-data.service';
import {
  GetAllTemplates,
  GetCurrentTemplateData,
  UpdateAllTemplates,
} from '../../store/reports.actions';
import { ReportState } from '../../store/reports.state';
import { DvValidators } from 'src/app2/shared/validators/no-white-space.validator';
import { validateAllFormFields } from 'src/app2/utils/validateAllFormFields';

@Component({
  selector: 'add-report-template',
  templateUrl: './add-report-template.component.html',
  // styleUrls: ['./add-report-template.component.css'],
})
export class AddReportTemplateComponent implements OnInit {
  templateName: string;
  editMode: boolean;
  templates: any;
  @Input() report: any;
  report_templates: any;
  active_tab: string;
  maxLengthReportName: number;
  drop_files: any;
  params: any;
  files: any;
  attachments: any;
  selected_templates: any;
  maxFileSize: any;
  templateSelectorDisplayParams: any;
  loading: boolean;
  filteredTemps: any;
  new_document_uploaded: boolean;
  uploaded_file: any;
  add_report_template_form: any;
  isSelectedTrueTemplates: any;
  templateList = [];
  @Input() isAngularJs = false;

  reportTemplateForm: FormGroup;
  @Select(ReportState.getCurrentTemplate) currentTemplate;
  constructor(
    private store: Store,
    private readonly toaster: ToastrService,
    private readonly templateService: TemplatesDataService,
    private readonly ReportTemplateDataservice: ReportTemplateDataservice,
    private readonly FileHandlerFactory: FileHandlerService
  ) {}

  ngOnInit(): void {
    this.reportTemplateForm = new FormGroup({
      report_name: new FormControl(null, [DvValidators.required]),
    });
    this.templateName = 'templates-selector';
    this.editMode = false;
    this.templates = [];
    if (this.report) {
      this.editMode = true;
      this.reportTemplateForm.patchValue({
        report_name: this.report.name,
      });

      this.report_templates = JSON.parse(
        this.report.template_details
      ).template_details;
    }
    this.active_tab = 'word_report';
    this.maxLengthReportName = 200;
    this.drop_files = [];
    this.params = {};
    this.files = [];
    this.params.name = null;
    this.attachments = [];
    this.selected_templates = [];
    this.maxFileSize = this.FileHandlerFactory.getMaxFileSize();
    this.getTemplates();
    this.templateSelectorDisplayParams = {
      id: 'id',
      name: 'name',
      showQuestionTags: true,
      showQuestionTagsLabel: 'View tags',
    };
  }

  handleUploadError(response: any) {
    this.loading = false;
  }

  getDocumentUploadResponse(response: any) {
    this.toaster.success('Document(s) successfully uploaded');
    this.loading = false;
    // return this.close('refresh');
  }

  filterbyStandardTemplate(templates: any) {
    return templates.filter((template) => template.type !== 'dd_profile');
  }

  getTemplates() {
    return this.templateService.getTemplates({}).subscribe((response: any) => {
      response = this.filterbyStandardTemplate(response);
      let localList = [];
      response.map((innerTemplate) => {
        localList.push(innerTemplate.templateInfo);
      });
      if (this.report_templates && this.report_templates.length) {
        this.selected_templates = [];
        const selected_temps = this.report_templates.map(
          (val) => val.template_id
        );
        localList.forEach((template) => {
          if (selected_temps.indexOf(template.id) > -1) {
            template.is_selected = true;
            this.selected_templates.push(template);
          }
        });

        this.filteredTemps = localList.filter(
          (template) => template.is_selected
        );
        let unselectedTemps = localList.filter((val) => !val['is_selected']);

        localList = [...this.filteredTemps, ...unselectedTemps];
      }
      this.templateList = localList;
    });
  }

  deleteFile(idx: any) {
    return this.files.splice(idx, 1);
  }

  submit(close) {
    validateAllFormFields(this.reportTemplateForm);
    if (this.editMode) {
      this.isSelectedTrueTemplates = [];
      this.isSelectedTrueTemplates = this.selected_templates.filter(
        (template) => template.is_selected
      );
    }
    if (
      !this.selected_templates.length &&
      this.reportTemplateForm.get('report_name').value
    ) {
      this.toaster.error('', 'Please select atleast 1 template');
      return;
    }
    if (
      !this.files.length &&
      !this.editMode &&
      this.reportTemplateForm.get('report_name').value
    ) {
      this.toaster.error('', 'Please select a file');
      return;
    }
    const { report_name } = this.reportTemplateForm.value;
    if (this.reportTemplateForm.valid) {
      let params: any = {};
      if (this.editMode) {
        if (!this.isSelectedTrueTemplates.length) {
          this.toaster.error('', 'Please select atleast 1 template');
          return;
        }
        params.template_ids = this.isSelectedTrueTemplates.map((val) => val.id);
      } else {
        params.template_ids = this.selected_templates.map((val) => val.id);
      }
      params.template_ids = JSON.stringify(params.template_ids);
      params.report_definition_name = report_name;
      params.report_definition_id = 0;
      if (this.report) {
        params.report_definition_id = this.report.id;
      }
      this.loading = true;
      const payload = new FormData();
      if (this.files.length != 0) payload.append('file', this.files[0]);
      payload.append('report_definition_id', params.report_definition_id);
      payload.append('report_definition_name', params.report_definition_name);
      payload.append('template_ids', params.template_ids);
      return this.ReportTemplateDataservice.addReportDocument(
        payload
      ).subscribe(
        (response: any) => {
          this.loading = false;
          const keyword = this.editMode ? 'updated' : 'generated';
          this.toaster.success('', `Report design ${keyword} successfully`);
          if (this.editMode) {
            this.store
              .dispatch(
                new GetCurrentTemplateData({
                  id: this.report.id,
                  is_new_report: this.report.is_new_report,
                })
              )
              .pipe(take(1))
              .subscribe(() => {
                this.currentTemplate.pipe(take(1)).subscribe((val) => {
                  this.store.dispatch(new UpdateAllTemplates(val));
                });
              });
          } else {
            this.store.dispatch(
              new GetAllTemplates({
                include_new_reports: true,
              })
            );
          }
          close();
        },
        (error: { data: any }) => {
          this.loading = false;
          if (error.data) {
            this.toaster.error('', error.data);
          }
        }
      );
    }
  }

  handledSelectedEntities(data) {
    this.selected_templates = data;
  }

  handleFileUploaded(data) {
    this.files = data;
  }
}


