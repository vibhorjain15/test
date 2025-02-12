import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { MyTaskService } from '../../service/my-task.service';
import { Select, Store } from '@ngxs/store';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import { take, takeUntil, tap } from 'rxjs/operators';
import { GetCurrentUser } from 'src/app2/store/user/user.action';
import { UserState } from 'src/app2/store/user/user.state';
import { MyProjectsGridService } from '../../service/my-project.service';
import { DashboardService } from 'src/app2/apis/dashboard/dashboard.service';
import { forkJoin, Subject } from 'rxjs';
import { EntityType } from 'src/app2/utils/allEntityType.util';
import { MyActionsService } from '../../service/myactions.service';
import { WorkflowService } from '../../service/workflow.service';
import { RouterService } from 'src/app2/services/router.service';
import { RecommendationService } from 'src/app2/modules/recommendation/service/recommendation-grid.service';
import * as moment from 'moment';
import {
  getDueThisWeekRange,
  getOverDueRange,
} from '../../utils/get_this_week_range';
import { diligenceStatusConstant } from 'src/app2/shared/constants/constant';
import {
  trigger,
  state,
  style,
  animate,
  transition,
} from '@angular/animations';
import {
  isDueThisWeek,
  isNew,
  isOverDue,
  myProjectFilter,
  myProjectFilterCountMapper,
  MyProjectFilterEnum,
  myProjectTypeFilter,
  projectDetailCountMap,
  sidePanelCards,
  subEntityMapper,
} from '../../utils/my-work.util';
import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import { debouncer } from 'src/app2/utils/debouce.util';

export enum SubMenuFilter {
  PENDING = 'pending',
  DUE_THIS_WEEK = 'duethisweek',
  OVERDUE = 'overdue',
  TOTAL = 'total',
}
export enum DashMenu {
  PROJECTS = 'projects',
  TASKS = 'tasks',
  WORKFLOWS = 'workflows',
  RECOMMENDATION = 'recommendations',
}
@Component({
  selector: 'my-work',
  templateUrl: './my-work.component.html',
  styleUrls: ['./my-work.component.css'],
  animations: [
    trigger('expandCollapse', [
      state(
        'collapsed',
        style({
          'min-width': '107px',
        })
      ),
      state(
        'expanded',
        style({
          width: '266px',
        })
      ),
      transition('* <=> *', [animate('0.3s ease-in-out')]),
    ]),
  ],
})
export class MyWorkComponent implements OnInit, OnChanges, OnDestroy {
  @Input() dateRange;
  SubMenuFilter = SubMenuFilter;
  DashMenu = DashMenu;
  loading = true;
  sidePanelCards: any = [];
  leftOpen = false;

  mySettingObj = {
    id: 'settings',
    title: 'My Settings',
    icon: 'cogs',
    iconColor: 'white',
    isActive: false,
  };
  gridName = 'projects';
  currentMenu = null;
  activeSubMenu: SubMenuFilter = SubMenuFilter.TOTAL;
  gridLoading = true;
  projectType: string = '';
  tasksData = [];
  tasksDataCopy = {};
  issuesData = [];
  issuesDataCopy = {};
  projectData = [];
  projectDataCopy = [];
  allPojectDataCopy = {};
  workflowData = [];
  workflowDataCopy = {};

  titleMapper = {
    projects: 'PROJECTS',
    tasks: 'TASKS',
    workflows: 'WORKFLOWS',
    recommendations: 'RECOMMENDATIONS',
  };
  subEntityMapper = {};
  entityMapper = {
    projects: EntityType.Due_Diligence,
    tasks: EntityType.To_Do,
    workflows: EntityType.Workflow,
    recommendations: EntityType.Issue,
  };

  projectDetailCountMap: any = projectDetailCountMap();
  last_view_time_stamp = {
    reviews: null,
    followups: null,
    questions: null,
    todos: null,
    flags: null,
    completed: null,
    projects: null,
    projectsTotal: null,
    tasks: null,
    workflows: null,
    workflowTotal: null,
    recommendations: null,
    recommendationsTotal: null,
  };

  projects_pending_filters = [
    {
      key: 'followups',
      label: 'Follow Ups',
    },
    {
      key: 'reviews',
      label: 'Reviews',
    },
    {
      key: 'questions',
      label: 'Assigned Questions',
    },
    {
      key: 'todos',
      label: 'To-Do',
    },
  ];
  allColDef = {};
  isDropdownOpen = false;
  totalPendingItems = 0;
  selectedFollowUpFilters = 0;
  followUpFilters;
  current_user;
  dueDateFilters = {
    pending: `start_due_date=null&end_due_date=null`,
    total: `start_due_date=null&end_due_date=null`,
    overdue: `start_due_date=${moment(new Date('1-1-2000')).format(
      'YYYY-MM-DD'
    )} 00:00:00&end_due_date=${moment(new Date()).format(
      'YYYY-MM-DD'
    )} 23:59:59`,
    duethisweek: `start_due_date=${
      getDueThisWeekRange().start_due_date
    }&end_due_date=${getDueThisWeekRange().end_due_date}`,
  };

