import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';
import { TemplateService } from 'src/app2/apis/template/template.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { fieldPreviewtype } from 'src/app2/shared/components/field-preview/field-preview.type';
import {
  ERROR_CODES,
  FILTER_TERNARY_OPERATORS,
} from 'src/app2/shared/constants/constant';
import {
  responseType,
  responseTypeList,
} from '../../constants/responseType.constant';
import { getPreviewType } from '../../side-panels/edit-question-panel/edit-question.util';
import {
  CreateQuestions,
  GetTemplateInfo,
} from '../../store/template-builder.action';
import { FILTER_TYPES } from 'src/app2/shared/constants/constant';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { RouterService } from 'src/app2/services/router.service';
import { finalize } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import * as moment from 'moment';

enum questionCreation {
  new = 'new',
  existing = 'existing',
  null = '',
}

@Component({
  selector: 'new-question',
  templateUrl: './new-question.component.html',
  styleUrls: ['./new-question.component.css'],
})
export class NewQuestionComponent implements OnInit {
  @Input() sectionId;
  @Input() nestedQuestion;
  type: questionCreation = questionCreation.existing;
  questionForm: FormGroup;
  label = 'Add multiple questions';
  questionList = [];
  editQuestion;
  loading;
  loadingExistingQuestions = false;
  @Input() onAddingNested;
  existingQuestions = [];
  QuestionSelectorDisplayParams = {
    id: 'question_id',
    name: 'question_text',
  };
  filterParams = {
    created_at: 'created_at',
    question_text: 'question_text',
    response_type: 'response_type',
    template_name: 'template_name',
    diligence_type: 'diligence_type',
  };
  selectedExistingQuestions = [];
  newQuestions = [];
  previewData: fieldPreviewtype;
  search_criterias = [];
  allSearchFilterOptions = [];
  allSortFilterOptions = [];
  allFilterOptions = [];
  newCriteria;
  filters_data_loaded: boolean = false;
  searchByFiltersData = [];
  global_ternary_operator = FILTER_TERNARY_OPERATORS.AND;
  FILTER_TYPES = FILTER_TYPES;
  filterApplied: boolean;
  filters = { name: '' };
  mostAnsweredFilterValue: any = true;
  frequestlyUsedFilterValue: any = 'not-selected';
  processing_data: boolean = false;
  selection_list = [];
  default_criteria_options = [];
  currentSortFilterSelected = {
    name: 'Sort by: most answered ↓',
    value: 'ma-true',
  };
  sortOptions = [
    { name: 'Sort by: most answered ↑', value: 'ma-false' },
    { name: 'Sort by: most answered ↓', value: 'ma-true' },
    { name: 'Sort by: frequently used ↑', value: 'fu-false' },
    { name: 'Sort by: frequently used ↓', value: 'fu-true' },
  ];
  dateRangeForDirectives;
  subTitle = null;
  title = 'New Questions';
  filters_section: any = { show: false, filterApplied: false };
  optionsCache = {};
  gridCache = {};
  localParams = null;
  reuseableAttachmentTagsMap: Map<number, any[]> = new Map<number, any[]>();
  templateState: any = {};
  constructor(
    private store: Store,
    private template: TemplateService,
    private toaster: ToastrService,
    private util: UtilsService,
    private SweetAlert: SweetAlertService,
    private routerService: RouterService,
    private routerState: ActivatedRoute
  ) {}
  ngOnInit(): void {
    this.localParams = this.routerService.getState(this.routerState).params;
    const { categoryId, subcategoryId } = this.localParams;
    this.store.selectSnapshot((state) => {
      const category = state.template.categories[categoryId];
      this.subTitle = `${category?.label} > ${
        category?.list[subcategoryId]?.label || ''
      }`;
      this.templateState = state.template;
    });
    this.questionForm = new FormGroup({
      isSingle: new FormControl(!!this.nestedQuestion),
    });
    if (this.nestedQuestion) {
      if (this.nestedQuestion.attributes?.text) {
        this.label = `Adding new nested/conditional question under "${this.nestedQuestion.attributes.text}"`;
      } else {
        this.label = `Adding new nested/conditional question under "${this.nestedQuestion.text}"`;
      }
    } else {
      this.label = 'Add multiple questions';
    }

    if (this.nestedQuestion) {
      this.title = 'Configure Nested Question Logic';
      this.type = questionCreation.new;
    } else {
      this.handleBulkQuestion(this.type);
    }
  }

