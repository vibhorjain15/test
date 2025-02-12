import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { ResponseType } from 'src/app2/modules/questionnaire/constants/Response-type.constant';
import { keywordConstants, Regex } from 'src/app2/shared/constants/constant';
import { DvValidators } from 'src/app2/shared/validators/no-white-space.validator';
import { responseType } from '../../../constants/responseType.constant';
import {
  changeTypes,
  compareList,
  diffTypes,
  entityTypes,
  matchTypes,
  signChangeOperatorSwitchMap,
  parentEntityTypes,
  ruleKeywordConstants,
  ruleTypes,
  yesNoList,
  responseTypes,
} from '../dv-add-rule.constants';

@Component({
  selector: 'rule-card',
  templateUrl: './rule-card.component.html',
  styleUrls: ['./rule-card.component.css'],
})
export class RuleCardComponent implements OnInit, OnChanges {
  addRuleForm: FormGroup;

  entities = [];
  conditions = [];
  values = [];
  parentEntities = [];
  entityTypes = entityTypes;
  valueSourceTypes = [];
  parentEntityTypes = [...parentEntityTypes];
  ruleTypes = [...ruleTypes];
  matchTypes = [...matchTypes];
  diffTypes = [...diffTypes];
  changeTypes = [...changeTypes];

  entityTypeToText = {
    Question: 'a question',
    Section: 'a category',
    Subsection: 'a sub-category',
  };

  selectedEntity;

  numericRegexMap = {
    numeric: Regex.numericResponse,
  };

  matchOperators = [
    { label: 'Equal To', value: 'eq' },
    { label: 'Not Equal To', value: 'noteq' },
    ...compareList,
  ];

  id = Math.random() + Math.random();
  maxDigitsAfterDecimalPoint = 2;

  ResponseType = ResponseType;
  KeywordConstants = keywordConstants;
  RuleKeywordConstants = ruleKeywordConstants;
  ResponseTypes = responseTypes;

  @Input() questions;
  @Input() categories;
  @Input() subcategories;
  @Input() rule;
  @Input() isDeleteDisabled = false;
  @Input() templateRatingSchemeMapping: any;
  @Input() ratingScaleDefinition: any;
  @Input() questionWiseOptionList: any;
  @Input() destinationEntityType = keywordConstants.Question;
  @Input() type = 'advanced';
  @Input() ratingMode;

  @Output() onDeleteRuleClick = new EventEmitter();

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.setEntityTypesByDestinationEntityType();
    this.entities = JSON.parse(JSON.stringify(this.questions));
    let initialConfig;

