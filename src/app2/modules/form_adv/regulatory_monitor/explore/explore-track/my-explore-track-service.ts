import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import {
  defaultColumn,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';

@Injectable({
  providedIn: 'root',
})
export class exploreTrackService {
  constructor() {}

  getActionsColDef(): ColDef[] {
    const colDef: ColDef[] = [];
    colDef.push({
      ...defaultColumn,
      colId: 'businessName',
      headerName: 'Firm Name',
      field: 'businessName',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      minWidth: grid_widths_map.lg_column_lg,
      suppressColumnsToolPanel: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search firm',
      },
      cellRenderer: 'formAdvFirmNameComponent',
    });
    colDef.push({
      ...defaultColumn,
      colId: 'firmCRD',
      headerName: 'Firm CRD',
      field: 'firmCRD',
      minWidth: grid_widths_map.sm_column_lg,
      floatingFilter: true,
      filter: 'agTextColumnFilter',
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search CRD',
      },
    });
    colDef.push({
      ...defaultColumn,
      colId: 'headquarter',
      headerName: 'Headquarter',
      field: 'headquarter',
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map.sm_column_lg,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'material_changes',
      headerName: 'Has Material Changes',
      field: 'material_changes',
      // TODO: Add dropdown filter
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'dropdownFloatingYesnoFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
      },
      minWidth: grid_widths_map.sm_column_lg,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'brochure_url',
      headerName: 'Part 2A Brochure',
      field: 'brochure_url',
      cellRenderer: 'FormAdvBrochureUrlComponent',
      minWidth: grid_widths_map.sm_column_lg,
    });
    return colDef;
  }
}