  onDateChange(event, criteria) {
    criteria.advance_filter_value = event;
  }
  onDateRangeChange(event, criteria) {
    criteria.advance_filter_value = event;
    if (event && event.startDate && event.endDate) {
      this.dateRangeForDirectives = {
        startDate: event.startDate,
        endDate: event.endDate,
        range: event.range,
      };
    }
  }

  onClearDateFilter() {
    setTimeout(() => {
      this.dateRangeForDirectives = null;
    });
  }

  selectCriteriaObj(criteria, event) {
    criteria.criteria_obj = event;
    criteria.condition = event.search_type[0];
    if (criteria.advance_filter_value) {
      criteria.advance_filter_value = null;
    }
  }

  selectCriteria(criteria, index, event) {
    criteria.condition = event;
  }

  addNewCriteria() {
    setTimeout(() => {
      this.newCriteria = {};
      this.newCriteria = {
        criteria_obj: this.allSearchFilterOptions[0],
        condition: this.allSearchFilterOptions[0].search_type[0],
      };
      this.search_criterias.push(this.newCriteria);
    }, 400);
  }

  removeCurrentFilter(criteria, index) {
    if (index == 0) {
      this.default_criteria_options.splice(index, 1);
      criteria.advance_filter_value = null;
    } else {
      this.search_criterias.splice(index, 1);
    }
  }

  useExistingApi() {
    this.template
      .getQuestionFilter({
        filters: {
          type: 'reuse',
        },
      })
      .subscribe((res) => {
        if (res['status'] == 200) {
          this.allFilterOptions = res['data'];
          this.allFilterOptions.forEach((option) => {
            if (option.filter_function == 'search') {
              this.allSearchFilterOptions.push(option);
            }
            if (option.filter_function == 'sort') {
              this.allSortFilterOptions.push(option);
            }
          });
          this.filters_data_loaded = true;
          this.newCriteria = {};
          this.newCriteria = {
            criteria_obj: this.allSearchFilterOptions[0],
            condition: this.allSearchFilterOptions[0].search_type[0],
          };
          this.search_criterias = [this.newCriteria];
          this.searchByFilters();
        } else {
          this.allFilterOptions = res['data'];
          this.filters_data_loaded = true;
          this.searchByFilters();
          this.toaster.error('Unexpected error occurred');
        }
      });
  }
  selectSortCriteriaFilter(event) {
    this.processing_data = true;
    this.currentSortFilterSelected = event;
    if (this.currentSortFilterSelected.value == 'ma-true') {
      this.mostAnsweredFilterValue = true;
      this.frequestlyUsedFilterValue = 'not-selected';
    } else if (this.currentSortFilterSelected.value == 'ma-false') {
      this.mostAnsweredFilterValue = false;
      this.frequestlyUsedFilterValue = 'not-selected';
    } else if (this.currentSortFilterSelected.value == 'fu-true') {
      this.frequestlyUsedFilterValue = true;
      this.mostAnsweredFilterValue = 'not-selected';
    } else if (this.currentSortFilterSelected.value == 'fu-false') {
      this.frequestlyUsedFilterValue = false;
      this.mostAnsweredFilterValue = 'not-selected';
    } else {
      this.frequestlyUsedFilterValue = 'not-selected';
      this.mostAnsweredFilterValue = 'not-selected';
    }
    this.searchByFilters();
  }

  resetFilters() {
    this.global_ternary_operator = FILTER_TERNARY_OPERATORS.AND;
    this.search_criterias = [];
    this.filters.name = '';
    this.frequestlyUsedFilterValue = 'not-selected';
    this.mostAnsweredFilterValue = true;
    this.filters_section = JSON.parse(JSON.stringify(this.filters_section));
    this.filters_section.show = false;
    this.filters_section.filterApplied = false;
    this.addNewCriteria();
    this.searchByFilters();
  }

