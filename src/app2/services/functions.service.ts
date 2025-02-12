import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { defaultColumn, grid_widths_map } from '../shared/constants/constant';

@Injectable({
  providedIn: 'root',
})
export class FunctionsService {
  constructor(private http: HttpClient) {}

  getFunctionsColDef(): ColDef[] {
    const colDef: ColDef[] = [];
    colDef.push({
      colId: 'selectAll',
      field: 'selectAll',
      checkboxSelection: true,
      headerCheckboxSelection: true,
      headerCheckboxSelectionFilteredOnly: true,
      lockPosition: true,
      width: 50,
      cellClass: 'my-permission-checkbox',
      headerClass: 'my-permission-checkbox',
      suppressColumnsToolPanel: true,
      resizable: false,
      suppressHeaderMenuButton: true,
      suppressAutoSize: true,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'function_name',
      headerName: 'Name',
      field: 'function_name',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      minWidth: grid_widths_map.sm_column_sm,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search...',
      },
      flex: 1,
      suppressColumnsToolPanel: true,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'user_assignment_names',
      headerName: 'Team Members',
      field: 'user_assignment_names',
      cellRenderer: 'functionUsersRenderer',
      cellRendererParams: {},
      minWidth: grid_widths_map.lg_column_xl,
      flex: 1,
    });
    return colDef;
  }

  getFunctions(entityId: number, entityType: string) {
    return this.http.get(
      `function_assignments?entity_id=${entityId}&entity_type=${entityType}`
    );
  }

  editFunctions(params) {
    return this.http.put(`functions`, params);
  }
}

export interface UserAssigment {
  user_id: number;
  user_name: string;
}

export interface functionType {
  function_id: number;
  function_name: string;
  assigned_to_function?: any;
  user_assigments: UserAssigment[];
}
