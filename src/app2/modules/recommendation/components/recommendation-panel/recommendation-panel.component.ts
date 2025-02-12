import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { combineLatest, forkJoin, ReplaySubject } from 'rxjs';
import * as moment from 'moment';
import { UtilsService } from 'src/app2/services/utils.service';
import { ErrorStatusCode, IssueType } from 'src/app2/shared/constants/constant';
import { UserState } from 'src/app2/store/user/user.state';
import { RecommendationTrackerService } from 'src/app2/apis/recommendationTracker.service';
import { take, takeUntil, tap } from 'rxjs/operators';
import { RecommendationState } from '../../store/recommendation.state';
import {
  getIssuePriorities,
  getIssueStatuses,
  getIssueTags,
} from '../../store/recommendation.action';

@Component({
  selector: 'recommendation-panel',
  templateUrl: './recommendation-panel.component.html',
  styleUrls: ['./recommendation-panel.component.css'],
})
export class RecommendationPanelComponent implements OnInit, OnDestroy {
  // Note: Only these two properties of the question are being passed from QuestionnaireFormControlController angularjs
  // If any additional properties need to be referenced, please update in angularjs as well.
  @Input() question: { id: number; text: string };
  @Input() recommendation: any;
  @Input() editingRecommendation: any;
  @Input() entity_type: any;
  @Input() entity_id: any;
  // Applicable only for question and project level recommendation
  @Input() diligence;
  @Input() onStatusUpdate: any;
  @Input() onUpdate: any;
  @Input() reloadGrid: any;
  @Input() onUpdateIssue: any; //used in grid
  @Input() onDeleteIssue: any; //used in grid
  @Input() onCommentUpdate: any; //used in grid
  @Input() onSuccess;
  @Input() showCloseIcon = true;
  @Input() isAngularJs = false;
  loading: boolean;
  showDescription: boolean = false;
  isAdding: boolean = false;
  isList: boolean = true;
  showBackIcon: boolean = false;
  recommendations: any[];
  toggleDropdown: any;
  subject: any;
  description: any;
  issue: any;
  panelTitle: any;
  statusColors: any = {};
  priorityColors: any[] = [];
  statuses: any[] = [];
  priorities: any[] = [];
  invokedFromGrid: boolean = false;
  statusUpdating: any;
  @Select(UserState.getFirmPreferenceData) firmPref;
  @Select(UserState.getCurrentUserData) currentUser;
  isFreeSubscription: boolean = null;
  isUserLoading: boolean = true;
  firm_preferences: any;
  currentFirmId;
  editableStatus: boolean = false;
  currentUserData: any;
  allowAdding: boolean = true;
  destroyed$: ReplaySubject<boolean> = new ReplaySubject(1);
  isApiInitDone: boolean = false;
  constructor(
    private panel: SidePanelService,
    private store: Store,
    private readonly SweetAlert: SweetAlertService,
    private readonly Utils: UtilsService,
    private readonly toaster: ToastrService,
    private readonly recommendationTrackerService: RecommendationTrackerService
  ) {}

  ngOnInit(): void {
    if (this.diligence) {
      this.allowAdding = ![
        'approved',
        'notapproved',
        'withdrawn',
        'deleted',
        'invited',
        'sent',
      ].includes(this.diligence.status.toLowerCase());
    }
    this.invokedFromGrid = !!this.recommendation;
    this.firmPref.pipe(take(2)).subscribe((pref) => {
      if (pref) {
        this.firm_preferences = JSON.parse(JSON.stringify(pref));
        this.panelTitle = this.firm_preferences.issue_tracker_default_name;
      }
    });

    if (this.question || this.recommendation) {
      this.loading = true;
      this.isApiInitDone = true;
      forkJoin([
        this.store.dispatch(new getIssueStatuses()),
        this.store.dispatch(new getIssuePriorities()),
        this.store.dispatch(new getIssueTags()),
      ]).subscribe((state: any) => {
        const { recommendationStatuses, recommendationPriorities } =
          this.store.selectSnapshot((state) => state.recommendation);
        this.statuses = this.parseStatusResponse(
          JSON.parse(JSON.stringify(recommendationStatuses))
        );
        this.priorities = this.parsePriorityResponse(
          JSON.parse(JSON.stringify(recommendationPriorities))
        );
        this.initRecommendations();
      });
    }

    this.currentUser.pipe(take(2)).subscribe((data) => {
      if (data) {
        this.isFreeSubscription = data.isFreeSubscription;
        this.currentFirmId = data.firmInfo?.id;
        this.currentUserData = data;
        // handling race condition between currentUser data and fetching recommendations
        // we need to open the add recommendation view if premium user and no recommendations added yet
        if (
          !this.isFreeSubscription &&
          this.recommendations &&
          this.recommendations.length === 0 &&
          !this.recommendation
        ) {
          this.editingRecommendation = null;
          this.handleOnAddClick();
        }

        if (this.recommendations?.length) {
          this.initializeRecommendationProperties();
        }
      }
    });
  }