  searchByFilters() {
    this.processing_data = true;
    let filter;
    const searchByFiltersData = [];
    for (let index = 0; index < this.search_criterias.length; index++) {
      filter = this.search_criterias[index];
      if (filter) {
        if (
          filter.hasOwnProperty('condition') &&
          filter.hasOwnProperty('advance_filter_value') &&
          filter.condition !== null &&
          filter.advance_filter_value !== null &&
          filter.advance_filter_value !== '' &&
          filter.advance_filter_value !== undefined
        ) {
          if (filter.criteria_obj.filter_name == 'created_at') {
            filter.advance_filter_value = moment(
              filter.advance_filter_value
            ).format('MM-DD-YYYY');
          }
          searchByFiltersData.push(filter);
        }
      }
    }
    this.filters_section.name = this.filters.name;
    this.filters_section = JSON.parse(JSON.stringify(this.filters_section));
    if (searchByFiltersData.length === 0) {
      this.filterApplied = false;
      this.filters_section.filterApplied = false;
    } else {
      this.filters_section.filterApplied = searchByFiltersData.length > 0;
    }

    const params = {
      filters: { [this.global_ternary_operator]: [] },
    };
    for (filter of searchByFiltersData) {
      const filter_params = {
        filter_name: filter.criteria_obj.filter_name,
        filter_type: filter.criteria_obj.filter_type,
        search_type: filter.condition.value,
        filter_value: filter.advance_filter_value,
      };
      params.filters[this.global_ternary_operator].push(filter_params);
    }
    this.applyFiltersSearch(params);
  }

  applyFiltersSearch(filter_params) {
    this.filterApplied = !(
      (filter_params.filters.hasOwnProperty('and') ||
        filter_params.filters.hasOwnProperty('or')) &&
      filter_params.filters[this.global_ternary_operator].length == 0
    );
    if (this.filters.name) {
      let nameFilterParams = {
        filter_name: 'question_text',
        filter_type: 'str',
        search_type: 'contains',
        filter_value: this.filters.name,
      };
      filter_params.filters[this.global_ternary_operator].push(
        nameFilterParams
      );
    }
    if (this.mostAnsweredFilterValue != 'not-selected') {
      let nameFilterParams = {
        filter_name: 'response_count_sort',
        filter_type: 'bool',
        search_type: 'exact',
        filter_value: this.mostAnsweredFilterValue,
      };
      filter_params.filters[this.global_ternary_operator].push(
        nameFilterParams
      );
    }
    if (this.frequestlyUsedFilterValue != 'not-selected') {
      let nameFilterParams = {
        filter_name: 'template_count',
        filter_type: 'bool',
        search_type: 'exact',
        filter_value: this.frequestlyUsedFilterValue,
      };
      filter_params.filters[this.global_ternary_operator].push(
        nameFilterParams
      );
    }
    let templateFilterParams = {
      filter_name: 'current_template_id',
      filter_type: 'str',
      search_type: 'exact',
      filter_value: `${this.templateState.templateId}`,
    };
    filter_params.filters[this.global_ternary_operator].push(
      templateFilterParams
    );
    this.template.getExistingQuestions(filter_params).subscribe((res) => {
      this.existingQuestions = res['data'];
      let ids = this.selectedExistingQuestions?.map((val) => val.id);
      let wordCount = this.store.selectSnapshot(
        (state) => state.user.firmPreference.default_response_word_limit
      );
      this.existingQuestions = this.existingQuestions?.map((element) => {
        element.name = element.question_text;
        element.label = element.question_text;
        element.type = element.response_type;
        element.isMandatory = false;
        element.hintText = '';
        element.wordCount = wordCount;
        element.is_selected = ids.includes(element.question_id);
        element.responseType = responseTypeList.find(
          (type) => type.id == element.response_type
        ).text;
        return element;
      });
      setTimeout(() => {
        this.processing_data = false;
      }, 300);
      this.existingQuestions.forEach((val) => {
        this.setInitialValuesBeforeEdit(val);
      });
    });
  }

  handleBulkQuestion(type) {
    this.type = type;
    if (
      this.type == questionCreation.existing &&
      !this.existingQuestions.length
    ) {
      !this.existingQuestions.length && this.useExistingApi();
      setTimeout(() => {
        this.processing_data = true;
      }, 100);
    }
  }

  handleMultiChange(data) {
    this.questionForm.patchValue({
      isSingle: data,
    });
    this.label = data ? 'Adding new question' : 'Add multiple questions';
  }

  handleUnSelection(entity) {
    let ids = entity.map((val) => val.id);
    if (ids.length > 1) this.selectedExistingQuestions = [];
    else
      this.selectedExistingQuestions = this.selectedExistingQuestions?.filter(
        (val) => !ids.includes(val.id)
      );
    this.questionList = [
      ...this.selectedExistingQuestions,
      ...this.newQuestions,
    ];
  }

