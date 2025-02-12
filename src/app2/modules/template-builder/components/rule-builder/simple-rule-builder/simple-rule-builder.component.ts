import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import {
  responseType,
  response_types_to_allow_for_score,
} from '../../../constants/responseType.constant';
import { compareList, yesNoList } from '../dv-add-rule.constants';
import { keywordConstants, Regex } from 'src/app2/shared/constants/constant';

@Component({
  selector: 'simple-rule-builder',
  templateUrl: './simple-rule-builder.component.html',
  styleUrls: ['./simple-rule-builder.component.css'],
})
export class SimpleRuleBuilderComponent implements OnInit {
  loading = false;
  isEdit = false;
  templateId = 0;

  @Input() templateRatingSchemeMapping: any;
  @Input() ratingScaleDefinition: any;
  @Input() questionWiseOptionList: any;
  @Input() allQuestions: any;
  @Input() title: string;
  @Input() ruleData: any;
  @Input() displayQuestions: any;
  addRuleForm: FormGroup;
  selectedQuestionType: any;
  ratingMode: any;
  questionsList: any = [];
  allQuestionList: any = {};
  conditionList: any[] = [];
  valuesList: any[] = [];
  categoryList: any[] = [];
  subCategoryList: any[] = [];
  selectedRateMap: any[] = [];
  scaleWidth: number;
  template: any;

  numericRegexMap = {
    numeric: Regex.numericResponse,
  };

  constructor(private store: Store, private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    let parent = this;
    parent.categoryList = [];
    let template = this.store.selectSnapshot((state) => {
      return state.template;
    });
    if (template) {
      this.templateId = template.templateId;
      this.categoryList = Object.values(template.categories);
      this.template = template.template;
    }

    this.displayQuestions = this.displayQuestions.filter((question) =>
      response_types_to_allow_for_score.includes(question.responseType)
    );

    Object.values(this.displayQuestions).forEach((question: any) => {
      this.allQuestionList[question.group_id] = question;
    });

    this.questionsList = this.displayQuestions;
    if (this.templateRatingSchemeMapping)
      this.ratingMode = this.templateRatingSchemeMapping[0];
    this.initializeForm();

    if (this.title == 'Editing Rule') {
      this.handleEditRule();
    }
  }

  handleEditRule() {
    if (
      this.ruleData.destination_entity_type?.toLowerCase() == 'question' &&
      this.ruleData.destination_entity_id &&
      this.ruleData.parsed_rules?.length > 0 &&
      this.ruleData.parsed_rules[0].values?.length > 0
    ) {
      this.handleQuestionChange(
        this.allQuestionList[this.ruleData.destination_entity_id]
      );

      this.rulesFormGroups[0].patchValue({
        value: this.handleDifferentTypes(
          this.ruleData.parsed_rules[0].values[0]
        ),
        operator_id: this.ruleData.parsed_rules[0].value_operator,
        isResponseFlag: this.ruleData.has_flag,
        has_flag: this.ruleData.score != null,
        score: this.ruleData.score,
        scoreValue:
          this.ratingMode?.rating_scale_mode == 'Absolute' &&
          this.ratingScaleDefinition[
            this.allQuestionList[this.ruleData.destination_entity_id].sectionID
          ]
            ? this.ratingScaleDefinition[
                this.allQuestionList[this.ruleData.destination_entity_id]
                  .sectionID
              ].find((x) => x.value == this.ruleData.score)?.name
            : null,
      });
      if (this.ruleData.has_flag) {
        this.handleFlagChange(true, 0);
      } else this.handleFlagChange(false, 0);
      if (this.ruleData.score != null) this.handleScoreChange(true, 0);
      else this.handleScoreChange(false, 0);
    }
  }

  handleDifferentTypes(value) {
    // logic to match the id of value list to the data coming from backend
    let refinedVal;
    if (this.selectedQuestionType.responseType === 'Date')
      refinedVal = new Date(value);
    else if (
      this.selectedQuestionType.responseType === responseType.Dropdown ||
      this.selectedQuestionType.responseType === responseType.CheckBox
    )
      refinedVal = +value;
    else if (value === 'true') refinedVal = true;
    else if (value === 'false') refinedVal = false;
    else refinedVal = value;
    return refinedVal;
  }

