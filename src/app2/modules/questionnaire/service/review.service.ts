import { Injectable } from '@angular/core';
import { IconTypes } from '../types/card-icons.type';
import { UtilsService } from 'src/app2/services/utils.service';
import { Store } from '@ngxs/store';
import { QuestionnaireStatusService } from './status.service';
import { questionCardIcons } from '../constants/question-card-icons.constant';
import { yearMonthDayFormat } from '../util/date.util';
import { diligenceStatusConstant } from '../constants/quick-view-headers.constant';
import { Subject } from 'rxjs';
import { isNestedQuestionValid } from '../util/question-status.util';
import { HttpClient } from '@angular/common/http';
import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  reviewUpdate$ = new Subject<any>(); // for updating section level icons upon review action
  constructor(
    private util: UtilsService,
    private status: QuestionnaireStatusService,
    private readonly http: HttpClient,
    private dvDatePipe: DvDatePipe,
    private store: Store
  ) {}

  setAssignmentData(ques, assignments) {
    if (assignments && assignments[ques.answer.id])
      ques.answer.attributes.assignments = assignments[ques.answer.id];
    else ques.answer.attributes.assignments = null;
    if (
      ques.questionRating &&
      assignments &&
      assignments[ques.questionRating?.rating_id]
    )
      ques.questionRating.assignments =
        assignments[ques.questionRating.rating_id];
    else if (ques.questionRating) ques.questionRating.assignments = null;
  }

  setActiveReviewStepAndReviewer(ques, diligence) {
    ques.answer.attributes.activeReviewStep =
      ques.answer.attributes.assignments.steps.find((step) => {
        return step.status === diligenceStatusConstant.InReview;
      });

    ques.answer.attributes.currentReviewer = null;
    if (ques.answer.attributes.activeReviewStep) {
      const verifiers = ques.answer.attributes.activeReviewStep.assignments;
      ques.answer.attributes.currentReviewer = this.util.isAssignedToUser(
        verifiers,
        diligence.myFunction
      );
    }
  }

  rightLinksForReview(question, diligence) {
    let rightLinks = [];
    let reviewApproved = [];
    let reviewRejected = [];
    let reviewers = 0;
    if (question.assignments) {
      question.assignments?.steps.forEach((step) => {
        reviewers += step.assignments?.length;
        step.assignments.forEach((assign) => {
          if (assign.status === diligenceStatusConstant.ReviewFailed)
            reviewRejected.push(assign);
          else if (assign.status === diligenceStatusConstant.ReviewPassed)
            reviewApproved.push(assign);
        });
      });
      let lastFailed = reviewRejected.length;
      let lastPassed = reviewApproved.length;

      if (diligence.status === diligenceStatusConstant.Evaluation)
        this.linksForEvaluation(
          rightLinks,
          reviewRejected,
          reviewApproved,
          lastFailed,
          lastPassed,
          reviewers,
          question
        );
      else
        this.linksForInReview(
          rightLinks,
          reviewRejected,
          reviewApproved,
          lastFailed,
          lastPassed,
          reviewers,
          question
        );

      rightLinks.push({
        name: 'Review Status',
        key: 'reviewStatus',
        color: 'primary',
        icon: 'expand',
      });
    }

    return rightLinks;
  }

  linksForInReview(
    rightLinks,
    reviewRejected,
    reviewApproved,
    lastFailed,
    lastPassed,
    reviewers,
    question
  ) {
    if (lastFailed)
      rightLinks.push({
        name: `Revision Requested`,
        key: 'revisonRequested',
        color: 'red',
        type: 'italic',
        tooltip: `Revision Requested by ${this.util.getAssignedToName(
          reviewRejected[lastFailed - 1]
        )} on ${yearMonthDayFormat(
          reviewRejected[lastFailed - 1].completed_at + 'Z'
        )}`,
      });
    else if (lastPassed) {
      if (lastPassed === 1 || question.assignments.is_completed) {
        rightLinks.push({
          name: `Approved`,
          key: 'reviewed',
          color: question.assignments.is_completed ? 'green' : '',
          type: 'italic',
          tooltip: `Approved by ${this.util.getAssignedToName(
            reviewApproved[lastPassed - 1]
          )} on ${yearMonthDayFormat(
            reviewApproved[lastPassed - 1].completed_at + 'Z'
          )}`,
        });
      } else if (lastPassed > 1) {
        rightLinks.push({
          name: `Approved by ${lastPassed} out of ${reviewers}`,
          key: 'reviewed',
          type: 'italic',
          tooltip: `Last Approved by  ${this.util.getAssignedToName(
            reviewApproved[lastPassed - 1]
          )} on ${yearMonthDayFormat(
            reviewApproved[lastPassed - 1].completed_at + 'Z'
          )}`,
        });
      }
    }
  }

  linksForEvaluation(
    rightLinks,
    reviewRejected,
    reviewApproved,
    lastFailed,
    lastPassed,
    reviewers,
    question
  ) {
    if (lastFailed && lastPassed)
      rightLinks.push({
        name: `${lastPassed} Approved & ${lastFailed} Rejected out of ${reviewers}`,
        key: 'revisonRequested',
        type: 'italic',
        color: question.assignments.is_completed ? 'red' : '',
        tooltip: `Response Rejected by ${this.util.getAssignedToName(
          reviewRejected[lastFailed - 1]
        )} on ${yearMonthDayFormat(
          reviewRejected[lastFailed - 1].completed_at + 'Z'
        )}`,
      });
    else if (lastFailed) {
      if (lastFailed === 1 || question.assignments.is_completed)
        rightLinks.push({
          name: `Rejected`,
          key: 'revisonRequested',
          color: question.assignments.is_completed ? 'red' : '',
          type: 'italic',
          tooltip: `Response Rejected by ${this.util.getAssignedToName(
            reviewRejected[lastFailed - 1]
          )} on ${yearMonthDayFormat(
            reviewRejected[lastFailed - 1].completed_at + 'Z'
          )}`,
        });
      else if (lastFailed > 1)
        rightLinks.push({
          name: `Rejected ${
            lastFailed > 1 ? `by ${lastFailed} out of ${reviewers}` : ''
          }`,
          key: 'revisonRequested',
          color: question.assignments.is_completed ? 'red' : '',
          type: 'italic',
          tooltip: `Response Rejected by ${this.util.getAssignedToName(
            reviewRejected[lastFailed - 1]
          )} on ${yearMonthDayFormat(
            reviewRejected[lastFailed - 1].completed_at + 'Z'
          )}`,
        });
    } else if (lastPassed)
      if (lastPassed === 1 || question.assignments.is_completed)
        rightLinks.push({
          name: `Approved`,
          key: 'reviewed',
          color: question.assignments.is_completed ? 'green' : '',
          type: 'italic',
          tooltip: `Approved by ${this.util.getAssignedToName(
            reviewApproved[lastPassed - 1]
          )} on ${yearMonthDayFormat(
            reviewApproved[lastPassed - 1].completed_at + 'Z'
          )}`,
        });
      else if (lastPassed > 1)
        rightLinks.push({
          name: `Approved by ${lastPassed} out of ${reviewers}`,
          key: 'reviewed',
          type: 'italic',
          color: question.assignments.is_completed ? 'green' : '',
          tooltip: `Last Approved by ${this.util.getAssignedToName(
            reviewApproved[lastPassed - 1]
          )} on ${yearMonthDayFormat(
            reviewApproved[lastPassed - 1].completed_at + 'Z'
          )}`,
        });
  }

  reviewFromSection(status, questions, questionCard, callback) {
    questions.forEach((question: any, index) => {
      this.requestReview(
        question.nestedID ?? question,
        index,
        questionCard,
        status,
        callback
      );

      if ((question.nestedID ?? question).nestedQuestions?.length)
        this.reviewFromSection(
          status,
          (question.nestedID ?? question).nestedQuestions,
          questionCard,
          callback
        );
    });
  }

  requestReview(question, index, questionCard, status, callback) {
    let reviewObj: IconTypes = {
      key: '',
      name: '',
      label: '',
      type: '',
      isSection: true,
    };
    if (
      status === 'approve' &&
      question.icons.rightIcons.find((x) => x.key === 'approve') &&
      !question.icons.rightLinks?.find((x) => x.key === 'undo')
    ) {
      reviewObj.key = 'approve';
      callback(reviewObj, question, index);
    } else if (
      status === 'reject' &&
      question.icons.rightIcons.find((x) => x.key === 'mail-forward') &&
      !question.icons.rightLinks?.find((x) => x.key === 'undo')
    ) {
      reviewObj.key = 'mail-forward';
      callback(reviewObj, question, index);
    } else if (
      status === 'reject' &&
      question.icons.rightIcons.find((x) => x.key === 'remove') &&
      !question.icons.rightLinks?.find((x) => x.key === 'undo')
    ) {
      reviewObj.key = 'remove';
      callback(reviewObj, question, index);
    } else if (
      status === 'undo' &&
      question.icons.rightLinks.find((x) => x.key === 'undo')
    ) {
      reviewObj.type = 'undo';
      reviewObj.key = 'undo';
      questionCard.toArray().forEach((card: any, i) => {
        if (
          card.question.id == question.id &&
          card.question.sequenceID == question.sequenceID
        ) {
          questionCard.toArray()[i].undoVerification(reviewObj, 'undo');
        }
      });
    }
  }

  updateIconsAfterReview(question, diligence, user, isApproved, isSection) {
    question.answer.attributes.isAnswerReadonly = true;
    question.icons.rightLinks = [];
    question.icons.leftLinks = [];
    question.icons.rightIcons = [];
    question.icons.leftIcons = this.status.addLeftIcons(question);
    if (isApproved) {
      question.icons.rightLinks.push({
        key: 'undo',
        status: 'ReviewPassed',
        color: 'green',
        name: `Last Reviewed by ${user.fullName} on ${this.dvDatePipe.transform(
          new Date().toString(),
          ['isLocaleDate']
        )}`,
        tooltip: 'Undo approval',
        isSection: isSection,
      });
    } else {
      question.icons.rightLinks.push({
        key: 'undo',
        color: 'red',
        name: 'Revision Requested',
        status: 'ReviewFailed',
        tooltip: 'Undo revision request',
        isSection: isSection,
      });
    }
    this.reviewUpdate$.next();

    const { canShowNotes, canShowReviewComments } = question.answer.attributes;
    canShowNotes &&
      question.icons.rightIcons.push(
        questionCardIcons('notes', question, diligence)
      );
    if (canShowReviewComments) {
      if (diligence.editor_version === 1)
        question.icons.rightIcons.push(
          questionCardIcons('review-comments', question)
        );
      else
        question.icons.rightIcons.push(
          questionCardIcons('ck-comments', question)
        );
    }
  }

  //#region Handling review question previous and next
  allQuestions: any = [];
  LocalQuestionMap = [];
  flattenQuestionList = [];
  prevNext = { previous: null, next: null };
  initializeQuestionNavigationData(question): void {
    const { localQuestionMap } = this.store.selectSnapshot(
      (state) => state.questionnaire
    );
    this.prevNext = { previous: null, next: null };
    this.flattenQuestionList = [];
    this.LocalQuestionMap = localQuestionMap;
    this.allQuestions = JSON.parse(JSON.stringify(this.status.questions));
  }

  activateRequiredQuestion(isNext = true): void {
    if (isNext) {
      this.status.handleCkEditorIcon(this.prevNext.next);
    } else {
      this.status.handleCkEditorIcon(this.prevNext.previous);
    }
  }

  getPreviousNextQuestion(currQues) {
    this.flattenQuestionList = this.flattenAllValidQuestionsQuestions(
      this.allQuestions,
      null
    );
    let prevNextobj = {
      previous: null,
      next: null,
    };
    this.flattenQuestionList.find((ques, index) => {
      if (currQues.id == ques.id) {
        prevNextobj = {
          previous:
            index > 0
              ? this.status.findQuestionRecursively(
                  'uniqueQuestionId',
                  this.flattenQuestionList[index - 1].uniqueQuestionId,
                  this.status.questions
                )
              : null,
          next:
            index < this.flattenQuestionList.length - 1
              ? this.status.findQuestionRecursively(
                  'uniqueQuestionId',
                  this.flattenQuestionList[index + 1].uniqueQuestionId,
                  this.status.questions
                )
              : null,
        };
        return true;
      }
    });
    this.prevNext = prevNextobj;
    return prevNextobj;
  }

  flattenAllValidQuestionsQuestions(questions, parent) {
    let result = [];
    for (let question of questions) {
      if (question?.nestedID) {
        if (
          question.nestedID.answer.id &&
          !question.nestedID.answer.attributes.localis_NA
        ) {
          question.nestedID.isValid = isNestedQuestionValid(
            parent,
            question.operatorID,
            question.value,
            this.LocalQuestionMap
          );
          question = question.nestedID;
          if (question.isValid) result.push(question);
        }
      } else {
        if (question.answer.id && !question.answer.attributes.localis_NA) {
          result.push(question);
        }
      }

      if (question.nestedQuestions && question.nestedQuestions.length > 0) {
        result = result.concat(
          this.flattenAllValidQuestionsQuestions(
            question.nestedQuestions,
            question
          )
        );
      }
    }
    return result;
  }

  //#endregion

  // API CALL TO MARK EVERY COMMENT RESOLVED ON BE
  responseSelectedMarkTextRemove(payload) {
    return this.http.delete(
      `diligences/${payload.diligenceId}/responses/${payload.id}/mark_selected_text_removed`
    );
  }
}
