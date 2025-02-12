import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { validateAllFormFields } from 'src/app2/utils/validateAllFormFields';
import {
  DvTextLimits,
  operatorList,
  Regex,
} from 'src/app2/shared/constants/constant';
import {
  responseType,
  responseTypeList,
} from '../../constants/responseType.constant';
import { TemplateService } from 'src/app2/apis/template/template.service';
import { Store } from '@ngxs/store';
import { UtilsService } from 'src/app2/services/utils.service';
import {
  noWhitespaceValidator,
} from 'src/app2/shared/validators/no-white-space.validator';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'add-question',
  templateUrl: './add-question.component.html',
  styleUrls: ['./add-question.component.css'],
})
export class AddQuestionComponent implements OnInit, OnChanges {
  @Input() isSingle = false;
  @Input() editQuestion;
  @Input() nestedQuestion;
  @Output() onAdd = new EventEmitter();
  @Output() onSelectionChange = new EventEmitter();
  @Output() onSaveClick = new EventEmitter();
  questionForm: FormGroup;
  previewData;
  responseType = responseTypeList;
  bulkQuestions = [];
  tinyMceInit = {
    placeholder: 'Examples or any guildlines on answering',
  };
  parentQuestionResponseType;
  conditionList: any[] = [];
  valuesList: any[] = [];
  DvTextLimits = DvTextLimits;
  Regex = Regex;
  hintClass = 'hintTextVaild';
  isBulkQuestionsTouched = false;
  conditionDateValue: any;
  validationMessage = '';
  hintTextLength: any;
  isValidQuestions = true;
  constructor(
    private template: TemplateService,
    private store: Store,
    private util: UtilsService,
    private datePipe: DatePipe
  ) {}
  ngOnInit(): void {
    this.validateNumber = this.validateNumber.bind(this);
    if (this.nestedQuestion) {
      this.parentQuestionResponseType = this.nestedQuestion.attributes
        ? this.nestedQuestion.attributes.responseType
        : this.nestedQuestion.responseType;
      this.prepareDynamicUI();
    }
    this.setDefaultOptions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes?.isSingle &&
      changes.isSingle.currentValue !== changes.isSingle.previousValue
    ) {
      this.bulkQuestions = [];
    }
    if (
      changes?.editQuestion &&
      changes.editQuestion.currentValue &&
      changes.editQuestion.currentValue !== changes.editQuestion.previousValue
    ) {
      this.setDefaultOptions();
      this.editQuestion = JSON.parse(JSON.stringify(this.editQuestion));
      let data =
        this.editQuestion.type == 'Attachment'
          ? this.editQuestion.label.split(' <separator> ')
          : '';
      this.questionForm.patchValue({
        condition: this.editQuestion.condition,
        conditionalValue:
          this.parentQuestionResponseType === 'Date'
            ? new Date(this.editQuestion.conditionalValue)
            : this.editQuestion.conditionalValue,
        questionTitle:
          this.editQuestion.type == 'Attachment'
            ? data[0]
            : this.editQuestion.label,
        responseType: responseTypeList.filter(
          (val) => val.text == responseType[this.editQuestion.type]
        )[0],
        isMandatory: this.editQuestion.isMandatory,
        hintText: this.editQuestion.hintText,
        wordCount: this.editQuestion.wordCount,
        isHintText:
          !!this.editQuestion.hintText || !!this.editQuestion.wordCount,
      });
      this.previewData = this.editQuestion.previewOptions;
      if (this.previewData.predefined_document_tags?.length) {
        // copy values to existing data variable to show on the left editable panel from the right preview panel
        this.previewData.existing_predefined_document_tags =
          this.previewData.predefined_document_tags;
      }
    }
  }

  handleHintText() {
    this.questionForm.patchValue({
      isHintText: !this.questionForm.value.isHintText,
    });
  }

  setDefaultOptions() {
    this.previewData = {
      responseType: null,
      rows: [],
      columns: [],
      options: [],
      dynamicElements: null,
      attachmentUploadEnabled: false,
      has_other_option: false,
      filename: null,
      has_other_option_enabled: true,
    };
    this.isBulkQuestionsTouched = false;
    this.bulkQuestions = [];
    let count = this.store.selectSnapshot(
      (state) => state.user.firmPreference.default_response_word_limit
    );
    this.questionForm = new FormGroup({
      condition: new FormControl(
        null,
        !!this.nestedQuestion ? [Validators.required] : null
      ),
      conditionalValue: new FormControl(null),
      questionTitle: new FormControl(null, [
        Validators.required,
        noWhitespaceValidator,
      ]),
      responseType: new FormControl(
        responseTypeList.filter(
          (val) => val.text == responseType.TextMultiLine
        )[0]
      ),
      isMandatory: new FormControl(false),
      hintText: new FormControl(null, [this.validateTextLength]),
      wordCount: new FormControl(count ?? null, [this.validateNumber]),
      isHintText: new FormControl(false),
    });
    this.previewData = {
      ...this.previewData,
      responseType: responseType.TextMultiLine,
    };
    this.isBulkQuestionsTouched = false;
  }

  validateNumber(control: AbstractControl) {
    if (
      control.value &&
      (!this.util.isNumeric(control.value) ||
        control.value <= 0 ||
        control.value > this.DvTextLimits.HELP_TEXT_LIMIT ||
        !`${control.value}`.match(this.Regex.noDecimal))
    ) {
      return { invalidNumber: true };
    }
    return null;
  }
  validateTextLength(control: AbstractControl) {
    if (control.value && control.value.length > DvTextLimits.HELP_TEXT_LIMIT) {
      return { lengthError: true };
    }
    return null;
  }

  prepareDynamicUI() {
    this.conditionList = [
      {
        id: 1464,
        value: 'eq',
        display_symbol: '=',
        display_label: 'Equal To',
      },
      {
        id: 1465,
        value: 'noteq',
        display_symbol: '≠',
        display_label: 'Not Equal To',
      },
    ];
    if (
      ['Numeric', 'Integer', 'Percentage', 'TextPhone'].includes(
        this.parentQuestionResponseType
      )
    ) {
      this.conditionList = operatorList;
    }
    if (this.parentQuestionResponseType == 'Dropdown') {
      this.template
        .getQuestionsOptions(this.nestedQuestion.id)
        .subscribe((res: any) => {
          this.valuesList = res.map((option) => {
            return {
              id: option.dropdown_option_id,
              value: option.dropdown_option_text,
            };
          });
        });
    } else
      this.valuesList = [
        { value: 'Yes', id: 'true' },
        { value: 'No', id: 'false' },
      ];
  }

  onDateChange(event) {
    this.conditionDateValue = this.datePipe.transform(event);
    this.questionForm.patchValue({
      conditionalValue: event,
    });
  }

  handleChange(data) {
    this.questionForm.patchValue({
      responseType: data,
    });
    this.previewData = { ...this.previewData, responseType: data.text };
  }

  handleConditionChange(data) {
    this.questionForm.patchValue({
      condition: data,
    });
    this.previewData = { ...this.previewData, conditon: data.display_label };
  }

  handleConditionalValueChange(data) {
    this.questionForm.patchValue({
      conditionalValue: data,
    });
  }

  handleAddClick() {
    this.onSaveClick.emit();
    if (!this.isValidQuestions) return;
    let {
      condition,
      conditionalValue: value,
      questionTitle,
      responseType: type,
      isMandatory,
      hintText,
      wordCount,
    } = this.questionForm.value;
    if (this.conditionDateValue) value = this.conditionDateValue;

    if (
      this.previewData.responseType == responseType.Grid ||
      this.previewData.responseType == responseType.DynamicGrid
    ) {
      let isColumnsValid = this.previewData.columns.every(this.util.validText);

      if (this.previewData.responseType == responseType.Grid) {
        let isRowsValid = this.previewData.rows.every(this.util.validText);
        if (!isRowsValid) return;
      }

      if (!isColumnsValid) return;
    }

    let isOptionsValid = this.previewData.options.every(this.util.validText);
    if (
      (this.previewData.responseType == responseType.Dropdown ||
        this.previewData.responseType == responseType.CheckBox) &&
      !isOptionsValid
    )
      return;

    if (
      this.previewData.attachmentUploadEnabled &&
      !this.previewData.filename
    ) {
      return;
    }

    this.isBulkQuestionsTouched = true;
    this.bulkQuestions = this.bulkQuestions.filter((x) => x.text?.trim());

    if (this.isSingle) {
      validateAllFormFields(this.questionForm);
      if (this.questionForm.valid) {
        this.addOtherOption();
        let question: any = {
          id: generateRandomKey(),
          condition,
          conditionalValue: value,
          text: questionTitle,
          label:
            type.text !== responseType.Attachment && this.previewData.filename
              ? questionTitle
              : this.previewData.filename
              ? `${questionTitle} <separator> <a  id="attachmentUrl"  data-ng-click="vm.downloadAttachment('${this.previewData.attachmentHref}')" (click)="downloadAttachment('${this.previewData.attachmentHref}')">Download Source File</a>`
              : questionTitle,
          type: type.text,
          typeID: type.id,
          isMandatory,
          hintText,
          wordCount,
          previewOptions: JSON.parse(JSON.stringify(this.previewData)),
        };
        if (
          type.text === responseType.Attachment &&
          this.previewData.filename
        ) {
          question.source_document_details = `<separator> <a id="attachmentUrl" data-ng-click="vm.downloadAttachment('${this.previewData.attachmentHref}')"  (click)="downloadAttachment('${this.previewData.attachmentHref}')">Download Source File</a>`;
        }
        this.onAdd.emit([question]);
        this.setDefaultOptions();
        this.editQuestion = null;
      }
    } else {
      let questionList = [];
      if (this.bulkQuestions.length) {
        this.addOtherOption();
        this.bulkQuestions.map((question) => {
          const existingQuestion: any = {
            id: generateRandomKey(),
            label:
              type.text !== responseType.Attachment && this.previewData.filename
                ? question.text
                : this.previewData.filename
                ? `${question.text} <separator> <a  id="attachmentUrl"  data-ng-click="vm.downloadAttachment('${this.previewData.attachmentHref}')" (click)="downloadAttachment('${this.previewData.attachmentHref}')">Download Source File</a>`
                : question.text,
            text: question.text,
            type: type.text,
            typeID: type.id,
            previewOptions: JSON.parse(JSON.stringify(this.previewData)),
            isMandatory,
            hintText,
            wordCount,
          };
          if (
            type.text === responseType.Attachment &&
            this.previewData.filename
          ) {
            existingQuestion.source_document_details = `<separator> <a  id="attachmentUrl"  data-ng-click="vm.downloadAttachment('${this.previewData.attachmentHref}')" (click)="downloadAttachment('${this.previewData.attachmentHref}')">Download Source File</a>`;
            existingQuestion.text = question.text;
          }

          questionList.push(existingQuestion);
        });
        this.onAdd.emit(questionList);
        this.setDefaultOptions();
      }
    }
  }

  handleCancel() {
    this.setDefaultOptions();
    this.editQuestion = null;
  }

  handleMarkChange(event) {
    this.questionForm.patchValue({
      isMandatory: event,
    });
  }

  addOtherOption() {
    if (this.previewData.has_other_option) {
      this.previewData.options.push({
        text: 'Other',
        type: 'text',
        type_options: { type: 'text' },
        id: 0,
        is_active: true,
      });
    }
  }

  handleEditorChange(data) {
    this.questionForm.get('hintText').markAsTouched({ onlySelf: true });
    this.questionForm.patchValue({
      hintText: data,
    });
    this.hintTextLength =
      this.questionForm.value.hintText?.replace(/&nbsp;/g, ' ').length ?? 0;
    if (this.hintTextLength > DvTextLimits.HELP_TEXT_LIMIT)
      this.hintClass = 'hintTextInVaild';
    else this.hintClass = 'hintTextVaild';
  }

  handleSelectionChange() {
    this.onSelectionChange.emit(!this.isSingle);
  }
}

const generateRandomKey = () => Math.floor(Math.random() * 100000);
