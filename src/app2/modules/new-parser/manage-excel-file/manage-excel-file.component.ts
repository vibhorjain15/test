import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import { finalize } from 'rxjs/operators';
import { TemplatesDataService } from 'src/app2/services/template-data.service';
import { UtilsService } from 'src/app2/services/utils.service';

@Component({
  selector: 'app-manage-excel-file',
  templateUrl: './manage-excel-file.component.html',
})
export class ManageExcelFileComponent implements OnInit {
  @Input() params: any;
  @Input() success: Function;
  edit_mode: boolean;
  maxFileSize: any;
  current_firm: any;
  allowed_file_extensions_str: any;
  entity_sub_type: any;
  saving_template: boolean;
  title: string;
  firstButtonLabel = `Import and Close`;
  files: File[] = [];
  userData: any;
  constructor(
    private templateDataService: TemplatesDataService,
    private httpClient: HttpClient,
    private utils: UtilsService,
    private store: Store
  ) {}

  ngOnInit(): void {
    this.initialize();
  }

  initialize() {
    this.store.selectSnapshot((state) => {
      this.userData = state.user;
      this.entity_sub_type = this.utils.getEntitySubType(
        this.userData.subscriptionLimits[0]
      );
    });
    this.title = this.getModalTitle();
    this.edit_mode = false;
    const allowed_file_extensions = ['XLSX', 'xlsx'];

    this.allowed_file_extensions_str = allowed_file_extensions
      .map((ext: string) => '.' + ext)
      .join(',');
  }

  getModalTitle(): string {
    let modalTitle = this.edit_mode
      ? `Create New Template`
      : `Change Excel file`;
    return modalTitle;
  }

  submit(event: any) {
    this.saving_template = true;
    this.uploadExcelFile(this.files, this.params, event);
  }

  uploadExcelFile(file: any, templateParams: any, closeEvent = () => {}) {
    const payload = new FormData();
    let fl = this.files[0];
    payload.append('file', fl);
    const ogFile = file;
    this.httpClient
      .post('/excel_parser/upload?parserType=Excel', payload)
      .pipe(finalize(() => (this.saving_template = false)))
      .subscribe((result: { data: any; file: any }) => {
        this.templateDataService.setExcelParserData(result);
        this.templateDataService.setOriginalExcelFile(file);
        if (templateParams) {
          this.templateDataService.setTemplateParams(templateParams);
        } else {
          this.templateDataService.setTemplateParams({
            name: ogFile[0].name,
          });
        }
        result.file = ogFile;
        this.success(result);
        closeEvent();
      });
  }

  documentUploadComplete(response: any) {
    this.files = response;
  }
}
