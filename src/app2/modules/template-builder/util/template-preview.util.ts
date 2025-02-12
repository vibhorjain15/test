import { ResponseType } from '../../questionnaire/constants/Response-type.constant';
import { yearMonthDayFormat } from '../../questionnaire/util/date.util';
import { OperatorsEnum } from '../../questionnaire/util/question-status.util';

export const getQuestionsWithNestedObject = (nestedQuestions, allQuestions) => {
  let localNestedQuestionMap = {};
  let nestAdjencyList = {};
  let allQuestionsIdMap = {};
  let allNestedQuestionID = new Set();

  allQuestions.forEach((question) => {
    allQuestionsIdMap[question.id] = question;
  });
  nestedQuestions.forEach((nested) => {
    localNestedQuestionMap[nested.nestedQuestionId] = nested.questionID;
    if (nested.questionID in nestAdjencyList)
      nestAdjencyList[nested.questionID].push({
        operatorID: nested.operatorID,
        value: nested.value,
        nestedID: nested.nestedQuestionId,
      });
    else
      nestAdjencyList[nested.questionID] = [
        {
          operatorID: nested.operatorID,
          value: nested.value,
          nestedID: nested.nestedQuestionId,
        },
      ];
    allNestedQuestionID.add(nested.nestedQuestionId);
  });

  // Updating nested question
  Object.keys(nestAdjencyList).map((key) => {
    if (key in allQuestionsIdMap)
      nestAdjencyList[key].map(({ operatorID, value, nestedID }) => {
        if(nestedID in allQuestionsIdMap) {
          allQuestionsIdMap[nestedID]['parentQuestionId'] = key;
          allQuestionsIdMap[key].nestedQuestions.push({
            operatorID,
            value,
            nestedID: allQuestionsIdMap[nestedID],
          });
        }
      });
  });
  return Object.values(allQuestionsIdMap).filter((ques: any) => !ques.isNested);
};

export const isPreviewNestedQuestionValid = (
  fullquestion,
  operatorID,
  value
) => {
  let localEquator = null;
  let question = fullquestion.answer.attributes;
  question.responseType = fullquestion.responseType;
  if (
    question.responseType === ResponseType.Boolean ||
    question.responseType === ResponseType.BooleanPlus ||
    question.responseType === ResponseType.NoPlus
  ) {
    if (
      question.booleanResponse === null ||
      typeof question.booleanResponse === 'undefined'
    )
      return false;
    localEquator = `${question.booleanResponse}`;
  }
  if (
    question.responseType === ResponseType.Numeric ||
    question.responseType === ResponseType.Integer ||
    question.responseType === ResponseType.TextPhone ||
    question.responseType === ResponseType.Percentage
  ) {
    if (
      question.numericResponseA === null ||
      typeof question.numericResponseA === 'undefined' ||
      !question.numericResponseA
    )
      return false;
    localEquator = Number(question.numericResponseA);
    value = Number(value);
  }
  if (
    question.responseType === ResponseType.TextEmail ||
    question.responseType === ResponseType.Text ||
    question.responseType === ResponseType.TextMultiLine
  ) {
    if (
      question.textResponse === null ||
      typeof question.textResponse === 'undefined' ||
      !question.textResponse
    )
      return false;
    localEquator = `${question.textResponse}`;
  }
  if (question.responseType === ResponseType.Dropdown) {
    if (
      question.listValueID === null ||
      typeof question.listValueID === 'undefined' ||
      !question.listValueID
    )
      return false;
    localEquator = Number(question.listValueID[0]);
    value = Number(value);
  }
  if (question.responseType === ResponseType.Date) {
    if (
      question.dateResponse === null ||
      typeof question.dateResponse === 'undefined'
    )
      return false;
    localEquator = yearMonthDayFormat(
      (`${question.dateResponse}` as any).replaceAll('-', '/')
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
