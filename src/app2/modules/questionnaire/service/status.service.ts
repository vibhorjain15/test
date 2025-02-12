import { Inject, Injectable, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Select, Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { Subject, forkJoin, BehaviorSubject } from 'rxjs';
import { finalize, take } from 'rxjs/operators';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import { CustomFieldsService } from 'src/app2/services/custom-fields.service';
import { ModalService } from 'src/app2/services/modal.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { UtilsService } from 'src/app2/services/utils.service';
import {
  AiPrompts,
  IssueType,
  ratingConstants,
  Regex,
  ResponseSource,
  responseStatus,
} from 'src/app2/shared/constants/constant';
import { ColorTheme } from 'src/app2/shared/themes/color.themes';
import { CurrentUserModel, UserModel } from 'src/app2/store/user/user.model';
import { UserState } from 'src/app2/store/user/user.state';
import {
  diligenceStatusConstant,
  trackChangeStatusConstant,
} from '../constants/quick-view-headers.constant';
import { ResponseType } from '../constants/Response-type.constant';
import {
  GetDiligenceData,
  GetQuestionCount,
  GetSubSectionData,
  IsSavingDraft,
  SidePanelUpdate,
  TriggerSilentReload,
  UpdateActivePanelId,
  UpdateBulkLocalQuestionMapQuestionMap,
  UpdateFilterMap,
  UpdateLocalGridMap,
  UpdateLocalQuestionMap,
  UpdateQuestionData,
  UpdateSequenceSectionQuestionMap,
  UpdateSubCatData,
  getReviewAssignments,
} from '../store/questionnaire.action';
import { StateDiligenceUpdateType } from '../store/questionnaire.modal';
import { QuestionState } from '../store/questionnaire.state';
import { IconTypes } from '../types/card-icons.type';
import { DiligenceTypeEnum } from '../types/diligence-enum.type';
import { questionCardIcons } from '../constants/question-card-icons.constant';
import {
  ReviewType,
  TaskType,
  UnsupportedTrackChangeTypes,
} from '../constants/question-status.constant';
import { CacheUtil } from './cache.service';
import { QuestionAttributeType } from '../types/questions.type';
import {
  CheckResponseText,
  initializeLocalGridMap,
} from '../util/question-status.util';
import {
  DefaultQuestionState,
  LocalQuestionMapHelper,
  UpdateLocalQuestionState,
  getNestedQuestionObjectById,
} from '../store/questionnaire.util';
import { DvDraftService } from './draft.service';
import {
  Definition,
  Step,
} from 'src/app2/shared/models/review-definitions.model';
import * as moment from 'moment';
import { ReviewCommentsService } from './review-comments.service';
import { RouterService } from 'src/app2/services/router.service';
import { AddCommentData } from 'src/app2/shared/models/ckeditor.model';
import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';

@Injectable({
  providedIn: 'root',
})
export class QuestionnaireStatusService implements OnInit {
  // customFieldDatamap = {};
  dueDiligenceType = 1105;
  colors = [];
  diligence: DiligenceType & StateDiligenceUpdateType;
  userMain: UserModel;
  user: CurrentUserModel;
  firmPreferences;
  questions = [];
  unsupportedTrackChangeReviewCommentsResponseTypes = [
    'Attachment',
    'ReturnTable',
    'aumTable',
    'Grid',
    'DynamicGrid',
  ];
  functions: any;
  customRatingMap;
  localQuestionMap: any = {};
  canUpdateAllIcons = true;
  currentActiveQuestionId: string;
  handleIconClick;
  @Select(QuestionState.getColorData) colorData;
  @Select(QuestionState.getCutomMapRating) customMapRating;
  @Select(QuestionState.getFunctionAssignment) functionAssignment;
  @Select(QuestionState.getLocalQuestionMap) localQuestionMapState;
  @Select(UserState.getFirmPreferenceData) firmPref;
  @Select(UserState.getTeamMembersData) teamMembers$;
  sequenceSectionQuestionMap = {};
  trackChanges = new BehaviorSubject<number>(0);
  trackChanges$ = this.trackChanges.asObservable();
  questions$ = new Subject<any>();
  deleteOnlyDraftQuestionDataMap = [];
  stateSnapShot: any = {};
  localQuestionMapSub = {};
  localQuestionMapSubscription;
  teamMembers: any;
  naCommentPlaceholder =
    'Please select an option from the the N/A dropdown or add a comment explaining why the question is marked as N/A.';
  constructor(
    private questionnaire: QuestionnaireService,
    private store: Store,
    private modal: ModalService,
    private panelService: SidePanelService,
    private util: UtilsService,
    private newModal: CustomModalService,
    private toast: ToastrService,
    private readonly SweetAlert: SweetAlertService,
    private readonly toaster: ToastrService,
    private readonly customFieldService: CustomFieldsService,
    private cache: CacheUtil,
    private dvDatePipe: DvDatePipe,
    private draft: DvDraftService,
    private readonly commentsService: ReviewCommentsService,
    private router: RouterService,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    this.localQuestionMapSubscription = this.localQuestionMapState.subscribe(
      (map) => {
        this.localQuestionMapSub = map;
      }
    );
    this.colorData.pipe(take(2)).subscribe((data) => {
      if (data) {
        this.userMain = this.store.selectSnapshot((state) => state.user);
        this.colors = data;
        this.customMapRating.pipe(take(2)).subscribe((map) => {
          if (map) {
            this.customRatingMap = map;
          }
        });
      }
    });
    this.functionAssignment.pipe(take(2)).subscribe((data) => {
      if (data) {
        this.functions = data;
      }
    });

    this.firmPref.pipe(take(2)).subscribe((firmPreferences) => {
      this.firmPreferences = firmPreferences;
    });

    this.teamMembers$
      .pipe(take(2))
      .subscribe((team) => (this.teamMembers = team));
  }

  updateLocalQuestionMap() {
    this.stateSnapShot = JSON.parse(
      JSON.stringify(this.store.selectSnapshot((state) => state.questionnaire))
    );
    let { sequenceSectionQuestionMap, localQuestionMap } = this.stateSnapShot;
    this.localQuestionMap = localQuestionMap;
    this.sequenceSectionQuestionMap = sequenceSectionQuestionMap;
  }

  updateData(diligence, user, firmPreferences = null) {
    this.diligence = diligence;
    this.user = user;
    if (firmPreferences) this.firmPreferences = firmPreferences;
    this.ngOnInit();
  }

  updateQuestionData(question) {
    this.questions = question;
    this.questions$.next(question);
  }

  updateIconData(handleIconClick) {
    this.handleIconClick = handleIconClick;
  }

  async updateRatingIcon(
    icon: IconTypes,
    question,
    callback,
    isSection = false
  ) {
    let rating_scales = this.store.selectSnapshot(
      (state) => state.questionnaire.selectedRatingScheme.rating_scale_mode
    );
    let reviewEnabled =
      this.userMain.firmPreference.enable_rating_custom_fields_review &&
      this.diligence.status == diligenceStatusConstant.InReview;
    let enableTrackChange =
      this.userMain.firmPreference.enable_track_changes &&
      this.diligence.isReadonlyEditable &&
      question?.answer?.attributes?.response_status != responseStatus.STARTED;
    let copyColor = JSON.parse(JSON.stringify(this.colors));
    copyColor.splice(0, 2); // remove N/A and N/R scales from here
    const is_na = isSection
      ? question.sectionRating.is_na
      : question.questionRating.is_na;

    // if the project have custom fields related to it in rating then a modal should open where user can change fields and rating
    // if no custom fields are present then a simple rating change dropdown is to be shown where user can change only rating
    if (rating_scales == ratingConstants.Absolute)
      if (icon.isNotDropDown && rating_scales && !is_na) {
        const rating = {
          attributes: question?.questionRating,
          mode: ratingConstants.Absolute,
          assignments: question?.questionRating?.assignments,
          type: 'question_rating_mapping',
        };

        let ratingsNotEditable =
          this.diligence.diligence_type === DiligenceTypeEnum.dd_review &&
          this.userMain.firmPreference.enable_rating_custom_fields_review &&
          (this.diligence.status === diligenceStatusConstant.Completed ||
            this.diligence.status === diligenceStatusConstant.Evaluation);
        this.newModal.invoke('manage-ratings', {
          initialState: {
            entityType: this.dueDiligenceType,
            entityId: this.diligence.id,
            subEntityId: question?.questionRating.rating_id,
            rating: JSON.parse(JSON.stringify(rating)),
            readonly: this.diligence.isLocked || ratingsNotEditable,
            ratingScales: copyColor,
            diligence: this.diligence,
            enableReview: reviewEnabled && rating.attributes.rating_value,
            enable_tracking: enableTrackChange,
            functions: this.functions,
            assignedFunctions: this.diligence.myFunction,
            response: (response) => {
              question.questionRating.rating_status =
                response.rating.attributes.rating_status;

              if (response.rating.assignments)
                question.questionRating.assignments =
                  response.rating.assignments;
              if (response.cancelClick) {
                // if user is closing the modal, return without updating score and custom fields
                return;
              }

              this.onScoreChanged(
                question,
                response.rating.attributes.rating_value,
                ratingConstants.Absolute,
                callback,
                isSection
              );
              this.saveCustomFields(response)?.subscribe((res) =>
                this.toast.success('Custom fields saved successfully')
              );
            },
          },
          closeInterceptor: () => {
            return new Promise<void>((resolve) => {
              resolve();
              this.store.dispatch(new GetQuestionCount());
            });
          },
        });
      } else
        this.onScoreChanged(
          question,
          icon.ratingChange,
          ratingConstants.Absolute,
          callback,
          isSection
        );
    else if (rating_scales == ratingConstants.ScoreBand) {
      const rating = {
        attributes: question?.questionRating,
        mode: ratingConstants.ScoreBand,
        assignments: question?.questionRating?.assignments,
        type: 'question_rating_mapping',
      };

      if (!is_na && (icon.isNotDropDown || reviewEnabled)) {
        this.newModal.invoke('manage-ratings', {
          initialState: {
            entityType: this.dueDiligenceType,
            entityId: this.diligence.id,
            subEntityId: question?.questionRating.rating_id,
            rating: JSON.parse(JSON.stringify(rating)),
            readonly: icon.readonly,
            ratingScales: copyColor,
            naValue: icon.naValue,
            diligence: this.diligence,
            enableReview: reviewEnabled && rating.attributes.score_value,
            enable_tracking: enableTrackChange,
            functions: this.functions,
            assignedFunctions: this.diligence.myFunction,
            parentScope: this,
            response: (response) => {
              question.questionRating.rating_status =
                response.rating.attributes.rating_status;

              if (response.rating.assignments)
                question.questionRating.assignments =
                  response.rating.assignments;
              if (response.cancelClick) {
                // if user is closing the modal, return without updating score and custom fields
                return;
              }

              this.onScoreChanged(
                question,
                response.rating.attributes.score_value,
                ratingConstants.ScoreBand,
                callback,
                isSection
              );
              this.saveCustomFields(response)?.subscribe((res) =>
                this.toast.success('Custom fields saved successfully')
              );
            },
          },
          closeInterceptor: () => {
            return new Promise<void>((resolve) => {
              resolve();
              this.store.dispatch(new GetQuestionCount());
            });
          },
        });
      } else if (is_na || icon.ratingChange !== undefined)
        this.onScoreChanged(
          question,
          icon.ratingChange,
          ratingConstants.ScoreBand,
          callback,
          isSection
        );
    }
  }

  onScoreChanged(question, rating, ratingType, callback, isSection = false) {
    if ((rating >= 0 && rating <= 100) || rating === null) {
      let params;
      const is_na = isSection
        ? question.sectionRating.is_na
        : question.questionRating.is_na;
      if (isSection) {
        params = {
          entity_id: this.diligence.id,
          entity_type: 'Duediligence',
          ratingCategoryID: question.sectionRating.rating_id,
          value: rating,
          is_na: is_na,
        };
      } else {
        params = {
          value: rating,
          entity_id: this.diligence.id,
          entity_type: 'Duediligence',
          ratingCategoryID: question?.questionRating.rating_id,
          response_id: question.answer?.id,
          is_na: is_na,
        };
      }
      let param = {};
      this.questionnaire.updateRating(params).subscribe((res) => {
        this.toast.success('Your rating/score has been recorded successfully');
        this.store.dispatch(new GetQuestionCount());
        if (!isSection) {
          question.icons.rightIcons.forEach((val) => {
            if (val.key === 'rating') {
              if (rating !== null && !is_na) {
                let color;
                if (ratingType == ratingConstants.ScoreBand)
                  color = this.colors.filter(
                    (color) =>
                      color.range_min_value <= rating &&
                      color.range_max_value >= rating
                  )[0];
                else if (ratingType == ratingConstants.Absolute)
                  color = this.colors.filter(
                    (color) => color.value == rating
                  )[0];
                val.name = rating;
                val.tooltip = color.name;
                if (ratingType == ratingConstants.Absolute) {
                  val.color = color.color_code;
                  question.questionRating.rating_value = rating;
                } else {
                  question.questionRating.score_value = rating;
                }
              } else {
                val.color = ColorTheme.black;
                val.name = null;
                question.questionRating.rating_value = null;
                question.questionRating.score_value = null;
              }
            }
          });

          question.icons.rightIcons = JSON.parse(
            JSON.stringify(question.icons.rightIcons)
          );
        } else {
          if (rating !== null && !is_na) {
            let color;
            if (ratingType == ratingConstants.ScoreBand)
              color = this.colors.filter(
                (color) =>
                  color.range_min_value <= rating &&
                  color.range_max_value >= rating
              )[0];
            else if (ratingType == ratingConstants.Absolute)
              color = this.colors.filter((color) => color.value == rating)[0];
            param['name'] = rating;
            param['tooltip'] = color.name;
            if (ratingType == ratingConstants.Absolute) {
              param['color'] = color.color_code;
              question.sectionRating.rating_value = rating;
            } else {
              question.sectionRating.score_value = rating;
            }
          } else {
            param['color'] = ColorTheme.black;
            param['name'] = null;
            param['tooltip'] = '';
            question.sectionRating.rating_value = null;
            question.sectionRating.score_value = null;
          }
        }
        callback({ question, param });
      });
    }
  }

  saveCustomFields(response) {
    let params = {
      custom_fields: response.customFields,
      entity_id: this.diligence.id,
      entity_type: this.dueDiligenceType,
      owner_user_id: this.store.selectSnapshot(
        (state) => state.user.currentUser.id
      ),
      schema_type: 'rating',
      sub_entity_id: response.rating.attributes.rating_id,
    };

    if (params.custom_fields.length > 0)
      return this.customFieldService.saveCustomFields(params);
  }

  linkHasValue(field: any) {
    let fieldsWithValue = field.filter((item) => item.value_url);
    return fieldsWithValue.length > 0;
  }

  fieldHasValue(field) {
    let fieldsWithValue = field.filter((item) => item.value);
    return fieldsWithValue.length > 0;
  }

  isManualUserValidationRequired(question: any): boolean {
    return (
      !question?.answer?.attributes?.localis_NA &&
      question?.answer?.id &&
      (question?.answer.attributes.response_type == ResponseType.Grid ||
        question?.answer.attributes.response_type == ResponseType.DynamicGrid ||
        question?.answer.attributes.response_type == ResponseType.Text ||
        question?.answer.attributes.response_type ==
          ResponseType.TextMultiLine) &&
      question?.answer.attributes.localis_validation_required
    );
  }

  handleAddToPreApprove(question) {
    this.newModal.invoke('add-to-preapproved', {
      initialState: {
        source: 'questionnaire',
        response: {
          ...question,
          gridData:
            question.responseType === ResponseType.Grid ||
            question.responseType === ResponseType.DynamicGrid
              ? this.cache.GRIDCACHE[
                  `${question.sequenceID}-${question.sectionID}-${question.id}`
                ]
              : undefined,
        },
        entity_details: {
          entity_type: this.diligence.entity_type,
          entity_id: this.diligence.entity_id,
          entity_name: this.diligence.entity_name,
        },
      },
      class: 'modal-md',
    });
  }

  handleTodo(question, isReadOnly, callback) {
    this.store.dispatch(
      new UpdateActivePanelId(`questionnaire-todo-${question.id}`)
    );
    this.panelService.invoke('questionnaire-todo', {
      question,
      isReadOnly,
      onSuccess: (count) => {
        question.answer.attributes.toDoCount = count;
        callback();
      },
    });
  }

  handleNotes(question, readOnly, callback) {
    if (!question.icons.rightIcons.find((icon) => icon.key === 'notes')) return;
    this.store.dispatch(
      new UpdateActivePanelId(`internal-notes-${question.id}`)
    );
    this.panelService.invoke('internal-notes', {
      question,
      readOnly:
        this.user.isInvestor && this.diligence.allowOnlyFollowups
          ? false
          : this.diligence.isLocked || readOnly,
      type: 'Question',
      entity_id: this.diligence.id,
      child_entity_id: question.id,
      child_entity_type: 'Question',
      onSuccess: (res: 'add' | 'delete') => {
        if (res === 'add') question.note_count += 1;
        else question.note_count -= 1;
        callback();
      },
    });
  }

  handleCkEditorIcon(question) {
    this.handleIconClick({ key: 'ck-comments' }, question);
    // if (question.responseType == ResponseType.TextMultiLine)
    //   setTimeout(() => {
    //     this.store.dispatch(
    //       new SidePanelUpdate({
    //         response_type: question.responseType,
    //         questionID: question.id,
    //         textResponse: question.answer.attributes.localTextResponse,
    //       })
    //     );
    //   });
  }

  handleCKCommentsPanel(
    question: any,
    callback: () => unknown,
    addCommentConfig: AddCommentData = {
      source: 'questionnaire-toolbar',
    }
  ): void {
    if (!question.answer?.id) {
      if (addCommentConfig.source !== 'editor-on-ready')
        this.toaster.error('Please save the response first');
      this.panelService.close(); // Close the panel (if it's open). Otherwise, it'll show an empty ckeditor side-panel.
      return;
    }

    // SetTimeout is added to handle switching between
    // questions when user directly clicks over the right icon.
    setTimeout(() => {
      this.store.dispatch(
        new UpdateActivePanelId(`ck-comments-${question.id}`)
      );
      this.panelService.invoke('ck-comments-panel', {
        question,
        addCommentConfig,
        onSuccess: (operationType: 'add' | 'delete' | 'resolveAll') => {
          if (operationType === 'add') {
            question.answer.attributes.response_unresolved_comments_counts += 1;
          } else if (operationType === 'delete') {
            question.answer.attributes.response_unresolved_comments_counts -= 1;
          } else {
            question.answer.attributes.response_unresolved_comments_counts = 0;
          }

          callback();
        },
        onClose: () => {
          // if (
          //   this.currentActiveQuestionId ===
          //   question.sequenceID + '-' + question.id
          // )
          //   this.currentActiveQuestionId = null;
        },
      });
    });
  }

  handleFollowUp(question, questions, callback) {
    this.store.dispatch(new UpdateActivePanelId(`follow-up-${question.id}`));
    this.panelService.invoke('follow-up-panel', {
      question,
      questions,
      isReadOnly:
        this.diligence.status == diligenceStatusConstant.Approved ||
        this.diligence.status == diligenceStatusConstant.NotApproved,
      onCommentAdded: (ques) => {
        if (question?.id == ques.id) {
          const count =
            question.followup_count &&
            question.sequenceID in question.followup_count
              ? question.followup_count[question.sequenceID].count
              : 0;
          if (!(question.sequenceID in question.followup_count)) {
            question.followup_count[question.sequenceID] = {};
          }
          question.followup_count[question.sequenceID].count = count + 1;
          question.followup_count[question.sequenceID].last_is_received = false;
          question.followup_count[question.sequenceID].all_are_resolved = false;
        }
        callback();
      },
      onCommentDeleted: (ques, remainingOpenCount, lastIsReceived) => {
        if (question?.id == ques.id) {
          question.followup_count[question.sequenceID].count =
            remainingOpenCount;
          question.followup_count[question.sequenceID].last_is_received =
            lastIsReceived;
        }
        callback();
      },
      onBulkResolve: (ques) => {
        if (question?.id == ques.id) {
          question.followup_count[question.sequenceID].all_are_resolved = true;
          question.followup_count[question.sequenceID].count = 0;
        }
        callback();
      },
      onRecommendationAdded: (questionId) => {
        if (question.id == questionId) {
          question.issue_count++;
        }
        callback();
      },
      diligence: this.diligence,
    });
  }

  handleAutoFill(question, callback) {
    this.store.dispatch(
      new UpdateActivePanelId(`suggested-responses-${question.id}`)
    );
    this.panelService.invoke('suggested-responses', {
      diligence: this.diligence,
      question,
      currentUser: this.user,
      firmPreferences: this.firmPreferences,
      onAddSelectedResponses: (response) => {
        const id = `${question.sequenceID}-${question.sectionID}-${question.id}`;
        let localTextResponse = this.store.selectSnapshot(
          (state) => state.questionnaire.localQuestionMap
        )[id]?.textResponse;
        if (!localTextResponse) {
          localTextResponse = '';
        }
        question.answer.attributes.localTextResponse =
          localTextResponse + response; //Ganesh - Enhancement for all response types
        this.store.dispatch(
          new SidePanelUpdate({
            response_type: question.responseType,
            questionID: question.id,
            textResponse: question.answer.attributes.localTextResponse,
          })
        );
        setTimeout(() => {
          this.store.dispatch(new SidePanelUpdate(null));
        });
        this.toast.success('Selected responses have been added!');
        callback();
      },
    });
  }

  handleCalender(question, date, callback) {
    this.questionnaire
      .postResponseAction({
        response_ids: [question.answer.id],
        action_type: 'expire',
        action_date: this.util.getFromDateTimeFormatted(date),
      })
      .subscribe((res) => {
        callback();
      });
  }

  showReReviewConfirm(question, callback) {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to start the review process again?',
      text: 'This will restart the review for all assigned reviewers.',
      confirmButtonText: 'Start',
      showCloseButton: true,
      focusCancel: false,
      showLoaderOnConfirm: true,
      preConfirm: () => {
        this.handleReview(question, callback);
      },
    }).then((isConfirm) => {
      if (isConfirm.dismiss && isConfirm.dismiss == 'cancel') {
        this.SweetAlert.close();
      }
    });
  }

  handleReview(question, callback) {
    let assignment = {
      review_filter_id: 1,
      entity_ids: [question.answer.id],
      review_type:
        this.diligence.status === diligenceStatusConstant.Evaluation
          ? ReviewType.Evaluation
          : ReviewType.InReview,
      entity_type: 'Response',
    };
    assignment['steps'] = question.answer.attributes.assignments.steps.map(
      (step: Step) => {
        return {
          assignments: step.assignments.map((assignment) => {
            return {
              assigned_to_user_id: assignment.assigned_to_user_id,
              assigned_to_function_id: assignment.assigned_to_function_id,
              is_mandatory: assignment.is_mandatory,
              due_at: assignment.due_at,
            };
          }),
          no_of_approval_required: step.no_of_approval_required,
          order: step.order,
          is_active: step.is_active,
        };
      }
    );

    this.questionnaire
      .assignReviewer(this.diligence.id, assignment)
      .subscribe((responses) => {
        let activeSection = this.store.selectSnapshot(
          (state) => state.questionnaire.activeSection
        );
        this.store.dispatch(
          new getReviewAssignments(this.diligence.id, activeSection.id)
        );
        this.store.dispatch(new GetQuestionCount());
        this.toast.success('Re-review requested');
        callback();
      });
  }

  // finds a rejected review in the current step and sets it back to IN REVIEW mode
  handleRejectedReview(question, callback) {
    let rejectedReviewer =
      question.answer.attributes.activeReviewStep.assignments.find((assign) => {
        return assign.status === diligenceStatusConstant.ReviewFailed;
      });

    this.questionnaire
      .patchResponseStatus({
        id: question.answer.id,
        status: 'InReview',
        diligenceId: this.diligence.id,
        definition: question.answer.attributes.assignments,
        activeStep: question.answer.attributes.activeReviewStep,
        assignmentId: rejectedReviewer.id,
      })
      .subscribe((res) => {
        callback();
      });
  }

  handleReviewStatus(question) {
    this.store.dispatch(
      new UpdateActivePanelId(`review-status-${question.id}`)
    );
    this.panelService.invoke('review-status', {
      assignment: JSON.parse(
        JSON.stringify(question.answer.attributes.assignments)
      ),
      question: question,
      diligence: this.diligence,
    });
  }

  handleSmartText(question, reviewMappingsData) {
    this.newModal.invoke('add-standard-response', {
      initialState: {
        question: question,
        diligence: this.diligence,
        reviewMappingsData: reviewMappingsData,
        success: (answer: any) => {
          if (question.answer.attributes.localTextResponse) {
            question.answer.attributes.localTextResponse += '<br> ' + answer;
          } else {
            question.answer.attributes.localTextResponse = answer;
          }
          this.store.dispatch(
            new SidePanelUpdate({
              response_type: question.responseType,
              questionID: question.id,
              textResponse: question.answer.attributes.localTextResponse,
            })
          );
          setTimeout(() => {
            this.store.dispatch(new SidePanelUpdate(null));
          });
        },
      },
    });
  }

  handleReviewComment(question, diligenceId, readonly, callback) {
    try {
      this.newModal.invoke('review-comments', {
        initialState: {
          question: question,
          diligenceId: diligenceId,
          editable: readonly,
        },
        class: 'gray modal-lg',
        closeInterceptor: () => {
          return new Promise<void>((resolve) => {
            resolve();
            if (question.responseType === ResponseType.TextMultiLine) {
              // make it readonly to hide tinymce editor with old response
              question.answer.attributes.isAnswerReadonly = true;
            }
            this.store.dispatch(new GetQuestionCount());
            callback();
          });
        },
      });
    } catch (e) {}
  }

  updateReviewCommentsDataForExistingQuestion(question, storeData): void {
    let storedQuestion;
    if (question.parentQuestionId) {
      const nestedQuestionMap = this.store.selectSnapshot(
        (state) => state.questionnaire.nestedQuestionMap
      );
      storedQuestion = getNestedQuestionObjectById(
        storeData,
        nestedQuestionMap,
        question.sectionID,
        question.id,
        question.parentQuestionId
      );
    } else {
      storedQuestion = storeData[question.sectionID][question.id];
    }
    question.answer.attributes.response_comments_counts =
      storedQuestion.answer.attributes.response_comments_counts;
    question.answer.attributes.response_unresolved_comments_counts =
      storedQuestion.answer.attributes.response_unresolved_comments_counts;
    question.answer.attributes.response_with_notes_attributes =
      storedQuestion.answer.attributes.response_with_notes_attributes;
    if (
      question.answer.attributes.response_type === ResponseType.TextMultiLine
    ) {
      question.answer.attributes.textResponse =
        question.answer.attributes.localTextResponse =
        question.answer.attributes.localResponseText =
        question.answer.attributes.responseText =
        question.answer.attributes.responseDisplay =
          storedQuestion.answer.attributes.textResponse;
    }
  }

  updateReviewCommentsData(questions, iconMethod, storeData, ids) {
    return questions.map((ques) => {
      let question = ques;
      if (ques?.nestedID) {
        question = ques?.nestedID;
      }
      const id = `${question.sequenceID}-${question.sectionID}-${question.id}`;
      if (id in storeData) {
        question.answer.attributes.response_comments_counts =
          storeData[id].response_comments_counts;
        question.answer.attributes.response_unresolved_comments_counts =
          storeData[id].response_unresolved_comments_counts;
        question.answer.attributes.response_with_notes_attributes =
          storeData[id].response_with_notes_attributes;

        if (
          question.answer.attributes.response_type ===
          ResponseType.TextMultiLine
        ) {
          question.answer.attributes.textResponse =
            question.answer.attributes.localTextResponse =
            question.answer.attributes.localResponseText =
            question.answer.attributes.responseText =
            question.answer.attributes.responseDisplay =
              storeData[id].textResponse.replace(' tox-comment--active', '');
        }
        ids.push(question);
      }
      question.icons.rightIcons = iconMethod(question)(question);
      if (question.nestedQuestions?.length) {
        this.updateReviewCommentsData(
          question.nestedQuestions,
          iconMethod,
          storeData,
          ids
        );
      }
      return question;
    });
  }

  updateTextEditorCommentsData(question) {
    if (
      question.responseType !== ResponseType.TextMultiLine ||
      question.icons.rightIcons.find((i) => i.key === 'pencil')
    ) {
      // update text editor data only if it is still open after closing the modal (ex. request revision flow)
      return;
    }
    const id = `${question.sequenceID}-${question.sectionID}-${question.id}`;
    const localState = {
      textResponse: question.answer.attributes.textResponse,
    };
    this.store.dispatch(new UpdateLocalQuestionMap(id, localState));
    this.store.dispatch(
      new SidePanelUpdate({
        response_type: question.responseType,
        questionID: question.id,
        textResponse: question.answer.attributes.textResponse,
      })
    );
    setTimeout(() => {
      this.store.dispatch(new SidePanelUpdate(null));
    });
  }

  handleAssignReviewers(question, callback) {
    if (!question.answer.attributes.assignments)
      this.newModal.invoke('assign-reviewer', {
        initialState: {
          type: 'QuestionAdd',
          response: question.answer,
          question: question,
          deleteButtonDisabled:
            this.util.checkForTrackChanges(
              question.answer.attributes?.currentResponse
            ) || question.answer.attributes.showTrackChangeButtons,
          success: (response) => {
            if (response === 'delete')
              question.answer.attributes.response_status =
                responseStatus.STARTED;
            else
              question.answer.attributes.response_status =
                responseStatus.INREVIEW;
            callback();
          },
        },
        class: 'modal-lg',
      });
    else if (question.answer.attributes.assignments)
      this.newModal.invoke('assign-reviewer', {
        initialState: {
          type: 'Question',
          response: question.answer,
          question: question,
          deleteButtonDisabled:
            this.util.checkForTrackChanges(
              question.answer.attributes?.currentResponse
            ) || question.answer.attributes.showTrackChangeButtons,
          newDefinition: JSON.parse(
            JSON.stringify(question.answer.attributes.assignments)
          ),
          success: (response) => {
            if (response === 'delete')
              question.answer.attributes.response_status =
                responseStatus.STARTED;
            else
              question.answer.attributes.response_status =
                responseStatus.INREVIEW;
            callback();
          },
        },
        class: 'modal-lg',
      });
  }

  handleAssignTeamMember(
    memberObj,
    entity_id,
    entity_type: 'question' | 'section' = 'section',
    section,
    callback
  ) {
    let { member, type } = memberObj;
    let isFunction = type === 'function';
    let { assigned_to_functions, assigned_to } =
      section.assignedUser.attributes;
    if (!assigned_to_functions) assigned_to_functions = [];
    if (!assigned_to) assigned_to = [];
    if (isFunction) {
      if (member.is_removed)
        assigned_to_functions = assigned_to_functions.filter(
          (user) => user !== member['function_id']
        );
      else assigned_to_functions.push(member['function_id']);
      section.assignedUser.attributes.assigned_to_functions =
        assigned_to_functions;
    } else {
      if (member.is_removed)
        assigned_to = assigned_to.filter((user) => user !== member['id']);
      else assigned_to.push(member['id']);
      section.assignedUser.attributes.assigned_to = assigned_to;
    }
    let params: any = {
      assigned_to: member.id,
      duediligence_id: this.diligence.id,
      entity_id,
      entity_type,
    };
    if (isFunction)
      params = { ...params, assigned_to_function: member.function_id };
    else params = { ...params, assigned_to: member.id };
    if (member.is_removed) {
      params.is_removed = true;
    }
    this.questionnaire.updateEntityAssignments(params).subscribe(() => {
      this.toast.success(
        `${isFunction ? member.function_name : member.fullName} ${
          member.is_removed
            ? `is removed from all of the questions in ${section.name}`
            : `is assigned to all of the questions in ${section.name}`
        }`
      );
      let updatedSection = {
        assignedUser: {
          attributes: {
            ...section.assignedUser.attributes,
          },
        },
      };
      this.store.dispatch(
        new UpdateSubCatData(
          { id: entity_id, data: section },
          { ...updatedSection }
        )
      );
      callback();
    });
  }

  handleFlag(question, callback) {
    this.questionnaire
      .updateRatingFlag([
        {
          response_id: question.answer.id,
          duediligence_id: this.diligence.id,
          is_flagged: question.answer.attributes.is_flagged,
        },
      ])
      .subscribe(
        () => {
          if (question.answer.attributes.is_flagged)
            this.toaster.success('Question is flagged');
          else this.toaster.success('Question unflagged');
          callback(true);
          this.store.dispatch(new GetQuestionCount());
        },
        () => {
          callback(false);
        }
      );
  }

  handleSubmitRevisions(responseId) {
    this.questionnaire
      .submitResponseRevision(responseId, this.diligence.id)
      .subscribe(() => {
        this.store.dispatch(new GetQuestionCount()).subscribe(() => {
          this.store.dispatch(new GetDiligenceData());
        });
        this.store.dispatch(new TriggerSilentReload(Math.random()));
      });
  }

  handleResponseStatus(
    question: QuestionAttributeType,
    status,
    callback,
    note = null
  ) {
    if (question.isSectionUndo) {
      question.answer.attributes.isAnswerReadonly = true;
      if (callback) callback();
      return;
    }
    question.reviewLoading = true;
    this.destroyActiveEditorInstace();
    this.questionnaire
      .patchResponseStatus({
        id: question.answer.id,
        status: status,
        diligenceId: this.diligence.id,
        definition: question.answer.attributes.assignments,
        activeStep: question.answer.attributes.activeReviewStep,
        assignmentId: question.answer.attributes.currentReviewer.id,
        note: note,
      })
      .pipe(finalize(() => (question.reviewLoading = false)))
      .subscribe((res) => {
        this.panelService.close();
        if (
          status === responseStatus.REVIEWFAILED &&
          this.diligence.status !== diligenceStatusConstant.Evaluation
        ) {
          this.questionnaire
            .trackStatus({
              id: question.answer.id,
              track_change_status: trackChangeStatusConstant.Started,
            })
            .subscribe();
        }

        question.answer.attributes.isAnswerReadonly = true;
        let assignmentCompleteCount = 0;
        let stepApprovedCount = 0;
        question.answer.attributes.assignments.steps.forEach((step) => {
          if (step.id === question.answer.attributes.activeReviewStep.id) {
            step.assignments.forEach((assign) => {
              if (assign.id === question.answer.attributes.currentReviewer.id) {
                assign.status = status;
                if (status !== diligenceStatusConstant.InReview)
                  assign.is_completed = true;
                else assign.is_completed = false;
              }

              if (assign.is_completed) assignmentCompleteCount++;
            });
            if (assignmentCompleteCount === step.assignments.length) {
              step.is_completed = true;
              stepApprovedCount++;
            } else {
              step.is_completed = false;
            }
          }
        });

        if (
          stepApprovedCount ===
          question.answer.attributes.assignments.steps.length
        )
          question.answer.attributes.assignments.is_completed = true;
        else question.answer.attributes.assignments.is_completed = false;
        if (status !== diligenceStatusConstant.InReview)
          if (this.diligence.status === diligenceStatusConstant.Evaluation)
            this.toast.success(
              `${
                status == diligenceStatusConstant.ReviewPassed
                  ? 'Response verified successfully'
                  : 'Response Rejected successfully'
              }`
            );
          else
            this.toast.success(
              `${
                status == diligenceStatusConstant.ReviewPassed
                  ? 'Response verified successfully'
                  : 'Revision Requested successfully'
              }`
            );
        this.store.dispatch(new GetQuestionCount());
        callback();
      });
  }

  showRejectDialogue(callback, reject = false) {
    let title =
      'Are you sure you want to request a revision for the assigned response';
    let text = '';
    if (reject) {
      title = 'Provide a reason for rejecting this response.';
      if (!this.diligence.is_internal)
        text =
          'Please note that rejecting the response is internal to your team and is not visible externally';
    }
    this.SweetAlert.freeInput({
      title: title,
      input: 'textarea',
      icon: 'warning',
      text: text,
      customClass: 'danger',
      reverseButtons: true,
      inputPlaceholder: 'Enter reason for rejecting',
      inputAttributes: {
        'aria-label': 'Reason for rejecting',
        style: 'resize: none',
      },
      showCancelButton: true,
      confirmButtonText:
        'Yes, ' + (reject ? 'Reject Response' : 'Request Revision'),
      cancelButtonText: 'Cancel',
    }).then((result) => {
      const reason = result.value;
      if (result.isConfirmed && reason && Regex.containsHtmlTags.test(reason)) {
        return this.toaster.error('Please enter a valid reason');
      }
      if (result.isConfirmed) {
        callback(reason);
      }
    });
  }

  handleRecommendation(question, callback) {
    this.store.dispatch(
      new UpdateActivePanelId(`recommendation-panel-${question.id}`)
    );
    this.panelService.invoke('recommendation-panel', {
      question,
      diligence: this.diligence,
      entity_type: IssueType.Question,
      entity_id: question.id,
      onSuccess: (res: 'add' | 'delete') => {
        if (res === 'add') question.issue_count += 1;
        else question.issue_count -= 1;
        callback();
      },
    });
  }
  handleViewRules(question) {
    let ratingIcon = question.icons.rightIcons.find(
      (icon) => icon.key == 'rating'
    );
    this.store.dispatch(new UpdateActivePanelId(`view-rules-${question.id}`));
    this.panelService.invoke('view-rules', {
      question,
      isScoreband: ratingIcon?.isScoreband,
      ratingScales: ratingIcon?.rating,
    });
  }

  handleFunctionAssignment(question, icon, callback) {
    let { member, type } = icon.member;
    let isFunction = type === 'function';
    let { assigned_to_functions, assigned_to } =
      question.assignedUser.attributes;
    if (!assigned_to_functions) assigned_to_functions = [];
    if (!assigned_to) assigned_to = [];
    if (isFunction) {
      if (member.is_removed)
        assigned_to_functions = assigned_to_functions.filter(
          (user) => user !== member['function_id']
        );
      else assigned_to_functions.push(member['function_id']);
    } else {
      if (member.is_removed)
        assigned_to = assigned_to.filter((user) => user !== member['id']);
      else assigned_to.push(member['id']);
    }
    let params: any = {
      duediligence_id: this.diligence.id,
      entity_id: question.id,
      entity_type: 'question',
    };
    if (isFunction)
      params = { ...params, assigned_to_function: member.function_id };
    else params = { ...params, assigned_to: member.id };
    if (member.is_removed) {
      params.is_removed = true;
    }
    this.questionnaire.updateEntityAssignments(params).subscribe(() => {
      if (isFunction) {
        question.assignedUser.attributes.assigned_to_functions =
          assigned_to_functions;
      } else {
        question.assignedUser.attributes.assigned_to = assigned_to;
      }
      this.toast.success(
        `${isFunction ? member.function_name : member.fullName} ${
          member.is_removed ? 'assignment removed from' : 'is now assigned to'
        } ${question?.text.split('<separator>')[0]}`
      );
      this.store.dispatch(new GetQuestionCount());
      callback();
    });
  }

  updateTrackChangesData(
    question,
    trackStatus,
    responseString,
    activeSection,
    callback
  ) {
    const { answer, responseType } = question;
    let objs = [];
    objs.push(
      this.questionnaire.trackStatus({
        id: answer.id,
        track_change_status: trackStatus,
      })
    );
    if (
      !this.unsupportedTrackChangeReviewCommentsResponseTypes.includes(
        responseType
      ) &&
      responseType != ResponseType.TextMultiLine
    ) {
      objs.push(
        this.questionnaire.responseSelectedMarkTextRemove({
          diligenceId: this.diligence.id,
          id: answer.id,
        })
      );
      objs.push(
        this.questionnaire.responseNoteAttribute(this.diligence.id, answer.id, {
          response_with_notes_attributes: responseString,
        })
      );
    }
    if (trackStatus === trackChangeStatusConstant.Rejected) {
      if (
        responseType === ResponseType.Grid ||
        responseType === ResponseType.DynamicGrid
      ) {
        question.answer.attributes.textResponse =
          question.answer.attributes.responseDisplay?.replace(' </br>', '');
        objs.push(this.responseGridApi(question, activeSection));
      } else {
        objs.push(this.responseApi(question, activeSection));
      }
    }
    forkJoin(objs).subscribe((res: any) => {
      if (trackStatus === trackChangeStatusConstant.Rejected) {
        question.answer.attributes = {
          ...question.answer.attributes,
          ...res[objs.length - 1],
        };
      }
      UpdateLocalQuestionState(question.answer, this.dvDatePipe);
      const id = `${question.sequenceID}-${question.sectionID}-${question.id}`;
      this.store.dispatch(
        new UpdateLocalQuestionMap(id, LocalQuestionMapHelper(question.answer))
      );

      this.store.dispatch(
        new UpdateQuestionData(
          activeSection.data.parentID,
          activeSection.id,
          JSON.parse(JSON.stringify(question))
        )
      );
      this.store.dispatch(new GetQuestionCount());
      this.toast.success(
        `Track changes succesfully ${
          trackStatus === trackChangeStatusConstant.Accepted
            ? ' Accepted'
            : 'Rejected'
        }`
      );

      callback();
    });
  }

  responseApi(question, activeSection) {
    const id = `${question.sequenceID}-${question.sectionID}-${question.id}`;
    this.store.dispatch(
      new UpdateLocalQuestionMap(id, {
        ...this.updateResponseData(question.answer.attributes),
      })
    );
    const { answer, responseType } = question;
    let api = {
      duediligence_id: this.diligence.id,
      SectionID: activeSection.id,
      questionID: question.id,
      response: {
        response_type: responseType,
        sequenceID: question.sequenceID,
        is_NA: answer.attributes.localis_WIP,
        is_WIP: answer.attributes.localis_WIP,
        is_validation_required: answer.attributes.is_validation_required,
        ...this.updateResponseData(question.answer.attributes),
        track_change_status: trackChangeStatusConstant.Rejected,
      },
    };
    return this.questionnaire.updateQuestionResponse(api);
  }
  responseGridApi(question, activeSection) {
    const { answer, responseType } = question;
    const id = `${question.sequenceID}-${question.sectionID}-${question.id}`;
    this.store.dispatch(
      new UpdateLocalQuestionMap(id, {
        grid_responses: answer.attributes.localgrid_responses,
        textResponse: answer.attributes.textResponse,
      })
    );
    let api = {
      duediligence_id: this.diligence.id,
      SectionID: activeSection.id,
      questionID: question.id,
      response: {
        textResponse: answer.attributes.textResponse,
        response_type: responseType,
        grid_responses: answer.attributes.localgrid_responses,
        sequenceID: question.sequenceID,
        is_NA: answer.attributes.localis_WIP,
        is_WIP: answer.attributes.localis_WIP,
        is_validation_required: answer.attributes.is_validation_required,
        track_change_status: trackChangeStatusConstant.Rejected,
      },
    };
    return this.questionnaire.updateQuestionResponse(api);
  }

  handleBulkAllTrackChange(
    trackStatus,
    responseHistory,
    activeSection,
    callback
  ) {
    let responseListner = new Subject();
    let totalCount = 0;
    let apiCount = 0;
    this.questions.filter((question) => {
      this.handleTrackchangeQuestions(
        question,
        trackStatus,
        responseHistory,
        activeSection,
        responseListner,
        totalCount,
        apiCount
      );
    });
    responseListner.subscribe(() => {
      if (totalCount == apiCount) {
        if (
          this.store.selectSnapshot(
            (state) => state.questionnaire.filterStatus
          ) !== 'default'
        )
          this.store.dispatch(new UpdateFilterMap('default'));
        this.store.dispatch(new TriggerSilentReload(Math.random()));
        this.trackChanges.next(0);
        callback();
        this.store.dispatch(new GetQuestionCount());
        responseListner.complete();
      }
    });
  }

  handleTrackchangeQuestions(
    question,
    trackStatus,
    responseHistory,
    activeSection,
    responseListner,
    totalCount,
    apiCount
  ) {
    if (question.answer.attributes.showTrackChangeButtons) {
      if (trackStatus == trackChangeStatusConstant.Rejected)
        question.answer.attributes = {
          ...question.answer.attributes,
          ...responseHistory[question.answer.id],
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
      totalCount++;
      this.updateTrackChangesData(
        question,
        trackStatus,
        question.answer.attributes.responseDisplay,
        activeSection,
        () => {
          apiCount++;
          responseListner.next();
        }
      );
    }
    if (question.nestedQuestions.length) {
      question.nestedQuestions.forEach((nested) => {
        this.handleTrackchangeQuestions(
          nested.nestedID,
          trackStatus,
          responseHistory,
          activeSection,
          responseListner,
          totalCount,
          apiCount
        );
      });
    }
  }

  updateResponseData(question, isLocal = false) {
    const {
      response_type: type,
      textResponse,
      numericResponseB,
      numericResponseA,
      listValueID,
      booleanResponse,
      dateResponse,
    } = question;
    let returnObj = {};
    if (
      type === ResponseType.Numeric ||
      type === ResponseType.Identifier ||
      type === ResponseType.Integer ||
      type === ResponseType.TextPhone ||
      type === ResponseType.Percentage
    ) {
      returnObj = { textResponse, numericResponseA };
      if (isLocal)
        returnObj = {
          localNumericResponseA: numericResponseA,
          localTextResponse: textResponse,
        };
    }
    if (type === ResponseType.Dropdown || type === ResponseType.CheckBox) {
      returnObj = { listValueID, textResponse };
      if (isLocal) {
        returnObj = {
          localListValueID: listValueID,
          localTextResponse: textResponse,
        };
      }
    }
    if (
      type === ResponseType.TextEmail ||
      type === ResponseType.Text ||
      type === ResponseType.TextMultiLine
    ) {
      returnObj = { textResponse };
      if (isLocal) {
        returnObj = {
          localTextResponse: textResponse,
        };
      }
    }
    if (
      type === ResponseType.NoPlus ||
      type === ResponseType.BooleanPlus ||
      type === ResponseType.Boolean
    ) {
      returnObj = { booleanResponse, textResponse };
      if (isLocal) {
        returnObj = {
          localBooleanResponse: booleanResponse,
          localTextResponse: textResponse,
        };
      }
    }
    if (type === ResponseType.Bookends) {
      returnObj = { textResponse, numericResponseA, numericResponseB };
      if (isLocal) {
        returnObj = {
          localNumericResponseB: numericResponseB,
          localNumericResponseA: numericResponseA,
          localTextResponse: textResponse,
        };
      }
    }
    if (type === ResponseType.Date) {
      returnObj = { dateResponse, textResponse };
      if (isLocal) {
        returnObj = {
          localDateResponse: dateResponse,
          localTextResponse: textResponse,
        };
      }
    }
    if (isLocal) {
      if (
        (type === ResponseType.NoPlus && booleanResponse === false) ||
        (type === ResponseType.BooleanPlus && booleanResponse)
      ) {
        question.booleanExplanation = question.textResponse;
        question.localTextResponse = null;
        returnObj = {
          localTextResponse: question.localTextResponse,
          localbooleanExplanation: question.booleanExplanation,
          localBooleanResponse: booleanResponse,
        };
      }

      if (type === ResponseType.Dropdown || type === ResponseType.CheckBox) {
        question.isOther =
          question?.responseDisplay?.includes('Other') ?? false;
        if (question.isOther) {
          question.otherExplanation = question.localTextResponse;
          returnObj = {
            localTextResponse: null,
            otherExplanation: textResponse,
            localListValueID: listValueID,
          };
        }
      }
    }
    return returnObj;
  }

  updateRestoreFunction(question, isLocal) {
    const {
      response_type: type,
      text_value,
      numeric_value_b,
      numeric_value_a,
      selected_options,
      bool_value,
      dateTime_value,
      localgrid_responses,
    } = question;
    let returnObj = {};
    if (
      type === ResponseType.Numeric ||
      type === ResponseType.Identifier ||
      type === ResponseType.Integer ||
      type === ResponseType.TextPhone ||
      type === ResponseType.Percentage
    ) {
      if (JSON.parse(numeric_value_a) === null && text_value === null) return;
      returnObj = {
        NumericResponseA: numeric_value_a,
        textResponse: text_value,
      };
      if (isLocal)
        returnObj = {
          localNumericResponseA: numeric_value_a,
          localTextResponse: text_value,
        };
    }
    if (type === ResponseType.Dropdown || type === ResponseType.CheckBox) {
      let idList = selected_options?.map((option) => option.dropdown_option_id);
      returnObj = { listValueId: idList, textResponse: text_value };
      if (isLocal) {
        returnObj = {
          localListValueID: idList,
          localTextResponse: text_value,
        };
      }
    }
    if (
      type === ResponseType.TextEmail ||
      type === ResponseType.Text ||
      type === ResponseType.TextMultiLine
    ) {
      returnObj = {
        textResponse: this.util.stripCommentsAndTrackChanges(text_value),
      };
      if (isLocal) {
        returnObj = {
          localTextResponse: this.util.stripCommentsAndTrackChanges(text_value),
        };
      }
    }
    if (
      type === ResponseType.NoPlus ||
      type === ResponseType.BooleanPlus ||
      type === ResponseType.Boolean
    ) {
      returnObj = {
        booleanValue: bool_value,
        localBooleanExplanation: text_value,
      };
      if (isLocal) {
        returnObj = {
          localBooleanResponse: bool_value,
          localTextResponse: text_value,
        };
      }
    }
    if (type === ResponseType.Bookends) {
      returnObj = { text_value, numeric_value_a, numeric_value_b };
      if (isLocal) {
        returnObj = {
          localNumericResponseB: numeric_value_b,
          localNumericResponseA: numeric_value_a,
          localTextResponse: text_value,
        };
      }
    }
    if (type === ResponseType.Date) {
      returnObj = { dateTime_value, text_value };
      if (isLocal) {
        returnObj = {
          localDateResponse: dateTime_value
            ? moment(dateTime_value).format('MM/DD/YYYY')
            : dateTime_value,
          localTextResponse: text_value,
        };
      }
    }
    if (type === ResponseType.Grid || type === ResponseType.DynamicGrid) {
      returnObj = { localgrid_responses, text_value };
      if (isLocal) {
        returnObj = {
          localgrid_responses: question.grid_responses,
          localTextResponse: text_value,
        };
      }
    }
    if (isLocal) {
      if (
        (type === ResponseType.NoPlus && bool_value === false) ||
        (type === ResponseType.BooleanPlus && bool_value)
      ) {
        returnObj = {
          localTextResponse: null,
          localbooleanExplanation: text_value,
          localBooleanResponse: bool_value,
        };
      }

      if (type === ResponseType.Dropdown || type === ResponseType.CheckBox) {
        let idList = selected_options?.map(
          (option) => option.dropdown_option_id
        );
        question.isOther =
          question?.responseDisplay?.includes('Other') ?? false;
        // removed response display
        if (question.isOther) {
          question.otherExplanation = text_value;
          returnObj = {
            localTextResponse: null,
            otherExplanation: text_value,
            localListValueID: idList,
          };
        }
      }
    }
    return returnObj;
  }

  showUnsavedResponseAlert(message) {
    this.SweetAlert.error({
      title: 'You have unsaved responses under this response',
      text: `Please resolve these before marking this response as ${message}.`,
      confirmButtonText: 'Okay',
    });
  }
  showCommentsWarning() {
    this.SweetAlert.error({
      title: 'You have unresolved review comments for this response',
      text: `Please resolve these before marking this response as reviewed.`,
      confirmButtonText: 'Okay',
    });
  }
  showTrackingWarning(question?, callback?) {
    this.SweetAlert.error({
      title: 'You have pending tracking changes',
      text: `Please edit this response and accept or reject the changes before marking this response as reviewed`,
      confirmButtonText: 'Okay',
    }).then((confirm) => {
      if (confirm.isConfirmed && question) {
        this.handleUpdateActiveQuestion(question);
        if (callback) callback();
      }
    });
  }

  updateQuestionsAssignment(question, teamMembersMap, userRolesMap) {
    let teamList = [];
    let roleList = [];

    question.selectedUser = {
      ...question.selectedUser,
      assignedFunctions: [],
      users: [],
    };
    if (
      question?.assignedUser?.attributes?.assigned_to &&
      question?.assignedUser?.attributes?.assigned_to.length
    ) {
      question?.assignedUser.attributes.assigned_to.map((id) => {
        let team = teamMembersMap[id];
        if (team) {
          team.is_removed = false;
          teamList.push(team);
        }
      });
      question.selectedUser = {
        ...question.selectedUser,
        users: teamList,
      };
    }
    if (
      question?.assignedUser?.attributes?.assigned_to_functions &&
      question?.assignedUser?.attributes?.assigned_to_functions.length
    ) {
      question?.assignedUser.attributes.assigned_to_functions.map((id) => {
        let role = userRolesMap[id];
        if (role) {
          role.is_removed = false;
          roleList.push(role);
        }
      });
      question.selectedUser = {
        ...question.selectedUser,
        assignedFunctions: roleList,
      };
    }
    question.selectedUser = {
      ...question.selectedUser,
      functions: Object.values(userRolesMap),
    };
  }

  showVerifyConfirmationforTrackChanges(question, editor, flite, callback) {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to mark this response as reviewed?',
      text: `You have ${flite.countChanges()} change(s) yet to be accepted or rejected.`,
      cancelButtonText: 'Reject all changes',
      confirmButtonText: 'Accept all changes',
      showCloseButton: true,
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          flite.acceptAll();
          question.answer.attributes.textResponse = editor.getContent();
          question.answer.attributes.currentResponse = editor.getContent();
          question.answer.attributes.responseDisplay = editor.getContent();
          callback();
          resolve();
        });
      },
    }).then((isConfirm) => {
      if (isConfirm.dismiss && isConfirm.dismiss == 'cancel') {
        flite.rejectAll();
        question.answer.attributes.textResponse = editor.getContent();
        callback();
        this.SweetAlert.close();
      }
    });
  }

  handleIsRatingIcon(question, customRatingMap, isSection = false) {
    let rightIcons = [];
    if (!customRatingMap && !this.colors) return [];
    let reviewEnabled =
      this.user.firmInfo.preferences.enable_rating_custom_fields_review &&
      this.diligence.status == diligenceStatusConstant.InReview;
    let ratingsNotEditable =
      this.diligence.diligence_type === DiligenceTypeEnum.dd_review &&
      this.firmPreferences.enable_rating_custom_fields_review &&
      (this.diligence.status === diligenceStatusConstant.Completed ||
        this.diligence.status === diligenceStatusConstant.Evaluation);
    let isScoreband = this.colors[0]?.scale_mode === ratingConstants.ScoreBand;
    let isResponseUnsubmitted = false;
    if (
      question?.answer?.id &&
      this.user.isInvestor &&
      [
        diligenceStatusConstant.Completed,
        diligenceStatusConstant.Evaluation,
        diligenceStatusConstant.PendingRestart,
      ].includes(this.diligence.status) &&
      !question.answer.attributes.is_submitted
    ) {
      // disable rating/score icon for investors in post-completion statuses if question has a followup with allow response revision and submission is pending
      isResponseUnsubmitted = true;
    }

    if (this.colors[0]?.scale_mode) {
      let ratingObj = {
        ...questionCardIcons('rating', question, this.diligence),
        isScoreband: isScoreband,
        naScaleObj: this.colors.find(
          (x) => x.value === ratingConstants.notRatedValue
        ),
        rating: this.colors.filter(
          (x) =>
            ![ratingConstants.naValue, ratingConstants.notRatedValue].includes(
              x.value
            )
        ),
        // if there are custom fields added to the rating then the whole modal should show up which will contain custom fields
        // in case of no custom fields simple rate change dropdown should show up
        // This is always true for AE projects
        isNotDropDown:
          (customRatingMap?.custom_fields?.rating &&
            customRatingMap?.custom_fields?.rating?.length) ||
          (this.diligence.diligence_type === DiligenceTypeEnum.dd_review &&
            this.diligence.status === diligenceStatusConstant.InReview),
        reviewEnabled: reviewEnabled,
        type:
          (!reviewEnabled &&
            customRatingMap?.custom_fields?.rating &&
            customRatingMap?.custom_fields?.rating?.length) ||
          (this.diligence.diligence_type === DiligenceTypeEnum.dd_review &&
            this.diligence.status === diligenceStatusConstant.InReview)
            ? 'customFields'
            : 'simple',
      };

      const is_na = isSection
        ? question.sectionRating.is_na
        : question.questionRating.is_na;
      let disableIcon: boolean, disableNaRatingIcon: boolean;
      if (!isScoreband) {
        let color;
        if (is_na) {
          color = this.colors.find(
            (val) => val.value == ratingConstants.notRatedValue
          );
        } else if (isSection)
          color = this.colors.filter(
            (val) => val.value == question?.sectionRating.rating_value
          )[0];
        else
          color = this.colors.filter(
            (val) => val.value == question?.questionRating.rating_value
          )[0];

        disableIcon =
          is_na ||
          ratingsNotEditable ||
          (isSection
            ? this.diligence.status === diligenceStatusConstant.Approved ||
              this.diligence.status === diligenceStatusConstant.NotApproved
            : this.diligence.isLocked ||
              !question?.answer?.id ||
              isResponseUnsubmitted);

        disableNaRatingIcon =
          ratingsNotEditable ||
          (isSection
            ? this.diligence.status === diligenceStatusConstant.Approved ||
              this.diligence.status === diligenceStatusConstant.NotApproved
            : this.diligence.isLocked || isResponseUnsubmitted);

        rightIcons.push({
          ...ratingObj,
          name: isSection
            ? question?.sectionRating.rating_value
            : question?.questionRating.rating_value,
          color: color?.color_code,
          disabled: disableIcon,
          readonly: disableIcon,
          disableNaRatingIcon: disableNaRatingIcon,
          tooltip: !question?.answer?.id
            ? !isSection
              ? `No response available to rate`
              : color?.name
              ? color.name
              : ''
            : '',
          isNARating: is_na,
        });
      } else if (isScoreband) {
        let color;
        if (is_na) {
          color = this.colors.find(
            (val) => val.value == ratingConstants.notRatedValue
          );
        } else if (isSection)
          color = this.colors.filter(
            (color) =>
              color.range_min_value <= question?.sectionRating.score_value &&
              color.range_max_value >= question?.sectionRating.score_value
          )[0];
        else
          color = this.colors.filter(
            (color) =>
              color.range_min_value <= question?.questionRating.score_value &&
              color.range_max_value >= question?.questionRating.score_value
          )[0];

        disableIcon =
          is_na ||
          ratingsNotEditable ||
          (!isSection && (!question.answer?.id || isResponseUnsubmitted)) ||
          this.diligence.status === diligenceStatusConstant.Approved ||
          this.diligence.status === diligenceStatusConstant.NotApproved;

        disableNaRatingIcon =
          ratingsNotEditable ||
          (!isSection && isResponseUnsubmitted) ||
          this.diligence.status === diligenceStatusConstant.Approved ||
          this.diligence.status === diligenceStatusConstant.NotApproved;

        rightIcons.push({
          ...ratingObj,
          name: isSection
            ? question?.sectionRating.score_value
            : question?.questionRating.score_value,
          color: color?.color_code,
          selection: isSection
            ? question.sectionRating
            : question.questionRating,
          readonly: disableIcon,
          disabled: disableIcon,
          disableNaRatingIcon: disableNaRatingIcon,
          tooltip: !question?.answer?.id
            ? !isSection
              ? `No response available to rate`
              : ''
            : '',
          isNARating: is_na,
        });
      }
    }
    return rightIcons;
  }

  handleMappedQuestions(question, reviewMappingsData, callback) {
    let isEditable = !this.diligence.isReadOnly && !this.diligence.isLocked;
    this.store.dispatch(
      new UpdateActivePanelId(`mapped-questions-${question.id}`)
    );
    this.panelService.invoke('mapped-questions', {
      isAddToResponseAllowed:
        isEditable &&
        this.diligence.diligence_type === DiligenceTypeEnum.dd_review &&
        question.responseType === ResponseType.TextMultiLine,
      question,
      diligence: this.diligence,
      reviewMappingsData: reviewMappingsData,
      handleAddResponse: (text) => {
        const id = `${question.sequenceID}-${question.sectionID}-${question.id}`;
        let localTextResponse = this.store.selectSnapshot(
          (state) => state.questionnaire.localQuestionMap
        )[id]?.textResponse;
        question.answer.attributes.localTextResponse = localTextResponse
          ? localTextResponse + ' '
          : '';
        question.answer.attributes.localTextResponse += text;
        this.store.dispatch(
          new SidePanelUpdate({
            response_type: question.responseType,
            questionID: question.id,
            textResponse: question.answer.attributes.localTextResponse,
          })
        );
        setTimeout(() => {
          this.store.dispatch(new SidePanelUpdate(null));
        });
        callback();
      },
    });
  }

  handleRevision(question, callback, readOnly = false) {
    this.store.dispatch(new UpdateActivePanelId(`qa-revision-${question.id}`));
    this.panelService.invoke('qa-revision', {
      question,
      readOnly,
      teamMembers: this.teamMembers,
      onSuccess: (ans) => {
        let { isDraftSave: savingDraftMap, localGridMap } = this.stateSnapShot;
        const id = `${question.sequenceID}-${question.sectionID}-${question.id}`;
        if (savingDraftMap && id in savingDraftMap) {
          if (savingDraftMap[id]?.isDeleted) {
            question = {
              ...question,
              answer: {
                attributes: DefaultQuestionState(),
              },
              showComment: false,
            };
          } else {
            question.answer = {
              ...question.answer,
              id: savingDraftMap[id]?.id,
            };
            question.answer.attributes = {
              ...question.answer.attributes,
              ...savingDraftMap[id],
            };
          }
        }
        question.answer.attributes = {
          ...question.answer.attributes,
          ...ans,
        };
        question.showComment = false;
        callback();
      },
    });
  }

  handleOtherOptions(question, value) {
    if (
      question.responseType === ResponseType.Dropdown ||
      question.responseType === ResponseType.CheckBox
    ) {
      question.answer.attributes.isOther = value.isOther;
      question.answer.attributes.otherExplanation = value.otherExplanation;
    }
  }

  updateTrackChangeValues(question, responseHistory) {
    if (
      !UnsupportedTrackChangeTypes.includes(question.responseType) &&
      [
        trackChangeStatusConstant.Started,
        trackChangeStatusConstant.Rejected,
        trackChangeStatusConstant.Accepted,
      ].includes(question.answer.attributes.track_change_status) &&
      responseHistory &&
      !question.answer.attributes.localis_NA &&
      question.answer.id in responseHistory
    ) {
      question.answer.attributes.isTrackChange = true;
      question.answer.attributes.showTrackChangeButtons =
        ResponseType.TextMultiLine !== question.responseType;
      if (question.answer.attributes.showTrackChangeButtons)
        this.updateTrackChange(true);
      question.answer.attributes.previousResponse =
        responseHistory[question.answer.id].responseDisplay;
      question.answer.attributes.currentResponse =
        question.answer.attributes.responseDisplay;

      if (
        [
          trackChangeStatusConstant.Accepted,
          trackChangeStatusConstant.Rejected,
        ].includes(question.answer.attributes.track_change_status)
      ) {
        question.answer.attributes.showTrackChangeButtons = false;
        this.updateTrackChange(false);
      }

      if (
        question.responseType == ResponseType.Grid ||
        question.responseType == ResponseType.DynamicGrid
      ) {
        responseHistory[question.answer.id].grid_responses = responseHistory[
          question.answer.id
        ].grid_responses?.map(({ row_id, column_id, value }) => {
          value = value ? value : null;
          return { row_id, column_id, value };
        });
      }
    }
  }

  // showing trackchange for textmultiline response type
  updateTrackChangeValuesTextMultiline(question, responseHistory) {
    if (
      ResponseType.TextMultiLine === question.responseType &&
      responseHistory &&
      !question.answer.attributes.localis_NA &&
      question.answer.id in responseHistory
    ) {
      question.answer.attributes.isTrackChange = true;
      question.answer.attributes.previousResponse =
        responseHistory[question.answer.id].responseDisplay;
      question.answer.attributes.currentResponse =
        question.answer.attributes.responseDisplay;
    }
  }

  addLeftIcons(question: QuestionAttributeType, isDraft = false, error?) {
    const id = `${question.sequenceID}-${question.sectionID}-${question.id}`;
    // update current data
    this.questions.forEach((ques) => {
      let quesId = `${ques.sequenceID}-${ques.sectionID}-${ques.id}`;
      if (quesId == id) {
        ques.answer.attributes = {
          ...ques.answer.attributes,
          ...question.answer.attributes,
        };
      }
    });
    if (this.isManualUserValidationRequired(question)) {
      const isDisabled =
        this.localQuestionMapSub[id]?.isResponseError ||
        (question?.answer.attributes.response_type ===
          ResponseType.TextMultiLine &&
          question.answer.attributes.isAnswerReadonly);
      return {
        key: 'tableValidation',
        name: 'warning',
        disabled: isDisabled,
        color: isDisabled ? 'grey' : 'orange',
        tooltip: isDisabled
          ? 'Response has validation errors. please resolve them'
          : 'Response requires validation',
      };
    }

    // localQuestionMap is added to check the response error
    if (
      error ||
      (this.localQuestionMapSub &&
        this.localQuestionMapSub[id]?.isResponseError)
    ) {
      let tooltip = this.checkForError(question);
      question.answer.attributes.is_valid = false;
      return {
        key: 'warning',
        name: 'warning',
        color: 'red',
        disabled: false,
        tooltip: question.answer.attributes.localis_NA
          ? this.naCommentPlaceholder
          : tooltip,
      };
    }

    question.answer.attributes.is_valid = true;
    if (isDraft) {
      return {
        key: 'hour-glass',
        name: 'hour-glass',
        disabled: false,
        color: 'orange',
        tooltip: 'You have unsaved changes on this question',
      };
    }

    const validText = CheckResponseText(question);
    let color = validText ? 'green' : question.is_mandatory ? 'red' : 'grey';
    return {
      key: 'check',
      name: 'check',
      disabled: false,
      color,
      tooltip: validText
        ? ''
        : question.is_mandatory
        ? 'Mandatory question'
        : '',
    };
  }

  updateRightIcons(question: QuestionAttributeType): void {
    const id = `${question.sequenceID}-${question.sectionID}-${question.id}`;
    const localQuestion: QuestionAttributeType = this.questions.find((q) => {
      const qId = `${q.sequenceID}-${q.sectionID}-${q.id}`;
      return qId === id;
    });

    if (localQuestion) {
      // Json stringify and parse is added to manually trigger the angular change detector
      // in dv-question-card component
      localQuestion.icons.rightIcons = JSON.parse(
        JSON.stringify(question.icons.rightIcons)
      );
    }
  }

  checkForError(question: QuestionAttributeType) {
    if (
      question.responseType === ResponseType.NoPlus ||
      question.responseType === ResponseType.BooleanPlus
    )
      return 'Please provide an explanation';
    else if (
      question.responseType === ResponseType.Dropdown ||
      question.responseType === ResponseType.CheckBox
    )
      return 'Please specify other option';
    else if (question.responseType === ResponseType.Integer)
      return 'Enter a valid integer';
    else if (
      question.responseType === ResponseType.Percentage ||
      question.responseType === ResponseType.Numeric
    )
      return 'Not a valid number';
    else if (question.responseType === ResponseType.TextEmail)
      return 'Not a valid email address';
  }

  updatedQuestionDataAfterSave(question) {
    let savingDraftMap = JSON.parse(
      JSON.stringify(
        this.store.selectSnapshot((state) => state.questionnaire.isDraftSave)
      )
    );
    if (!savingDraftMap) return;
    if (question.sequenceID in this.draft.sequenceIdMap) {
      question.sequenceID = this.draft.sequenceIdMap[question.sequenceID];
    }
    const id = `${question.sequenceID}-${question.sectionID}-${question.id}`;
    if (id in savingDraftMap) {
      question.answer = {
        ...question.answer,
        id: savingDraftMap[id]?.id,
      };
      question.answer.attributes = {
        ...question.answer.attributes,
        ...savingDraftMap[id],
      };
      UpdateLocalQuestionState(question.answer, this.dvDatePipe);
    }
  }

  updateSequenceMap(sequenceSectionQuestionMap, ques) {
    if (!(ques.sequenceID in sequenceSectionQuestionMap)) {
      sequenceSectionQuestionMap[ques.sequenceID] = {};
      if (!(ques.sectionID in sequenceSectionQuestionMap[ques.sequenceID])) {
        sequenceSectionQuestionMap[ques.sequenceID][ques.sectionID] = {};
        if (
          !(
            ques.id in
            sequenceSectionQuestionMap[ques.sequenceID][ques.sectionID]
          )
        ) {
          sequenceSectionQuestionMap[ques.sequenceID][ques.sectionID][ques.id] =
            JSON.parse(JSON.stringify(ques));
        }
      }
    } else {
      sequenceSectionQuestionMap[ques.sequenceID][ques.sectionID][ques.id] =
        JSON.parse(JSON.stringify(ques));
    }
  }

  isLeftLinkComment(leftLinks, question) {
    const answer = question.answer.attributes;
    if (
      (question.responseType === ResponseType.NoPlus &&
        answer.localBooleanResponse === false) ||
      (question.responseType === ResponseType.BooleanPlus &&
        answer.localBooleanResponse) ||
      ((question.responseType === ResponseType.Dropdown ||
        question.responseType === ResponseType.CheckBox) &&
        answer.isOther)
    ) {
      if (!answer.localis_NA) question.showComment = false;
    } else {
      question.commentPlaceholder =
        this.user?.isManager && !this.diligence?.is_internal
          ? 'Supplement your response with a comment that is viewable by your investors. i.e. If you mark a question as N/A, you can explain why it is N/A in a comment.'
          : 'Add a comment';

      let name = 'Add Comment';
      if (answer.localis_NA) {
        question.commentPlaceholder = this.naCommentPlaceholder;
        name = 'Hide Comment';
      } else {
        if (question.answer.attributes.localTextResponse) {
          name = 'Show comment';
        }
      }
      leftLinks.push({
        name: name,
        key: 'comments',
      });
      if (question.answer.attributes.localTextResponse) {
        question.showComment = true;
      }
    }
  }

  updateTrackChange(isAdd: boolean) {
    const currentValue = this.trackChanges.getValue();
    let newValue;
    if (isAdd) newValue = currentValue + 1;
    else newValue = currentValue - 1;
    this.trackChanges.next(newValue);
  }
  updateIconsAfterSave(
    questions,
    addRightIcons,
    addLeftLinks,
    addRightLinks,
    inReview = false
  ) {
    this.stateSnapShot = JSON.parse(
      JSON.stringify(this.store.selectSnapshot((state) => state.questionnaire))
    );
    let { sequenceSectionQuestionMap, localQuestionMap } = this.stateSnapShot;
    this.localQuestionMap = localQuestionMap;
    this.sequenceSectionQuestionMap = sequenceSectionQuestionMap;
    questions = questions.map((question: any) => {
      question.answer.attributes.tempTextResponse = null; // Remove the temp response after draft save for not showing the response back if user marks the the question back to applicable
      question = this.updatedQuestionIcons(
        question,
        addRightIcons,
        addLeftLinks,
        addRightLinks,
        inReview
      );
      return question;
    });
    // This is causing the editor instance to close up after saving which should not happen
    // this.currentActiveQuestionId = null;
    this.store.dispatch([
      new UpdateSequenceSectionQuestionMap(this.sequenceSectionQuestionMap),
      new UpdateBulkLocalQuestionMapQuestionMap(this.localQuestionMap),
      new IsSavingDraft(null),
    ]);
    return questions;
  }

  updatedQuestionIcons(
    question,
    addRightIcons,
    addLeftLinks,
    addRightLinks,
    inReview
  ) {
    let { isDraftSave: savingDraftMap, localGridMap } = this.stateSnapShot;
    if (!savingDraftMap) return question;
    if (question.sequenceID in this.draft.sequenceIdMap) {
      // updating the local map if sequence id is locally generated
      if (question.sequenceID % 1) {
        this.localQuestionMap[
          `${this.draft.sequenceIdMap[question.sequenceID]}-${
            question.sectionID
          }-${question.id}`
        ] =
          this.localQuestionMap[
            `${question.sequenceID}-${question.sectionID}-${question.id}`
          ];
        question.sequenceID = this.draft.sequenceIdMap[question.sequenceID];
      }
    }
    const id = `${question.sequenceID}-${question.sectionID}-${question.id}`;
    if (id in savingDraftMap) {
      if (savingDraftMap[id]?.isDeleted) {
        question.answer.id = null;
        question.showComment = false;
        question.answer.attributes = {
          ...question.answer.attributes,
          ...savingDraftMap[id],
          ...DefaultQuestionState(),
        };
      } else {
        question.answer = {
          ...question.answer,
          id: savingDraftMap[id]?.id,
        };
        question.answer.attributes = {
          ...question.answer.attributes,
          ...savingDraftMap[id],
        };
      }

      UpdateLocalQuestionState(question.answer, this.dvDatePipe);
      // updating store question data
      this.store.dispatch(
        new UpdateQuestionData(
          null,
          question.sectionID,
          JSON.parse(JSON.stringify(question))
        )
      );

      // Updating local grid map after save
      if (
        question.responseType === ResponseType.Grid ||
        question.responseType === ResponseType.DynamicGrid
      ) {
        if (id in localGridMap) delete localGridMap[id];
        initializeLocalGridMap(question, localGridMap);
        this.store.dispatch(new UpdateLocalGridMap(localGridMap));

        Object.keys(this.draft.sequenceIdMap).forEach((key) => {
          if (question.sequenceID == this.draft.sequenceIdMap[key]) {
            this.cache.GRIDCACHE[
              `${question.sequenceID}-${question.sectionID}-${question.id}`
            ] =
              this.cache.GRIDCACHE[
                `${key}-${question.sectionID}-${question.id}`
              ];
          }
        });
      }
      question['icons'] = {
        leftIcons: this.addLeftIcons(question),
        rightIcons: addRightIcons(question),
        leftLinks: addLeftLinks(question),
        rightLinks: addRightLinks(question),
      };
      if (inReview)
        question['icons'].rightIcons = addRightIcons(question)(question);
    }
    // update the local question map with the latest question attributes regardless if there is nested question or not
    this.localQuestionMap[
      `${question.sequenceID}-${question.sectionID}-${question.id}`
    ] = LocalQuestionMapHelper(question.answer);
    if (question.nestedQuestions.length) {
      question.nestedQuestions = this.updatNestedViewLogic(
        question.nestedQuestions,
        addRightIcons,
        addLeftLinks,
        addRightLinks,
        inReview
      );
    }
    this.updateSequenceMap(this.sequenceSectionQuestionMap, question);
    return question;
  }

  updatNestedViewLogic(
    questions,
    addRightIcons,
    addLeftLinks,
    addRightLinks,
    inReview
  ) {
    questions = questions.map((nested) => {
      nested.nestedID = this.updatedQuestionIcons(
        nested.nestedID,
        addRightIcons,
        addLeftLinks,
        addRightLinks,
        inReview
      );
      nested.nestedID.nestedQuestions = this.updatNestedViewLogic(
        nested.nestedID.nestedQuestions,
        addRightIcons,
        addLeftLinks,
        addRightLinks,
        inReview
      );
      return nested;
    });
    return questions;
  }

  updateSequenceMapForNestedquestions(sequenceSectionQuestionMap, ques) {
    ques.nestedQuestions?.forEach((nested) => {
      this.updateSequenceMap(sequenceSectionQuestionMap, nested.nestedID);
      this.updateSequenceMapForNestedquestions(
        sequenceSectionQuestionMap,
        nested.nestedID
      );
    });
  }

  updateTextResponse(question, editor_id, data = null) {
    question.answer.attributes.textResponse = data
      ? data
      : (window as any).tinymce
          .get(editor_id?.editorInstance?.id)
          ?.getContent()
          .replace(' tox-comment--active', '');
  }

  updateCommentIfDraftPopUp(text, editor_id, question) {
    if (
      !(`comment-${question.id}` in this.commentsService.questionIdMultitextMap)
    ) {
      this.commentsService.questionIdMultitextMap[`comment-${question.id}`] =
        true;
    }
    if (
      text &&
      this.commentsService.questionIdMultitextMap[`comment-${question.id}`]
    ) {
      if (question.answer.attributes.textResponse) {
        this.updateTextResponse(question, editor_id, text);
      }
      this.commentsService.questionIdMultitextMap[`comment-${question.id}`] =
        false;
    }
  }
  //Function to handle opening of sidepanle on Init and after scroll of present in store
  handleSidePanelOpening(questionsList, scrolled, callback) {
    setTimeout(() => {
      if (scrolled) {
        const router = this.router.getState().params;
        let sidePanel = router.panel;
        if (sidePanel) {
          let icon: any = { key: sidePanel };
          let question = questionsList.find(
            (ques) => ques.id == router.questionId
          );
          // Safety check to see wether requested sidepanel is present in the question or not
          let obj = question.icons.rightIcons.find((x) => x.key === sidePanel);
          if (obj) callback(icon, question);


          this.router.getRouterInstance().navigate([], {
            queryParams: { panel: null },  // Setting to null removes it
            queryParamsHandling: 'merge',   // Keeps other params
            fragment: router["#"]
          });
        }
      }
    }, 500);
  }

  //Function to handle opening of sidepanel for AI
  openAiPanel(question: QuestionAttributeType) {
    if (
      !this.firmPreferences.enable_gen_ai ||
      !this.firmPreferences.enable_system_gen_ai
    )
      return;
    this.store.dispatch(
      new UpdateActivePanelId(`questionnaire-AI${Math.random()}-${question.id}`)
    );
    this.panelService.invoke('ai-panel', {
      selectedPrompt: null,
      selectedResponse: () => ({
        selectedText: question.answer.attributes.textResponse,
        customSelection: false,
      }),
      onGenerating: () => null,
      isReadonly: true,
      question: question,
      onClose: () => {},
      onAction: (action) => {},
    });
  }
  //Function to update SMES at question level when it is updated at section level
  updateSmes(sme, questions, teamMembers, userRolesMap) {
    const { user, removed } = sme;
    questions.forEach((question) => {
      if (!question.assignedUser.attributes.assigned_to)
        question.assignedUser.attributes.assigned_to = [];
      if (!question.assignedUser.attributes.assigned_to_functions)
        question.assignedUser.attributes.assigned_to_functions = [];
      if (removed) {
        if (user.type === 'user')
          question.assignedUser.attributes.assigned_to =
            question.assignedUser.attributes.assigned_to.filter(
              (id) => id != user.member.id
            );
        else
          question.assignedUser.attributes.assigned_to_functions =
            question.assignedUser.attributes.assigned_to_functions.filter(
              (id) => id != user.member.function_id
            );
      } else {
        if (user.type === 'user')
          !question.assignedUser.attributes.assigned_to.find(
            (x) => x == user.member.id
          ) &&
            question.assignedUser.attributes.assigned_to.push(user.member.id);
        else
          !question.assignedUser.attributes.assigned_to_functions.find(
            (x) => x == user.member.function_id
          ) &&
            question.assignedUser.attributes.assigned_to_functions.push(
              user.member.function_id
            );
      }

      question.selectedUser = [];
      this.updateQuestionsAssignment(question, teamMembers, userRolesMap);
      if (question.nestedQuestions.length) {
        for (let i = 0; i < question.nestedQuestions.length; i++) {
          this.updateSmes(
            sme,
            [question.nestedQuestions[i].nestedID],
            teamMembers,
            userRolesMap
          );
        }
      }
    });
  }

  //  here we are updating the nested local map object if nested question is invaild
  updateNestedLocalQuestionMap(nested, id, localQuestionMap) {
    UpdateLocalQuestionState(nested.nestedID.answer, this.dvDatePipe);
    let newQuestionData = LocalQuestionMapHelper(nested.nestedID.answer);
    localQuestionMap[id] = newQuestionData;
    this.store.dispatch(new UpdateLocalQuestionMap(id, newQuestionData));
  }

  getResponseRevisionDetail(question: QuestionAttributeType) {
    const answer = question.answer.attributes;
    if (question.deleted_response_id)
      return `Deleted by ${question.deleted_by} on ${this.dvDatePipe.transform(
        question.deleted_at
      )}`;
    else if (answer.responseSource === ResponseSource.AutoFill) {
      return `Auto-filled by ${answer.responseAuthor.fullName} ${answer.responseTimeStamp}`;
    } else if (answer.responseSource === ResponseSource.ExcelSync) {
      return `Added via Excel Synced by ${answer.responseAuthor.fullName} ${answer.responseTimeStamp}`;
    } else if (answer.responseSource === ResponseSource.ManualEdit) {
      if (!answer.revision_counts)
        return `Added by ${answer.responseAuthor.fullName} ${answer.responseTimeStamp}`;
      else
        return `Last Revised by ${answer.responseAuthor.fullName} ${answer.responseTimeStamp}`;
    }
  }

  // Function to ensure that only selected tinymce editor instance stays active at a time
  handleUpdateActiveQuestion(
    question,
    type: 'main' | 'boolResponse' | 'comment' = 'main'
  ) {
    // return if clicked on same editor
    let id = `${question.sequenceID}-${question.id}`;
    if (id == this.currentActiveQuestionId) return;

    // for template builder page
    if (this.isTemplateBuilderModule(question)) {
      setTimeout(() => (this.currentActiveQuestionId = id));
      return;
    }

    let activePanelName = this.store
      .selectSnapshot((state) => state.questionnaire.activePanelId)
      ?.split('-');
    let activePanelId;
    let activeSection = this.store.selectSnapshot(
      (state) => state.questionnaire.activeSection
    );
    activePanelId =
      activePanelName?.length && activePanelName[activePanelName.length - 1]; // Get the last part of the panelId to get question/diligenceId

    //The active panel should not be closed if it is at diligence level or at section level or sidepanel is open for same question ex QA CENTER panel, internal note etc
    if (
      activePanelId != this.diligence.id &&
      activePanelId != activeSection.id &&
      activePanelId != question.id &&
      activePanelName?.length &&
      activePanelName[1]?.match(/^AI[0-9]+/) // Match with AI panel ID and remove the panel
    ) {
      this.panelService.close(); // close the sidepanel if another of tinymce is opened
    }

    setTimeout(() => (this.currentActiveQuestionId = id));
  }

  destroyVariablesUponExit() {
    this.currentActiveQuestionId = null;
  }

  destroyActiveEditorInstace() {
    this.currentActiveQuestionId = null;
  }

  isTemplateBuilderModule(question) {
    return question?.icons?.rightIcons?.length == 0;
  }

  /**
   * Finds the question recursively.
   * @param propertyName The property name using which to search the question.
   * @param propertyValue The property value to match during search.
   * @param questions The list of question to search in.
   * @returns The question (if found). Otherwise, `null`.
   */
  findQuestionRecursively(
    propertyName: string,
    propertyValue: string | number,
    questions: Array<QuestionAttributeType>
  ): QuestionAttributeType | null {
    for (let question of questions) {
      if (question[propertyName] === propertyValue) {
        return question;
      } else if (question.nestedQuestions && question.nestedQuestions.length) {
        const nestedQuestions = question.nestedQuestions
          .filter((q: any) => q.nestedID)
          .map((q: any) => q.nestedID);
        const result = this.findQuestionRecursively(
          propertyName,
          propertyValue,
          nestedQuestions
        );
        if (result) {
          return result;
        }
      }
    }

    return null;
  }
}
