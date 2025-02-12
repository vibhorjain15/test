import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
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
export class MyFlagScoreService {
  constructor(private readonly dvDatePipe: DvDatePipe) {}

  getActionsColDef(): ColDef[] {
    const colDef: ColDef[] = [];
    colDef.push({
      ...defaultColumn,
      colId: 'entity_name',
      headerName: 'Entity Name',
      field: 'entity_name',
      filter: 'agTextColumnFilter',
      sort: 'asc',
      floatingFilter: true,
      minWidth: grid_widths_map.sm_column_lg,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search',
      },
      suppressColumnsToolPanel: true,
      cellRenderer: 'scoresDDFirmName',
      cellClass: 'text-left',
      flex: 1,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'flag_count',
      headerName: '# of Flags',
      field: 'flag_count',
      cellRenderer: 'scoresFlag',
      minWidth: grid_widths_map.sm_column_xm,
      cellClass: 'text-left',
      flex: 1,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'score',
      headerName: 'Project Score/Rating',
      field: 'score',
      cellRenderer: 'scoresBadge',
      cellClass: 'text-left',
      minWidth: grid_widths_map.sm_column_xm,
      flex: 1,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'as_of_date',
      headerName: 'As of Date',
      field: 'as_of_date',
      cellRenderer: (params) => {
        return this.dvDatePipe.transform(params.value, ['isLocaleDate']);
      },
      comparator: dateSortNew('as_of_date_for_sorting'),
      minWidth: grid_widths_map.sm_column_lg,
    });
    return colDef;
  }
}
