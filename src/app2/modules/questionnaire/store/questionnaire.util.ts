import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import { diligenceStatusConstant } from '../constants/quick-view-headers.constant';
import { DiligenceTypeEnum } from '../types/diligence-enum.type';
import { StateDiligenceUpdateType } from './questionnaire.modal';
import { ResponseType } from '../constants/Response-type.constant';

export const updateDiligenceData = (
  diligence: DiligenceType,
  userData
): DiligenceType & StateDiligenceUpdateType => {
  const locked_statuses = [
    diligenceStatusConstant.Approved,
    diligenceStatusConstant.NotApproved,
    diligenceStatusConstant.Deleted,
    diligenceStatusConstant.Retired,
    diligenceStatusConstant.Withdrawn,
  ];

  let review_enabled;
  if (diligence.is_internal) {
    if (
      diligence.status == diligenceStatusConstant.Completed ||
      diligence.status == diligenceStatusConstant.Evaluation
    )
      review_enabled = diligence.postsubmission_review_enabled;
    else review_enabled = diligence.presubmission_review_enabled;
  } else {
    if (
      userData.firmInfo.id == diligence.fromfirm_id &&
      diligence.status == diligenceStatusConstant.Evaluation
    )
      review_enabled = diligence.postsubmission_review_enabled;
    else if (
      userData.firmInfo.id == diligence.tofirm_id &&
      diligence.status == diligenceStatusConstant.InReview
    )
      review_enabled = diligence.presubmission_review_enabled;
  }

  const isReadonlyEditable =
    (diligence.status == diligenceStatusConstant.InReview && review_enabled) ||
    (userData.isManager && diligence.diligence_type == 'dd_profile');
  const isReadonlyNotEditable =
    diligence.status == diligenceStatusConstant.Evaluation && review_enabled;

  const { diligence_type, status, is_internal, isQuickFilter } = diligence;
  let readOnlyAccess = userData.isReadOnly;
  const alwaysOpen = diligence_type === DiligenceTypeEnum.dd_profile;
  let isLocked = locked_statuses.includes(status) && !alwaysOpen;
  if (userData.firmInfo.hasPermissionEnabled) readOnlyAccess = false;
  else isLocked = isLocked || readOnlyAccess;

  const isCompleted = status === diligenceStatusConstant.Completed;
  const hasReadOnlyAccess = readOnlyAccess;

  if (userData.isManager) {
    const isReadOnly =
      status === diligenceStatusConstant.Completed ||
      status === diligenceStatusConstant.PendingRestart ||
      status === diligenceStatusConstant.Evaluation;
    const review_allowed = !(
      !is_internal && status === diligenceStatusConstant.Completed
    );
    return {
      ...diligence,
      alwaysOpen,
      isLocked,
      isCompleted,
      hasReadOnlyAccess,
      isReadOnly,
      review_allowed,
      isQuickFilter,
      isReadonlyEditable,
      isReadonlyNotEditable,
      isEditable: isReadOnly && !isLocked,
    };
  }

  if (userData.isInvestor) {
    const notVisible =
      (status === diligenceStatusConstant.Started ||
        status === diligenceStatusConstant.ExtensionRequested ||
        status === diligenceStatusConstant.InReview) &&
      !is_internal &&
      !alwaysOpen;
    const isReadOnly =
      (status === diligenceStatusConstant.Completed ||
        status === diligenceStatusConstant.Followup ||
        status === diligenceStatusConstant.Evaluation ||
        status === diligenceStatusConstant.PendingRestart) &&
      !alwaysOpen;
    const review_allowed = !(
      !is_internal &&
      (status === diligenceStatusConstant.Started ||
        status === diligenceStatusConstant.Followup ||
        status === diligenceStatusConstant.ExtensionRequested)
    );

    return {
      ...diligence,
      alwaysOpen,
      isLocked,
      isCompleted,
      hasReadOnlyAccess,
      isReadOnly,
      review_allowed,
      notVisible,
      isQuickFilter,
      isReadonlyEditable,
      isReadonlyNotEditable,
      isEditable: isReadOnly && !isLocked,
      allowOnlyFollowups: notVisible && !!diligence.open_followups_count,
    };
  }
};

export const DefaultQuestionState = () => {
  return {
    is_NA: false,
    is_WIP: false,
    is_validation_required: false,
    localis_NA: false,
    localis_WIP: false,
    localis_validation_required: false,
    isAnswerReadonly: false,
    listValueID: null,
    aumTable_id: null,
    returnTable_id: null,
    textResponse: null,
    responseText: null,
    attachmentIds: null,
    numericResponseA: null,
    localNumericResponseA: null,
    numericResponseB: null,
    localNumericResponseB: null,
    booleanResponse: null,
    localAttachmentIds: null,
    localaumTable_id: null,
    localreturnTable_id: null,
    localgrid_responses: null,
    dateResponse: null,
    localDateResponse: null,
    localBooleanResponse: null, // Added only for local boolean state
    localTextResponse: null, // Added only for local comment state
    localResponseText: null, // Added only for local comment state
    localErrorState: null, // Added only for local error state
    otherExplanation: null,
    booleanExplanation: null,
    localbooleanExplanation: null,
    assignments: null,
    activeReviewStep: null,
    currentReviewer: null,
  };
};

