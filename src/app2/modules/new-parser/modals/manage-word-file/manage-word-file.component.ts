import { Component, Input, OnInit } from '@angular/core';
import { TemplatesDataService } from 'src/app2/services/template-data.service';
import { RouterService } from 'src/app2/services/router.service';
import { FileHandlerService } from 'src/app2/services/file-handler.service';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-manage-word-file',
  templateUrl: './manage-word-file.component.html',
  styleUrls: ['./manage-word-file.component.css'],
})
export class ManageWordFileComponent implements OnInit {
  @Input() params: any;
  @Input() source: any;
  @Input() success?: Function;

  files: any = [];
  maxFileSize: any;
  allowed_file_extensions_str: any;
  saving_template: boolean;

  constructor(
    private fileHandleFactory: FileHandlerService,
    private http: HttpClient,
    private templatesDataService: TemplatesDataService,
    private router: RouterService,
    private toastrService: ToastrService
  ) {}

  ngOnInit(): void {
    this.initialize();
  }

  initialize() {
    this.files = [];
    this.maxFileSize = this.fileHandleFactory.getMaxFileSize();
    const allowed_file_extensions = ['docx', 'DOCX'];

    this.allowed_file_extensions_str = allowed_file_extensions
      .map((ext: string) => '.' + ext)
      .join(',');
  }

  submit(modalCloseCallback) {
    if (this.files.length === 0) {
      this.toastrService.error('Please select a file');
      return;
    }
    this.saving_template = true;
    this.uploadFiles(modalCloseCallback);
  }

  uploadFiles(modalCloseCallback) {
    const diligenceParams: any = this.templatesDataService.getDiligenceParams();
    const templateParams: any = this.templatesDataService.getTemplateParams();
    let entity_id = null;
    let entity_type = null;
    let investor_id = null;
    if (templateParams?.source === 'InformationRequestFlow') {
      entity_id = diligenceParams?.apiParams?.entity_id || null;
      entity_type = diligenceParams?.apiParams?.entity_type_name || diligenceParams?.apiParams?.entity_type || null;
      investor_id = diligenceParams?.apiParams?.investor_id || null;
    } else {
      entity_id = templateParams?.entity_id || null;
      entity_type = templateParams?.entity_type_name || templateParams?.entity_type || null;      
      investor_id = templateParams?.investor_id || null;
    }
    
    const params = {
      url: `excel_parser/upload?parserType=Word&entity_type=${entity_type}&entity_id=${entity_id}&investor_id=${investor_id}`,
      file: this.files,
    };
    const formData = new FormData();
    formData.append('file', params.file[0]);
    this.http.post(`excel_parser/upload?parserType=Word&entity_type=${entity_type}&entity_id=${entity_id}&investor_id=${investor_id}`, formData).subscribe((response: any) => {
      this.templatesDataService.setWordParserData(response);
      this.templatesDataService.setOriginalWordFile(params.file);
      const paramCopy: any = this.templatesDataService.getTemplateParams();
      paramCopy.name = params.file[0].name;
      this.templatesDataService.setTemplateParams(paramCopy);
      response.file = params.file;
      this.router.navigateWithParams('app.diligence.word_to_template', {
        doc_id: response.doc_id,
        type: this.source,
      });
      this.success(response);
      modalCloseCallback();
    });
  }
}