  async handleSelectionChange(selectedQuestionData: Array<any>) {
    let ids = this.selectedExistingQuestions?.map((val) => val.id);
    selectedQuestionData = selectedQuestionData?.filter(
      (val) => !ids.includes(val.id)
    );
    if (!selectedQuestionData.length) return;
    if (
      selectedQuestionData.find(
        (x) => x.responseType === responseType.Attachment
      )
    ) {
      await this.getReuseableAttachmentTags(selectedQuestionData);
    }
    selectedQuestionData.forEach((question) => {
      this.setInitialValuesBeforeEdit(question, true);
    });
    selectedQuestionData[0].push_index = this.questionList.length
      ? this.questionList[this.questionList.length - 1].push_index + 1
      : 0;
    this.selectedExistingQuestions = [
      ...this.selectedExistingQuestions,
      ...selectedQuestionData,
    ];
    let questionArr: any = this.selectedExistingQuestions.map((question) => [
      question.id,
      question,
    ]);
    var questinoMapArr = new Map(questionArr);
    this.selectedExistingQuestions = [...questinoMapArr.values()];
    const questions = [...this.selectedExistingQuestions, ...this.newQuestions];
    this.questionList = this.util.sortByAplha(questions, 'push_index');
  }

  async getReuseableAttachmentTags(selectedQuestionData) {
    const attachmentQuestionIds = selectedQuestionData
      .filter((x) => x.responseType === responseType.Attachment)
      .map((x) => x.question_id);

    // find questions for which the data is not available in the Map
    const newQuestionIds = attachmentQuestionIds.filter(
      (questionId) => !this.reuseableAttachmentTagsMap.has(questionId)
    );
    if (newQuestionIds.length) {
      // call API for these questions to get the data
      const response = await this.template
        .getReusablePresetTags(newQuestionIds)
        .toPromise();

      // update the Map based on the API response to reuse the data if user selects the same question again
      newQuestionIds.map((questionId) => {
        let tags: any = [];
        if (response[questionId]) {
          tags = response[questionId];
        }
        this.reuseableAttachmentTagsMap.set(+questionId, tags);
      });
    }
  }

