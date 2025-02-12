import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { finalize, take, takeUntil } from 'rxjs/operators';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import { QuestionType } from 'src/app2/apis/template/types/question.type';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { UtilsService } from 'src/app2/services/utils.service';
import {
  ErrorStatusCode,
  FollowUpType,
  IssueType,
} from 'src/app2/shared/constants/constant';
import { UserState } from 'src/app2/store/user/user.state';
import {
  GetDiligenceData,
  GetQuestionCount,
  TriggerSilentReload,
} from '../../store/questionnaire.action';
import { QuestionState } from '../../store/questionnaire.state';
import { RecommendationTrackerService } from 'src/app2/apis/recommendationTracker.service';
import { ProjectSummaryService } from 'src/app2/services/project-summary.service';
import { diligenceStatusConstant } from '../../constants/quick-view-headers.constant';
import { Observable, Subject } from 'rxjs';
import { UpdateActivePanelId } from 'src/app2/store/user/user.action';
import { CKEditorUtilService } from 'src/app2/services/ck-editor/ckeditor-util.service';
@Component({
  selector: 'follow-up-panel',
  templateUrl: './follow-up-panel.component.html',
  styleUrls: ['./follow-up-panel.component.css'],
})
export class FollowUpPanelComponent implements OnInit, OnDestroy {
  @Input() question: QuestionType & { isSelected: false } & any;
  @Input() questions: any[];
  @Input() isReadOnly: boolean = false;
  @Input() onCommentAdded;
  @Input() onCommentDeleted;
  @Input() onBulkResolve;
  @Input() onRecommendationAdded;
  @Input() followUpType = FollowUpType.Question;
  // Diligence is_internal, fromfirm_id, tofirm_id are required for recommendation panel
  @Input() diligence;
  @Input() shareResponseData;
  IssueType = IssueType;
  loading: boolean;
  showDescription: boolean = false;
  isAdding: boolean = false;
  isList: boolean = true;
  showBackIcon: boolean = false;
  followups: any[] = [];
  toggleDropdown: any;
  issue: any;
  panelTitle: any = 'Follow-up';
  editingRecommendation: any;
  unsendFollowUps = [];
  unsendFollowUp: any;
  user;
  mentionsList = [];
  isMentionsListLoading: boolean = false;
  noFollowUpText =
    'Start or continue a conversation with your manager. Ask questions or address follow-ups here.';
  @Select(UserState.getFirmPreferenceData) firmPref;
  @Select(QuestionState.getFollowUpsToSend) getFollowUpsToSend;
  firm_preferences: any;
  idToAddRecommendation: number;
  recommendationSubject: any;
  totalUnresolvedCommentsCount = 0;
  private ngUnsubscribe = new Subject<void>();
  @Select(QuestionState.getQuestionnaireCount) questionCount;
  showRevisionOption: boolean;
  revisionOptionValue: boolean;
  responseRevisionInProgress: boolean;
  showRevisionHelpText: boolean;
  showRevisionNotAllowedHelpText: boolean;
  showInvestorSumissionHelpText: boolean;
  constructor(
    private panel: SidePanelService,
    private store: Store,
    private readonly SweetAlert: SweetAlertService,
    private readonly toaster: ToastrService,
    private readonly questionnaire: QuestionnaireService,
    private readonly projectSummary: ProjectSummaryService,
    private Utils: UtilsService,
    private readonly recommendationTrackerService: RecommendationTrackerService,
    private readonly ckEditorUtilService: CKEditorUtilService
  ) {}

