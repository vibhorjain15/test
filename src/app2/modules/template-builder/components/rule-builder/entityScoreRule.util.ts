import { keywordConstants } from 'src/app2/shared/constants/constant';
import { operatorMap } from '../../constants/operators.constant';
import { responseType } from '../../constants/responseType.constant';
import {
  entityTypeToText,
  ruleKeywordConstants,
  entityTypeToPluralText,
} from './dv-add-rule.constants';

export function getRuleDescription(
  rule,
  displayQuestions,
  allQuestions,
  allSection,
  questionWiseOptionList
) {
  let ruleString = 'If';
  let conditions = getRuleConditionTexts(
    rule,
    displayQuestions,
    allQuestions,
    allSection,
    questionWiseOptionList
  );

  return (
    ruleString +
    conditions.join(
      rule.global_operator == ruleKeywordConstants.AND ? ' and' : ' or'
    )
  );
}

export function getRuleConditionTexts(
  rule,
  displayQuestions,
  allQuestions,
  allSection,
  questionWiseOptionList
) {
  let conditions = [];
  rule.parsed_rules.forEach((condition, index) => {
    let question;
    let ruleString = '';
    if (condition.source_entity_id != null) {
      // non-composite condition
      ruleString +=
        ' the ' + entityTypeToText[condition.source_entity_type].toLowerCase();
      switch (condition.source_entity_type) {
        case keywordConstants.Question:
          question = displayQuestions.find(
            (item) => item.group_id == condition.source_entity_id
          );
          if (question) {
            ruleString += ` '${question.text}'`;
          }
          break;
        case keywordConstants.Category:
        case keywordConstants.Subcategory:
          let section: any = Object.values(allSection).find(
            (item: any) => item.group_id == rule.destination_entity_id
          );
          if (section) {
            if (condition.source_entity_type == keywordConstants.Subcategory) {
              ruleString += ` '${section.catName}'`;
            } else {
              ruleString += ` '${section.label}'`;
            }
          }
          break;
      }

      ruleString += ' has';
    } else {
      ruleString +=
        ' ' +
        operatorMap[condition.match_operator].toLowerCase() +
        ' ' +
        condition.match_value;
      if (condition.match_type == ruleKeywordConstants.Percentage) {
        ruleString += '% of';
      }
      ruleString += ' ' + entityTypeToPluralText[condition.source_entity_type];
      ruleString += ' from the';
      if (condition.value_source_params?.parent_entity_type) {
        ruleString +=
          ' ' +
          entityTypeToText[
            condition.value_source_params.parent_entity_type
          ].toLowerCase();
        if (condition.value_source_params.parent_id) {
          switch (condition.value_source_params.parent_entity_type) {
            case keywordConstants.Category:
            case keywordConstants.Subcategory:
              let section: any = Object.values(allSection).find(
                (item: any) =>
                  item.group_id == condition.value_source_params.parent_id
              );
              if (section) {
                if (
                  condition.source_entity_type == keywordConstants.Subcategory
                ) {
                  ruleString += ` '${section.catName}'`;
                } else {
                  ruleString += ` '${section.label}'`;
                }
              }
              break;
          }
        }
      } else if (condition.value_source_params?.entity_group_ids) {
        ruleString +=
          ' list of ' + entityTypeToPluralText[condition.source_entity_type];
        condition.value_source_params.entity_group_ids.forEach(
          (entity_group_id, index) => {
            let entityNames = [];
            switch (condition.source_entity_type) {
              case keywordConstants.Question:
                let currentQuestion = displayQuestions.find(
                  (item) => item.group_id == entity_group_id
                );
                if (currentQuestion) {
                  entityNames.push(`'${currentQuestion.text}'`);
                }
                break;
              case keywordConstants.Category:
              case keywordConstants.Subcategory:
                let section: any = Object.values(allSection).find(
                  (item: any) => item.group_id == entity_group_id
                );
                if (section) {
                  if (
                    condition.source_entity_type == keywordConstants.Subcategory
                  ) {
                    entityNames.push(section.catName);
                  } else {
                    entityNames.push(section.label);
                  }
                }
                break;
            }

            if (entityNames.length > 0) {
              ruleString += ' ' + entityNames.join(', ');
            }
          }
        );
      }

      ruleString += ' have a';
    }

    switch (condition.value_source) {
      case ruleKeywordConstants.Response:
        ruleString += ' response';
        break;
      case ruleKeywordConstants.ResponseHistory:
        ruleString += ' previous response';
        if (condition.diff_comparison_type != null) {
          ruleString +=
            condition.diff_comparison_type == ruleKeywordConstants.Absolute
              ? ' with an absolute difference'
              : ' with a percentage difference';
        }
        break;
      case ruleKeywordConstants.Rating:
        ruleString += ' score/rating';
        break;
      case ruleKeywordConstants.NAResponse:
        ruleString += ' response marked as N/A';
        break;
      case ruleKeywordConstants.BlankResponse:
        ruleString += ' no response';
        break;
    }

    if (
      ![
        ruleKeywordConstants.NAResponse,
        ruleKeywordConstants.BlankResponse,
      ].includes(condition.value_source)
    ) {
      ruleString += ' ' + operatorMap[condition.value_operator].toLowerCase();
    }

    if (
      condition.value_source == ruleKeywordConstants.ResponseHistory &&
      !condition.diff_comparison_type
    ) {
      ruleString += ' current response';
    } else {
      if (condition.values?.length > 1) {
        ruleString += ' any of';
      }

      let filter =
        question &&
        [responseType.Boolean, responseType.BooleanPlus].includes(
          allQuestions[question.sectionID][question.id].responseType
        );
      let dateResponseType =
        question &&
        allQuestions[question.sectionID][question.id].responseType ==
          responseType.Date;

      ruleString +=
        ' ' +
          condition.values
            .map((value) => {
              return question &&
                questionWiseOptionList[condition.source_entity_id] &&
                questionWiseOptionList[condition.source_entity_id][value]
                ? questionWiseOptionList[condition.source_entity_id][value]
                    .value
                : filter && (value == 'true' || value == 'yes')
                ? 'Yes'
                : filter && (value == 'false' || value == 'no')
                ? 'No'
                : dateResponseType
                ? new Date(value).toLocaleDateString()
                : value;
            })
            ?.join() ?? '';
    }

    conditions.push(ruleString);
  });
  return conditions;
}