  handleCategoryChange(data) {
    let parent = this;
    this.addRuleForm.patchValue({
      section_id: null,
      question_id: null,
    });
    parent.subCategoryList = [];
    parent.questionsList = [];
    Object.values(data.list).forEach((element) => {
      parent.subCategoryList.push(element);
    });
  }

  handleSubCategoryChange(data) {
    this.selectedQuestionType = null;
    this.questionsList = Object.values(this.allQuestionList).filter(
      (question: any) => question.sectionID == data.id
    );
  }

  handleQuestionChange(data) {
    this.rulesFormGroups[0].patchValue({
      value: null,
      operator_id: null,
    });
    this.selectedQuestionType = data;
    this.prepareDynamicUI();
    let n = this.conditions.length;
    for (let i = 1; i < n; i++) this.conditions.removeAt(i);
    this.addRuleForm.markAsUntouched();
  }

  prepareDynamicUI() {
    this.conditionList = [
      { label: 'Equals', value: 'eq' },
      { label: 'Not Equals', value: 'noteq' },
    ];
    this.valuesList = [];
    if (
      ['Numeric', 'Integer', 'Percentage', 'Date'].includes(
        this.selectedQuestionType.responseType
      )
    )
      this.conditionList.push(...compareList);
    else if (
      ['Text', 'TextMultiLine', 'TextEmail', 'TextPhone'].includes(
        this.selectedQuestionType.responseType
      )
    )
      this.conditionList.push({ label: 'Contains', value: 'cont' });
    // questionWiseList will only have ids of question with response type checkbox and dropdown
    if (this.questionWiseOptionList[this.selectedQuestionType.id])
      this.valuesList = Object.values(
        this.questionWiseOptionList[this.selectedQuestionType.id]
      );
    else this.valuesList = yesNoList;
    if (
      this.ratingMode &&
      this.ratingMode.rating_scale_mode == 'Absolute' &&
      this.ratingScaleDefinition[this.selectedQuestionType.sectionID]
    ) {
      let temp = JSON.parse(
        JSON.stringify(
          this.ratingScaleDefinition[this.selectedQuestionType.sectionID]
        )
      );
      temp.splice(0, 1);

      this.selectedRateMap = [temp];
      this.scaleWidth = this.selectedRateMap[0].length * 30;
    }
  }

  initializeForm() {
    this.addRuleForm = this.formBuilder.group({
      category: null,
      section_id: null,
      question_id: [
        this.allQuestionList[this.ruleData?.destination_entity_id],
        Validators.required,
      ],
      template_id: [this.templateId],
      filterBy: [false],
      conditions: new FormArray([]),
    });

    this.addRemoveCondition(true, -1);
    this.onFormChange();
  }

  addRemoveCondition(isAdd, index) {
    if (isAdd) {
      this.conditions.push(
        this.formBuilder.group({
          operator_id: [null, Validators.required],
          value: [null, Validators.required],
          isResponseFlag: [false, Validators.requiredTrue],
          has_flag: [false, Validators.requiredTrue],
          score: [null, [Validators.max(100), Validators.min(0)]],
          scoreValue: [null],
        })
      );

      if (this.ratingMode && this.ratingMode.rating_scale_mode == 'Absolute') {
        let temp;
        if (
          this.selectedQuestionType &&
          this.ratingScaleDefinition[this.selectedQuestionType.sectionID]
        )
          temp = JSON.parse(
            JSON.stringify(
              this.ratingScaleDefinition[this.selectedQuestionType.sectionID]
            )
          );
        else if (
          this.ruleData &&
          this.ratingScaleDefinition[
            this.allQuestionList[this.ruleData.question_id].sectionID
          ]
        )
          temp = JSON.parse(
            JSON.stringify(
              this.ratingScaleDefinition[
                this.allQuestionList[this.ruleData.question_id].sectionID
              ]
            )
          );

        if (temp) {
          temp.splice(0, 1);
          this.selectedRateMap.push(temp);
        }
      }
    } else {
      if (this.selectedRateMap) {
        this.selectedRateMap.pop();
      }
      this.conditions.removeAt(index);
    }
  }

