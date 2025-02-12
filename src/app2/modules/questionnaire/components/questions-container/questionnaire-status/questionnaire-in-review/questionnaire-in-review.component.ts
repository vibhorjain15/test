import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  SimpleChanges,
  ViewChildren,
} from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import { questionCardIcons } from 'src/app2/modules/questionnaire/constants/question-card-icons.constant';
import {
  NoCommentResponseTypes,
  preApprovedUnsupportedTypes,
  UnsupportedTrackChangeTypes,
} from 'src/app2/modules/questionnaire/constants/question-status.constant';
import { ResponseType } from 'src/app2/modules/questionnaire/constants/Response-type.constant';
import {
  DeleteDraftQuestionData,
  DeleteOnlyDraftQuestionData,
  DeleteReviewMapData,
  GetTrackChanges,
  HandleReviewStatus,
  UpdateBulkLocalQuestionMapQuestionMap,
  UpdateLocalGridMap,
  UpdateQuestionData,
  UpdateSequenceSectionQuestionMap,
  getReviewAssignments,
} from 'src/app2/modules/questionnaire/store/questionnaire.action';
import { StateDiligenceUpdateType } from 'src/app2/modules/questionnaire/store/questionnaire.modal';
import {
  DefaultQuestionState,
  LocalQuestionMapHelper,
  UpdateLocalQuestionState,
} from 'src/app2/modules/questionnaire/store/questionnaire.util';
import { IconTypes } from 'src/app2/modules/questionnaire/types/card-icons.type';
import { DiligenceTypeEnum } from 'src/app2/modules/questionnaire/types/diligence-enum.type';
import {
  QuestionAttributeType,
  QuestionDetailsOnScroll,
} from 'src/app2/modules/questionnaire/types/questions.type';
import { UserState } from 'src/app2/store/user/user.state';
import {
  CanShowDeleteLink,
  initializeLocalGridMap,
  isNestedQuestionValid,
} from 'src/app2/modules/questionnaire/util/question-status.util';
import { UtilsService } from 'src/app2/services/utils.service';
import {
  diligenceStatusConstant,
  trackChangeStatusConstant,
} from 'src/app2/modules/questionnaire/constants/quick-view-headers.constant';
import { QuestionnaireStatusService } from 'src/app2/modules/questionnaire/service/status.service';
import { take, takeUntil } from 'rxjs/operators';
import { DvDraftService } from 'src/app2/modules/questionnaire/service/draft.service';
import { QuestionState } from 'src/app2/modules/questionnaire/store/questionnaire.state';
import { ReviewMappingsData } from 'src/app2/modules/questionnaire/types/review-mappings-data.type';
import { Subscription, Subject } from 'rxjs';
import { responseStatus } from 'src/app2/shared/constants/constant';
import { DvQuestionCardComponent } from 'src/app2/shared/components';
import { ResponseStatus } from 'src/app2/shared/constants/constant';
import { ReviewService } from 'src/app2/modules/questionnaire/service/review.service';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import { AutoScrollServiceService } from 'src/app2/services/auto-scroll-service.service';
import { RouterService } from 'src/app2/services/router.service';
import { AddCommentData } from 'src/app2/shared/models/ckeditor.model';
import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'questionnaire-in-review',
  templateUrl: './questionnaire-in-review.component.html',
})
export class QuestionnaireInReviewComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() questions: QuestionAttributeType[] = [];
  @Input() diligence: DiligenceType & StateDiligenceUpdateType;
  @Input() teamMembersMap;
  @Input() activeSection;
  @Input() user;
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
  questionsIDs = new Set();
  @Select(UserState.getFirmPreferenceData) firmPref;
  firmPreferences;
  responseHistory = null;
  flite;
  editor;
  customRatingMap: any;
  @Select(QuestionState.getReviewMappingsData) getReviewMappingsData;
  @Select(QuestionState.getCutomMapRating) customMapRating;
  reviewMappingsData: ReviewMappingsData;
  isInbound;
  @Select(QuestionState.getColorData) colorData;
  @Select(QuestionState.getResponseHistory) trackChanges;
  @Select(QuestionState.getReviewStatus) handleSectionReviewChange;
  @Select(QuestionState.getDraftData) draftData;
  @Select(QuestionState.getAssignments) assignmentsData;
  assignments;
  cardQuestionMap = {};
  questionBeforeState = {};
  firstload = true;
  private ngUnsubscribe = new Subject<void>();
  observableSubscriptions: Subscription[] = [];
  canShowReviewComments = false;
  colors = [];
  parentQuestionCount;
  activeQuestion: any;
  activePanelId: string;
  questionDuplicate;
  responseAuthors;
  isSequenceIdInRoute: boolean;
  constructor(
    private dvDatePipe: DvDatePipe,
    private store: Store,
    private util: UtilsService,
    private status: QuestionnaireStatusService,
    private reviewService: ReviewService,
    private draft: DvDraftService,
    private panelService: SidePanelService,
    private questionnaire: QuestionnaireService,
    private autoScrollService: AutoScrollServiceService,
    private readonly toaster: ToastrService
  ) {
    this.addRightIcons = this.addRightIcons.bind(this);
    this.noVerifierIcons = this.noVerifierIcons.bind(this);
    this.revisionRequestedFailedIcons =
      this.revisionRequestedFailedIcons.bind(this);
    this.revisionRequestedPassedIcons =
      this.revisionRequestedPassedIcons.bind(this);
    this.verifierIcons = this.verifierIcons.bind(this);
    this.verfierEditFlowIcons = this.verfierEditFlowIcons.bind(this);
    this.notAVaildVerifierIcons = this.notAVaildVerifierIcons.bind(this);
    this.getRightIcons = this.getRightIcons.bind(this);
    this.addLeftLinks = this.addLeftLinks.bind(this);
    this.addRightLinks = this.addRightLinks.bind(this);
    this.handleIconClick = this.handleIconClick.bind(this);
    this.status.updateIconData(this.handleIconClick);
  }
  ngOnInit(): void {
    this.firmPref
      .pipe(take(2))
      .subscribe((firmPreferences) => (this.firmPreferences = firmPreferences));

    this.trackChanges.pipe(takeUntil(this.ngUnsubscribe)).subscribe((res) => {
      this.responseHistory = JSON.parse(JSON.stringify(res));
      if (res) {
        this.updateIcons(this.questions);
      }
    });

    this.draftData.pipe(takeUntil(this.ngUnsubscribe)).subscribe((val) => {
      if (!val && !this.firstload) {
        this.questions = this.status.updateIconsAfterSave(
          this.questions,
          this.getRightIcons,
          this.addLeftLinks,
          this.addRightLinks,
          true
        );
      }
    });

    this.customMapRating.pipe(take(2)).subscribe((map) => {
      if (map) {
        this.customRatingMap = map;
        this.updateIcons(this.questions);
      }
    });

    this.getReviewMappingsData
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((data: ReviewMappingsData) => {
        if (data) {
          this.reviewMappingsData = data;
          this.updateIcons(this.questions);
        }
      });

    this.colorData.pipe(take(2)).subscribe((data) => {
      if (data) {
        this.colors = data;
        this.updateIcons(this.questions);
      }
    });

    this.store.selectSnapshot(
      (state) =>
        (this.parentQuestionCount =
          state.questionnaire.parentQuestionCount[this.activeSection.id])
    );

    this.questionnaire
      .getResponseAuthors(this.diligence.id)
      .subscribe((res) => {
        this.responseAuthors = res;
        if (this.responseAuthors) this.updateIcons(this.questions);
      });

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
          this.store.dispatch(new HandleReviewStatus(null));
        }
        this.store.dispatch(new HandleReviewStatus(null));
      });

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
    this.assignmentsData
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((assignment) => {
        this.assignments = JSON.parse(JSON.stringify(assignment));
        this.updateIcons(this.questions);
      });
    this.isSequenceIdInRoute = this.store.selectSnapshot(
      (state) => state.questionnaire.isSequenceIdInRoute
    );
    this.firstload = false;
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.questions &&
      changes.questions.currentValue !== changes.questions.previousValue
    ) {
      this.status.updateData(this.diligence, this.user, this.firmPreferences);
      this.updateIcons(changes.questions.currentValue);
    }
  }

  updateIcons(questions) {
    this.status.deleteOnlyDraftQuestionDataMap = [];
    let { draftData, sequenceSectionQuestionMap, localQuestionMap } =
      JSON.parse(
        JSON.stringify(
          this.store.selectSnapshot((state) => state.questionnaire)
        )
      );
    this.status.trackChanges.next(0);
    questions.forEach((ques: QuestionAttributeType) => {
      if (!ques.icons.rightLinks?.find((link) => link.key === 'undo')) {
        this.status.updatedQuestionDataAfterSave(ques);
        if (this.responseAuthors && this.responseAuthors[ques.answer.id])
          ques['responseAuthors'] = this.responseAuthors[ques.answer.id];

        if (this.assignments && this.assignments[ques.answer.id])
          ques.answer.attributes.response_status = this.assignments[
            ques.answer.id
          ].is_completed
            ? diligenceStatusConstant.ReviewPassed
            : diligenceStatusConstant.InReview;
        else
          ques.answer.attributes.response_status =
            diligenceStatusConstant.Started;

        this.reviewService.setAssignmentData(ques, this.assignments);

        const id = `${ques.sequenceID}-${ques.sectionID}-${ques.id}`;
        ques['icons'] = {
          leftIcons: this.status.addLeftIcons(
            ques,
            !!(
              draftData &&
              id in draftData &&
              Object.values(draftData[id]).length
            )
          ),
          rightIcons: this.getRightIcons(ques)(ques),
          leftLinks: this.addLeftLinks(ques),
          rightLinks: this.addRightLinks(ques),
        };
        if (ques.nestedQuestions.length && localQuestionMap) {
          localQuestionMap[`${ques.sequenceID}-${ques.sectionID}-${ques.id}`] =
            LocalQuestionMapHelper(ques.answer);
          this.updatNestedViewLogic(
            ques.nestedQuestions,
            ques,
            localQuestionMap
          );
          this.status.updateSequenceMapForNestedquestions(
            sequenceSectionQuestionMap,
            ques
          );
        }
        this.status.updateSequenceMap(sequenceSectionQuestionMap, ques);
      }
    });
    this.store.dispatch(
      new UpdateSequenceSectionQuestionMap(sequenceSectionQuestionMap)
    );
    this.store.dispatch(
      new UpdateBulkLocalQuestionMapQuestionMap(this.status.localQuestionMap)
    );
    this.status.deleteOnlyDraftQuestionDataMap.length &&
      this.store.dispatch(
        new DeleteOnlyDraftQuestionData(
          this.status.deleteOnlyDraftQuestionDataMap
        )
      );
    this.questionData = questions;
    this.status.updateQuestionData(this.questionData);
    this.draftquestionData = questions;
  }

  getRightIcons(ques) {
    ques.answer.attributes.isTrackChange = false;
    ques.answer.attributes.canShowReviewComments =
      ques.answer.id && !ques.answer.attributes.localis_NA;

    ques.answer.attributes.canShowNotes =
      !ques.answer.id || ques.answer.attributes.localis_NA;

    let rightIcon = this.addRightIcons;

    if (!ques.answer.attributes.assignments) {
      rightIcon = this.noVerifierIcons;
    } else {
      ques.answer.attributes.isAnswerReadonly = true;

      this.reviewService.setActiveReviewStepAndReviewer(ques, this.diligence);

      if (ques.responseType === ResponseType.TextMultiLine) {
        ques.answer.attributes.isTrackChange =
          ques.answer.attributes.response_status != ResponseStatus.STARTED &&
          ques.answer.attributes.response_status !=
            ResponseStatus.REVIEWSUCCESS;
      }
      // isTrackChange attribute pending for other response types
      if (ques.answer.attributes.isTrackChange) {
        ques.answer.attributes.currentResponse =
          ques.answer.attributes.responseDisplay;
      }

      let reviewRejected: any = false;
      if (ques.answer.attributes.activeReviewStep?.assignments)
        reviewRejected =
          ques.answer.attributes.activeReviewStep.assignments.find((assign) => {
            return assign.status === diligenceStatusConstant.ReviewFailed;
          });
      //If only authors are allowed in firm pref, then only allow users from responseAuthor arr to edit the response otherwise everyone except reviewer is allowed
      if (ques.answer.attributes.assignments?.is_completed) {
        rightIcon = this.revisionRequestedPassedIcons;
      } else if (
        reviewRejected &&
        ((this.firmPreferences.allow_only_authors_to_change_response &&
          ques['responseAuthors']?.find((x) => x === this.user.id)) ||
          (!this.firmPreferences.allow_only_authors_to_change_response &&
            this.user.id !== reviewRejected.assigned_to_user_id))
      )
        rightIcon = this.revisionRequestedFailedIcons;
      else if (
        ques.answer.attributes.currentReviewer &&
        !ques.answer.attributes.currentReviewer.is_completed &&
        !reviewRejected
      )
        rightIcon = this.verifierIcons;
      else rightIcon = this.notAVaildVerifierIcons;
    }

    ques.answer.attributes.rightIcons = rightIcon;
    return rightIcon;
  }

  // When reviewer has cliked on edit icon to edit the response then do this
  verfierEditFlowIcons(question, isTrackChangeEdit = false) {
    let rightIcons: IconTypes[] = [];
    const { canShowNotes, canShowReviewComments } = question.answer.attributes;
    question.answer.attributes.isAnswerReadonly = false;
    if (!this.firmPreferences) {
      this.firmPreferences = this.store.selectSnapshot(
        (state) => state.user.firmPreference
      );
    }
    question.answer.attributes.trigger_review = false;

    if (
      question.answer.attributes.assignments?.steps.find((step) => {
        return step.assignments.find(
          (assignment) => assignment.status === responseStatus.REVIEWSUCCESS
        );
      })
    )
      rightIcons.push(questionCardIcons('refresh', question));

    rightIcons.push(questionCardIcons('approve'));
    if (!isTrackChangeEdit) {
      rightIcons.push({ ...questionCardIcons('mail-forward', question) });
    } else rightIcons.push(questionCardIcons('sendForReview', question));
    rightIcons.push(questionCardIcons('na', question));
    canShowNotes && rightIcons.push(questionCardIcons('notes', question));

    if (canShowReviewComments) {
      if (this.diligence.editor_version === 1)
        rightIcons.push(questionCardIcons('review-comments', question));
      else rightIcons.push(questionCardIcons('ck-comments', question));
    }

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
    rightIcons.push(questionCardIcons('todo', question));
    rightIcons.push(
      questionCardIcons('recommendation', question, this.diligence, this.util)
    );
    return rightIcons;
  }

  // When there is no reviewer assigned to a response
  noVerifierIcons(question: QuestionAttributeType) {
    let rightIcons: IconTypes[] = [];
    question.answer.attributes.isAnswerReadonly = false;
    rightIcons.push(
      questionCardIcons('userCheck', question, this.diligence, this.util)
    );

    return [...rightIcons, ...this.addRightIcons(question)];
  }

  // When reviewer is assigned but logged in user is not current reviewer
  notAVaildVerifierIcons(question: QuestionAttributeType) {
    let rightIcons: IconTypes[] = [];
    question.answer.attributes.isAnswerReadonly = true;
    let selectedRatingScheme = this.store.selectSnapshot(
      (state) => state.questionnaire.selectedRatingScheme
    );
    question.answer.attributes.trigger_review = false;

    if (
      this.user.isInvestor &&
      !question?.isSequence &&
      (this.diligence.isLocked ||
        this.diligence.diligence_type === DiligenceTypeEnum.dd_review)
    ) {
      rightIcons.push(questionCardIcons('flag', question));
    }

    let showRatingIcon;
    if (
      this.user.isInvestor &&
      question?.questionRating &&
      selectedRatingScheme &&
      !question?.isSequence &&
      this.colors &&
      this.diligence.diligence_type === DiligenceTypeEnum.dd_review
    ) {
      showRatingIcon = true;
      rightIcons = [
        ...rightIcons,
        ...this.status.handleIsRatingIcon(question, this.customRatingMap),
      ];
    }

    if (
      question.answer.attributes.assignments?.steps.find((step) => {
        return step.assignments.find(
          (assignment) => assignment.status === responseStatus.REVIEWSUCCESS
        );
      })
    )
      rightIcons.push(questionCardIcons('refresh', question));
    rightIcons.push(
      questionCardIcons('userCheck', question, this.diligence, this.util)
    );
    const { canShowNotes, canShowReviewComments } = question.answer.attributes;
    canShowNotes && rightIcons.push(questionCardIcons('notes', question));
    if (canShowReviewComments) {
      if (this.diligence.editor_version === 1)
        rightIcons.push(questionCardIcons('review-comments', question));
      else rightIcons.push(questionCardIcons('ck-comments', question));
    }
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
    rightIcons.push(
      questionCardIcons('recommendation', question, this.diligence, this.util)
    );
    if (showRatingIcon) {
      rightIcons.push(questionCardIcons('ban', question));
    }
    return rightIcons;
  }

  // When current user is reviewer
  verifierIcons(question: QuestionAttributeType) {
    let rightIcons: IconTypes[] = [];
    question.answer.attributes.isAnswerReadonly = !question.alreadyEdited;
    if (!question.answer.attributes.isAnswerReadonly) {
      return this.verfierEditFlowIcons(question);
    }
    question.answer.attributes.trigger_review = false;

    let showRatingIcon;
    let selectedRatingScheme = this.store.selectSnapshot(
      (state) => state.questionnaire.selectedRatingScheme
    );

    if (
      this.user.isInvestor &&
      !question?.isSequence &&
      (this.diligence.isLocked ||
        this.diligence.diligence_type === DiligenceTypeEnum.dd_review)
    ) {
      rightIcons.push(questionCardIcons('flag', question));
    }
    if (
      this.user.isInvestor &&
      question?.questionRating &&
      selectedRatingScheme &&
      !question?.isSequence &&
      this.colors &&
      this.diligence.diligence_type === DiligenceTypeEnum.dd_review
    ) {
      showRatingIcon = true;
      rightIcons = [
        ...rightIcons,
        ...this.status.handleIsRatingIcon(question, this.customRatingMap),
      ];
    }

    if (!this.firmPreferences) {
      this.firmPreferences = this.store.selectSnapshot(
        (state) => state.user.firmPreference
      );
    }
    if (
      question.answer.attributes.assignments?.steps.find((step) => {
        return step.assignments.find(
          (assignment) => assignment.status === responseStatus.REVIEWSUCCESS
        );
      })
    )
      rightIcons.push(questionCardIcons('refresh', question));
    if (question.answer.attributes.isAnswerReadonly)
      rightIcons.push(questionCardIcons('pencil'));
    rightIcons.push(questionCardIcons('approve'));
    rightIcons.push(questionCardIcons('mail-forward'));
    const { canShowNotes, canShowReviewComments } = question.answer.attributes;
    canShowNotes && rightIcons.push(questionCardIcons('notes', question));
    if (canShowReviewComments) {
      if (this.diligence.editor_version === 1)
        rightIcons.push(questionCardIcons('review-comments', question));
      else rightIcons.push(questionCardIcons('ck-comments', question));
    }
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
    rightIcons.push(
      questionCardIcons('recommendation', question, this.diligence, this.util)
    );
    if (showRatingIcon) {
      rightIcons.push(questionCardIcons('ban', question));
    }
    return rightIcons;
  }

  // When reviewer has approved a response
  revisionRequestedPassedIcons(question) {
    let rightIcons: IconTypes[] = [];
    question.answer.attributes.isAnswerReadonly = !question.alreadyEdited; //  always lock the response after full review
    if (!this.firmPreferences?.enable_auto_review_again) {
      if (
        question.answer.attributes.assignments?.steps.find((step) => {
          return step.assignments.find(
            (assignment) => assignment.status === responseStatus.REVIEWSUCCESS
          );
        })
      )
        rightIcons.push(questionCardIcons('refresh', question));
      if (question.answer.attributes.isAnswerReadonly)
        rightIcons.push(questionCardIcons('edit-after-approve', question));
    } else {
      if (
        this.firmPreferences?.enable_auto_review_again &&
        !question.reviewFlowEdit
      ) {
        question.reviewFlowEdit = false;
        rightIcons.unshift(questionCardIcons('pencil-edit-in-review'));
      }
    }
    return [...rightIcons, ...this.addRightIcons(question)];
  }

  // When author logs in and sees a rejected response
  revisionRequestedFailedIcons(question) {
    question.answer.attributes.isAnswerReadonly = false;
    let rightIcons: IconTypes[] = [];

    this.status.updateTrackChangeValues(question, this.responseHistory);
    if (!question.answer.attributes.showTrackChangeButtons) {
      rightIcons.push(questionCardIcons('sendForReview', question));
    }
    // This is commented as once track change is done we dont have to show this
    if (
      question.answer.attributes.track_change_status ==
        trackChangeStatusConstant.Accepted ||
      question.answer.attributes.track_change_status ==
        trackChangeStatusConstant.Rejected
    ) {
      question.answer.attributes.isAnswerReadonly = true;
      question.answer.attributes.isTrackChange = false;
    }
    return [...rightIcons, ...this.addRightIcons(question)];
  }

  addRightIcons(question: QuestionAttributeType) {
    let selectedRatingScheme = this.store.selectSnapshot(
      (state) => state.questionnaire.selectedRatingScheme
    );
    let rightIcons: IconTypes[] = [];
    let isEditable = !this.diligence.isReadOnly && !this.diligence.isLocked;

    if (
      this.diligence.diligence_type != DiligenceTypeEnum.dd_review &&
      isEditable &&
      (question.responseType == ResponseType.TextEmail ||
        question.responseType == ResponseType.Text ||
        question.responseType == ResponseType.TextMultiLine)
    ) {
      rightIcons.push(questionCardIcons('autofill', question));
    }

    isEditable &&
      !question?.answer?.attributes?.localis_NA &&
      rightIcons.push(questionCardIcons('draft', question));
    isEditable && rightIcons.push(questionCardIcons('na', question));

    if (
      this.user.isInvestor &&
      !question?.isSequence &&
      (this.diligence.isLocked ||
        this.diligence.diligence_type === DiligenceTypeEnum.dd_review)
    ) {
      rightIcons.push(questionCardIcons('flag', question));
    }
    if (
      this.user.isInvestor &&
      question.responseType === ResponseType.TextMultiLine &&
      this.diligence.diligence_type === DiligenceTypeEnum.dd_review
    ) {
      rightIcons.push(questionCardIcons('standard-text', question));
    }
    let showRatingIcon;
    if (
      this.user.isInvestor &&
      this.diligence.diligence_type === DiligenceTypeEnum.dd_review &&
      question?.questionRating &&
      selectedRatingScheme &&
      !question?.isSequence &&
      this.colors
    ) {
      showRatingIcon = true;
      rightIcons = [
        ...rightIcons,
        ...this.status.handleIsRatingIcon(question, this.customRatingMap),
      ];
    }

    const { canShowNotes, canShowReviewComments } = question.answer.attributes;
    canShowNotes &&
      rightIcons.push(questionCardIcons('notes', question, this.diligence));
    if (canShowReviewComments) {
      if (this.diligence.editor_version === 1)
        rightIcons.push(questionCardIcons('review-comments', question));
      else rightIcons.push(questionCardIcons('ck-comments', question));
    }

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

    if (
      this.user.isManager &&
      !this.user.isFreeSubscription &&
      !preApprovedUnsupportedTypes.includes(
        question.responseType as ResponseType
      )
    )
      rightIcons.push(questionCardIcons('addToPreapproved', question));

    rightIcons.push(
      questionCardIcons('recommendation', question, this.diligence, this.util)
    );

    question.selectedUser = [];
    if (
      question?.assignedUser?.attributes?.assigned_to &&
      question?.assignedUser?.attributes?.assigned_to.length
    ) {
      let teamList = [];
      question?.assignedUser.attributes.assigned_to.map((id) => {
        let team = this.teamMembersMap[id];
        if (team) {
          team.is_removed = false;
          teamList.push(team);
        }
      });
      question.selectedUser = teamList;
    }

    rightIcons.push(questionCardIcons('todo', question));
    if (showRatingIcon) {
      rightIcons.push(questionCardIcons('ban', question));
    }
    return rightIcons;
  }

  addLeftLinks(question: QuestionAttributeType) {
    let leftLinks = [];

    if (
      !NoCommentResponseTypes.includes(question.responseType as ResponseType) &&
      !question.answer.attributes.isAnswerReadonly
    ) {
      this.status.isLeftLinkComment(leftLinks, question);
    }
    if (
      !NoCommentResponseTypes.includes(question.responseType as ResponseType) &&
      question.answer.attributes.isAnswerReadonly &&
      !!question.answer.attributes.localTextResponse
    )
      question.showComment = true;
    if (
      question.answer.attributes.isTrackChange &&
      question.answer.attributes.showTrackChangeButtons
      //    || This was added but not sure why
      // [
      //   trackChangeStatusConstant.Accepted,
      //   trackChangeStatusConstant.Rejected,
      // ].includes(question.answer.attributes.track_change_status)
    ) {
      question.showComment = false;
      leftLinks.pop();
    }
    if (
      question.answer.attributes.localTextResponse &&
      NoCommentResponseTypes.includes(question.responseType as ResponseType) &&
      question?.answer?.attributes.localis_NA
    ) {
      question.showComment = true;
    }
    // Remove the deleted response Id if it the response is present
    if (question.answer.id) question.deleted_response_id = null;
    if (
      question?.answer?.attributes?.revision_counts ||
      question?.answer?.attributes?.revision_counts == 0 ||
      question?.deleted_response_id
    ) {
      // We send revision count in response object, but if there is no response found you can find the count in question object
      const responseCount =
        question?.answer?.attributes?.revision_counts ??
        question.revision_counts;
      leftLinks.push({
        name: `Response History ${responseCount ? `(${responseCount})` : ''}`,

        key: 'revision',
        color: 'dark-orange',
        size: 'medium',
        tooltip: this.status.getResponseRevisionDetail(question),
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

  addRightLinks(question) {
    let rightLinks = [];
    let isDelete = CanShowDeleteLink(question, false);

    // Show that response was deleted link and only show it when it has no response and it has deleted response id in question object
    if (!isDelete && question.deleted_response_id) {
      rightLinks.push({
        label: 'Response Deleted',
        icon: null,
        name: 'Response Deleted',
        color: 'light-black',
        key: 'deleted',
        size: 'medium',
        class: 'new-delete-wrapper new-link-wrapper',
      });
    }
    return [
      ...rightLinks,
      ...this.reviewService.rightLinksForReview(
        question.answer.attributes,
        this.diligence
      ),
    ];
  }

  handleCommentText({ text, editor_id }, question) {
    this.status.updateCommentIfDraftPopUp(text, editor_id, question);
    this.onResponseChange.emit({
      isError: false,
      value: text,
      type: question.responseType,
      question,
      metaType: 'comment',
    });
    question.icons.leftIcons = this.status.addLeftIcons(question, true);
  }

  handleCommentIcon(
    iconType: 'close' | 'delete',
    question: QuestionAttributeType
  ) {
    if (iconType == 'delete') {
      this.onResponseChange.emit({
        isError: false,
        value: null,
        type: question.responseType,
        question,
        metaType: 'comment',
      });
      this.updateIconsAfterDraft(question);
    }
  }
  handleMultiTrackChange({ editor, flite }) {
    this.flite = flite;
    this.editor = editor;
  }
  handleValueChange(val, question) {
    question.answer.attributes.currentResponse = val;
    this.onResponseChange.emit({
      isError: false,
      value: question.answer.attributes.currentResponse,
      type: question.responseType,
      question,
    });
  }

  handleTrackChange(type: 'accept' | 'reject' | 'edit', question, index) {
    question.answer.attributes.showTrackChangeButtons = false;
    this.status.updateTrackChange(false);
    switch (type) {
      case 'edit':
        let verifier;
        if (question?.answer?.attributes?.verifier?.length) {
          verifier = {
            attributes: question.answer.attributes.verifier[0],
          };
        }
        question.answer.attributes.isTrackChange =
          false ||
          (question.responseType === ResponseType.TextMultiLine &&
            verifier &&
            this.util.isAssignedToUser(verifier, this.diligence.myFunction));
        question.answer.attributes.isAnswerReadonly = false;
        question.icons.rightIcons = this.verfierEditFlowIcons(question, true);
        question.icons.leftLinks = this.addLeftLinks(question);
        question.answer.attributes.track_change_status ===
          trackChangeStatusConstant.Pending;
        this.rerenderQuestionData(question, index);
        return;
      case 'accept':
        this.status.updateTrackChangesData(
          question,
          trackChangeStatusConstant.Accepted,
          question.answer.attributes?.currentResponse,
          this.activeSection,
          () => {}
        );
        question.answer.attributes.isTrackChange = false;
        question.answer.attributes.isAnswerReadonly = true;
        question.reviewFlowEdit = false;
        question.answer.attributes.track_change_status =
          trackChangeStatusConstant.Accepted;
        this.updateIconsAfterDraft(question);
        this.rerenderQuestionData(question, index);
        return;
      case 'reject':
        question.answer.attributes = {
          ...question.answer.attributes,
          ...this.responseHistory[question.answer.id],
        };
        UpdateLocalQuestionState(question.answer, this.dvDatePipe);
        if (
          question.responseType === ResponseType.Grid ||
          question.responseType === ResponseType.DynamicGrid
        ) {
          let localGridMap = JSON.parse(
            JSON.stringify(
              this.store.selectSnapshot(
                (state) => state.questionnaire.localGridMap
              )
            )
          );
          initializeLocalGridMap(question, localGridMap);
          this.store.dispatch(new UpdateLocalGridMap(localGridMap));
        }
        this.status.updateTrackChangesData(
          question,
          trackChangeStatusConstant.Rejected,
          question.answer.attributes.responseDisplay,
          this.activeSection,
          () => {
            question = JSON.parse(JSON.stringify(question));
            question.answer.attributes.isTrackChange = false;
            question.answer.attributes.isAnswerReadonly = true;
            question.reviewFlowEdit = false;
            question.answer.attributes.track_change_status =
              trackChangeStatusConstant.Rejected;
            this.updateIconsAfterDraft(question);
            this.rerenderQuestionData(question, index);
          }
        );
        return;
    }
  }

  rerenderQuestionData(question, index) {
    let mainQuestionArrayIndex = question.isSequence
      ? question.sequenceIndex
      : question.index;
    if (question?.parentQuestionId) {
      this.questionData.forEach((ques) => {
        this.updateNestedQuestion(ques.nestedQuestions, question.id);
      });
    } else
      this.questionData[mainQuestionArrayIndex] = JSON.parse(
        JSON.stringify(question)
      );

    this.questionDuplicate[index] = this.questionData[mainQuestionArrayIndex];
  }

  async handleLinkClick(
    link: IconTypes,
    question: QuestionAttributeType,
    index
  ) {
    switch (link.key) {
      case 'comments':
        question.showComment = !question.showComment;
        this.status.handleUpdateActiveQuestion(question);
        question.icons.leftLinks.forEach((link) => {
          if (link.key === 'comments')
            link.name = question.showComment
              ? 'Hide Comment'
              : question.answer.attributes.localTextResponse
              ? 'Show comment'
              : 'Add Comment';
        });
        return;
      case 'undo':
        question.answer.attributes.isAnswerReadonly = true;
        question.reviewFlowEdit = false;
        if (link.type === 'undo') {
          question.isSectionUndo = link.isSection;
          this.status.handleResponseStatus(
            question,
            responseStatus.INREVIEW,
            () => {
              question.icons.rightIcons =
                this.getRightIcons(question)(question);
              question.icons.leftLinks = this.addLeftLinks(question);
              question.icons.rightLinks = this.addRightLinks(question);
              if (!link.isSection) this.reviewService.reviewUpdate$.next();
            }
          );
        } else {
          if (link.status === diligenceStatusConstant.ReviewFailed) {
            this.questionnaire
              .getResponseAuthors(this.diligence.id)
              .subscribe((res) => {
                this.responseAuthors = res;
              });
            this.updateTrackChangeCount(question, false);

            if (!link.isSection)
              await this.store.dispatch(new GetTrackChanges()).toPromise();

            question.answer.attributes.track_change_status =
              trackChangeStatusConstant.Started;
          }
          if (!link.isSection) {
            this.store.dispatch(
              new getReviewAssignments(this.diligence.id, this.activeSection.id)
            );
          }

          this.store.dispatch(
            new UpdateQuestionData(
              this.activeSection.data.parentID,
              this.activeSection.id,
              JSON.parse(JSON.stringify(question))
            )
          );

          question.icons.rightIcons = this.getRightIcons(question)(question);
          question.icons.leftLinks = this.addLeftLinks(question);
          question.icons.rightLinks = this.addRightLinks(question);
        }
        return;
      case 'revision':
        let localNa = question.answer.attributes.localis_NA;
        this.status.handleRevision(question, () => {
          if (question.answer.attributes.localis_NA != localNa) {
            localNa = question.answer.attributes.localis_NA;
            question.answer.attributes.localis_NA =
              !question.answer.attributes.localis_NA;
            this.onIconClick.emit({ icon: { key: 'na' }, question });
          }

          if (question.answer.attributes.isAnswerReadonly)
            this.handleIconClick(
              { key: 'pencil', name: 'pencil', label: '' },
              question
            );

          this.onResponseChange.emit({
            isError: false,
            value: question.answer.attributes.localTextResponse,
            type: question.responseType,
            question,
            metaType: 'comment',
          });
          this.updateIconsAfterDraft(question);
          this.rerenderQuestionData(question, index);
        });
        return;
      case 'showMappedQuestions':
        this.status.handleMappedQuestions(
          question,
          this.reviewMappingsData,
          () => {
            this.onLinkClick.emit({ link, question });
          }
        );
        break;
      case 'reviewStatus':
        this.status.handleReviewStatus(question);
        break;
      default:
        this.onLinkClick.emit({ link, question });
    }
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

  handleIconClick(
    icon: IconTypes,
    question: QuestionAttributeType,
    index = null
  ) {
    switch (icon.key) {
      case 'flag':
        question.answer.attributes.is_flagged =
          !question.answer.attributes.is_flagged;
        this.status.handleFlag(question, (isValid) => {
          if (isValid) {
            question.icons.rightIcons = this.getRightIcons(question)(question);
          }
        });
        return;
      case 'userCheck':
        this.status.handleAssignReviewers(question, () => {
          question.alreadyEdited = false;
          question.icons.rightIcons = this.getRightIcons(question)(question);
          question.icons.leftLinks = this.addLeftLinks(question);
          question.answer.attributes.isAnswerReadonly = true;
          question.reviewFlowEdit = false;
          question.alreadyEdited = false;
        });
        return;
      case 'standard-text':
        this.status.handleSmartText(question, this.reviewMappingsData);
        return;
      case 'pencil':
        question.answer.attributes.isAnswerReadonly = false;
        question.alreadyEdited = true;
        this.status.updateTrackChangeValuesTextMultiline(
          question,
          this.responseHistory
        );
        this.status.handleUpdateActiveQuestion(question);
        question.icons.rightIcons = this.verfierEditFlowIcons(question);
        question.icons.leftLinks = this.addLeftLinks(question);
        return;
      case 'edit-after-approve':
        question.answer.attributes.isAnswerReadonly = false;
        question.alreadyEdited = true;
        question.icons.rightIcons = question.icons.rightIcons.filter(
          (x) => x.key !== 'edit-after-approve'
        );
        return;
      case 'pencil-edit-in-review':
        question.answer.attributes.isAnswerReadonly = false;
        this.status.updateTrackChangeValuesTextMultiline(
          question,
          this.responseHistory
        );
        this.status.handleUpdateActiveQuestion(question);
        question.alreadyEdited = true;
        question.reviewFlowEdit = true;
        question.answer.attributes.trigger_review =
          this.firmPreferences?.enable_auto_review_again;
        question.icons.rightIcons = question.icons.rightIcons.filter(
          (x) => x.key !== 'pencil-edit-in-review'
        );
        question.icons.leftLinks = this.addLeftLinks(question);
        return;
      case 'sendForReview':
        this.status.handleRejectedReview(question, async () => {
          this.reviewService.reviewUpdate$.next();
          question.alreadyEdited = false;
          this.store.dispatch(
            new getReviewAssignments(this.diligence.id, this.activeSection.id)
          );
        });
        return;
      case 'refresh':
        this.status.showReReviewConfirm(question, async () => {
          await this.store.dispatch(new GetTrackChanges()).toPromise();
          question.answer.attributes.showTrackChangeButtons = false;
          this.status.destroyActiveEditorInstace(); // destroy editor isntace if review is getting triggered again
          question.alreadyEdited = false;
          question.answer.attributes.response_status =
            diligenceStatusConstant.InReview;
          this.updateTrackChangeCount(question, false);
          question.answer.attributes.isAnswerReadonly = true;
          question.reviewFlowEdit = false;
          this.reviewService.reviewUpdate$.next();
          this.updateIconsAfterDraft(question);
        });
        return;
      case 'approve':
        if (question.reviewLoading) return; // return if API already is underway
        question.isSectionUndo = icon.isSection;
        this.updateTrackChangeCount(question, false);
        if (!question.answer.attributes.localis_WIP) {
          if (
            question.responseType == ResponseType.TextMultiLine &&
            question.answer.attributes?.currentResponse?.includes(
              '<span class="ice'
            )
          ) {
            if (this.flite && this.flite.countChanges() > 0)
              this.status.showVerifyConfirmationforTrackChanges(
                question,
                this.editor,
                this.flite,
                () => {
                  this.draft.saveCurrentDraftQuestion(
                    `${question.sequenceID}-${question.sectionID}-${question.id}`,
                    () => {
                      this.handleApprove(question, icon.isSection);
                    }
                  );
                }
              );
            else this.status.showTrackingWarning(question);
          } else if (
            this.util.checkForTrackChanges(
              question.answer.attributes?.currentResponse
            )
          ) {
            this.status.showTrackingWarning(question, () => {
              this.handleIconClick(
                { key: 'pencil', name: 'edit', label: 'edit' },
                question
              );
            });
          } else
            this.draft.saveCurrentDraftQuestion(
              `${question.sequenceID}-${question.sectionID}-${question.id}`,
              () => {
                this.handleApprove(question, icon.isSection);
              }
            );
        }
        return;
      case 'mail-forward': // send back to author
        if (question.reviewLoading) return;
        question.isSectionUndo = icon.isSection;
        if (question.isSectionUndo) this.requestRevision(icon, question);
        else
          this.status.showRejectDialogue((note) => {
            question.alreadyEdited = false;
            this.requestRevision(icon, question, note);
          });

        return;
      case 'autofill':
        this.status.handleAutoFill(question, () => {
          if (question.answer.attributes.localis_NA)
            this.onIconClick.emit({ icon: { key: 'na' }, question });
        });
        return;
      case 'todo':
        this.status.handleTodo(question, false, () => {
          question.icons.rightIcons = this.getRightIcons(question)(question);
        });
        return;
      case 'followup':
        this.status.handleFollowUp(question, this.questionData, () => {
          question.icons.rightIcons = this.getRightIcons(question)(question);
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
              (state) => state.questionnaire.reviewCommentDataMap
            );
            const ids = [];
            this.questionData = this.status.updateReviewCommentsData(
              this.questionData,
              this.getRightIcons,
              storeData,
              ids
            );
            ids.forEach((ques) => {
              this.status.updateTextEditorCommentsData(ques);
            });
            this.store.dispatch(new DeleteReviewMapData());
          }
        );

        return;
      case 'ck-comments':
        if (
          question?.icons?.leftIcons.name === 'warning' &&
          question.responseType === ResponseType.TextMultiLine
        ) {
          this.toaster.error('Response exceeds the given word limit');
          return;
        }

        // Only add/update the icons if the reviewer assigned is the current user
        if (question.icons.rightIcons.find((x) => x.key === 'approve')) {
          question.answer.attributes.isAnswerReadonly = false;
          question.alreadyEdited = true;
          this.status.updateTrackChangeValuesTextMultiline(
            question,
            this.responseHistory
          );
          question.icons.rightIcons = this.verfierEditFlowIcons(question);
        }
        this.status.handleUpdateActiveQuestion(question);
        setTimeout(() => {
          this.status.handleCKCommentsPanel(question, () => {
            question.icons.rightIcons = this.getRightIcons(question)(question);
          });
          // THIS IS CAUSING ISSUE WHY IS THIS REQUIRED
          // if (index) this.rerenderQuestionData(question, index);
        });
        return;
      case 'addToPreapproved':
        this.status.handleAddToPreApprove(question);
        return;
      case 'recommendation':
        this.status.handleRecommendation(question, () => {
          question.icons.rightIcons = this.getRightIcons(question)(question);
        });
        return;
      case 'rating':
        this.status.updateRatingIcon(icon, question, () => {
          question.icons.rightIcons = this.getRightIcons(question)(question);
        });
        return;
      case 'ban':
        question.questionRating.is_na = !question.questionRating.is_na;
        this.status.updateRatingIcon(icon, question, () => {
          question.icons.rightIcons = this.addRightIcons(question);
        });
        return;
      case 'na':
      case 'draft':
        this.onIconClick.emit({ icon, question });
        question.icons.rightIcons =
          question.answer.attributes.rightIcons(question);
        question.icons.leftIcons = this.status.addLeftIcons(question);
        if (question.answer.attributes.localis_NA) {
          this.questionBeforeState[question.id] = question;
          question.answer.attributes.isTrackChange = false;
          question.answer.attributes.isAnswerReadonly = false;
          this.updateTrackChangeCount(question, false);
        } else {
          question = this.questionBeforeState[question.id];
        }
        return;
      default:
        this.onIconClick.emit({ icon, question });
        this.updateIconsAfterDraft(question);
        return;
    }
  }

  updateIconsAfterDraft(question, canUpdateNestedQuestions = true) {
    this.status.deleteOnlyDraftQuestionDataMap = [];
    let draftData = this.store.selectSnapshot(
      (state) => state.questionnaire.draftData
    );
    const id = `${question.sequenceID}-${question.sectionID}-${question.id}`;
    question.icons = {
      ...question.icons,
      leftLinks: this.addLeftLinks(question),
      rightLinks: this.addRightLinks(question),
      leftIcons: this.status.addLeftIcons(
        question,
        !!(draftData && id in draftData && Object.values(draftData[id]).length)
      ),
      rightIcons: this.getRightIcons(question)(question),
    };
    if (question.nestedQuestions.length && canUpdateNestedQuestions) {
      let localQuestionMap = this.store.selectSnapshot(
        (state) => state.questionnaire.localQuestionMap
      );
      localQuestionMap = JSON.parse(JSON.stringify(localQuestionMap));
      this.updatNestedViewLogic(
        question.nestedQuestions,
        question,
        localQuestionMap
      );
      this.status.deleteOnlyDraftQuestionDataMap.length &&
        this.store.dispatch(
          new DeleteOnlyDraftQuestionData(
            this.status.deleteOnlyDraftQuestionDataMap
          )
        );
    }
    this.questionsIDs.add(question.id);
  }

  handleOnChange({ isError, value, type }, question) {
    this.status.handleOtherOptions(question, value);
    this.onResponseChange.emit({
      isError,
      value,
      type,
      question,
    });
    if (question.responseType === ResponseType.TextMultiLine) {
      question.answer.attributes.currentResponse = value;
      question.answer.attributes.responseDisplay = value;
    }
    question.answer.attributes.isAnswerReadonly = false;
    let draftData = this.store.selectSnapshot(
      (state) => state.questionnaire.draftData
    );
    const id = `${question.sequenceID}-${question.sectionID}-${question.id}`;
    question.icons.leftLinks = this.addLeftLinks(question);
    question.icons.leftIcons = this.status.addLeftIcons(
      question,
      !!(draftData && id in draftData && Object.values(draftData[id]).length),
      isError
    );
    this.handleNestedQuestions(question);
    this.status.updateQuestionData(this.questionData);
  }

  handleNestedQuestions(question) {
    if (question.nestedQuestions.length) {
      let notVaildIds = [];
      const localQuestionMap = this.store.selectSnapshot(
        (state) => state.questionnaire.localQuestionMap
      );
      this.updatNestedViewLogic(
        question.nestedQuestions,
        question,
        JSON.parse(JSON.stringify(localQuestionMap)),
        notVaildIds
      );
      if (notVaildIds.length)
        this.store
          .dispatch(new DeleteDraftQuestionData(notVaildIds))
          .subscribe(() => {
            question.nestedQuestions.forEach((nested) => {
              if (!nested.nestedID.isValid) {
                notVaildIds.map((question) => {
                  if (nested.nestedID.id === question.id) {
                    this.updateIconsAfterDraft(question);
                    nested.nestedID = question;
                  }
                });
              }
            });
          });
    }
  }

  handleApprove(question, isSection) {
    question.alreadyEdited = false;
    this.status.handleResponseStatus(
      question,
      responseStatus.REVIEWSUCCESS,
      () => {
        question.alreadyEdited = false;
        this.reviewService.reviewUpdate$.next();
        this.reviewService.updateIconsAfterReview(
          question,
          this.diligence,
          this.user,
          true,
          isSection
        );
      }
    );
  }

  updatNestedViewLogic(questions, parent, localQuestionMap, ids = []) {
    questions.forEach((nested) => {
      if (
        !NoCommentResponseTypes.includes(
          nested.nestedID.responseType as ResponseType
        ) &&
        nested.nestedID.answer.attributes.isAnswerReadonly
      )
        nested.nestedID.showComment = true;
      nested.nestedID.isValid = isNestedQuestionValid(
        parent,
        nested.operatorID,
        nested.value,
        localQuestionMap
      );
      const id = `${nested.nestedID.sequenceID}-${nested.nestedID.sectionID}-${nested.nestedID.id}`;
      if (!nested.nestedID.isValid) {
        ids.push(id);
        this.status.deleteOnlyDraftQuestionDataMap.push(id);
        this.status.updateNestedLocalQuestionMap(nested, id, localQuestionMap);
        if (!nested.nestedID?.answer?.id)
          nested.nestedID = {
            ...nested.nestedID,
            answer: {
              attributes: DefaultQuestionState(),
            },
            showComment: false,
          };
      }
      let draftData = this.store.selectSnapshot(
        (state) => state.questionnaire.draftData
      );
      this.status.updatedQuestionDataAfterSave(nested.nestedID);
      if (
        this.responseAuthors &&
        this.responseAuthors[nested.nestedID.answer.id]
      )
        nested.nestedID['responseAuthors'] =
          this.responseAuthors[nested.nestedID.answer.id];

      this.reviewService.setAssignmentData(nested.nestedID, this.assignments);

      nested.nestedID['icons'] = {
        leftIcons: this.status.addLeftIcons(
          nested.nestedID,
          !!(
            draftData &&
            id in draftData &&
            Object.values(draftData[id]).length
          )
        ),
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

  updateTrackChangeCount(question, value) {
    if (question.answer.attributes.showTrackChangeButtons && !value) {
      question.answer.attributes.showTrackChangeButtons = false;
      this.status.updateTrackChange(false);
    }
  }

  requestRevision(icon, question, note = null) {
    this.status.handleResponseStatus(
      question,
      responseStatus.REVIEWFAILED,
      () => {
        this.draft.saveCurrentDraftQuestion(
          `${question.sequenceID}-${question.sectionID}-${question.id}`,
          async (res) => {
            if (res) {
              question.answer.attributes = {
                ...question.answer.attributes,
                ...res,
              };
            }

            this.reviewService.updateIconsAfterReview(
              question,
              this.diligence,
              this.user,
              false,
              icon.isSection
            );
          }
        );
      },
      note
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

  handleReviewCommentFocused(question: QuestionAttributeType): void {
    this.status.handleCKCommentsPanel(question, () => {
      question.icons.rightIcons = this.getRightIcons(question)(question);
    });
  }

  handleAddReviewComment(
    question: QuestionAttributeType,
    value: AddCommentData
  ): void {
    this.status.handleCKCommentsPanel(
      question,
      () => {
        question.icons.rightIcons = this.getRightIcons(question)(question);
      },
      value
    );
  }
}
