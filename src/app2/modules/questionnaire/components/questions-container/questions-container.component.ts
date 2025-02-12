import {
  Component,
  Input,
  OnChanges,
  OnInit,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import { diligenceStatusConstant } from '../../constants/quick-view-headers.constant';
import { ResponseType } from '../../constants/Response-type.constant';
import {
  DeleteDraftQuestionData,
  DeleteLocalQuestionMap,
  DeleteQuestionData,
  GetQuestionCount,
  GetQuestionData,
  SidePanelUpdate,
  UpdateActivePanelId,
  UpdateActiveSection,
  UpdateDraftData,
  UpdateLocalGridMap,
  UpdateLocalQuestionMap,
  UpdateSequenceSectionQuestionMap,
  UpdateShownModal,
} from '../../store/questionnaire.action';
import { StateDiligenceUpdateType } from '../../store/questionnaire.modal';
import { IconTypes } from '../../types/card-icons.type';
import {
  QuestionAttributeType,
  QuestionDetailsOnScroll,
} from '../../types/questions.type';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { DropdownDefault } from '../../constants/questions-container.constant';
import {
  DefaultQuestionState,
  LocalQuestionMapHelper,
  UpdateLocalQuestionState,
} from '../../store/questionnaire.util';
import { DiligenceTypeEnum } from '../../types/diligence-enum.type';
import { EntityType, responseStatus } from 'src/app2/shared/constants/constant';
import { QuestionState } from '../../store/questionnaire.state';
import { debounceTime, take, takeUntil } from 'rxjs/operators';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { Subject, forkJoin } from 'rxjs';
import { NoCommentResponseTypes } from '../../constants/question-status.constant';
import { getCurrentQuestionObject } from '../../util/nested-question.util';
import { CacheUtil } from '../../service/cache.service';
import { RouterService } from 'src/app2/services/router.service';
import { DvDraftService } from '../../service/draft.service';
import { ToastrService } from 'ngx-toastr';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { removeAllTrailingBreaksAndSpace } from 'src/app2/utils/tinymce.util';
import { ReviewCommentsService } from '../../service/review-comments.service';
import { UserState } from 'src/app2/store/user/user.state';
import { AutoScrollServiceService } from 'src/app2/services/auto-scroll-service.service';
import { NAOptions } from '../../constants/question-card-icons.constant';
import { QuestionnaireStatusService } from '../../service/status.service';
import { ErrorHandlerService } from 'src/app2/services/error-handler.service';
import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';
import { CKEditorPermissionService } from 'src/app2/services/ck-editor/ckeditor-permission.service';

@Component({
  selector: 'questions-container',
  templateUrl: './questions-container.component.html',
  styleUrls: ['./questions-container.component.css'],
})
export class QuestionsContainerComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() diligence: DiligenceType & StateDiligenceUpdateType;
  @Input() user;
  @Input() filterStatus;
  @Input() searchQuery;
  @Input() activeSection;
  @Input() silentReload;
  @Input() isSidePanelOpened;
  dueDiligenceType = 1105; // dueDiligence type
  currentComment = -1;
  headerIcons: IconTypes[] = [];
  localActiveSection;
  myFunctions; // need to make api call
  REVIEW_TIMELIMIT = 15000;
  questionData = [];
  teamMembers = {};
  subCatTitle = '';
  subCatData: any = {};
  assignedUser = [];
  localSection = '';
  localSequenceID = 0;
  sequenceIdMap = {};
  diligenceStatusConstant = diligenceStatusConstant;
  sequenceDropdown: any = DropdownDefault;
  DiligenceTypeEnum = DiligenceTypeEnum;
  sequenceQuestionData = [];
  loading = false;
  customField = [];
  ratingList = [];
  toggleRating = false;
  ratingID = null;
  isRevision = false;
  responseStatus = responseStatus;
  userRolesMap = {};
  paramsQuestionId = 0;
  previous = null;
  next = null;
  modalShown: boolean;
  isSequenceIdInRoute;
  bufferLoader = false; //Buffer loader was introduced to give time for grid questions to get fully loaded and then render all the questions together so that it wont create an issue with autscroll
  requiredQuestionIndex: number = 0; // Index of question that needs to be autoscrolled to.
  @Select(QuestionState.getFunctionAssignment) userRoleSub;
  @Select(QuestionState.getDraftData) draftData;
  @Select(QuestionState.getFilterReload) filter;
  @Select(UserState.getFirmPreferenceData) firmPref;
  loadingForRequiredPosition: boolean = false;
  ngUnsubscribe = new Subject<void>();
  triggerStartedComponentForReadonlyStatus: boolean;
  firmPreferences: any;
  questionId: any;
  duplicateSequenceId: any;
  sme: any = '';
  questionListUpdateOnScroll = new Subject<QuestionDetailsOnScroll>();
  constructor(
    private store: Store,
    private questionnaire: QuestionnaireService,
    private readonly SweetAlert: SweetAlertService,
    private readonly newModal: CustomModalService,
    private readonly cache: CacheUtil,
    private router: RouterService,
    private draftService: DvDraftService,
    private toast: ToastrService,
    private dvDatePipe: DvDatePipe,
    private status: QuestionnaireStatusService,
    private panel: SidePanelService,
    private util: UtilsService,
    private comment: ReviewCommentsService,
    private autoScroll: AutoScrollServiceService,
    private errorHandler: ErrorHandlerService,
    private ckEditorPermissionService: CKEditorPermissionService
  ) {}

  updatedButtons() {
    let sections = this.store.selectSnapshot(
      (state) => state.questionnaire.allSections
    );
    if (this.localActiveSection && sections) {
      this.previous = null;
      this.next = null;
      let currentIndex = null;
      sections.forEach((sec: any, index) => {
        if (this.localActiveSection.id == sec.id) {
          currentIndex = index;
        }
      });
      if (sections.length > 1) {
        if (currentIndex - 1 >= 0) {
          this.previous = sections[currentIndex - 1]?.attributes;
        }
        if (currentIndex + 1 <= sections.length - 1) {
          this.next = sections[currentIndex + 1]?.attributes;
        }
      }
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  ngOnInit(): void {
    this.ckEditorPermissionService.refreshPermissions();
    this.firmPref.pipe(take(2)).subscribe((firmPreferences) => {
      this.firmPreferences = firmPreferences;
    });
    this.loading = true;
    this.updatedButtons();
    this.store
      .selectSnapshot((state) => state.user.teamMembers)
      .map((team) => {
        team = JSON.parse(JSON.stringify(team));
        team.is_removed = false;
        this.teamMembers[team.id] = team;
      });
    this.paramsQuestionId = this.store.selectSnapshot(
      (state) => state.questionnaire.questionId
    );

    this.isSequenceIdInRoute = this.store.selectSnapshot(
      (state) => state.questionnaire.isSequenceIdInRoute
    );

    this.autoScroll.afterScrollEvent
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((value) => {
        if (value) {
          this.paramsQuestionId = null; //Remove the params questionID so that it wont get scrolled after every event
          this.requiredQuestionIndex = null;
          this.duplicateSequenceId = null;
        }
      });

    // Listen for active question list update
    // Hence, updates the ckeditor comments side-panel state.
    this.questionListUpdateOnScroll
      .pipe(takeUntil(this.ngUnsubscribe), debounceTime(300))
      .subscribe((data) => {
        this.closeSidePanelOnScroll(data);
      });

    this.userRoleSub.pipe(take(2)).subscribe((role) => {
      if (role) {
        role = JSON.parse(JSON.stringify(role));
        role.map((val) => {
          val.is_removed = false;
          this.userRolesMap[val.function_id] = val;
        });
      }
    });

    this.draftData.pipe(takeUntil(this.ngUnsubscribe)).subscribe((val) => {
      if (!val) {
        this.sequenceDropdown.forEach((seq) => {
          if (seq.key in this.draftService.sequenceIdMap) {
            seq.key = this.draftService.sequenceIdMap[seq.key];
          }
        });
      }
    });
    this.filter.pipe(takeUntil(this.ngUnsubscribe)).subscribe((filter) => {
      if (filter) {
        this.questionData = [];
        this.loading = true;
        this.store.dispatch(new GetQuestionData()).subscribe((res) => {
          this.loading = false;
          this.loadQuestionData();
        });
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.silentReload &&
      changes.silentReload.currentValue !== changes.silentReload.previousValue
    ) {
      // clearing existing grid, aum and option definitions to allow them to be fetched again
      // it is especially needed for autofill of custom grids where the grid definitions have to be fetched again to render the updated data
      this.cache.clearCache();
      this.comment.clearMultiTextData();
      this.store.dispatch(new GetQuestionData()).subscribe((res) => {
        this.loadQuestionData();
      });
    }
    if (
      changes.activeSection &&
      changes.activeSection.currentValue?.id !==
        changes.activeSection.previousValue?.id
    ) {
      if (changes?.activeSection?.currentValue)
        this.localActiveSection = JSON.parse(
          JSON.stringify(changes?.activeSection?.currentValue)
        );
      this.questionData = [];
      this.loading = true;
      this.comment.clearMultiTextData();
      this.store.dispatch(new GetQuestionData()).subscribe((res) => {
        this.loading = false;
        this.loadQuestionData();
      });
    }
  }

  loadQuestionData() {
    if (!this.localActiveSection?.id) return;
    this.updatedButtons();
    this.sequenceDropdown = [...DropdownDefault];
    const { questions } = this.store.selectSnapshot(
      (state) => state.questionnaire
    );
    if (!questions || !questions[this.localActiveSection.id]) {
      return;
    }
    let activeSectionQuestions = JSON.parse(
      JSON.stringify(Object.values(questions[this.localActiveSection.id]))
    );
    this.sequenceQuestionData = activeSectionQuestions.sort((left, right) =>
      left.index < right.index ? -1 : 1
    );
    let sequenceMap: Set<any> = new Set();
    let localGridMap = {};
    activeSectionQuestions.forEach((ques: any) => {
      sequenceMap.add(ques.sequenceID);
      this.initializeLocalGridMapForQuestionAndNestedQuestions(
        ques,
        localGridMap
      );
    });
    let sequenceSectionQuestionMap = {};
    let stateSequenceMap = JSON.parse(
      JSON.stringify(
        this.store.selectSnapshot((state) => state.questionnaire.sequenceMap)
      )
    );
    Object.keys(stateSequenceMap).map((key) => {
      sequenceSectionQuestionMap[key] = {
        [this.localActiveSection.id]: {},
      };
    });
    let error = false;
    this.sequenceQuestionData.map((val) => {
      if (Object.keys(sequenceSectionQuestionMap).length) {
        try {
          sequenceSectionQuestionMap[val.sequenceID][
            this.localActiveSection?.id
          ][val.id] = val;
        } catch (ex) {
          this.errorHandler.handleError(ex, {
            stateSequenceMap: JSON.stringify(stateSequenceMap),
            sequenceSectionQuestionMap: JSON.stringify(
              sequenceSectionQuestionMap
            ),
            activeSection: this.localActiveSection?.id ?? '',
            val: val?.id ?? '',
          });
        }
      }
      val.sequenceQuestionId = val.sequenceID + '-' + val.id;
    });
    if (error) return;
    if (this.localActiveSection.data.isMultiple) {
      this.questionData = JSON.parse(
        JSON.stringify([...this.sequenceQuestionData])
      );
      [...sequenceMap].forEach((val) => {
        if (val in stateSequenceMap) {
          delete stateSequenceMap[val];
        }
      });
      let localQuestionMap = {};
      this.loading = true;
      Object.keys(stateSequenceMap).forEach((sequenceID: any, index) => {
        let copySequenceQuestionData = JSON.parse(
          JSON.stringify(this.sequenceQuestionData)
        );
        sequenceID = Number(sequenceID);
        'responses' in stateSequenceMap[sequenceID] &&
          Object.keys(stateSequenceMap[sequenceID]['responses']).forEach(
            (questionID) => {
              localQuestionMap[questionID] =
                stateSequenceMap[sequenceID]['responses'][questionID];
            }
          );
        copySequenceQuestionData = copySequenceQuestionData.map((question) => {
          if (
            question.id in localQuestionMap &&
            stateSequenceMap[sequenceID]['responses'] &&
            question.id in stateSequenceMap[sequenceID]['responses']
          ) {
            this.setSequenceProperties(
              question,
              sequenceID,
              stateSequenceMap[sequenceID]['responses']
            );
          } else {
            question = {
              ...question,
              isSequence: true,
              sequenceID,
              assignedUser: {
                attributes: {
                  assigned_to: null,
                },
              },
              answer: {
                attributes: DefaultQuestionState(),
              },
            };
          }
          if (question?.nestedQuestions?.length) {
            this.updatedNestedQuestions(
              question.nestedQuestions,
              sequenceID,
              stateSequenceMap[sequenceID]['responses']
            );
          }
          this.store.dispatch(
            new UpdateLocalQuestionMap(
              `${sequenceID}-${question.sectionID}-${question.id}`,
              LocalQuestionMapHelper(question.answer)
            )
          );
          this.initializeLocalGridMapForQuestionAndNestedQuestions(
            question,
            localGridMap
          );
          return question;
        });
        let subCat = this.store.selectSnapshot(
          (state) => state.questionnaire.activeSection.label
        );
        this.sequenceDropdown.splice(this.sequenceDropdown.length - 1, 0, {
          label: `${subCat} (#${index + 1})`,
          key: sequenceID,
          rightIcon: 'trashcan',
        });
        if (this.sequenceDropdown[0].key === 'none') {
          this.sequenceDropdown.shift();
        }
        let lengthTillNow = this.questionData.length;
        copySequenceQuestionData.map((val, index) => {
          if (Object.keys(sequenceSectionQuestionMap).length)
            sequenceSectionQuestionMap[val.sequenceID][
              this.localActiveSection.id
            ][val.id] = val;
          val.sequenceIndex = lengthTillNow + index;
          val.sequenceQuestionId = val.sequenceID + '-' + val.id;
        });
        this.questionData = JSON.parse(
          JSON.stringify([...this.questionData, ...copySequenceQuestionData])
        );
      });
      this.loading = false;
    } else {
      this.questionData = JSON.parse(
        JSON.stringify(
          activeSectionQuestions.sort((left, right) =>
            left.index < right.index ? -1 : 1
          )
        )
      );
    }

    if (
      this.user.isManager &&
      !this.diligence.is_internal &&
      (this.diligence.status === diligenceStatusConstant.Completed ||
        this.diligence.status === diligenceStatusConstant.PendingRestart ||
        this.diligence.status === diligenceStatusConstant.Evaluation)
    ) {
      // check if there are any followups for manager on these statuses that require response revision
      // if yes, we will call questionnaire-started component even for these statuses
      // questions with followups will become editable and other questions will remain as readonly (default behavior in above statuses)
      this.questionData.forEach((question) => {
        this.setReadOnlyStatus(question);
      });
    }

    if (this.paramsQuestionId) {
      this.loadingForRequiredPosition = true;
      this.bufferLoader = true;
      this.calculateRequiredPosition(); // For knowing where do the desired question ( for autoscroll ) exsists in the question array
    } else this.loadingForRequiredPosition = false;
    this.store.dispatch(
      new UpdateSequenceSectionQuestionMap(sequenceSectionQuestionMap)
    );
    this.store.dispatch(new UpdateLocalGridMap(localGridMap));
    let paramStatus = this.router.getState().params?.status;
    this.modalShown = this.store.selectSnapshot(
      (state) => state.questionnaire.introModalShown
    );
    if (
      !this.firmPreferences?.disable_project_info_popup &&
      !paramStatus &&
      !this.modalShown &&
      ![
        diligenceStatusConstant.Approved,
        diligenceStatusConstant.Completed,
        diligenceStatusConstant.NotApproved,
      ].includes(this.diligence.status)
    )
      this.showTemplateInfoModal();
  }

  setReadOnlyStatus(question, isParentReadOnly = true) {
    if (!question.answer?.id) {
      const isRevisionAllowed =
        question.followup_count &&
        question.sequenceID in question.followup_count &&
        question.followup_count[question.sequenceID].allow_response_revision &&
        question.followup_count[question.sequenceID]
          .last_investor_followup_created_date > this.diligence.completed_at &&
        question.followup_count[question.sequenceID].count > 0;

      if (!question.isNested) {
        question.isReadOnly = !isRevisionAllowed;
      } else {
        question.isReadOnly = !isRevisionAllowed && isParentReadOnly;
      }
    } else {
      question.isReadOnly = question.answer.attributes.is_submitted;
    }
    if (!question.isReadOnly) {
      this.triggerStartedComponentForReadonlyStatus = true;
    }

    if (question.nestedQuestions?.length) {
      question.nestedQuestions.forEach((nestedQuestion) => {
        this.setReadOnlyStatus(nestedQuestion.nestedID, question.isReadOnly);
      });
    }
  }

  setSequenceProperties(question, sequenceId, sequenceResponseMap) {
    if (question != null) {
      question.sequenceID = sequenceId;
      question.isSequence = true;
      if (question.id in sequenceResponseMap) {
        question.answer = sequenceResponseMap[question.id];
      } else {
        question = {
          ...question,
          assignedUser: {
            attributes: {
              assigned_to: null,
            },
          },
          answer: {
            attributes: DefaultQuestionState(),
          },
        };
      }
    }
  }

  updatedNestedQuestions(questions, sequenceID, sequenceResponseMap) {
    questions.forEach((nested) => {
      if (nested.nestedID.sequenceID != sequenceID) {
        nested.nestedID.sequenceID = sequenceID;
        nested.nestedID.isSequence = true;
        nested.nestedID.assignedUser = {
          attributes: {
            assigned_to: null,
          },
        };
        if (sequenceResponseMap && sequenceResponseMap[nested.nestedID.id])
          nested.nestedID.answer = sequenceResponseMap[nested.nestedID.id];
        else
          nested.nestedID.answer = {
            attributes: DefaultQuestionState(),
          };
        this.store.dispatch(
          new UpdateLocalQuestionMap(
            `${sequenceID}-${nested.nestedID.sectionID}-${nested.nestedID.id}`,
            LocalQuestionMapHelper(nested.nestedID.answer)
          )
        );
      }
      if (nested.nestedID?.nestedQuestions?.length) {
        this.updatedNestedQuestions(
          nested.nestedID.nestedQuestions,
          sequenceID,
          sequenceResponseMap
        );
      }
    });
  }

  initializeLocalGridMapForQuestionAndNestedQuestions(question, localGridMap) {
    if (!question) {
      return;
    }

    if (
      question.responseType === ResponseType.Grid ||
      question.responseType === ResponseType.DynamicGrid
    ) {
      this.initializeLocalGridMap(question, localGridMap);
    }

    question?.nestedQuestions?.forEach((nestedQuestion) => {
      this.initializeLocalGridMapForQuestionAndNestedQuestions(
        nestedQuestion?.nestedID,
        localGridMap
      );
    });
  }

  initializeLocalGridMap(question, localGridMap) {
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
  }

  handleSubscriber({ member, icon }) {
    if (!member.is_removed) this.assignedUser.push(member);
    this.assignedUser = this.assignedUser.filter(
      (user) => !(user.id === member.id && member.is_removed)
    );
    let params: any = {
      assigned_to: member.id,
      duediligence_id: this.diligence.id,
      entity_id: this.localActiveSection.id,
      entity_type: 'section',
    };
    if (member.is_removed) {
      params.is_removed = true;
    }
    this.questionnaire.updateEntityAssignments(params).subscribe();
  }
  showTemplateInfoModal() {
    this.questionnaire
      .getModalPopUpInfo({
        entity_id: this.diligence.id,
        entity_type: EntityType.Project,
      })
      .subscribe(async (data: any) => {
        if (!data || !data?.intro_json.template_info_modal) {
          let obj = [];
          obj.push(
            this.questionnaire.getTemplateDesc(this.diligence.template_id)
          );
          obj.push(
            this.questionnaire.getTemplateInfo(
              this.diligence.template_id,
              this.diligence.template_version
            )
          );

          forkJoin(obj).subscribe((res) => {
            let { diligence, introModalShown } = this.store.selectSnapshot(
              (state) => state.questionnaire
            );
            if (
              diligence &&
              !introModalShown &&
              (this.newModal.ref?.id ?? '') !== 'template-info'
            ) {
              this.newModal.invoke('template-info', {
                initialState: {
                  showFirstButton: true,
                  templateMetaData: res[1],
                  description: res[0],
                  user: this.user,
                },
              });
              this.store.dispatch(new UpdateShownModal(true));
            }
          });
        }
      });
  }
  handleIconClick({
    icon,
    question,
  }: {
    icon: IconTypes;
    question: QuestionAttributeType;
  }) {
    const answer = question?.answer?.attributes;
    switch (icon.key) {
      case 'na':
        answer.localis_NA = !answer.localis_NA;
        question.showComment = answer.localis_NA
          ? false
          : !NoCommentResponseTypes.includes(
              answer.response_type as ResponseType
            ) && !!answer.localTextResponse;

        this.helperResponseType(
          '',
          answer.localis_NA,
          question.responseType,
          question,
          'is_NA'
        );
        if (icon?.value) {
          if (answer.localis_NA) {
            if (
              !NAOptions.map((val) => val.label).includes(
                answer.localTextResponse
              )
            )
              answer.tempTextResponse = answer.localTextResponse;
            question.showComment = true;
          } else {
            question.showComment =
              icon?.value.key == 'other' ||
              (!NoCommentResponseTypes.includes(
                answer.response_type as ResponseType
              ) &&
                !!answer.tempTextResponse);
            if (answer.tempTextResponse == undefined) {
              answer.tempTextResponse = null;
            }
          }

          this.handleResponseChange({
            isError: icon?.value.key == 'other',
            value: !answer.localis_NA
              ? answer.tempTextResponse
              : icon?.value.key == 'other'
              ? ''
              : icon?.value?.label,
            type: question.responseType,
            question,
            metaType: 'comment',
            disableDraft: false,
          });
        }
        // Doing this to updating comment placeholder
        if (question.showComment)
          setTimeout(() => {
            question.showComment = !question.showComment;
            setTimeout(() => {
              question.showComment = !question.showComment;
            }, 100);
          }, 100);
        return;
      case 'draft':
        answer.localis_WIP = !answer.localis_WIP;
        this.helperResponseType(
          '',
          answer.localis_WIP,
          question.responseType,
          question,
          'is_WIP'
        );
        return;
      case 'autofill':
        this.helperResponseType(
          '',
          answer.localTextResponse,
          question.responseType,
          question,
          'response'
        );
        return;
      case 'tableValidation':
        answer.localis_validation_required = false;
        this.helperResponseType(
          '',
          answer.localis_validation_required,
          question.responseType,
          question,
          'validationRequired'
        );
        return;
    }
  }

  helperResponseType(isError, value, type, question, metaType) {
    if (
      type === ResponseType.Numeric ||
      type === ResponseType.Identifier ||
      type === ResponseType.Integer ||
      type === ResponseType.TextPhone ||
      type === ResponseType.Percentage
    ) {
      this.handleIntResponseType(isError, value, type, question, metaType);
    }
    if (type === ResponseType.Dropdown) {
      this.handleDropdownResponseType(isError, value, type, question, metaType);
    }
    if (type === ResponseType.CheckBox) {
      this.handleCheckboxResponseType(isError, value, type, question, metaType);
    }
    if (type === ResponseType.Grid || type === ResponseType.DynamicGrid) {
      this.handleGridResponseType(isError, value, type, question, metaType);
    }
    if (
      type === ResponseType.TextEmail ||
      type === ResponseType.Text ||
      type === ResponseType.TextMultiLine
    ) {
      this.handleTextResponseType(isError, value, type, question, metaType);
    }
    if (
      type === ResponseType.NoPlus ||
      type === ResponseType.BooleanPlus ||
      type === ResponseType.Boolean
    ) {
      this.handleBooleanResponseType(isError, value, type, question, metaType);
    }
    if (type === ResponseType.Bookends) {
      this.handleBookendResponseType(isError, value, type, question, metaType);
    }
    if (type === ResponseType.aumTable) {
      this.handleAumTableResponseType(isError, value, type, question, metaType);
    }
    if (type === ResponseType.ReturnTable) {
      this.handleReturnResponseType(isError, value, type, question, metaType);
    }
    if (type === ResponseType.Date) {
      this.handleDateResponseType(isError, value, type, question, metaType);
    }
    if (type === ResponseType.Attachment) {
      this.handleAttachmentResponseType(
        isError,
        value,
        type,
        question,
        metaType
      );
    }
  }

  handleSequenceClick(icon) {
    this.duplicateSequenceId = icon.key;
    switch (icon.key) {
      case 'more':
        if (this.sequenceDropdown[0].key === 'none')
          this.sequenceDropdown.shift();
        let randomId = Math.random();
        let localGridMap = JSON.parse(
          JSON.stringify(
            this.store.selectSnapshot(
              (state) => state.questionnaire.localGridMap
            )
          )
        );
        let localData = JSON.parse(JSON.stringify(this.sequenceQuestionData));
        let lengthTillNow = this.questionData.length;
        localData = localData.map((question, index) => {
          question = {
            ...question,
            isSequence: true,
            sequenceID: randomId,
            sequenceIndex: lengthTillNow + index,
            assignedUser: {
              attributes: {
                assigned_to: null,
              },
            },
            answer: {
              attributes: DefaultQuestionState(),
            },
          };
          if (question.nestedQuestions.length) {
            this.copyNestedViewLogic(question.nestedQuestions, randomId);
          }
          this.initializeLocalGridMapForQuestionAndNestedQuestions(
            question,
            localGridMap
          );
          return question;
        });

        this.sequenceIdMap[randomId] = null;
        this.questionData = [...this.questionData, ...localData];
        let subCat = this.store.selectSnapshot(
          (state) => state.questionnaire.activeSection.label
        );
        this.sequenceDropdown.splice(this.sequenceDropdown.length - 1, 0, {
          label: `${subCat} (#${this.sequenceDropdown.length})`,
          key: randomId,
          rightIcon: 'trashcan',
          class: 'justify-space-between',
        });
        this.toast.success('Subcategory duplicated successfully');
        this.store.dispatch(new UpdateLocalGridMap(localGridMap));
        this.duplicateSequenceId = randomId;
        return;
      default:
        return '';
    }
  }

  handleSequenceIconClick(icon) {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to delete this sub-category ?',
      confirmButtonText: 'Yes, Delete it!',
      showLoaderOnConfirm: true,
      focusCancel: true,
      preConfirm: async () => {
        this.sequenceDropdown = this.sequenceDropdown.filter(
          (val) => val.key !== icon.key
        );
        this.questionData = this.questionData.filter(
          (val) => val.sequenceID !== icon.key
        );
        let draftData = this.store.selectSnapshot(
          (state) => state.questionnaire.draftData
        );
        let ids = [];
        draftData &&
          Object.keys(draftData).forEach((keys: string) => {
            if (`${keys}`.includes(icon.key)) ids.push(keys);
          });
        this.store.dispatch(new DeleteDraftQuestionData(ids));
        try {
          icon.key > 1 &&
            (await this.questionnaire.deleteSequence(icon.key).toPromise());
        } catch (errro) {}
        this.SweetAlert.close();
        if (this.sequenceDropdown.length == 1)
          this.sequenceDropdown = [...DropdownDefault];
      },
    });
  }

  handleLinkClick({
    link,
    question,
  }: {
    link: IconTypes;
    question: QuestionAttributeType;
  }) {
    if (link.key === 'showMappedQuestions') {
      this.helperResponseType(
        '',
        question.answer.attributes.localTextResponse,
        question.responseType,
        question,
        'response'
      );
    }
    if (link.key === 'delete') {
      this.SweetAlert.confirm({
        title: 'Are you sure you want to delete this response ?',
        confirmButtonText: 'Yes, Delete it!',
        showLoaderOnConfirm: true,
        focusCancel: true,
        preConfirm: async () => {
          try {
            await this.store
              .dispatch(
                new DeleteQuestionData(this.localActiveSection.id, question)
              )
              .toPromise();
            if (this.diligence.diligence_type === DiligenceTypeEnum.dd_review) {
              question?.questionRating?.score_value
                ? (question.questionRating.score_value = null)
                : '';
              question?.questionRating?.rating_value
                ? (question.questionRating.rating_value = null)
                : '';
            }
            this.store.dispatch(new UpdateActivePanelId(''));
            this.panel.close();
            this.store.dispatch(new SidePanelUpdate(null));
            let isQuestionFound = false;
            let data = [];
            let localQuestion = getCurrentQuestionObject(
              this.questionData,
              question,
              data,
              this.store,
              isQuestionFound,
              this.dvDatePipe
            );
            if (data.length)
              await forkJoin(
                data.map((action) => this.store.dispatch(action))
              ).toPromise();
            this.store.dispatch(new GetQuestionCount());
            this.setQuestionReset(question, localQuestion);
          } catch (error) {
            console.error(error);
          }
        },
      });
    }
  }

  setQuestionReset(question, localQuestion) {
    const id = `${question.sequenceID}-${question.sectionID}-${question.id}`;
    this.store.dispatch(new DeleteLocalQuestionMap(id));
    question = {
      ...question,
      answer: {
        attributes: DefaultQuestionState(),
      },
      showComment: false,
    };
    UpdateLocalQuestionState(question.answer, this.dvDatePipe);
    this.store.dispatch(
      new UpdateLocalQuestionMap(id, LocalQuestionMapHelper(question.answer))
    );
    if (question.responseType === ResponseType.DynamicGrid) {
      this.cache.deleteGridRows(id);
    }
    this.status.updateLocalQuestionMap();
    this.questionData = JSON.parse(JSON.stringify(localQuestion));
    this.SweetAlert.close();
  }

  async handleResponseChange({
    isError,
    value,
    type,
    question,
    metaType,
    disableDraft,
  }) {
    if (metaType == 'comment') {
      const id = `${question.sequenceID}-${question.sectionID}-${question.id}`;
      isError = this.status.localQuestionMapSub[id]?.isResponseError;
      if (question.answer.attributes.localis_NA)
        isError = question.answer.attributes.localis_NA && !value;
    }
    if (
      type === ResponseType.Numeric ||
      type === ResponseType.Identifier ||
      type === ResponseType.Integer ||
      type === ResponseType.TextPhone ||
      type === ResponseType.Percentage
    ) {
      this.handleIntResponseType(isError, value, type, question, metaType);
    }
    if (type === ResponseType.Dropdown) {
      this.handleDropdownResponseType(isError, value, type, question, metaType);
    }
    if (type === ResponseType.CheckBox) {
      this.handleCheckboxResponseType(isError, value, type, question, metaType);
    }
    if (type === ResponseType.Grid || type === ResponseType.DynamicGrid) {
      this.handleGridResponseType(
        isError,
        value,
        type,
        question,
        metaType,
        disableDraft
      );
    }
    if (
      type === ResponseType.TextEmail ||
      type === ResponseType.Text ||
      type === ResponseType.TextMultiLine
    ) {
      this.handleTextResponseType(isError, value, type, question, metaType);
    }
    if (
      type === ResponseType.NoPlus ||
      type === ResponseType.BooleanPlus ||
      type === ResponseType.Boolean
    ) {
      this.handleBooleanResponseType(isError, value, type, question, metaType);
    }
    if (type === ResponseType.Bookends) {
      this.handleBookendResponseType(isError, value, type, question, metaType);
    }
    if (type === ResponseType.aumTable) {
      this.handleAumTableResponseType(isError, value, type, question, metaType);
    }
    if (type === ResponseType.ReturnTable) {
      this.handleReturnResponseType(isError, value, type, question, metaType);
    }
    if (type === ResponseType.Date) {
      this.handleDateResponseType(isError, value, type, question, metaType);
    }
    if (type === ResponseType.Attachment) {
      this.handleAttachmentResponseType(
        isError,
        value,
        type,
        question,
        metaType
      );
    }
  }

  handleBookendResponseType(isError, value, type, question, metaType) {
    let answer = question?.answer?.attributes;
    let localState: any = { isResponseError: !!isError };
    if (metaType === 'comment') {
      localState = {
        ...localState,
        textResponse: value,
      };
      question.answer.attributes.localTextResponse = value;
    } else if (metaType === 'is_NA') {
      localState = {
        ...localState,
        is_NA: value,
        textResponse: null,
      };
    } else if (metaType === 'is_WIP') {
      localState = {
        ...localState,
        is_WIP: value,
      };
    } else {
      const { min, max } = value;
      localState = {
        ...localState,
        numericResponseA: min,
        numericResponseB: max,
        isResponseError: !!isError,
      };
      answer.localErrorState = isError;
    }
    const id = `${question.sequenceID}-${question.sectionID}-${question.id}`;
    this.store.dispatch(new UpdateLocalQuestionMap(id, localState));
    const {
      textResponse,
      numericResponseA,
      numericResponseB,
      is_NA,
      is_WIP,
      is_validation_required,
      isResponseError,
    } = this.store.selectSnapshot(
      (state) => state.questionnaire.localQuestionMap
    )[id];
    if (
      isResponseError ||
      (answer.numericResponseA == (is_NA ? null : numericResponseA) &&
        answer.numericResponseB == (is_NA ? null : numericResponseB) &&
        answer.textResponse == textResponse &&
        answer.is_NA == is_NA &&
        answer.is_WIP == is_WIP)
    )
      isError = true;
    this.store.dispatch(
      new UpdateDraftData({
        id,
        type: 'response',
        isError,
        api: {
          response: {
            duediligence_id: this.diligence.id,
            SectionID: this.activeSection.id,
            questionID: question.id,
            isSequence: question.isSequence,
            response: {
              textResponse,
              response_type: type,
              sequenceID: question.sequenceID,
              numericResponseA: is_NA ? null : numericResponseA,
              numericResponseB: is_NA ? null : numericResponseB,
              is_NA,
              is_WIP,
              is_validation_required,
              trigger_review: answer.trigger_review,
            },
          },
        },
      })
    );
  }

  handleIntResponseType(isError, value, type, question, metaType) {
    let answer = question?.answer?.attributes;
    let localState: any = { isResponseError: !!isError };
    if (metaType === 'comment') {
      localState = {
        ...localState,
        textResponse: value,
      };
      question.answer.attributes.localTextResponse = value;
    } else if (metaType === 'is_NA') {
      localState = {
        ...localState,
        is_NA: value,
        textResponse: null,
      };
    } else if (metaType === 'is_WIP') {
      localState = {
        ...localState,
        is_WIP: value,
      };
    } else {
      localState = {
        ...localState,
        numericResponseA: value ? Number(value) : null,
        isResponseError: !!isError,
      };
      answer.localErrorState = isError;
    }
    const id = `${question.sequenceID}-${question.sectionID}-${question.id}`;
    this.store.dispatch(new UpdateLocalQuestionMap(id, localState));
    const {
      textResponse,
      numericResponseA,
      is_NA,
      is_WIP,
      is_validation_required,
      isResponseError,
    } = this.store.selectSnapshot(
      (state) => state.questionnaire.localQuestionMap
    )[id];
    if (
      isResponseError ||
      (answer.numericResponseA == (is_NA ? null : numericResponseA) &&
        answer.textResponse === textResponse &&
        answer.is_NA == is_NA &&
        answer.is_WIP == is_WIP)
    )
      isError = true;
    this.store.dispatch(
      new UpdateDraftData({
        id,
        type: 'response',
        isError,
        api: {
          response: {
            duediligence_id: this.diligence.id,
            SectionID: this.activeSection.id,
            questionID: question.id,
            isSequence: question.isSequence,
            response: {
              textResponse,
              response_type: type,
              numericResponseA: is_NA ? null : numericResponseA,
              sequenceID: question.sequenceID,
              is_NA,
              is_WIP,
              is_validation_required,
              trigger_review: answer.trigger_review,
            },
          },
        },
      })
    );
  }

  handleDateResponseType(isError, value, type, question, metaType) {
    let answer = question?.answer?.attributes;
    let localState: any = { isResponseError: !!isError };
    if (metaType === 'comment') {
      localState = {
        ...localState,
        textResponse: value,
      };
      question.answer.attributes.localTextResponse = value;
    } else if (metaType === 'is_NA') {
      localState = {
        ...localState,
        is_NA: value,
        textResponse: null,
      };
    } else if (metaType === 'is_WIP') {
      localState = {
        ...localState,
        is_WIP: value,
      };
    } else {
      localState = {
        ...localState,
        dateResponse: value,
        isResponseError: !!isError,
      };
      answer.localErrorState = isError;
    }
    const id = `${question.sequenceID}-${question.sectionID}-${question.id}`;
    this.store.dispatch(new UpdateLocalQuestionMap(id, localState));

    const {
      textResponse,
      dateResponse,
      is_NA,
      is_WIP,
      is_validation_required,
      isResponseError,
    } = this.store.selectSnapshot(
      (state) => state.questionnaire.localQuestionMap
    )[id];
    if (
      isResponseError ||
      (answer.dateResponse == (is_NA ? null : dateResponse) &&
        answer.textResponse === textResponse &&
        answer.is_NA == is_NA &&
        answer.is_WIP == is_WIP)
    )
      isError = true;
    this.store.dispatch(
      new UpdateDraftData({
        id,
        type: 'response',
        isError,
        api: {
          response: {
            duediligence_id: this.diligence.id,
            SectionID: this.activeSection.id,
            questionID: question.id,
            isSequence: question.isSequence,
            response: {
              textResponse,
              response_type: type,
              dateResponse: is_NA ? null : dateResponse,
              sequenceID: question.sequenceID,
              is_NA,
              is_WIP,
              is_validation_required,
              trigger_review: answer.trigger_review,
            },
          },
        },
      })
    );
  }

  handleTextResponseType(isError, value, type, question, metaType) {
    let answer = question?.answer?.attributes;
    let editorId;
    let localState: any = { isResponseError: !!isError };
    if (metaType === 'is_NA') {
      localState = {
        ...localState,
        is_NA: value,
        textResponse: null,
      };
    } else if (metaType === 'is_WIP') {
      localState = {
        ...localState,
        is_WIP: value,
      };
    } else if (metaType === 'validationRequired') {
      localState = {
        ...localState,
        is_validation_required: value,
      };
    } else {
      if (value) {
        value = value.replace(' tox-comment--active', '');
      }
      localState = {
        ...localState,
        responseText: value ? value : null,
        textResponse: value ? value : null,
        isResponseError: !!isError,
      };
      answer.localErrorState = isError;
      answer.localTextResponse = value ? value : null;
    }
    const id = `${question.sequenceID}-${question.sectionID}-${question.id}`;
    this.store.dispatch(new UpdateLocalQuestionMap(id, localState));
    const {
      textResponse,
      responseText,
      is_NA,
      is_WIP,
      is_validation_required,
      isResponseError,
    } = this.store.selectSnapshot(
      (state) => state.questionnaire.localQuestionMap
    )[id];
    if (
      isResponseError ||
      ((answer?.textResponse?.replace(' tox-comment--active', '') || null) ===
        textResponse &&
        answer.is_NA == is_NA &&
        answer.is_WIP == is_WIP &&
        answer.is_validation_required == is_validation_required)
    )
      isError = true;
    this.store.dispatch(
      new UpdateDraftData({
        id,
        type: 'response',
        isError,
        api: {
          response: {
            duediligence_id: this.diligence.id,
            SectionID: this.activeSection.id,
            questionID: question.id,
            isSequence: question.isSequence,
            bulkResolveComments: this.shouldBulkResolveComments(
              type,
              question,
              textResponse
            ),
            responseId: question.answer.id,
            response: {
              textResponse: textResponse,
              response_type: type,
              sequenceID: question.sequenceID,
              is_NA,
              is_WIP,
              is_validation_required,
              trigger_review: answer.trigger_review,
            },
          },
        },
      })
    );
  }

  shouldBulkResolveComments(type, question, textResponse) {
    // if user removes the entire text, bulk resolve all the comments
    return (
      type === ResponseType.TextMultiLine &&
      this.diligence.isReadonlyEditable &&
      question.answer.attributes.response_status !=
        this.responseStatus.STARTED &&
      question.answer.id &&
      !textResponse
    );
  }

  handleDropdownResponseType(isError, value, type, question, metaType) {
    let answer = question?.answer?.attributes;
    let localState: any = {
      isResponseError: !!isError,
      textResponse: answer.textResponse,
    };
    if (metaType === 'comment') {
      localState = {
        ...localState,
        textResponse: value,
      };
      question.answer.attributes.localTextResponse = value;
    } else if (metaType === 'is_NA') {
      localState = {
        ...localState,
        is_NA: value,
        isResponseError: false,
        textResponse: null,
      };
    } else if (metaType === 'is_WIP') {
      localState = {
        ...localState,
        is_WIP: value,
      };
    } else {
      localState = {
        ...localState,
        listValueID: value.id !== null ? [value.id] : null,
        isResponseError: !!isError,
      };
      if (value.isOther) localState.textResponse = value.otherExplanation;
      else if (!value.isOther) localState.textResponse = value.textResponse;
      answer.localErrorState = isError;
    }
    const id = `${question.sequenceID}-${question.sectionID}-${question.id}`;
    this.store.dispatch(new UpdateLocalQuestionMap(id, localState));
    const {
      textResponse,
      listValueID,
      is_NA,
      is_WIP,
      is_validation_required,
      isResponseError,
    } = this.store.selectSnapshot(
      (state) => state.questionnaire.localQuestionMap
    )[id];
    if (
      isResponseError ||
      (answer.textResponse === textResponse &&
        ((answer.listValueID &&
          listValueID &&
          answer.listValueID[0] === listValueID[0]) ||
          (answer.listValueID === null && listValueID === null)) &&
        answer.is_NA == is_NA &&
        answer.is_WIP == is_WIP)
    )
      isError = true;
    this.store.dispatch(
      new UpdateDraftData({
        id,
        type: 'response',
        isError,
        api: {
          response: {
            duediligence_id: this.diligence.id,
            SectionID: this.activeSection.id,
            questionID: question.id,
            isSequence: question.isSequence,
            response: {
              textResponse,
              response_type: type,
              listValueID: is_NA ? null : listValueID,
              sequenceID: question.sequenceID,
              is_NA,
              is_WIP,
              is_validation_required,
              trigger_review: answer.trigger_review,
            },
          },
        },
      })
    );
  }

  handleCheckboxResponseType(isError, value, type, question, metaType) {
    let answer = question?.answer?.attributes;
    let localState: any = {
      isResponseError: !!isError,
      textResponse: answer.textResponse,
    };
    if (metaType === 'comment') {
      localState = {
        ...localState,
        textResponse: value,
      };
      question.answer.attributes.localTextResponse = value;
    } else if (metaType === 'is_NA') {
      localState = {
        ...localState,
        is_NA: value,
        isResponseError: false,
        textResponse: null,
      };
    } else if (metaType === 'is_WIP') {
      localState = {
        ...localState,
        is_WIP: value,
      };
    } else {
      localState = {
        ...localState,
        listValueID: value.checkedOptions,
        isResponseError: !!isError,
      };
      if (value.isOther) localState.textResponse = value.otherExplanation;
      else if (!value.isOther) localState.textResponse = value.textResponse;
      answer.localErrorState = isError;
      answer.localListValueID = value.checkedOptions;
    }
    const id = `${question.sequenceID}-${question.sectionID}-${question.id}`;
    this.store.dispatch(new UpdateLocalQuestionMap(id, localState));

    const {
      textResponse,
      listValueID,
      is_NA,
      is_WIP,
      is_validation_required,
      isResponseError,
    } = this.store.selectSnapshot(
      (state) => state.questionnaire.localQuestionMap
    )[id];
    if (
      isResponseError ||
      (answer.textResponse === textResponse &&
        JSON.stringify(answer?.listValueID ?? []) ===
          (is_NA ? null : JSON.stringify(listValueID ?? [])) &&
        answer.is_NA == is_NA &&
        answer.is_WIP == is_WIP)
    )
      isError = true;
    this.store.dispatch(
      new UpdateDraftData({
        id,
        type: 'response',
        isError,
        api: {
          response: {
            duediligence_id: this.diligence.id,
            SectionID: this.activeSection.id,
            questionID: question.id,
            isSequence: question.isSequence,
            response: {
              textResponse,
              response_type: type,
              listValueID: is_NA ? null : listValueID,
              sequenceID: question.sequenceID,
              is_NA,
              is_WIP,
              is_validation_required,
              trigger_review: answer.trigger_review,
            },
          },
        },
      })
    );
  }

  handleAttachmentResponseType(isError, value, type, question, metaType) {
    let answer = question?.answer?.attributes;
    let localState: any = { isResponseError: !!isError };
    if (metaType === 'comment') {
      localState = {
        ...localState,
        textResponse: value,
      };
      question.answer.attributes.localTextResponse = value;
    } else if (metaType === 'is_NA') {
      localState = {
        ...localState,
        is_NA: value,
        textResponse: null,
      };
    } else if (metaType === 'is_WIP') {
      localState = {
        ...localState,
        is_WIP: value,
      };
    } else {
      localState = {
        ...localState,
        attachmentIds: value.length ? value : null,
        isResponseError: !!isError,
      };
      answer.localErrorState = isError;
      answer.localAttachmentIds = value.length ? value : null;
    }
    const id = `${question.sequenceID}-${question.sectionID}-${question.id}`;
    this.store.dispatch(new UpdateLocalQuestionMap(id, localState));

    const {
      textResponse,
      attachmentIds,
      is_NA,
      is_WIP,
      is_validation_required,
      isResponseError,
    } = this.store.selectSnapshot(
      (state) => state.questionnaire.localQuestionMap
    )[id];
    if (
      isResponseError ||
      (answer.textResponse === textResponse &&
        JSON.stringify(answer?.attachmentIds) ===
          (is_NA ? JSON.stringify([]) : JSON.stringify(attachmentIds)) &&
        answer.is_NA == is_NA &&
        answer.is_WIP == is_WIP)
    )
      isError = true;
    this.store.dispatch(
      new UpdateDraftData({
        id,
        type: 'response',
        isError,
        api: {
          response: {
            duediligence_id: this.diligence.id,
            SectionID: this.activeSection.id,
            questionID: question.id,
            isSequence: question.isSequence,
            response: {
              textResponse,
              response_type: type,
              attachmentIds: is_NA ? null : attachmentIds,
              sequenceID: question.sequenceID,
              is_NA,
              is_WIP,
              is_validation_required,
              trigger_review: answer.trigger_review,
            },
          },
        },
      })
    );
  }

  handleBooleanResponseType(isError, value, type, question, metaType) {
    let answer = question?.answer?.attributes;
    let localState: any = { isResponseError: !!isError };
    if (metaType === 'comment') {
      localState = {
        ...localState,
        textResponse: value,
      };
      question.answer.attributes.localTextResponse = value;
    } else if (metaType === 'is_NA') {
      localState = {
        ...localState,
        is_NA: value,
        isResponseError: false,
        textResponse: null,
      };
    } else if (metaType === 'is_WIP') {
      localState = {
        ...localState,
        is_WIP: value,
      };
    } else {
      let { boolean, explaination } = value;
      localState = {
        ...localState,
        booleanResponse: boolean === 'yes',
        textResponse: explaination,
        isResponseError: !!isError,
      };
      answer.localErrorState = isError;
      answer.localBooleanResponse = boolean === 'yes';
    }
    const id = `${question.sequenceID}-${question.sectionID}-${question.id}`;
    this.store.dispatch(new UpdateLocalQuestionMap(id, localState));
    const {
      textResponse,
      booleanResponse,
      is_NA,
      is_WIP,
      is_validation_required,
      isResponseError,
    } = this.store.selectSnapshot(
      (state) => state.questionnaire.localQuestionMap
    )[id];
    if (
      isResponseError ||
      ((answer.booleanExplanation || answer.textResponse) === textResponse &&
        answer?.booleanResponse === (is_NA ? null : booleanResponse) &&
        answer.is_NA == is_NA &&
        answer.is_WIP == is_WIP)
    )
      isError = true;
    this.store.dispatch(
      new UpdateDraftData({
        id,
        type: 'response',
        isError,
        api: {
          response: {
            duediligence_id: this.diligence.id,
            SectionID: this.activeSection.id,
            questionID: question.id,
            isSequence: question.isSequence,
            response: {
              textResponse,
              response_type: type,
              booleanResponse: is_NA ? null : booleanResponse,
              sequenceID: question.sequenceID,
              is_NA,
              is_WIP,
              is_validation_required,
              trigger_review: answer.trigger_review,
            },
          },
        },
      })
    );
  }

  handleGridResponseType(
    isError,
    value,
    type,
    question,
    metaType,
    disableDraft?
  ) {
    const id = `${question.sequenceID}-${question.sectionID}-${question.id}`;
    let answer = question?.answer?.attributes;
    let localState: any = { isResponseError: !!isError };
    let localGridMap = JSON.parse(
      JSON.stringify(
        this.store.selectSnapshot((state) => state.questionnaire.localGridMap)
      )
    );
    if (metaType === 'comment') {
      localState = {
        ...localState,
        textResponse: value,
      };
      question.answer.attributes.localTextResponse = value;
    } else if (metaType === 'is_NA') {
      localState = {
        ...localState,
        is_NA: value,
      };
    } else if (metaType === 'is_WIP') {
      localState = {
        ...localState,
        is_WIP: value,
      };
    } else if (metaType === 'validationRequired') {
      localState = {
        ...localState,
        is_validation_required: value,
      };
    } else {
      if (value?.data && value?.sourceData) {
        value.data.forEach((change) => {
          let sourceCell =
            value.sourceData[change.rowIndex][`column_${change.columnIndex}`];
          let cell = {
            row: sourceCell.row_id,
            column: sourceCell.column_id,
            newValue: change.newValue,
            row_group_id: sourceCell.row_group_id,
            column_group_id: sourceCell.column_group_id,
            formula: sourceCell.formula,
            is_aggregated: sourceCell.is_aggregated,
          };
          this.updateGridCellValue(cell, question, localGridMap);
        });
      } else if (value?.deletedRowIds && value?.columns) {
        // this format is being passed on row deletion from grid-response
        this.markRowsAsDeletedInLocalGridMap(
          localGridMap,
          value.deletedRowIds,
          value.columns,
          question
        );
      } else if (Array.isArray(value)) {
        // this format is being passed on row insertion related to custom grid formula
        value.forEach((cell) => {
          this.updateGridCellValue(cell, question, localGridMap);
        });
      }

      localState = {
        ...localState,
        grid_responses: Object.values(localGridMap[id]),
      };

      if (isError != null && isError != undefined) {
        localState = {
          ...localState,
          isResponseError: !!isError,
        };
        answer.localErrorState = isError;
      }

      answer.localgrid_responses = Object.values(localGridMap[id]);
    }
    this.store.dispatch(new UpdateLocalQuestionMap(id, localState));
    this.store.dispatch(new UpdateLocalGridMap(localGridMap));

    const {
      textResponse,
      is_NA,
      is_WIP,
      is_validation_required,
      isResponseError,
      grid_responses,
    } = JSON.parse(
      JSON.stringify(
        this.store.selectSnapshot(
          (state) => state.questionnaire.localQuestionMap
        )[id]
      )
    );

    if (
      isResponseError ||
      (answer.textResponse === textResponse &&
        JSON.stringify(
          answer.grid_responses?.length
            ? this.util.sortByAplha(answer.grid_responses, 'row_group_id')
            : null
        ) ===
          JSON.stringify(
            grid_responses?.length
              ? this.util.sortByAplha(grid_responses, 'row_group_id')
              : null
          ) &&
        answer.is_NA == is_NA &&
        answer.is_validation_required == is_validation_required &&
        answer.is_WIP == is_WIP)
    )
      isError = true;

    if (!disableDraft)
      this.store.dispatch(
        new UpdateDraftData({
          id,
          type: 'response',
          isError: isError ?? isResponseError ?? false,
          api: {
            response: {
              duediligence_id: this.diligence.id,
              SectionID: this.activeSection.id,
              questionID: question.id,
              isSequence: question.isSequence,
              response: {
                textResponse,
                response_type: type,
                grid_responses: is_NA ? null : grid_responses ?? [],
                sequenceID: question.sequenceID,
                is_NA,
                is_WIP,
                is_validation_required: is_NA ? false : is_validation_required,
                trigger_review: answer.trigger_review,
              },
            },
          },
        })
      );
  }

  updateGridCellValue(value, question, localGridMap) {
    const id = `${question.sequenceID}-${question.sectionID}-${question.id}`;
    let {
      row,
      column,
      newValue,
      isDeleted,
      row_group_id,
      column_group_id,
      formula,
      is_aggregated,
    } = value;

    if (isDeleted) {
      Object.entries(localGridMap[id]).forEach(([key, value]) => {
        if ((value as any).row_id === row) {
          localGridMap[id][key] = {
            ...localGridMap[id][key],
            mode: 'deleted',
          };
        }
      });
    } else {
      if (!localGridMap[id] && newValue != null) {
        localGridMap[id] = {};
      }

      if (
        localGridMap[id] &&
        ((((newValue != null && newValue !== '') ||
          (localGridMap[id][`${row}-${column}`]?.value != null &&
            localGridMap[id][`${row}-${column}`]?.value !== '')) &&
          newValue?.toString() !=
            localGridMap[id][`${row}-${column}`]?.value?.toString()) ||
          (!isDeleted &&
            localGridMap[id][`${row}-${column}`]?.mode == 'deleted'))
      ) {
        localGridMap[id][`${row}-${column}`] = {
          row_id: row,
          column_id: column,
          value: newValue,
          row_group_id: row_group_id,
          column_group_id: column_group_id,
          formula: formula,
          is_aggregated: is_aggregated,
        };

        if (
          (newValue == null || newValue === '') &&
          !formula &&
          !(question?.answer?.attributes?.grid_responses ?? [])?.find(
            (data) => `${row}-${column}` == `${data.row_id}-${data.column_id}`
          )
        ) {
          delete localGridMap[id][`${row}-${column}`];
        }
      }
    }
  }

  markRowsAsDeletedInLocalGridMap(
    localGridMap,
    deletedRowIds,
    columns,
    question
  ) {
    const id = `${question.sequenceID}-${question.sectionID}-${question.id}`;
    deletedRowIds.forEach((rowId) => {
      columns.forEach((column) => {
        let key = `${rowId}-${column.id}`;
        if (key in localGridMap[id]) {
          localGridMap[id][key] = {
            ...localGridMap[id][key],
            mode: 'deleted',
          };
        }
      });
    });
  }

  handleAumTableResponseType(isError, value, type, question, metaType) {
    let answer = question?.answer?.attributes;
    let localState: any = { isResponseError: !!isError };
    if (metaType === 'comment') {
      localState = {
        ...localState,
        textResponse: value,
      };
      question.answer.attributes.localTextResponse = value;
    } else if (metaType === 'is_NA') {
      localState = {
        ...localState,
        is_NA: value,
      };
    } else if (metaType === 'is_WIP') {
      localState = {
        ...localState,
        is_WIP: value,
      };
    } else {
      localState = {
        ...localState,
        isResponseError: !!isError,
        aumTable_id: value.id,
      };
      answer.localErrorState = isError;
      answer.localaumTable_id = value.id;
    }
    const id = `${question.sequenceID}-${question.sectionID}-${question.id}`;
    this.store.dispatch(new UpdateLocalQuestionMap(id, localState));
    const {
      textResponse,
      is_NA,
      is_WIP,
      is_validation_required,
      isResponseError,
      aumTable_id,
    } = this.store.selectSnapshot(
      (state) => state.questionnaire.localQuestionMap
    )[id];
    if (
      isResponseError ||
      (answer.textResponse === textResponse &&
        answer.aumTable_id === (is_NA ? null : aumTable_id) &&
        answer.is_NA == is_NA &&
        answer.is_WIP == is_WIP)
    )
      isError = true;
    this.store.dispatch(
      new UpdateDraftData({
        id,
        type: 'response',
        isError,
        api: {
          response: {
            duediligence_id: this.diligence.id,
            SectionID: this.activeSection.id,
            questionID: question.id,
            isSequence: question.isSequence,
            response: {
              textResponse,
              response_type: type,
              aumTable_id: is_NA ? null : aumTable_id,
              sequenceID: question.sequenceID,
              is_NA,
              is_WIP,
              is_validation_required,
              trigger_review: answer.trigger_review,
            },
          },
        },
      })
    );
  }

  handleReturnResponseType(isError, value, type, question, metaType) {
    let answer = question?.answer?.attributes;
    let localState: any = { isResponseError: !!isError };
    if (metaType === 'comment') {
      localState = {
        ...localState,
        textResponse: value,
      };
      question.answer.attributes.localTextResponse = value;
    } else if (metaType === 'is_NA') {
      localState = {
        ...localState,
        is_NA: value,
      };
    } else if (metaType === 'is_WIP') {
      localState = {
        ...localState,
        is_WIP: value,
      };
    } else {
      localState = {
        ...localState,
        isResponseError: !!isError,
        returnTable_id: value.id,
      };
      answer.localErrorState = isError;
      answer.localreturnTable_id = value.id;
    }
    const id = `${question.sequenceID}-${question.sectionID}-${question.id}`;
    this.store.dispatch(new UpdateLocalQuestionMap(id, localState));
    const {
      textResponse,
      is_NA,
      is_WIP,
      is_validation_required,
      isResponseError,
      returnTable_id,
    } = this.store.selectSnapshot(
      (state) => state.questionnaire.localQuestionMap
    )[id];
    if (
      isResponseError ||
      (answer.textResponse === textResponse &&
        answer.returnTable_id === returnTable_id &&
        answer.is_NA == is_NA &&
        answer.is_WIP == is_WIP)
    )
      isError = true;
    this.store.dispatch(
      new UpdateDraftData({
        id,
        type: 'response',
        isError,
        api: {
          response: {
            duediligence_id: this.diligence.id,
            SectionID: this.activeSection.id,
            questionID: question.id,
            isSequence: question.isSequence,
            response: {
              textResponse,
              response_type: type,
              returnTable_id,
              sequenceID: question.sequenceID,
              is_NA,
              is_WIP,
              is_validation_required,
              trigger_review: answer.trigger_review,
            },
          },
        },
      })
    );
  }

  copyNestedViewLogic(questions, randomId) {
    questions.forEach((nested) => {
      nested.nestedID = {
        ...nested.nestedID,
        isSequence: true,
        sequenceID: randomId,
        isValid: false,
        assignedUser: {
          attributes: {
            assigned_to: null,
          },
        },
        answer: {
          attributes: DefaultQuestionState(),
        },
      };
      this.copyNestedViewLogic(nested.nestedID.nestedQuestions, randomId);
    });
  }

  // Commenting out this code for now, this will lead to preserving of bad responses after saving
  handleClearDraft() {
    //   // this.loadQuestionData();
    //   // re-render responses to clear any stale responses in components
    //   for (var i = 0; i < this.questionData.length; i++) {
    //     if (this.questionData[i].answer?.attributes?.is_NA) {
    //       this.questionData[i] = { ...this.questionData[i] };
    //     }
    //   }
    //   this.questionData = [...this.questionData];
  }

  handlePrevNextClick(currentActivesection) {
    this.draftService.showCountAlert(
      () => {
        this.store.dispatch(new UpdateDraftData(null, true));
        this.store.dispatch(
          new UpdateActiveSection({
            id: currentActivesection.id,
            label: currentActivesection.name,
            data: currentActivesection,
          })
        );
      },
      () => {
        this.store.dispatch(new UpdateDraftData(null));
        this.store.dispatch(
          new UpdateActiveSection({
            id: currentActivesection.id,
            label: currentActivesection.name,
            data: currentActivesection,
          })
        );
      }
    );
  }

  calculateRequiredPosition() {
    let requiredPosition = null;
    let found = 0;

    let checkId = this.isSequenceIdInRoute ? 'sequenceQuestionId' : 'id';
    for (let i = 0; i < this.questionData.length; i++) {
      found =
        found ||
        this.checkForId(
          this.questionData[i],
          this.paramsQuestionId,
          found,
          this.isSequenceIdInRoute,
          checkId
        );

      if (found) {
        requiredPosition = i;
        break;
      }
    }

    this.requiredQuestionIndex = found ? requiredPosition + 1 : null;
    this.loadingForRequiredPosition = false;
    setTimeout(() => {
      this.bufferLoader = false;
    }, 1000);
  }

  checkForId(question, requiredId, found, isSequenceIdInRoute, checkId) {
    if (found) return 1; // return if the required id was found

    if (requiredId == question[checkId]) {
      found = 1;
      return 1;
    }

    let x = 0;

    if (question.nestedQuestions?.length) {
      for (let i = 0; i < question.nestedQuestions.length; i++) {
        question.nestedQuestions[i].nestedID[checkId] = isSequenceIdInRoute
          ? question.nestedQuestions[i].nestedID.sequenceID +
            '-' +
            question.nestedQuestions[i].nestedID.id
          : question.nestedQuestions[i].nestedID.id;
        x =
          x ||
          this.checkForId(
            question.nestedQuestions[i].nestedID,
            requiredId,
            found,
            isSequenceIdInRoute,
            checkId
          );
      }
    }
    return x;
  }

  // This will be triggered if SMES are updated at section level to pass it to question level
  handleSmeUpdate(smeList) {
    this.sme = smeList;
  }

  /**
   * Closes the side-panel, if question is removed from the UI on scroll.
   * @param data The required data.
   */
  closeSidePanelOnScroll(data: QuestionDetailsOnScroll): void {
    if (
      data.activePanelId &&
      data.activeQuestionId &&
      (data.activePanelId.startsWith('ck-comments-') ||
        data.activePanelId.startsWith('questionnaire-AI'))
    ) {
      const question = this.status.findQuestionRecursively(
        'id',
        data.activeQuestionId,
        data.questions
      );

      // If question is not found in the current list then close the side-panel.
      if (!question) {
        this.panel.close();
      }
    }
  }
}
