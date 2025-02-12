import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import {
  DownloadViewTabs,
  dateSortNew,
  defaultColumn,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';
import { DvDatePipe } from '../../pipes/dv-date.pipe';

@Injectable({
  providedIn: 'root',
})
export class MyDownloadsGridService {
  constructor(private readonly dvDatePipe: DvDatePipe) {}

  getMyDownloadsGridColDef(selectedTab): ColDef[] {
    const colDef: ColDef[] = [];
    colDef.push({
      ...defaultColumn,
      colId: 'task_name',
      headerName: 'Type',
      field: 'task_name',
      flex: 1,
      minWidth: grid_widths_map.sm_column_sm,
      menuTabs: ['generalMenuTab'],
      sortable: true,
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        innerRenderer: 'commonTagsRenderer',
      },
    });
    colDef.push({
      ...defaultColumn,
      colId: 'expiry_date',
      headerName:
        selectedTab == DownloadViewTabs.ACTIVE ? 'Expiring In' : 'Expired On',
      field: 'expiry_date',
      flex: 1,
      minWidth: grid_widths_map.sm_column_sm,
      sortable: true,
      cellRenderer: 'myDownloadExpiryRenderer',
      cellRendererParams: {
        expired: selectedTab == DownloadViewTabs.EXPIRED,
      },
      comparator: dateSortNew('expiry_date'),
    });
    colDef.push({
      ...defaultColumn,
      colId: 'downloaded_on',
      headerName: 'Downloaded On',
      field: 'downloaded_on',
      flex: 1,
      minWidth: grid_widths_map.sm_column_sm,
      sortable: true,
      cellRenderer: (params) => {
        return this.dvDatePipe.transform(params.value);
      },
      comparator: dateSortNew('downloaded_on'),
    });
    colDef.push({
      ...defaultColumn,
      colId: 'requested_on',
      headerName: 'Requested On',
      field: 'requested_on',
      flex: 1,
      minWidth: grid_widths_map.sm_column_sm,
      sortable: true,
      sort: selectedTab == DownloadViewTabs.ACTIVE ? 'desc' : 'asc',
      cellRenderer: (params) => {
        return this.dvDatePipe.transform(params.value);
      },
      comparator: dateSortNew('requested_on'),
    });
    return colDef;
  }
}