  ngOnInit(): void {
    this.firmPref.pipe(take(2)).subscribe((pref) => {
      if (pref) {
        this.firm_preferences = JSON.parse(JSON.stringify(pref));
      }
    });
    this.user = this.store.selectSnapshot((state) => state.user.currentUser);
    if (this.user.isManager)
      this.noFollowUpText =
        'Start or continue a conversation with your investor. Ask questions or address follow-ups here.';
    if (this.followUpType == FollowUpType.Question) {
      this.getFollowUpList();
    } else if (this.followUpType == FollowUpType.Project) {
      this.getFollowUpsWithProjectId();
    }

    this.questionCount.pipe(takeUntil(this.ngUnsubscribe)).subscribe((res) => {
      res.count?.map((val) => {
        if (val.id === 'TotalUnresolvedCommentsCount')
          this.totalUnresolvedCommentsCount = val.value;
      });
    });

    let { diligence, tofirmId, fromfirmId } = this.store.selectSnapshot(
      (state) => state.questionnaire
    );
    if (diligence && !diligence?.is_internal) {
      this.isMentionsListLoading = true;
      // In case of manager, fromFirmId is the firm which has sent the project. And
      // in case of investor, toFirmId is the firm to whom the investor has sent the project.
      this.recommendationTrackerService
        .getEntityExternalSubscribers(
          diligence.id,
          'Duediligence',
          this.user.isManager ? fromfirmId : tofirmId
        )
        .subscribe(
          (users: Array<any>) => {
            users.forEach((user: any) => {
              user.id = user.user_id;
              user.fullName = `${user.fullName} (External)`;
            });
            const internalUsers: Array<any> = this.store
              .selectSnapshot((state) => state.user.teamMembers)
              .map((val: any) => ({
                ...val,
                fullName: `${val.fullName} (Internal)`,
              }));
            this.mentionsList = [
              ...users.map(this.ckEditorUtilService.mentionListMapper),
              ...internalUsers.map(this.ckEditorUtilService.mentionListMapper),
            ];

            this.isMentionsListLoading = false;
          },
          (err) => {
            this.isMentionsListLoading = false;
          }
        );
    }
  }
  getFollowUpsWithProjectId() {
    this.loading = true;
    this.followups = [];
    this.projectSummary
      .getFollowUpsWithProjectId(this.shareResponseData.id)
      .subscribe(
        (followUps: any) => {
          followUps.forEach((followUp, index) => {
            followUp.updated_at = null;
          });
          this.followups.push({
            id: this.diligence.id,
            entityId: this.shareResponseData.id,
            comments: followUps,
            text: this.shareResponseData.tofirm_name,
            isOpen: true,
          });
          this.loading = false;
        },
        (err) => (this.loading = false)
      );
  }

  handleSaveAlertWrapper(payload) {
    this.showReviewCommentsAlert(() => {
      this.showResponseChangeAlert(payload, () => {
        this.handleOnSaveComment(payload);
      });
    });
  }

  async handleOnSaveComment(payload) {
    this.loading = true;
    if (this.followUpType == FollowUpType.Question) {
      if (!this.question.sequenceID || this.question.sequenceID % 1) {
        // first generate the sequence and then use the ID while adding the followup
        const params = {
          duediligence_id: this.diligence.id,
          SectionID: this.question.sectionID,
        };
        const res: any = await this.questionnaire
          .updateQuestionSequenceId(params)
          .toPromise();
        this.question.sequenceID = res.id;
        this.store.dispatch(new TriggerSilentReload(Math.random(), false));
      }
      const followUpPayload = {
        text: payload.text,
        entity_id: this.question.id,
        entity_type: this.followUpType,
        parent_entity_id: this.question.sectionID,
        parent_entity_type: 'Section',
        diligence_id: this.diligence.id,
        sequence_id: this.question.sequenceID,
        parent_id: null,
        allow_response_revision: payload.allow_response_revision,
      };
      this.questionnaire
        .createFollowUp([followUpPayload])
        .pipe(finalize(() => (this.loading = false)))
        .subscribe(
          (res: any) => {
            this.onCommentAdded(this.question);
            this.store.dispatch(new GetQuestionCount());
            if (payload.allow_response_revision) {
              // trigger silent reload to remove the response from the main screen
              this.store.dispatch(
                new TriggerSilentReload(Math.random(), false)
              );
            }
            this.getFollowUpList();
          },
          (err) => (this.loading = false)
        );
    } else if (this.followUpType == FollowUpType.Project) {
      const params = {
        text: payload.text,
        type: 'DiligenceFollowup',
        entity_id: this.shareResponseData.id,
        entity_type: this.followUpType,
      };
      this.projectSummary
        .saveFollowup(params)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe((response: any) => {
          this.getFollowUpsWithProjectId();
        });
    }
  }

  HandleOnResolveComment(payload) {
    if (
      !this.followups[0].comments.find(
        (x) =>
          x.id !== payload.comment_id &&
          x.parent_id !== payload.comment_id &&
          !x.resolved_by &&
          !x.resolved_at
      )
    ) {
      // all the other followups are resolved so call bulk resolve API
      this.bulkResolveFollowups();
      return;
    }

    this.SweetAlert.confirm({
      title: `Are you sure you want to resolve this follow-up ?`,
      confirmButtonText: 'Yes, Resolve it!',
      showLoaderOnConfirm: true,
      focusCancel: true,
      preConfirm: async () => {
        this.loading = true;
        this.questionnaire.resolveFollowUpComment(payload.comment_id).subscribe(
          (res) => {
            this.store.dispatch(new GetQuestionCount());
            this.getFollowUpList();
          },
          (err) => (this.loading = false)
        );
      },
    });
  }

