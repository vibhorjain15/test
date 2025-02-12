import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';

import {
  fieldPreviewtype,
  optionsTypes,
} from '../field-preview/field-preview.type';
import { bufferCount } from 'rxjs/operators';
import { from } from 'rxjs';
import { Regex } from '../../constants/constant';

@Component({
  selector: 'dv-option-selector-new',
  templateUrl: './dv-option-selector.component.html',
})
export class DvOptionSelectorComponent implements OnInit, OnDestroy, OnChanges {
  @Input() editable: boolean;
  @Input() question: fieldPreviewtype;
  @Input() allowOtherOption: boolean;
  @Input() fieldName: string;
  @Input() column_options?: boolean = false;
  @Input() option_label?: string = 'Option';
  @Input() placeHolderText = 'Add multiple options here';
  options: optionsTypes[] = [];
  hasOtherOption: boolean;

  newOptions = [];
  sortableOptions: any;
  checkBoxForm: FormGroup;

  constructor(private customModal: CustomModalService) {}

  ngOnInit() {
    if (this.fieldName === 'Grid' || this.fieldName === 'DynamicGrid') {
      if (this.option_label === 'Row') this.options = this.question.rows;
      else this.options = this.question.columns;
    } else {
      this.options = this.question.options;
    }
    this.checkBoxForm = new FormGroup({
      useBulkListBuilder: new FormControl(false),
    });

    this.previewOptions();
    this.sortableOptions = {
      axis: 'y',
      handle: '.sort-handle',
      cursor: 'move',
      placeholder: 'sortable-placeholder',
    };
    this.initOptions();
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes?.question &&
      changes.question.currentValue !== changes.question.previousValue
    ) {
      this.ngOnInit();
    }
  }

  previewOptions() {
    this.checkBoxForm.patchValue({
      useBulkListBuilder: false,
    });
    this.newOptions.map((option) => {
      const type_options = { type: 'text' };
      this.options.push({
        text: option.text,
        type: 'text',
        type_options: type_options,
        id: 0,
        is_active: true,
        containsHtmlTags: Regex.containsHtmlTags.test(option.text),
      });
    });
    this.newOptions = [];
  }

  initOptions() {
    const other_option = this.options.find(
      (option) => option.text.toLowerCase() === 'other'
    );
    if (other_option) {
      this.hasOtherOption = true;
      this.options.splice(this.options.indexOf(other_option), 1);
    }
    if (this.options.length === 0) {
      this.addOption();
    }
  }

  handleInputChange(event, index) {
    const text = event.target.value?.trim();
    this.options[index].text = text;
    this.options[index].containsHtmlTags = Regex.containsHtmlTags.test(text);
  }

  addOption() {
    const typeOptions = { type: 'text' };
    this.options.push({
      text: `${this.option_label} ${this.options.length + 1}`,
      type: 'text',
      type_options: typeOptions,
      valid: true,
      id: 0,
      is_active: true,
    });
  }

  addColumnOptions(index) {
    this.customModal.invoke('configure-grid-columns', {
      initialState: {
        type_options: JSON.parse(
          JSON.stringify(this.options[index].type_options)
        ),
        question: JSON.parse(JSON.stringify(this.question)),
        success: (response) => {
          this.options[index].type = response.type;
          this.options[index].type_options = response;
          if (this.fieldName === 'Grid' || this.fieldName === 'DynamicGrid') {
            if (this.option_label === 'Row')
              this.question.rows[index] = this.options[index];
            else this.question.columns[index] = this.options[index];
          } else {
            this.question.options[index] = this.options[index];
          }
        },
      },
      class: 'modal-md',
    });
  }

  removeOption(index) {
    this.options.splice(index, 1);
  }

  handleAddOthersClick() {
    this.hasOtherOption = true;
    this.question.has_other_option = true;
  }

  handleRemoveAddClick() {
    this.hasOtherOption = false;
    this.question.has_other_option = false;
  }

  ngOnDestroy() {
    this.options.splice(0, this.options.length);
  }

  handleUpdateList(list) {
    this.options = list;
    if (this.fieldName === 'Grid' || this.fieldName === 'DynamicGrid') {
      if (this.option_label === 'Row') this.question.rows = this.options;
      else this.question.columns = this.options;
    } else {
      this.question.options = this.options;
    }
  }

  handleValChange(val) {
    if (val) this.newOptions = [];
  }
}