  private destroy$ = new Subject<void>();
  start_due_date;
  end_due_date;
  start_over_due_date;
  end_over_due_date;
  selectedMyProjectFilter = MyProjectFilterEnum.ALL_ACTIVE;
  myProjectFilterCountMapper = myProjectFilterCountMapper();
  myProjectFilter = myProjectFilter;
  selectedMyProjectTypeFilter = 'All';
  myProjectTypeFilter = myProjectTypeFilter;
  @Select(UserState.getCurrentUserData) user;
  @ViewChild('myProjectFilterdropdown', { static: false })
  myProjectFilterdropdown;
  @ViewChild('myProjectDropdown', { static: false }) myProjectDropdown: any;
  myProjectFilterIconDropdown = false;
  myProjectIconDropdown = false;
  getLastViewTimeStampdebouceInst;
  constructor(
    private readonly taskService: MyTaskService,
    private readonly projectGrid: MyProjectsGridService,
    private readonly store: Store,
    private readonly dashboardService: DashboardService,
    private readonly actionService: MyActionsService,
    private readonly workflowService: WorkflowService,
    private router: RouterService,
    private readonly recommendationService: RecommendationService,
    private DvDatePipe: DvDatePipe,
    private panel: SidePanelService
  ) {
    this.onRowClicked = this.onRowClicked.bind(this);
    this.getLastViewTimeStamp = this.getLastViewTimeStamp.bind(this);
  }

  ngOnInit() {
    this.getLastViewTimeStampdebouceInst = debouncer(
      this.getLastViewTimeStamp,
      500
    );
    this.user
      .pipe(
        take(2),
        tap((userData) => {
          if (!userData) {
            this.store.dispatch(new GetCurrentUser());
          }
        })
      )
      .subscribe((user) => {
        if (user) {
          this.current_user = user;
          this.OnInit();
        }
      });
  }

  OnInit(): void {
    const { start_due_date, end_due_date } = getDueThisWeekRange();
    const { start_over_due_date, end_over_due_date } = getOverDueRange();
    this.start_due_date = start_due_date;
    this.end_due_date = end_due_date;
    this.start_over_due_date = start_over_due_date;
    this.end_over_due_date = end_over_due_date;

    if (this.current_user.isInvestor) {
      this.projects_pending_filters = [
        {
          key: 'flags',
          label: 'Flagged',
        },
        {
          key: 'followups',
          label: 'Follow Ups',
        },
        {
          key: 'completed',
          label: 'Completed',
        },
        {
          key: 'reviews',
          label: 'Reviews',
        },
        {
          key: 'questions',
          label: 'Assigned Questions',
        },
        {
          key: 'todos',
          label: 'To-Do',
        },
      ];
    }
    this.subEntityMapper = subEntityMapper(
      this.current_user.firmInfo.preferences?.issue_tracker_default_name ??
        'Recommendations'
    );
    this.sidePanelCards = sidePanelCards().map((val, index) => {
      if (val.id == 'recommendations') {
        let localStr =
          this.current_user.firmInfo.preferences?.issue_tracker_default_name;
        val.title =
          'My ' +
            localStr.charAt(0).toUpperCase() +
            localStr.slice(1).toLowerCase() ?? 'My Recommendations';
      }
      return val;
    });
    this.titleMapper['recommendations'] =
      this.current_user.firmInfo.preferences?.issue_tracker_default_name?.toUpperCase() ??
      'RECOMMENDATIONS';
    this.sidePanelCards = JSON.parse(JSON.stringify(this.sidePanelCards));
    this.currentMenu = this.sidePanelCards[0];

    this.allColDef = {
      projects: this.projectGrid.getProjectsGridColDef('followups'),
      tasks: this.taskService.getActionsColDef(),
      workflows: this.workflowService.getMyWorkflowColDef(),
      recommendations: this.recommendationService.getRecommendationGridColumn(
        '',
        this.current_user.isInvestor,
        this.current_user.firmInfo.preferences,
        true
      ),
    };
    this.loadGrid();
    this.initDefaultFollowUpFilters();

    if (!this.dateRange) {
      this.loading = true;
      this.initialGridData();
      this.getLastViewTimeStampdebouceInst(() => this.getAllGridData());
    }
  }

