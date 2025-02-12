import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TemplateService } from 'src/app2/apis/template/template.service';
import { validateAllFormFields } from 'src/app2/modules/firm-settings/tags-modal/tags-modal.util';
import { DvValidators } from 'src/app2/shared/validators/no-white-space.validator';
import { previewOptionsType } from '../../components/question-tag-mapper/question-tag-mapper.component';
import {
  responseType,
  responseTypeList,
} from '../../constants/responseType.constant';

@Component({
  selector: 'manage-widget',
  templateUrl: './manage-widget.component.html',
  styleUrls: ['./manage-widget.component.css'],
})
export class ManageWidgetComponent implements OnInit {
  @Input() widget: {
    id: number;
    text: string;
    isSelected: boolean;
    responseType: string;
    previewOptions: string[];
  };
  @Input() onSuccess;
  widgetForm: FormGroup;
  previewData = {
    responseType: null,
    rows: [],
    columns: [],
    options: [],
    dynamicElements: null,
    attachmentUploadEnabled: false,
    has_other_option: false,
    has_other_option_enabled: false,
    filename: null,
  };
  title = 'Add Widgets';
  loading = false;

  responseType = [
    { id: 1, text: 'Date' },
    { id: 2, text: 'Dropdown' },
  ];

  localOptions = [];
  constructor(private template: TemplateService) {}
  ngOnInit(): void {
    this.widgetForm = new FormGroup({
      name: new FormControl(null, [DvValidators.required]),
      type: new FormControl(this.responseType[0], [Validators.required]),
    });
    this.previewData.responseType = responseType.Date;
    if (this.widget?.responseType)
      this.widget.responseType =
        this.widget.responseType[0]?.toUpperCase() +
        this.widget.responseType?.slice(1);
    if (this.widget) {
      this.widgetForm.patchValue({
        name: this.widget.text,
        type: this.responseType.filter(
          (val) => val.text === this.widget.responseType
        )[0],
      });
      this.title = 'Edit Widgets';
      this.previewData.responseType = this.widget.responseType;
      if (this.widget.responseType === responseType.Dropdown) {
        this.previewData.options = this.widget.previewOptions.map(
          (val: any, index): previewOptionsType => {
            return {
              id: index + 1,
              is_active: true,
              text: val.text,
              type: 'text',
              type_options: { type: 'text' },
            };
          }
        );
        this.localOptions = this.previewData.options;
      }
    }
  }
  handleChange(value) {
    this.widgetForm.patchValue({
      type: value,
    });
    this.previewData = { ...this.previewData, responseType: value.text };
    if (value.text === responseType.Dropdown) {
      this.previewData.options = this.localOptions;
    }
  }

  handleSave(close) {
    validateAllFormFields(this.widgetForm);
    if (this.widgetForm.valid) {
      const { name, type } = this.widgetForm.value;
      this.loading = true;
      if (this.widget) {
        let payload: any = {
          id: this.widget.id,
          is_active: true,
          name: name,
          type: type.text.toLowerCase(),
        };
        if (type.text === responseType.Dropdown) {
          payload.type_options = this.previewData.options.map(
            (val) => val.text
          );
        }
        this.template.updateWidget(this.widget.id, payload).subscribe(
          (res) => {
            this.onSuccess(res);
            this.loading = false;
            close();
          },
          (err) => (this.loading = false)
        );
      } else {
        let payload: any = {
          name: name,
          type: type.text.toLowerCase(),
        };
        if (type.text === responseType.Dropdown) {
          payload.type_options = this.previewData.options.map(
            (val) => val.text
          );
        }
        this.template.createWidget(payload).subscribe(
          (res) => {
            this.onSuccess(res);
            this.loading = false;
            close();
          },
          (err) => (this.loading = false)
        );
      }
    }
  }
}
