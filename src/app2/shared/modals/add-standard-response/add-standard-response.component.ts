import { Component, Input, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';
import { UtilsService } from 'src/app2/services/utils.service';
import * as $ from 'jquery';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import { TemplateService } from 'src/app2/apis/template/template.service';

@Component({
  selector: 'add-standard-response',
  templateUrl: './add-standard-response.component.html',
  styleUrls: ['./add-standard-response.component.css'],
})
export class AddStandardResponseComponent implements OnInit {
  @Input() question: any;
  @Input() diligence: any;
  @Input() reviewMappingsData: any;
  @Input() success: any;
  standardText: any = {};
  templates = [];
  templateQuestions = [];
  selfResponses = [];
  loading: boolean;
  loadingData: boolean = true;
  mappedResponseTagsArray = [];
  mappedQuestionTagsArray = [];
  templateId: any;
  projectTags: any;
  mapped_responses = [];
  customTagsArr = [];
  mappedQuestions: any[] = [];
  constructor(
    private readonly templateService: TemplateService,
    private readonly toastrService: ToastrService,
    private readonly utilsService: UtilsService,
    private readonly questionnaireService: QuestionnaireService
  ) {}

  ngOnInit(): void {
    this.initialize();
  }

  initialize() {
    if (this.question) {
      this.templateId = this.diligence.template_id;
      this.createMappedQuestionsTags();

      const observables = [];
      observables.push(this.getStandardTextForQuestion());
      observables.push(this.getQuestionsWithTemplateId());
      observables.push(this.getAllWidgets());
      observables.push(this.getProjectTagValues());
      observables.push(this.getV2Responses());
      if (this.mappedQuestions.length) {
        observables.push(this.getMappedResponses());
      }

      forkJoin(observables).subscribe(
        ([
          standardText,
          questionsWithTemplateID,
          widgets,
          projectTags,
          v2Response,
          mappedResponses,
        ]) => {
          this.standardText = standardText;
          if (questionsWithTemplateID && questionsWithTemplateID) {
            this.templateQuestions = questionsWithTemplateID as Array<any>;
            Array.from(this.templateQuestions).map(
              (templateQuestion: { tag: string; group_id: string }) =>
                (templateQuestion.tag = 'self_' + templateQuestion.group_id)
            );
          }

          this.customTagsArr = widgets as Array<any>;
          this.projectTags = projectTags as Array<any>;

          if (v2Response) {
            this.selfResponses = v2Response as Array<any>;
            Array.from(this.selfResponses).map(
              (selfResponse: { tag: string; questionID: string }) =>
                (selfResponse.tag = 'self_' + selfResponse.questionID)
            );
          }

          if (mappedResponses && (mappedResponses as any[]).length) {
            this.createMappedResponsesTags(mappedResponses as any[]);
          }
          this.autoFillTags();
        }
      );
    }
  }

  createMappedQuestionsTags() {
    this.reviewMappingsData?.question_mappings
      ?.filter(
        (questionMapping) =>
          questionMapping.question_group_id === this.question.group_id
      )
      ?.map((questionMapping) => {
        questionMapping.mapped_questions?.map((mappedQuestion) => {
          const obj = {
            tag:
              questionMapping.mapped_template_id +
              '_' +
              mappedQuestion.question_group_id +
              '_1',
          };
          this.mappedQuestionTagsArray.push(obj);
          this.mappedQuestions.push(mappedQuestion);
        });
      });
  }

  getQuestionsWithTemplateId() {
    const params = {
      template_id: this.templateId,
    };
    return this.templateService.getQuestions(params);
  }

  getProjectTagValues() {
    return this.questionnaireService.getProjectTagsValues(this.diligence.id);
  }

  getV2Responses() {
    return this.questionnaireService.getDiligenceResponses(this.diligence.id);
  }

  getMappedResponses() {
    const mappedDiligenceIds = this.reviewMappingsData.mapped_diligences.map(
      (mappedDiligence) => mappedDiligence.id
    );
    return this.questionnaireService.getMappedQuestionResponses({
      mapped_question_ids: this.mappedQuestions.map(
        (question) => question.mapped_question_id
      ),
      mapped_diligence_ids: mappedDiligenceIds,
    });
  }

  getAllWidgets() {
    return this.templateService.getWidgets();
  }

  createMappedResponsesTags(mappedResponses: any[]) {
    const responsesMap: Map<number, any> = new Map();
    mappedResponses.forEach((response) => {
      const tag =
        response.template_id + '_' + response.question_group_id + '_1';
      if (responsesMap.get(response.question_group_id)) {
        let res = responsesMap.get(response.question_group_id);
        res.response = res.response + '<br>' + response.responseDisplay;
        responsesMap.set(response.question_group_id, res);
      } else {
        responsesMap.set(response.question_group_id, {
          tag,
          response: response.responseDisplay,
          questionId: response.question_group_id,
        });
      }
    });
    this.mappedResponseTagsArray = [...responsesMap.values()];
  }

  capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  autoFillTags() {
    if (this.standardText.text && this.standardText.text.length) {
      for (let responseTag of Array.from(this.mappedResponseTagsArray)) {
        if (this.standardText.html.indexOf(responseTag.tag) > -1) {
          let responseText = this.utilsService.extractTextBetweenParagraph(
            responseTag.response
          );
          this.standardText.html = this.utilsService.replaceGlobally(
            this.standardText.html,
            '{{' + responseTag.tag + '}}',
            responseText
          );
        }
      }

      for (let questionTag of Array.from(this.mappedQuestionTagsArray)) {
        if (this.standardText.html.indexOf(questionTag.tag) > -1) {
          this.standardText.html = this.utilsService.replaceGlobally(
            this.standardText.html,
            '{{' + questionTag.tag + '}}',
            ' '
          );
        }
      }

      for (let response of Array.from(this.selfResponses)) {
        if (this.standardText.html.indexOf(response.tag) > -1) {
          let responseText = this.utilsService.extractTextBetweenParagraph(
            response.responseDisplay
          );
          this.standardText.html = this.utilsService.replaceGlobally(
            this.standardText.html,
            '{{' + response.tag + '}}',
            responseText
          );
        }
      }

      for (let templateQues of Array.from(this.templateQuestions)) {
        if (this.standardText.html.indexOf(templateQues.tag) > -1) {
          this.standardText.html = this.utilsService.replaceGlobally(
            this.standardText.html,
            '{{' + templateQues.tag + '}}',
            ' '
          );
        }
      }

      for (const [key, value] of Object.entries(this.projectTags)) {
        if (
          `${this.standardText.html}`.indexOf(this.capitalizeFirstLetter(key)) >
          1
        ) {
          this.standardText.html = this.utilsService.replaceGlobally(
            this.standardText.html,
            '{{' + this.capitalizeFirstLetter(key) + '}}',
            value as string
          );
        } else {
          const str = '-';
          this.standardText.html = this.utilsService.replaceGlobally(
            this.standardText.html,
            '{{' + this.capitalizeFirstLetter(key) + '}}',
            str
          );
        }
      }
    }
    this.loadingData = false;
  }

  getStandardTextForQuestion() {
    return this.templateService.getStandardizedText(
      this.templateId,
      this.question.id
    );
  }

  countInstances(string, word) {
    return string.split(word).length - 1;
  }

  submit(modalCallback) {
    this.loading = true;
    if (this.standardText.text?.length) {
      for (let widget of Array.from(this.customTagsArr)) {
        if (this.standardText.text.indexOf(widget.tag) > -1) {
          if (widget.type === 'dropdown') {
            if ($('#' + widget.tag + '').val() !== undefined) {
              if (!$('#' + widget.tag + '').val()) {
                this.toastrService.error('Please select option in dropdown');
                this.loading = false;
                return;
              }
              $('#' + widget.tag + '').replaceWith(
                '<span>' + $('#' + widget.tag + '').val() + '</span>'
              );
            }
          } else {
            if ($('#' + widget.tag + '_date').val() !== undefined) {
              if (!$('#' + widget.tag + '_date').val()) {
                this.toastrService.error('Please select a date');
                this.loading = false;
                return;
              }
              $('#' + widget.tag + '_date').replaceWith(
                '<span>' + $('#' + widget.tag + '_date').val() + '</span>'
              );
            }
          }
          const count = this.countInstances(this.standardText.text, widget.tag);
          if (count > 0) {
            let i = 1;
            while (i <= count) {
              const newTag = '{{' + widget.tag + '_' + i + '}}';
              if (this.standardText.text.indexOf(newTag) > -1) {
                if (widget.type === 'dropdown') {
                  if ($('#' + widget.tag + '_' + i).val() !== undefined) {
                    if (!$('#' + widget.tag + '_' + i).val()) {
                      this.toastrService.error(
                        'Please select option in dropdown'
                      );
                      this.loading = false;
                      return;
                    }
                    $('#' + widget.tag + '_' + i).replaceWith(
                      '<span>' + $('#' + widget.tag + '_' + i).val() + '</span>'
                    );
                  }
                } else {
                  if (
                    $('#' + widget.tag + '_' + i + '_date').val() !== undefined
                  ) {
                    if (!$('#' + widget.tag + '_' + i + '_date').val()) {
                      this.toastrService.error('Please select a date');
                      this.loading = false;
                      return;
                    }
                    $('#' + widget.tag + '_' + i + '_date').replaceWith(
                      '<span>' +
                        $('#' + widget.tag + '_' + i + '_date').val() +
                        '</span>'
                    );
                  }
                }
              }
              i++;
            }
          }
        }
      }
    }
    this.success($('#preview').html());
    this.loading = false;
    modalCallback();
  }
}
