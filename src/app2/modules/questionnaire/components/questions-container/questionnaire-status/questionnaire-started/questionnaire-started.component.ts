import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import { questionCardIcons } from 'src/app2/modules/questionnaire/constants/question-card-icons.constant';
import {
  preApprovedUnsupportedTypes,
  NoCommentResponseTypes,
} from 'src/app2/modules/questionnaire/constants/question-status.constant';
import { ResponseType } from 'src/app2/modules/questionnaire/constants/Response-type.constant';
import {
  DeleteOnlyDraftQuestionData,
  UpdateBulkLocalQuestionMapQuestionMap,
  UpdateSequenceSectionQuestionMap,
} from 'src/app2/modules/questionnaire/store/questionnaire.action';
import { StateDiligenceUpdateType } from 'src/app2/modules/questionnaire/store/questionnaire.modal';
import {
  DefaultQuestionState,
  LocalQuestionMapHelper,
} from 'src/app2/modules/questionnaire/store/questionnaire.util';
import { IconTypes } from 'src/app2/modules/questionnaire/types/card-icons.type';
import { DiligenceTypeEnum } from 'src/app2/modules/questionnaire/types/diligence-enum.type';
import { QuestionAttributeType } from 'src/app2/modules/questionnaire/types/questions.type';
import { UserState } from 'src/app2/store/user/user.state';
import {
  CanShowDeleteLink,
  isNestedQuestionValid,
} from 'src/app2/modules/questionnaire/util/question-status.util';
import { QuestionnaireStatusService } from 'src/app2/modules/questionnaire/service/status.service';
import { takeUntil } from 'rxjs/operators';
import { ReviewMappingsData } from 'src/app2/modules/questionnaire/types/review-mappings-data.type';
import { QuestionState } from 'src/app2/modules/questionnaire/store/questionnaire.state';
import { UtilsService } from 'src/app2/services/utils.service';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import { Subject } from 'rxjs';
import { AutoScrollServiceService } from 'src/app2/services/auto-scroll-service.service';

/**
 * This component includes started status excluding pre-approved (dd_profile)
 */
