import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { TemplateService } from 'src/app2/apis/template/template.service';
import { QuestionType } from 'src/app2/apis/template/types/question.type';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { UtilsService } from 'src/app2/services/utils.service';
import {
  responseType,
  responseTypeList,
} from '../../constants/responseType.constant';
import {
  UpdateActivePanelId,
  UpdateLocalQuestion,
} from '../../store/template-builder.action';
import { getPreviewType } from '../edit-question-panel/edit-question.util';
import { MappingQuestionsType } from './type/mapping-question.type';

@Component({
  selector: 'configure-question-mapping',
  templateUrl: './configure-question-mapping.component.html',
  styleUrls: ['./configure-question-mapping.component.css'],
})
export class ConfigureQuestionMappingComponent implements OnInit {
  @Input() question: QuestionType;
  isFooter = false;
  loading = false;
  mappingForm: FormGroup;
  sourceTemplates = [];
  mappedQuestions = [];
  questionList = [];

  templateQuestions = [];
  QuestionSelectorDisplayParams = {
    id: 'id',
    name: 'text',
  };
  filterParams = {
    section_id: 'sectionID',
  };
  sectionFilterSource = {};

  payloadMetaData = {};
  mappedTempDict = {};
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
  questionListLoader: boolean;
  emptyStateMessage = 'No question found';
  loader = false;

  constructor(
    private template: TemplateService,
    private store: Store,
    private toaster: ToastrService,
    private readonly SweetAlert: SweetAlertService,
    private readonly panel: SidePanelService,
    private util: UtilsService
  ) {}
  ngOnInit(): void {
    this.payloadMetaData = {
      question_id: this.question.id,
      section_id: this.question.sectionID,
      template_id: +this.store.selectSnapshot(
        (state) => state.template.templateId
      ),
      template_version: this.store.selectSnapshot(
        (state) => state.template.template.version
      ),
    };

    this.mappingForm = new FormGroup({
      sourceTemplate: new FormControl(null),
      selectedQuestions: new FormControl([]),
    });
    if (this.question.has_mapped_questions)
      this.template
        .getMappedQuestions(
          this.store.selectSnapshot((state) => state.template.templateId),
          this.question.id
        )
        .subscribe((questions: MappingQuestionsType[]) => {
          this.updateMappedQuestions(questions);
          this.isFooter = false;
        });
    this.loader = true;
    this.template.getAllTemplated().subscribe(
      (templates: any) => {
        this.sourceTemplates = templates.map((val) => ({
          id: val.templateInfo.id,
          name: val.templateInfo.name,
          version: val.version,
        }));
        this.sourceTemplates.sort((a, b) => {
          let fa = a.name.toLowerCase(),
            fb = b.name.toLowerCase();

          if (fa < fb) {
            return -1;
          }
          if (fa > fb) {
            return 1;
          }
          return 0;
        });
        this.loader = false;
        if (!this.question.has_mapped_questions) {
          this.isFooter = true;
          this.templateQuestions = [];
        }
        this.handleSourceTemplateChange(this.sourceTemplates[0]);
      },
      () => {
        this.loader = false;
      }
    );
  }

  handleSourceTemplateChange(sourceTemplate) {
    this.mappingForm.patchValue({
      sourceTemplate,
    });
    this.questionListLoader = true;
    this.template
      .getQuestionsFromTemplateId(sourceTemplate.id)
      .subscribe((resp: any) => {
        let templateQuestions = [
          ...resp.map((val) => {
            if (val.isNested) {
              val.text = `${val.text} <span class="space-on-left badge badge-success"> Nested</span>`;
            }
            return { ...val, label: val.text };
          }),
        ];
        this.sectionFilterSource = {};
        let currentMappedQuestions =
          this.mappedQuestions.find((item) => item.id === sourceTemplate.id)
            ?.list ?? [];
        if (currentMappedQuestions.length > 0) {
          templateQuestions = templateQuestions.filter(
            (question) =>
              !currentMappedQuestions.find((item) => item.id === question.id)
          );
        }

        this.templateQuestions = templateQuestions.map((question) => {
          if (!(question.sectionID in this.sectionFilterSource)) {
            this.sectionFilterSource[question.sectionID] = {
              id: question.sectionID,
              name: question.section_name,
            };
          }
          let templateQuestion = {
            ...question,
            name: question.text,
            templateId: sourceTemplate.id,
            templateVersion: sourceTemplate.version,
          };

          if (
            this.questionList?.length > 0 &&
            this.questionList.find(
              (item) =>
                item.id === templateQuestion.id &&
                item.templateId === templateQuestion.templateId
            )
          ) {
            templateQuestion.is_selected = true;
          }

          return templateQuestion;
        });

        this.emptyStateMessage =
          resp.length > 0
            ? 'All questions in this template have already been mapped'
            : 'No question found';

        this.questionListLoader = false;
      });
  }