  HandleOnUpdateComment(payload) {
    this.loading = true;
    this.questionnaire.updateComment(payload).subscribe(
      (res) => {
        this.toaster.success('Comment updated');
        this.ngOnInit();
        this.loading = false;
      },
      (err) => (this.loading = false)
    );
  }

  HandleOnSaveReply(payload) {
    let temp = {
      text: payload.text,
      entity_id: this.question.id,
      entity_type: this.followUpType,
      parent_entity_id: this.question.sectionID,
      parent_entity_type: 'Section',
      diligence_id: this.diligence.id,
      sequence_id: this.question.sequenceID,
      parent_id: payload.parent_comment_id,
      allow_response_revision: payload.allow_response_revision,
    };

    this.showReviewCommentsAlert(() => {
      this.showResponseChangeAlert(payload, () => {
        this.loading = true;
        this.questionnaire.createFollowUp([temp]).subscribe(
          (res) => {
            this.loading = false;
            this.onCommentAdded(this.question);
            this.store.dispatch(new GetQuestionCount());
            this.getFollowUpList();
          },
          (err) => (this.loading = false)
        );
      });
    });
  }

  showReviewCommentsAlert(callback) {
    if (
      this.diligence.status == diligenceStatusConstant.Evaluation &&
      this.totalUnresolvedCommentsCount > 0
    ) {
      this.SweetAlert.confirm({
        title: `There are unresolved comments in the project. If you proceed, these comments will be marked as resolved. Do you wish to continue?`,
        confirmButtonText: 'Confirm',
        text: `You have ${this.totalUnresolvedCommentsCount} review(s) pending.`,
        showLoaderOnConfirm: true,
        focusCancel: true,
        preConfirm: async () => {
          callback();
        },
      });
    } else callback();
  }

  showResponseChangeAlert(payload, callback) {
    if (
      this.user.isInvestor &&
      [
        diligenceStatusConstant.Completed,
        diligenceStatusConstant.Evaluation,
        diligenceStatusConstant.PendingRestart,
      ].includes(this.diligence.status) &&
      payload.allow_response_revision &&
      this.question.answer?.id
    ) {
      this.question.answer.attributes.is_submitted = false;
      if (
        this.question.answer.attributes.is_flagged ||
        (this.question.questionRating?.rating_value ??
          this.question.questionRating?.score_value) ||
        this.question.answer.attributes.assignments
      ) {
        // show alert if response has flags/rating/assignments
        const text =
          this.diligence.status !== diligenceStatusConstant.Evaluation
            ? 'If the responder revises the response, the flag and rating/score will be reset or re-calculated'
            : 'If the responder revises the response, the flag, rating/score and approval/rejection will be reset or re-calculated';
        this.SweetAlert.confirm({
          title: text,
          confirmButtonText: 'Ok! Send',
          showLoaderOnConfirm: true,
          focusCancel: true,
          preConfirm: async () => {
            callback();
          },
        });
      } else callback();
    } else callback();
  }

  HandleOnDeleteComment(payload, followup) {
    this.SweetAlert.confirm({
      title: `Are you sure you want to delete this comment ?`,
      confirmButtonText: 'Yes, delete it!',
      showLoaderOnConfirm: true,
      focusCancel: true,
      preConfirm: async () => {
        this.loading = true;
        this.questionnaire.deleteFollowUp(payload.comment_id).subscribe(
          (deletedComment: any) => {
            this.SweetAlert.close();
            this.toaster.success('Comment deleted');

            followup.comments = this.Utils.sortByDate(
              followup.comments,
              'created_at'
            ).filter(
              (comment) =>
                comment.id !== payload.comment_id &&
                comment.parent_id !== payload.comment_id
            );

            const remainingOpenCount = this.followups[0].comments.filter(
              (x) => !x.resolved_by && !x.resolved_at
            ).length;

            // update count and last_is_received value
            this.onCommentDeleted(
              this.question,
              remainingOpenCount,
              followup.comments.length
                ? followup.comments[0].firm_id !== this.user.firmInfo.id
                : false
            );
            if (!remainingOpenCount) {
              // all the remaining followups are already resolved
              this.onBulkResolve(this.question);
            }
            this.store.dispatch(new GetQuestionCount());
            this.getFollowUpList();
            this.loading = false;
          },
          (err) => {
            this.SweetAlert.close();
            if (
              !(
                err &&
                err.status &&
                Object.values(ErrorStatusCode).includes(err.status)
              )
            ) {
              this.toaster.error('Comment not deleted. Something went wrong!');
            }
            this.loading = false;
          }
        );
      },
    });
  }