@Component({
  selector: 'questionnaire-started',
  templateUrl: './questionnaire-started.component.html',
})
export class QuestionnaireStartedComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() questions: QuestionAttributeType[] = [];
  @Input() diligence: DiligenceType & StateDiligenceUpdateType;
  @Input() teamMembersMap;
  @Input() activeSection;
  @Input() user;
  @Input() userRolesMap = {};
  @Input() isSidePanelOpened: any;
  @Input() requiredQuestionIndex: number;
  @Input() sme; // This is SME list passed from subsection header to sync smes at question level as well
  @Input() triggeredStartedComponentForReadonlyStatus: boolean = false;
  @Output() onLinkClick = new EventEmitter();
  @Output() onIconClick = new EventEmitter();
  @Output() onResponseChange = new EventEmitter();
  questionData = [];
  teamMembersData = [];
  assignedUser = [];
  customRatingMap;
  questionsIDs = new Set();
  noCommentResponseTypes = ['TextMultiLine', 'Text', 'TextEmail'];
  @Select(UserState.getFirmPreferenceData) firmPref;
  firmPreferences;
  @Select(QuestionState.getReviewMappingsData) getReviewMappingsData;
  @Select(QuestionState.getColorData) colorData;
  @Select(QuestionState.getCutomMapRating) customMapRating;
  @Select(QuestionState.getDraftData) draftData;
  reviewMappingsData: ReviewMappingsData;
  colors = [];
  parentQuestionCount;
  activeQuestion: any;
  firstload = true;
  ngUnsubscribe = new Subject<void>();
  questionDuplicate;
  isSequenceIdInRoute: boolean;
  constructor(
    private store: Store,
    private status: QuestionnaireStatusService,
    private util: UtilsService,
    private panelService: SidePanelService,
    private autoScrollService: AutoScrollServiceService,
  ) {
    this.addRightIcons = this.addRightIcons.bind(this);
    this.addLeftLinks = this.addLeftLinks.bind(this);
    this.addRightLinks = this.addRightLinks.bind(this);
  }

  ngOnInit(): void {
    this.firmPref
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((firmPreferences) => {
        this.firmPreferences = firmPreferences;
        this.status.updateData(this.diligence, this.user, this.firmPreferences);
      });

    this.draftData.pipe(takeUntil(this.ngUnsubscribe)).subscribe((val) => {
      if (!val && !this.firstload) {
        this.questions = this.status.updateIconsAfterSave(
          this.questions,
          this.addRightIcons,
          this.addLeftLinks,
          this.addRightLinks
        );
      }
    });

    this.customMapRating
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((map) => {
        if (map && !this.firstload) {
          this.customRatingMap = map;
          this.updateIcons(this.questions);
        }
      });

    //Sub to listen for auto scroll event
    this.autoScrollService.afterScrollEvent
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((value) => {
        this.handleAfterScroll(value);
      });

    this.getReviewMappingsData
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((data: ReviewMappingsData) => {
        if (data) {
          this.reviewMappingsData = data;
          this.updateIcons(this.questions);
        }
      });

    this.colorData.pipe(takeUntil(this.ngUnsubscribe)).subscribe((data) => {
      if (data && !this.firstload) {
        this.colors = data;
        this.updateIcons(this.questions);
      }
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

    this.firstload = false;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.questions &&
      changes.questions.currentValue !== changes.questions.previousValue
    ) {
      this.status.updateData(this.diligence, this.user, this.firmPreferences);
      this.updateIcons(changes.questions.currentValue);
    }
    if (
      changes.userRolesMap &&
      changes.userRolesMap.currentValue !== changes.userRolesMap.previousValue
    ) {
      this.updateIcons(this.questions);
    }

    if (changes?.sme && !changes.sme.firstChange) {
      this.status.updateSmes(
        changes.sme.currentValue,
        this.questions,
        this.teamMembersMap,
        this.userRolesMap
      );
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
    questions.forEach((ques: any) => {
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
        rightIcons: this.addRightIcons(ques),
        leftLinks: this.addLeftLinks(ques),
        rightLinks: this.addRightLinks(ques),
      };
      if (ques.nestedQuestions.length) {
        localQuestionMap[`${ques.sequenceID}-${ques.sectionID}-${ques.id}`] =
          LocalQuestionMapHelper(ques.answer);
        this.updatNestedViewLogic(ques.nestedQuestions, ques, localQuestionMap);
        this.status.updateSequenceMapForNestedquestions(
          sequenceSectionQuestionMap,
          ques
        );
      }
      this.status.updateSequenceMap(sequenceSectionQuestionMap, ques);
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
  }

  addRightIcons(question: QuestionAttributeType, error?: any) {
    let rightIcons: IconTypes[] = [];
    let isEditable = !this.diligence.isReadOnly && !this.diligence.isLocked;

    if (
      this.triggeredStartedComponentForReadonlyStatus &&
      !question.isReadOnly &&
      question.answer?.id
    ) {
      const draftData = this.store.selectSnapshot(
        (state) => state.questionnaire.draftData
      );
      rightIcons.push(
        questionCardIcons(
          'submitRevisions',
          question,
          null,
          null,
          null,
          draftData,
          error
        )
      );
    }

    if (
      !(this.triggeredStartedComponentForReadonlyStatus && question.isReadOnly)
    ) {
      rightIcons.push(questionCardIcons('assign'));
    }

    if (
      this.diligence.diligence_type != DiligenceTypeEnum.dd_review &&
      isEditable &&
      (question.responseType == ResponseType.TextEmail ||
        question.responseType == ResponseType.Text ||
        question.responseType == ResponseType.TextMultiLine)
    )
      rightIcons.push(questionCardIcons('autofill', question));

    if (
      !(this.triggeredStartedComponentForReadonlyStatus && question.isReadOnly)
    ) {
      !question?.answer?.attributes?.localis_NA &&
        rightIcons.push(questionCardIcons('draft', question));
      rightIcons.push(questionCardIcons('na', question));
    }

    if (
      this.user.isInvestor &&
      !question?.isSequence &&
      (this.diligence.isLocked ||
        this.diligence.diligence_type === DiligenceTypeEnum.dd_review)
    ) {
      rightIcons.push(questionCardIcons('flag', question));
    }
    let showRatingIcon;
    let selectedRatingScheme = this.store.selectSnapshot(
      (state) => state.questionnaire.selectedRatingScheme
    );
    if (
      this.diligence.diligence_type == DiligenceTypeEnum.dd_review &&
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

    if (
      this.user.isInvestor &&
      question.responseType === ResponseType.TextMultiLine &&
      this.diligence.diligence_type === DiligenceTypeEnum.dd_review
    ) {
      rightIcons.push(questionCardIcons('standard-text', question));
    }

    rightIcons.push(questionCardIcons('notes', question));

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
      ) &&
      this.diligence.diligence_type != DiligenceTypeEnum.dd_profile
    )
      rightIcons.push(questionCardIcons('addToPreapproved', question));

    question.selectedUser = [];
    this.status.updateQuestionsAssignment(
      question,
      this.teamMembersMap,
      this.userRolesMap
    );

    rightIcons.push(
      questionCardIcons('recommendation', question, this.diligence, this.util)
    );

    rightIcons.push(questionCardIcons('todo', question));
    if (showRatingIcon) {
      rightIcons.push(questionCardIcons('ban', question));
    }
    return rightIcons;
  }

  addLeftLinks(question: QuestionAttributeType) {
    let leftLinks = [];
    if (
      question.answer.attributes.localTextResponse &&
      NoCommentResponseTypes.includes(question.responseType as ResponseType) &&
      question?.answer?.attributes.localis_NA
    ) {
      question.showComment = true;
    }
    if (
      this.triggeredStartedComponentForReadonlyStatus &&
      question.isReadOnly
    ) {
      return leftLinks;
    }

    if (
      !NoCommentResponseTypes.includes(question.responseType as ResponseType)
    ) {
      this.status.isLeftLinkComment(leftLinks, question);
    }
    // Remove the deleted response Id if it the response is present
    if (question.answer.id) question.deleted_response_id = null;
    if (
      question?.answer?.attributes.revision_counts ||
      question?.answer?.attributes.revision_counts == 0 ||
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
    let isDelete = CanShowDeleteLink(
      question,
      this.triggeredStartedComponentForReadonlyStatus
    );
    if (isDelete) {
      isDelete =
        !this.user.isManager &&
        this.diligence.diligence_type !== DiligenceTypeEnum.dd_profile; // need to double check
      if (this.diligence.diligence_type != DiligenceTypeEnum.dd_profile) {
        isDelete = true;
      }
    }
    if (isDelete) {
      rightLinks.push({
        label: 'Delete Response', // Just for our ease of search keeping the label here
        icon: 'trashcan',
        key: 'delete',
        iconToolTip: 'Delete the response',
        color: 'default',
        class: 'new-link-wrapper questionnaire-delete-icon',
      });
    } else if (!isDelete && question.deleted_response_id) {
      // Show that response was deleted link and only show it when it has no response and it has deleted response id in question object
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
    return rightLinks;
  }
 
  handleCommentText({text, editor_id}, question) {
    this.status.updateCommentIfDraftPopUp(text, editor_id, question)
    this.onResponseChange.emit({
      isError: false,
      value: text,
      type: question.responseType,
      question,
      metaType: 'comment',
    });
    this.updateIconsAfterDraft(question);
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

  handleLinkClick(link: IconTypes, question: QuestionAttributeType, index) {
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
      case 'revision':
        let localNa = question.answer.attributes.localis_NA;
        this.status.handleRevision(question, () => {
          if (question.answer.attributes.localis_NA != localNa) {
            localNa = question.answer.attributes.localis_NA;
            question.answer.attributes.localis_NA =
              !question.answer.attributes.localis_NA;
            this.onIconClick.emit({ icon: { key: 'na' }, question });
          }

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
      case 'delete':
        question.deleted_response_id = question.answer.id;
        question.deleted_at = new Date();
        question.deleted_by = this.util.getCurrentUser().fullName;
        question.revision_counts =
          question.answer.attributes.revision_counts + 1;
        this.onLinkClick.emit({ link, question });
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

  handleIconClick(icon: IconTypes, question: QuestionAttributeType) {
    switch (icon.key) {
      case 'flag':
        question.answer.attributes.is_flagged =
          !question.answer.attributes.is_flagged;
        this.status.handleFlag(question, (isValid) => {
          if (isValid) {
            question.icons.rightIcons = this.addRightIcons(question);
          }
        });
        return;
      case 'standard-text':
        this.status.handleSmartText(question, this.reviewMappingsData);
        return;
      case 'autofill':
        this.status.handleAutoFill(question, () => {
          if (question.answer.attributes.localis_NA)
            this.onIconClick.emit({ icon: { key: 'na' }, question });
        });
        return;
      case 'notes':
        this.status.handleNotes(question, false, () => {
          question.icons.rightIcons = this.addRightIcons(question);
        });
        return;
      case 'addToPreapproved':
        this.status.handleAddToPreApprove(question);
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
      case 'assign':
        this.status.handleFunctionAssignment(question, icon, () => {
          question.icons.rightIcons = this.addRightIcons(question);
        });
        return;
      case 'todo':
        this.status.handleTodo(question, false, () => {
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
      case 'submitRevisions':
        this.status.handleSubmitRevisions(question.answer.id);
        return;
      default:
        this.onIconClick.emit({ icon, question });
        this.updateIconsAfterDraft(question);
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
      return;
    } else
      this.questionData[mainQuestionArrayIndex] = JSON.parse(
        JSON.stringify(question)
      );

    this.questionDuplicate[index] = this.questionData[mainQuestionArrayIndex];
  }

  updateIconsAfterDraft(question, error?) {
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
        !!(draftData && id in draftData && Object.values(draftData[id]).length),
        error
      ),
      rightIcons: this.addRightIcons(question, error),
    };
    if (question.nestedQuestions.length) {
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

  handleOnChange({ isError, value, type, disableDraft }, question) {
    this.status.handleOtherOptions(question, value);
    this.onResponseChange.emit({
      isError,
      value,
      type,
      question,
      disableDraft,
    });
    this.updateIconsAfterDraft(question, isError);
  }

  updatNestedViewLogic(questions, parent, localQuestionMap, ids = []) {
    questions.forEach((nested) => {
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
      nested.nestedID['icons'] = {
        leftIcons: this.status.addLeftIcons(
          nested.nestedID,
          !!(
            draftData &&
            id in draftData &&
            Object.values(draftData[id]).length
          )
        ),
        rightIcons: this.addRightIcons(nested.nestedID),
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

  handleScrollChange(scrollObject) {
    this.questionDuplicate = scrollObject.list;
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

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
