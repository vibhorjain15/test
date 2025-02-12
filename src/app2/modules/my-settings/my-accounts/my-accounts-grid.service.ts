import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { map } from 'rxjs/operators';
import {
  defaultColumn,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';

export const getCellClassRules = {
  'loggedin-account ': (params) => {
    return (
      params.data.firm_id === params.data.current_user?.firmInfo?.id &&
      params.data?.status === 'Active'
    );
  },
};

@Injectable({
  providedIn: 'root',
})
export class MyAccountsGridService {
  constructor(private readonly http: HttpClient) {}

  getMyAccountsGridColDef(): ColDef[] {
    const colDef: ColDef[] = [];
    colDef.push({
      ...defaultColumn,
      colId: 'firm_name',
      headerName: 'Firm Name',
      field: 'firm_name',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search by name',
      },
      flex: 1,
      minWidth: grid_widths_map.sm_column_xl,
      suppressColumnsToolPanel: true,
      cellClassRules: getCellClassRules,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'status',
      headerName: 'Status',
      field: 'status',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search by status',
      },
      flex: 1,
      minWidth: grid_widths_map.sm_column_xm,
      resizable: false,
      suppressHeaderMenuButton: true,
      suppressAutoSize: true,
      cellClassRules: getCellClassRules,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'invited_by',
      headerName: 'Invited By',
      field: 'invited_by',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search by user',
      },
      flex: 1,
      minWidth: grid_widths_map.sm_column_lg,
      cellClassRules: getCellClassRules,
    });
    return colDef;
  }

  getMyAccountsGridRowData(userId) {
    return this.http.get(`users/${userId}/associated_firms`).pipe(
      map((response: any) =>
        response.map((account) => ({
          firm_name: account.firm_name,
          firm_id: account.firm_id,
          status: account.status,
          invited_by: account.invited_by_name,
          account,
        }))
      )
    );
  }
}