  initialGridData() {
    this.tasksData = [];
    this.tasksDataCopy = {};
    this.projectData = [];
    this.workflowData = [];
    this.issuesData = [];
    this.issuesDataCopy = {};
    this.workflowDataCopy = {};
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.dateRange &&
      changes.dateRange.currentValue !== changes.dateRange.previousValue
    ) {
      this.loading = true;
      this.initialGridData();
      this.getLastViewTimeStampdebouceInst(() => this.getAllGridData());
    }
  }

  getCurrentGridColList() {
    let gridCols = null;
    if (this.currentMenu?.id == DashMenu.PROJECTS) {
      if (this.current_user.isInvestor) {
        if (this.activeSubMenu == SubMenuFilter.TOTAL) {
          gridCols = this.projectGrid.getProjectsGridColDef('investor_total');
        } else if (
          this.activeSubMenu == SubMenuFilter.DUE_THIS_WEEK ||
          this.activeSubMenu == SubMenuFilter.OVERDUE
        ) {
          gridCols = this.projectGrid.getProjectsGridColDef('investor_due');
        } else {
          gridCols = this.projectGrid.getProjectsGridColDef(
            'investor_' + this.projectType
          );
        }
      } else {
        if (this.activeSubMenu == SubMenuFilter.TOTAL) {
          gridCols = this.projectGrid.getProjectsGridColDef('manager_total');
        } else if (
          this.activeSubMenu == SubMenuFilter.DUE_THIS_WEEK ||
          this.activeSubMenu == SubMenuFilter.OVERDUE
        ) {
          gridCols = this.projectGrid.getProjectsGridColDef('manager_due');
        } else {
          gridCols = this.projectGrid.getProjectsGridColDef(
            `${this.projectType}`
          );
        }
      }
    } else {
      gridCols = this.allColDef[this.currentMenu.id];
    }
    return gridCols;
  }

  loadGrid(type = '') {
    setTimeout(() => {
      this.store.dispatch(
        new SetDefaultColumnDef({
          ['my-work-' + this.gridName]: this.updateCellClass(type),
        })
      );
    }, 0);
  }

  onPendingItemsFilterChange(value: boolean, item: any) {
    item.isSelected = value;
    this.selectedFollowUpFilters = this.followUpFilters.filter(
      (x) => x.isSelected
    ).length;
    this.filterGridData();
  }

  filterGridData() {
    let filteredData = [];
    this.handleProjectsFilter();
    let followUpCopy = this.projectData;
    if (!this.selectedFollowUpFilters) {
      filteredData = [...followUpCopy];
    } else {
      this.followUpFilters.forEach((filter) => {
        if (filter.isSelected && filter.count) {
          filteredData.push(
            ...followUpCopy.filter((x) => !!x[filter.property])
          );
        }
      });
      // remove duplicates if any
      filteredData = [...new Map(filteredData.map((x) => [x.id, x])).values()];
      // exclude these statuses
      filteredData = filteredData.filter(
        (diligence) =>
          ![
            diligenceStatusConstant.NotApproved,
            diligenceStatusConstant.Deleted,
            diligenceStatusConstant.Withdrawn,
            diligenceStatusConstant.Approved,
          ].includes(diligence.status)
      );
      filteredData = this.projectGrid.sortFilteredData(
        filteredData,
        this.followUpFilters
      );
    }
    this.projectData = [...filteredData];
  }

  removeAllPendingItemsFilters() {
    this.initDefaultFollowUpFilters();
    this.selectedFollowUpFilters = 0;
    this.filterGridData();
  }

  updateGridData(key, data, counts) {
    if (key == DashMenu.TASKS) {
      let taskData = {
        [SubMenuFilter.PENDING]: [],
        [SubMenuFilter.DUE_THIS_WEEK]: [],
        [SubMenuFilter.OVERDUE]: [],
        [SubMenuFilter.TOTAL]: [],
      };
      data?.forEach((task) => {
        task.isNew = isNew(
          task?.last_updated_at,
          this.last_view_time_stamp.tasks
        );
        task.redirectUrl = this.actionService.redirectTaskUrl(task);
        task.entity_type_label = task.entity_type;
        task.due_at = this.DvDatePipe.transform(task.due_at);
        if (task.entity_type == 'User') {
          task.entity_type_label = 'Contact';
        }
        if (task.entity_type == 'Attachment') {
          task.entity_type_label = 'Document';
        }
        if (task.entity_type == 'Fund') {
          task.entity_type_label = 'Product';
        }

        taskData[SubMenuFilter.PENDING].push(task);
        counts[DashMenu.TASKS].all[SubMenuFilter.PENDING] += 1;
        if (task.isNew) {
          counts[DashMenu.TASKS].new[SubMenuFilter.PENDING] += 1;
        }
        // Due this week
        if (
          isDueThisWeek(task?.due_at, this.start_due_date, this.end_due_date)
        ) {
          taskData[SubMenuFilter.DUE_THIS_WEEK].push(task);
          counts[DashMenu.TASKS].all[SubMenuFilter.DUE_THIS_WEEK] += 1;
          if (task.isNew)
            counts[DashMenu.TASKS].new[SubMenuFilter.DUE_THIS_WEEK] += 1;
        }
        // overDue
        if (
          isOverDue(
            task?.due_at,
            this.start_over_due_date,
            this.end_over_due_date
          )
        ) {
          taskData[SubMenuFilter.OVERDUE].push(task);
          counts[DashMenu.TASKS].all[SubMenuFilter.OVERDUE] += 1;
          if (task.isNew)
            counts[DashMenu.TASKS].new[SubMenuFilter.OVERDUE] += 1;
        }
      });

      // this.tasksDataCopy = this.tasksData;
      this.tasksDataCopy = JSON.parse(JSON.stringify(taskData));
      if (this.currentMenu.id == DashMenu.TASKS)
        this.tasksData = JSON.parse(
          JSON.stringify(this.tasksDataCopy[this.activeSubMenu])
        );
    }
    if (key == DashMenu.WORKFLOWS) {
      let workflowData = {
        [SubMenuFilter.PENDING]: [],
        [SubMenuFilter.DUE_THIS_WEEK]: [],
        [SubMenuFilter.OVERDUE]: [],
        [SubMenuFilter.TOTAL]: [],
      };

      data.map((workflow) => {
        workflow.isNew = isNew(
          workflow?.last_updated_at,
          this.last_view_time_stamp.workflows
        );
        workflow.due_at = this.DvDatePipe.transform(workflow.due_at, [
          'isLocaleDate',
        ]);
        workflow.last_updated_at = this.DvDatePipe.transform(
          workflow.last_updated_at
        );
        if (workflow.status == 'in-progress') {
          workflow.statusLabel = 'In Progress';
        }
        if (workflow.status == 'completed') {
          workflow.statusLabel = 'Completed';
        }
        workflow.entity_type_label = workflow.entity_type;
        if (workflow.entity_type == 'Fund') {
          workflow.entity_type_label = 'Product';
        }
        if (workflow.entity_type == 'Attachment') {
          workflow.entity_type_label = 'Document';
        }
        if (workflow.entity_type == 'Duediligence') {
          workflow.entity_type_label = 'Project';
        }
        if (workflow?.completed_at) {
          workflow.isNew = false;
        }
        workflow.pct_complete_statusLabel = `${workflow.pct_complete} % , ${workflow.statusLabel}`;
        workflowData[SubMenuFilter.TOTAL].push(workflow);
        counts[DashMenu.WORKFLOWS].all[SubMenuFilter.TOTAL] += 1;
        if (workflow.isNew) {
          counts[DashMenu.WORKFLOWS].new[SubMenuFilter.TOTAL] += 1;
        }
        if (!workflow.completed_at) {
          workflowData[SubMenuFilter.PENDING].push(workflow);
          counts[DashMenu.WORKFLOWS].all[SubMenuFilter.PENDING] += 1;
          if (workflow.isNew) {
            counts[DashMenu.WORKFLOWS].new[SubMenuFilter.PENDING] += 1;
          }
          // Due this week
          if (
            isDueThisWeek(
              workflow?.due_at,
              this.start_due_date,
              this.end_due_date
            )
          ) {
            workflowData[SubMenuFilter.DUE_THIS_WEEK].push(workflow);
            counts[DashMenu.WORKFLOWS].all[SubMenuFilter.DUE_THIS_WEEK] += 1;
            if (workflow.isNew)
              counts[DashMenu.WORKFLOWS].new[SubMenuFilter.DUE_THIS_WEEK] += 1;
          }
          // overDue
          if (
            isOverDue(
              workflow?.due_at,
              this.start_over_due_date,
              this.end_over_due_date
            )
          ) {
            workflowData[SubMenuFilter.OVERDUE].push(workflow);
            counts[DashMenu.WORKFLOWS].all[SubMenuFilter.OVERDUE] += 1;
            if (workflow.isNew)
              counts[DashMenu.WORKFLOWS].new[SubMenuFilter.OVERDUE] += 1;
          }
        }
      });

      // this.tasksDataCopy = this.tasksData;
      this.workflowDataCopy = JSON.parse(JSON.stringify(workflowData));
      if (this.currentMenu.id == DashMenu.WORKFLOWS)
        this.workflowData = JSON.parse(
          JSON.stringify(this.tasksDataCopy[this.activeSubMenu])
        );
    }
    if (key == DashMenu.RECOMMENDATION) {
      let issuesData = {
        [SubMenuFilter.PENDING]: [],
        [SubMenuFilter.DUE_THIS_WEEK]: [],
        [SubMenuFilter.OVERDUE]: [],
        [SubMenuFilter.TOTAL]: [],
      };

      data.forEach((issue) => {
        issue.isNew = isNew(
          issue?.created_date,
          this.last_view_time_stamp.recommendations
        );
        issue.isDash = true;
        issue.created_date = this.DvDatePipe.transform(issue.created_date);
        issue.due_date = this.DvDatePipe.transform(issue.due_date, [
          'isLocaleDate',
        ]);

        issuesData[SubMenuFilter.TOTAL].push(issue);
        counts[DashMenu.RECOMMENDATION].all[SubMenuFilter.TOTAL] += 1;
        if (issue.isNew) {
          counts[DashMenu.RECOMMENDATION].new[SubMenuFilter.TOTAL] += 1;
        }
        if ([1, 2].includes(issue.status)) {
          issuesData[SubMenuFilter.PENDING].push(issue);
          counts[DashMenu.RECOMMENDATION].all[SubMenuFilter.PENDING] += 1;
          if (issue.isNew) {
            counts[DashMenu.RECOMMENDATION].new[SubMenuFilter.PENDING] += 1;
          }
          // Due this week
          if (
            isDueThisWeek(
              issue?.due_date,
              this.start_due_date,
              this.end_due_date
            )
          ) {
            issuesData[SubMenuFilter.DUE_THIS_WEEK].push(issue);
            counts[DashMenu.RECOMMENDATION].all[
              SubMenuFilter.DUE_THIS_WEEK
            ] += 1;
            if (issue.isNew)
              counts[DashMenu.RECOMMENDATION].new[
                SubMenuFilter.DUE_THIS_WEEK
              ] += 1;
          }
          // overDue
          if (
            isOverDue(
              issue?.due_date,
              this.start_over_due_date,
              this.end_over_due_date
            )
          ) {
            issuesData[SubMenuFilter.OVERDUE].push(issue);
            counts[DashMenu.RECOMMENDATION].all[SubMenuFilter.OVERDUE] += 1;
            if (issue.isNew)
              counts[DashMenu.RECOMMENDATION].new[SubMenuFilter.OVERDUE] += 1;
          }
        }
      });

      // this.tasksDataCopy = this.tasksData;
      this.issuesDataCopy = JSON.parse(JSON.stringify(issuesData));
      if (this.currentMenu.id == DashMenu.RECOMMENDATION)
        this.issuesData = JSON.parse(
          JSON.stringify(this.issuesDataCopy[this.activeSubMenu])
        );
    }
    if (key == DashMenu.PROJECTS) {
      this.projectDataCopy =
        data?.filter(
          (val) =>
            ![
              diligenceStatusConstant.Deleted,
              diligenceStatusConstant.Scheduled,
              diligenceStatusConstant.Declined,
            ].includes(val.status)
        ) || [];
      this.resetProjectFiltersCounts();
      this.updateProjectData(counts);
    }
  }

  initDefaultFollowUpFilters() {
    this.followUpFilters = this.projectGrid
      .getFollowUpFilterCount()
      .map((filter) => ({ ...filter, isSelected: false }));
  }

  getAllGridData() {
    this.initialGridData();
    this.gridLoading = true;
    let allapiCalls = [];
    [
      { api: 'getTaskData', type: DashMenu.TASKS },
      { api: 'getIssuesData', type: DashMenu.RECOMMENDATION },
      { api: 'getWorkflowData', type: DashMenu.WORKFLOWS },
      { api: 'getMyProjectsData', type: DashMenu.PROJECTS },
    ].map((val) => {
      allapiCalls.push(
        this.dashboardService[val.api](
          val.type,
          val.type == DashMenu.PROJECTS || val.type == DashMenu.RECOMMENDATION
            ? {
                start_date: this.dateRange?.startDate,
                end_date: this.dateRange?.endDate,
                start_due_date: null,
                end_due_date: null,
              }
            : `start_date=${this.dateRange?.startDate}&end_date=${this.dateRange?.endDate}&${this.dueDateFilters.total}`
        )
      );
    });

    forkJoin(allapiCalls)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        ([tasks, recommendations, workflows, Due_Diligence]: any[]) => {
          let allEntityData = {
            projects: Due_Diligence.data
              .sort(
                (a, b) =>
                  new Date(b.last_updated_at).getTime() -
                  new Date(a.last_updated_at).getTime()
              )
              .map((val) => {
                val.myWorkProject = true;
                val.isInvestor = this.current_user.isInvestor;
                return val;
              }),
            tasks: tasks.sort(
              (a, b) =>
                new Date(b.last_updated_at).getTime() -
                new Date(a.last_updated_at).getTime()
            ),
            workflows: workflows.sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            ),
            recommendations: recommendations.data.sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            ),
          };

          let counts = {
            [DashMenu.TASKS]: {
              all: { pending: 0, duethisweek: 0, overdue: 0, total: 0 },
              new: { pending: 0, duethisweek: 0, overdue: 0, total: 0 },
            },
            [DashMenu.WORKFLOWS]: {
              all: { pending: 0, duethisweek: 0, overdue: 0, total: 0 },
              new: { pending: 0, duethisweek: 0, overdue: 0, total: 0 },
            },
            [DashMenu.RECOMMENDATION]: {
              all: { pending: 0, duethisweek: 0, overdue: 0, total: 0 },
              new: { pending: 0, duethisweek: 0, overdue: 0, total: 0 },
            },
            [DashMenu.PROJECTS]: {
              all: { pending: 0, duethisweek: 0, overdue: 0, total: 0 },
              new: { pending: 0, duethisweek: 0, overdue: 0, total: 0 },
            },
          };

          Object.keys(allEntityData).map((key) => {
            this.updateGridData(key, allEntityData[key], counts);
          });
          this.sidePanelCards = this.sidePanelCards.map((entity) => {
            return {
              ...entity,
              all: counts[entity.id].all,
              new: counts[entity.id].new,
            };
          });

          this.sidePanelCards.forEach((val) => {
            if (val.id == this.currentMenu.id) {
              this.currentMenu = val;
              this.handleSubMenuClick(this.activeSubMenu);
            }
          });
          this.loading = false;
          this.gridLoading = false;
        },
        (e) => {
          this.loading = false;
          this.gridLoading = false;
        }
      );
  }

  getLastViewTimeStamp(callback) {
    this.resetProjectFiltersCounts();
    let allapiCalls = [];
    [
      EntityType.Due_Diligence + '_pending',
      EntityType.Due_Diligence + '_total',
      EntityType.Due_Diligence + '_pending_questions',
      EntityType.Due_Diligence + '_pending_reviews',
      EntityType.Due_Diligence + '_pending_followups',
      EntityType.Due_Diligence + '_pending_todos',
      EntityType.To_Do + '_pending',
      EntityType.Issue + '_pending',
      EntityType.Issue + '_total',
      EntityType.Workflow + '_pending',
      EntityType.Workflow + '_total',
      ...(this.current_user.isInvestor
        ? [
            EntityType.Due_Diligence + '_pending_flags',
            EntityType.Due_Diligence + '_pending_completed',
          ]
        : []),
    ].map((val) => {
      allapiCalls.push(this.dashboardService.getLastView(val));
    });
    forkJoin(allapiCalls)
      .pipe(takeUntil(this.destroy$))
      .subscribe((response: any[]) => {
        const [
          projects,
          projectsTotal,
          questions,
          reviews,
          followups,
          todos,
          tasks,
          issues,
          issuesTotal,
          workflow,
          workflowTotal,
          ...others
        ] = response.map((val) => {
          return this.projectGrid.getFormattedDate(val.viewed_at);
        });
        this.last_view_time_stamp.projects = projects;
        this.last_view_time_stamp.projectsTotal = projectsTotal;
        this.last_view_time_stamp.reviews = reviews;
        this.last_view_time_stamp.questions = questions;
        this.last_view_time_stamp.followups = followups;
        this.last_view_time_stamp.todos = todos;
        this.last_view_time_stamp.tasks = tasks;
        this.last_view_time_stamp.recommendations = issues;
        this.last_view_time_stamp.recommendationsTotal = issuesTotal;
        this.last_view_time_stamp.workflows = workflow;
        this.last_view_time_stamp.workflowTotal = workflowTotal;
        if (this.current_user.isInvestor) {
          this.last_view_time_stamp.flags = others[0];
          this.last_view_time_stamp.completed = others[1];
        }
        callback();
      });
  }

  handleCardClick(menu) {
    this.sidePanelCards.forEach((menu) => (menu.isActive = false));
    menu.isActive = true;
    this.currentMenu = menu;
    this.gridName = this.currentMenu.id;
    this.clearFollowUpFilter();
    this.selectedFollowUpFilters = 0;
    this.selectedMyProjectTypeFilter = 'All';
    this.handleSubMenuClick(
      this.currentMenu.id == DashMenu.TASKS
        ? SubMenuFilter.PENDING
        : SubMenuFilter.TOTAL
    );
    this.loadGrid();
  }

  getFilterData() {
    if (this.currentMenu.id == DashMenu.TASKS) {
      this.tasksData = this.tasksDataCopy[this.activeSubMenu];
    }
    if (this.currentMenu.id == DashMenu.RECOMMENDATION) {
      this.issuesData = this.issuesDataCopy[this.activeSubMenu];
    }
    if (this.currentMenu.id == DashMenu.WORKFLOWS) {
      this.workflowData = this.workflowDataCopy[this.activeSubMenu];
    }
    if (this.currentMenu.id == DashMenu.PROJECTS) {
      this.handleProjectsFilter();
    }
  }

  handleSubMenuClick(type) {
    this.handleSelectMyProjectTypeFilter();
    this.handleSelectMyProjectFilter();
    this.initDefaultFollowUpFilters();
    if (type !== this.activeSubMenu) {
      this.panel.close();
    }
    this.activeSubMenu = type;
    this.projectType = type;
    this.selectedMyProjectFilter = MyProjectFilterEnum.ALL_ACTIVE;
    if (
      this.activeSubMenu == SubMenuFilter.PENDING &&
      this.currentMenu.id == DashMenu.PROJECTS
    ) {
      this.projectType = this.projects_pending_filters[0].key;
      this.handleProjectClick(this.projectType);
    }

    this.loadGrid(type);
    this.getFilterData();
    this.dashboardService
      .updateUnReadItem({
        tab_name: `${this.entityMapper[this.currentMenu.id]}_${
          this.currentMenu.id == DashMenu.PROJECTS
            ? this.activeSubMenu
            : SubMenuFilter.PENDING
        }`,
      })
      .subscribe((data) => {
        setTimeout(() => {
          this.removeNewBadgeFromRows();
          this.currentMenu.new[type] = 0;
          this.currentMenu.new[
            this.currentMenu.id == DashMenu.PROJECTS
              ? this.activeSubMenu
              : SubMenuFilter.PENDING
          ] = 0;
          this.currentMenu = JSON.parse(JSON.stringify(this.currentMenu));
          this.sidePanelCards = this.sidePanelCards.map((menu) => {
            if (menu.id == this.currentMenu.id) {
              menu = this.currentMenu;
            }
            return menu;
          });
          this.last_view_time_stamp[this.currentMenu.id] = new Date();
        }, 10000);
      });
  }

  removeNewBadgeFromRows() {
    if (this.currentMenu.id == DashMenu.TASKS) {
      this.tasksData = this.tasksData.map((val) => {
        val.isNew = false;
        return val;
      });
    }
    if (this.currentMenu.id == DashMenu.WORKFLOWS) {
      [SubMenuFilter.PENDING, SubMenuFilter.TOTAL].forEach((subMenu) => {
        this.workflowDataCopy[subMenu] = this.workflowDataCopy[subMenu].map(
          (val) => {
            val.isNew = false;
            return val;
          }
        );
      });
      this.workflowData = this.workflowDataCopy[this.activeSubMenu];
    }
    if (this.currentMenu.id == DashMenu.RECOMMENDATION) {
      [SubMenuFilter.PENDING, SubMenuFilter.TOTAL].forEach((subMenu) => {
        this.issuesDataCopy[subMenu] = this.issuesDataCopy[subMenu].map(
          (val) => {
            val.isNew = false;
            return val;
          }
        );
      });
      this.issuesData = this.issuesDataCopy[this.activeSubMenu];
    }
    if (this.currentMenu.id == DashMenu.PROJECTS) {
      const projectTypeUpdates = {
        followups: { followupIsNew: false },
        questions: { questionsIsNew: false },
        reviews: { reviewIsNew: false },
        todos: { toDoIsNew: false },
        flags: { flagIsNew: false },
        completed: { completedIsNew: false },
      };

      const updates = {
        [SubMenuFilter.PENDING]: {
          ...projectTypeUpdates[this.projectType],
        },
        [SubMenuFilter.TOTAL]: {
          overallNew: false,
          projectType: null,
          totalIsNew: false,
        },
        default: {
          overallNew: false,
          projectType: null,
        },
      };

      const updateValues = updates[this.activeSubMenu] || updates.default;

      this.projectData = this.projectData.map((val) => ({
        ...val,
        ...updateValues,
      }));

      this.projectDataCopy = this.projectDataCopy.map((val) => ({
        ...val,
        ...updateValues,
      }));
    }
  }

  clearFollowUpFilter() {
    if (
      !(
        this.activeSubMenu == SubMenuFilter.PENDING &&
        this.projectType == 'followups'
      )
    )
      this.initDefaultFollowUpFilters();
  }

  updateCellClass(type) {
    return this.getCurrentGridColList().map((val) => {
      if (
        val.colId == 'due_at' ||
        (val.colId == 'due_date' &&
          this.currentMenu.id == DashMenu.RECOMMENDATION)
      ) {
        val = {
          ...val,
          cellClass:
            type == SubMenuFilter.DUE_THIS_WEEK
              ? 'highlight-pink'
              : type == SubMenuFilter.OVERDUE
              ? 'highlight-red'
              : '',
        };
      }
      return val;
    });
  }

  handleProjectClick(type) {
    this.projectType = type;
    this.filterGridData();
    this.clearFollowUpFilter();
    this.loadGrid();
    this.dashboardService
      .updateUnReadItem({
        tab_name: `${this.entityMapper[this.currentMenu.id]}_${
          this.activeSubMenu
        }_${this.projectType}`,
      })
      .subscribe((data) => {
        setTimeout(() => {
          this.last_view_time_stamp[this.projectType] = new Date();
          if (this.projectType in this.projectDetailCountMap)
            this.projectDetailCountMap[this.projectType].new = 0;
          this.projectDetailCountMap = JSON.parse(
            JSON.stringify(this.projectDetailCountMap)
          );
          this.removeNewBadgeFromRows();

          // Added only for pending tab under project
          this.currentMenu.new['projectPending'] = 0;
          this.currentMenu = JSON.parse(JSON.stringify(this.currentMenu));
          this.sidePanelCards = this.sidePanelCards.map((menu) => {
            if (menu.id == this.currentMenu.id) {
              menu = this.currentMenu;
            }
            return menu;
          });
          this.last_view_time_stamp[this.currentMenu.id] = new Date();
        }, 10000);
      });
  }

  resetProjectFiltersCounts() {
    this.projectDetailCountMap = projectDetailCountMap();
  }

  updateProjectData(counts) {
    let allProjectDataCopy = {
      [SubMenuFilter.PENDING]: [],
      [SubMenuFilter.DUE_THIS_WEEK]: [],
      [SubMenuFilter.OVERDUE]: [],
      [SubMenuFilter.TOTAL]: [],
    };
    let setOfPendingQuestions = [];
    let setOfNewQuestions = new Set();
    this.projectDataCopy = this.projectDataCopy.map((project: any) => {
      return this.projectGrid.updateProjectData(
        project,
        this.projectDetailCountMap,
        this.last_view_time_stamp,
        this.current_user,
        setOfPendingQuestions,
        setOfNewQuestions,
        allProjectDataCopy,
        counts,
        this.start_due_date,
        this.end_due_date,
        this.start_over_due_date,
        this.end_over_due_date
      );
    });

    counts[DashMenu.PROJECTS].all[SubMenuFilter.PENDING] = Array.from(
      setOfPendingQuestions
    ).length;
    counts[DashMenu.PROJECTS].new[SubMenuFilter.PENDING] =
      Array.from(setOfNewQuestions).length;

    let sortedEntries = Object.entries(this.projectDetailCountMap).sort(
      (a: any, b: any) => b[1].pending - a[1].pending
    );
    this.projectDetailCountMap = Object.fromEntries(sortedEntries);
    let newPendingFilterMap = [];
    sortedEntries.forEach((entry: any) => {
      let newEntry = this.projects_pending_filters.find(
        (val) => val.key == entry[0]
      );
      if (newEntry) newPendingFilterMap.push(newEntry);
    });
    this.projects_pending_filters = newPendingFilterMap;
    this.projectType = newPendingFilterMap[0].key;
    this.allPojectDataCopy = allProjectDataCopy;
    this.filterGridData();
  }

  handleProjectsFilter() {
    this.followUpFilters.forEach((filter) => {
      filter.count = 0;
    });
    this.selectedFollowUpFilters = this.followUpFilters.filter(
      (x) => x.isSelected
    ).length;
    this.totalPendingItems = 0;
    this.projectData =
      this.activeSubMenu == SubMenuFilter.PENDING
        ? this.projectDataCopy
        : this.allPojectDataCopy[this.activeSubMenu];
    this.applyFilters();
    this.projectData = this.projectData.map((project) => {
      this.followUpFilters.forEach((filter) => {
        if (
          ![
            diligenceStatusConstant.NotApproved,
            diligenceStatusConstant.Deleted,
            diligenceStatusConstant.Withdrawn,
            diligenceStatusConstant.Approved,
          ].includes(project.status) &&
          project[filter.property]
        ) {
          filter.count += 1;
          this.totalPendingItems += 1;
        }
      });
      return project;
    });
  }
  async onRowClicked(event: any) {
    if (event?.data?.id) {
      if (!event?.data?.is_read) {
        let payload: any = {
          tab_name: `${this.entityMapper[this.currentMenu.id]}_${
            this.activeSubMenu
          }`,
          entity_id: event?.data?.id,
        };
        let localMapper = {
          [DashMenu.TASKS]: EntityType.To_Do,
          [DashMenu.RECOMMENDATION]: EntityType.Issue,
          [DashMenu.PROJECTS]: EntityType.Due_Diligence,
          [DashMenu.WORKFLOWS]: EntityType.Workflow_Audit,
        };
        payload.entity_type = localMapper[this.currentMenu.id];
        await this.dashboardService.updateUnReadItem(payload).toPromise();
      }
      if (DashMenu.TASKS == this.currentMenu.id) {
        this.actionService.redirectTask(event.data);
      }
      if (DashMenu.RECOMMENDATION == this.currentMenu.id) {
        [
          SubMenuFilter.PENDING,
          SubMenuFilter.DUE_THIS_WEEK,
          SubMenuFilter.OVERDUE,
          SubMenuFilter.TOTAL,
        ].forEach((subMenu) => {
          this.issuesDataCopy[subMenu] = this.issuesDataCopy[subMenu].map(
            (val) => {
              if (val.id == event?.data?.id) {
                val.is_read = true;
              }
              return val;
            }
          );
        });
        this.issuesData = this.issuesDataCopy[this.activeSubMenu];
      }
      if (DashMenu.PROJECTS == this.currentMenu.id) {
        if (event.data.status === diligenceStatusConstant.Sent) {
          this.projectData = this.projectData.map((val) => {
            if (val.id == event?.data?.id) {
              val.is_read = true;
            }
            return val;
          });
          return;
        }
        let status = null;
        let filterMap = {
          todos: 'Todo',
          questions: 'Assigned',
          reviews: 'InReviewMyAssignments',
          followups: 'OpenSentFollowup',
          flags: 'Flagged',
        };
        if (SubMenuFilter.PENDING == this.activeSubMenu) {
          status = filterMap[this.projectType];
        }
        this.current_user = this.store.selectSnapshot(
          (state) => state.user.currentUser
        );
        this.projectGrid.redirectToQuestionnaire(
          event?.data,
          this.current_user.isInvestor,
          status
        );
      }
      if (DashMenu.WORKFLOWS == this.currentMenu.id) {
        this.router.navigateWithParams('app.workflow_automation.detail', {
          Id: event?.data?.id,
        });
      }
    }
  }

  handleRowClass(params) {
    return params?.data?.is_read ? '' : 'text-bold clickable';
  }
  handleViewAll() {
    if (DashMenu.PROJECTS == this.currentMenu.id) {
      this.router.navigateWithParams('app.diligence.projects.activity', {
        type: 'in-progress',
      });
      return;
    }
  }

  handleSettingClick() {
    this.router.navigate('app.settings.preferences');
  }
  routeToProjects() {
    this.router.navigate('app.diligence.newddq');
  }

  isToggled(data: any, type = 'project-type') {
    if (type == 'project-type') {
      this.myProjectFilterIconDropdown = data;
    }
    if (type == 'follow-up-filter') {
      this.isDropdownOpen = data;
    }
    if (type == 'project-filter-type') {
      this.myProjectIconDropdown = data;
    }
  }

  catToggle() {
    this.leftOpen = !this.leftOpen;
  }

  applyFilters() {
    this.myProjectFilterCountMapper = myProjectFilterCountMapper();
    this.projectGrid.activeSubMenu = this.activeSubMenu;
    this.projectData = this.projectData.filter((pro) => {
      let checkFilters =
        this.projectGrid.filterByProjectType(
          this.selectedMyProjectTypeFilter,
          pro
        ) && this.projectGrid.filterByProjectTypeSpecial(this.projectType, pro);
      if (checkFilters && this.current_user.isInvestor) {
        return (
          checkFilters &&
          this.projectGrid.filterByProjectStatus(
            this.selectedMyProjectFilter,
            pro,
            this.myProjectFilterCountMapper
          )
        );
      }
      return checkFilters;
    });
  }

  handleSelectMyProjectFilter(event = null) {
    if (
      event &&
      this.selectedMyProjectFilter == event.target.id?.split('_')[1]
    ) {
      return;
    }
    if (
      event &&
      this.selectedMyProjectFilter != event.target.id?.split('_')[1]
    ) {
      //clear followup filter id selection is changed
      this.followUpFilters = this.followUpFilters.map((x) => {
        x.isSelected = false;
        return x;
      });
      this.selectedFollowUpFilters = 0;
      this.filterGridData();
    }
    this.selectedMyProjectFilter = event
      ? event.target.id?.split('_')[1]
      : this.selectedMyProjectFilter;
    this.handleProjectsFilter();
    this.myProjectDropdown?.hide();
  }
  handleSelectMyProjectTypeFilter(event = null) {
    this.selectedMyProjectTypeFilter = event
      ? event.target.id?.split('_')[1]
      : this.selectedMyProjectTypeFilter;
    this.handleProjectsFilter();
    this.myProjectFilterdropdown?.hide();
  }

  handleOnUpdate(updatedRec: { type: 'delete' | 'update'; data: any }) {
    [
      SubMenuFilter.PENDING,
      SubMenuFilter.DUE_THIS_WEEK,
      SubMenuFilter.OVERDUE,
      SubMenuFilter.TOTAL,
    ].forEach((subMenu) => {
      if (updatedRec.type == 'delete') {
        let localCount = this.issuesDataCopy[subMenu].length;
        this.issuesDataCopy[subMenu] = this.issuesDataCopy[subMenu].filter(
          (val) => val.id != updatedRec.data?.id
        );
        if (this.issuesDataCopy[subMenu].length != localCount) {
          this.sidePanelCards = this.sidePanelCards.map((entity) => {
            if (entity.id == DashMenu.RECOMMENDATION) {
              entity.all[subMenu] -= 1;
            }
            return entity;
          });
        }
      } else
        this.issuesDataCopy[subMenu] = this.issuesDataCopy[subMenu].map(
          (val) => {
            if (val.id == updatedRec.data?.id) {
              val = updatedRec.data;
              val.is_read = true;
            }
            return val;
          }
        );
    });
    this.issuesData = this.issuesDataCopy[this.activeSubMenu];
  }
  ngOnDestroy(): void {
    this.dashboardService.clearAllCache();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
