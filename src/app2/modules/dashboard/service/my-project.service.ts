import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { RouterService } from 'src/app2/services/router.service';
import { UtilsService } from 'src/app2/services/utils.service';
import {
  dateSortNew,
  defaultColumn,
  diligenceStatusConstant,
  grid_widths_map,
  keywordConstants,
} from 'src/app2/shared/constants/constant';
import * as moment from 'moment';
import { DashMenu, SubMenuFilter } from '../pages/my-work/my-work.component';
import {
  isDueThisWeek,
  isOverDue,
  MyProjectFilterEnum,
  MyProjectTypeFilterEnum,
} from '../utils/my-work.util';
import { colDefMap } from 'src/app2/shared/constants/project-grid-cols-data';
import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';

@Injectable({
  providedIn: 'root',
})
export class MyProjectsGridService {
  keywordConstants = keywordConstants;
  activeSubMenu;

  constructor(
    private readonly router: RouterService,
    private datePipe: DvDatePipe,
    private readonly Utils: UtilsService
  ) {}

  getProjectsGridColDef(type: string, customFields = []): ColDef[] {
    const colDef: ColDef[] = [];

    const hiddenColsInvestor = [
      'internal_key',
      'displayType',
      'primary_owners',
      'entity_type',
      'question_count',
      'total_score',
      'total_flags',
      'percentage_completed',
      'last_reminded_at',
      'last_reminded_by_name',
    ];
    const hiddenColsManager = [
      'question_count',
      'internal_key',
      'primary_owners',
      'started_by',
      'entity_type',
      'last_reminded_at',
      'last_reminded_by_name',
    ];
    const gridTabCols = {
      investor_total: [
        'investor_entity_name',
        'name',
        'template_name',
        'due_at',
        'as_of_date',
        'displayStatus',
        'started_by',
        'last_updated_at',
        // 'closed_at',
        ...hiddenColsInvestor,
      ],
      investor_due: [
        'investor_entity_name',
        'name',
        'template_name',
        'due_at',
        'as_of_date',
        'displayStatus',
        'started_by',
        'last_updated_at',
      ],
      investor_followups: [
        'investor_entity_name',
        'name',
        'due_at',
        'displayStatus',
        'percentage_completed',
        'template_name',
        'last_updated_at',
      ],
      investor_reviews: [
        'investor_entity_name',
        'name',
        'due_at',
        'assigned_count',
        'displayStatus',
        'percentage_completed',
        'template_name',
        'last_updated_at',
      ],
      investor_questions: [
        'investor_entity_name',
        'name',
        'due_at',
        'question_count',
        'displayStatus',
        'percentage_completed',
        'template_name',
        'last_updated_at',
      ],
      investor_todos: [
        'investor_entity_name',
        'name',
        'due_at',
        'todos_count',
        'displayStatus',
        'percentage_completed',
        'template_name',
        'last_updated_at',
      ],
      investor_flags: [
        'investor_entity_name',
        'name',
        'due_at',
        'flag_count',
        'percentage_completed',
        'template_name',
        'last_updated_at',
      ],
      manager_total: [
        'investor_firm_name',
        'entity_name',
        'due_at',
        'displayStatus',
        'percentage_completed',
        'template_name',
        'displayType',
        'last_updated_at',
        // 'closed_at',
        ...hiddenColsManager,
      ],
      manager_due: [
        'investor_firm_name',
        'entity_name',
        'due_at',
        'displayStatus',
        'percentage_completed',
        'template_name',
        'displayType',
        'last_updated_at',
      ],
      followups: [
        'entity_name',
        'investor_firm_name',
        'due_at',
        'displayStatus',
        'percentage_completed',
        'template_name',
        'last_updated_at',
      ],
      reviews: [
        'entity_name',
        'investor_firm_name',
        'due_at',
        'assigned_count',
        'displayStatus',
        'percentage_completed',
        'template_name',
        'last_updated_at',
      ],
      questions: [
        'entity_name',
        'investor_firm_name',
        'due_at',
        'question_count',
        'displayStatus',
        'percentage_completed',
        'template_name',
        'last_updated_at',
      ],
      todos: [
        'entity_name',
        'investor_firm_name',
        'due_at',
        'todos_count',
        'displayStatus',
        'percentage_completed',
        'template_name',
        'last_updated_at',
      ],
      flags: [
        'entity_name',
        'investor_firm_name',
        'due_at',
        'flag_count',
        'percentage_completed',
        'template_name',
        'last_updated_at',
      ],
      investor_completed: [
        'investor_entity_name',
        'name',
        'due_at',
        'percentage_completed',
        'template_name',
        'last_updated_at',
      ],
    };
    let colDefMapper = {
      selectAll: {
        colId: 'selectAll',
        field: 'selectAll',
        checkboxSelection: true,
        headerCheckboxSelection: true,
        headerCheckboxSelectionFilteredOnly: true,
        lockPosition: true,
        width: 50,
        headerClass: 'my-permission-checkbox',
        cellClass: 'my-permission-checkbox',
        suppressColumnsToolPanel: true,
      },
      investor_firm_name: {
        ...defaultColumn,
        colId: 'investor_firm_name',
        headerName: 'Client Name',
        field: 'investor_firm_name',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        floatingFilterComponent: 'textFloatingFilterComponent',
        floatingFilterComponentParams: {
          suppressFilterButton: true,
          placeHolder: 'Search Firm',
        },
        menuTabs: ['generalMenuTab'],
        minWidth: grid_widths_map.sm_column_lg,
        resizable: false,
        cellRenderer: 'agGroupCellRenderer',
        cellRendererParams: {
          innerRenderer: 'projectClientNameRenderer',
        },
      },
      investor_entity_name: {
        ...defaultColumn,
        colId: 'entity_name',
        headerName: 'Entity Name',
        field: 'entity_name',
        filter: 'agTextColumnFilter',
        suppressColumnsToolPanel: true,
        floatingFilter: true,
        floatingFilterComponent: 'textFloatingFilterComponent',
        floatingFilterComponentParams: {
          suppressFilterButton: true,
          placeHolder: 'Search Entity',
        },
        menuTabs: ['generalMenuTab'],
        minWidth: grid_widths_map.sm_column_lg,
        resizable: false,
        cellRenderer: 'agGroupCellRenderer',
        cellRendererParams: {
          innerRenderer: 'projectClientNameRenderer',
        },
      },
      entity_name: {
        ...defaultColumn,
        colId: 'entity_name',
        headerName: 'Entity Name',
        field: 'entity_name',
        filter: 'agTextColumnFilter',
        suppressColumnsToolPanel: true,
        floatingFilter: true,
        floatingFilterComponent: 'textFloatingFilterComponent',
        floatingFilterComponentParams: {
          suppressFilterButton: true,
          placeHolder: 'Search Entity',
        },
        menuTabs: ['generalMenuTab'],
        minWidth: grid_widths_map.sm_column_lg,
        resizable: false,
        cellRenderer: 'agGroupCellRenderer',
        cellRendererParams: {
          innerRenderer: 'MyWorkRowBadgeComponentRenderer',
        },
      },
      as_of_date: {
        ...defaultColumn,
        colId: 'as_of_date',
        headerName: 'As Of Date',
        field: 'as_of_date',
        minWidth: grid_widths_map.sm_column_xm,
        comparator: dateSortNew('as_of_date'),
      },
      template_name: {
        ...defaultColumn,
        colId: 'template_name',
        headerName: 'Template',
        field: 'template_name',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        floatingFilterComponent: 'textFloatingFilterComponent',
        floatingFilterComponentParams: {
          suppressFilterButton: true,
          placeHolder: 'Search Template',
        },
        menuTabs: ['generalMenuTab'],
        minWidth: grid_widths_map.sm_column_lg,
        cellRenderer: 'agGroupCellRenderer',
        cellRendererParams: {
          innerRenderer: 'ProjectTemplateNameRenderer',
        },
      },
      due_at: {
        ...defaultColumn,
        colId: 'due_at',
        headerName: 'Due Date',
        field: 'due_at',
        minWidth: grid_widths_map.sm_column_xm,
        comparator: dateSortNew('due_at'),
      },
      displayStatus: {
        ...defaultColumn,
        colId: 'displayStatus',
        headerName: 'Status',
        field: 'displayStatus',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        floatingFilterComponent: 'textFloatingFilterComponent',
        floatingFilterComponentParams: {
          suppressFilterButton: true,
          placeHolder: 'Search Status',
        },
        cellRenderer: 'agGroupCellRenderer',
        cellRendererParams: {
          innerRenderer: 'projectStatusRenderer',
        },
        menuTabs: ['generalMenuTab'],
        minWidth: grid_widths_map.sm_column_sm,
      },
      displayType: {
        ...defaultColumn,
        colId: 'displayType',
        headerName: 'Type',
        field: 'displayType',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        floatingFilterComponent: 'textFloatingFilterComponent',
        floatingFilterComponentParams: {
          suppressFilterButton: true,
          placeHolder: 'Search Type',
        },
        cellRenderer: 'agGroupCellRenderer',
        cellRendererParams: {
          innerRenderer: 'projectTypeRenderer',
        },
        menuTabs: ['generalMenuTab'],
        minWidth: grid_widths_map.sm_column_xm,
      },
      closed_at: {
        ...defaultColumn,
        colId: 'closed_at',
        headerName: 'Closed On',
        field: 'closed_at',
        minWidth: grid_widths_map.sm_column_xm,
        comparator: dateSortNew('closed_at_date'),
      },
      tofirm_name: {
        ...defaultColumn,
        colId: 'tofirm_name',
        headerName: 'To Firm',
        field: 'tofirm_name',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        floatingFilterComponent: 'textFloatingFilterComponent',
        floatingFilterComponentParams: {
          suppressFilterButton: true,
          placeHolder: 'Search Firm',
        },
        menuTabs: ['generalMenuTab'],
        minWidth: grid_widths_map.sm_column_sm,
      },

      question_count: {
        ...defaultColumn,
        colId: 'question_assignment_count',
        headerName: '# of Assigned Questions',
        field: 'question_assignment_count',
        minWidth: grid_widths_map.sm_column_xm,
        cellRenderer: (params) => {
          if (params?.node.group) return '';
          return `<span
            class="badge dv-badge-disable"
                  >${params.value}
          </span>`;
        },
      },
      flag_count: {
        ...defaultColumn,
        colId: 'flag_count',
        headerName: '# of Flagged Questions',
        field: 'flag_count',
        minWidth: grid_widths_map.sm_column_xm,
        cellRenderer: (params) => {
          if (params?.node.group) return '';
          return `<span
            class="badge dv-badge-disable"
                  >${params.value}
          </span>`;
        },
      },
      assigned_count: {
        ...defaultColumn,
        colId: 'review_count',
        headerName: '# of Assigned Reviews',
        field: 'review_count',
        minWidth: grid_widths_map.sm_column_xm,
        cellRenderer: (params) => {
          if (params?.node.group) return '';
          return `<span
              class="badge dv-badge-disable"
                    >${params.value}
            </span>`;
        },
      },
      todos_count: {
        ...defaultColumn,
        colId: 'todo_count',
        headerName: '# of Assigned Todos',
        field: 'todo_count',
        minWidth: grid_widths_map.sm_column_xm,
        cellRenderer: (params) => {
          if (params?.node.group) return '';
          return `<span
              class="badge dv-badge-disable"
                    >${params.value}
            </span>`;
        },
      },
      percentage_completed: {
        ...defaultColumn,
        colId: 'percentage_completed',
        headerName: 'Progress & # of Questions',
        field: 'percentage_completed',
        cellRenderer: 'progressBarRenderer',
        cellRendererParams: {},
        minWidth: grid_widths_map.sm_column_sm,
      },

      statusIcon: {
        ...defaultColumn,
        colId: 'statusIcon',
        headerName: '',
        field: 'statusIcon',
        cellRenderer: 'projectStatusIconRenderer',
        pinned: 'right',
        width: grid_widths_map.icon_lg,
        cellRendererParams: {
          isInvestor: false,
        },
        flex: 1,
        suppressColumnsToolPanel: true,
      },
      name: {
        ...defaultColumn,
        colId: 'name',
        headerName: 'Project Name',
        field: 'name',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        floatingFilterComponent: 'textFloatingFilterComponent',
        floatingFilterComponentParams: {
          suppressFilterButton: true,
          placeHolder: 'Search Project',
          menuTabs: ['generalMenuTab'],
        },
        menuTabs: ['generalMenuTab'],
        minWidth: grid_widths_map.sm_column_sm,
      },
      started_by: {
        ...defaultColumn,
        colId: 'started_by',
        headerName: 'Started By',
        field: 'started_by',
        floatingFilter: true,
        floatingFilterComponent: 'textFloatingFilterComponent',
        floatingFilterComponentParams: {
          suppressFilterButton: true,
          placeHolder: 'Search by Name',
        },
        minWidth: grid_widths_map['sm_column_sm'],
        cellClass: 'my-permission-cursor-pointer',
        flex: 1,
        cellRenderer: 'agGroupCellRenderer',
        filter: 'agTextColumnFilter',
        menuTabs: ['generalMenuTab'],
      },
      last_updated_at: {
        ...defaultColumn,
        colId: 'last_updated_at',
        headerName: 'Last Updated At',
        field: 'last_updated_at',
        minWidth: grid_widths_map.sm_column_sm,
        comparator: dateSortNew('last_updated_at_date'),
      },
    };
    colDefMapper = { ...colDefMap, ...colDefMapper };
    gridTabCols[type].forEach((column) => {
      if (type == 'investor_total' && hiddenColsInvestor.includes(column)) {
        colDefMapper[column] = { ...colDefMapper[column], hide: true };
      }
      if (type == 'manager_total' && hiddenColsManager.includes(column)) {
        colDefMapper[column] = { ...colDefMapper[column], hide: true };
      }
      if (column) colDef.push(colDefMapper[column]);
    });

    return colDef;
  }