  setInitialValuesBeforeEdit(question, existingQuestion = false) {
    this.previewData = {
      responseType: null,
      rows: [],
      columns: [],
      options: [],
      dynamic_element: null,
      attachmentUploadEnabled: false,
      has_other_option: false,
      filename: null,
      predefined_document_tags: [],
    };
    if (question) {
      question.id = question.question_id;
      question.responseCount = question.response_count;
      question.type = question.responseType;
      question.isMandatory = question.is_mandatory;
      question.typeID = responseTypeList.find(
        (type) => type.text == question.responseType
      ).id;
      question.wordCount = question.response_word_limit;
      question.previewOptions = {
        ...this.previewData,
        responseType: question.responseType,
      };
      let data = question.label.split('<separator> ');
      if (data?.length) {
        question.text = data[0];
        question.htmlData = data[1] || null;
      }

      question.previewOptions.options = question.options;
      question.text = question.text;
      question.label =
        question.responseType !== responseType.Attachment || existingQuestion
          ? question.question_text
          : question.htmlData
          ? `${question.question_text} <separator> ${question.htmlData}`
          : question.question_text;

      if (question.responseType === responseType.Attachment) {
        this.previewData.responseType = responseType.Attachment;
        question.previewOptions.responseType = this.previewData.responseType;
        if (
          existingQuestion &&
          this.reuseableAttachmentTagsMap.has(question.question_id)
        ) {
          this.previewData.predefined_document_tags =
            this.reuseableAttachmentTagsMap.get(question.question_id);
        }
        if (question.htmlData) {
          this.previewData.attachmentUploadEnabled = true;

          let href = question.htmlData
            .match(/(http[s]?:\/\/)?[^\s(["<,>]*\.[^\s[",><]*/)[0]
            ?.slice(0, -1);
          question.attachmentHref = JSON.parse(JSON.stringify(href));
          let filename = this.util.getQueryParams('file_name', href);
          let decodedFileName = decodeURIComponent(
            (filename + '').replace(/\+/g, '%20')
          );
          question.fileName = decodedFileName;
          this.previewData.filename = decodedFileName;
          this.previewData.attachmentHref = question.attachmentHref;
        }
      }
    }
    if (question.responseType !== responseType.Attachment) {
      if (question.responseType === responseType.Bookends) {
        this.previewData.responseType = responseType.Bookends;
      }
      if (
        question.responseType === responseType.Dropdown ||
        question.responseType === responseType.CheckBox
      )
        this.getQuestionOptions(question);
      if (
        question.responseType === responseType.Grid ||
        question.responseType === responseType.DynamicGrid
      )
        this.getQuestionGrid(question);
    }
    question.previewOptions = {
      ...this.previewData,
      responseType: question.responseType,
    };
  }

  getQuestionOptions(question) {
    if (question.id in this.optionsCache) {
      this.previewData = {
        ...this.previewData,
        responseType: question.responseType,
        ...getPreviewType(
          this.optionsCache[question.id],
          responseType.Dropdown
        ),
      };
      question.options = this.previewData.options;
    } else
      this.template.getQuestionsOptions(question.id).subscribe((res: any) => {
        this.previewData = {
          ...this.previewData,
          responseType: question.responseType,
          ...getPreviewType(res, responseType.Dropdown),
        };
        if (!(question.id in this.optionsCache)) {
          this.optionsCache[question.id] = res;
        }
        question.options = this.previewData.options;
      });
  }

  getQuestionGrid(question) {
    if (question.id in this.gridCache) {
      this.previewData = {
        ...this.previewData,
        responseType: question.responseType,
        ...getPreviewType(this.gridCache[question.id], question.responseType),
      };
      question.previewOptions.rows = this.previewData.rows;
      question.previewOptions.columns = this.previewData.columns;
    } else
      this.template
        .getQuestionsGrid(question.reference_grid_id, question.grid_version)
        .subscribe((res) => {
          this.previewData = {
            ...this.previewData,
            responseType: question.responseType,
            ...getPreviewType(res, question.responseType),
          };
          question.previewOptions.rows = this.previewData.rows;
          question.previewOptions.columns = this.previewData.columns;
          if (!(question.id in this.gridCache)) {
            this.gridCache[question.id] = res;
          }
        });
  }

  handleAddClick(questionData: Array<any>) {
    if (this.editQuestion) {
      this.questionList = this.questionList.map((question) => {
        if (question.id === this.editQuestion.id) {
          return JSON.parse(JSON.stringify(questionData[0]));
        }
        return question;
      });
    } else {
      if (!questionData.length) return;
      questionData[0].push_index = this.questionList.length
        ? this.questionList[this.questionList.length - 1].push_index + 1
        : 0;
      this.newQuestions = [...this.newQuestions, ...questionData];
      const questions = [
        ...this.selectedExistingQuestions,
        ...this.newQuestions,
      ];
      this.questionList = this.util.sortByAplha(questions, 'push_index');
    }
    this.editQuestion = null;
  }

  handleEditClick(index) {
    this.type = questionCreation.new;
    this.questionForm.patchValue({
      isSingle: true,
    });
    setTimeout(() => {
      this.editQuestion = JSON.parse(JSON.stringify(this.questionList[index]));
    }, 0);
  }
  handleDeleteClick(index) {
    this.existingQuestions.forEach((question) => {
      if (question.id == this.questionList[index].id) {
        question.is_selected = false;
        this.selectedExistingQuestions = this.selectedExistingQuestions.filter(
          (val) => val.id !== question.id
        );
      }
    });
    this.existingQuestions = JSON.parse(JSON.stringify(this.existingQuestions));
    let newQuestionIndex = this.newQuestions.indexOf(
      this.newQuestions.find((question) => question == this.questionList[index])
    );
    if (newQuestionIndex >= 0) {
      this.newQuestions.splice(newQuestionIndex, 1);
    }
    this.questionList.splice(index, 1);
  }

  async handleSave(close) {
    if (!this.questionList.length) {
      this.toaster.error('Atleast one question is required');
      return;
    }
    let gridData = {};
    let questionsList = [];
    let attachmentQuestionsMap = {};
    let payload = {
      filters: {
        and: {
          current_template_id: this.templateState.templateId,
          question: this.questionList.map((question, index) => {
            if (!!this.nestedQuestion) {
              let nestingRules = [
                {
                  operatorID: question.condition.id,
                  value:
                    question.conditionalValue?.id ?? question.conditionalValue,
                  questionID: this.nestedQuestion.id,
                },
              ];
              question.nestingRules = nestingRules;
            }
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
                push_index: index,
                is_mandatory: question.isMandatory,
                hint_text: question.hintText,
                question_id: question.question_id,
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
                text: question.label,
                type: question.type,
                is_mandatory: question.isMandatory,
                hint_text: question.hintText,
                push_index: index,
                question_id: question.question_id,
              };
            } else {
              if (
                question.type === responseType.TextMultiLine ||
                question.type === responseType.Text
              ) {
                questionsList.push({
                  ...(question.nestingRules && {
                    nestingRules: question.nestingRules,
                  }),
                  response_word_limit: question.wordCount,
                  responseType: question.typeID,
                  text: question.label,
                  question_text: question.text,
                  is_mandatory: question.isMandatory,
                  hint_text: question.hintText,
                  push_index: index,
                  id: question.question_id,
                });
              } else {
                questionsList.push({
                  ...(question.nestingRules && {
                    nestingRules: question.nestingRules,
                  }),
                  responseType: question.typeID,
                  text: question.label,
                  question_text: question.text,
                  is_mandatory: question.isMandatory,
                  hint_text: question.hintText,
                  push_index: index,
                  id: question.question_id,
                  ...(question.type === responseType.Attachment &&
                    question.previewOptions?.predefined_document_tags
                      ?.length && {
                      predefined_document_tag_ids:
                        question.previewOptions.predefined_document_tags.map(
                          (x) => x.id
                        ),
                    }),
                });
              }
            }
            if (
              question.type === responseType.Attachment &&
              question.previewOptions.filename
            ) {
              attachmentQuestionsMap[index] = {
                text: question.text,
                index,
                source_document_details: question.source_document_details,
              };
            }
            return {
              question_id: index + 1,
              question_text: question.label,
              response_type: question.typeID,
              is_reuse: question?.question_id,
            };
          }),
        },
      },
    };

    this.loading = true;
    if (Object.keys(gridData).length) {
      forkJoin(this.createGridPayload(gridData))
        .pipe(finalize(() => (this.loading = false)))
        .subscribe(
          async (response: any) => {
            if (response?.error?.status === ERROR_CODES.CONFLICT) {
              this.SweetAlert.error({
                title: response.error?.data?.message,
                confirmButtonText: 'Refresh',
              }).then((isConfirm) => {
                if (isConfirm.value && isConfirm.value == true) {
                  this.routerService.navigateWithParams(
                    'app.diligence.template.preview',
                    { templateId: payload.filters.and.current_template_id }
                  );
                }
              });
            } else if (response?.error?.data && response?.error?.data.message) {
              this.SweetAlert.error({
                title: response?.error?.data?.message,
                confirmButtonText: 'Okay',
              });
              return;
            } else {
              let newQuestionId: any = {};
              payload.filters.and.question =
                payload.filters.and.question.filter((que) => !que.is_reuse);
              try {
                if (payload.filters.and.question.length) {
                  newQuestionId = await this.template
                    .createQuestionSuggestionNew(payload)
                    .toPromise();
                  questionsList.forEach((question) => {
                    if (newQuestionId.data[question.push_index + 1]) {
                      question.id =
                        newQuestionId.data[
                          question.push_index + 1
                        ]?.question_id;
                    }
                  });
                }
              } catch (error) {
                this.handleError(error);
              }

              Object.keys(gridData).map((qustionId, index) => {
                let newGridQuestion = {
                  ...(gridData[qustionId].nestingRules && {
                    nestingRules: gridData[qustionId].nestingRules,
                  }),
                  responseType: gridData[qustionId].type,
                  text: gridData[qustionId].text,
                  is_mandatory: gridData[qustionId].is_mandatory,
                  hint_text: gridData[qustionId].hint_text,
                  push_index: gridData[qustionId].push_index,
                  grid_id: null,
                  grid_version: null,
                  dropdown_id: null,
                  dropdown_version: null,
                  id:
                    gridData[qustionId].question_id ||
                    newQuestionId.data[gridData[qustionId].push_index + 1]
                      ?.question_id,
                };
                if (
                  gridData[qustionId].type == responseType.Grid ||
                  gridData[qustionId].type == responseType.DynamicGrid
                ) {
                  newGridQuestion.grid_id = response[index].id;
                  newGridQuestion.grid_version = response[index].version;
                } else if (
                  gridData[qustionId].type == responseType.CheckBox ||
                  gridData[qustionId].type == responseType.Dropdown
                ) {
                  (newGridQuestion.dropdown_id = response[index].id),
                    (newGridQuestion.dropdown_version =
                      response[index].version);
                }
                questionsList.push(newGridQuestion);
              });
              questionsList = this.util.sortByAplha(
                questionsList,
                'push_index'
              );
              this.setAttachmentQuestion(questionsList, attachmentQuestionsMap);
              questionsList.map((question) => delete question.push_index);
              if (this.nestedQuestion) {
                this.template
                  .createNestedQuestions(this.sectionId, questionsList)
                  .pipe(finalize(() => (this.loading = false)))
                  .subscribe(
                    async (res: any) => {
                      this.toaster.success(
                        'Added new nested question successfully!'
                      );
                      this.onAddingNested(res);
                      await this.store
                        .dispatch(new GetTemplateInfo(true))
                        .toPromise();
                    },
                    (error) => this.handleError(error)
                  );
              } else {
                this.store
                  .dispatch(new CreateQuestions(this.sectionId, questionsList))
                  .subscribe(async () => {
                    await this.store
                      .dispatch(new GetTemplateInfo(true))
                      .toPromise();
                    this.toaster.success('Added new question successfully!');
                  });
              }
              close();
            }
          },
          (e) => {
            this.loading = false;
            this.handleError(e);
          }
        );
    } else {
      try {
        payload.filters.and.question = payload.filters.and.question.filter(
          (que) => !que.is_reuse
        );
        if (payload.filters.and.question.length) {
          const newQuestionId: any = await this.template
            .createQuestionSuggestionNew(payload)
            .toPromise();
          questionsList.forEach((question) => {
            if (newQuestionId.data[question.push_index + 1]) {
              question.id =
                newQuestionId.data[question.push_index + 1]?.question_id;
            }
          });
        }
      } catch (error) {
        this.handleError(error);
      }
      this.setAttachmentQuestion(questionsList, attachmentQuestionsMap);
      if (this.nestedQuestion) {
        this.template
          .createNestedQuestions(this.sectionId, questionsList)
          .pipe(
            finalize(() => {
              this.loading = false;
            })
          )
          .subscribe(
            async (res: any) => {
              this.toaster.success('Added new nested question successfully!');
              this.onAddingNested(res);
              await this.store.dispatch(new GetTemplateInfo(true)).toPromise();
            },
            (error) => this.handleError(error)
          );
      } else {
        this.setAttachmentQuestion(questionsList, attachmentQuestionsMap);
        this.store
          .dispatch(new CreateQuestions(this.sectionId, questionsList))
          .pipe(finalize(() => (this.loading = false)))
          .subscribe(async () => {
            await this.store.dispatch(new GetTemplateInfo(true)).toPromise();
            this.toaster.success('Added new question successfully!');
          });
      }
      this.loading = false;
      close();
    }
  }

