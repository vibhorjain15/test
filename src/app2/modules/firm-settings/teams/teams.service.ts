import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { map } from 'rxjs/operators';
import {
  dateSort,
  dateSortNew,
  defaultColumn,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';
import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';

@Injectable({
  providedIn: 'root',
})
export class TeamsService {
  constructor(
    private readonly http: HttpClient,
    private readonly dvDatePipe: DvDatePipe
  ) {}
  getTeamsColDef(): ColDef[] {
    const colDef: ColDef[] = [];
    colDef.push({
      ...defaultColumn,
      colId: 'team',
      headerName: 'Team',
      field: 'team',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search Team',
      },
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map.sm_column_lg,
      rowGroup: true,
      hide: true,
      suppressColumnsToolPanel: true,
      cellClass: 'my-permission-cursor-pointer',
    });
    colDef.push({
      ...defaultColumn,
      colId: 'members',
      headerName: 'Members',
      field: 'members',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search Members',
      },
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map.sm_column_lg,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'role',
      headerName: 'Access Level',
      field: 'role',
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map.sm_column_lg,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'last_updated',
      headerName: 'Last Updated',
      field: 'last_updated',
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map.sm_column_lg,
      comparator: dateSortNew('last_updated_at'),
    });
    return colDef;
  }
  getTeamsRowData(firmId: number) {
    return this.http.get(`firms/${firmId}/TeamMemberships`).pipe(
      map((response: any) => {
        return response.map((team) => ({
          team_id: team.team_id,
          team: team.team_name,
          members: team.user_name,
          role: team.role_name ?? '',
          last_updated: team.updated_at
            ? this.dvDatePipe.transform(team.updated_at)
            : team.created_at
            ? this.dvDatePipe.transform(team.created_at)
            : '',
          entity_id: team.user_id ? team.user_id : team.team_id,
          entity_type: team.user_id ? 'User' : 'Team',
          entity_name: team.user_id ? team.user_name : team.team_name,
          last_updated_at: team.updated_at ?? team.created_at,
        }));
      })
    );
  }
}