  sortFilteredData(filteredData, followUpFilters) {
    // get latest(max) value from all the pending item timestamps for every row based on the selected filters
    // ex. if two filters are selected, max timestamp is the latest one from those two actions for that row
    const selectedProperties = followUpFilters
      .filter((filter) => filter.isSelected)
      .map((filter) => filter.property);
    let applicableTimestamps = [];

    filteredData.forEach((data) => {
      applicableTimestamps = [];
      selectedProperties.forEach((property: string) => {
        applicableTimestamps.push(new Date(data[property]));
      });
      data.max_pending_timestamp = Math.max(
        ...applicableTimestamps.map((date) => date.getTime())
      );
    });

    // now that we have got max timestamp for each row, sort by that timestamp
    return this.Utils.sortByDate(filteredData, 'max_pending_timestamp');
  }
  getFollowUpFilterCount() {
    return [
      {
        key: 'sent_followups',
        alias: 'Awaiting Follow-up Responses',
        count: 0,
        isSelected: false,
        property: 'last_sent_followup_timestamp',
      },
      {
        key: 'received_followups',
        alias: 'Received Follow-ups',
        count: 0,
        isSelected: false,
        property: 'last_received_followup_timestamp',
        rightIcon: 'info',
        iconTooltip: `Filter for projects containing new and unreplied follow-up messages from ${'requestors'}.`,
      },
      {
        key: 'external_resolved_followups',
        alias: 'Externally Resolved Follow-ups',
        count: 0,
        isSelected: false,
        property: 'last_external_resolved_followup_timestamp',
      },
      {
        key: 'internal_resolved_followups',
        alias: 'Internally Resolved Follow-ups',
        count: 0,
        isSelected: false,
        property: 'last_internal_resolved_followup_timestamp',
      },
    ];
  }

