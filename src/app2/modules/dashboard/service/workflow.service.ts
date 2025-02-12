import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import {
  dateSortNew,
  defaultColumn,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';

@Injectable({
  providedIn: 'root',
})
export class WorkflowService {
  constructor() {}

  getActionsColDef(): ColDef[] {
    const colDef: ColDef[] = [];
    colDef.push({
      ...defaultColumn,
      colId: 'name',
      headerName: 'Name',
      field: 'name',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      minWidth: grid_widths_map.sm_column_sm,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search',
      },
      suppressColumnsToolPanel: true,
      cellRenderer: 'workflowNameCellRenderer',
      cellClass: 'my-permission-cursor-pointer text-left',
      flex: 1,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'status',
      headerName: 'Status',
      floatingFilter: true,
      filter: 'agTextColumnFilter',
      field: 'status',
      cellRendererParams: {},
      floatingFilterComponent: 'textFloatingFilterComponent',
      cellRenderer: 'agGroupCellRenderer',
      menuTabs: ['generalMenuTab'],
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search status',
      },
      cellClass: 'my-permission-cursor-pointer text-left',
      minWidth: grid_widths_map.sm_column_sm,
      flex: 1,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'latest_step_name',
      headerName: 'Current step',
      field: 'latest_step_name',
      cellRenderer: 'workflowLastStep',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search current step',
      },
      filter: 'agTextColumnFilter',
      cellClass: 'my-permission-cursor-pointer text-left',
      minWidth: grid_widths_map.sm_column_sm,
      flex: 1,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'due_at',
      headerName: 'Due Date',
      field: 'due_at',
      cellRendererParams: {},
      cellClass: 'my-permission-cursor-pointer text-left',
      cellRenderer: 'functionDDDdueDateRenderer',
      comparator: dateSortNew('due_at_date'),
      minWidth: grid_widths_map.sm_column_sm,
      flex: 1,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'updated_at',
      headerName: 'Last updated',
      field: 'updated_at',
      cellRenderer: 'lastUpdated',
      minWidth: grid_widths_map.sm_column_sm,
      comparator: dateSortNew('updated_at_date'),
      flex: 1,
      cellClass: 'my-permission-cursor-pointer text-left',
    });
    colDef.push({
      ...defaultColumn,
      colId: 'pct_complete',
      headerName: '% Complete',
      field: 'pct_complete',
      cellRenderer: 'progressBarRenderer',
      cellClass: 'my-permission-cursor-pointer text-left',
      minWidth: grid_widths_map.sm_column_sm,
      flex: 1,
    });
    colDef.push({
      ...defaultColumn,
      floatingFilter: true,
      filter: 'agTextColumnFilter',
      colId: 'entity_name',
      headerName: 'Entity Name',
      field: 'entity_name',
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search entity name',
      },
      menuTabs: ['generalMenuTab'],
      cellRenderer: 'agGroupCellRenderer',
      cellClass: 'my-permission-cursor-pointer text-left',
      minWidth: grid_widths_map.sm_column_sm,
      flex: 1,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'entity_type',
      headerName: 'Type',
      floatingFilter: true,
      filter: 'agTextColumnFilter',
      field: 'entity_type',
      floatingFilterComponent: 'textFloatingFilterComponent',
      cellRenderer: 'agGroupCellRenderer',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search type',
      },
      cellClass: 'my-permission-cursor-pointer text-left',
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map.sm_column_sm,
      flex: 1,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'owner_name',
      headerName: 'Owner',
      field: 'owner_name',
      cellClass: 'my-permission-cursor-pointer text-left',
      menuTabs: ['generalMenuTab'],
      cellRenderer: 'agGroupCellRenderer',
      minWidth: grid_widths_map.sm_column_lg,
      flex: 1,
    });

    return colDef;
  }

  getMyWorkflowColDef(): ColDef[] {
    const colDef: ColDef[] = [];

    colDef.push({
      ...defaultColumn,
      colId: 'name',
      headerName: 'Workflow Name',
      field: 'name',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      minWidth: grid_widths_map.sm_column_lg,
      resizable: false,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search workflow name',
      },
      suppressColumnsToolPanel: true,
      cellRenderer: 'workflowNameCellRenderer',
      cellClass: 'my-permission-cursor-pointer text-left',
    });

    colDef.push({
      ...defaultColumn,
      floatingFilter: true,
      filter: 'agTextColumnFilter',
      colId: 'entity_name',
      headerName: 'Entity Name',
      field: 'entity_name',
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search entity name',
      },
      menuTabs: ['generalMenuTab'],
      cellClass: 'my-permission-cursor-pointer text-left',
      minWidth: grid_widths_map.sm_column_sm,
      flex: 1,
    });

    colDef.push({
      ...defaultColumn,
      colId: 'due_at',
      headerName: 'Due Date',
      field: 'due_at',
      minWidth: grid_widths_map.sm_column_lg,
      cellClass: '',
    });

    colDef.push({
      ...defaultColumn,
      colId: 'pct_complete_statusLabel',
      headerName: 'Progress % and Status',
      field: 'pct_complete_statusLabel',
      cellRenderer: 'newProgressBarRenderer',
      minWidth: grid_widths_map.sm_column_lg,
      flex: 1,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'dropdownFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search Type',
        selectOptions: [
          { value: 'In Progress', label: 'In Progress' },
          { value: 'Completed', label: 'Completed' },
        ],
      },
    });

    colDef.push({
      ...defaultColumn,
      colId: 'last_updated_at',
      headerName: 'Last Activity On',
      field: 'last_updated_at',
      cellRendererParams: {},
      cellRenderer: 'workflowActivityRenderer',
      minWidth: grid_widths_map.sm_column_sm,
      flex: 1,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'owner_name',
      headerName: 'Primary Owners',
      field: 'owner_name',
      minWidth: grid_widths_map.sm_column_sm,
      menuTabs: ['generalMenuTab'],
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        innerRenderer: 'workflowOwnersRenderer',
      },
      flex: 1,
    });

    colDef.push({
      ...defaultColumn,
      colId: 'entity_type_label',
      headerName: 'Workflow Type',
      field: 'entity_type_label',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'dropdownFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search Type',
        selectOptions: [
          { value: 'Firm', label: 'Firm' },
          { value: 'Strategy', label: 'Strategy' },
          { value: 'Product', label: 'Product' },
          { value: 'Vehicle', label: 'Vehicle' },
          { value: 'Project', label: 'Project' },
          { value: 'Document', label: 'Document' },
          { value: 'FormADV', label: 'FormADV' },
        ],
      },
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map.sm_column_lg,
      cellRendererParams: {
        innerRenderer: 'DvRelationshipStatusTagComponentRenderer',
      },
      cellRenderer: 'agGroupCellRenderer',
      flex: 1,
    });

    return colDef;
  }
}
