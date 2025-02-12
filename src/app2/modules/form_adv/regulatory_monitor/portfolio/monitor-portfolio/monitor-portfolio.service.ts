import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import {
  defaultColumn,
  grid_widths_map,
  dateSortFilingDate
} from 'src/app2/shared/constants/constant';

@Injectable({
  providedIn: 'root',
})
export class monitorPortfolioService {
  constructor() {}

  getActionsColDef(): ColDef[] {
    const colDef: ColDef[] = [];
    colDef.push({
      ...defaultColumn,
      colId: 'filingDate',
      headerName: 'Filing Date',
      field: 'filingDate',
      filter: 'agTextColumnFilter',
      minWidth: grid_widths_map.sm_column_sm,
      cellClass: 'text-left',
      flex: 1,
      comparator: dateSortFilingDate,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'firmCRD',
      headerName: 'Firm CRD',
      field: 'firmCRD',
      minWidth: grid_widths_map.sm_column_sm,
      floatingFilter: true,
      filter: 'agTextColumnFilter',
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search CRD',
      },
      cellClass: 'text-left',
      flex: 1,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'businessName',
      headerName: 'Firm Name',
      field: 'businessName',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      minWidth: grid_widths_map.lg_column_xxm,
      suppressColumnsToolPanel: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search firm',
      },
      cellRenderer: 'formAdvFirmNameComponent',
      cellClass: 'text-left',
      flex: 1,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'aum',
      headerName: 'Regulatory AUM ($mn)',
      field: 'aum',
      cellRenderer: 'emptyCell',
      minWidth: grid_widths_map.sm_column_sm,
      flex: 1,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'changeCount',
      headerName: '# of changes',
      field: 'changeCount',
      cellRenderer: 'formAdvChangeCountComponent',
      minWidth: grid_widths_map.sm_column_sm,
      flex: 1,
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
      minWidth: grid_widths_map.sm_column_sm,
      filter: 'agTextColumnFilter',
      floatingFilterComponent: 'textFloatingFilterComponent',
      cellRenderer: 'FormAdvBrochureUrlComponent',
      cellClass: 'text-left',
      flex: 1,
    });
    return colDef;
  }
}
