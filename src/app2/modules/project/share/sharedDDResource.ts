import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { map } from 'rxjs/operators';
import { RouterService } from 'src/app2/services/router.service';
import {
  dateSortNew,
  defaultColumn,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';
import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';

@Injectable({
  providedIn: 'root',
})
export class ShareDDResourceService {
  constructor(
    private readonly http: HttpClient,
    private readonly routerService: RouterService,
    private readonly dvDatePipe: DvDatePipe
  ) {}

  getMyApprovalGridColDef(): ColDef[] {
    const colDef: ColDef[] = [];
    colDef.push({
      ...defaultColumn,
      colId: 'tofirm_name',
      headerName: 'Investor Name',
      field: 'tofirm_name',
      flex: 1,
      filter: 'agTextColumnFilter',
      menuTabs: ['generalMenuTab'],
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search by name',
      },
      minWidth: grid_widths_map.sm_column_lg,
      suppressColumnsToolPanel: true,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'status',
      headerName: 'Status',
      field: 'status',
      menuTabs: ['generalMenuTab'],
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        innerRenderer: 'ShareStatusComponentRenderer',
      },
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search by status',
      },
      flex: 1,
      resizable: true,
      minWidth: grid_widths_map.sm_column_xm,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'created_by',
      headerName: 'Shared By',
      menuTabs: ['generalMenuTab'],
      field: 'created_by',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search by contact',
      },
      flex: 1,
      resizable: true,
      minWidth: grid_widths_map.sm_column_sm,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'created_at',
      headerName: 'Shared At',
      field: 'created_at',
      flex: 1,
      resizable: true,
      minWidth: grid_widths_map.sm_column_sm,
      cellRenderer: 'agGroupCellRenderer',
      comparator: dateSortNew('created_at_date'),
    });
    colDef.push({
      ...defaultColumn,
      colId: 'lastupdated_at',
      headerName: 'Last Updated',
      field: 'lastupdated_at',
      flex: 1,
      resizable: true,
      minWidth: grid_widths_map.sm_column_sm,
      cellRenderer: 'agGroupCellRenderer',
      comparator: dateSortNew('lastupdated_at_date'),
    });
    colDef.push({
      ...defaultColumn,
      colId: 'acknowledged_at',
      headerName: 'Acknowledged',
      field: 'acknowledged_at',
      flex: 1,
      resizable: true,
      minWidth: grid_widths_map.sm_column_sm,
      cellRenderer: 'agGroupCellRenderer',
      comparator: dateSortNew('acknowledged_at_date'),
    });
    colDef.push({
      ...defaultColumn,
      colId: 'view_count',
      headerName: 'View Count',
      field: 'view_count',
      flex: 1,
      resizable: true,
      minWidth: grid_widths_map.sm_column_sm,
    });
    return colDef;
  }

  getData(duediligence_id) {
    return this.http
      .get(`diligences/share_project`, {
        params: {
          duediligence_id: this.routerService.getState().params.diligenceId,
        },
      })
      .pipe(
        map((response: any) => {
          return response.map((draft: any) => ({
            tofirm_name: draft.tofirm_name,
            id: draft.id,
            status: draft.status,
            created_by: draft.created_by_name,
            project_name: draft.name,
            create_at_date: draft.create_at_date,
            lastupdated_at_date: draft.lastupdated_at,
            acknowledged_at_date: draft.acknowledged_at,
            lastupdated_at: draft.lastupdated_at
              ? this.dvDatePipe.transform(draft.lastupdated_at)
              : 'Never',
            acknowledged_at: draft.acknowledged_at
              ? this.dvDatePipe.transform(draft.acknowledged_at)
              : 'Never',
            view_count: draft.view_count,
            created_at: draft.created_at
              ? this.dvDatePipe.transform(draft.created_at)
              : 'Never',
          }));
        })
      );
  }
}
