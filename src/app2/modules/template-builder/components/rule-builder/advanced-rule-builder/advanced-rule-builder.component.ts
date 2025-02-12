import {
  Component,
  Input,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { keywordConstants } from 'src/app2/shared/constants/constant';
import { DvValidators } from 'src/app2/shared/validators/no-white-space.validator';
import { response_types_to_allow_for_score } from '../../../constants/responseType.constant';
import {
  globalOperators,
  ruleKeywordConstants,
} from '../dv-add-rule.constants';
import { RuleCardComponent } from '../rule-card/rule-card.component';

@Component({
  selector: 'advanced-rule-builder',
  templateUrl: './advanced-rule-builder.component.html',
  styleUrls: ['./advanced-rule-builder.component.css'],
})
export class AdvancedRuleBuilderComponent implements OnInit {
  templateId = 0;
  categories = [];
  subcategories = [];
  template;
  isFlagDisabled = false;

  //Injected into the modal by parent component
  @Input() templateRatingSchemeMapping: any;
  @Input() ratingScaleDefinition: any;
  @Input() questionWiseOptionList: any;
  @Input() onSaveCallBack;
  @Input() allQuestions: any;
  @Input() title: string;
  @Input() ruleData: any;
  @Input() displayQuestions: any;
  @Input() type = 'advanced';
  addRuleForm: FormGroup;

  globalOperators = globalOperators;

  entityTypes = [
    {
      id: keywordConstants.Question,
      name: 'Question',
    },
    {
      id: keywordConstants.Subcategory,
      name: 'Sub-category',
    },
    {
      id: keywordConstants.Category,
      name: 'Category',
    },
    {
      id: keywordConstants.Project,
      name: 'Project',
    },
  ];

  isDeleteRuleDisabled = true;
  rules = [];
  entities = [];
  ratingMode = null;
  selectedRateMap;
  scaleWidth;
  scoreRatingDisabledTooltip = null;
  entityTypeLabel: string;
  KeywordConstants = keywordConstants;

  @ViewChildren('ruleCard') ruleCards: QueryList<RuleCardComponent>;
  allowDecimalvalue = false;
  scoreBandErrorMessage =
    'Please enter a valid score between 0 to 100 (Without decimals)';
  disableRuleSection: boolean;
  disableBulkSection: boolean;

  constructor(
    private formBuilder: FormBuilder,
    private store: Store,
    private toaster: ToastrService
  ) {}

  ngOnInit(): void {
    let template = this.store.selectSnapshot((state) => {
      return state.template;
    });
    if (template) {
      this.templateId = template.templateId;
      this.categories = Object.values(template.categories);
      this.template = template.template;
    }

    this.subcategories = [].concat(
      ...(this.categories?.map((category) => Object.values(category.list)) ??
        [])
    );

    this.displayQuestions = this.displayQuestions
      .filter((question) =>
        response_types_to_allow_for_score.includes(question.responseType)
      )
      .map((question) => {
        let subcategory = this.subcategories.find(
          (item) => item.id == question.sectionID
        );

        return {
          id: question.id,
          name: question.text,
          responseType: question.responseType,
          group_id: question.group_id,
          sectionID: question.sectionID,
          groupName: `${subcategory.catName} > ${subcategory.name}`,
        };
      });

    this.entities = JSON.parse(JSON.stringify(this.displayQuestions));

    let initialConfig;
    if (!this.ruleData) {
      initialConfig = {
        globalOperator: ruleKeywordConstants.AND,
        entityType: keywordConstants.Question,
        entityId: this.entities?.length > 0 ? this.entities[0].group_id : null,
        flag: null,
        assignScore: null,
        score: null,
        naRating: false,
        allNAResponses: false,
        allBlankResponses: false,
      };
      this.rules = [
        {
          value_operator: null,
          values: [null],
          value_combination_operator: 0,
          source_entity_id: initialConfig.entityId,
          source_entity_type: keywordConstants.Question,
          match_type: null,
          match_operator: null,
          value_source: 'Response',
          value_source_params: null,
          diff_comparison_type: null,
        },
      ];
    } else {
      let entityType = this.ruleData.destination_entity_type;
      this.entityTypeLabel = this.entityTypes.find(
        (x) => x.id === entityType
      ).name;
      const isBulkNAAction =
        entityType != keywordConstants.Question && this.ruleData.is_na_rating;
      this.isFlagDisabled = entityType != keywordConstants.Question;
      initialConfig = {
        globalOperator: this.ruleData.global_operator,
        entityType: entityType,
        entityId: this.ruleData.destination_entity_id,
        flag: this.ruleData.has_flag,
        assignScore: this.ruleData.score != null,
        score: this.ruleData.score,
        naRating: !isBulkNAAction && this.ruleData.is_na_rating,
        allNAResponses:
          isBulkNAAction &&
          this.ruleData.parsed_rules.some(
            (x) => x.value_source === ruleKeywordConstants.NAResponse
          ),
        allBlankResponses:
          isBulkNAAction &&
          this.ruleData.parsed_rules.some(
            (x) => x.value_source === ruleKeywordConstants.BlankResponse
          ),
      };
      this.rules = JSON.parse(JSON.stringify(this.ruleData.parsed_rules));
      this.setEntitiesByEntityType(entityType);
    }
    this.isDeleteRuleDisabled = this.rules.length == 1;
    this.addRuleForm = this.formBuilder.group(initialConfig);
    if (this.isFlagDisabled) {
      this.addRuleForm.get('flag').disable({ onlySelf: true });
    } else {
      this.addRuleForm.get('flag').enable({ onlySelf: true });
    }
    if (this.ruleData) {
      // actions to disable in edit mode
      if (this.ruleData.score != null) {
        this.addRuleForm.get('naRating').disable({ onlySelf: true });
      }
      if (this.ruleData.is_na_rating) {
        this.addRuleForm.get('assignScore').disable({ onlySelf: true });
      }
      this.toggleDisableBulkSection();
      this.toggleDisableRuleSection();
    }
    this.handleOnEntityChange(initialConfig.entityId, false);
  }

  setValidators(config) {
    if (config.allNAResponses || config.allBlankResponses) {
      this.addRuleForm.get('globalOperator').setValidators([]);
      this.addRuleForm.get('entityType').setValidators([]);
      this.addRuleForm.get('entityId').setValidators([]);
      this.addRuleForm.get('score').setValidators([]);
    } else {
      this.addRuleForm
        .get('globalOperator')
        .setValidators([DvValidators.required]);
      this.addRuleForm.get('entityType').setValidators([DvValidators.required]);

      if (config.entityType != keywordConstants.Project) {
        this.addRuleForm.get('entityId').setValidators([DvValidators.required]);
      } else {
        this.addRuleForm.get('entityId').setValidators([]);
      }

      if (config.assignScore && !config.naRating) {
        const scoreValidators = [
          DvValidators.required,
          Validators.min(0),
          Validators.max(100),
        ];
        let allowDecimalScoreBands =
          this.selectedRateMap?.length &&
          this.selectedRateMap[0]?.allow_decimal_score_bands;
        if (allowDecimalScoreBands) {
          scoreValidators.push(DvValidators.isDecimal(null, 2));
          this.scoreBandErrorMessage =
            'Please enter a valid score between 0 to 100 (Maximum 2 decimal places are supported)';
        } else {
          scoreValidators.push(DvValidators.isPureNumber(null, 3));
          this.scoreBandErrorMessage =
            'Please enter a valid score between 0 to 100 (Without decimals)';
        }

        this.addRuleForm.get('score').setValidators(scoreValidators);
      } else {
        this.addRuleForm.get('score').setValidators([]);
      }
    }

    Object.values(this.addRuleForm.controls).forEach((control) =>
      control.updateValueAndValidity({
        onlySelf: true,
      })
    );
    this.addRuleForm.updateValueAndValidity();
    this.addRuleForm.markAsUntouched();
  }

  toggleDisableRuleSection() {
    if (
      this.addRuleForm.get('allNAResponses').value ||
      this.addRuleForm.get('allBlankResponses').value
    ) {
      this.disableRuleSection = true;
    } else {
      this.disableRuleSection = false;
    }
  }

  toggleDisableBulkSection() {
    if (
      this.addRuleForm.get('flag').value ||
      this.addRuleForm.get('naRating').value ||
      this.addRuleForm.get('assignScore').value
    ) {
      this.disableBulkSection = true;
      this.addRuleForm.get('allNAResponses').patchValue(false);
      this.addRuleForm.get('allBlankResponses').patchValue(false);
    } else {
      this.disableBulkSection = false;
    }
  }

  addRule() {
    let entityType = this.addRuleForm.get('entityType').value;
    this.rules.push({
      value_operator: null,
      values: [null],
      value_combination_operator: 0,
      source_entity_id:
        entityType == keywordConstants.Question
          ? this.addRuleForm.get('entityId').value ?? -1
          : -1,
      source_entity_type: keywordConstants.Question,
      match_type: null,
      match_operator: null,
      value_source: 'Response',
      value_source_params: null,
      diff_comparison_type: null,
      type: this.type,
    });
    this.isDeleteRuleDisabled = this.rules.length == 1;
  }

  setEntitiesByEntityType(entityType) {
    switch (entityType) {
      case keywordConstants.Question:
        this.entities = JSON.parse(JSON.stringify(this.displayQuestions));
        break;
      case keywordConstants.Subcategory:
        this.entities = JSON.parse(JSON.stringify(this.subcategories));
        break;
      case keywordConstants.Category:
        this.entities = JSON.parse(JSON.stringify(this.categories));
        break;
      case keywordConstants.Project:
        this.entities = null;
        break;
    }
  }

  handleOnEntityTypeChange(entityType) {
    this.isFlagDisabled = entityType != keywordConstants.Question;
    if (this.isFlagDisabled) {
      this.addRuleForm.get('flag').disable({ onlySelf: true });
    } else {
      this.addRuleForm.get('flag').enable({ onlySelf: true });
    }
    this.setEntitiesByEntityType(entityType);
    this.addRuleForm
      .get('entityId')
      .setValue(this.entities?.length > 0 ? this.entities[0].group_id : null);
    if (entityType != keywordConstants.Question) {
      this.addRuleForm.get('flag').setValue(false);
      this.disableRuleSection = false;
      this.disableBulkSection = false;
    }
    this.entityTypeLabel = this.entityTypes.find(
      (x) => x.id === entityType
    ).name;
    setTimeout(() => {
      this.handleOnEntityChange(
        this.entities?.length > 0 ? this.entities[0].group_id : null
      );
      if (!this.ruleData) {
        this.resetRules();
      }
    }, 0);
  }

  handleOnEntityChange(entityId, clearScore = true) {
    if (this.templateRatingSchemeMapping?.length > 0) {
      let ratingLevel = this.templateRatingSchemeMapping[0].rating_level;
      let ratingScaleMode = null;

      let entityType = this.addRuleForm.get('entityType').value;
      if (
        entityType == keywordConstants.Question &&
        ratingLevel != keywordConstants.Question
      ) {
        this.clearAndDisableAssignScore(
          'The rating/score map associated with this template allows assigning score/rating at sub-category level and above'
        );
      } else {
        let key = keywordConstants.Question;
        switch (entityType) {
          case keywordConstants.Question:
            key = keywordConstants.Question;
            break;
          case keywordConstants.Subcategory:
            let subcategory = this.subcategories.find(
              (element) => element.group_id == entityId
            );
            key = subcategory?.id;
            break;
          case keywordConstants.Category:
            let category = this.categories.find(
              (element) => element.group_id == entityId
            );
            key = category?.id;
            break;
          case keywordConstants.Project:
            key = keywordConstants.Project;
            break;
        }

        if (
          !(
            key in this.ratingScaleDefinition && this.ratingScaleDefinition[key]
          )
        ) {
          // using primary scale if secondary scale data is not available.
          key = keywordConstants.Question;
        }

        if (
          key in this.ratingScaleDefinition &&
          this.ratingScaleDefinition[key]
        ) {
          let rateMap = JSON.parse(
            JSON.stringify(this.ratingScaleDefinition[key])
          );
          rateMap.splice(0, 2); // remove N/A and N/R

          if (rateMap.length > 0) {
            ratingScaleMode = rateMap[0].scale_mode;
          }

          this.selectedRateMap = rateMap;
          this.scaleWidth = this.selectedRateMap.length * 30;

          this.ratingMode = {
            ratingLevel,
            ratingScaleMode,
          };
          this.scoreRatingDisabledTooltip = null;

          if (!this.addRuleForm.get('naRating').value) {
            this.addRuleForm.get('assignScore').enable();
          }
        } else {
          this.clearAndDisableAssignScore(
            'Rating/score scale is not available for the current configuration'
          );
        }

        if (clearScore) {
          this.addRuleForm.patchValue({
            assignScore: false,
            score: null,
          });
        }
      }
    } else {
      this.clearAndDisableAssignScore(
        'Please generate a rating/score map to assign score or rating from rules'
      );
    }

    setTimeout(() => {
      if (this.type == 'simple' && !this.ruleData) {
        this.resetRules();
      }

      this.setValidators(this.addRuleForm.value);
    }, 0);
  }

  clearAndDisableAssignScore(reasonTooltip) {
    this.addRuleForm.get('assignScore').disable();
    this.addRuleForm.get('naRating').disable();
    this.addRuleForm.patchValue({
      assignScore: false,
      score: null,
      naRating: false,
    });
    this.scoreRatingDisabledTooltip = reasonTooltip;
  }

  deleteRule(index) {
    this.rules.splice(index, 1);
    this.isDeleteRuleDisabled = this.rules.length == 1;
  }

  resetRules() {
    let entityType = this.addRuleForm.get('entityType').value;
    this.rules = [
      {
        value_operator: null,
        values: [null],
        value_combination_operator: 0,
        source_entity_id:
          entityType == keywordConstants.Question
            ? this.addRuleForm.get('entityId').value ?? -1
            : -1,
        source_entity_type: keywordConstants.Question,
        match_type: null,
        match_operator: null,
        value_source: 'Response',
        value_source_params: null,
        diff_comparison_type: null,
      },
    ];
  }

  getEntityScoreRules() {
    this.addRuleForm.markAllAsTouched();
    if (
      this.addRuleForm.value?.assignScore &&
      this.addRuleForm.value?.score == null
    ) {
      this.toaster.error(
        '',
        `Please assign a ${
          this.ratingMode?.ratingScaleMode == 'Absolute' ? 'rating' : 'score'
        }`
      );
    }
    if (
      this.addRuleForm.valid &&
      ((this.addRuleForm.value?.entityType == keywordConstants.Question &&
        this.addRuleForm.value?.flag) ||
        this.addRuleForm.getRawValue()?.assignScore ||
        this.addRuleForm.getRawValue()?.naRating ||
        this.addRuleForm.value?.allNAResponses ||
        this.addRuleForm.value?.allBlankResponses)
    ) {
      const element = this.addRuleForm.getRawValue();
      let rules = [];
      if (element.allNAResponses || element.allBlankResponses) {
        element.naRating = true;
        element.globalOperator = ruleKeywordConstants.OR;
        rules = this.setBulkNARules(element);
      } else {
        rules = this.ruleCards.map((ruleCard) => ruleCard.getRule());
      }
      if (rules.filter((rule) => rule === null).length) {
        return null;
      }

      if (
        rules.some(
          (rule) =>
            element.entityType == keywordConstants.Question &&
            rule.source_entity_id === element.entityId &&
            rule.source_entity_type === element.entityType &&
            rule.value_source === ruleKeywordConstants.BlankResponse &&
            (element.assignScore || element.flag || !element.naRating)
        )
      ) {
        this.toaster.error(
          '',
          'You can only exclude from rating for no response.'
        );
        return null;
      }

      let entityScoreRule: any = {
        has_flag:
          element.entityType == keywordConstants.Question &&
          (element.flag ?? false),
        score: element.assignScore ? element.score : null,
        is_na_rating: element.naRating,
        destination_entity_id: element.entityId,
        destination_entity_type: element.entityType,
        template_id: this.templateId,
        rules: JSON.stringify(rules),
        global_operator: element.globalOperator,
        template_version: this.template?.version,
        type: this.type,
      };

      if (this.title == 'Editing Rule') {
        entityScoreRule = {
          ...entityScoreRule,
          created_at: this.ruleData.created_at,
          created_by: this.ruleData.created_by,
          firm_id: this.ruleData.firm_id,
          id: this.ruleData.id,
          updated_at: new Date(),
          updated_by: this.ruleData.updated_by,
        };
      }
      return [entityScoreRule];
    } else if (this.addRuleForm.valid) {
      this.toaster.error('', 'Please set an action for the rule');
    }
    return null;
  }

  setBulkNARules(element: any) {
    const rules = [];
    if (element.allNAResponses) {
      rules.push({
        value_operator: 'eq',
        values: [],
        value_combination_operator: 0,
        source_entity_id: element.entityId,
        source_entity_type: element.entityType,
        match_type: null,
        match_operator: null,
        value_source: ruleKeywordConstants.NAResponse,
        value_source_params: null,
        diff_comparison_type: null,
      });
    }
    if (element.allBlankResponses) {
      rules.push({
        value_operator: 'eq',
        values: [],
        value_combination_operator: 0,
        source_entity_id: element.entityId,
        source_entity_type: element.entityType,
        match_type: null,
        match_operator: null,
        value_source: ruleKeywordConstants.BlankResponse,
        value_source_params: null,
        diff_comparison_type: null,
      });
    }
    return rules;
  }

  getColorCode(value) {
    let entityType = this.addRuleForm.get('entityType').value;
    let entityId = this.addRuleForm.get('entityId').value;
    let sectionId = -1;
    switch (entityType) {
      case keywordConstants.Question:
        let question = this.displayQuestions.find(
          (question) => question.group_id == entityId
        );
        sectionId = question?.sectionID;
        break;
      case keywordConstants.Subcategory:
        let subcategory = this.subcategories.find(
          (element) => element.group_id == entityId
        );
        sectionId = subcategory?.id;
        break;
      case keywordConstants.Category:
        let category = this.categories.find(
          (element) => element.group_id == entityId
        );
        sectionId = category?.id;
        break;
      case keywordConstants.Project:
        break;
    }
    let ratingObj;
    if (sectionId in this.ratingScaleDefinition) {
      ratingObj = this.ratingScaleDefinition[sectionId];
    } else {
      ratingObj = [];

      for (let section in this.ratingScaleDefinition) {
        let defaultRatingScaleItems = this.ratingScaleDefinition[
          section
        ].filter(
          (ratingScaleItem) =>
            ratingScaleItem.rating_scale_id ==
              this.templateRatingSchemeMapping[0].rating_scale_id &&
            ratingScaleItem.rating_scale_version ==
              this.templateRatingSchemeMapping[0].rating_scale_version
        );

        if (defaultRatingScaleItems?.length > 0) {
          ratingObj = JSON.parse(JSON.stringify(defaultRatingScaleItems));
          break;
        }
      }
    }
    let color;
    ratingObj.forEach((rating) => {
      if (value >= rating.range_min_value && value <= rating.range_max_value)
        color = rating.color_code;
    });
    return color;
  }

  submitRating(index) {
    if (index !== -1)
      this.addRuleForm.patchValue({
        score: this.selectedRateMap[index].value,
      });
    else {
      this.addRuleForm.patchValue({
        assignScore: false,
        score: null,
      });
    }
  }

  questionSearchFunction(term, question) {
    term = term?.toLowerCase();
    return (
      question?.groupName?.toLowerCase()?.includes(term) ||
      question?.name?.toLowerCase()?.includes(term)
    );
  }

  subcategorySearchFunction(term, subcategory) {
    term = term?.toLowerCase();
    return (
      subcategory?.catName?.toLowerCase()?.includes(term) ||
      subcategory?.name?.toLowerCase()?.includes(term)
    );
  }

  clearAllFieldsAfterSave() {
    this.addRuleForm.setValue({
      globalOperator: ruleKeywordConstants.AND,
      entityType: keywordConstants.Question,
      entityId: this.entities?.length > 0 ? this.entities[0].group_id : null,
      flag: null,
      assignScore: null,
      score: null,
      naRating: false,
      allNAResponses: false,
      allBlankResponses: false,
    });
    this.disableRuleSection = false;
    this.isFlagDisabled = false;

    this.setValidators(this.addRuleForm.value); // update appropriate validator on reset
  }
}
