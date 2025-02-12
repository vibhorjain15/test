import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import { UserState } from 'src/app2/store/user/user.state';
import {
  UpdateActivePanelId,
} from 'src/app2/store/user/user.action';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import { combineLatest, forkJoin } from 'rxjs';
import {
  IssueType,
  dateSortNew,
  defaultColumn,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';
import { ColDef } from 'ag-grid-community';
import { RecommendationTrackerService } from 'src/app2/apis/recommendationTracker.service';
import { take, tap } from 'rxjs/operators';
import { RouterService } from 'src/app2/services/router.service';
import { RecommendationState } from '../../store/recommendation.state';
import {
  getIssuePriorities,
  getIssueStatuses,
  getIssueTags,
} from '../../store/recommendation.action';
import { UtilsService } from 'src/app2/services/utils.service';
import { RecommendationService } from '../../service/recommendation-grid.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';

@Component({
  selector: 'recommendation-grid',
  templateUrl: './recommendation-grid.component.html',
})
export class RecommendationGridComponent implements OnInit, OnChanges {
  @Input() entity_type: any;
  @Input() onlyGrid = false;
  @Input() entity_id: any;
  // Applicable only for project level recommendation grid.
  @Input() diligence;
  @Input() showHeaderUpperCase: boolean;
  @Input() dateRangeFilter;
  @Input() isDashboard;
  @Input() recommendationsData = null; // if we need to pass data directly
  @Input() getRowClass? = (e) => ''; // if we need to pass data directly
  @Input() onNewRowClicked = (e) => {};
  @Output() onUpdate = new EventEmitter();
  recommendations: any[] = [];
  isLoading: boolean;
  issueColumns;
  gridName: string = 'recommendations';
  @Select(UserState.getCurrentUserData) user;
  @Select(UserState.getFirmPreferenceData) firmPref;
  editingRecommendation: unknown;
  statusColors: any;
  statusList: any;
  priorityColors: any;
  priorityList: any;
  tagList: any;
  payload: any;
  firm_preferences: any;
  firmPrefSub: any;
  isFreeSubscription: boolean;
  isUserLoading: boolean = true;
  isManager: boolean;
  isInvestor;
  guid;
  allowAdding: boolean = true;
  fieldName;
  gridApi;
  recommendationRowIndex;
  @Select(RecommendationState.getIssuePrioritiesPref) priority;
  @Select(RecommendationState.getIssueStatusesPref) status;
  @Select(RecommendationState.getIssueTagsPref) tags;
  recommendationId: any;
  openRecommendationPanel: boolean;
  constructor(
    private readonly store: Store,
    private panel: SidePanelService,
    private readonly recommendationTrackerService: RecommendationTrackerService,
    private readonly routerService: RouterService,
    private readonly utils: UtilsService,
    private readonly recommendationService: RecommendationService,
    private readonly sweetAlert: SweetAlertService,
    private readonly dvDatePipe: DvDatePipe
  ) {
    this.guid = Math.round(Math.random() * 1000);
    this.recommendationId =
      this.routerService.getState().params.recommendationId;
  }
  ngOnInit(): void {
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.isUserLoading = false;
          this.isFreeSubscription = data.isFreeSubscription;
          this.isManager = data.isManager;
          this.isInvestor = data.isInvestor;
          this.firm_preferences = this.store.selectSnapshot(
            (state) => state.user.firmPreference
          );
          this.setGridData();
        }
      });

    if (this.isDashboard) {
      this.gridName = 'my-work-' + this.gridName;
    }

    this.issueColumns = this.getRecommendationGridColumn();
    this.store.dispatch(
      new SetDefaultColumnDef({ [this.gridName]: this.issueColumns })
    );
  }
  setGridData() {
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
    this.payload = {
      entity_id: this.entity_id,
      entity_type: this.entity_type,
    };
    this.isLoading = true;
    if (this.dateRangeFilter) {
      if (this.dateRangeFilter?.selectedRange == 'No Filter') {
        this.payload.start_date = null;
        this.payload.end_date = null;
      } else {
        const start_date = this.utils.formatDatetime(
          this.dateRangeFilter.startDate
        );
        const end_date = this.utils.formatDatetime(
          this.dateRangeFilter.endDate
        );
        if (start_date && end_date) {
          this.payload.start_date = start_date;
          this.payload.end_date = end_date;
        } else {
          this.payload.start_date = null;
          this.payload.end_date = null;
        }
      }
    }

    const {
      recommendationStatuses,
      recommendationPriorities,
      recommendationTags,
    } = this.store.selectSnapshot((state) => state.recommendation);
    this.statusList = recommendationStatuses;
    this.priorityList = recommendationPriorities;
    this.tagList = recommendationTags;

    if (!this.recommendationsData) {
      forkJoin([
        this.recommendationTrackerService.getIssueWithId(this.payload),
      ]).subscribe(([recommendationsData]: any) => {
        this.recommendations = JSON.parse(
          JSON.stringify(recommendationsData.data)
        );
        this.processRecommendations();
        this.isLoading = false;
      });
    } else {
      this.recommendations = this.recommendationsData || [];
      this.processRecommendations();
      this.isLoading = false;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.recommendationsData &&
      changes.recommendationsData.currentValue !==
        changes.recommendationsData.previousValue
    ) {
      this.recommendations = changes.recommendationsData.currentValue;
      if (this.recommendations) this.processRecommendations();
    }
    if (
      changes.dateRangeFilter &&
      !changes.dateRangeFilter.firstChange &&
      changes.dateRangeFilter.currentValue !==
        changes.dateRangeFilter.previousValue
    ) {
      if (this.dateRangeFilter?.selectedRange == 'No Filter') {
        this.payload.start_date = null;
        this.payload.end_date = null;
      } else if (this.dateRangeFilter) {
        const start_date = this.utils.formatDatetime(
          this.dateRangeFilter.startDate
        );
        const end_date = this.utils.formatDatetime(
          this.dateRangeFilter.endDate
        );
        if (start_date && end_date) {
          this.payload.start_date = start_date;
          this.payload.end_date = end_date;
        } else {
          this.payload.start_date = null;
          this.payload.end_date = null;
        }
      }
      if (!this.recommendationsData)
        this.recommendationTrackerService
          .getIssueWithId(this.payload)
          .subscribe((response: any) => {
            this.recommendations = response.data;
            this.processRecommendations();
            this.isLoading = false;
          });
    }
  }

  processRecommendations() {
    this.recommendations?.sort((a, b) => {
      return b.id - a.id;
    });
    this.recommendations = this.recommendations.map((recommendation: any) =>
      this.processRecommendation(recommendation)
    );
    this.checkForSidePanelInit();
  }

  processRecommendation(recommendation) {
    let localpriority = this.priorityList?.find(
      (priority) =>
        recommendation.priority == priority?.system_issue_priority_id
    );
    recommendation.priorityColor = localpriority?.color_code;
    recommendation.priorityName = localpriority?.name;
    let localStatus = this.statusList?.find(
      (status) => recommendation.status == status?.system_status_id
    );
    recommendation.statusColor = localStatus?.color_code;
    recommendation.statusName = localStatus?.name;
    recommendation.is_external_label =
      recommendation.is_external == 0 ? 'Internal' : 'External';
    recommendation.AllTags = recommendation.tags;
    if (this.isManager && !recommendation.is_internal_diligence) {
      recommendation.project_name = recommendation.template_name;
    }
    let tagnames = [];
    if (recommendation.tags) {
      recommendation.tags.forEach((tag) => {
        tagnames.push(tag.name);
      });
    }
    recommendation.tag = tagnames.toString();
    recommendation.grid_entity_type = this.entity_type;
    recommendation.entity_display_type =
      recommendation.entity_type.toLowerCase() == 'fund'
        ? 'product'
        : recommendation.entity_type.toLowerCase() == 'duediligence'
        ? 'project'
        : recommendation.entity_type;
    recommendation.due_at_date = recommendation.due_date;
    recommendation.created_at_date = recommendation.created_date;
    recommendation.due_date = this.dvDatePipe.transform(
      recommendation.due_date,
      ['isLocaleDate']
    );
    recommendation.created_date = this.dvDatePipe.transform(
      recommendation.created_date
    );
    return recommendation;
  }

  // This function will determine wether to open the sidepanel or to redirect to a entity page upon clicking associated cell.
  checkForSidePanelOpen(event) {
    const entity_type = event?.data?.entity_type.toLowerCase();
    const grid_entity_type = event?.data?.grid_entity_type?.toLowerCase();
    const openRecommendationPanel =
      (event.colDef?.headerName == 'Associated Name' &&
        entity_type == IssueType.Product.toLowerCase() &&
        grid_entity_type == IssueType.Product.toLowerCase()) ||
      (entity_type == IssueType.Project.toLowerCase() &&
        grid_entity_type == IssueType.Project.toLowerCase()) ||
      (entity_type == IssueType.Vehicle.toLowerCase() &&
        grid_entity_type == IssueType.Vehicle.toLowerCase()) ||
      (entity_type == IssueType.Firm.toLowerCase() &&
        grid_entity_type == IssueType.Firm.toLowerCase()) ||
      (entity_type == IssueType.Strategy.toLowerCase() &&
        grid_entity_type == IssueType.Strategy.toLowerCase())
        ? true
        : event.colDef.headerName != 'Associated Name'
        ? true
        : false;

    return openRecommendationPanel;
  }

  handleRowClicked = (event) => {
    this.onNewRowClicked(event);
  };

  onCellClicked = (event, sidePanelOnInit = false, isNewTab = false) => {
    if (!event) return;
    if (!isNewTab) {
      this.openRecommendationPanel = this.checkForSidePanelOpen(event);
    }
    if (this.openRecommendationPanel || sidePanelOnInit) {
      if (event.data && event.data.id) {
        this.store.dispatch(
          new UpdateActivePanelId(`recommendation-panel-${event.data.id}`)
        );
        let issueData = { ...event.data };
        issueData.priority = this.priorityList.find(
          (priority) => issueData.priority == priority?.system_issue_priority_id
        )?.system_issue_priority_id;
        issueData.status = this.statusList.find(
          (status) => issueData.status == status?.system_status_id
        )?.system_status_id;
        this.panel.invoke('recommendation-panel', {
          entity_id: issueData.entity_id,
          entity_type: issueData.entity_type,
          editingRecommendation: issueData,
          diligence: this.diligence,
          recommendation: issueData,
          onUpdateIssue: (updatedRecommendation) => {
            let udpatedIndex = this.recommendations.findIndex(
              (recommendation) =>
                recommendation.id == updatedRecommendation[0].id
            );
            if (udpatedIndex >= 0) {
              updatedRecommendation = this.processRecommendation(
                updatedRecommendation[0]
              );
              this.recommendations[udpatedIndex] = {
                ...updatedRecommendation,
              };
              this.onUpdate.emit({
                data: updatedRecommendation,
                type: 'update',
              });
              this.recommendations = [...this.recommendations];
            }
          },
          onCommentUpdate: ({ type, count }) => {
            if (type === 'add') {
              event.data.comment_count += count;
            } else if (type == 'delete') {
              event.data.comment_count -= count;
            }
            this.onUpdate.emit({ data: event.data, type: 'update' });
          },
          onDeleteIssue: (deletedRecommendation) => {
            this.onUpdate.emit({ data: deletedRecommendation[0], type: 'delete' });
            let deletedIndex = this.recommendations.findIndex(
              (recommendation) =>
                recommendation.id == deletedRecommendation[0].id
            );
            if (deletedIndex != -1) {
              this.recommendations.splice(deletedIndex, 1);
            }
            this.recommendations = [...this.recommendations];
          },
        });
      }
    }
  };

  handleRowClass = (params) => {
    if (this.getRowClass) {
      return this.getRowClass(params);
    }
    if (params?.data?.id && params?.data?.id == this.recommendationId) {
      this.openSidePanel(params);
      setTimeout(() => (this.recommendationId = null)); // Clear out the recommendation ID so the row doesnt get highlighted again and again
      return 'heightLightRow';
    }
  };

  // Check if the selected row is visible in the grid or not
  checkForSidePanelInit() {
    setTimeout(() => {
      // Only trigger if the page is not dashboard
      if (this.recommendations?.length && !this.isDashboard) {
        let rowIndex = this.recommendations.findIndex(
          (rec) => rec.id == this.recommendationId
        );
        //This will ensure that the row that we are opening sidepanel for is visible in the grid
        if (rowIndex !== -1) {
          this.gridApi.ensureIndexVisible(rowIndex, 'top');
          this.recommendationRowIndex = rowIndex;
        }
      }
    }, 500);
  }

  openSidePanel(params) {
    window.scrollTo(0, 0);
    this.onCellClicked(params, true, true);
  }

  onGridReady(params) {
    this.gridApi = params.api;
  }

  gotoPremium() {
    this.sweetAlert.premiumAlert();
  }

  addNewRecommendation() {
    if (this.isFreeSubscription) {
      if (this.isManager) {
        this.gotoPremium();
      }
      return;
    }
    if (this.allowAdding) {
      this.store.dispatch(new UpdateActivePanelId(`new-recommendation-panel`));
      this.panel.invoke('new-recommendation-panel', {
        entity_id: this.entity_id,
        entity_type: this.entity_type,
        editingRecommendation: null,
        diligence: this.diligence,
        onSaveIssue: (createdRecommendation) => {
          createdRecommendation = this.processRecommendation(
            createdRecommendation[0]
          );
          this.recommendations = [
            createdRecommendation,
            ...this.recommendations,
          ];
          this.onUpdate.emit({ data: createdRecommendation, type: 'update' });
          this.panel.close();
        },
        onCancelIssue: (questionTouchedOrNot) => {
          this.panel.close();
        },
      });
    }
  }

  getRecommendationGridColumn(): ColDef[] {
    return this.recommendationService.getRecommendationGridColumn(
      this.entity_type,
      this.isInvestor,
      this.firm_preferences,
      this.isDashboard
    );
  }
}