  setAttachmentQuestion(
    questionsList: any[] = [],
    attachmentQuestionsMap: any = {}
  ) {
    questionsList.forEach((question: any) => {
      if (
        question.push_index ===
          attachmentQuestionsMap[question.push_index]?.index &&
        attachmentQuestionsMap[question.push_index]
      ) {
        // has source details adding in question post payload
        question.text = question.question_text || question.text;
        question.source_document_details =
          attachmentQuestionsMap[question.push_index].source_document_details;
      }
      delete question.question_text;
    });
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
          template_id: this.localParams.templateId,
          dataType: 'Integer',
          dynamic_element:
            responseType.DynamicGrid === preview.type ? 'Row' : null,
          formulas_json: null,
          rows_columns,
        };
        return this.template.createQuestionsGrid(gridParams);
      } else if (
        preview.type == responseType.CheckBox ||
        preview.type == responseType.Dropdown
      ) {
        let params = {
          template_id: this.localParams.templateId,
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

  handleError(error) {
    this.loading = false;
    if (error.status === ERROR_CODES.CONFLICT) {
      this.SweetAlert.error({
        title: error.error.message,
        confirmButtonText: 'Refresh',
      }).then((isConfirm) => {
        if (isConfirm.value && isConfirm.value == true) {
          this.routerService.navigateWithParams(
            'app.diligence.template.preview',
            {
              templateId: this.localParams.templateId,
            }
          );
        }
      });
    } else if (error.error && error.error.message) {
      this.loading = false;
      this.SweetAlert.error({
        title: error.error.message,
        confirmButtonText: 'Okay',
      });
    }
  }

  handleSearchChange(searchTerm: string) {
    this.filters.name = searchTerm;
    this.searchByFilters();
  }
}