  redirectToQuestionnaire(entity: any, is_investor, status = null) {
    //generate new route
    let newState: string;
    const parentState = 'app.diligence'; //parent state of the route
    let newParams: any = {
      diligenceId: entity.id,
    };
    if (
      entity.entity_type.toLowerCase() ===
      this.keywordConstants.Product.toLowerCase()
    ) {
      //if diligence type is fund then go to firms.funds route
      newState = '.firms.funds';
      newParams.fromfirmId = entity.fromfirm_id;
      newParams.tofirmId = entity.tofirm_id;
      newParams.fundId = entity.entity_id;
    } else if (
      entity.entity_type.toLowerCase() ===
      this.keywordConstants.Firm.toLowerCase()
    ) {
      //else if it is a firm diligence then go to firms route
      newState = '.firms';
      newParams.fromfirmId = entity.fromfirm_id;
      newParams.tofirmId = entity.entity_id;
    } else if (
      entity.entity_type.toLowerCase() ===
      this.keywordConstants.Strategy.toLowerCase()
    ) {
      //else if it is a firm diligence then go to firms route
      newState = '.firms.strategies';
      newParams.fromfirmId = entity.fromfirm_id;
      newParams.tofirmId = entity.tofirm_id;
      newParams.strategyId = entity.entity_id;
    } else {
      newState = ''; //else go to the oldstate
    }
    const childState = '.project.questionnaire';

    if (status) {
      newParams = {
        ...newParams,
        status: status,
        q: null,
      };
    }
    this.router.navigateWithParams(
      parentState + newState + childState,
      newParams,

      { queryParams: { status: status, q: null } }
    );
  }