  parseStatusResponse(statuses) {
    return statuses.map((status) => {
      status = {
        ...status,
        key: status.name,
        label: status.name,
      };
      this.statusColors[status.system_status_id] = status;
      return status;
    });
  }

  parsePriorityResponse(priorities) {
    return priorities.map((priority) => {
      priority = {
        ...priority,
        key: priority.system_issue_priority_id,
        label: priority.name,
      };
      this.priorityColors[priority.system_issue_priority_id] = priority;
      return priority;
    });
  }

  initRecommendations() {
    if (this.recommendation) {
      this.invokedFromGrid = true;
      this.recommendation.is_external =
        this.recommendation.is_external == 'External';
      this.recommendations = [this.recommendation];
      this.initializeRecommendationProperties();
      this.loading = false;
    } else {
      this.entity_id = this.question.id;
      this.entity_type = IssueType.Question;
      this.getRecommendations();
    }
  }

  getRecommendations() {
    this.loading = true;
    this.recommendationTrackerService
      .getIssueWithId({
        diligence_id: this.diligence.id,
        entity_id: this.question.id,
        entity_type: IssueType.Question,
      })
      .subscribe(
        (res: any) => {
          this.recommendations = res.data;
          this.processRecommendations();
          this.loading = false;
        },
        (err) => (this.loading = false)
      );
  }

  processRecommendations() {
    if (this.recommendations.length > 0) {
      this.initializeRecommendationProperties();
      this.invokedFromGrid = !!this.recommendation;
      if (!this.invokedFromGrid) {
        this.handleOnListClick();
      }
    } else if (this.isFreeSubscription === false && this.allowAdding) {
      // handling race condition between currentUser data and fetching recommendations
      // we need to open the add recommendation view if premium user and no recommendations added yet
      this.editingRecommendation = null;
      this.handleOnAddClick();
    }
  }

  initializeRecommendationProperties() {
    this.recommendations.map((recommendation) => {
      if (this.recommendations.length == 1) {
        recommendation.isOpen = true;
      } else {
        recommendation.isOpen = false;
      }
      if (this.currentUserData) {
        recommendation.isEditAllowed =
          this.currentUserData.isAdmin ||
          this.currentUserData.id === recommendation.reported_by_id ||
          this.currentUserData.id === recommendation.assigned_to_id;
        recommendation.isDeletionAllowed =
          recommendation.fromfirm_id === this.currentFirmId &&
          (this.currentUserData.isAdmin ||
            this.currentUserData.id === recommendation.reported_by_id);
      }
    });
  }

  handleOnCommentSuccess({ type, count }) {
    if (type === 'add') {
      this.issue.comment_count += count;
    } else if (type == 'delete') {
      this.issue.comment_count -= count;
    }
    this.panelTitle = `Comments/Reminders (${this.issue?.comment_count ?? 0})`;
    if (this.invokedFromGrid) {
      this.onCommentUpdate({ type: type, count: count });
    }
  }
  getColor(color) {
    const hspToCompareColor = 200;
    return this.Utils.isColorLightOrDark(color, hspToCompareColor) == 'dark'
      ? 'white'
      : 'black';
  }

