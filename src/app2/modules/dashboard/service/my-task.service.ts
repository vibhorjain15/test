import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import {
  defaultColumn,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';

@Injectable({
  providedIn: 'root',
})
export class MyTaskService {
  constructor(private readonly datePipe: DatePipe) {}

  getActionsColDef(subType = ''): ColDef[] {
    const colDef: ColDef[] = [];
    colDef.push({
      ...defaultColumn,
      colId: 'text',
      headerName: 'Task Text',
      field: 'text',
      minWidth: grid_widths_map.sm_column_lg,
      cellClass: 'text-left',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search task text',
      },
      suppressColumnsToolPanel: true,
      resizable: false,
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        innerRenderer: 'MyWorkRowBadgeComponentRenderer',
      },
    });
    colDef.push({
      ...defaultColumn,
      colId: 'action_label',
      headerName: 'Task Type',
      field: 'action_label',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'dropdownFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search task type',
        selectOptions: [
          { value: 'Approve', label: 'Approve' },
          { value: 'General', label: 'General' },
          { value: 'Update', label: 'Update' },
          { value: 'Add Note', label: 'Add Note' },
          { value: 'Follow-up', label: 'Follow-up' },
          { value: 'Research', label: 'Research' },
          { value: 'Review', label: 'Review' },
        ],
      },
      cellRenderer: 'agGroupCellRenderer',

      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map.sm_column_lg,
      cellRendererParams: {
        innerRenderer: 'TaskTypeComponentRenderer',
      },
    });
    colDef.push({
      ...defaultColumn,
      colId: 'entity_name',
      headerName: 'Associated Entity',
      field: 'entity_name',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      minWidth: grid_widths_map.sm_column_lg,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search entity',
      },
      suppressColumnsToolPanel: true,
      menuTabs: ['generalMenuTab'],
      cellClass: 'text-left',
      flex: 1,
    });

    colDef.push({
      ...defaultColumn,
      colId: 'entity_type_label',
      headerName: 'Entity Type',
      field: 'entity_type_label',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'dropdownFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search entity type',
        selectOptions: [
          { value: 'Firm', label: 'Firm' },
          { value: 'Strategy', label: 'Strategy' },
          { value: 'Product', label: 'Product' },
          { value: 'Vehicle', label: 'Vehicle' },
          { value: 'Contact', label: 'Contact' },
          { value: 'Document', label: 'Document' },
        ],
      },
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map.sm_column_lg,
      cellRendererParams: {
        innerRenderer: 'DvRelationshipStatusTagComponentRenderer',
      },
      cellRenderer: 'agGroupCellRenderer',
    });
    colDef.push({
      ...defaultColumn,
      colId: 'assigned_by',
      headerName: 'Assigned By',
      field: 'assigned_by',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      minWidth: grid_widths_map.sm_column_lg,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search',
      },
      menuTabs: ['generalMenuTab'],
      suppressColumnsToolPanel: true,
      cellClass: 'text-left',
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

    return colDef;
  }
}
