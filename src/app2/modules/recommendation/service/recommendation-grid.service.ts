import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import {
  dateSortNew,
  defaultColumn,
  grid_widths_map,
  IssueType,
} from 'src/app2/shared/constants/constant';

@Injectable({
  providedIn: 'root',
})
export class RecommendationService {
  constructor(private readonly datePipe: DatePipe) {}

  getRecommendationGridColumn(entity_type, isInvestor, firm_preferences, isDashboard): ColDef[] {
    const colDef: ColDef[] = [];
    colDef.push({
      ...defaultColumn,
      colId: 'entity_name',
      headerName: 'Associated Name',
      field: 'entity_name',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search',
      },
      menuTabs: ['generalMenuTab'],
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        innerRenderer: 'associatedNameCellRenderer',
      },
      minWidth: grid_widths_map.sm_column_lg,
      resizable: false,
      cellClass: 'my-permission-cursor-pointer',
    });
    colDef.push({
      ...defaultColumn,
      colId: 'subject',
      headerName: firm_preferences
        ? firm_preferences?.issue_tracker_default_name
        : 'Recommendations',
      field: 'subject',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search',
      },
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        innerRenderer: 'IssueTagComponentRenderer',
      },
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map.sm_column_xl,
      suppressColumnsToolPanel: true,
      cellClass: 'my-permission-cursor-pointer',
    });

    colDef.push({
      ...defaultColumn,
      colId: 'entity_type',
      headerName: 'Type',
      field: 'entity_display_type',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search',
      },
      menuTabs: ['generalMenuTab'],
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        innerRenderer: 'DvRelationshipStatusTagComponentRenderer',
      },
      minWidth: grid_widths_map.sm_column_xm,
      flex: 1,
      cellClass: 'my-permission-cursor-pointer',
    });

    colDef.push({
      ...defaultColumn,
      colId: 'priorityName',
      headerName: 'Priority',
      field: 'priorityName',
      filter: 'agTextColumnFilter',
      filterParams: {},
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search',
      },
      menuTabs: ['generalMenuTab'],
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        innerRenderer: 'IssueTagComponentRenderer',
      },
      minWidth: grid_widths_map.sm_column_xm,
      flex: 1,
      cellClass: 'my-permission-cursor-pointer',
    });

    colDef.push({
      ...defaultColumn,
      colId: 'statusName',
      headerName: 'Status',
      field: 'statusName',
      filter: 'agTextColumnFilter',
      filterParams: {},
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search',
      },
      menuTabs: ['generalMenuTab'],
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        innerRenderer: 'IssueTagComponentRenderer',
      },
      minWidth: grid_widths_map.sm_column_xm,
      flex: 1,
      cellClass: 'my-permission-cursor-pointer',
    });

    if (isDashboard) {
      colDef.push({
        ...defaultColumn,
        colId: 'associated_entity_name',
        headerName: 'Entity Name',
        field: 'associated_entity_name',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        floatingFilterComponent: 'textFloatingFilterComponent',
        floatingFilterComponentParams: {
          suppressFilterButton: true,
          placeHolder: 'Search',
        },
        menuTabs: ['generalMenuTab'],
        cellRenderer: 'agGroupCellRenderer',
        cellRendererParams: {
          innerRenderer: 'CellHtmlRenderer',
        },
        minWidth: grid_widths_map.sm_column_sm,
        flex: 1,
        cellClass: 'my-permission-cursor-pointer',
      });
    }
    if (entity_type != IssueType.Project) {
      colDef.push({
        ...defaultColumn,
        colId: 'project_name',
        headerName: isInvestor ? 'Project' : 'Project/Questionnaire',
        field: 'project_name',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        floatingFilterComponent: 'textFloatingFilterComponent',
        floatingFilterComponentParams: {
          suppressFilterButton: true,
          placeHolder: 'Search',
        },
        menuTabs: ['generalMenuTab'],
        cellRenderer: 'agGroupCellRenderer',
        cellRendererParams: {
          innerRenderer: 'CellHtmlRenderer',
        },
        minWidth: grid_widths_map.sm_column_sm,
        flex: 1,
        cellClass: 'my-permission-cursor-pointer',
      });
    }
    if (entity_type != IssueType.Project && !isInvestor) {
      colDef.push({
        ...defaultColumn,
        colId: 'client_name',
        headerName: 'Client Name',
        field: 'client_name',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        floatingFilterComponent: 'textFloatingFilterComponent',
        floatingFilterComponentParams: {
          suppressFilterButton: true,
          placeHolder: 'Search',
        },
        menuTabs: ['generalMenuTab'],
        cellRenderer: 'agGroupCellRenderer',
        cellRendererParams: {
          innerRenderer: 'CellHtmlRenderer',
        },
        minWidth: grid_widths_map.sm_column_sm,
        flex: 1,
        cellClass: 'my-permission-cursor-pointer',
      });
    }

    colDef.push({
      ...defaultColumn,
      colId: 'is_external_label',
      headerName: 'Visibility',
      field: 'is_external_label',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search',
      },
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map.sm_column_xm,
      flex: 1,
      cellClass: 'my-permission-cursor-pointer',
      suppressColumnsToolPanel: false,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'tag',
      headerName: 'Tags',
      field: 'tag',
      filter: 'agTextColumnFilter',
      filterParams: {},
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search',
      },
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        innerRenderer: 'IssueTagsComponentRenderer',
      },
      minWidth: grid_widths_map.sm_column_sm,
      flex: 1,
      cellClass: 'my-permission-cursor-pointer',
    });
    colDef.push({
      ...defaultColumn,
      colId: 'assigned_to_name',
      headerName: 'Assigned to',
      field: 'assigned_to_name',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search',
      },
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map.sm_column_xm,
      cellClass: 'my-permission-cursor-pointer',
    });
    colDef.push({
      ...defaultColumn,
      colId: 'due_date',
      headerName: 'Resolution Date',
      field: 'due_date',
      cellRenderer: 'MediumDateCellRenderer',
      cellRendererParams: {},
      minWidth: grid_widths_map.sm_column_xm,
      cellClass: 'my-permission-cursor-pointer',
      comparator: dateSortNew('due_date'),
    });
    colDef.push({
      ...defaultColumn,
      colId: 'created_date',
      headerName: 'As Of Date',
      field: 'created_date',
      cellRenderer: 'MediumDateCellRenderer',
      cellRendererParams: {},
      minWidth: grid_widths_map.sm_column_xm,
      cellClass: 'my-permission-cursor-pointer',
    });
    colDef.push({
      ...defaultColumn,
      colId: 'reported_by_name',
      headerName: 'Reported By',
      field: 'reported_by_name',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search',
      },
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map.sm_column_xm,
      cellClass: 'my-permission-cursor-pointer',
    });
    return colDef;
  }
}