export const UpdateLocalQuestionState = (question, fromNow) => {
  question.attributes.booleanExplanation = null;
  if (question.attributes.textResponse)
    question.attributes.textResponse = question.attributes.textResponse.replace(
      ' tox-comment--active',
      ''
    );
  if (
    (question.attributes.response_type === ResponseType.NoPlus &&
      question.attributes.booleanResponse === false) ||
    (question.attributes.response_type === ResponseType.BooleanPlus &&
      question.attributes.booleanResponse)
  ) {
    question.attributes.booleanExplanation = question.attributes.textResponse;
    question.attributes.textResponse = null;
  }

  question.attributes.grid_responses = question.attributes.grid_responses
    ?.filter((cell) => cell.mode != 'deleted') // removing deleted row cells
    ?.map(
      ({
        row_id,
        column_id,
        value,
        row_group_id,
        column_group_id,
        formula,
        is_aggregated,
      }) => {
        value = value ? value : null;
        return {
          row_id,
          column_id,
          value,
          row_group_id,
          column_group_id,
          formula,
          is_aggregated,
        };
      }
    );
  question.attributes['responseTimeStamp'] = question?.attributes
    ?.responseTimeStamp
    ? fromNow.transform(question?.attributes?.responseTimeStamp)
    : null;
  question.attributes.localTextResponse = question.attributes.textResponse;
  question.attributes.localBooleanResponse =
    question.attributes.booleanResponse;
  question.attributes.localaumTable_id = question.attributes.aumTable_id;
  question.attributes.localreturnTable_id = question.attributes.returnTable_id;
  question.attributes.localgrid_responses = question.attributes.grid_responses;
  question.attributes.localAttachmentIds = question.attributes.attachmentIds;
  question.attributes.localListValueID = question.attributes.listValueID;
  question.attributes.localResponseText = question.attributes.responseText;
  question.attributes.localDateResponse = question.attributes.dateResponse;
  question.attributes.localNumericResponseB =
    question.attributes.numericResponseB;
  question.attributes.localNumericResponseA =
    question.attributes.numericResponseA;

  question.attributes.localis_NA = question.attributes.is_NA;
  question.attributes.localis_WIP = question.attributes.is_WIP;
  question.attributes.localis_validation_required =
    question.attributes.is_validation_required;
  question.attributes.localErrorState = '';

  if (
    question.attributes.response_type === ResponseType.Dropdown ||
    question.attributes.response_type === ResponseType.CheckBox
  ) {
    question.attributes.isOther =
      question.attributes?.responseDisplay?.includes('Other') ?? false;
    if (question.attributes.isOther) {
      question.attributes.otherExplanation =
        question.attributes.localTextResponse;
      question.attributes.localTextResponse = null;
    }
  }
  if (question.attributes.response_type === ResponseType.TextMultiLine) {
    if (question.attributes.responseText)
      question.attributes.localResponseText =
        question.attributes.responseText.replace(' tox-comment--active', '');
  }
};

export const LocalQuestionMapHelper = (question) => {
  let textResponse = question.attributes.textResponse;
  if (
    (question.attributes.response_type === ResponseType.NoPlus &&
      question.attributes.booleanResponse === false) ||
    (question.attributes.response_type === ResponseType.BooleanPlus &&
      question.attributes.booleanResponse)
  ) {
    textResponse = question.attributes.booleanExplanation;
  }
  return {
    numericResponseA: question.attributes.numericResponseA,
    numericResponseB: question.attributes.numericResponseB,
    textResponse: textResponse,
    responseText: question.attributes.responseText,
    is_NA: question.attributes.is_NA,
    is_WIP: question.attributes.is_WIP,
    is_validation_required: question.attributes.is_validation_required,
    isResponseError: false,
    booleanResponse: question.attributes.booleanResponse,
    dateResponse: question.attributes.dateResponse,
    listValueID: question.attributes.listValueID,
    attachmentIds: question.attributes.attachmentIds,
    grid_responses: question.attributes.grid_responses,
    aumTable_id: question.attributes.aumTable_id,
    returnTable_id: question.attributes.returnTable_id,
  };
};

export const getParentNestedQuestion = (
  questionMap,
  sectionId,
  requiredQuestion
) => {
  Object.keys(questionMap[sectionId]).map((id) => {
    if (questionMap[sectionId][id]?.nestedQuestions?.length) {
      fetchNestedQuestion(
        questionMap[sectionId][id]?.nestedQuestions,
        requiredQuestion
      );
      questionMap[sectionId][id].nestedQuestions = JSON.parse(
        JSON.stringify(questionMap[sectionId][id]?.nestedQuestions)
      );
    }
  });
  return;
};

export const fetchNestedQuestion = (nestedQuestions, requiredQuestion) => {
  for (let index = 0; index < nestedQuestions.length; index++) {
    if (nestedQuestions[index].nestedID.id === requiredQuestion.id) {
      nestedQuestions[index].nestedID = {
        ...nestedQuestions[index].nestedID,

        answer: {
          attributes: DefaultQuestionState(),
        },
        showComment: false,
      };
      return;
    }
    if (nestedQuestions[index].nestedID.nestedQuestions?.length) {
      fetchNestedQuestion(
        nestedQuestions[index].nestedID.nestedQuestions,
        requiredQuestion
      );
    }
  }
  return;
};

export const getNestedQuestionObjectById = (
  questionMap,
  nestedQuestionMap,
  sectionId,
  questionId,
  parentQuestionId
) => {
  const questionChain = [questionId, +parentQuestionId];
  let mainParentQuestionId = +parentQuestionId;
  while (nestedQuestionMap[mainParentQuestionId]) {
    mainParentQuestionId = nestedQuestionMap[mainParentQuestionId];
    questionChain.push(mainParentQuestionId);
  }
  let question = questionMap[sectionId][mainParentQuestionId];
  for (let i = questionChain.length - 2; i >= 0; i--) {
    question = question.nestedQuestions?.find(
      (question) => question.nestedID.id === questionChain[i]
    )?.nestedID;
  }
  return question;
};
