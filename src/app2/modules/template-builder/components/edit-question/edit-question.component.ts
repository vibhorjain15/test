import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Select, Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { NEVER } from 'rxjs';
import { catchError, take } from 'rxjs/operators';
import { TemplateService } from 'src/app2/apis/template/template.service';
import { QuestionType } from 'src/app2/apis/template/types/question.type';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { RouterService } from 'src/app2/services/router.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { DvTextLimits, Regex } from 'src/app2/shared/constants/constant';
import { noWhitespaceValidator } from 'src/app2/shared/validators/no-white-space.validator';
import { UserState } from 'src/app2/store/user/user.state';
import {
  responseType,
  responseTypeList,
} from '../../constants/responseType.constant';
import { getPreviewType } from '../../side-panels/edit-question-panel/edit-question.util';
import {
  GetTemplateInfo,
  ToggleTemplateState,
  UpdateActivePanelId,
  UpdateQuestion,
} from '../../store/template-builder.action';
import { handelConflict } from '../../store/template-builder.util';
import { getFilteredResponseType } from '../../util/edit-question.util';
import { ActivatedRoute } from '@angular/router';
import { CacheUtil } from 'src/app2/modules/questionnaire/service/cache.service';

@Component({
  selector: 'edit-question',
  templateUrl: './edit-question.component.html',
  styleUrls: ['./edit-question.component.css'],
})
export class EditQuestionComponent implements OnInit {
  @Input() question: QuestionType & { isSelected: false } & any;
  @Output() onSave = new EventEmitter();
  @Output() onSaveClick = new EventEmitter();
  @Output() onCancel = new EventEmitter();
  questionForm;
  isEdit = false;
  responseType: any = [];
  previewData: any = {
    responseType: null,
    rows: [],
    columns: [],
    options: [],
    dynamicElements: null,
    attachmentUploadEnabled: false,
    has_other_option: false,
    has_other_option_enabled: true,
    filename: null,
    attachmentHref: null,
    predefined_document_tags: [],
  };
  currentOptions;
  currentOptionsCopy;
  localOptions = [];
  has_other = [];
  loading = false;
  tinyMceInit = {
    placeholder: 'Examples or any guidelines on answering',
    height: '200',
  };
  currentResponse = null;
  DvTextLimits = DvTextLimits;
  hintClass = 'hintTextVaild';
  currentFirmInfo: any = {};
  Regex = Regex;
  optionsHaveNestedQuestionIds = [];
  hintTextLength = 0;
  localParams = null;
  @Select(UserState.getCurrentUserData) user;

  handle409Error = catchError((error) => {
    this.loading = false;
    handelConflict(
      error,
      this.localParams.templateId,
      this.sweetAlertService,
      this.routerService,
      this.modal,
      () => this.toaster.error(error.message.errorMessage)
    );
    return NEVER;
  });
  typeChanged: boolean;

  constructor(
    private store: Store,
    private templateService: TemplateService,
    private util: UtilsService,
    private toaster: ToastrService,
    private sweetAlertService: SweetAlertService,
    private routerService: RouterService,
    private modal: CustomModalService,
    private routerState: ActivatedRoute,
    private cache: CacheUtil
  ) {}

  ngOnInit(): void {
    this.localParams = this.routerService.getState(this.routerState).params;
    this.user.pipe(take(2)).subscribe((data) => {
      this.validateNumber = this.validateNumber.bind(this);
      this.questionForm = new FormGroup({
        questionTitle: new FormControl(null, [
          Validators.required,
          noWhitespaceValidator,
        ]),
        responseType: new FormControl(null),
        isMandatory: new FormControl(null),
        hintText: new FormControl(null, [this.validateTextLength]),
        wordCount: new FormControl(null, [this.validateNumber]),
      });
      this.currentFirmInfo = JSON.parse(JSON.stringify(data.firmInfo));
      this.checkInitalValuesBeforeEdit();
    });
  }

