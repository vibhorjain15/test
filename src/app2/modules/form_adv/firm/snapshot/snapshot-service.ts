import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import {
  defaultColumn,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';

@Injectable({
  providedIn: 'root',
})
export class snapshotService {
  constructor() {}

  getServiceProvidersColDef(): ColDef[] {
    const colDef: ColDef[] = [];
    colDef.push({
      ...defaultColumn,
      colId: 'normalized_name',
      headerName: 'Service Provider',
      field: 'normalized_name',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      minWidth: grid_widths_map.lg_column_xxm,
      floatingFilterComponent: 'textFloatingFilterComponent',
      suppressColumnsToolPanel: true,
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search by name',
      },
      cellRenderer: 'formAdvServiceProviderNameComponent',
      cellClass: 'text-left',
      flex: 1,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'type',
      headerName: 'Type',
      field: 'type',
      minWidth: grid_widths_map.sm_column_xm,
      floatingFilter: true,
      filter: 'agTextColumnFilter',
      cellRenderer: 'agGroupCellRenderer',
      menuTabs: ['generalMenuTab'],
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search by type',
      },
      cellClass: 'text-center',
      flex: 1,
      suppressColumnsToolPanel: false,
    });
    return colDef;
  }

  getRegulatorsColDef(): ColDef[] {
    const colDef: ColDef[] = [];
    colDef.push({
      ...defaultColumn,
      colId: 'value',
      headerName: 'Regulator / Jurisdiction',
      field: 'value',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      minWidth: grid_widths_map.lg_column_sm,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search regulator',
      },
      cellClass: 'text-left',
      flex: 1,
      suppressColumnsToolPanel: true,
    });
    return colDef;
  }
}
