import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  OnDestroy,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { take, takeUntil } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import { questionCardIcons } from 'src/app2/modules/questionnaire/constants/question-card-icons.constant';
import { ResponseType } from 'src/app2/modules/questionnaire/constants/Response-type.constant';
import {
  DeleteDraftQuestionData,
  GetEntityScoreRules,
  GetQuestionCount,
  GetSubSectionData,
  HandleReviewStatus,
  UndoQuestionData,
  getReviewAssignments,
} from 'src/app2/modules/questionnaire/store/questionnaire.action';
import { StateDiligenceUpdateType } from 'src/app2/modules/questionnaire/store/questionnaire.modal';
import { UpdateLocalQuestionState } from 'src/app2/modules/questionnaire/store/questionnaire.util';
import { IconTypes } from 'src/app2/modules/questionnaire/types/card-icons.type';
import {
  QuestionAttributeType,
  QuestionDetailsOnScroll,
} from 'src/app2/modules/questionnaire/types/questions.type';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import { UserState } from 'src/app2/store/user/user.state';
import {
  canShowComments,
  isNestedQuestionValid,
} from 'src/app2/modules/questionnaire/util/question-status.util';
import { ModalService } from 'src/app2/services/modal.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { diligenceStatusConstant } from 'src/app2/modules/questionnaire/constants/quick-view-headers.constant';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { CurrentUserModel, UserModel } from 'src/app2/store/user/user.model';
import { responseStatus } from 'src/app2/shared/constants/constant';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { QuestionnaireStatusService } from 'src/app2/modules/questionnaire/service/status.service';
import { QuestionState } from 'src/app2/modules/questionnaire/store/questionnaire.state';
import { DiligenceTypeEnum } from 'src/app2/modules/questionnaire/types/diligence-enum.type';
import { ReviewMappingsData } from 'src/app2/modules/questionnaire/types/review-mappings-data.type';
import { yearMonthDayFormat } from 'src/app2/modules/questionnaire/util/date.util';
import { DvQuestionCardComponent } from 'src/app2/shared/components';
import { ReviewService } from 'src/app2/modules/questionnaire/service/review.service';
import { UpdateActivePanelId } from 'src/app2/modules/questionnaire/store/questionnaire.action';
import { AutoScrollServiceService } from 'src/app2/services/auto-scroll-service.service';
import { RouterService } from 'src/app2/services/router.service';
import { NoCommentResponseTypes } from 'src/app2/modules/questionnaire/constants/question-status.constant';
import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';
import * as moment from 'moment';

