import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { defaultColumn, grid_widths_map } from '../shared/constants/constant';

@Injectable({
  providedIn: 'root',
})
export class MfwGridService {
  constructor(private readonly http: HttpClient) {}

  getMfwGridColDef(): ColDef[] {
    const colDef: ColDef[] = [];
    colDef.push({
      ...defaultColumn,
      colId: 'created_at',
      headerName: 'Report Date',
      field: 'created_at',
      minWidth: grid_widths_map.sm_column_sm,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'identifier',
      headerName: 'ISIN',
      field: 'identifier',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      minWidth: grid_widths_map.sm_column_lg,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'ISIN',
      },
    });
    colDef.push({
      ...defaultColumn,
      colId: 'fund_name',
      headerName: 'Fund Name',
      field: 'fund_name',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      minWidth: grid_widths_map.sm_column_lg,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Fund Name',
      },
    });
    colDef.push({
      ...defaultColumn,
      colId: 'rating',
      headerName: 'Rating (Stars)',
      field: 'rating',
      minWidth: grid_widths_map.sm_column_lg,
      menuTabs: ['generalMenuTab'],
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        innerRenderer: 'mfwRatingsRenderer',
      },
    });
    colDef.push({
      ...defaultColumn,
      colId: 'esg_rating',
      headerName: 'ESG Rating',
      field: 'esg_rating',
      minWidth: grid_widths_map.sm_column_lg,
    });
    return colDef;
  }

  getMfwGridData(): Observable<any> {
    const payload: any = {
      provider: 'mfw',
    };
    return this.http
      .post(`service/dvapi_service/all_fund_rating`, payload)
      .pipe(
        map((response: any) => {
          return response.data;
        })
      );
  }
}
