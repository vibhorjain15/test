import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { forkJoin } from 'rxjs';
import {
  dateSortNew,
  defaultColumn,
  grid_widths_map,
} from '../shared/constants/constant';
import { BaseDataService } from './base-data.service';

@Injectable({
  providedIn: 'root',
})
export class ExcelSyncService {
  constructor(
    private readonly http: HttpClient,
    private readonly baseDataService: BaseDataService
  ) {}

  getExcelSyncColDef(): ColDef[] {
    const colDef: ColDef[] = [];
    colDef.push({
      ...defaultColumn,
      colId: 'file_name',
      headerName: 'File Name',
      field: 'file_name',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search File Name',
      },
      minWidth: grid_widths_map['sm_column_xxl'],
      cellRenderer: 'excelSyncFileNameComponent',
      suppressColumnsToolPanel: true,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'status',
      headerName: 'Status',
      field: 'status',
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map['sm_column_xm'],
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        innerRenderer: 'excelSyncStatusCellRenderer',
      },
    });
    colDef.push({
      ...defaultColumn,
      colId: 'client',
      headerName: 'Client',
      field: 'client',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search Client',
      },
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map['sm_column_lg'],
    });
    colDef.push({
      ...defaultColumn,
      colId: 'questionnaire',
      headerName: 'Questionnaire',
      field: 'questionnaire',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search Questionnaire',
      },
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map['sm_column_lg'],
    });
    colDef.push({
      ...defaultColumn,
      colId: 'projects',
      headerName: 'Projects',
      field: 'projects',
      minWidth: grid_widths_map['sm_column_xm'],
    });
    colDef.push({
      ...defaultColumn,
      colId: 'downloaded_by',
      headerName: 'Downloaded by',
      field: 'downloaded_by',
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map['sm_column_sm'],
    });
    colDef.push({
      ...defaultColumn,
      colId: 'downloaded_on',
      headerName: 'Downloaded on',
      field: 'downloaded_on',
      minWidth: grid_widths_map['sm_column_xm'],
      comparator: dateSortNew('downloaded_at'),
    });
    colDef.push({
      ...defaultColumn,
      colId: 'uploaded_by',
      headerName: 'Uploaded by',
      field: 'uploaded_by',
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map['sm_column_sm'],
    });
    colDef.push({
      ...defaultColumn,
      colId: 'uploaded_on',
      headerName: 'Uploaded on',
      field: 'uploaded_on',
      minWidth: grid_widths_map['sm_column_xm'],
      cellClass: 'center',
      comparator: dateSortNew('uploaded_at'),
    });
    return colDef;
  }

  getExcelSyncRowData() {
    return forkJoin([
      this.http.get(`excelsynctransactions`),
      this.baseDataService.getTeamMembers(),
    ]);
  }
}