  handleOnCancel(isTouched) {
    this.invokedFromGrid = !!this.recommendation;
    if (this.showDescription || this.isAngularJs) {
      this.handleOnListClick();
    } else {
      this.panel.close();
    }
  }
  handleOnSave(createdRecommendation) {
    this.isAdding = false;
    this.showBackIcon = false;
    if (!this.invokedFromGrid) {
      this.recommendations.push(createdRecommendation[0]);
      this.processRecommendations();
      this.onSuccess('add');
    }
  }
  handleOnUpdate(udpatedRecommendation) {
    this.isAdding = false;
    this.showBackIcon = false;
    this.invokedFromGrid = !!this.recommendation;
    if (this.invokedFromGrid) {
      this.recommendation = udpatedRecommendation[0];
      this.onUpdateIssue(udpatedRecommendation);
      this.panel.close();
      this.initRecommendations();
    } else {
      let udpatedIndex = this.recommendations.findIndex(
        (recommendation) => recommendation.id == udpatedRecommendation[0].id
      );
      if (udpatedIndex != -1) {
        this.recommendations[udpatedIndex] = { ...udpatedRecommendation[0] };
        this.processRecommendations();
      }
    }
  }
  handleOnBackClick() {
    this.invokedFromGrid = !!this.recommendation;
    this.handleOnListClick();
  }
  handleAddClick() {
    this.editingRecommendation = null;
    this.handleOnAddClick();
  }
  handleOnAddClick() {
    this.isAdding = true;
    this.showBackIcon = false;
    this.panelTitle = !!this.editingRecommendation
      ? 'Editing ' + this.firm_preferences?.issue_tracker_default_name
      : 'Add ' + this.firm_preferences?.issue_tracker_default_name;
  }
  handleOnListClick() {
    this.invokedFromGrid = !!this.recommendation;
    this.isList = true;
    this.panelTitle = this.firm_preferences?.issue_tracker_default_name;
    this.isAdding = false;
    this.showBackIcon = false;
    this.showDescription = false;
  }
  handleDescAndCommentsClick(recommendation) {
    this.isAdding = true;
    this.showDescription = true;
    this.isList = false;
    this.showBackIcon = true;
    this.issue = recommendation;
    this.panelTitle = `Comments/Reminders (${this.issue?.comment_count ?? 0})`;
  }
  handleStatus(i) {
    this.toggleDropdown = i;
  }
  statusDropdownChange(status, recommendation, index) {
    if (
      (this.currentUserData.isAdmin ||
        recommendation.reported_by_id == this.currentUserData.id ||
        recommendation.assigned_to_id == this.currentUserData.id) &&
      recommendation.fromfirm_id == this.currentFirmId
    ) {
      let tagids = recommendation?.tags?.map((tag) => tag.id) ?? [];
      let param = {
        issue_id: recommendation.id,
        subject: recommendation.subject,
        description: recommendation.description,
        issue_status: status.system_status_id,
        issue_priority: recommendation.priority,
        due_date: recommendation.due_date
          ? moment(recommendation.due_date).format('YYYY-MM-DD HH:mm:ss')
          : null,
        reported_by: recommendation.reported_by_id,
        assigned_to: recommendation.assigned_to_id,
        tags: tagids.toString(),
      };
      this.statusUpdating = index;
      this.recommendationTrackerService.updateIssue(param).subscribe(
        (res) => {
          res[0].reported_by_id = recommendation.reported_by_id;
          res[0].reported_by_name = recommendation.reported_by_name;
          res[0].assigned_to_id = recommendation.assigned_to_id;
          res[0].created_date = res[0].created_date;
          res[0].comment_count = recommendation.comment_count;
          res[0].diligence_id = recommendation.diligence_id;
          res[0].due_date = res[0].due_at;
          res[0].is_internal_diligence = recommendation.is_internal_diligence;
          this.toaster.success('Status updated successfully!');
          if (this.invokedFromGrid) {
            this.onUpdateIssue(res);
          }
          recommendation.status = status.system_status_id;
          this.toggleDropdown = -1;
          this.statusUpdating = null;
        },
        (err) => (this.statusUpdating = null)
      );
    } else {
      this.toggleDropdown = -1;
      this.statusUpdating = null;
      this.toaster.error(
        'You are not authorized to change the status of this ' +
          this.firm_preferences?.issue_tracker_default_name.toLowerCase() +
          '.'
      );
    }
  }
  handleMoreInfoClick(event, recommendation) {
    event.stopPropagation();
    recommendation.isOpen = !recommendation.isOpen;
  }
  handleEditClick(event, recommendation) {
    event.stopPropagation();
    if (this.recommendation) {
      this.invokedFromGrid = false;
    }
    this.editingRecommendation = recommendation;
    this.handleOnAddClick();
  }
  handleDeleteClick(event, recommendation) {
    event.stopPropagation();
    this.SweetAlert.confirm({
      title: `Are you sure you want to delete this ?`,
      confirmButtonText: 'Yes, delete it!',
      showLoaderOnConfirm: true,
      focusCancel: true,
      preConfirm: async () => {
        let params = {
          issue_id: recommendation.id,
        };
        this.loading = true;
        this.recommendationTrackerService.deleteIssue(params).subscribe(
          (deletedRecommendation: any) => {
            if (!this.invokedFromGrid) {
              let deletedIndex = this.recommendations.findIndex(
                (recommendation) =>
                  recommendation.id == deletedRecommendation[0].id
              );
              if (deletedIndex != -1) {
                this.recommendations.splice(deletedIndex, 1);
              }
              this.onSuccess('delete');
            }
            this.SweetAlert.close();
            if (this.invokedFromGrid) {
              this.onDeleteIssue(deletedRecommendation);
              this.panel.close();
            }
            this.toaster.success('Deleted successfully.');
            this.loading = false;
          },
          (err) => {
            if (
              !(
                err &&
                err.status &&
                Object.values(ErrorStatusCode).includes(err.status)
              )
            ) {
              this.toaster.error(
                `Something went wrong while deleting ${this.firm_preferences?.issue_tracker_default_name.toLowerCase()}.`
              );
            }
            this.SweetAlert.close();
            this.panel.close();
            this.loading = false;
          }
        );
      },
    });
  }

  ngOnDestroy(): void {
    this.destroyed$.next(true);
    this.destroyed$.complete();
  }
}
