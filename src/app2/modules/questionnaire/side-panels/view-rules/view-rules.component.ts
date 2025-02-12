import {
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import { QuestionAttributeType } from '../../types/questions.type';
import {
  SetQuestionOptions,
  SetTemplateQuestions,
} from '../../store/questionnaire.action';
import { UtilsService } from 'src/app2/services/utils.service';
import { keywordConstants } from 'src/app2/shared/constants/constant';
import {
  getRuleConditionTexts,
} from 'src/app2/modules/template-builder/components/rule-builder/entityScoreRule.util';
import { TemplateService } from 'src/app2/apis/template/template.service';
import { ColorTheme } from 'src/app2/shared/themes/color.theme';

export type Rule = {
  isActive: Boolean;
  isFlagActive: Boolean;
  isScoreActive: Boolean;
  isNARating: boolean;
  score: Number;
  conditionTexts: string[];
  operator: string;
};
@Component({
  selector: 'view-rules',
  templateUrl: './view-rules.component.html',
  styleUrls: ['./view-rules.component.css'],
})
export class ViewRulesComponent implements OnInit, OnDestroy {
  @Input() question: QuestionAttributeType;
  @Input() isScoreband: boolean;
  @Input() ratingScales: any[];

  buttonLoader;
  loading = true;
  entityScoreRules = [];
  ruleList: Rule[] = [];
  displayQuestions = [];
  allQuestions = {};
  questionWiseOptionList = {};
  allSection = {};
  ratingColor;
  allSubscriptions = [];

  ColorTheme = ColorTheme;

  @Select((state) => state.questionnaire.entityScoreRules) entityScoreRules$;

  constructor(
    readonly panel: SidePanelService,
    private readonly store: Store,
    private readonly util: UtilsService,
    private readonly template: TemplateService
  ) {}

  async ngOnInit() {
    this.allSubscriptions.push(
      this.entityScoreRules$.subscribe(async (entityScoreRules) => {
        if (entityScoreRules) {
          this.entityScoreRules = entityScoreRules;

          if (this.entityScoreRules?.length > 0) {
            let questions = this.store.selectSnapshot(
              (state) => state.questionnaire.templateQuestions
            );
            if (!questions) {
              questions = await this.getAllQuestions(
                this.store.selectSnapshot(
                  (state) => state.questionnaire.diligence
                ).template_id
              );
              this.store.dispatch(new SetTemplateQuestions(questions));
            }

            let questionOptions = this.store.selectSnapshot(
              (state) => state.questionnaire.questionOptions
            );

            await this.initQuestionData(questions, questionOptions);

            let categories = this.store.selectSnapshot(
              (state) => state.questionnaire.categories
            );

            Object.values(categories).forEach((val: any) => {
              this.allSection = {
                ...this.allSection,
                ...val.list,
              };
              this.allSection[val.id] = val;
            });

            let rules = this.entityScoreRules
              .filter(
                (entityScoreRule) =>
                  entityScoreRule.destination_entity_type ==
                    keywordConstants.Question &&
                  entityScoreRule.destination_entity_id ==
                    this.question?.group_id
              )
              .map((entityScoreRule) => {
                let rule: Rule = {
                  isActive:
                    this.question?.answer?.attributes
                      ?.score_entity_score_rule_id == entityScoreRule.id ||
                    this.question?.answer?.attributes
                      ?.flag_entity_score_rule_id == entityScoreRule.id ||
                    this.question?.is_na_entity_score_rule_id ==
                      entityScoreRule.id,
                  conditionTexts: getRuleConditionTexts(
                    entityScoreRule,
                    this.displayQuestions,
                    this.allQuestions,
                    this.allSection,
                    this.questionWiseOptionList
                  ),
                  operator: entityScoreRule.global_operator,
                  isFlagActive:
                    entityScoreRule.has_flag &&
                    this.question?.answer?.attributes
                      ?.flag_entity_score_rule_id == entityScoreRule.id,
                  isScoreActive:
                    entityScoreRule.score != null &&
                    this.question?.answer?.attributes
                      ?.score_entity_score_rule_id == entityScoreRule.id,
                  isNARating:
                    entityScoreRule.is_na_rating &&
                    (this.question?.answer?.attributes
                      ?.score_entity_score_rule_id == entityScoreRule.id ||
                      this.question?.is_na_entity_score_rule_id ==
                        entityScoreRule.id),
                  score: entityScoreRule.score,
                };

                return rule;
              });
            this.ruleList = this.util.sortByAplha(rules, 'isActive').reverse();
          }
          this.loading = false;
        }
      })
    );
  }

  getAllQuestions(templateId) {
    return this.template.getQuestions({ template_id: templateId }).toPromise();
  }

  async initQuestionData(questions, questionOptions) {
    if (questions.length) {
      let quesList = {};
      let sectionId = {};
      this.displayQuestions = questions;

      for (let question of questions) {
        quesList[question.id] = {
          ...question,
          label: question.text,
          isSelected: false,
        };
        if (
          question.responseType == 'CheckBox' ||
          question.responseType == 'Dropdown'
        ) {
          let options: any = [];
          if (questionOptions && questionOptions[question.group_id]) {
            options = questionOptions[question.id];
          } else {
            if (!questionOptions) {
              questionOptions = {};
            }

            options = await this.template
              .getQuestionsOptions(question.id)
              .toPromise();
            questionOptions[question.id] = JSON.parse(JSON.stringify(options));
          }
          this.questionWiseOptionList[question.group_id] = {};
          options.forEach((option) => {
            this.questionWiseOptionList[question.group_id][
              option.dropdown_value_groupid
            ] = {
              id: option.dropdown_value_groupid,
              value: option.dropdown_option_text,
            };
          });
        }
        if (question.sectionID in sectionId) {
          let data = { [question.id]: quesList[question.id] };
          sectionId[question.sectionID] = {
            ...sectionId[question.sectionID],
            ...data,
          };
        } else {
          sectionId[question.sectionID] = {
            [question.id]: quesList[question.id],
          };
        }
      }
      this.allQuestions = { ...sectionId };
      this.store.dispatch(new SetQuestionOptions(questionOptions));
    }
  }

  getColorCode(value) {
    let ratingScaleItem = this.ratingScales.find(
      (rating) =>
        value >= rating.range_min_value && value <= rating.range_max_value
    );
    return (
      ratingScaleItem?.color_code ??
      (this.ratingScales?.length > 0 ? this.ratingScales[0].color_code : null)
    );
  }

  onCancel() {
    this.panel.close();
  }

  ngOnDestroy(): void {
    this.allSubscriptions.forEach((subscription) =>
      subscription?.unsubscribe()
    );
  }
}
