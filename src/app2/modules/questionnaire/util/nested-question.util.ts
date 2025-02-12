import {
  DeleteLocalQuestionMap,
  DeleteQuestionData,
  UpdateLocalQuestionMap,
} from '../store/questionnaire.action';
import {
  DefaultQuestionState,
  LocalQuestionMapHelper,
  UpdateLocalQuestionState,
} from '../store/questionnaire.util';
import { QuestionAttributeType } from '../types/questions.type';
import { isNestedQuestionValid } from './question-status.util';

// this is for getting the current question
export const getCurrentQuestion = (
  question,
  requiredQuestion: QuestionAttributeType | any,
  questionData
) => {
  for (let index = 0; index < question.length; index++) {
    if (questionData.length) return;
    if (
      question[index].nestedID.id === requiredQuestion.id &&
      question[index].nestedID.sequenceID == requiredQuestion.sequenceID
    ) {
      questionData.push(question[index].nestedID);
      return;
    }
    if (question[index].nestedID.nestedQuestions?.length) {
      getCurrentQuestion(
        question[index].nestedID.nestedQuestions,
        requiredQuestion,
        questionData
      );
    }
  }
  return;
};

export const getCurrentQuestionObject = (
  questions,
  requiredQuestion: QuestionAttributeType | any,
  questionData,
  store,
  isQuestionFound,
  fromNow
) => {
  questions = questions.map((question) => {
    if (
      question.id == requiredQuestion.id &&
      question.sequenceID == requiredQuestion.sequenceID
    ) {
      question['icons'] = {
        leftIcons: [],
        rightIcons: [],
        leftLinks: [],
        rightLinks: [],
      };
      question = {
        ...question,

        answer: {
          attributes: DefaultQuestionState(),
        },
        showComment: false,
      };
      UpdateLocalQuestionState(question.answer, fromNow);
      question = JSON.parse(JSON.stringify(question));
      isQuestionFound = true;
    }
    if (question.nestedQuestions?.length) {
      question.nestedQuestions = updateNested(
        question.nestedQuestions,
        store,
        questionData,
        isQuestionFound,
        requiredQuestion,
        fromNow
      );
      isQuestionFound = false;
    }
    return question;
  });
  return questions;
};

export const updateNested = (
  nestedQuestions,
  store,
  questionData,
  isQuestionFound,
  requiredQuestion,
  fromNow
) => {
  nestedQuestions = nestedQuestions.map((question) => {
    const id = `${question.nestedID.sequenceID}-${question.nestedID.sectionID}-${question.nestedID.id}`;
    if (
      question.nestedID.id === requiredQuestion?.id &&
      question.nestedID.sequenceID == requiredQuestion?.sequenceID
    ) {
      question.nestedID = {
        ...question.nestedID,
        answer: {
          attributes: DefaultQuestionState(),
        },
        showComment: false,
        icons: {
          leftIcons: [],
          rightIcons: [],
          leftLinks: [],
          rightLinks: [],
        },
      };
      UpdateLocalQuestionState(question.nestedID.answer, fromNow);
      question.nestedID = deleteNestedQuestions(
        question.nestedID,
        store,
        questionData,
        fromNow
      );
    }

    if (isQuestionFound && question.nestedID.answer?.id) {
      store.dispatch(new DeleteLocalQuestionMap(id));
      questionData.push(
        new DeleteQuestionData(question.nestedID.sectionID, question.nestedID)
      );
      question.nestedID = {
        ...question.nestedID,

        answer: {
          attributes: DefaultQuestionState(),
        },
        showComment: false,
        icons: {
          leftIcons: [],
          rightIcons: [],
          leftLinks: [],
          rightLinks: [],
        },
      };
      UpdateLocalQuestionState(question.nestedID.answer, fromNow);
      store.dispatch(
        new UpdateLocalQuestionMap(
          id,
          LocalQuestionMapHelper(question.nestedID.answer)
        )
      );
    }
    if (question.nestedID.nestedQuestions?.length) {
      question.nestedID.nestedQuestions = updateNested(
        question.nestedID.nestedQuestions,
        store,
        questionData,
        isQuestionFound,
        requiredQuestion,
        fromNow
      );
    }
    return question;
  });
  return nestedQuestions;
};

export const deleteNestedQuestions = (
  question,
  store,
  questionData,
  fromNow
) => {
  if (question.nestedQuestions?.length) {
    question.nestedQuestions = updateNested(
      question.nestedQuestions,
      store,
      questionData,
      true,
      {},
      fromNow
    );
  }
  return question;
};

// this is for getting all the nested questions from the parent question
export const getAllNestedQuestionResponse = (
  currentQuestion,
  questionData,
  activeSectionId,
  store,
  checkDraft = false,
  parent: any = null
) => {
  const localQuestionMap = store.selectSnapshot(
    (state) => state.questionnaire.localQuestionMap
  );
  const draftData = store.selectSnapshot(
    (state) => state.questionnaire.draftData
  );
  for (let index = 0; index < currentQuestion.length; index++) {
    if (currentQuestion[index].nestedID.answer?.id) {
      const id = `${currentQuestion[index].nestedID.sequenceID}-${currentQuestion[index].nestedID.sectionID}-${currentQuestion[index].nestedID.id}`;
      if (checkDraft) {
        if (id in draftData) {
        } else {
          let nestedQuestion = currentQuestion[index];
          if (parent.isNested && !parent.isValid) {
            nestedQuestion.nestedID.isValid = false;
          } else
            nestedQuestion.nestedID.isValid = isNestedQuestionValid(
              parent,
              nestedQuestion.operatorID,
              nestedQuestion.value,
              localQuestionMap
            );
          if (
            !nestedQuestion?.nestedID?.isValid &&
            nestedQuestion?.nestedID?.answer?.id
          ) {
            questionData.push(
              new DeleteQuestionData(
                activeSectionId,
                currentQuestion[index].nestedID
              )
            );
            deleteMap.nestedMap[id] = { isDeleted: true };
          }
        }
      } else {
        store.dispatch(new DeleteLocalQuestionMap(id));
        questionData.push(
          new DeleteQuestionData(
            activeSectionId,
            currentQuestion[index].nestedID
          )
        );
        currentQuestion[index].nestedID = {
          ...currentQuestion[index].nestedID,

          answer: {
            attributes: DefaultQuestionState(),
          },
          showComment: false,
          icons: {
            leftIcons: [],
            rightIcons: [],
            leftLinks: [],
            rightLinks: [],
          },
        };
      }
    }
    if (currentQuestion[index].nestedID.nestedQuestions?.length) {
      getAllNestedQuestionResponse(
        currentQuestion[index].nestedID.nestedQuestions,
        questionData,
        activeSectionId,
        store,
        checkDraft,
        currentQuestion[index].nestedID
      );
    }
  }
  return;
};

export let deleteMap = {
  nestedMap: {},
};
