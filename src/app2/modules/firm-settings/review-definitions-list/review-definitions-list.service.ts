import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { forkJoin } from 'rxjs';
import {
  dateSort,
  dateSortNew,
  defaultColumn,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';

@Injectable({
  providedIn: 'root',
})
export class ReviewDefinitionsListService {
  constructor(private readonly http: HttpClient) {}
  getReviewDefinitionColDef(): ColDef[] {
    const colDef: ColDef[] = [];
    colDef.push({
      ...defaultColumn,
      colId: 'name',
      headerName: 'Name',
      field: 'name',
      minWidth: grid_widths_map.sm_column_sm,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      cellRenderer: 'reviewDefinitionsNameRenderer',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search',
      },
      suppressColumnsToolPanel: true,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'created_by_name',
      headerName: 'Created By',
      field: 'created_by_name',
      minWidth: grid_widths_map.sm_column_sm,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search',
      },
    });
    colDef.push({
      ...defaultColumn,
      colId: 'updated_by_name',
      headerName: 'Last Updated By',
      field: 'updated_by_name',
      minWidth: grid_widths_map.sm_column_sm,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'updated_at',
      headerName: 'Last Updated',
      field: 'updated_at',
      minWidth: grid_widths_map.sm_column_xm,
      cellClass: 'my-permission-cursor-pointer',
      comparator: dateSortNew('updated_at_date'),
    });
    return colDef;
  }
}
