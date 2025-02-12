import { Component, OnDestroy, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { forkJoin } from 'rxjs';
import { take, tap } from 'rxjs/operators';
import { TemplateService } from 'src/app2/apis/template/template.service';
import { QuestionType } from 'src/app2/apis/template/types/question.type';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import {
  grid_widths_map,
  keywordConstants,
} from 'src/app2/shared/constants/constant';
import { operatorMap } from '../../constants/operators.constant';
import {
  GetCategories,
  GetTemplateInfo,
  UpdateTemplate,
} from '../../store/template-builder.action';
import { TemplateModel } from '../../store/template-builder.model';
import { TemplateState } from '../../store/template-builder.state';
import { RatingType } from './type/rating-type';
import { RuleType } from './type/rule.type';
import { ToastrService } from 'ngx-toastr';
import { responseType } from '../../constants/responseType.constant';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { ruleKeywordConstants } from '../../components/rule-builder/dv-add-rule.constants';
import { sortRules } from '../../util/scoring.util';
import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';

@Component({
  selector: 'scoring',
  templateUrl: './scoring.component.html',
  styleUrls: ['./scoring.component.css'],
})
export class ScoringComponent implements OnInit {
  loading = true;
  allRules = [];
  allSection: any = {};
  cols = [
    {
      width: grid_widths_map.lg_column_xxl,
      title: 'Rules Applied To',
      id: 'destination',
      alignment: 'left',
    },
    {
      width: grid_widths_map.lg_column_lg,
      title: 'Condition & Value',
      id: 'ruleConditionValue',
      alignment: 'center',
    },
    {
      width: grid_widths_map.sm_column_xm,
      title: 'Flag',
      id: 'flag',
      alignment: 'center',
    },
    {
      width: grid_widths_map.sm_column_xm,
      title: 'Score',
      id: 'scoreIcon',
      alignment: 'center',
    },
    {
      width: grid_widths_map.sm_column_xl,
      title: 'Last Updated At',
      id: 'lastUpdatedAt',
      alignment: 'center',
    },
  ];
  questionWiseOptionList: any = {};
  row = [];
  allQuestions = {};
  ratingScaleMap = {};
  templateRatingSchemeMapping: any = [];
  @Select(TemplateState.getTemplateID) templateId;
  @Select(TemplateState.getCategories) categoryData;
  displayQuestions: any = [];
  search: any;
  categories = {};
  scoringActionIcons = [
    {
      name: 'plus',
      key: 'plus',
      isDisabled: false,
      isPrimary: false,
      tooltip: 'Add New Rule',
      iconClass: 'space-on-right-xl',
    },
  ];
  constructor(
    private modal: CustomModalService,
    private template: TemplateService,
    private store: Store,
    private toastService: ToastrService,
    private sweetAlert: SweetAlertService,
    private utils: UtilsService,
    private dvDatePipe: DvDatePipe
  ) {}

  ngOnInit() {
    this.templateId.pipe(take(2)).subscribe((id) => {
      if (id) {
        this.store.dispatch(new GetTemplateInfo()).subscribe((state) => {
          this.store.dispatch(new GetCategories()).subscribe((state2) => {
            this.init();
          });
        });
      }
    });
  }

  async init() {
    let templateState: TemplateModel = this.store.selectSnapshot(
      (state) => state.template
    );

    await this.getAllQuestions(templateState).toPromise();
    // API CALLS TO GET INFO ABOUT TEMPLATE RATING AND SECTION-WISE RATING
    forkJoin([
      this.template.getTemplateRatingSchemeMapping(
        templateState.templateId,
        templateState.template.version
      ),
      this.template.getSectionRatingScales(templateState.templateId),
    ]).subscribe(
      async ([templateRatingSchemeMapping, sectionRatingScaleMapping]) => {
        this.templateRatingSchemeMapping = templateRatingSchemeMapping;
        if (this.templateRatingSchemeMapping?.length > 0) {
          let ratingScales = await this.template
            .getRatingScalesByRatingSchemeId(
              templateRatingSchemeMapping[0].rating_scheme_id
            )
            .toPromise();

          if (ratingScales != null) {
            for (var sectionId in sectionRatingScaleMapping) {
              this.ratingScaleMap[sectionId] =
                ratingScales[sectionRatingScaleMapping[sectionId]];
            }
            this.ratingScaleMap[keywordConstants.Question] =
              ratingScales[templateRatingSchemeMapping[0].rating_scale_id];
            this.ratingScaleMap[keywordConstants.Project] =
              ratingScales[
                templateRatingSchemeMapping[0].project_level_rating_scale_id
              ];
          }
        }
        this.getTemplateScoreRules(templateState);
      }
    );
  }

  getTemplateScoreRules(templateState) {
    this.template
      .getScoreRules(templateState.templateId, templateState.template.version)
      .subscribe((res: RuleType[]) => {
        this.categoryData.pipe(take(1)).subscribe((categories) => {
          if (categories)
            Object.values(categories).forEach((val: any) => {
              this.allSection = {
                ...this.allSection,
                ...val.list,
              };
              this.allSection[val.id] = val;
            });
          this.allRules = [];
          res.map((rule) => {
            this.renderRules(rule, false);
          });
          this.categories = JSON.parse(JSON.stringify(categories));
          this.row = sortRules(
            this.allRules,
            this.categories,
            this.displayQuestions
          );
          this.loading = false;
        });
      });
  }

  getRatingScaleColor(ratingScaleItems, value: number) {
    let selected = {
      color: '',
      name: '',
    };
    ratingScaleItems.forEach((val: RatingType) => {
      if (val.value == value && val.scale_mode == 'Absolute') {
        selected.color = val.color_code;
        selected.name = val.name;
      } else if (
        val.scale_mode == 'ScoreBand' &&
        val.range_min_value <= value &&
        val.range_max_value >= value
      ) {
        selected.color = val.color_code;
        selected.name = val.name;
      }
    });
    // TODO: this will added into new comp injected into table
    return `<div
    class="dd-score-display from-dir cursor-default"
    tooltip="${selected.name}"
    style="background-color: ${
      selected.color
    };color: ${this.utils.isColorLightOrDarkModified(selected.color)}"
  >
    <span>${value}</span>
  </div>`;
    // return `<dv-rating-chip tooltip="${selected.name}" color="${selected.color}"  label="${value}" ></dv-rating-chip>`;
  }

  handleAddRuleClick() {
    if (!this.loading)
      this.modal.invoke('add-rule', {
        initialState: {
          allQuestions: this.allQuestions,
          displayQuestions: this.displayQuestions,
          templateRatingSchemeMapping: this.templateRatingSchemeMapping,
          ratingScaleDefinition: this.ratingScaleMap,
          questionWiseOptionList: this.questionWiseOptionList,
          onSaveCallBack: (res) => {
            this.addRule(res);
            this.store.dispatch(new UpdateTemplate({}));
          },
        },
        class: 'modal-xl',
      });
  }

  handleEdit(info) {
    this.modal.invoke('add-rule', {
      initialState: {
        title: 'Editing Rule',
        allQuestions: this.allQuestions,
        displayQuestions: this.displayQuestions,
        ruleData: this.row[info.mainIndex].list[info.localIndex],
        templateRatingSchemeMapping: this.templateRatingSchemeMapping,
        ratingScaleDefinition: this.ratingScaleMap,
        questionWiseOptionList: this.questionWiseOptionList,
        onSaveCallBack: (res, isEdit) => {
          if (isEdit) this.renderRules(res, isEdit, info);
          else this.addRule(res);
          this.row = sortRules(
            this.allRules,
            this.categories,
            this.displayQuestions
          );
        },
      },
      class: 'modal-xl',
    });
  }

  addRule(ruleObj) {
    ruleObj.forEach((rule) => {
      this.renderRules(rule, false);
    });
    this.row = sortRules(this.allRules, this.categories, this.displayQuestions);
    this.store.dispatch(new UpdateTemplate({}));
    this.toastService.success('Rules added to the list');
  }

  renderRules(rule, isEdit, location?) {
    let newRule;
    let ratingScaleKey;
    let key;
    if (rule.destination_entity_type == keywordConstants.Question) {
      key = keywordConstants.Question + '-' + rule.destination_entity_id;
      let question = this.displayQuestions.find(
        (item) => item.group_id == rule.destination_entity_id
      );
      if (question != null) {
        let section = this.allSection[question.sectionID];
        if (section) {
          ratingScaleKey = keywordConstants.Question;
          let filter = [
            responseType.Boolean,
            responseType.BooleanPlus,
            responseType.NoPlus,
          ].includes(
            this.allQuestions[question.sectionID][question.id].responseType
          );
          let dateResponseType =
            this.allQuestions[question.sectionID][question.id].responseType ==
            responseType.Date;

          let destination = `<div><b>Question:</b> ${
            question.text
          }</div><div class='text-muted rule-meta-info'>${
            section.catName + ' > ' + section.label
          }</div>`;
          let ruleConditionValue;
          if (
            rule.type == 'standard' ||
            (rule.type == 'simple' &&
              rule.parsed_rules?.length == 1 &&
              rule.parsed_rules[0].value_source ==
                ruleKeywordConstants.Response)
          ) {
            ruleConditionValue =
              operatorMap[rule.parsed_rules[0].value_operator] +
                ' ' +
                rule.parsed_rules[0]?.values
                  .map((value) => {
                    return this.questionWiseOptionList[question.id] &&
                      this.questionWiseOptionList[question.id][value]
                      ? this.questionWiseOptionList[question.id][value].value
                      : filter && (value == 'true' || value == 'yes')
                      ? 'Yes'
                      : filter && (value == 'false' || value == 'no')
                      ? 'No'
                      : dateResponseType
                      ? new Date(value).toLocaleDateString()
                      : value;
                  })
                  ?.join() ?? '';
          } else {
            ruleConditionValue = '';
          }
          newRule = {
            ...rule,
            catName: section.catName,
            catId: section.catId,
            sub_cat: section.label,
            destination: destination,
            ruleConditionValue: ruleConditionValue,
          };
        }
      } else {
        // something is wrong with the entity score rule. not adding it to allRules list
        return;
      }
    } else if (
      rule.destination_entity_type == keywordConstants.Category ||
      rule.destination_entity_type == keywordConstants.Subcategory
    ) {
      key = rule.destination_entity_type + '-' + rule.destination_entity_id;
      let section: any = Object.values(this.allSection).find(
        (item: any) => item.group_id == rule.destination_entity_id
      );
      let destination;
      if (section) {
        ratingScaleKey = section.id;
        if (rule.destination_entity_type == keywordConstants.Subcategory) {
          destination = `<div><b>Sub-category:</b> ${section.label}</div><div class='text-muted rule-meta-info'>${section.catName}</div>`;
        } else {
          destination = '<div><b>Category:</b> ' + section.label + '</div';
        }
      } else {
        // something is wrong with the entity score rule. not adding it to allRules list
        return;
      }

      let ruleConditionValue;

      if (rule.type == 'standard') {
        ruleConditionValue =
          operatorMap[rule.parsed_rules[0].value_operator] +
            ' ' +
            rule.parsed_rules[0]?.values?.join() ?? '';
      }

      newRule = {
        ...rule,
        destination,
        ruleConditionValue,
      };
    } else if (rule.destination_entity_type == keywordConstants.Project) {
      key = keywordConstants.Project;
      ratingScaleKey = keywordConstants.Project;
      let ruleConditionValue;

      if (rule.type == 'standard') {
        ruleConditionValue =
          operatorMap[rule.parsed_rules[0].value_operator] +
            ' ' +
            rule.parsed_rules[0]?.values?.join() ?? '';
      }

      newRule = {
        ...rule,
        destination: 'Project',
        ruleConditionValue,
      };
    }

    if (rule.type == 'advanced') {
      newRule = {
        ...newRule,
        ruleConditionValue: null,
      };
    }

    newRule = {
      ...newRule,
      flagToolTip: rule.has_flag
        ? 'Flag will be triggered if this condition is met'
        : '',
      flag: `
          <i name="flag"
          class="${
            rule.has_flag ? 'text-danger' : 'dd-no-flag-set'
          } dvi dvi-flag text-danger">
          </i>
          `,
      scoreIcon:
        rule.score !== null &&
        (this.ratingScaleMap[ratingScaleKey] ||
          this.ratingScaleMap[keywordConstants.Question]) // Rating scale map for question is the primary rating scale of the rating scheme
          ? this.getRatingScaleColor(
              this.ratingScaleMap[ratingScaleKey] ||
                this.ratingScaleMap[keywordConstants.Question],
              +rule.score
            )
          : 'N/A',
      lastUpdatedAtToolTip: this.dvDatePipe.transform(
        rule.updated_at || rule.created_at,
        ['calendarTime']
      ),
      lastUpdatedAt: this.dvDatePipe.transform(
        rule.updated_at || rule.created_at
      ),
    };

    if (isEdit) {
      let index = this.allRules.findIndex((rule) => rule.id == newRule.id);
      if (index > -1) {
        this.allRules[index] = newRule;
      }
      this.row[location.mainIndex].list[location.localIndex] = newRule;
      this.toastService.success('Rule updated');
    } else {
      this.allRules.push(newRule);
    }
  }

  getSectionId(rule) {
    let sectionId = -1;
    switch (rule.destination_entity_type) {
      case keywordConstants.Question:
        let question = this.displayQuestions.find(
          (question) => question.group_id == rule.destination_entity_id
        );
        sectionId = question?.sectionID;
        break;
      case keywordConstants.Subcategory:
      case keywordConstants.Category:
        let section: any = Object.values(this.allSection).find(
          (element: any) => element.group_id == rule.destination_entity_id
        );
        sectionId = section?.id;
        break;
      case keywordConstants.Project:
        break;
    }

    return sectionId;
  }

  getAllQuestions(templateState) {
    return this.template
      .getQuestions({ template_id: +templateState.templateId })
      .pipe(
        tap((res: QuestionType[]) => {
          if (res.length) {
            let quesList = {};
            let sectionId = {};
            this.displayQuestions = res;
            res.forEach((question: QuestionType) => {
              quesList[question.id] = {
                ...question,
                label: question.text,
                isSelected: false,
              };
              if (
                question.responseType == 'CheckBox' ||
                question.responseType == 'Dropdown'
              ) {
                this.template
                  .getQuestionsOptions(question.id)
                  .subscribe((options: any) => {
                    this.questionWiseOptionList[question.id] = {};
                    options.forEach((option) => {
                      this.questionWiseOptionList[question.id][
                        option.dropdown_value_groupid
                      ] = {
                        id: option.dropdown_value_groupid,
                        value: option.dropdown_option_text,
                      };
                    });
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
            });
            this.allQuestions = { ...sectionId };
          }
        })
      );
  }

  handleDelete(info) {
    this.sweetAlert.confirm({
      title: 'Are you sure you want to delete this rule ?',
      confirmButtonText: 'Delete',
      showLoaderOnConfirm: true,
      preConfirm: () => {
        this.template
          .deleteScoreRules(this.row[info.mainIndex].list[info.localIndex].id)
          .subscribe(() => {
            let index = this.allRules.findIndex(
              (rule) =>
                rule.id == this.row[info.mainIndex].list[info.localIndex].id
            );
            if (index > -1) {
              this.allRules.splice(index, 1);
            }
            this.row = sortRules(
              this.allRules,
              this.categories,
              this.displayQuestions
            );

            this.store.dispatch(new GetTemplateInfo());
            this.toastService.success('Rule deleted');
          });
      },
    });
  }

  handleOnIconClick(iconKey: string) {
    if (iconKey === 'plus') {
      this.handleAddRuleClick();
    }
  }
}

