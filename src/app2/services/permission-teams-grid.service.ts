import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { map } from 'rxjs/operators';
import { defaultColumn, grid_widths_map } from '../shared/constants/constant';

@Injectable({
  providedIn: 'root',
})
export class PermissionTeamsGridService {
  constructor(private readonly http: HttpClient) {}
  getPermissionTeamsColDef(entity_type: string): ColDef[] {
    const colDef: ColDef[] = [];
    colDef.push({
      colId: 'selectAll',
      field: 'selectAll',
      checkboxSelection: true,
      headerCheckboxSelection: true,
      headerCheckboxSelectionFilteredOnly: true,
      lockPosition: true,
      suppressColumnsToolPanel: true,
      width: 50,
      headerClass: 'my-permission-checkbox',
      cellClass: 'my-permission-checkbox',
      resizable: false,
      suppressHeaderMenuButton: true,
      suppressAutoSize: true,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'name',
      headerName: 'Name',
      field: entity_type === 'User' ? 'name' : 'user_name',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search by name',
      },
      flex: 1,
      minWidth: grid_widths_map.sm_column_sm,
      suppressColumnsToolPanel: true,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'role',
      headerName: 'Access Level',
      field: 'role',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search by Access Level',
      },
      flex: 1,
      minWidth: grid_widths_map.sm_column_xxm,
    });
    return colDef;
  }
  getPermissionTeamsRowData(firmId, id, isUser = true) {
    return this.http
      .get(
        `firms/${firmId}/${isUser ? 'users' : 'Teams'}/${id}/TeamMemberships`
      )
      .pipe(
        map((response: any) =>
          response.map((team) => ({
            name: team.team_name,
            user_name: team.user_name,
            role: team.role_name,
            team: team,
          }))
        )
      );
  }
}
