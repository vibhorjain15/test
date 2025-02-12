import { DatePipe } from '@angular/common';
import { ResponseType } from '../constants/Response-type.constant';
import { QuestionAttributeType } from '../types/questions.type';
import { yearMonthDayFormat } from './date.util';
import { diligenceStatusConstant } from '../constants/quick-view-headers.constant';
import { DiligenceTypeEnum } from '../types/diligence-enum.type';

export const CheckResponseText = (question) => {
  if (
    question.responseType === ResponseType.Dropdown ||
    question.responseType === ResponseType.Dropdown
  ) {
    return question?.answer?.attributes?.listValueID?.length;
  }
  if (question.responseType === ResponseType.Attachment) {
    return question?.answer?.attributes?.attachmentIds?.length;
  }
  if (question.responseType === ResponseType.aumTable) {
    return question?.answer?.attributes?.aumTable_id;
  }
  if (question.responseType === ResponseType.ReturnTable) {
    return question?.answer?.attributes?.returnTable_id;
  }
  if (question.responseType === ResponseType.Date) {
    return question.answer.attributes?.dateResponse;
  }
  if (
    question.responseType === ResponseType.Grid ||
    question.responseType === ResponseType.DynamicGrid
  ) {
    return question?.answer?.attributes?.grid_responses?.length;
  }
  if (
    question.responseType === ResponseType.Bookends ||
    question.responseType === ResponseType.Numeric ||
    question.responseType === ResponseType.Identifier ||
    question.responseType === ResponseType.Integer ||
    question.responseType === ResponseType.TextPhone ||
    question.responseType === ResponseType.Percentage
  ) {
    return question?.answer?.attributes?.numericResponseA;
  }
  return question?.answer?.attributes?.responseText;
};

export const CanShowDeleteLink = (
  question,
  triggeredStartedComponentForReadonlyStatus
) => {
  let showDelete = false;
  if (triggeredStartedComponentForReadonlyStatus && question.isReadOnly) {
    return showDelete;
  }

  if (
    (question.responseType === ResponseType.Numeric ||
      question.responseType === ResponseType.Identifier ||
      question.responseType === ResponseType.Bookends ||
      question.responseType === ResponseType.TextPhone ||
      question.responseType === ResponseType.Integer ||
      question.responseType === ResponseType.Percentage) &&
    (question?.answer?.attributes.numericResponseA ||
      question?.answer?.attributes.textResponse)
  ) {
    showDelete = true;
  }
  if (
    (question.responseType === ResponseType.NoPlus ||
      question.responseType === ResponseType.BooleanPlus ||
      question.responseType === ResponseType.Boolean) &&
    (question?.answer?.attributes.booleanResponse != null ||
      question?.answer?.attributes.textResponse)
  ) {
    showDelete = true;
  }

  if (
    question.responseType === ResponseType.aumTable &&
    (question?.answer?.attributes.aumTable_id ||
      question?.answer?.attributes.textResponse)
  ) {
    showDelete = true;
  }
  if (
    (question.responseType === ResponseType.Dropdown ||
      question.responseType === ResponseType.CheckBox) &&
    (question?.answer?.attributes.listValueID?.length ||
      question?.answer?.attributes.textResponse)
  ) {
    showDelete = true;
  }
  if (
    (question.responseType === ResponseType.TextEmail ||
      question.responseType === ResponseType.Text ||
      question.responseType === ResponseType.TextMultiLine) &&
    question?.answer?.attributes.responseText
  ) {
    showDelete = true;
  }
  if (
    (question.responseType === ResponseType.Grid ||
      question.responseType === ResponseType.DynamicGrid) &&
    (question?.answer?.attributes.grid_responses?.length ||
      question?.answer?.attributes.textResponse)
  ) {
    showDelete = true;
  }
  if (
    question.responseType === ResponseType.Date &&
    (question?.answer?.attributes.dateResponse ||
      question?.answer?.attributes.textResponse)
  ) {
    showDelete = true;
  }
  return showDelete || !!question?.answer?.id;
};

export const canShowComments = (question, answer) => {
  return !(
    question.responseType === ResponseType.TextEmail ||
    question.responseType === ResponseType.Text ||
    question.responseType === ResponseType.TextMultiLine ||
    (answer.localBooleanResponse !== null &&
      question.responseType === ResponseType.NoPlus &&
      answer.localBooleanResponse === false) ||
    (answer.localBooleanResponse !== null &&
      question.responseType === ResponseType.BooleanPlus &&
      answer.localBooleanResponse)
  );
};

export enum OperatorsEnum {
  AnyChange = 2202,
  Contains = 2201,
  Equal = 1464,
  GreaterThan = 1466,
  GreaterThanOrEqualTo = 1468,
  LessThan = 1467,
  LessThanOrEqualTo = 1469,
  NotContains = 3011,
  NotEqualTo = 1465,
}