  getFormattedDate(viewed_at) {
    return viewed_at
      ? moment(`${viewed_at}`)
      : moment(`${'2000-01-01T00:00:00'}`);
  }

  filterByProjectTypeSpecial(projectType, pro) {
    const filterMap = {
      followups: (pro) => pro.displayStatus.includes('Follow-up'),
      questions: (pro) => !!pro.question_assignment_assigned_at,
      reviews: (pro) => !!pro.review_assigned_at,
      todos: (pro) => !!pro.todo_assigned_at,
      flags: (pro) => !!pro.flag_updated_at,
      completed: (pro) => !!pro.completed_at,
    };
    pro.projectType = projectType;
    if (
      this.activeSubMenu == SubMenuFilter.PENDING &&
      projectType &&
      filterMap[projectType]
    ) {
      return (
        filterMap[projectType](pro) &&
        ![
          diligenceStatusConstant.Approved,
          diligenceStatusConstant.NotApproved,
        ].includes(pro.status)
      );
    }
    return true;
  }

  filterByProjectStatus(selectedMyProjectFilter, pro, counter) {
    if (this.activeSubMenu !== SubMenuFilter.TOTAL) {
      return true;
    }

    if (
      [
        diligenceStatusConstant.InReview,
        diligenceStatusConstant.Started,
        diligenceStatusConstant.Completed,
        diligenceStatusConstant.PendingRestart,
        diligenceStatusConstant.ExtensionRequested,
        diligenceStatusConstant.Evaluation,
      ].includes(pro.status)
    ) {
      counter[MyProjectFilterEnum.ALL_ACTIVE]++;
    }
    if (
      [diligenceStatusConstant.Invited, diligenceStatusConstant.Sent].includes(
        pro.status
      )
    ) {
      counter[MyProjectFilterEnum.MY_SENT]++;
    }
    if (
      [
        diligenceStatusConstant.Approved,
        diligenceStatusConstant.NotApproved,
      ].includes(pro.status)
    ) {
      counter[MyProjectFilterEnum.MY_CLOSED]++;
    }

    // Missed type [  "Scheduled","Declined" ]
    switch (selectedMyProjectFilter) {
      case MyProjectFilterEnum.ALL_ACTIVE:
        return [
          diligenceStatusConstant.InReview,
          diligenceStatusConstant.Started,
          diligenceStatusConstant.Completed,
          diligenceStatusConstant.PendingRestart,
          diligenceStatusConstant.ExtensionRequested,
          diligenceStatusConstant.Evaluation,
        ].includes(pro.status);
      case MyProjectFilterEnum.MY_SENT:
        return [
          diligenceStatusConstant.Invited,
          diligenceStatusConstant.Sent,
        ].includes(pro.status);
      case MyProjectFilterEnum.MY_CLOSED:
        return [
          diligenceStatusConstant.Approved,
          diligenceStatusConstant.NotApproved,
        ].includes(pro.status);
      default:
        return true;
    }
  }

