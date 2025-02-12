import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { placeholder } from '../../constants/responseType.constant';
import { baseUrl } from 'src/app2/shared/constants/constant';
import { saveAs } from 'file-saver';
import { fieldPreviewtype } from 'src/app2/shared/components/field-preview/field-preview.type';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'dv-response-type-preview',
  templateUrl: './dv-response-type-preview.component.html',
  styleUrls: ['./dv-response-type-preview.component.css'],
})
export class DvResponseTypePreviewComponent implements OnInit, OnChanges {
  @Input() question: fieldPreviewtype;
  @Input() editable: boolean = false;
  @Input() editMode: boolean = false;
  @Output() onChange: EventEmitter<any> = new EventEmitter();
  @Input() onSaveClick;
  allowOtherOption = false;
  baseUrl = baseUrl;
  type;
  placeholder = placeholder;
  checked = true;
  saveButtonClicked = false;
  yesNoRadio;
  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.onSaveClick?.subscribe((data) => {
      this.saveButtonClicked = true;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes?.question &&
      changes.question.currentValue !== changes.question.previousValue
    ) {
      this.type = this.question.responseType;
      if (this.type == 'BooleanPlus') this.yesNoRadio = 'Yes';
      else if (this.type == 'NoPlus') this.yesNoRadio = 'No';
      this.allowOtherOption = this.question?.has_other_option_enabled;
    }
  }

  handleAddDocumentClick(data) {
    this.question.attachmentHtml = data.attachmentHtml;
    this.question.filename = data.filename;
    this.question.attachmentHref = data.attachmentHref;
  }

  downloadAttachment(fileName) {
    let targetUrl: string = fileName.split('api/')[1];
    this.http.get(targetUrl, { responseType: 'blob' }).subscribe((res: any) => {
      const filename = targetUrl.split('file_name=')[1];
      saveAs(res, filename);
    });
  }

  deleteAttachment() {
    this.question.filename = null;
    this.onChange.emit(this.question);
  }

  handelAttachmentUploadEnabledChange(isEnabled: boolean) {
    if (!isEnabled) {
      this.deleteAttachment();
    }
  }

  handlePresetTagsChange(tags: any[]) {
    this.question.predefined_document_tags = tags;
  }
}

type typeOptionsType = {
  type: string;
};

export type optionsTypes = {
  id: number;
  is_active: boolean;
  text: string;
  type: string;
  type_options: typeOptionsType;
};