export const isNestedQuestionValid = (
  question: QuestionAttributeType,
  operatorID,
  value,
  localQuestionMap
) => {
  let localEquator = null;
  if (question.answer.attributes.localis_NA) return false;
  const id = `${question.sequenceID}-${question.sectionID}-${question.id}`;
  if (localQuestionMap[id]?.isResponseError) return false;
  if (localQuestionMap[id]?.is_NA) return false;
  if (
    question.responseType === ResponseType.Boolean ||
    question.responseType === ResponseType.BooleanPlus ||
    question.responseType === ResponseType.NoPlus
  ) {
    if (
      localQuestionMap[id]?.booleanResponse === null ||
      typeof localQuestionMap[id]?.booleanResponse === 'undefined'
    )
      return false;
    localEquator = `${localQuestionMap[id]?.booleanResponse}`;
  }
  if (
    question.responseType === ResponseType.Numeric ||
    question.responseType === ResponseType.Integer ||
    question.responseType === ResponseType.TextPhone ||
    question.responseType === ResponseType.Percentage
  ) {
    if (
      localQuestionMap[id]?.numericResponseA === null ||
      typeof localQuestionMap[id]?.numericResponseA === 'undefined'
    )
      return false;
    localEquator = Number(localQuestionMap[id]?.numericResponseA);
    value = Number(value);
  }
  if (
    question.responseType === ResponseType.TextEmail ||
    question.responseType === ResponseType.Text ||
    question.responseType === ResponseType.TextMultiLine
  ) {
    if (
      localQuestionMap[id]?.textResponse === null ||
      typeof localQuestionMap[id]?.textResponse === 'undefined'
    )
      return false;
    localEquator = `${extractTextFromElement(localQuestionMap[id]?.textResponse)}`;
  }
  if (question.responseType === ResponseType.Dropdown) {
    if (
      localQuestionMap[id]?.listValueID === null ||
      typeof localQuestionMap[id]?.listValueID === 'undefined'
    )
      return false;
    localEquator = Number(localQuestionMap[id]?.listValueID[0]);
    value = Number(value);
  }
  if (question.responseType === ResponseType.Date) {
    if (
      localQuestionMap[id]?.dateResponse === null ||
      typeof localQuestionMap[id]?.dateResponse === 'undefined'
    )
      return false;
    localEquator = yearMonthDayFormat(
      (`${localQuestionMap[id]?.dateResponse}` as any).replaceAll('-', '/')
    );
  }

  if (operatorID == OperatorsEnum.Equal) return localEquator === value;
  if (operatorID == OperatorsEnum.NotEqualTo) return localEquator !== value;
  if (operatorID == OperatorsEnum.AnyChange) return localEquator !== value;
  if (operatorID == OperatorsEnum.GreaterThan) return localEquator > value;
  if (operatorID == OperatorsEnum.GreaterThanOrEqualTo)
    return localEquator >= value;
  if (operatorID == OperatorsEnum.LessThan) return localEquator < value;
  if (operatorID == OperatorsEnum.LessThanOrEqualTo)
    return localEquator <= value;
  if (operatorID == OperatorsEnum.Contains)
    return `${localEquator}`.includes(`${value}`);
  if (operatorID == OperatorsEnum.NotContains)
    return !`${localEquator}`.includes(`${value}`);
};

export const containsHTML = (str)=> {
  const htmlRegex = /<\/?[a-z][\s\S]*>/i;
  return htmlRegex.test(str);
}


export const extractTextFromElement = (htmlString) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');

  function getTextContent(node) {
    let text = '';
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.nodeValue;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      for (let child of node.childNodes) {
        text += getTextContent(child);
      }
    }
    return text;
  }

  const allText = getTextContent(doc.body).trim();
  return allText;
}

export const initializeLocalGridMap = (question, localGridMap) => {
  let id = `${question.sequenceID}-${question.sectionID}-${question.id}`;
  if (!localGridMap[id]) {
    localGridMap[id] = {};
  }
  question?.answer?.attributes?.localgrid_responses?.map(
    ({
      row_id,
      column_id,
      value,
      mode,
      row_group_id,
      column_group_id,
      formula,
      is_aggregated,
    }) => {
      localGridMap[id][`${row_id}-${column_id}`] = {
        row_id,
        column_id,
        value,
        row_group_id,
        column_group_id,
        formula,
        is_aggregated,
      };
      if (mode) {
        localGridMap[id][`${row_id}-${column_id}`]['mode'] = mode;
      }
    }
  );
};

export const canSetDefaultRating = (store) => {
  let { user, questionnaire } = store.selectSnapshot((state) => state);
  return (
    user.currentUser.isInvestor &&
    !user.currentUser.isFreeSubscription &&
    ([
      diligenceStatusConstant.Evaluation,
      diligenceStatusConstant.Completed,
    ].includes(questionnaire.diligence?.status) ||
      questionnaire.diligence.isLocked ||
      questionnaire.diligence.diligence_type == DiligenceTypeEnum.dd_review)
  );
};