  handleQuestionChange(selectedQuestions) {
    if (!selectedQuestions.length) return;
    selectedQuestions.forEach((question) => {
      this.setInitalValuesBeforeEdit(question);
    });
    // the following logic retains selections from other templates, and only updates current template questions
    this.questionList = (
      this.questionList?.filter(
        (question) =>
          question.templateId != this.mappingForm.value.sourceTemplate.id
      ) ?? []
    ).concat([...selectedQuestions]);
    this.mappingForm.patchValue({
      selectedQuestions: [...this.questionList],
    });
  }

  setInitalValuesBeforeEdit(question) {
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
      question.previewOptions.options = question.options;
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
    question.label = question.text;
  }

  getQuestionOptions(question) {
    this.template.getQuestionsOptions(question.id).subscribe((res: any) => {
      this.previewData = {
        ...this.previewData,
        responseType: question.responseType,
        ...getPreviewType(res, question.responseType),
      };
      question.options = this.previewData.options;
      question.previewOptions = {
        ...this.previewData,
        responseType: question.responseType,
      };
    });
  }

  getQuestionGrid(question) {
    this.template
      .getQuestionsGrid(question.grid_id, question.grid_version)
      .subscribe(
        (res) => {
          this.previewData = {
            ...this.previewData,
            responseType: question.responseType,
            ...getPreviewType(res, question.responseType),
          };
          question.previewOptions.rows = this.previewData.rows;
          question.previewOptions.columns = this.previewData.columns;
        },
        (e) => {
          this.loading = false;
        }
      );
  }

  handleDeleteClick(index) {
    let templateQuestionsIndex = this.templateQuestions.indexOf(
      this.templateQuestions.find(
        (question) => question.id == this.questionList[index].id
      )
    );
    if (templateQuestionsIndex >= 0) {
      this.templateQuestions = this.templateQuestions.map((question) => {
        if (question.id == this.questionList[index].id) {
          question.is_selected = false;
        }
        return question;
      });
      this.templateQuestions = [...this.templateQuestions];
    }
    this.questionList.splice(index, 1);
    this.mappingForm.patchValue({
      selectedQuestions: [...this.questionList]
    });
  }

  handleMappingDelete(mappingData) {
    let payload = {
      mapped_questions: mappingData.list.map((question) => ({
        mapped_question_id: question.id,
        mapped_section_id: question.sectionId,
      })),
      mapped_template_id: mappingData.id,
      mapped_template_version: mappingData.version,
      ...this.payloadMetaData,
    };
    this.SweetAlert.confirm({
      title: `Are you sure you want to delete this mapping?`,
      confirmButtonText: 'Confirm',
      preConfirm: async () => {
        await this.template.deleteQuestionMapping(payload).toPromise();
        delete this.mappedTempDict[mappingData.id];
        this.mappedQuestions = [...Object.values(this.mappedTempDict)];
        this.store.dispatch(
          new UpdateLocalQuestion(this.question.id, {
            has_mapped_questions: !!this.mappedQuestions.length,
          })
        );
        this.toaster.success('Question deleted successfully');
        this.SweetAlert.close();
      },
    });
  }

