import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { forkJoin } from 'rxjs';
import {
  dateSort,
  dateSortNew,
  defaultColumn,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';

@Injectable({
  providedIn: 'root',
})
export class WorkflowService {
  constructor(private readonly http: HttpClient) {}
  getWorkflowColDef(): ColDef[] {
    const colDef: ColDef[] = [];
    colDef.push({
      ...defaultColumn,
      colId: 'name',
      headerName: 'Name',
      field: 'name',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search...',
      },
      minWidth: grid_widths_map.sm_column_sm,
      cellRenderer: 'workflowNameCellRenderer',
      suppressColumnsToolPanel: true,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'reference_entity',
      headerName: 'Reference Entity',
      field: 'reference_entity',
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map.sm_column_sm,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'tag',
      headerName: 'Tag',
      field: 'tag',
      minWidth: grid_widths_map.sm_column_sm,
      cellRenderer: 'workflowTagsCellRenderer',
    });
    colDef.push({
      ...defaultColumn,
      colId: 'usage',
      headerName: 'Usage',
      field: 'usage',
      minWidth: grid_widths_map.sm_column_sm,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'last_updated',
      headerName: 'Last Updated',
      field: 'last_updated',
      minWidth: grid_widths_map.sm_column_sm,
      comparator: dateSortNew('last_updated_at'),
    });
    return colDef;
  }
  getWorkflowRowData() {
    return forkJoin([
      this.http.get(`workflows`),
      this.http.get(`document_tag_definitions`),
    ]);
  }
}