  getFollowUpList() {
    this.followups = [];
    if (this.question.sequenceID && !(this.question.sequenceID % 1)) {
      this.loading = true;
      this.questionnaire
        .getFollowupByQuestionId(
          this.diligence.id,
          this.question.id,
          this.question.sequenceID
        )
        .subscribe(
          (res: any) => {
            let comments = res;
            if (comments) {
              comments = comments.map((followUp) => {
                followUp = {
                  ...followUp,
                  isOpen: false,
                  updated_at: null,
                  parent_issue_comment_id: followUp.parent_id,
                  created_by_id: followUp.created_by,
                  disabled: !!followUp.resolved_at,
                  comment_count: comments.filter((followup) => {
                    return followup.parent_id
                      ? followup.parent_id == followUp.id
                      : null;
                  }).length,
                  iconList: followUp.id
                    ? [
                        {
                          name: 'add-recommendation',
                          tooltip: `Add ${
                            this.firm_preferences?.issue_tracker_default_name
                              ? this.firm_preferences.issue_tracker_default_name.toLowerCase()
                              : 'Recommendation'
                          }`,
                          align: 'right',
                          isactive:
                            this.question?.issue_count ||
                            this.Utils.isFreeSubscription() ||
                            ![
                              'approved',
                              'notapproved',
                              'withdrawn',
                              'deleted',
                              'invited',
                              'sent',
                            ].includes(this.diligence.status.toLowerCase()),
                        },
                        {
                          name: 'resolve',
                          tooltip: 'Resolve',
                          align: 'right',
                          label: 'Resolve',
                          isactive: true,
                        },
                        {
                          name: 'reply',
                          tooltip: 'Reply in thread',
                          label: 'Reply in thread',
                          align: 'right',
                          isactive: !followUp.parent_id,
                          disabled: this.isReadOnly,
                        },
                        {
                          name: 'trashcan',
                          tooltip: 'Delete',
                          align: 'right',
                          label: 'Delete',
                          isactive: followUp.created_by == this.user.id,
                          disabled: this.isReadOnly,
                        },
                      ]
                    : null,
                };
                return followUp;
              });
              this.followups.push({
                id: this.question.id,
                // index: this.questions.findIndex((question) => {
                //   return question?.answer?.id == key;
                // }),
                entityId: this.question.id,
                comments: comments,
                text: this.question.text,
                //isOpen: this.question?.answer?.id == key,
                isOpen: true,
              });
            }
            if (!!!this.followups.find((r) => this.question.id == r.entityId)) {
              this.followups.push({
                id: this.question.id,
                // index: this.questions.findIndex((question) => {
                //   1;
                //   return this.question?.answer?.id == question?.answer?.id;
                // }),
                entityId: this.question.id,
                comments: [],
                text: this.question.text,
                isOpen: true,
              });
            }
            this.setRevisionConfig();
            this.loading = false;
          },
          (err) => (this.loading = false)
        );
    } else {
      this.followups.push({
        id: this.question.id,
        entityId: this.question.id,
        comments: [],
        text: this.question.text,
        isOpen: true,
      });
      this.setRevisionConfig();
    }
  }

  setRevisionConfig() {
    this.showRevisionOption =
      this.user.isInvestor && !this.diligence.allowOnlyFollowups;
    const investorFollowups = this.followups.length
      ? this.followups[0].comments.filter(
          (x) => x.firm_id === this.diligence.investorfirm_id
        )
      : [];
    this.revisionOptionValue = this.showRevisionOption
      ? investorFollowups.length
        ? investorFollowups[investorFollowups.length - 1]
            .allow_response_revision
        : true
      : false;

    if (
      this.diligence.completed_at &&
      investorFollowups.length &&
      investorFollowups[investorFollowups.length - 1].allow_response_revision &&
      investorFollowups[investorFollowups.length - 1].created_at >
        this.diligence.completed_at &&
      (!this.question.answer?.id ||
        !this.question.answer.attributes.is_submitted)
    ) {
      this.responseRevisionInProgress = true;
      this.followups[0].comments.map((comment) => {
        comment.iconList.find((x) => x.name === 'trashcan').disabled = true;
        comment.iconList.find((x) => x.name === 'trashcan').tooltip = this.user
          .isManager
          ? `You can't delete this follow-up until the response is submitted to the investor`
          : `You can't delete this follow-up as the responder is revising the response`;

        if (this.user.isManager) {
          comment.iconList.find((x) => x.name === 'resolve').disabled = true;
          comment.iconList.find(
            (x) => x.name === 'resolve'
          ).tooltip = `You can't resolve this follow-up until the response is submitted to the investor`;
        }
      });
    }

    if (this.user.isManager && this.diligence.completed_at) {
      // if investor has allowed response revision
      this.showRevisionHelpText =
        this.question.answer?.id &&
        !this.question.answer.attributes.is_submitted &&
        investorFollowups.length &&
        investorFollowups[investorFollowups.length - 1].allow_response_revision;

      // for post-completion statuses, If either the manager or investor added the follow-up, and if "allow response revision" is disabled, we will display this help text.
      this.showRevisionNotAllowedHelpText = investorFollowups.length
        ? !investorFollowups[investorFollowups.length - 1]
            .allow_response_revision
        : !!this.followups.length;
    }

    this.showInvestorSumissionHelpText =
      this.diligence.completed_at &&
      this.question.answer?.id &&
      this.question.answer.attributes.is_submitted_by_investor;
  }