    if (!this.rule) {
      // If rule is not available, create default configuration
      initialConfig = {
        ruleType: 1,
        entityType: keywordConstants.Question,
        entity: this.entities?.length > 0 ? this.entities[0] : null,
        ratingSourceType: ruleKeywordConstants.Response,
        operator: null,
        value: null,
        diffType: null,
        matchOperator: null,
        matchValue: null,
        matchType: null,
        parentEntityType: null,
        parentEntityId: null,
        entityIds: null,
        isAggregateRule: false,
        changeType: null,
        responseType: null,
      };
    } else {
      let entityType = this.rule.source_entity_type;
      // populate entity selector based on entity type
      this.setEntities(entityType);
      let entity;
      if (this.rule.source_entity_id && this.rule.source_entity_id != -1) {
        switch (this.rule.source_entity_type) {
          case keywordConstants.Question:
            entity = this.questions.find(
              (question) => question.group_id == this.rule.source_entity_id
            );
            break;
          case keywordConstants.Subcategory:
            entity = this.subcategories.find(
              (subcategory) =>
                subcategory.group_id == this.rule.source_entity_id
            );
            break;
          case keywordConstants.Category:
            entity = this.categories.find(
              (category) => category.group_id == this.rule.source_entity_id
            );
            break;
        }
      } else if (
        this.entities?.length > 0 &&
        this.rule.source_entity_id == -1
      ) {
        // set default entity selection if source entity id is -1. this is set from advanced-rule-builder when a new rule is added
        entity = this.entities[0];
        this.rule.source_entity_id = entity.group_id;
      }

      let valueSourceType = this.rule.value_source;

      let value =
        this.rule?.values?.length > 1
          ? this.rule.values.join()
          : this.rule?.values?.length == 1
          ? this.rule.values[0]
          : null;

      if (
        valueSourceType == ruleKeywordConstants.Response &&
        entityType == keywordConstants.Question &&
        entity
      ) {
        value = this.getFormattedValue(entity.responseType, value);
      }

      let parentEntityType = this.rule.value_source_params?.parent_entity_type;
      let entityIds = this.rule.value_source_params?.entity_group_ids;
      if (!parentEntityType && entityIds != null) {
        switch (this.rule.source_entity_type) {
          case keywordConstants.Question:
            parentEntityType = ruleKeywordConstants.Questionlist;
            entityIds = entityIds.filter((id) =>
              this.questions.find((question) => question.group_id == id)
            );
            break;
          case keywordConstants.Subcategory:
            parentEntityType = ruleKeywordConstants.Subcategorylist;
            entityIds = entityIds.filter((id) =>
              this.subcategories.find(
                (subcategory) => subcategory.group_id == id
              )
            );
            break;
          case keywordConstants.Category:
            parentEntityType = ruleKeywordConstants.Categorylist;
            entityIds = entityIds.filter((id) =>
              this.categories.find((category) => category.group_id == id)
            );
            break;
        }
      }

      let changeType = null;
      let operator = this.rule.value_operator;
      if (this.rule.diff_comparison_type != null) {
        if (
          (value != null &&
            typeof value == 'string' &&
            value?.trim()?.length > 0 &&
            !isNaN(value.trim() as any)) ||
          typeof value == 'number'
        ) {
          let numericValue = parseFloat(value as any);
          if (numericValue >= 0) {
            changeType = ruleKeywordConstants.Increase;
          } else {
            changeType = ruleKeywordConstants.Decrease;
            value = -numericValue;
            operator = signChangeOperatorSwitchMap[operator];
          }
        }
      }

      initialConfig = {
        ruleType: this.rule.source_entity_id != null ? 1 : 2,
        isAggregateRule: this.rule.source_entity_id == null,
        entityType: entityType,
        entity: entity,
        ratingSourceType: valueSourceType,
        operator: operator,
        value: value,
        diffType: this.rule.diff_comparison_type,
        matchOperator: this.rule.match_operator,
        matchValue: this.rule.match_value,
        matchType: this.rule.match_type,
        parentEntityType: parentEntityType,
        parentEntityId: this.rule.value_source_params?.parent_id,
        entityIds: this.rule.value_source_params?.entity_group_ids
          ? [this.rule.value_source_params?.entity_group_ids]
          : null,
        changeType: changeType,
        responseType:
          this.rule.value_source_params?.parent_entity_type &&
          !this.rule.value_source_params?.response_type
            ? 'All'
            : this.rule.value_source_params?.response_type,
      };
    }

    this.addRuleForm = this.formBuilder.group(initialConfig);
    this.selectedEntity = this.addRuleForm.get('entity').value;
    this.setAllowedParentEntityTypes(initialConfig.entityType);
    if (initialConfig.parentEntityType) {
      this.setParentEntities(initialConfig.parentEntityType);
    }
    this.setAllowedValueSourceTypes(initialConfig.entityType);

