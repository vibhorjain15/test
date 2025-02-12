import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { map } from 'rxjs/operators';
import { UtilsService } from 'src/app2/services/utils.service';
import {
  defaultColumn,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';

@Injectable({
  providedIn: 'root',
})
export class MyAdminsGridService {
  constructor(private readonly http: HttpClient, private readonly utilsService: UtilsService) {}

  getMyPermissionGridColDef(): ColDef[] {
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
        placeHolder: 'Search by name',
      },
      flex: 1,
      minWidth: grid_widths_map.sm_column_sm,
      suppressColumnsToolPanel: true,
      cellRenderer: 'myAdminNameActionCellRenderer',
      sortable: true,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'email',
      headerName: 'Email',
      field: 'email',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search by email',
      },
      flex: 1,
      cellRenderer: 'myAdminEmailActionCellRenderer',
      minWidth: grid_widths_map.sm_column_sm,
      sortable: true,
    });
    
    colDef.push({
      ...defaultColumn,
      colId: 'type',
      headerName: 'Type',
      field: 'type',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search by type',
      },
      flex: 1,
      cellRenderer: 'myAdminTypeCellRenderer',
      minWidth: grid_widths_map.sm_column_sm,
      sortable: true,
    });
    return colDef;
  }

  getMyPermissionGridRowData() {
    return this.http.get(`myadmins`).pipe(
      map((response: any) =>
        response.map((resource) => ({
          name: resource.fullName,
          email: resource.email,
          type: this.utilsService.getDisplayUserRole(resource.firmwide_role_name)
        }))
      )
    );
  }
}