  getEntityScoreRules() {
    this.addRuleForm.markAllAsTouched();
    if (this.addRuleForm.valid) {
      let rules = [];
      for (
        let index = 0;
        index < this.addRuleForm.value.conditions.length;
        index++
      ) {
        const element = this.addRuleForm.value.conditions[index];
        let rule = {
          has_flag: element.isResponseFlag,
          score: element.score,
          destination_entity_id: this.addRuleForm.value.question_id.group_id,
          destination_entity_type: keywordConstants.Question,
          template_id: this.addRuleForm.value.template_id,
          rules: JSON.stringify([
            {
              value_operator: element.operator_id,
              values: [
                typeof element.value === 'bigint'
                  ? element.value.toString()
                  : element.value,
              ],
              value_combination_operator: 0,
              source_entity_id: this.addRuleForm.value.question_id.group_id,
              source_entity_type: keywordConstants.Question,
            },
          ]),
          global_operator: 0,
          template_version: this.template.version,
          type: 'standard',
        };
        rules.push(rule);
      }
      if (this.title == 'Editing Rule') {
        rules = rules.map((rule) => {
          return {
            ...rule,
            created_at: this.ruleData.created_at,
            created_by: this.ruleData.created_by,
            firm_id: this.ruleData.firm_id,
            id: this.ruleData.id,
            updated_at: new Date(),
            updated_by: this.ruleData.updated_by,
          };
        });
      }

      return rules;
    }
    return null;
  }

  onFilterChange(val) {
    if (!val) {
      this.title = '';
      this.ngOnInit();
    }
  }

  onDateChange(event, index) {
    this.rulesFormGroups[index].patchValue({
      value: event,
    });
  }

  onFormChange(): void {
    this.addRuleForm.get('filterBy').valueChanges.subscribe((val) => {
      this.selectedQuestionType = null;
      this.addRuleForm.patchValue({
        question_id: null,
      });
      val
        ? (this.questionsList = [])
        : (this.questionsList = Object.values(this.allQuestionList));
    });
  }

  // for response flag change checkbox
  handleFlagChange(check, index) {
    if (!check) {
      this.rulesFormGroups[index].controls['has_flag'].setValidators([
        Validators.requiredTrue,
      ]);
    } else {
      this.rulesFormGroups[index].controls['has_flag'].setValidators([]);
    }
    this.rulesFormGroups[index].controls['has_flag'].updateValueAndValidity();
  }

  handleScoreChange(value, index) {
    if (!value) {
      this.rulesFormGroups[index].patchValue({
        score: null,
        scoreValue: null,
      });
      this.rulesFormGroups[index].controls['score'].setValidators([
        Validators.max(100),
        Validators.min(0),
      ]);
      this.rulesFormGroups[index].controls['isResponseFlag'].setValidators([
        Validators.required,
      ]);
    } else {
      this.rulesFormGroups[index].controls['score'].setValidators([
        Validators.required,
        Validators.max(100),
        Validators.min(0),
      ]);
      this.rulesFormGroups[index].controls['isResponseFlag'].setValidators([]);
    }
    this.rulesFormGroups[index].controls['score'].updateValueAndValidity();
    this.rulesFormGroups[index].controls[
      'isResponseFlag'
    ].updateValueAndValidity();
  }

  submitRating(index, mainIndex) {
    if (index !== -1)
      this.rulesFormGroups[mainIndex].patchValue({
        score: this.selectedRateMap[mainIndex][index].value,
        scoreValue: this.selectedRateMap[mainIndex][index].name,
      });
    else {
      this.rulesFormGroups[mainIndex].patchValue({
        has_flag: false,
        score: null,
        scoreValue: null,
      });
      this.handleScoreChange(false, mainIndex);
    }
  }

  get formControls() {
    return this.addRuleForm.controls;
  }
  get conditions() {
    return this.formControls.conditions as FormArray;
  }
  get rulesFormGroups() {
    return this.conditions.controls as FormGroup[];
  }

  getColorCode(value) {
    let ratingObj =
      this.ratingScaleDefinition[this.selectedQuestionType.sectionID];
    let color;
    ratingObj.forEach((rating) => {
      if (value >= rating.range_min_value && value <= rating.range_max_value)
        color = rating.color_code;
    });
    return color;
  }
}
