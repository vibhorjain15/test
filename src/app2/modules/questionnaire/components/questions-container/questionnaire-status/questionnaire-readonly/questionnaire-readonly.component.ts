import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import { questionCardIcons } from 'src/app2/modules/questionnaire/constants/question-card-icons.constant';
import {
  NoCommentResponseTypes,
  preApprovedUnsupportedTypes,
} from 'src/app2/modules/questionnaire/constants/question-status.constant';
import { diligenceStatusConstant } from 'src/app2/modules/questionnaire/constants/quick-view-headers.constant';
import { ResponseType } from 'src/app2/modules/questionnaire/constants/Response-type.constant';
import { QuestionnaireStatusService } from 'src/app2/modules/questionnaire/service/status.service';
import { GetEntityScoreRules } from 'src/app2/modules/questionnaire/store/questionnaire.action';
import { StateDiligenceUpdateType } from 'src/app2/modules/questionnaire/store/questionnaire.modal';
import { QuestionState } from 'src/app2/modules/questionnaire/store/questionnaire.state';
import { UpdateLocalQuestionState } from 'src/app2/modules/questionnaire/store/questionnaire.util';
import { IconTypes } from 'src/app2/modules/questionnaire/types/card-icons.type';
import { DiligenceTypeEnum } from 'src/app2/modules/questionnaire/types/diligence-enum.type';
import { QuestionAttributeType } from 'src/app2/modules/questionnaire/types/questions.type';
import { ReviewMappingsData } from 'src/app2/modules/questionnaire/types/review-mappings-data.type';
import {
  canShowComments,
  isNestedQuestionValid,
} from 'src/app2/modules/questionnaire/util/question-status.util';
import { AutoScrollServiceService } from 'src/app2/services/auto-scroll-service.service';
import { RouterService } from 'src/app2/services/router.service';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';
import { UserState } from 'src/app2/store/user/user.state';
@Component({
  selector: 'questionnaire-readonly',
  templateUrl: './questionnaire-readonly.component.html',
})
export class QuestionnaireReadonlyComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() questions: QuestionAttributeType[] = [];
  @Input() diligence: DiligenceType & StateDiligenceUpdateType;
  @Input() teamMembersMap;
  @Input() activeSection;
  @Input() user;
  @Input() isSidePanelOpened;
  @Input() requiredQuestionIndex: number;
  @Select(QuestionState.getColorData) colorData;
  firmPreferences: any;
  @Select(QuestionState.getCutomMapRating) customMapRating;
  @Select(UserState.getFirmPreferenceData) firmPref;
  @Select(QuestionState.getReviewMappingsData) getReviewMappingsData;
  reviewMappingsData: ReviewMappingsData;
  questionData = [];
  colors = [];
  customRatingMap;
  parentQuestionCount;
  activeQuestion: any;
  questionDuplicate;
  isSequenceIdInRoute: boolean;
  private ngUnsubscribe = new Subject<void>();
  filter: string;
  constructor(
    private store: Store,
    private dvDatePipe: DvDatePipe,
    private status: QuestionnaireStatusService,
    private util: UtilsService,
    private readonly router: RouterService,
    private panelService: SidePanelService,
    private autoScrollService: AutoScrollServiceService
  ) {}
  ngOnInit(): void {
    this.firmPref.pipe(take(2)).subscribe((firmPreferences) => {
      this.firmPreferences = firmPreferences;
    });

    this.colorData.pipe(take(2)).subscribe((data) => {
      if (data) {
        this.colors = data;
        this.updateIcons(this.questions);
      }
    });

    this.customMapRating.pipe(take(2)).subscribe((map) => {
      if (map) {
        this.customRatingMap = map;
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
    this.store.selectSnapshot(
      (state) =>
        (this.parentQuestionCount =
          state.questionnaire.parentQuestionCount[this.activeSection.id])
    );

    this.autoScrollService.afterScrollEvent
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((value) => {
        this.handleAfterScroll(value);
      });

    this.panelService.sidePanelSub
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((val) => {
        this.isSidePanelOpened = val;
        if (this.isSidePanelOpened) {
          const panelArray = this.store
            .selectSnapshot((state) => state.questionnaire.activePanelId)
            .split('-');
          this.activeQuestion = panelArray[panelArray.length - 1];
        } else {
          this.activeQuestion = null;
        }
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
      this.filter = this.router.getState().params?.status;
      this.status.updateData(this.diligence, this.user);
      this.updateIcons(changes.questions.currentValue);
    }
  }

  updateIcons(questions) {
    let localQuestionMap = this.store.selectSnapshot(
      (state) => state.questionnaire.localQuestionMap
    );
    questions.forEach((ques: any) => {
      ques.showComment = canShowComments(ques, ques.answer.attributes);
      ques['icons'] = {
        rightIcons: this.addRightIcons(ques),
        leftLinks: this.addLeftLinks(ques),
      };
      if (ques.nestedQuestions.length) {
        this.updatNestedViewLogic(ques.nestedQuestions, ques, localQuestionMap);
      }
    });
    this.questionData = JSON.parse(JSON.stringify(questions));
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
        }`,
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
      this.diligence.diligence_type === DiligenceTypeEnum.dd_review &&
      (this.diligence.status === diligenceStatusConstant.Completed ||
        this.diligence.status === diligenceStatusConstant.Approved)
    ) {
      leftLinks.push({
        name: 'Show mapped questions',
        key: 'showMappedQuestions',
      });
    }
    return leftLinks;
  }

  addRightIcons(question: QuestionAttributeType) {
    let rightIcons: IconTypes[] = [];
    if (this.diligence.status == diligenceStatusConstant.Scheduled) {
      if (this.user.isInvestor && !question?.isSequence) {
        rightIcons.push(questionCardIcons('viewRules'));
      }
      return rightIcons;
    }
    let isEditable = !this.diligence.isReadOnly && !this.diligence.isLocked;
    if (
      question.responseType === ResponseType.TextMultiLine &&
      question?.answer?.attributes?.textResponse
    )
      rightIcons.push(
        questionCardIcons('ai', question, this.diligence, this.util)
      );
    if (this.user.isInvestor && this.diligence.allowOnlyFollowups) {
      // for Started and other pre-completion status, investor can only see notes and followup icons if they are accessing the questionnaire
      rightIcons.push(questionCardIcons('notes', question));

      rightIcons.push(
        questionCardIcons(
          'followup',
          question,
          this.diligence,
          null,
          this.user.isInvestor
        )
      );
      return rightIcons;
    }

    if (
      this.user.isManager &&
      !this.user.isFreeSubscription &&
      !preApprovedUnsupportedTypes.includes(
        question.responseType as ResponseType
      )
    )
      rightIcons.push(questionCardIcons('addToPreapproved'));
    if (
      this.user.isInvestor &&
      !question?.isSequence &&
      (this.diligence.status === diligenceStatusConstant.Completed ||
        this.diligence.status === diligenceStatusConstant.Approved ||
        this.diligence.status === diligenceStatusConstant.NotApproved)
    )
      rightIcons.push(
        questionCardIcons(
          'flag',
          question,
          this.diligence,
          this.util,
          this.user.isInvestor
        )
      );

    let showRatingIcon;
    let selectedRatingScheme = this.store.selectSnapshot(
      (state) => state.questionnaire.selectedRatingScheme
    );
    if (
      this.user.isInvestor &&
      question?.questionRating &&
      selectedRatingScheme &&
      !question?.isSequence &&
      this.colors &&
      (this.diligence.status === diligenceStatusConstant.Evaluation ||
        this.diligence.status == diligenceStatusConstant.Completed ||
        this.diligence.isLocked ||
        this.diligence.diligence_type == DiligenceTypeEnum.dd_review)
    ) {
      showRatingIcon = true;
      rightIcons = [
        ...rightIcons,
        ...this.status.handleIsRatingIcon(question, this.customRatingMap),
      ];
    }
    rightIcons.push(questionCardIcons('notes', question));

    !this.diligence.is_internal &&
      this.diligence.diligence_type !== DiligenceTypeEnum.shared_profile &&
      rightIcons.push(
        questionCardIcons(
          'followup',
          question,
          this.diligence,
          null,
          this.user.isInvestor
        )
      );
    rightIcons.push(
      questionCardIcons('recommendation', question, this.diligence, this.util)
    );
    rightIcons.push(questionCardIcons('todo', question));
    if (this.user.isInvestor && !question?.isSequence) {
      rightIcons.push(questionCardIcons('viewRules'));
    }
    if (showRatingIcon) {
      rightIcons.push(questionCardIcons('ban', question));
    }
    return rightIcons;
  }

  handleIconClick(icon: IconTypes, question: QuestionAttributeType) {
    switch (icon.key) {
      case 'flag':
        if (
          this.diligence.status === diligenceStatusConstant.Approved ||
          this.diligence.status === diligenceStatusConstant.NotApproved
        )
          return;
        question.answer.attributes.is_flagged =
          !question.answer.attributes.is_flagged;
        this.status.handleFlag(question, (isValid) => {
          if (isValid) {
            question.icons.rightIcons = this.addRightIcons(question);
          }
        });
        return;
      case 'notes':
        this.status.handleNotes(
          question,
          this.diligence.status !== diligenceStatusConstant.Completed &&
            this.diligence.status !== diligenceStatusConstant.PendingRestart &&
            this.diligence.status !== diligenceStatusConstant.Followup,
          () => {
            question.icons.rightIcons = this.addRightIcons(question);
          }
        );
        return;
      case 'todo':
        this.status.handleTodo(
          question,
          this.diligence.status !== diligenceStatusConstant.Completed &&
            this.diligence.status !== diligenceStatusConstant.PendingRestart &&
            this.diligence.status !== diligenceStatusConstant.Followup,
          () => {
            question.icons.rightIcons = this.addRightIcons(question);
          }
        );
        return;
      case 'followup':
        this.status.handleFollowUp(question, this.questionData, () => {
          question.icons.rightIcons = this.addRightIcons(question);
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
      case 'recommendation':
        this.status.handleRecommendation(question, () => {
          question.icons.rightIcons = this.addRightIcons(question);
        });
        return;
      case 'viewRules':
        this.status.handleViewRules(question);
        return;
      case 'addToPreapproved':
        this.status.handleAddToPreApprove(question);
        return;
      case 'ai':
        this.status.openAiPanel(question);
        return;
    }
  }

  handleLinkClick(link: IconTypes, question: QuestionAttributeType) {
    switch (link.key) {
      case 'showMappedQuestions':
        this.status.handleMappedQuestions(
          question,
          this.reviewMappingsData,
          () => {}
        );
        break;
      case 'revision':
        this.status.handleRevision(question, () => {});
        break;
    }
  }
  updatNestedViewLogic(questions, parent, localQuestionMap, ids = []) {
    questions.forEach((nested) => {
      if (
        this.user.isInvestor &&
        this.diligence.allowOnlyFollowups &&
        nested.nestedID.followup_count &&
        nested.nestedID.sequenceID in nested.nestedID.followup_count &&
        (([
          'ResolvedFollowup',
          'ExternalResolvedFollowup',
          'InternalResolvedFollowup',
        ].includes(this.filter) &&
          nested.nestedID.followup_count[nested.nestedID.sequenceID]
            .all_are_resolved) ||
          (([
            'OpenFollowup',
            'OpenSentFollowup',
            'OpenReceivedFollowup',
          ].includes(this.filter) ||
            !this.filter) &&
            nested.nestedID.followup_count[nested.nestedID.sequenceID].count &&
            !nested.nestedID.followup_count[nested.nestedID.sequenceID]
              .all_are_resolved))
      ) {
        // for Started and other pre-completion status, investor can only see questions with followups
        // if nested question has followups, mark it as valid so user can see it on UI irrespective of whether it has the response/parent has the response
        nested.nestedID.isValid = true;

        // for all parents also, mark isValid as true so that this question is visible
        const allParents = this.getAllParentQuestionIds(
          nested.nestedID.parentQuestionId
        );
        this.questions.forEach((question) => {
          this.markAllParentQuestionsValid(question, allParents);
        });
      } else {
        // else run existing logic
        nested.nestedID.isValid = isNestedQuestionValid(
          parent,
          nested.operatorID,
          nested.value,
          localQuestionMap
        );
      }

      if (!nested.nestedID.isValid) {
        const id = `${nested.nestedID.sequenceID}-${nested.nestedID.sectionID}-${nested.nestedID.id}`;
        ids.push(id);
        UpdateLocalQuestionState(nested.nestedID.answer, this.dvDatePipe);
      }
      nested.nestedID['icons'] = {
        rightIcons: this.addRightIcons(nested.nestedID),
        leftLinks: this.addLeftLinks(nested.nestedID),
      };
      this.updatNestedViewLogic(
        nested.nestedID.nestedQuestions,
        nested.nestedID,
        localQuestionMap,
        ids
      );
    });
  }

  markAllParentQuestionsValid(question, allParents) {
    if (question.id in allParents) {
      question.isValid = true;
      if (question.nestedQuestions?.length) {
        question.nestedQuestions.forEach((nestedQuestion) => {
          this.markAllParentQuestionsValid(nestedQuestion.nestedID, allParents);
        });
      }
    }
  }

  getAllParentQuestionIds(parentId) {
    const nestedQuestionMap = this.store.selectSnapshot(
      (state) => state.questionnaire.nestedQuestionMap
    );
    const allParents = {};
    allParents[parentId] = true;
    while (nestedQuestionMap[parentId]) {
      parentId = nestedQuestionMap[parentId];
      allParents[parentId] = true;
    }
    return allParents;
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
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
