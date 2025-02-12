import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { validateAllFormFields } from 'src/app2/modules/firm-settings/tags-modal/tags-modal.util';
import { fieldPreviewtype } from '../../../../shared/components/field-preview/field-preview.type';
import { ColumnTypes } from './configure-grid-columns.constant';

@Component({
  selector: 'configure-grid-columns',
  templateUrl: './configure-grid-columns.component.html',
  styleUrls: ['./configure-grid-columns.component.css'],
})
export class ConfigureGridColumnsComponent implements OnInit {
  @Input() type_options;
  @Input() question: fieldPreviewtype;
  @Input() success;
  selectOptions = [];
  editable = true;
  newOptions = [];
  enable_multiselection = false;
  loading = false;
  gridColumnConfigForm: FormGroup;
  ColumnTypes = ColumnTypes;
  type;
  previewData = {
    responseType: null,
    rows: [],
    columns: [],
    options: [],
    dynamicElements: null,
    attachmentUploadEnabled: false,
    has_other_option: false,
    filename: null,
  };
  supportedFormats = [
    { label: 'MM-DD-YYYY', value: 'MM-DD-YYYY' },
    { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
    { label: 'DD-MM-YYYY', value: 'DD-MM-YYYY' },
  ];
  type_options_copy: any;
  constructor() {}
  ngOnInit(): void {
    this.type_options_copy = JSON.parse(JSON.stringify(this.type_options));
    this.type = this.question.responseType;
    if (this.type_options.enable_multiselection) {
      this.enable_multiselection = true;
    }
    if (this.type_options.source && this.type_options.source.length > 0) {
      this.type_options.source.forEach((option) => {
        this.selectOptions.push({
          type: 'dropdown',
          text: option,
          is_active: true,
          id: 0,
          type_options: { type: 'dropdown' },
        });
      });
    }
    this.previewData = {
      ...this.previewData,
      responseType: this.question.responseType,
      columns: this.selectOptions,
    };
    this.gridColumnConfigForm = new FormGroup({
      column_types: new FormControl(
        this.ColumnTypes.find(
          (column) => column.value == this.type_options.type
        )
      ),
      enable_multiselection: new FormControl(this.enable_multiselection),
      date_format: new FormControl(this.supportedFormats[0], [
        Validators.required,
      ]),
    });
    this.handleColumnTypeChange(
      ColumnTypes.find((val) => val.value == this.type_options.type)
    );
    if (this.type_options?.dateFormat) {
      this.gridColumnConfigForm.patchValue({
        date_format: this.supportedFormats.find(
          (column) => column.value == this.type_options.dateFormat
        ),
      });
    }
  }
  handleSave(close) {
    validateAllFormFields(this.gridColumnConfigForm);
    if (this.gridColumnConfigForm.valid) {
      if (this.type_options.type == 'dropdown') {
        this.type_options.source = [];
        this.previewData.columns.forEach((option) => {
          this.type_options.source.push(option.text);
        });
        this.type_options.enable_multiselection = !!this.enable_multiselection;
      }
      if (this.type_options.type == 'date')
        this.type_options.dateFormat =
          this.gridColumnConfigForm.value.date_format.value;
      this.success(this.type_options);
      close();
    }
  }

  handleColumnTypeChange(data) {
    this.gridColumnConfigForm.patchValue({
      column_types: data,
    });
    this.type_options.type = data.value;
    if (data.value == 'date') {
      this.gridColumnConfigForm.addControl(
        'date_format',
        new FormControl(null, Validators.required)
      );
      this.gridColumnConfigForm.get('date_format').updateValueAndValidity();
    } else {
      this.gridColumnConfigForm.removeControl('date_format');
      this.gridColumnConfigForm.updateValueAndValidity();
    }
  }

  handleMultiSelectionChange(data) {
    this.gridColumnConfigForm.patchValue({
      enable_multiselection: data,
    });
    this.enable_multiselection = data;
  }

  handleCancel(close) {
    this.type_options = JSON.parse(JSON.stringify(this.type_options_copy));
    this.success(this.type_options);
    close();
  }
}