    if (!this.selectedEntity) {
      this.selectedEntity = {
        id: null,
      };
    }
    setTimeout(() => {
      this.prepareDynamicUI(false);
      this.setValidators(initialConfig);
      // if single response type in aggregate rule, get formatted value according to that response type
      // but skip it for checkbox and dropdown since in aggregate rule, we take option text as value instead of id
      if (
        this.selectedEntity?.id == null &&
        this.selectedEntity?.responseType &&
        ![ResponseType.CheckBox, ResponseType.Dropdown].includes(
          this.selectedEntity.responseType
        )
      ) {
        let value =
          this.rule?.values?.length > 1
            ? this.rule.values.join()
            : this.rule?.values?.length == 1
            ? this.rule.values[0]
            : null;
        value = this.getFormattedValue(
          this.selectedEntity?.responseType,
          value
        );
        this.addRuleForm.patchValue({
          value,
        });
      }
    }, 0);
  }

  ngOnChanges(change: SimpleChanges) {
    if (change?.destinationEntityType) {
      this.setEntityTypesByDestinationEntityType();
    }
  }

  setValidators(config) {
    [
      this.addRuleForm.get('ruleType'),
      this.addRuleForm.get('entityType'),
      this.addRuleForm.get('ratingSourceType'),
      this.addRuleForm.get('operator'),
    ].forEach((formControl) => {
      formControl.setValidators(DvValidators.required);
    });

    if (
      ![
        ResponseType.Numeric,
        ResponseType.Integer,
        ResponseType.Percentage,
        'Decimal',
        ResponseType.TextEmail,
        ResponseType.TextPhone,
      ].includes(this.selectedEntity?.responseType)
    ) {
      // validators for the above types are set internally through dv-input. skipping those to avoid overwriting
      this.addRuleForm.get('value').setValidators([DvValidators.required]);
    }

    if (config.ruleType == 1) {
      this.addRuleForm.get('entity').setValidators([DvValidators.required]);
    } else {
      this.addRuleForm.get('entity').setValidators([]);
    }

    if (config.ruleType == 2) {
      this.addRuleForm
        .get('matchOperator')
        .setValidators([DvValidators.required]);
      this.addRuleForm
        .get('matchValue')
        .setValidators([DvValidators.required, DvValidators.isNumber('')]);
      this.addRuleForm.get('matchType').setValidators([DvValidators.required]);
      this.addRuleForm
        .get('parentEntityType')
        .setValidators([DvValidators.required]);
      if (
        ![
          keywordConstants.Project,
          ruleKeywordConstants.Questionlist,
          ruleKeywordConstants.Subcategorylist,
          ruleKeywordConstants.Categorylist,
        ].includes(config.parentEntityType)
      ) {
        this.addRuleForm
          .get('parentEntityId')
          .setValidators([DvValidators.required]);
        this.addRuleForm.get('entityIds').setValidators([]);
      } else {
        this.addRuleForm.get('parentEntityId').setValidators([]);
        if (config.parentEntityType != keywordConstants.Project) {
          this.addRuleForm
            .get('entityIds')
            .setValidators([DvValidators.required]);
        } else {
          this.addRuleForm.get('entityIds').setValidators([]);
        }
      }
    } else {
      this.addRuleForm.get('matchOperator').setValidators([]);
      this.addRuleForm.get('matchValue').setValidators([]);
      this.addRuleForm.get('matchType').setValidators([]);
      this.addRuleForm.get('parentEntityType').setValidators([]);
      this.addRuleForm.get('parentEntityId').setValidators([]);
      this.addRuleForm.get('entityIds').setValidators([]);
    }

    if (
      config.ratingSourceType == ruleKeywordConstants.ResponseHistory &&
      config.entityType == keywordConstants.Question &&
      this.selectedEntity?.responseType &&
      [
        ResponseType.Numeric,
        ResponseType.Integer,
        ResponseType.Percentage,
      ].includes(this.selectedEntity.responseType)
    ) {
      this.addRuleForm.get('diffType').setValidators([DvValidators.required]);
      this.addRuleForm.get('changeType').setValidators([DvValidators.required]);
    } else {
      this.addRuleForm.get('diffType').setValidators([]);
      this.addRuleForm.get('changeType').setValidators([]);
      this.addRuleForm.patchValue({
        diffType: null,
        changeType: null,
      });
    }

    if (
      config.ratingSourceType == ruleKeywordConstants.ResponseHistory &&
      config.entityType == keywordConstants.Question &&
      !(
        this.selectedEntity?.responseType &&
        [
          ResponseType.Numeric,
          ResponseType.Integer,
          ResponseType.Percentage,
        ].includes(this.selectedEntity.responseType)
      )
    ) {
      this.addRuleForm.get('value').setValidators([]);
    }

    if (
      config.ratingSourceType == ruleKeywordConstants.BlankResponse ||
      config.ratingSourceType == ruleKeywordConstants.NAResponse
    ) {
      this.addRuleForm.get('operator').setValidators([]);
      this.addRuleForm.get('value').setValidators([]);
      this.addRuleForm.get('diffType').setValidators([]);
      this.addRuleForm.get('changeType').setValidators([]);
    }

    Object.values(this.addRuleForm.controls).forEach((control) =>
      control.updateValueAndValidity({
        onlySelf: true,
      })
    );
    this.addRuleForm.updateValueAndValidity();
    this.addRuleForm.markAsUntouched();
  }

  setEntityTypesByDestinationEntityType() {
    // compute allowed entity types based on destination entity type
    switch (this.destinationEntityType) {
      case keywordConstants.Question:
        this.entityTypes = entityTypes.filter(
          (entityType) => entityType.id == keywordConstants.Question
        );
        break;
      case keywordConstants.Subcategory:
        this.entityTypes = entityTypes.filter((entityType) =>
          [keywordConstants.Question].includes(entityType.id)
        );
        break;
      case keywordConstants.Category:
        this.entityTypes = entityTypes.filter((entityType) =>
          [keywordConstants.Question, keywordConstants.Subcategory].includes(
            entityType.id
          )
        );
        break;
      case keywordConstants.Project:
        this.entityTypes = entityTypes.filter((entityType) =>
          [
            keywordConstants.Question,
            keywordConstants.Subcategory,
            keywordConstants.Category,
          ].includes(entityType.id)
        );
        break;
    }
  }

  setEntities(entityType) {
    switch (entityType) {
      case keywordConstants.Question:
        this.entities = JSON.parse(JSON.stringify(this.questions));
        break;
      case keywordConstants.Subcategory:
        this.entities = JSON.parse(JSON.stringify(this.subcategories));
        break;
      case keywordConstants.Category:
        this.entities = JSON.parse(JSON.stringify(this.categories));
        break;
    }
  }

  handleEntityTypeChange(entityType) {
    this.addRuleForm.get('entity').setValue(null);
    this.setEntities(entityType);
    this.setAllowedParentEntityTypes(entityType);
    this.setAllowedValueSourceTypes(entityType);

    if (this.entities?.length && this.addRuleForm.get('ruleType').value == 1) {
      // auto-select first entity in the list
      this.handleEntityChange(this.entities[0]);
      this.addRuleForm.patchValue({
        entity: this.selectedEntity,
        ratingSourceType: this.valueSourceTypes[0].id,
        value: null,
        parentEntityType: null,
        parentEntityId: null,
        entityIds: null,
      });
    } else if (this.addRuleForm.get('ruleType').value == 2) {
      // auto-select first parent entity type
      this.setParentEntities(this.parentEntityTypes[0].id);
      this.addRuleForm.patchValue({
        entity: null,
        ratingSourceType: this.valueSourceTypes[0].id,
        value: null,
        parentEntityType: this.parentEntityTypes[0].id,
        parentEntityId: this.parentEntities[0].group_id,
        entityIds: null,
      });
    }
    setTimeout(() => {
      this.prepareDynamicUI();
      this.setOperator();
      this.setValidators(this.addRuleForm.value);
    }, 0);
  }

  setAllowedValueSourceTypes(entityType) {
    if (entityType == keywordConstants.Question) {
      this.valueSourceTypes = [
        {
          id: ruleKeywordConstants.Response,
          name: 'Response',
        },
        {
          id: ruleKeywordConstants.ResponseHistory,
          name: 'Previous Response',
        },
        {
          id: ruleKeywordConstants.NAResponse,
          name: 'Response "marked as N/A"',
        },
      ];
      if (this.type != 'advanced') {
        this.valueSourceTypes.push({
          id: ruleKeywordConstants.BlankResponse,
          name: 'No Response',
        });
      }
      if (this.destinationEntityType != keywordConstants.Question) {
        this.valueSourceTypes.push({
          id: ruleKeywordConstants.Rating,
          name: 'Score / Rating',
        });
      }
    } else {
      this.valueSourceTypes = [
        {
          id: ruleKeywordConstants.Rating,
          name: 'Score / Rating',
        },
      ];
    }
  }

  setAllowedParentEntityTypes(entityType) {
    switch (entityType) {
      case keywordConstants.Question:
        this.parentEntityTypes = [
          ...parentEntityTypes.filter((entityType) =>
            [
              keywordConstants.Subcategory,
              keywordConstants.Category,
              keywordConstants.Project,
              ruleKeywordConstants.Questionlist,
            ].includes(entityType.id)
          ),
        ];
        break;
      case keywordConstants.Subcategory:
        this.parentEntityTypes = [
          ...parentEntityTypes.filter((entityType) =>
            [
              keywordConstants.Category,
              keywordConstants.Project,
              ruleKeywordConstants.Subcategorylist,
            ].includes(entityType.id)
          ),
        ];
        break;
      case keywordConstants.Category:
        this.parentEntityTypes = [
          ...parentEntityTypes.filter((entityType) =>
            [
              keywordConstants.Project,
              ruleKeywordConstants.Categorylist,
            ].includes(entityType.id)
          ),
        ];
        break;
    }
  }

  handleEntityChange(entity) {
    this.selectedEntity = entity;
    setTimeout(() => {
      this.prepareDynamicUI();
      this.setOperator();
      this.setValidators(this.addRuleForm.value);
    }, 0);
  }

  handleRuleTypeChange(isAggregateRule) {
    let ruleType = isAggregateRule ? 2 : 1;
    if (ruleType == 1) {
      this.addRuleForm.patchValue({
        parentEntityType: null,
        parentEntityId: null,
        entityIds: null,
        ruleType,
        matchType: null,
        matchOperator: null,
        matchValue: null,
        entity: this.entities?.length > 0 ? this.entities[0] : null,
        value: null,
      });
      if (this.entities?.length > 0) {
        setTimeout(() => this.handleEntityChange(this.entities[0]), 0);
      }
    } else {
      this.addRuleForm.patchValue({
        parentEntityType: this.parentEntityTypes[0].id,
        ruleType,
        entity: null,
        matchType: this.matchTypes[0].id,
        matchOperator: this.matchOperators[0].value,
        value: null,
      });
      this.selectedEntity = {
        id: null,
      };
      this.handleParentEntityTypeChange(this.parentEntityTypes[0].id);
    }
    setTimeout(() => this.setValidators(this.addRuleForm.value), 0);
  }

  handleMatchOperatorChange(matchOperator) {
    // update validations based on the latest configuration
    setTimeout(() => this.setValidators(this.addRuleForm.value), 0);
  }

  handleMatchTypeChange(matchType) {
    // update validations based on the latest configuration
    setTimeout(() => this.setValidators(this.addRuleForm.value), 0);
  }

  handleRatingSourceTypeChange(ratingSourceType) {
    setTimeout(() => {
      this.prepareDynamicUI();
      this.setOperator();
      this.setValidators(this.addRuleForm.value);
    }, 0);
  }

  setOperator() {
    let operator = this.addRuleForm.get('operator').value;
    let selectedCondition = this.conditions?.find(
      (condition) => condition.value == operator
    );
    if (
      this.conditions?.length > 0 &&
      (!operator || !selectedCondition || selectedCondition?.disabled)
    ) {
      this.addRuleForm.patchValue({
        operator: this.conditions[0].value,
      });
    }
  }

  setParentEntities(parentEntityType) {
    switch (parentEntityType) {
      case keywordConstants.Subcategory:
        this.parentEntities = JSON.parse(JSON.stringify(this.subcategories));
        break;
      case keywordConstants.Category:
        this.parentEntities = JSON.parse(JSON.stringify(this.categories));
        break;
    }
  }

  handleParentEntityTypeChange(parentEntityType) {
    this.addRuleForm.patchValue({
      parentEntityId: null,
      entityIds: null,
    });
    this.setParentEntities(parentEntityType);
    this.addRuleForm.patchValue({
      parentEntityId: this.parentEntities[0].group_id,
    });
    setTimeout(() => {
      this.prepareDynamicUI();
      this.setOperator();
      this.setValidators(this.addRuleForm.value);
    }, 0);
  }

  updateConditionsOnChange() {
    setTimeout(() => {
      this.prepareDynamicUI();
      this.setOperator();
    }, 0);
  }

  handleOperatorChange() {
    if (this.selectedEntity?.responseType == ResponseType.TextEmail) {
      setTimeout(
        // for email, the value type changes from email to text when the operator is changed to contains
        () => this.addRuleForm.get('value').updateValueAndValidity(),
        0
      );
    }
  }

  prepareDynamicUI(clearValue = true) {
    if (clearValue) {
      this.addRuleForm.patchValue({
        value: null,
      });
    }

    this.conditions = [
      { label: 'Equal To', value: 'eq' },
      { label: 'Not Equal To', value: 'noteq' },
    ];

    if (
      this.addRuleForm.get('ratingSourceType').value ==
      ruleKeywordConstants.Rating
    ) {
      this.conditions.push(...compareList);
    }

    let ruleType = this.addRuleForm.get('ruleType').value;

    let valueType;

    if (
      this.addRuleForm.get('entityType').value == keywordConstants.Question &&
      [
        ruleKeywordConstants.Response,
        ruleKeywordConstants.ResponseHistory,
      ].includes(this.addRuleForm.get('ratingSourceType').value)
    ) {
      if (ruleType == 1) {
        valueType = this.selectedEntity?.responseType;
      } else if (ruleType == 2) {
        let responseType = this.addRuleForm.get('responseType').value;
        if (
          responseType == null ||
          this.addRuleForm.get('parentEntityType').value ==
            ruleKeywordConstants.Questionlist
        ) {
          // In case of aggregate rules, determine if all the questions belong to same response type
          let commonValueType;
          switch (this.addRuleForm.get('parentEntityType').value) {
            case ruleKeywordConstants.Questionlist: {
              let questionGroupIds = this.addRuleForm.get('entityIds').value;
              if (questionGroupIds == null || questionGroupIds?.length == 0) {
                this.clearSelectedEntity();
                return;
              }
              let questionTypes = [
                ...new Set(
                  this.questions
                    .filter((question) =>
                      questionGroupIds.includes(question.group_id)
                    )
                    .map((question) => this.getResponseType(question))
                ),
              ];
              if (questionTypes?.length == 1) {
                commonValueType = questionTypes[0];
              } else {
                this.clearSelectedEntity();
                return;
              }
              break;
            }
            case keywordConstants.Subcategory: {
              if (this.addRuleForm.get('parentEntityId').value == null) {
                this.clearSelectedEntity();
                return;
              }
              let subcategory = this.subcategories.find(
                (item) =>
                  item.group_id == this.addRuleForm.get('parentEntityId').value
              );
              if (!subcategory) {
                this.clearSelectedEntity();
                return;
              }
              let questionTypes = [
                ...new Set(
                  this.questions
                    .filter((question) => question.sectionID == subcategory.id)
                    .map((question) => this.getResponseType(question))
                ),
              ];
              if (questionTypes?.length == 1) {
                commonValueType = questionTypes[0];
              } else {
                this.clearSelectedEntity();
                return;
              }
              break;
            }
            case keywordConstants.Category: {
              if (this.addRuleForm.get('parentEntityId').value == null) {
                this.clearSelectedEntity();
                return;
              }
              let category = this.categories.find(
                (item) =>
                  item.group_id == this.addRuleForm.get('parentEntityId').value
              );
              if (!category) {
                this.clearSelectedEntity();
                return;
              }
              let subcategoryIds = this.subcategories
                .filter((item) => item.parentID == category.id)
                .map((item) => item.id);
              let questionTypes = [
                ...new Set(
                  this.questions
                    .filter((question) =>
                      subcategoryIds.includes(question.sectionID)
                    )
                    .map((question) => this.getResponseType(question))
                ),
              ];
              if (questionTypes?.length == 1) {
                commonValueType = questionTypes[0];
              } else {
                this.clearSelectedEntity();
                return;
              }
              break;
            }
            case keywordConstants.Project: {
              let questionTypes = [
                ...new Set(
                  this.questions.map((question) =>
                    this.getResponseType(question)
                  )
                ),
              ];
              if (questionTypes?.length == 1) {
                commonValueType = questionTypes[0];
              } else {
                this.clearSelectedEntity();
                return;
              }
              break;
            }
          }
          this.selectedEntity = {
            responseType: commonValueType,
            id: null,
          };

          valueType = commonValueType;

          this.addRuleForm.patchValue({
            responseType:
              this.addRuleForm.get('parentEntityType').value !=
              ruleKeywordConstants.Questionlist
                ? valueType ?? 'All'
                : null,
          });
        } else {
          this.selectedEntity = {
            responseType: responseType == 'All' ? null : responseType,
            id: null,
          };
          valueType = responseType;
        }
      }
    }

    this.values = [];
    if (
      [
        ResponseType.Numeric,
        ResponseType.Integer,
        ResponseType.Percentage,
        ResponseType.Date,
      ].includes(valueType) &&
      [
        ruleKeywordConstants.Response,
        ruleKeywordConstants.ResponseHistory,
      ].includes(this.addRuleForm.get('ratingSourceType').value)
    ) {
      this.conditions.push(...compareList);
      if (
        this.addRuleForm.get('ratingSourceType').value ==
        ruleKeywordConstants.Response
      ) {
        this.conditions.push({
          label: 'Contains',
          value: 'cont',
          disabled: true,
          tooltip:
            ruleType == 1
              ? 'This condition is applicable only for text based questions'
              : 'This condition is applicable only if all the selected questions are text based',
        });
      }
    } else if (
      [
        ResponseType.Text,
        ResponseType.TextMultiLine,
        ResponseType.TextEmail,
        ResponseType.TextPhone,
      ].includes(valueType) &&
      this.addRuleForm.get('ratingSourceType').value ==
        ruleKeywordConstants.Response
    ) {
      this.conditions.push({ label: 'Contains', value: 'cont' });
      this.conditions.push(
        ...compareList.map((operator) => {
          return {
            ...operator,
            disabled: true,
            tooltip:
              ruleType == 1
                ? 'This condition is applicable only for numeric and date type questions'
                : 'This condition is applicable only if all the selected questions are either numeric or date type',
          };
        })
      );
    } else if (
      this.addRuleForm.get('ratingSourceType').value ==
      ruleKeywordConstants.Response
    ) {
      this.conditions.push({
        label: 'Contains',
        value: 'cont',
        disabled: true,
        tooltip:
          ruleType == 1
            ? 'This condition is applicable only for text based questions'
            : 'This condition is applicable only if all the selected questions are text based',
      });
      this.conditions.push(
        ...compareList.map((operator) => {
          return {
            ...operator,
            disabled: true,
            tooltip:
              ruleType == 1
                ? 'This condition is applicable only for numeric and date type questions'
                : 'This condition is applicable only if all the selected questions are either numeric or date type',
          };
        })
      );
    }
    // questionWiseList will only have ids of question with response type checkbox and dropdown
    if (this.questionWiseOptionList[this.selectedEntity.id])
      this.values = Object.values(
        this.questionWiseOptionList[this.selectedEntity.id]
      );
    else this.values = yesNoList;
  }

  clearSelectedEntity() {
    this.selectedEntity = {
      id: null,
      responseType: null,
    };
    let parentEntityType = this.addRuleForm.get('parentEntityType').value;
    if (
      this.addRuleForm.get('ruleType').value == 2 &&
      parentEntityType != null &&
      ![
        this.RuleKeywordConstants.Questionlist,
        this.RuleKeywordConstants.Subcategorylist,
        this.RuleKeywordConstants.Categorylist,
      ].includes(parentEntityType)
    ) {
      this.addRuleForm.patchValue({
        responseType: 'All',
      });
    } else {
      this.addRuleForm.patchValue({
        responseType: null,
      });
    }
  }

  getResponseType(question) {
    if (!question || !question.responseType) {
      return question?.responseType;
    }
    switch (question.responseType) {
      case ResponseType.Numeric:
      case ResponseType.Integer:
      case ResponseType.Percentage:
        return ResponseType.Numeric; // Combining these 3 types because they support the same operators
      case ResponseType.Text:
      case ResponseType.TextMultiLine:
      case ResponseType.TextEmail:
      case ResponseType.TextPhone:
        return ResponseType.Text; // Combining these types because they support the same operators
      case ResponseType.Boolean:
      case ResponseType.BooleanPlus:
      case ResponseType.NoPlus:
        return ResponseType.Boolean; // Combining these types because they support the same operators
      case ResponseType.CheckBox:
      case ResponseType.Dropdown:
        return ResponseType.Dropdown;
      default:
        return question.responseType;
    }
  }

  deleteRule() {
    if (!this.isDeleteDisabled) {
      this.onDeleteRuleClick.emit();
    }
  }

  getRule() {
    this.addRuleForm.markAllAsTouched();
    if (this.addRuleForm.valid) {
      let formValue = this.addRuleForm.value;
      let value = formValue.value;
      let operator = formValue.operator;
      let values = [];
      if (
        value != null &&
        (typeof value === 'string' || value instanceof String)
      ) {
        // split value by comma and prepare multiple value items
        values = value
          .split(',')
          .map((item) => item?.trim())
          .filter((item) => item.length);

        if (
          formValue.diffType != null &&
          formValue.changeType == ruleKeywordConstants.Decrease
        ) {
          values = values.map((val) => -val);
          operator = signChangeOperatorSwitchMap[operator];
        }
      } else if (value != null) {
        if (
          formValue.diffType != null &&
          formValue.changeType == ruleKeywordConstants.Decrease
        ) {
          value = -value;
          operator = signChangeOperatorSwitchMap[operator];
        }
        values = [value];
      }

      if (
        [
          ResponseType.Numeric,
          ResponseType.Integer,
          ResponseType.Percentage,
        ].includes(this.selectedEntity?.responseType)
      ) {
        values = values.map((item) => Number(item));
      }

      let parentEntityType = formValue.parentEntityType;
      if (
        [
          ruleKeywordConstants.Questionlist,
          ruleKeywordConstants.Subcategorylist,
          ruleKeywordConstants.Categorylist,
        ].includes(parentEntityType)
      ) {
        // these types only require entity group ids, not parent entity type
        parentEntityType = null;
      }
      let rule = {
        value_operator: operator,
        values,
        value_combination_operator: operator == 'noteq' ? 1 : 0, // use AND combination within values if operator is not equal to. else, use OR.
        source_entity_id: formValue.entity?.group_id,
        source_entity_type: formValue.entityType,
        match_type: formValue.matchType,
        match_operator: formValue.matchOperator,
        match_value: formValue.matchValue,
        value_source: formValue.ratingSourceType,
        value_source_params: {
          parent_id:
            parentEntityType != null &&
            parentEntityType != keywordConstants.Project
              ? formValue.parentEntityId
              : null,
          parent_entity_type: parentEntityType,
          response_type:
            parentEntityType != null &&
            formValue.entityType == keywordConstants.Question &&
            formValue.responseType != 'All'
              ? formValue.responseType
              : null,
          entity_group_ids:
            parentEntityType == null ? formValue.entityIds : null,
        },
        diff_comparison_type: formValue.diffType,
      };
      return rule;
    }
    return null;
  }

  getFormattedValue(currentResponseType, value) {
    // logic to match the id of value list to the data coming from backend
    let refinedVal = null;
    if (value != null) {
      if (currentResponseType === responseType.Date)
        refinedVal = new Date(value);
      else if (
        currentResponseType === responseType.Dropdown ||
        currentResponseType === responseType.CheckBox
      )
        refinedVal = +value;
      else if (value === 'true') refinedVal = true;
      else if (value === 'false') refinedVal = false;
      else refinedVal = value;
    }
    return refinedVal;
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
}
