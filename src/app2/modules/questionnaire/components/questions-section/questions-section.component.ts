import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  SimpleChanges,
  Output,
  EventEmitter,
} from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { interval, Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { UserState } from 'src/app2/store/user/user.state';
import {
  diligenceStatusConstant,
  trackChangeStatusConstant,
} from '../../constants/quick-view-headers.constant';
import { sectionCardIcons } from '../../constants/section-icons.constant';
import { DvDraftService } from '../../service/draft.service';
import { SectionService } from '../../service/section.service';
import { QuestionnaireStatusService } from '../../service/status.service';
import {
  GetQuestionCount,
  GetTrackChanges,
  HandleReviewStatus,
  UpdateActivePanelId,
  UpdateSubCatData,
  getReviewAssignments,
} from '../../store/questionnaire.action';
import { StateDiligenceUpdateType } from '../../store/questionnaire.modal';
import { QuestionState } from '../../store/questionnaire.state';
import { IconTypes } from '../../types/card-icons.type';
import { DiligenceTypeEnum } from '../../types/diligence-enum.type';
import {
  dvThresholds,
  responseStatus,
} from 'src/app2/shared/constants/constant';
import { ColorTheme } from 'src/app2/shared/themes/color.themes';
import { ReviewService } from '../../service/review.service';
import { RouterService } from 'src/app2/services/router.service';

@Component({
  selector: 'questions-section',
  templateUrl: './questions-section.component.html',
  styleUrls: ['./questions-section.component.css'],
})
export class QuestionsSectionComponent implements OnInit, OnDestroy {
  @Input() diligence: DiligenceType & StateDiligenceUpdateType;
  @Input() user;
  @Input() filterStatus;
  @Input() searchQuery;
  @Input() activeSection;
  @Input() teamMembersMap;
  @Input() userRolesMap = {};
  @Output() onSMEUpdate = new EventEmitter();
  dueDiligenceType = 1105; // dueDiligence type
  localActiveSection;
  ratingID;
  headerIcons: IconTypes[] = [];
  customField = [];
  scalerColor = [];
  ratingList = [];
  subCatTitle;
  subCatData;
  assignedUser = { users: [], functions: [], assignedFunctions: [] };
  time = dvThresholds.REVIEW_UNDO;
  subscription;
  undo = {
    show: false,
    color: 'green',
    name: 'Revision',
    icon: null,
    iconName: null,
  };
  diligenceStatusConstant = diligenceStatusConstant;
  DiligenceTypeEnum = DiligenceTypeEnum;
  ratingCheck: boolean;
  @Select(QuestionState.getColorData) colorData;
  @Select(UserState.getFirmPreferenceData) firmPref;
  @Select(QuestionState.getCutomMapRating) customMapRating;
  @Select(QuestionState.getActiveSection) subcategoryData;
  @Select(QuestionState.getResponseHistory) trackChanges;
  @Select(QuestionState.getReviewStatus) handleReviewStatus;
  @Select(QuestionState.getCatData) catDataChange;
  @Select(QuestionState.getAssignments) assignReviewData;
  customRatingMap;
  colors = [];
  customFieldDatamap = {};
  responseHistory;
  showTrackChangeButton = false;
  firmPreferences = null;
  assignments;
  questions;
  showForInvestor: boolean;
  private ngUnsubscribe = new Subject<void>();

  constructor(
    private store: Store,
    private panelService: SidePanelService,
    private status: QuestionnaireStatusService,
    private draftService: DvDraftService,
    private readonly SweetAlert: SweetAlertService,
    private sectionService: SectionService,
    private util: UtilsService,
    private reviewService: ReviewService,
    private router: RouterService
  ) {}
  ngOnInit() {
    this.firmPref
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((firmPreferences) => (this.firmPreferences = firmPreferences));
    this.colorData.pipe(takeUntil(this.ngUnsubscribe)).subscribe((data) => {
      if (data) {
        this.colors = data;
        this.addHeaderIcons();
      }
    });

    this.subcategoryData
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((data) => {
        this.addHeaderIcons();
      });

    this.catDataChange.pipe(takeUntil(this.ngUnsubscribe)).subscribe((data) => {
      this.addHeaderIcons();
    });

    this.trackChanges.pipe(takeUntil(this.ngUnsubscribe)).subscribe((res) => {
      this.responseHistory = JSON.parse(JSON.stringify(res));
    });

    this.status.trackChanges$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((showTrackChange) => {
        this.showTrackChangeButton = !!showTrackChange;
      });

    this.customMapRating
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((map) => {
        if (map && this.subCatData) {
          this.customRatingMap = map;
          this.addHeaderIcons();
        }
      });

    this.assignReviewData
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((assignments) => {
        if (assignments) {
          this.assignments = Object.values(assignments);
          this.addHeaderIcons();
        }
      });

    this.status.questions$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((questions) => {
        if (questions) {
          this.questions = questions;
          this.addHeaderIcons();
        }
      });

    this.reviewService.reviewUpdate$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.addHeaderIcons();
      });

    this.checkForSidePanel();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.activeSection &&
      (changes.activeSection.currentValue?.id !==
        changes.activeSection.previousValue?.id ||
        changes.activeSection.currentValue?.data.status !==
          changes.activeSection.previousValue?.data.status ||
        changes.activeSection.currentValue?.data.verifier !==
          changes.activeSection.previousValue?.data.verifier)
    ) {
      if (changes?.activeSection?.currentValue)
        this.localActiveSection = JSON.parse(
          JSON.stringify(changes?.activeSection?.currentValue)
        );
      this.sectionService.updateData(
        this.diligence,
        this.user,
        this.localActiveSection.data
      );
      this.undo.show = false;
      this.addHeaderIcons();
    }
    if (
      changes.diligence &&
      changes.diligence.currentValue !== changes.diligence.previousValue
    ) {
      this.undo.show = false;
      this.addHeaderIcons();
    }
  }
  addHeaderIcons() {
    if (this.undo && Object.keys(this.undo).length && this.undo.show) return;
    this.headerIcons = [];
    if (this.diligence.status == diligenceStatusConstant.Scheduled) return;
    let localCategories = this.store.selectSnapshot(
      (state) => state.questionnaire.categories
    );
    if (!localCategories) return;
    if (this.user.isInvestor && this.diligence.allowOnlyFollowups) {
      // for Started and other pre-completion status, investor can't see any section level icons if they are accessing the questionnaire
      return;
    }
    let selectedRatingScheme = this.store.selectSnapshot(
      (state) => state.questionnaire.selectedRatingScheme
    );
    this.ratingCheck =
      this.user.isInvestor &&
      !this.user.isFreeInvestor &&
      (this.diligence.isReadonlyNotEditable ||
        this.diligence.status == diligenceStatusConstant.Completed ||
        this.diligence.isLocked ||
        this.diligence.diligence_type === 'dd_review');
    if (
      !(this.localActiveSection.data.parentID in localCategories) ||
      !(
        this.localActiveSection.id in
        localCategories[this.localActiveSection.data.parentID]?.list
      )
    )
      return;
    this.subCatData = JSON.parse(
      JSON.stringify(
        localCategories[this.localActiveSection.data.parentID].list[
          this.localActiveSection.id
        ]
      )
    );
    this.subCatTitle = this.subCatData.label;
    this.localActiveSection = {
      id: this.subCatData.id,
      label: this.subCatData.label,
      data: this.subCatData,
    };
    this.sectionService.updateData(
      this.diligence,
      this.user,
      this.localActiveSection.data
    );
    this.status.updateData(this.diligence, this.user, this.firmPreferences);
    this.subCatData.selectedUser = [];
    this.status.updateQuestionsAssignment(
      this.subCatData,
      this.teamMembersMap,
      this.userRolesMap
    );
    let isEditable = !this.diligence.isReadOnly && !this.diligence.isLocked;
    if (!isEditable) {
      this.localActiveSection.data.isMultiple = false;
    }
    if (
      isEditable &&
      (this.diligence.status !== diligenceStatusConstant.InReview ||
        this.diligence.diligence_type == DiligenceTypeEnum.dd_profile)
    ) {
      this.headerIcons.push(sectionCardIcons('assign', this.subCatData));
    }
    this.headerIcons.push(sectionCardIcons('notes', this.subCatData));
    let showRatingIcon;
    if (this.user.isInvestor && !this.user.isFreeSubscription) {
      if (this.subCatData?.sectionRating && selectedRatingScheme) {
        showRatingIcon = true;
        this.headerIcons = [
          ...this.headerIcons,
          ...this.status.handleIsRatingIcon(
            this.subCatData,
            this.customRatingMap,
            true
          ),
        ];
        this.subCatData.sectionRating.assignments = this.assignments?.find(
          (assign) => {
            if (
              assign.entity_type === 'Rating' &&
              assign.entity_id === this.subCatData.sectionRating.rating_id
            )
              return assign;
          }
        );
      }
    }

    let verifier = this.questions?.find((question) => {
      if (question?.icons?.rightIcons?.find((x) => x.key === 'approve'))
        return 1;
    });

    if (!verifier)
      verifier = this.questions?.find((questionParent) => {
        return questionParent.nestedQuestions?.find((question) => {
          if (
            question.nestedID.icons.rightIcons.find((x) => x.key === 'approve')
          )
            return 1;
        });
      });
    let notAllAssigned = this.questions?.find(
      (question) => !question.answer.attributes.assignments
    );

    if (
      this.diligence.isReadonlyEditable ||
      this.diligence.isReadonlyNotEditable
    ) {
      this.headerIcons.push({
        ...sectionCardIcons('userCheck', this.subCatData, this.util),
        color: notAllAssigned ? ColorTheme.default : ColorTheme.primary,
      });
    }

    if (
      verifier &&
      (this.diligence.isReadonlyEditable ||
        this.diligence.isReadonlyNotEditable)
    ) {
      this.headerIcons.push(sectionCardIcons('approve', this.subCatData));
      if (this.diligence.isReadonlyEditable) {
        this.headerIcons.push({
          ...sectionCardIcons('SendBackToAuthor', this.subCatData),
        });
      }
      if (this.diligence.isReadonlyNotEditable)
        this.headerIcons.push({
          ...sectionCardIcons('remove', this.subCatData),
        });
    }
    if (showRatingIcon && this.ratingCheck) {
      const excludeRatingIcon = sectionCardIcons('ban', this.subCatData);
      // disable exclude rating icon/menu if variable is set for it
      const disableNaRatingIcon = this.headerIcons.find(
        (x) => x.key === 'rating'
      )?.disableNaRatingIcon;
      if (disableNaRatingIcon) {
        excludeRatingIcon.disabled = excludeRatingIcon.readonly = true;
      }
      this.headerIcons.push(excludeRatingIcon);
    }
  }

  handleIconClick(icon: IconTypes) {
    switch (icon.key) {
      case 'notes':
        this.subCatData?.note_count;
        this.store.dispatch(
          new UpdateActivePanelId(`question-notes-${this.subCatData.id}`)
        );
        this.panelService.invoke('internal-notes', {
          question: this.subCatData,
          type: 'Section',
          readOnly:
            this.diligence.status === diligenceStatusConstant.Approved ||
            this.diligence.status === diligenceStatusConstant.NotApproved ||
            this.diligence.status === diligenceStatusConstant.Deleted ||
            this.diligence.status === diligenceStatusConstant.Retired ||
            this.diligence.status === diligenceStatusConstant.Withdrawn ||
            this.diligence.isLocked,
          entity_id: this.diligence.id,
          child_entity_id: this.subCatData.id,
          child_entity_type: 'Section',
          onSuccess: (res: 'add' | 'delete') => {
            let sample = { ...this.subCatData };
            if (res === 'add') sample.note_count += 1;
            else sample.note_count -= 1;

            this.store.dispatch(
              new UpdateSubCatData(
                {
                  data: sample,
                  id: sample.id,
                  label: sample.label,
                },
                sample
              )
            );
            this.addHeaderIcons();
          },
        });
        return;
      case 'approve':
        if (this.subCatData.reviewLoading) return;
        let areTrackChangeThere = this.store
          .selectSnapshot((store) => store.questionnaire.questionCounts)
          .find((x) => x.id === 'WithTrackChangesCount').value;

        if (areTrackChangeThere) {
          this.status.showTrackingWarning();
          return;
        }
        let rejecteCount = this.sectionService.getResponsesWithDeclinedStatus();
        if (rejecteCount) {
          this.SweetAlert.confirm({
            title:
              'Are you sure you want to approve all the responses in this sub-category?',
            text: `All the responses will be approved excluding the ${rejecteCount} rejected ${
              rejecteCount > 0 ? 'ones' : 'one'
            }`,
            focusCancel: true,
            preConfirm: () => {
              if (
                this.showTrackChangeButton ||
                this.sectionService.checkForTrackChanges()
              )
                this.sectionService.showAlertforTrackChanges();
              else {
                this.subCatData.reviewLoading = true;
                this.sectionService.handleStatusUpdate(
                  this.subCatData,
                  responseStatus.REVIEWSUCCESS,
                  this.questions,
                  () => {
                    this.subCatData.reviewLoading = false;
                    this.handleUndoTimer(icon);
                    this.headerIcons = [
                      sectionCardIcons('notes', this.subCatData),
                    ];
                    this.undo = {
                      show: true,
                      color: 'green',
                      name: 'Reviewed',
                      icon,
                      iconName: 'correction',
                    };

                    this.store.dispatch(new HandleReviewStatus('approve'));
                  }
                );
              }
            },
          });
        } else {
          if (
            this.showTrackChangeButton ||
            this.sectionService.checkForTrackChanges()
          )
            this.sectionService.showAlertforTrackChanges();
          else {
            this.subCatData.reviewLoading = true;
            this.sectionService.handleStatusUpdate(
              this.subCatData,
              responseStatus.REVIEWSUCCESS,
              this.questions,
              () => {
                this.subCatData.reviewLoading = false;
                this.handleUndoTimer(icon);
                this.headerIcons = [sectionCardIcons('notes', this.subCatData)];
                this.undo = {
                  show: true,
                  color: 'green',
                  name: 'Reviewed',
                  icon,
                  iconName: 'correction',
                };
                this.store.dispatch(new HandleReviewStatus('approve'));
              }
            );
          }
        }

        return;
      case 'remove':
        this.sectionService.showRejectDialogue((reason) => {
          this.sectionService.handleStatusUpdate(
            this.subCatData,
            responseStatus.REVIEWFAILED,
            this.questions,
            () => {
              this.handleUndoTimer(icon);
              this.headerIcons = [sectionCardIcons('notes', this.subCatData)];
              this.undo = {
                show: true,
                color: 'red',
                name: 'Response Rejected',
                icon,
                iconName: 'revision',
              };

              this.store.dispatch(new HandleReviewStatus('reject'));
            },
            reason
          );
        }, true);
        return;
      case 'SendBackToAuthor':
        if (this.draftService.getDraftCount()) {
          this.sectionService.showUnSavedResponseAlert('review failed');
          return;
        } else if (
          this.showTrackChangeButton ||
          this.sectionService.checkForTrackChanges()
        ) {
          this.sectionService.showAlertforTrackChanges();
          return;
        }

        this.sectionService.showRejectDialogue((reason) => {
          this.subCatData.reviewLoading = true;
          this.sectionService.handleStatusUpdate(
            this.subCatData,
            responseStatus.REVIEWFAILED,
            this.questions,
            () => {
              this.subCatData.reviewLoading = false;
              this.handleUndoTimer(icon);
              this.headerIcons = [sectionCardIcons('notes', this.subCatData)];
              this.undo = {
                show: true,
                color: 'red',
                name: 'Revision Requested',
                icon,
                iconName: 'revision',
              };

              this.store.dispatch(new HandleReviewStatus('reject'));
            },
            reason
          );
        });

        return;
      case 'userCheck':
        this.sectionService.handleAssignReviewers(this.subCatData, () => {});
        return;
      case 'ban':
        this.subCatData.sectionRating.is_na =
          !this.subCatData.sectionRating.is_na;
        const ratingIcon = this.headerIcons.find((x) => x.key === 'rating');
        this.handleOnRatingClick(null, ratingIcon, 'change');
        return;
    }
  }

  handleOnRatingClick(value, icon, type: 'change' | 'click') {
    if (type == 'change') icon.ratingChange = value;
    let temp = { ...this.subCatData };
    temp['questionRating'] = temp.sectionRating;
    this.status.updateRatingIcon(
      icon,
      temp,
      ({ question, param }) => {
        this.store.dispatch(
          new UpdateSubCatData(
            {
              data: question,
              id: question.id,
              label: question.label,
            },
            question
          )
        );
        this.addHeaderIcons();
      },
      true
    );
  }

  handleSubscriber(member, icon) {
    this.status.handleAssignTeamMember(
      member,
      this.localActiveSection.id,
      'section',
      this.subCatData,
      () => {
        this.onSMEUpdate.emit({
          user: member,
          removed: member.member.is_removed,
        });
        this.getQuestionCount();
        this.addHeaderIcons();
      }
    );
  }

  getQuestionCount() {
    this.store.dispatch(new GetQuestionCount());
  }

  async undoVerification(icon, type: 'undo' | 'complete') {
    this.subscription?.unsubscribe();
    if (type !== 'complete') {
      this.sectionService.handleStatusUpdate(
        this.subCatData,
        responseStatus.INREVIEW,
        this.questions,
        () => {
          this.store.dispatch(new HandleReviewStatus('undo'));
          this.undo.show = false;
          this.time = dvThresholds.REVIEW_UNDO;
          this.addHeaderIcons();
        }
      );
    } else {
      this.store.dispatch(
        new getReviewAssignments(this.diligence.id, this.activeSection.id)
      );
      if (this.diligence.status === diligenceStatusConstant.InReview)
        await this.store.dispatch(new GetTrackChanges()).toPromise();

      this.undo.show = false;
      this.time = dvThresholds.REVIEW_UNDO;
      this.addHeaderIcons();
    }
  }

  handleUndoTimer(icon) {
    this.subscription = interval(1000).subscribe(() => {
      this.time--;
      if (this.time == 0) {
        this.undoVerification(icon, 'complete');
      }
    });
  }

  showTrackChangesConfirmation(action: 'reject' | 'accept') {
    this.SweetAlert.confirm({
      title: `Are you sure you want to ${action} all changes in this section?`,
      text: `Paragraph responses track changes wont be affected.`,
      focusCancel: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.acceptRejectChanges(action, resolve);
          this.showTrackChangeButton = false;
        });
      },
    }).then(({ isConfirmed }) => {
      if (isConfirmed) {
        this.showTrackChangeButton = false;
      }
      this.SweetAlert.close();
    });
  }

  acceptRejectChanges(action, resolve) {
    let title = `Are you sure you want to ${action}? all your unsaved changes will be lost`;
    this.draftService.showCountAlert(
      () => {
        this.status.handleBulkAllTrackChange(
          action === 'accept'
            ? trackChangeStatusConstant.Accepted
            : trackChangeStatusConstant.Rejected,
          this.responseHistory,
          this.activeSection,
          () => {
            resolve();
          }
        );
      },
      () => {
        this.status.handleBulkAllTrackChange(
          action === 'accept'
            ? trackChangeStatusConstant.Accepted
            : trackChangeStatusConstant.Rejected,
          this.responseHistory,
          this.activeSection,
          () => {
            resolve();
          }
        );
      },
      title,
      undefined,
      `Save & ${action}`,
      `Don't save & ${action}`
    );
  }

  checkForSidePanel() {
    const router = this.router.getState().params;
    let sidePanel = router.panel;

    if (sidePanel && !router.questionId) {
      let icon: any = { key: sidePanel };

      this.handleIconClick(icon); // Manually creating a click icon event to render the sidepanel
    }
  }
}