  validateNumber(control: AbstractControl) {
    if (
      control.value &&
      (!this.util.isNumeric(control.value) ||
        control.value <= 0 ||
        control.value > DvTextLimits.HELP_TEXT_LIMIT ||
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

  checkInitalValuesBeforeEdit() {
    if (this.question) {
      this.isEdit = true;
      if (this.question.has_response) {
        this.responseType = getFilteredResponseType(this.question.responseType);
      } else {
        this.responseType = responseTypeList;
      }
      if (this.question.responseType === responseType.Attachment) {
        let data = this.question.text.split('<separator> ');
        this.question.text = data[0];
        this.question.label = data[0];
        this.question.htmlData = data[1];
        this.previewData.responseType = 'Attachment';
        this.questionForm?.patchValue({
          responseType: this.responseType[0],
        });
        if (this.question.htmlData) {
          this.previewData.attachmentUploadEnabled = true;
          let targetUrl = this.question.htmlData;
          const regex = Regex.extractUrl;
          let downloadData = targetUrl.match(regex)[0];
          let href = downloadData.substring(0, downloadData.length - 1);
          targetUrl = href.split('api/')[1];
          this.question.attachmentHref = JSON.parse(JSON.stringify(href));

          let filename = this.util.getQueryParams('file_name', href);
          let decodedFileName = decodeURIComponent(
            (filename + '').replace(/\+/g, '%20')
          );
          this.question.filename = decodedFileName;
          this.previewData.filename = decodedFileName;
          this.previewData.attachmentHref = this.question.attachmentHref;
        }
        this.setPresetTags();
      }
      if (this.question.responseType === responseType.Dropdown) {
        this.templateService
          .getNestedQuestions(
            this.question.id,
            this.store.selectSnapshot((state) => state.template.templateId)
          )
          .subscribe((res) => {
            this.optionsHaveNestedQuestionIds = res['included'].map((x) =>
              Number(x.attributes.value)
            );
          });
      }
      this.questionForm?.patchValue({
        questionTitle: this.question.text,
        isMandatory: this.question.is_mandatory,
        hintText: this.question.hint_text,
        wordCount:
          this.question?.response_word_limit ??
          this.currentFirmInfo?.preferences?.default_response_word_limit ??
          null,
      });
    }

    if (this.question.responseType !== responseType.Attachment) {
      if (this.question.responseType === responseType.Bookends) {
        this.previewData.responseType = responseType.Bookends;
        this.handleChange(this.responseType[0]);
      }
      this.handleChange(
        responseTypeList.filter(
          (val) => val.text == this.question.responseType
        )[0]
      );
      if (
        this.question.responseType === responseType.Dropdown ||
        this.question.responseType === responseType.CheckBox
      )
        this.getQuestionOptions();
      if (
        this.question.responseType === responseType.Grid ||
        this.question.responseType === responseType.DynamicGrid
      )
        this.getQuestionGrid();
    }
  }

  async setPresetTags() {
    const data = await this.templateService
      .getPresetTags(this.localParams.templateId, this.question.group_id)
      .toPromise();
    this.previewData.existing_predefined_document_tags = data;
  }

  getQuestionOptions() {
    this.templateService
      .getQuestionsOptions(this.question.id)
      .subscribe((res: any) => {
        this.previewData = {
          ...this.previewData,
          responseType: this.question.responseType,
          ...getPreviewType(res, responseType.Dropdown),
        };
        this.localOptions = JSON.parse(
          JSON.stringify(this.previewData.options)
        );
        this.has_other = this.localOptions.filter(
          (val) => val.text === 'Other'
        );
        this.previewData.has_other_option = !!this.has_other.length;
        this.previewData = JSON.parse(JSON.stringify(this.previewData));
        this.currentOptions = this.previewData.options;
      });
  }

  getQuestionGrid() {
    this.templateService
      .getQuestionsGrid(this.question.grid_id, this.question.grid_version)
      .subscribe((res) => {
        this.currentResponse = res;
        this.previewData = {
          ...this.previewData,
          responseType: this.question.responseType,
          ...getPreviewType(res, this.question.responseType),
        };
        this.currentOptions = this.previewData;
        this.currentOptionsCopy = JSON.parse(JSON.stringify(this.previewData));
      });
  }

  saveResponseTypeGrid() {
    const {
      responseType: type,
      questionTitle,
      isMandatory,
      hintText,
      wordCount,
    } = this.questionForm.value;
    let rows_columns = [];

    if (responseType.Grid === type.text) {
      this.previewData.rows.map((value, index) => {
        rows_columns.push({
          id: value.id,
          elementType: 'Row',
          name: value.text,
          order: index + 1,
          group_id: value.group_id,
        });
      });
      this.previewData.columns.map((value, index) => {
        rows_columns.push({
          id: value.id,
          name: value.text,
          elementType: 'Column',
          order: index + 1,
          type: value.type,
          type_options: value.type_options,
          group_id: value.group_id,
        });
      });
    }
    if (responseType.DynamicGrid === type.text) {
      this.previewData.columns.map((value, index) => {
        rows_columns.push({
          id: value.id,
          name: value.text,
          elementType: 'Column',
          order: index + 1,
          type: value.type,
          type_options: value.type_options,
          group_id: value.group_id,
        });
      });
    }
    let gridParams = {};

    let params = {
      is_mandatory: isMandatory,
      response_word_limit: wordCount,
      hint_text: hintText,
      responseType: type.id,
      text: questionTitle,
      grid_id: this.question?.grid_id,
      grid_version: this.question?.grid_version,
      sectionID: this.question.sectionID,
      has_responses: false,
    };
    let isDynamic = responseType.DynamicGrid === type.text;
    if (this.currentResponse) {
      gridParams = {
        template_id: this.routerService.getState().params.templateId,
        dataType: this.currentResponse.dataType,
        dynamic_element: isDynamic ? 'Row' : null,
        formulas_json: this.currentResponse.formulas_json,
        aggregation_json: this.currentResponse.aggregation_json,
        id: this.question?.grid_id ?? 0,
        version: this.question?.grid_version ?? 0,
        question_id: this.question.id,
        rows_columns,
      };
    } else {
      gridParams = {
        template_id: this.routerService.getState().params.templateId,
        dataType: 'Integer',
        dynamic_element: isDynamic ? 'Row' : null,
        formulas_json: null,
        aggregation_json: null,
        id: this.question?.grid_id ?? 0,
        version: this.question?.grid_version ?? 0,
        question_id: this.question.id,
        rows_columns,
      };
    }
    this.templateService
      .createQuestionsGrid(gridParams)

      .pipe(this.handle409Error)
      .subscribe((res: any) => {
        // Update grid structure in the cache if available
        let accessId = `${this.question.sequenceID}-${this.question.sectionID}-${this.question.id}`;
        this.cache.GRIDCACHE[accessId] = res;
        params.grid_id = res.id;
        params.grid_version = res.version;
        params.has_responses = res.has_responses;
        this.handleGridRespsonseType(params);
      });
  }

  handleGridRespsonseType(params) {
    let apiCall = this.question.parentID
      ? this.templateService.updateQuestions(this.question.id, params)
      : this.store.dispatch(new UpdateQuestion(this.question.id, params));
    apiCall.pipe(this.handle409Error).subscribe((_: any) => {
      if (params.has_responses)
        this.toaster.info(
          "Kindly review and validate responses in questionnaires containing this grid, particularly those with a 'started' status.",
          'Action Required: Validate Responses'
        );
      this.handleSuccess(!!this.question.parentID);
    });
  }

  saveResponseTypeDropDown() {
    const { responseType, questionTitle, isMandatory, hintText, wordCount } =
      this.questionForm.value;
    let localOptions = JSON.parse(JSON.stringify(this.previewData.options));
    if (this.previewData.has_other_option) {
      !!this.has_other.length
        ? localOptions.push(this.has_other[0])
        : localOptions.push({
            id: 0,
            is_active: true,
            text: 'Other',
            type: 'text',
            type_options: { type: 'text' },
          });
    }
    let dropdownParams = {
      template_id: this.localParams.templateId,
      name: questionTitle,
      id: this.question.dropdown_id ?? 0,
      question_id: this.question.id,
      version: this.question.dropdown_version ?? 0,
      options: localOptions.map((option) => {
        return {
          dropdown_option_id: option.id,
          is_active: option.is_active,
          dropdown_option_text: option.text,
          dropdown_value_groupid: option.groupid,
          order: option.order,
        };
      }),
    };
    let ids = localOptions.map((val) => val.id);
    this.localOptions?.map((val) => {
      if (!ids.includes(val.id)) {
        dropdownParams.options.push({
          dropdown_option_id: val.id,
          is_active: false,
          dropdown_option_text: val.text,
          dropdown_value_groupid: val.groupid,
          order: val.order,
        });
      }
    });

    this.templateService
      .createQuestionsDropdown(dropdownParams)
      .pipe(this.handle409Error)
      .subscribe((res: any) => {
        let params: any = {
          is_mandatory: isMandatory,
          hint_text: hintText,
          responseType: responseType.id,
          response_word_limit: wordCount,
          text: questionTitle,
          dropdown_id: res.id,
          dropdown_version: res.version,
          sectionID: this.question.sectionID,
        };
        let apiCall = this.question.parentID
          ? this.templateService.updateQuestions(this.question.id, params)
          : this.store.dispatch(new UpdateQuestion(this.question.id, params));
        apiCall
          .pipe(this.handle409Error)
          .subscribe((_: any) => this.handleSuccess(!!this.question.parentID));
      });
  }

  saveCommonResponseType() {
    const {
      responseType: type,
      questionTitle,
      isMandatory,
      hintText,
      wordCount,
    } = this.questionForm.value;
    let params: any = {
      is_mandatory: isMandatory,
      hint_text: hintText,
      responseType: type.id,
      response_word_limit: wordCount,
      text: questionTitle,
      grid_id: this.question.grid_id,
      sectionID: this.question.sectionID,
    };
    if (
      this.previewData.attachmentUploadEnabled &&
      !this.previewData.filename
    ) {
      this.loading = false;
      return;
    }
    if (
      type.text === responseType.Attachment &&
      this.previewData.attachmentUploadEnabled
    ) {
      params.text = `${questionTitle}`;
      params.source_document_details = `<separator> <a id="attachmentUrl" data-ng-click="vm.downloadAttachment('${this.previewData.attachmentHref}')" (click)="downloadAttachment('${this.previewData.attachmentHref}')">Download Source File</a>`;
    }
    if (type.text === responseType.Attachment) {
      params.predefined_document_tag_ids =
        this.previewData?.predefined_document_tags?.map((x) => x.id) ?? [];
    }
    let apiCall = this.question.parentID
      ? this.templateService.updateQuestions(this.question.id, params)
      : this.store.dispatch(new UpdateQuestion(this.question.id, params));
    apiCall
      .pipe(this.handle409Error)
      .subscribe((_: any) => this.handleSuccess(!!this.question.parentID));
  }

  handleSuccess(toggle = false) {
    this.loading = false;
    this.store.dispatch(new UpdateActivePanelId(''));
    this.toaster.success('Question saved successfully');
    this.onSave.emit();
    this.store.dispatch(new GetTemplateInfo());
    toggle && this.store.dispatch(new ToggleTemplateState());
  }

  confirmOptionSaveChange() {
    let count = 0;
    let columns = this.currentResponse?.rows_columns?.filter((x) => {
      return x.elementType == 'Column';
    });
    this.previewData?.columns?.forEach((x) => {
      columns?.forEach((y) => {
        if (x.id == y.id) {
          if (x.type !== y.type) {
            count++;
          }
        }
      });
    });

    if (count == 0) {
      this.typeChanged = false;
    } else {
      this.typeChanged = true;
    }
    let rows_columns =
      this.previewData.columns.length + this.previewData.rows.length;
    if (
      (this.currentResponse?.formulas_json ||
        this.currentResponse?.aggregation_json) &&
      (rows_columns !== this.currentResponse.rows_columns.length ||
        this.typeChanged)
    ) {
      this.sweetAlertService
        .confirm({
          title: 'Are you sure you want to modify the grid?',
          text: 'This action will delete the formulas added for this grid.',
          focusCancel: true,
        })
        .then(({ isConfirmed }) => {
          if (isConfirmed) {
            this.currentResponse.formulas_json = null;
            this.currentResponse.aggregation_json = null;
            this.handle();
          }
        });
    } else {
      this.handle();
    }
  }

  handle() {
    const { responseType: type } = this.questionForm.value;
    const nestedQuestionOptions = this.previewData.options
      .filter((x) => x.id !== 0)
      .map((x) => x.id);
    const isNestedQuestionOptionRemoved =
      this.optionsHaveNestedQuestionIds.filter((ogOption) =>
        nestedQuestionOptions.includes(ogOption)
      ).length !== this.optionsHaveNestedQuestionIds.length;
    this.onSaveClick.emit();
    if (
      type.text !== this.question.responseType &&
      type.text !== responseType.Text &&
      this.question.nestingRuleIds.length
    ) {
      this.showNestedQuestionAlert();
    } else if (
      type.text === responseType.Dropdown &&
      this.question.nestingRuleIds.length &&
      isNestedQuestionOptionRemoved
    ) {
      this.showNestedQuestionAlert(true);
    } else this.handleSaveClick();
  }

  showNestedQuestionAlert(isOptionsChanged = false) {
    this.sweetAlertService
      .confirm({
        title: 'Are you sure you want to continue?',
        text: isOptionsChanged
          ? 'Some of your nested questions will be removed.'
          : 'All your nested questions will be removed.',
        focusCancel: true,
      })
      .then(({ isConfirmed }) => {
        if (isConfirmed) this.handleSaveClick();
      });
  }

  handleSaveClick() {
    if (this.questionForm.valid) {
      const { responseType: type } = this.questionForm.value;
      if (
        type.text === responseType.Grid ||
        type.text === responseType.DynamicGrid
      ) {
        const isColumnsValid = this.previewData.columns.every(
          this.util.validText
        );

        if (this.previewData.responseType == responseType.Grid) {
          const isRowsValid = this.previewData.rows.every(this.util.validText);
          if (!isRowsValid) return;
        }
        if (!isColumnsValid) return;
        this.loading = true;
        this.saveResponseTypeGrid();
      }
      const isOptionsValid = this.previewData.options.every(
        this.util.validText
      );
      if (
        (this.previewData.responseType == responseType.Dropdown ||
          this.previewData.responseType == responseType.CheckBox) &&
        !isOptionsValid
      )
        return;

      this.loading = true;
      if (
        type.text === responseType.Dropdown ||
        type.text === responseType.CheckBox
      ) {
        this.saveResponseTypeDropDown();
      }

      if (
        type.text === responseType.TextEmail ||
        type.text === responseType.Numeric ||
        type.text === responseType.Integer ||
        type.text === responseType.Percentage ||
        type.text === responseType.TextPhone ||
        type.text === responseType.Text ||
        type.text === responseType.TextMultiLine ||
        type.text === responseType.Bookends ||
        type.text === responseType.ReturnTable ||
        type.text === responseType.aumTable ||
        type.text === responseType.Date ||
        type.text === responseType.Boolean ||
        type.text === responseType.BooleanPlus ||
        type.text === responseType.NoPlus ||
        type.text === responseType.Attachment ||
        type.text === responseType.Identifier
      ) {
        this.saveCommonResponseType();
      }
    }
  }

  handleOnCancelClick() {
    this.store.dispatch(new UpdateActivePanelId(''));
    this.onCancel.emit(this.questionForm.touched);
  }

  handleMarkChange(event) {
    this.questionForm.patchValue({
      isMandatory: event,
    });
  }

  handleChange(event) {
    this.questionForm?.patchValue({
      responseType: event,
    });
    if (
      (event.text === responseType.Dropdown ||
        event.text === responseType.CheckBox) &&
      (this.question.responseType === responseType.Dropdown ||
        this.question.responseType === responseType.CheckBox)
    ) {
      if (!this.currentOptions) return;
      this.previewData = {
        ...this.previewData,
        responseType: event.text,
        dynamicElements: null,
        attachmentUploadEnabled: false,
        options: this.currentOptions,
      };
    } else if (
      event.text === this.question.responseType &&
      this.question.responseType === responseType.Grid
    ) {
      if (!this.currentOptions) return;
      this.previewData = {
        ...this.previewData,
        responseType: event.text,
        dynamicElements: null,
        attachmentUploadEnabled: false,
        has_other_option: false,
        rows: this.currentOptions.row,
        columns: this.currentOptions.columns,
      };
    } else if (
      event.text === this.question.responseType &&
      this.question.responseType === responseType.Attachment
    ) {
      this.previewData = {
        rows: [],
        columns: [],
        options: [],
        responseType: event.text,
        dynamicElements: null,
        attachmentUploadEnabled: this.question?.htmlData ? true : false,
        has_other_option: false,
        filename: this.question?.htmlData ? this.question.fileName : null,
      };
    } else
      this.previewData = {
        rows: [],
        columns: [],
        options: [],
        responseType: event.text,
        dynamicElements: null,
        attachmentUploadEnabled: false,
        has_other_option: false,
        filename: null,
        has_other_option_enabled: true,
      };
  }

  handleEditorChange(data) {
    this.questionForm.get('hintText').markAsTouched({ onlySelf: true });
    this.questionForm.patchValue({
      hintText: data,
    });
    this.hintTextLength = this.questionForm.value.hintText.replace(
      /&nbsp;/g,
      ' '
    ).length;

    if (this.hintTextLength > DvTextLimits.HELP_TEXT_LIMIT)
      this.hintClass = 'hintTextInVaild';
    else this.hintClass = 'hintTextVaild';
  }

  showEditQuestionFAQ() {
    this.modal.invoke('edit-question-faq');
  }
}
