import { DatePipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';
import { TemplateService } from 'src/app2/apis/template/template.service';
import { validateAllFormFields } from 'src/app2/utils/validateAllFormFields';
import { RouterService } from 'src/app2/services/router.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { UtilsService } from 'src/app2/services/utils.service';
import {
  ERROR_CODES,
  operatorList,
} from 'src/app2/shared/constants/constant';
import {
  responseType,
  responseTypeList,
} from '../../constants/responseType.constant';
import { getPreviewType } from '../../side-panels/edit-question-panel/edit-question.util';
import {
  GetTemplateInfo,
  ToggleTemplateState,
  UpdateLocalQuestion,
} from '../../store/template-builder.action';

export enum questionCreation {
  new = 'new',
  existing = 'existing',
  null = '',
}

@Component({
  selector: 'paste-nested-question',
  templateUrl: './paste-nested-question.component.html',
  styleUrls: ['./paste-nested-question.component.css'],
})
export class PasteNestedQuestionComponent implements OnInit {
  @Input() sectionId;
  @Input() nestedQuestion;
  @Input() questionId;
  @Input() pastedQuestion;
  @Input() onAddingNested;

  gridQuestions = {};
  optionsQuestions = {};
  questionForm: FormGroup;
  questionList = [];
  dateRangeForDirectives;
  responseIDs;
  dataToSend: any;
  previewData: {
    responseType: any;
    rows: any[];
    columns: any[];
    options: any[];
    dynamic_element: any;
    attachmentUploadEnabled: boolean;
    has_other_option: boolean;
    filename: any;
  };
  conditionList: {
    id: number;
    value: string;
    display_symbol: string;
    display_label: string;
  }[];
  parentQuestionResponseType: any;
  valuesList: any[] = [];
  label: string;
  closeModalFunc: any;
  loading: boolean;
  constructor(
    private store: Store,
    private template: TemplateService,
    private toaster: ToastrService,
    private util: UtilsService,
    private SweetAlert: SweetAlertService,
    private routerService: RouterService,
    private datePipe: DatePipe
  ) {}
  ngOnInit(): void {
    if (this.nestedQuestion) {
      this.parentQuestionResponseType = this.nestedQuestion.attributes
        ? this.nestedQuestion.attributes.responseType
        : this.nestedQuestion.responseType;
      this.prepareDynamicUI();
    }
    this.setDefaultOptions();
    this.label = `Adding new nested/conditional question(s) under "${this.nestedQuestion.text}"`;
  }

  onDateChange(event, question, index) {
    this.questionForm.patchValue({
      [`conditionalValue_${index}`]: event,
    });
    question.data.attributes.displayValue = this.datePipe.transform(event);
  }

  handleConditionChange(data, question) {
    this.questionForm.patchValue({
      condition: data,
    });
    question.data.attributes.operatorID = data.id;
  }

  handleConditionalValueChange(data, question, index) {
    this.questionForm.patchValue({
      [`conditionalValue_${index}`]: data,
    });
    question.data.attributes.displayValue = data?.id ? data.id : data;
  }
  createFormControls() {
    let formOb = {};
    this.pastedQuestion.forEach((element, index) => {
      (formOb[`condition_${index}`] = new FormControl(null, [
        Validators.required,
      ])),
        (formOb[`conditionalValue_${index}`] = new FormControl(null, [
          Validators.required,
        ]));
    });
    return formOb;
  }

  setDefaultOptions() {
    this.questionForm = new FormGroup({
      ...this.createFormControls(),
    });
  }

  handleconditionalValueTextChange(event, question) {
    question.data.attributes.displayValue = event.target.value;
  }

  handleconditionalValueNumberChange(event, question) {
    question.data.attributes.displayValue = event.target.value;
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
        { value: 'Yes', id: true },
        { value: 'No', id: false },
      ];
  }

  SaveAll(close) {
    validateAllFormFields(this.questionForm);
    if (this.questionForm.valid) {
      this.dataToSend = [...this.pastedQuestion];
      this.loading = true;
      this.handlePastedQuestions(this.dataToSend);
    } else {
      this.toaster.error('All input fields are required');
    }
    this.closeModalFunc = close;
  }

  async handlePastedQuestions(newPastedQuestion, isNested = false) {
    newPastedQuestion.forEach((question) => {
      this.setInitalValuesBeforeSave(question);
    });

    if (
      Object.keys(this.gridQuestions).length ||
      Object.keys(this.optionsQuestions).length
    ) {
      if (Object.keys(this.optionsQuestions).length) {
        forkJoin(this.getQuestionOptions(this.optionsQuestions)).subscribe(
          async (res: any) => {
            Object.keys(this.optionsQuestions).map((id: any, i) => {
              let Index = newPastedQuestion.findIndex(
                (question) => question.id == id
              );
              if (Index < 0) return;
              this.previewData = {
                ...this.previewData,
                responseType: newPastedQuestion[Index].responseType,
                ...getPreviewType(
                  res[i],
                  newPastedQuestion[Index].responseType
                ),
              };
              newPastedQuestion[Index].previewOptions.options =
                this.previewData.options;
            });
            this.questionList = [...newPastedQuestion];
            if (isNested) {
              this.questionList.forEach((question) => {
                question.data.attributes.displayValue =
                  question.data.attributes.value;
              });
            }
            await this.handleSave();
          }
        );
      }
      if (Object.keys(this.gridQuestions).length) {
        let localGrid = JSON.parse(JSON.stringify(this.gridQuestions));
        forkJoin(this.getQuestionGrid(this.gridQuestions)).subscribe(
          async (res: any) => {
            Object.keys(localGrid).map((id: any, i) => {
              let Index = newPastedQuestion.findIndex(
                (question) => question.id == id
              );
              if (Index < 0) return;
              this.previewData = {
                ...this.previewData,
                responseType: newPastedQuestion[Index].responseType,
                ...getPreviewType(
                  res[i],
                  newPastedQuestion[Index].responseType
                ),
              };
              newPastedQuestion[Index].previewOptions.rows =
                this.previewData.rows;
              newPastedQuestion[Index].previewOptions.columns =
                this.previewData.columns;
            });
            this.questionList = [...newPastedQuestion];
            await this.handleSave();
          }
        );
      }
    } else {
      this.questionList = [...newPastedQuestion];
      if (isNested) {
        this.questionList.forEach((question) => {
          question.data.attributes.displayValue =
            question.data.attributes.value;
        });
      }
      this.handleSave();
    }
  }
  setInitalValuesBeforeSave(question) {
    this.previewData = {
      responseType: null,
      rows: [],
      columns: [],
      options: [],
      dynamic_element: null,
      attachmentUploadEnabled: false,
      has_other_option: false,
      filename: null,
    };
    if (question) {
      question.responseCount = question.attributes.response_count;
      question.type = question.attributes.responseType;
      question.responseType = question.attributes.responseType;
      question.isMandatory = question.attributes.is_mandatory;
      question.typeID = responseTypeList.find(
        (type) => type.text == question.attributes.responseType
      ).id;
      question.wordCount = question.attributes.response_word_limit;
      question.text = question.attributes.text;
      if (question.attributes.responseType === responseType.Attachment) {
        let data = question.text.split('<separator> ');
        question.text = data[0];
        question.htmlData = data[1];
        this.previewData.responseType = responseType.Attachment;
        if (question.htmlData) {
          this.previewData.attachmentUploadEnabled = true;
          let href = question.htmlData.match(/'([^\']+)'/)[1];
          // File already save in decoded format no need to decode here
          question.fileName = this.util.getQueryParams('file_name', href);
          this.previewData.filename = question.fileName;
        }
      }
      question.previewOptions = {
        ...this.previewData,
        responseType: question.attributes.responseType,
      };
      question.previewOptions.options = question.attributes.options;
      if (question.previewOptions.filename)
        question.source_document_details = `<separator> ${question.htmlData}`;
      question.label =
        question.attributes.responseType !== responseType.Attachment
          ? question.text
          : question.htmlData
          ? `${question.text} <separator> ${question.htmlData}`
          : question.text;
    }
    if (question.responseType !== responseType.Attachment) {
      if (question.responseType === responseType.Bookends) {
        this.previewData.responseType = responseType.Bookends;
      }
      if (
        question.responseType === responseType.Dropdown ||
        question.responseType === responseType.CheckBox
      )
        this.optionsQuestions[question.id] = { optionsQuestion: question };
      //this.getQuestionOptions(question);
      if (
        question.responseType === responseType.Grid ||
        question.responseType === responseType.DynamicGrid
      )
        this.gridQuestions[question.id] = { gridQuestion: question };
    }
    question.previewOptions = {
      ...this.previewData,
      responseType: question.responseType,
    };
  }

  getQuestionOptions(optionsQuestions) {
    return Object.values(optionsQuestions).map((question: any) => {
      return this.template.getQuestionsOptions(
        question.optionsQuestion.attributes.id
      );
    });
  }
  getQuestionGrid(gridQuestions) {
    return Object.values(gridQuestions).map((question: any) => {
      return this.template.getQuestionsGrid(
        question.gridQuestion.attributes.grid_id,
        question.gridQuestion.attributes.grid_version
      );
    });
  }
  async handleSave() {
    if (!this.questionList.length)
      return this.toaster.error('Atleast one question is required');

    let gridData = {};
    let questionGrid = [];
    let sectionID = this.sectionId;
    let predefinedDocumentTags: any = [];
    let attachmentQuestionIds = [];
    let payload = {
      filters: {
        and: {
          current_template_id: this.store.selectSnapshot(
            (state) => state.template.templateId
          ),
          question: this.questionList.map((question, index) => {
            if (
              question.type === responseType.Grid &&
              question.previewData?.rows?.length === 0
            )
              return;
            if (
              question.type === responseType.DynamicGrid &&
              question.previewData?.columns?.length === 0
            )
              return;
            let nestingRules = [
              {
                operatorID: question.data.attributes.operatorID,
                value:
                  question.data.attributes.displayValue?.id ??
                  question.data.attributes.displayValue,
                questionID: question.parentID,
                questionId: question.id,
              },
            ];
            question.nestingRules = nestingRules;
            if (
              question.type === responseType.Grid ||
              question.type === responseType.DynamicGrid
            ) {
              gridData[question.id] = {
                ...(question.nestingRules && {
                  nestingRules: question.nestingRules,
                }),
                previewData: question.previewOptions,
                type: question.type,
                text: question.label,
              };
            } else if (
              question.type === responseType.Dropdown ||
              question.type === responseType.CheckBox
            ) {
              gridData[question.id] = {
                ...(question.nestingRules && {
                  nestingRules: question.nestingRules,
                }),
                previewData: question.previewOptions,
                responseType: question.typeID,
                type: question.type,
                text: question.label,
              };
            } else {
              if (
                question.type === responseType.TextMultiLine ||
                question.type === responseType.Text
              ) {
                questionGrid.push({
                  ...(question.nestingRules && {
                    nestingRules: question.nestingRules,
                  }),
                  response_word_limit: question.wordCount,
                  responseType: question.typeID,
                  text: question.label,
                });
              } else {
                questionGrid.push({
                  ...(question.nestingRules && {
                    nestingRules: question.nestingRules,
                  }),
                  responseType: question.typeID,
                  text: question.label,
                  question_text: question.text,
                  type: question.type,
                });
              }
            }

            return {
              question_id: index + 1,
              question_text: question.label,
              response_type: question.typeID,
            };
          }),
        },
      },
    };

    if (Object.keys(gridData).length) {
      forkJoin(this.createGridPayload(gridData)).subscribe(
        async (response: any) => {
          await this.template.createQuestionSuggestionNew(payload).toPromise();

          Object.keys(gridData).map((qustionId, index) => {
            let newQuestion = {
              ...(gridData[qustionId].nestingRules && {
                nestingRules: gridData[qustionId].nestingRules,
              }),
              responseType: gridData[qustionId].type,
              text: gridData[qustionId].text,
              grid_id: null,
              grid_version: null,
              dropdown_id: null,
              dropdown_version: null,
            };

            if (
              gridData[qustionId].type == responseType.Grid ||
              gridData[qustionId].type == responseType.DynamicGrid
            ) {
              newQuestion.grid_id = response[index].id;
              newQuestion.grid_version = response[index].version;
            } else if (
              gridData[qustionId].type == responseType.CheckBox ||
              gridData[qustionId].type == responseType.Dropdown
            ) {
              (newQuestion.dropdown_id = response[index].id),
                (newQuestion.dropdown_version = response[index].version);
            }
            questionGrid.push(newQuestion);
          });

          attachmentQuestionIds = questionGrid
            .filter((question) => question.type === responseType.Attachment)
            .map((question) => question.nestingRules[0].questionId);
          if (attachmentQuestionIds.length) {
            predefinedDocumentTags = await this.template
              .getReusablePresetTags(attachmentQuestionIds)
              .toPromise();
          }
          questionGrid.forEach((question) => {
            if (question.type === responseType.Attachment) {
              const tags = predefinedDocumentTags[
                question.nestingRules[0]?.questionId
              ]?.map((tag) => tag?.id);
              question.predefined_document_tag_ids = tags;
              if (question.source_document_details)
                this.setAttachmentSourceDetails(question);
            }
            delete question.nestingRules[0].questionId;
          });
          this.template
            .createNestedQuestions(sectionID, questionGrid)
            .subscribe(
              (res) => {
                this.store.dispatch(new GetTemplateInfo());
                this.store.dispatch(new ToggleTemplateState());
                this.store.dispatch(
                  new UpdateLocalQuestion(this.questionId, {
                    nestingRuleIds: [this.questionId],
                  })
                );
                this.responseIDs = res;
                let tempArray = [];
                this.responseIDs.forEach((id, index) => {
                  this.dataToSend[index].children.map((question) => {
                    question.parentID = id;
                    tempArray.push(question);
                  });
                });
                this.dataToSend = [...tempArray];
                if (this.dataToSend.length > 0) {
                  this.handlePastedQuestions(this.dataToSend, true);
                } else {
                  this.loading = false;
                  this.onAddingNested();
                  this.gridQuestions = {};
                  this.optionsQuestions = {};
                  this.closeModalFunc();
                }
              },
              (error) => {
                this.loading = false;
                this.handleError(
                  error,
                  payload.filters.and.current_template_id
                );
              }
            );
        },
        (error) => {
          this.handleError(error, payload.filters.and.current_template_id);
        }
      );
    } else {
      await this.template.createQuestionSuggestionNew(payload).toPromise();

      attachmentQuestionIds = questionGrid
        .filter((question) => question.type === responseType.Attachment)
        .map((question) => question.nestingRules[0].questionId);
      if (attachmentQuestionIds.length) {
        // add predefined_document_tags after pasting into other question
        predefinedDocumentTags = await this.template
          .getReusablePresetTags(attachmentQuestionIds)
          .toPromise();
      }
      questionGrid.forEach((question) => {
        if (question.type === responseType.Attachment) {
          const tags = predefinedDocumentTags[
            question.nestingRules[0]?.questionId
          ]?.map((tag) => tag?.id);
          question.predefined_document_tag_ids = tags;
          if (question.source_document_details)
            this.setAttachmentSourceDetails(question);
        }
        delete question.nestingRules[0].questionId;
      });

      this.template.createNestedQuestions(sectionID, questionGrid).subscribe(
        (res) => {
          this.store.dispatch(new GetTemplateInfo());
          this.store.dispatch(new ToggleTemplateState());
          this.store.dispatch(
            new UpdateLocalQuestion(this.questionId, {
              nestingRuleIds: [this.questionId],
            })
          );
          this.responseIDs = res;
          let tempArray = [];
          this.responseIDs.forEach((id, index) => {
            this.dataToSend[index].children.map((question) => {
              question.parentID = id;
              tempArray.push(question);
            });
          });
          this.dataToSend = [...tempArray];
          if (this.dataToSend.length > 0) {
            this.handlePastedQuestions(this.dataToSend, true);
          } else {
            this.loading = false;
            this.onAddingNested();
            this.gridQuestions = {};
            this.optionsQuestions = {};
            this.closeModalFunc();
          }
        },
        (error) => {
          this.loading = false;
          this.handleError(error, payload.filters.and.current_template_id);
        }
      );
    }
  }

  setAttachmentSourceDetails(question: any) {
    question.source_document_details = `${question.text}`.substring(
      question.question_text.length
    );
    question.text = question.question_text;
    delete question.question_text;
  }

  handleError(error, templateId) {
    if (error.status === ERROR_CODES.CONFLICT) {
      this.SweetAlert.error({
        title: error.error.message,
        confirmButtonText: 'Refresh',
      }).then((isConfirm) => {
        if (isConfirm.value && isConfirm.value == true) {
          this.routerService.navigateWithParams(
            'app.diligence.template.preview',
            {
              templateId: templateId,
            }
          );
        }
      });
    } else if (error.error && error.error.message) {
      this.SweetAlert.error({
        title: error.error.message,
        confirmButtonText: 'Okay',
      });
    }
  }

  createGridPayload(gridData) {
    return Object.values(gridData).map((preview: any) => {
      let rows_columns = [];
      if (
        preview.type == responseType.Grid ||
        preview.type == responseType.DynamicGrid
      ) {
        if (responseType.Grid === preview.type) {
          preview.previewData.rows.map((value, index) => {
            rows_columns.push({
              elementType: 'Row',
              name: value.text,
              order: index + 1,
            });
          });
          preview.previewData.columns.map((value, index) => {
            rows_columns.push({
              name: value.text,
              elementType: 'Column',
              order: index + 1,
              type: value.type,
              type_options: value.type_options,
            });
          });
        }
        if (responseType.DynamicGrid === preview.type) {
          preview.previewData.columns.map((value, index) => {
            rows_columns.push({
              name: value.text,
              elementType: 'Column',
              order: index + 1,
              type: value.type,
              type_options: value.type_options,
            });
          });
        }
        let gridParams = {
          template_id: this.store.selectSnapshot(
            (state) => state.template.templateId
          ),
          dataType: 'Integer',
          dynamic_element:
            responseType.DynamicGrid === preview.type ? 'Row' : null,
          formulas_json: null,
          rows_columns,
        };
        if (rows_columns.length) {
          return this.template.createQuestionsGrid(gridParams);
        }
      } else if (
        preview.type == responseType.CheckBox ||
        preview.type == responseType.Dropdown
      ) {
        let params = {
          template_id: this.store.selectSnapshot(
            (state) => state.template.templateId
          ),
          name: preview.text,
          options: preview.previewData.options.map((option) => {
            return {
              dropdown_option_id: option.id,
              is_active: option.is_active,
              dropdown_option_text: option.text,
              order: option.order,
            };
          }),
        };
        return this.template.createQuestionsDropdown(params);
      }
    });
  }
}
