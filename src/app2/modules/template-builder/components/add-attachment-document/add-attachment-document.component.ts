import {
  Component,
  Input,
  OnInit,
  Output,
  SimpleChanges,
  EventEmitter,
} from '@angular/core';
import { TemplateService } from 'src/app2/apis/template/template.service';
import { HttpEventType } from '@angular/common/http';
import { FileHandlerService } from 'src/app2/services/file-handler.service';

@Component({
  selector: 'add-attachment-document',
  templateUrl: './add-attachment-document.component.html',
  styleUrls: ['./add-attachment-document.component.css'],
})
export class AddAttachmentDocumentComponent implements OnInit {
  @Input() question;
  @Input() clearSelection;
  @Output() onAddDocumentClick: EventEmitter<any> = new EventEmitter();
  tabType = 'new';
  drop_files = [];
  params = {};
  files: any;
  fileProgress = null;
  firmId;
  allowed_file_extensions;
  maxFileSize;
  maxDate = new Date();
  allowed_file_extensions_str;
  dict = {
    originalAssigned: {},
    unassigned: {},
    newAssigned: {},
  };
  edit_mode: true;
  attachments;
  questionCopy;
  QuestionSelectorDisplayParams = {
    id: 'id',
    name: 'file_name',
  };
  ngOnChanges(changes: SimpleChanges): void {
    if (!this.clearSelection && this.attachments?.length) {
      this.attachments.map((entity) => (entity.is_selected = false));
    }
  }

  constructor(
    private template: TemplateService,
    private readonly FileHandlerFactory: FileHandlerService
  ) {}

  ngOnInit(): void {
    this.template.getPublicDocuments().subscribe((res) => {
      this.attachments = res;
      this.attachments = this.attachments.map((element,index) => {
        element.name = element.file_name;
        element.id = index;
        if (this.question.filename === element.file_name) {
          element.is_selected = true;
        }
        return element;
      });
    });
    this.questionCopy = { ...this.question };
    this.maxFileSize = this.FileHandlerFactory.getMaxFileSize();
  }

  uploadFile() {
    if (this.files) {
      let payload = new FormData();
      payload.append('file', this.files);
      this.template.uploadAttachment(payload).subscribe((response) => {
        if (response.type === HttpEventType.Response) {
          this.question.attachmentHtml =
            '<a id="attachmentUrl" (click)="downloadAttachment(\'' +
            response.body[0] +
            '\')">Download Source File</a>';
          this.question.filename = this.files.name;
          this.question.attachmentHref = response.body[0];
          this.fileProgress = null;
          this.onAddDocumentClick.emit(this.question);
        }
        if (response.type === HttpEventType.UploadProgress) {
          this.fileProgress = Math.round(
            (100 * response.loaded) / response.total
          );
        }
      });
    }
  }

  handleFileUploaded(data) {
    this.files = data[0];
    this.uploadFile();
    this.attachments.forEach((val) => (val.is_selected = false));
  }
  handleSelectionChange(data) {
    if (data?.length) {
      this.files = data[0];
      this.question.attachmentHtml =
        '<a id="attachmentUrl" (click)="downloadAttachment(\'' +
        this.files.file_url +
        '\')">Download Source File</a>';
      this.question.filename = this.files.name;
      this.question.attachmentHref = this.files.file_url;
      this.onAddDocumentClick.emit(this.question);
    } else {
      this.attachments.map((entity) => (entity.is_selected = false));
      this.question.filename = null;
    }
  }

  setTabType(type) {
    this.tabType = type;
  }
}
