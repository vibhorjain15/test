import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import {
  defaultColumn,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';

@Injectable({
  providedIn: 'root',
})
export class ReviewGridService {
  constructor() {}

  getMyReviewGridColDef(): ColDef[] {
    const colDef: ColDef[] = [];
    colDef.push({
      ...defaultColumn,
      colId: 'name',
      headerName: 'Entity',
      field: 'name',
      filter: 'agTextColumnFilter',
      menuTabs: ['generalMenuTab'],
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search Entity',
      },
      flex: 1,
      minWidth: grid_widths_map.sm_column_sm,
      suppressColumnsToolPanel: true,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'template',
      headerName: 'Template(s)',
      menuTabs: ['generalMenuTab'],
      field: 'template',
      filter: 'agTextColumnFilter',
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        innerRenderer: 'GridLabelCellComponent',
      },
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search Templates',
      },
      flex: 1,
      minWidth: grid_widths_map.sm_column_sm,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'notification_contacts',
      headerName: 'Associated Contact(s)',
      field: 'notification_contacts',
      filter: 'agTextColumnFilter',
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        innerRenderer: 'GridLabelCellComponent',
      },
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search Contacts',
      },
      flex: 1,
      minWidth: grid_widths_map.sm_column_xxm,
    });
    return colDef;
  }
}