  filterByProjectType(selectedMyProjectTypeFilter, pro) {
    switch (selectedMyProjectTypeFilter) {
      case MyProjectTypeFilterEnum.EXTERNAL:
        return !pro.is_internal && pro.type !== 'inbound';
      case MyProjectTypeFilterEnum.INTERNAL:
        return pro.is_internal && pro.type !== 'dd_review';
      case MyProjectTypeFilterEnum.OPPORTUNITY_VAULt:
        return pro.type === 'inbound';
      case MyProjectTypeFilterEnum.ANALYST_EVALUTION:
        return pro.type === 'dd_review';
      default:
        return true;
    }
  }

  updateProjectData(
    project,
    projectDetailCountMap,
    last_view_time_stamp,
    current_user,
    setOfPendingQuestions,
    setOfNewQuestions,
    allProjectDataCopy,
    counts,
    start_due_date,
    end_due_date,
    start_over_due_date,
    end_over_due_date
  ) {
    project.reviewIsNew = false;
    project.followupIsNew = false;
    project.questionsIsNew = false;
    project.toDoIsNew = false;
    project.totalIsNew = false;
    project.flagIsNew = false;
    project.completedIsNew = false;
    project.internal_key = project.key;
    // project.sentIsNew = false;
    project.question_assignment_count = project.question_assignment_count ?? 0;
    if (project?.primary_owners) {
      const primaryOwners =
        typeof project.primary_owners === 'string'
          ? project.primary_owners.split(',')
          : project.primary_owners;
      project.primary_owners =
        Array.isArray(primaryOwners) && primaryOwners.length > 0
          ? primaryOwners
          : [project.primary_owners];
    }
    project.entity_type_label =
      project.entity_type == 'Fund' ? 'Product' : project.entity_type;
    if (project.type == 'dd_review') {
      project['displayType'] = 'Analyst Evaluation';
    } else if (project.type == 'inbound') {
      project['displayType'] = 'Opportunity';
    } else if (project.is_internal) {
      project['displayType'] = 'Internal';
    } else {
      project['displayType'] = 'External';
    }
    if (
      project.status == 'Invited' &&
      project.fromfirm_id == current_user.firmInfo.id
    ) {
      project['displayStatus'] = 'Sent';
    } else
      project['displayStatus'] = project.status.replace(
        /([a-z])([A-Z])/g,
        '$1 $2'
      ); // This code converts TestString into Test String

    project.isDash = true;
    if (last_view_time_stamp) {
      project.reviewIsNew =
        project?.review_assigned_at &&
        moment(project?.review_assigned_at).isAfter(
          moment(last_view_time_stamp.reviews)
        );
      project.questionsIsNew =
        project?.question_assignment_assigned_at &&
        moment(project?.question_assignment_assigned_at).isAfter(
          moment(last_view_time_stamp.questions)
        );
      project.followupIsNew =
        project?.last_sent_followup_timestamp &&
        moment(project?.last_sent_followup_timestamp).isAfter(
          moment(last_view_time_stamp.followups)
        );
      project.toDoIsNew =
        project?.todo_assigned_at &&
        moment(project?.todo_assigned_at).isAfter(
          moment(last_view_time_stamp.todos)
        );

      if (current_user.isInvestor) {
        project.flagIsNew =
          project?.flag_updated_at &&
          moment(project?.flag_updated_at).isAfter(
            moment(last_view_time_stamp.flags)
          );
        project.completedIsNew =
          project?.completed_at &&
          moment(project?.completed_at).isAfter(
            moment(last_view_time_stamp.completed)
          );
      }
    }

    if (
      ![
        diligenceStatusConstant.Approved,
        diligenceStatusConstant.NotApproved,
        diligenceStatusConstant.Deleted,
      ].includes(project.status)
    ) {
      if (project.reviewIsNew) projectDetailCountMap.reviews.new += 1;
      if (project.questionsIsNew) projectDetailCountMap.questions.new += 1;
      if (project.followupIsNew) projectDetailCountMap.followups.new += 1;
      if (project.toDoIsNew) projectDetailCountMap.todos.new += 1;
      if (project.flagIsNew) projectDetailCountMap.flags.new += 1;
      if (project.completedIsNew) projectDetailCountMap.completed.new += 1;

      if (
        project.reviewIsNew ||
        project.questionsIsNew ||
        project.followupIsNew ||
        project.toDoIsNew ||
        project.flagIsNew ||
        project.completedIsNew
      ) {
        counts[DashMenu.PROJECTS].new.projectPending = 1
      }
      if (project?.question_assignment_assigned_at) {
        projectDetailCountMap.questions.pending += 1;
        setOfPendingQuestions.push(project.id);
      }
      if (project?.review_assigned_at) {
        projectDetailCountMap.reviews.pending += 1;
        setOfPendingQuestions.push(project.id);
      }
      if (project?.todo_assigned_at) {
        projectDetailCountMap.todos.pending += 1;
        setOfPendingQuestions.push(project.id);
      }
      if (current_user.isInvestor) {
        if (project?.flag_updated_at) {
          projectDetailCountMap.flags.pending += 1;
          setOfPendingQuestions.push(project.id);
        }
        if (project?.completed_at) {
          projectDetailCountMap.completed.pending += 1;
          setOfPendingQuestions.push(project.id);
        }
      }
    }
    if (
      ![
        diligenceStatusConstant.NotApproved,
        diligenceStatusConstant.Deleted,
        diligenceStatusConstant.Withdrawn,
        diligenceStatusConstant.Approved,
      ].includes(project.status) &&
      (project.last_sent_followup_timestamp ||
        project.last_received_followup_timestamp)
    ) {
      // append "Follow-up" string so that user can also search by this text in the filter
      project.displayStatus = `${project.displayStatus} Follow-up`;
      projectDetailCountMap.followups.pending += 1;
      setOfPendingQuestions.push(project.id);
    }

    project.overallNew =
      project.reviewIsNew ||
      project.questionsIsNew ||
      project.followupIsNew ||
      project.toDoIsNew;

    if (current_user.isInvestor) {
      project.overallNew =
        project.overallNew || project.flagIsNew || project.completedIsNew;
    }
    allProjectDataCopy[SubMenuFilter.TOTAL].push(project);
    counts[DashMenu.PROJECTS].all[SubMenuFilter.TOTAL] += 1;
    if (
      project?.created_at &&
      moment(project?.created_at).isAfter(
        moment(last_view_time_stamp.projectsTotal)
      )
    ) {
      counts[DashMenu.PROJECTS].new[SubMenuFilter.TOTAL] += 1;
      project.totalIsNew = true;
    }

    if (
      ![
        diligenceStatusConstant.Approved,
        diligenceStatusConstant.NotApproved,
        diligenceStatusConstant.Deleted,
        diligenceStatusConstant.Completed,
        diligenceStatusConstant.Evaluation,
      ].includes(project.status)
    ) {
      // Due this week
      if (isDueThisWeek(project?.due_at, start_due_date, end_due_date)) {
        allProjectDataCopy[SubMenuFilter.DUE_THIS_WEEK].push(project);
        counts[DashMenu.PROJECTS].all[SubMenuFilter.DUE_THIS_WEEK] += 1;
        if (project.overallNew)
          counts[DashMenu.PROJECTS].new[SubMenuFilter.DUE_THIS_WEEK] += 1;
      }
      // overDue
      if (isOverDue(project?.due_at, start_over_due_date, end_over_due_date)) {
        allProjectDataCopy[SubMenuFilter.OVERDUE].push(project);
        counts[DashMenu.PROJECTS].all[SubMenuFilter.OVERDUE] += 1;
        if (project.overallNew)
          counts[DashMenu.PROJECTS].new[SubMenuFilter.OVERDUE] += 1;
      }
    }

    project.projectType = 'total';
    project.as_of_date = this.datePipe.transform(project.as_of_date);
    project.due_at = this.datePipe.transform(project.due_at);
    project.last_updated_at = this.datePipe.transform(project.last_updated_at, ['dvDateTime'])
    project.closed_at = project.closed_at
    ? this.datePipe.transform(project.closed_at, ['dvDateTime'])
    : '';
    return project;
  }
}
