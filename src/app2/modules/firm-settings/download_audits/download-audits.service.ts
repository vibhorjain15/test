import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import {
  DownloadStatus,
  DownloadViewTabs,
  dateSortNew,
  defaultColumn,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';
import { map } from 'rxjs/operators';
import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';

@Injectable({
  providedIn: 'root',
})
export class DownloadAuditGridService {
  downloadStatus = DownloadStatus;
  constructor(
    private readonly http: HttpClient,
    private readonly dvDatePipe: DvDatePipe
  ) {}

  getDownloadAuditGridColDef(selectedTab): ColDef[] {
    const colDef: ColDef[] = [];
    colDef.push({
      ...defaultColumn,
      colId: 'task_name',
      headerName: 'Source',
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
    // colDef.push({
    //   ...defaultColumn,
    //   colId: 'no_of_records',
    //   headerName: 'Records',
    //   field: 'no_of_records',
    //   flex: 1,
    //   minWidth: grid_widths_map.sm_column_sm,
    //   sortable: true,
    // });
    colDef.push({
      ...defaultColumn,
      colId: 'downloaded_by',
      headerName: 'User',
      field: 'downloaded_by',
      flex: 1,
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map.sm_column_sm,
      sortable: true,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search by file name',
      },
      cellRenderer: 'agGroupCellRenderer',
    });
    colDef.push({
      ...defaultColumn,
      colId: 'expiry_date',
      headerName:
        selectedTab == DownloadViewTabs.ACTIVE
          ? 'Expiring In'
          : selectedTab == DownloadViewTabs.EXPIRED
          ? 'Expired On'
          : 'Expiration',
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
      comparator: dateSortNew('downloaded_on'),
      menuTabs: ['generalMenuTab'],
    });
    colDef.push({
      ...defaultColumn,
      colId: 'requested_on',
      headerName: 'Requested On',
      field: 'requested_on',
      flex: 1,
      minWidth: grid_widths_map.sm_column_sm,
      sortable: true,
      sort: 'asc',
      comparator: dateSortNew('requested_on'),
      menuTabs: ['generalMenuTab'],
    });
    return colDef;
  }

  getDownloads(params) {
    return this.http
      .get(`service/dvapi_service/admin_task_file_list`, {
        params: params,
      })
      .pipe(
        map((download: any) => {
          return download.map((resource) => {
            let filename;
            if (resource.status == this.downloadStatus.success) {
              filename = resource.file_data?.reduce(
                (previousValue, currentValue, idx) => {
                  return idx == 0
                    ? currentValue.file_name
                    : previousValue + ', ' + currentValue.file_name;
                },
                ''
              );
            } else if (resource.status == this.downloadStatus.started) {
              filename = '(processing download)';
            } else {
              filename = '(download failed)';
            }
            return {
              file_data: resource.file_data,
              filename: filename,
              expiry_date: resource.expiry_date,
              downloaded_on: resource.downloaded_at
                ? this.dvDatePipe.transform(resource.downloaded_at)
                : null,
              task_id: resource.task_id,
              status: resource.status,
              requested_on: resource.insert_time_stamp
                ? this.dvDatePipe.transform(resource.insert_time_stamp)
                : null,
              task_name: resource.task_name,
              expired: resource.expired,
              is_downloadable: resource.is_downloadable,
              downloaded_by: resource.downloaded_by,
              no_of_records: resource.no_of_records,
            };
          });
        })
      );
  }
}
