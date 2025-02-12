import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { map } from 'rxjs/operators';
import {
  defaultColumn,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';

@Injectable({
  providedIn: 'root',
})
export class AccessLevelsService {
  constructor(private readonly http: HttpClient) {}
  getAccessLevelsColDef(): ColDef[] {
    const colDef: ColDef[] = [];
    colDef.push({
      ...defaultColumn,
      colId: 'alias',
      headerName: 'Name',
      field: 'alias',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search Name',
      },
      minWidth: grid_widths_map.sm_column_sm,
      suppressColumnsToolPanel: true,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'description',
      headerName: 'Description',
      field: 'description',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search Description',
      },
      cellRenderer: 'descriptionCellRenderer',
      minWidth: grid_widths_map.sm_column_lg,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'users',
      headerName: '# of Users',
      field: 'users',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search User Count',
      },
      minWidth: grid_widths_map.sm_column_xxm,
    });
    return colDef;
  }
  getAccessLevelsRowData(firmId: number) {
    const params = {
      include_admins: true,
      get_user_count: true,
    };
    return this.http.get(`firms/${firmId}/roles`, { params: params }).pipe(
      map((response: any) => {
        return response.map((role) => ({
          users: role.user_count,
          alias: role.alias,
          description: role.description,
          id: role.id,
          can_clone: role.can_clone,
          firm_id: role.firm_id,
          role_configuration: role.role_configuration,
          name: role.name,
        }));
      })
    );
  }
}