  bulkResolveFollowups() {
    this.SweetAlert.confirm({
      title:
        this.responseRevisionInProgress && this.user.isInvestor
          ? 'Resolving and closing follow-ups will cancel any pending response revisions that the responder may be planning to submit.'
          : `Are you sure you want to resolve all the messages?`,
      confirmButtonText: 'Yes, Resolve!',
      showLoaderOnConfirm: true,
      focusCancel: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          if (this.responseRevisionInProgress && this.user.isInvestor) {
            // if response revision is in progress and investor still wants to resolve and close the followups.
            let obs: Observable<any>;
            if (this.question.answer?.id) {
              // call submit revision API to cancel all pending revisions. that API will also close the followups
              obs = this.questionnaire.submitResponseRevision(
                this.question.answer.id,
                this.diligence.id
              );
            } else {
              const payload = {
                question_id: this.question.id,
                diligence_id: this.diligence.id,
                sequence_id: this.question.sequenceID,
                ignore_response_submission_pending_check:
                  this.responseRevisionInProgress && this.user.isInvestor,
                // if investor is bulk resolving followups for a question where revision is requested but there is still no response, there is nothing to submit so above IF block won't get called but we have to allow resolving followups so ignore the submission check
              };
              obs = this.questionnaire.bulkResolveFollowups(payload);
            }
            obs.pipe(finalize(() => resolve())).subscribe(() => {
              this.toaster.success('All messages are resolved');
              this.onBulkResolve(this.question);
              this.store.dispatch(new GetQuestionCount()).subscribe(() => {
                this.store.dispatch(new GetDiligenceData());
              });
              this.store.dispatch(new TriggerSilentReload(Math.random()));
            });
          } else {
            const payload = {
              question_id: this.question.id,
              diligence_id: this.diligence.id,
              sequence_id: this.question.sequenceID,
            };
            this.questionnaire
              .bulkResolveFollowups(payload)
              .pipe(finalize(() => resolve()))
              .subscribe((res) => {
                this.toaster.success('All messages are resolved');
                this.onBulkResolve(this.question);
                this.store.dispatch(new GetQuestionCount());
                this.panel.close();
                this.store.dispatch(new UpdateActivePanelId(''));
              });
          }
        });
      },
    });
  }

  showUnsavedAlert() {
    this.SweetAlert.confirm({
      title: `Are you sure to close the follow-up panel?`,
      text: `Saved follow-ups will be lost, you can not undo the action after closing the panel.`,
      confirmButtonText: 'Yes, close',
      showLoaderOnConfirm: true,
      focusCancel: true,
      preConfirm: async () => {
        this.handleOnCancel();
      },
    });
  }

  handleOnCancel() {
    this.panel.close();
  }

  handleOnSave(createdRecommendation) {
    this.isAdding = false;
    this.showBackIcon = false;
    this.onRecommendationAdded(this.idToAddRecommendation);
    this.getFollowUpList();
    this.handleOnBackClick();
  }
  handleOnUpdate(param) {
    this.isAdding = false;
    this.showBackIcon = false;
    this.getFollowUpList();
  }
  handleOnBackClick() {
    this.handleOnListClick();
  }
  handleOnAddClick(followUp, questionId) {
    this.recommendationSubject = this.Utils.extractTextFromHTML(
      followUp?.commentText
    );
    this.editingRecommendation = null;
    this.idToAddRecommendation = questionId;
    this.handleAddClick();
  }
  handleAddClick() {
    this.isAdding = true;
    this.showBackIcon = false;
    this.showDescription = false;
    this.panelTitle =
      'Add ' + this.firm_preferences?.issue_tracker_default_name;
  }
  handleOnListClick() {
    this.isList = true;
    this.panelTitle = 'Follow-up';
    this.isAdding = false;
    this.showBackIcon = false;
    this.showDescription = false;
  }
  handleMoreInfoClick(event, followup) {}
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