@Component({
  selector: 'questionnaire-evaluation',
  templateUrl: './questionnaire-evaluation.component.html',
})
export class QuestionnaireEvaluationComponent implements OnInit, OnDestroy {
  @Input() questions: QuestionAttributeType[] = [];
  @Input() diligence: DiligenceType & StateDiligenceUpdateType;
  @Input() teamMembersMap;
  @Input() activeSection;
  @Input() user: CurrentUserModel;
  @Input() userMain: UserModel;
  @Input() isSidePanelOpened: any;
  @Input() requiredQuestionIndex: number;
  @Input() questionListUpdateOnScroll: Subject<QuestionDetailsOnScroll>;
  @ViewChildren('questionCard')
  questionCard: QueryList<DvQuestionCardComponent>;
  @Output() onLinkClick = new EventEmitter();
  @Output() onIconClick = new EventEmitter();
  @Output() onResponseChange = new EventEmitter();
  questionData = [];
  draftquestionData = [];
  teamMembersData = [];
  assignedUser = [];
  customRatingMap: any;
  colors: any;
  questionDuplicate;
  @Select(QuestionState.getColorData) colorData;
  @Select(QuestionState.getCutomMapRating) customMapRating;
  questionsIDs = new Set();
  noCommentResponseTypes = ['TextMultiLine', 'Text', 'TextEmail'];
  subscriptions: any;
  firmPreferences;
  reviewEnable: boolean;
  verifierEdit = true; // need to implement only required in review flow
  @Select(UserState.getFirmPreferenceData) firmPref;
  @Select(QuestionState.getReviewMappingsData) getReviewMappingsData;
  @Select(QuestionState.getReviewStatus) handleSectionReviewChange;
  @Select(QuestionState.getAssignments) assignmentsData;
  private ngUnsubscribe = new Subject<void>();
  reviewMappingsData: ReviewMappingsData;
  assignments;
  parentQuestionCount;
  cardQuestionMap = {};
  activeQuestion: any;
  activePanelId: string;
  isSequenceIdInRoute: boolean;
  constructor(
    private dvDatePipe: DvDatePipe,
    private store: Store,
    private panelService: SidePanelService,
    private questionnaire: QuestionnaireService,
    private modal: ModalService,
    private newModal: CustomModalService,
    private util: UtilsService,
    private reviewService: ReviewService,
    private status: QuestionnaireStatusService,
    private autoScrollService: AutoScrollServiceService,
    private readonly routerService: RouterService
  ) {
    this.addRightIcons = this.addRightIcons.bind(this);
    this.handleIconClick = this.handleIconClick.bind(this);
    this.status.updateIconData(this.handleIconClick);
  }
  ngOnInit(): void {
    this.firmPref
      .pipe(take(2))
      .subscribe((firmPreferences) => (this.firmPreferences = firmPreferences));

    this.customMapRating.pipe(take(2)).subscribe((map) => {
      if (map) {
        this.customRatingMap = map;
        this.updateIcons(this.questions);
      }
    });

    this.colorData.pipe(take(2)).subscribe((data) => {
      if (data) {
        this.colors = data;
        this.updateIcons(this.questions);
      }
    });
    this.getReviewMappingsData
      .pipe(take(2))
      .subscribe((data: ReviewMappingsData) => {
        if (data) {
          this.reviewMappingsData = data;
          this.updateIcons(this.questions);
        }
      });

    // logic to handle section level approve/reject response
    this.handleSectionReviewChange
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((status: 'approve' | 'reject' | 'undo') => {
        if (status) {
          this.reviewService.reviewFromSection(
            status,
            this.questions,
            this.questionCard,
            (reviewObj, question) => {
              this.handleIconClick(reviewObj, question);
            }
          );
        }
        this.store.dispatch(new HandleReviewStatus(null));
      });

    this.store.selectSnapshot(
      (state) =>
        (this.parentQuestionCount =
          state.questionnaire.parentQuestionCount[this.activeSection.id])
    );

    this.panelService.sidePanelSub
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((val) => {
        this.isSidePanelOpened = val;
        if (this.isSidePanelOpened) {
          this.activePanelId = this.store.selectSnapshot(
            (state) => state.questionnaire.activePanelId
          );
          const panelArray = this.activePanelId.split('-');
          this.activeQuestion = panelArray[panelArray.length - 1];
        } else {
          this.activePanelId = null;
          this.activeQuestion = null;
        }
      });

    //Sub to listen for auto scroll event
    this.autoScrollService.afterScrollEvent
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((value) => {
        this.handleAfterScroll(value);
      });

    this.isSequenceIdInRoute = this.store.selectSnapshot(
      (state) => state.questionnaire.isSequenceIdInRoute
    );
    if (this.user?.isInvestor) {
      this.store.dispatch(new GetEntityScoreRules());
    }

    this.assignmentsData
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((assignment) => {
        this.assignments = JSON.parse(JSON.stringify(assignment));
        this.updateIcons(this.questions);
      });

    this.isSequenceIdInRoute = this.store.selectSnapshot(
      (state) => state.questionnaire.isSequenceIdInRoute
    );

    if (this.user?.isInvestor) {
      this.store.dispatch(new GetEntityScoreRules());
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.questions &&
      changes.questions.currentValue !== changes.questions.previousValue
    ) {
      this.updateIcons(changes.questions.currentValue);
      this.status.updateData(this.diligence, this.user, this.firmPreferences);
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  updateIcons(questions) {
    let localQuestionMap = this.store.selectSnapshot(
      (state) => state.questionnaire.localQuestionMap
    );
    this.reviewEnable = this.user.isInvestor || this.diligence.is_internal;
    questions.forEach((ques: QuestionAttributeType) => {
      if (!ques.icons.rightLinks?.find((link) => link.key === 'undo')) {
        if (this.assignments && this.assignments[ques.answer.id])
          ques.answer.attributes.post_response_status = this.assignments[
            ques.answer.id
          ].is_completed
            ? diligenceStatusConstant.ReviewPassed
            : diligenceStatusConstant.InReview;
        else
          ques.answer.attributes.post_response_status =
            diligenceStatusConstant.Started;

        this.reviewService.setAssignmentData(ques, this.assignments);

        ques['icons'] = {
          rightIcons: this.getRightIcons(ques)(ques),
          rightLinks: this.addRightLinks(ques),
          leftLinks: this.addLeftLinks(ques),
        };
        ques.showComment = canShowComments(ques, ques.answer.attributes);
        if (ques.nestedQuestions.length && localQuestionMap) {
          this.updatNestedViewLogic(
            ques.nestedQuestions,
            ques,
            localQuestionMap
          );
        }
      }
    });
    this.questionData = questions;
    this.status.updateQuestionData(this.questionData);
    this.draftquestionData = questions;
  }

  addLeftLinks(question: QuestionAttributeType) {
    const answer = question.answer.attributes;
    let leftLinks = [];

    if (
      question.answer.attributes.localTextResponse &&
      NoCommentResponseTypes.includes(question.responseType as ResponseType) &&
      question?.answer?.attributes.localis_NA
    ) {
      question.showComment = true;
    }
    if (
      this.user.isInvestor &&
      question?.answer &&
      question?.answer.attributes.revision_counts > 0
    ) {
      leftLinks.push({
        name: `Response History ${
          question?.answer.attributes.revision_counts
            ? `(${question?.answer.attributes.revision_counts})`
            : ''
        } `,
        key: 'revision',
        color: 'dark-orange',
        size: 'medium',
      });
    }

    if (
      this.reviewMappingsData?.question_mappings?.filter(
        (questionMapping) =>
          questionMapping.question_group_id === question.group_id
      )?.length &&
      this.diligence.diligence_type === DiligenceTypeEnum.dd_review
    ) {
      leftLinks.push({
        name: 'Show mapped questions',
        key: 'showMappedQuestions',
      });
    }
    return leftLinks;
  }
  getRightIcons(ques) {
    let rightIcon = this.addRightIcons;
    return rightIcon;
  }

  addRightIcons(question: QuestionAttributeType) {
    let rightIcons: IconTypes[] = [];
    let isEditable = !this.diligence.isReadOnly && !this.diligence.isLocked;
    let showForManager = this.user.isManager && !this.user.isFreeManager;
    let showForInvestor = this.user.isInvestor && !this.user.isFreeInvestor;
    if (
      question.responseType === ResponseType.TextMultiLine &&
      question?.answer?.attributes?.textResponse
    )
      rightIcons.push(
        questionCardIcons('ai', question, this.diligence, this.util)
      );

    let allowed = ![
      'aumTable',
      'DynamicGrid',
      'Grid',
      'CheckBox',
      'Dropdown',
      'Bookends',
      'ReturnTable',
      'Attachment',
    ].includes(question.responseType);


    // User should not be able to  add reviewer when on Evaluation external project for manager
    if (this.reviewEnable)
      if (!question.answer.attributes.assignments) {
        rightIcons.push(
          questionCardIcons(
            'userCheck',
            question,
            this.diligence,
            this.util,
            this.user.isInvestor
          )
        );
      } else {
        this.reviewService.setActiveReviewStepAndReviewer(
          question,
          this.diligence
        );

        if (question.answer.attributes.assignments.is_completed)
          rightIcons.push(
            questionCardIcons(
              'refresh',
              question,
              this.diligence,
              this.util,
              this.user.isInvestor
            )
          );
        else if (
          question.answer.attributes.currentReviewer &&
          !question.answer.attributes.currentReviewer.is_completed
        )
          this.addVerifyingIcons(question, rightIcons);
        else
          rightIcons.push(
            questionCardIcons(
              'userCheck',
              question,
              this.diligence,
              this.util,
              this.user.isInvestor
            )
          );
      }

    let showRatingIcon;
    if (this.user.isInvestor && !question?.isSequence) {
      rightIcons.push(
        questionCardIcons('flag', question, this.diligence, this.util, true)
      );

      let selectedRatingScheme = this.store.selectSnapshot(
        (state) => state.questionnaire.selectedRatingScheme
      );
      if (question?.questionRating && selectedRatingScheme && this.colors) {
        showRatingIcon = true;
        rightIcons = [
          ...rightIcons,
          ...this.status.handleIsRatingIcon(question, this.customRatingMap),
        ];
      }
    }

    if (showForManager && !question.verifierEdit && allowed)
      rightIcons.push(questionCardIcons('addToPreapproved', question));

    // Show notes if the project is external and the user is manager or there is no response or the qa is NA or the response type doesnt support review comments OR else show review comments
    if (
      (this.user.isManager && !this.diligence.is_internal) ||
      !question.answer.id ||
      question.answer.attributes.is_NA
    )
      rightIcons.push(questionCardIcons('notes', question));
    else if (this.diligence.editor_version === 1)
      rightIcons.push(questionCardIcons('review-comments', question));
    else rightIcons.push(questionCardIcons('ck-comments', question));

    if (!question.verifierEdit) {
      !this.diligence.is_internal &&
        this.diligence.diligence_type !== DiligenceTypeEnum.shared_profile &&
        rightIcons.push(
          questionCardIcons(
            'followup',
            question,
            this.diligence,
            this.util,
            this.user.isInvestor
          )
        );
    }

    rightIcons.push(
      questionCardIcons('recommendation', question, this.diligence, this.util)
    );
    if (question.id && (!isEditable || question.verifierEdit))
      rightIcons.push(questionCardIcons('todo', question, this.diligence));

    if (this.user.isInvestor && !question?.isSequence) {
      rightIcons.push(questionCardIcons('viewRules'));
    }
    if (showRatingIcon) {
      rightIcons.push(questionCardIcons('ban', question));
    }

    return rightIcons;
  }

  addVerifyingIcons(question: QuestionAttributeType, rightIcons: IconTypes[]) {
    rightIcons.push(
      questionCardIcons(
        'approve',
        question,
        this.diligence,
        this.util,
        this.user.isInvestor
      )
    );

    rightIcons.push(
      questionCardIcons(
        'remove',
        question,
        this.diligence,
        this.util,
        this.user.isInvestor
      )
    );
  }

  addRightLinks(question) {
    return this.reviewService.rightLinksForReview(
      question.answer.attributes,
      this.diligence
    );
  }

  handleLinkClick(link: IconTypes, question: QuestionAttributeType) {
    switch (link.key) {
      case 'undo':
        question.isSectionUndo = link.isSection;
        if (link.type === 'undo') {
          question.isSectionUndo = link.isSection;
          this.status.handleResponseStatus(
            question,
            responseStatus.INREVIEW,
            () => {
              this.updateIconsAfterReview(question, responseStatus.INREVIEW);
              if (!link.isSection) this.reviewService.reviewUpdate$.next();
            }
          );
        } else {
          if (!link.isSection) {
            this.store.dispatch(
              new getReviewAssignments(this.diligence.id, this.activeSection.id)
            );
          }
        }

        question.icons.rightIcons = this.getRightIcons(question)(question);
        question.icons.leftLinks = this.addLeftLinks(question);
        question.icons.rightLinks = this.addRightLinks(question);
        break;
      case 'revision':
        this.status.handleRevision(question, () => {});
        break;
      case 'showMappedQuestions':
        this.status.handleMappedQuestions(
          question,
          this.reviewMappingsData,
          () => {}
        );
        break;
      case 'reviewStatus':
        this.status.handleReviewStatus(question);
        break;
    }
  }

  updateIconsAfterReview(question, status) {
    question.icons.rightLinks = [];
    question.icons.rightIcons = this.getRightIcons(question)(question);
    question.icons.leftLinks = this.addLeftLinks(question);
    question.icons.rightLinks = this.addRightLinks(question);
  }

  updateNestedQuestion(nestedQuestions, nestedId) {
    nestedQuestions.forEach((nestedQues) => {
      if (nestedQues.nestedID.id === nestedId) {
        nestedQues.nestedID = JSON.parse(JSON.stringify(nestedQues.nestedID));
        return;
      }
      if (nestedQues.nestedID.nestedQuestions.length) {
        this.updateNestedQuestion(
          nestedQues.nestedID.nestedQuestions,
          nestedId
        );
      }
    });
  }

  handleIconClick(icon: IconTypes, question: QuestionAttributeType) {
    switch (icon.key) {
      case 'flag':
        question.answer.attributes.is_flagged =
          !question.answer.attributes.is_flagged;
        question.icons.rightIcons = this.addRightIcons(question);

        this.questionnaire
          .updateRatingFlag([
            {
              response_id: question.answer.id,
              duediligence_id: this.diligence.id,
              is_flagged: question.answer.attributes.is_flagged,
            },
          ])
          .subscribe(() => this.store.dispatch(new GetQuestionCount()));
        return;
      case 'userCheck':
        this.status.handleAssignReviewers(question, () => {
          question.icons.rightIcons = this.getRightIcons(question)(question);
        });
        return;
      case 'approve':
        question.isSectionUndo = icon.isSection;
        this.status.handleResponseStatus(
          question,
          responseStatus.REVIEWSUCCESS,
          () => {
            question.icons.rightLinks = [];
            question.icons.rightIcons = question.icons.rightIcons.filter(
              (obj) => {
                return obj.key !== 'approve' && obj.key !== 'remove';
              }
            );
            this.reviewService.reviewUpdate$.next();
            question.icons.rightLinks.push({
              key: 'undo',
              status: 'ReviewPassed',
              color: 'green',
              name: `Last Reviewed by ${
                this.user.fullName
              } on ${this.dvDatePipe.transform(new Date().toDateString(), [
                'isLocaleDate',
              ])}`,
              isSection: icon.isSection,
            });
          }
        );
        return;
      case 'remove':
        question.isSectionUndo = icon.isSection;
        if (question.isSectionUndo) this.requestRevision(icon, question);
        else
          this.status.showRejectDialogue((note) => {
            this.requestRevision(icon, question, note);
          }, true);

        return;

      case 'todo':
        this.status.handleTodo(question, false, () => {
          question.icons.rightIcons = this.addRightIcons(question);
        });
        return;
      case 'notes':
        this.status.handleNotes(question, false, () => {
          question.icons.rightIcons = this.getRightIcons(question)(question);
        });
        return;
      case 'review-comments':
        this.status.handleReviewComment(
          question,
          this.diligence.id,
          this.diligence.isReadonlyEditable,
          () => {
            const storeData = this.store.selectSnapshot(
              (state) => state.questionnaire.questions
            );
            this.questions.map((question) => {
              this.status.updateReviewCommentsDataForExistingQuestion(
                question,
                storeData
              );
              question.icons.rightIcons =
                this.getRightIcons(question)(question);
            });
            if (question.parentQuestionId) {
              // update current nested question
              this.status.updateReviewCommentsDataForExistingQuestion(
                question,
                storeData
              );
              question.icons.rightIcons =
                this.getRightIcons(question)(question);
            }
          }
        );
        return;
      case 'ck-comments':
        this.status.handleUpdateActiveQuestion(question);
        setTimeout(() => {
          this.status.handleCKCommentsPanel(question, () => {
            question.icons.rightIcons = this.getRightIcons(question)(question);
          });
        });
        return;
      case 'rating':
        this.status.updateRatingIcon(icon, question, () => {
          question.icons.rightIcons = this.addRightIcons(question);
        });
        return;
      case 'ban':
        question.questionRating.is_na = !question.questionRating.is_na;
        this.status.updateRatingIcon(icon, question, () => {
          question.icons.rightIcons = this.addRightIcons(question);
        });
        return;
      case 'refresh':
        this.status.showReReviewConfirm(question, async () => {
          question.answer.attributes.post_response_status =
            diligenceStatusConstant.InReview;
          this.reviewService.reviewUpdate$.next();
        });
        return;
      case 'followup':
        this.status.handleFollowUp(question, this.questionData, () => {
          question.icons.rightIcons = this.addRightIcons(question);
        });
        return;
      case 'recommendation':
        this.status.handleRecommendation(question, () => {
          question.icons.rightIcons = this.addRightIcons(question);
        });
        return;
      case 'addToPreapproved':
        this.status.handleAddToPreApprove(question);
        return;
      case 'viewRules':
        this.status.handleViewRules(question);
        return;
      case 'ai':
        this.status.openAiPanel(question);
        return;
    }
  }

  updateIconsAfterDraft(question) {
    let draftData = this.store.selectSnapshot(
      (state) => state.questionnaire.draftData
    );
    const id = `${question.sequenceID}-${question.sectionID}-${question.id}`;
    question.icons = {
      ...question.icons,
      rightIcons: this.getRightIcons(question)(question),
      leftLinks: this.addLeftLinks(question),
      rightLinks: this.addRightLinks(question),
    };
    this.questionsIDs.add(question.id);
  }

  updatNestedViewLogic(questions, parent, localQuestionMap, ids = []) {
    questions.forEach((nested) => {
      nested.nestedID.isValid = isNestedQuestionValid(
        parent,
        nested.operatorID,
        nested.value,
        localQuestionMap
      );
      if (!nested.nestedID.isValid) {
        const id = `${nested.nestedID.sequenceID}-${nested.nestedID.sectionID}-${nested.nestedID.id}`;
        ids.push(id);
        UpdateLocalQuestionState(nested.nestedID.answer, this.dvDatePipe);
      }

      this.reviewService.setAssignmentData(nested.nestedID, this.assignments);

      nested.nestedID['icons'] = {
        rightIcons: this.getRightIcons(nested.nestedID)(nested.nestedID),
        leftLinks: this.addLeftLinks(nested.nestedID),
        rightLinks: this.addRightLinks(nested.nestedID),
      };
      this.updatNestedViewLogic(
        nested.nestedID.nestedQuestions,
        nested.nestedID,
        localQuestionMap,
        ids
      );
    });
  }

  requestRevision(icon, question, note = null) {
    this.status.handleResponseStatus(
      question,
      responseStatus.REVIEWFAILED,
      () => {
        question.icons.rightLinks = [];
        question.icons.rightIcons = question.icons.rightIcons.filter((obj) => {
          return obj.key !== 'approve' && obj.key !== 'remove';
        });
        this.reviewService.reviewUpdate$.next();
        question.icons.rightLinks.push({
          key: 'undo',
          status: 'ReviewFailed',
          color: 'red',
          name: `Response Rejected`,
          isSection: icon.isSection,
        });
      },
      note
    );
  }

  // Function to listen whether auto scroll happened or it failed
  handleAfterScroll(scrolled) {
    this.status.handleSidePanelOpening(
      this.questionDuplicate,
      scrolled,
      (icon, question) => {
        this.handleIconClick(icon, question); // Manually creating a click icon event to render the sidepanel
      }
    );
  }

  handleScrollChange(scrollObject) {
    this.questionDuplicate = scrollObject.list;
    if (this.activePanelId && this.activeQuestion) {
      this.questionListUpdateOnScroll.next({
        activePanelId: this.activePanelId,
        activeQuestionId: +this.activeQuestion,
        questions: scrollObject.list,
      });
    }
  }
}