  handleQuestionDelete({ mappingData, questionData }) {
    let payload = {
      mapped_questions: [
        {
          mapped_question_id: questionData.id,
          mapped_section_id: questionData.sectionId,
        },
      ],
      mapped_template_id: mappingData.id,
      mapped_template_version: mappingData.version,
      ...this.payloadMetaData,
    };
    this.SweetAlert.confirm({
      title: `Are you sure you want to delete this mapping?`,
      confirmButtonText: 'Confirm',
      preConfirm: async () => {
        await this.template.deleteQuestionMapping(payload).toPromise();
        this.mappedTempDict[mappingData.id].list = this.mappedTempDict[
          mappingData.id
        ].list.filter((ques) => ques.id !== questionData.id);
        if (!this.mappedTempDict[mappingData.id].list.length)
          delete this.mappedTempDict[mappingData.id];
        this.mappedQuestions = [...Object.values(this.mappedTempDict)];
        this.store.dispatch(
          new UpdateLocalQuestion(this.question.id, {
            has_mapped_questions: !!this.mappedQuestions.length,
          })
        );
        this.toaster.success('Question deleted successfully');
        this.SweetAlert.close();
      },
    });
  }

  handleAddMapping() {
    this.isFooter = true;
    this.templateQuestions = [];
    this.handleSourceTemplateChange(this.sourceTemplates[0]);
  }
  handleOnCancelClick() {
    this.isFooter = false;
    if (!this.isFooter) {
      this.panel.close();
      this.store.dispatch(new UpdateActivePanelId(''));
    }
  }
  handleOnBackClick() {
    this.isFooter = false;
  }

  handleSaveClick() {
    const { selectedQuestions, sourceTemplate } = this.mappingForm.value;
    if (!selectedQuestions.length) {
      this.toaster.error('Please select atleast one question');
      return;
    }
    this.loading = true;
    let payload = [];
    let selectedTemplateIds = [
      ...new Set(selectedQuestions.map((question) => question.templateId)),
    ];
    selectedTemplateIds.forEach((templateId) => {
      let templatePayload = {
        mapped_questions: selectedQuestions
          .filter((question) => question.templateId === templateId)
          .map((question) => ({
            mapped_question_id: question.id,
            mapped_section_id: question.sectionID,
          })),
        mapped_template_id: templateId,
        mapped_template_version: this.sourceTemplates.find(
          (template) => template.id === templateId
        ).version,
        ...this.payloadMetaData,
      };
      payload.push(templatePayload);
    });
    this.template.createQuestionMapping(payload).subscribe(
      (mapping: MappingQuestionsType[]) => {
        this.questionList = [];
        this.updateMappedQuestions(mapping);
        this.loading = false;
        this.isFooter = false;
        this.mappingForm.patchValue({
          selectedQuestions: [],
        });
        this.handleSourceTemplateChange(this.sourceTemplates[0]);
        this.toaster.success('Question saved successfully');
      },
      (e) => {
        this.loading = false;
      }
    );
  }

  updateMappedQuestions(mapping) {
    mapping.map(
      ({
        mapped_question_id,
        mapped_question_text,
        mapped_template_id,
        mapped_template_name,
        mapped_section_id,
        mapped_template_version,
      }: MappingQuestionsType) => {
        if (mapped_template_id in this.mappedTempDict) {
          this.mappedTempDict[mapped_template_id].list = [
            ...this.mappedTempDict[mapped_template_id].list,
            {
              id: mapped_question_id,
              text: mapped_question_text,
              sectionId: mapped_section_id,
            },
          ];
        } else {
          this.mappedTempDict[mapped_template_id] = {
            id: mapped_template_id,
            label: mapped_template_name,
            version: mapped_template_version,
            list: [
              {
                id: mapped_question_id,
                text: mapped_question_text,
                sectionId: mapped_section_id,
              },
            ],
            isOpen: false,
          };
        }
      }
    );
    this.mappedQuestions = [...Object.values(this.mappedTempDict)];
    this.store.dispatch(
      new UpdateLocalQuestion(this.question.id, {
        has_mapped_questions: !!this.mappedQuestions.length,
      })
    );
  }
}
