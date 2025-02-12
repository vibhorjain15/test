import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  defaultColumn,
  grid_widths_map,
  dateSortWithGroupBy,
} from '../shared/constants/constant';
@Injectable({
  providedIn: 'root',
})
export class ADVSearchService {
  constructor(private readonly http: HttpClient) {}

  getADVSearchGridColDef(activeView: string): ColDef[] {
    const colDef: ColDef[] = [];

    if (activeView == 'fund') {
      colDef.push({
        ...defaultColumn,
        colId: 'pf_name',
        headerName: 'Fund Name',
        field: 'pf_name',
        menuTabs: ['generalMenuTab'],
        cellClass: 'my-permission-cursor-pointer',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        minWidth: grid_widths_map.sm_column_lg,
        floatingFilterComponent: 'textFloatingFilterComponent',
        floatingFilterComponentParams: {
          suppressFilterButton: true,
          placeHolder: 'Search Funds',
        },
        suppressColumnsToolPanel: true,
        cellRenderer: 'agGroupCellRenderer',
        cellRendererParams: {
          innerRenderer: 'AdvFrimFundCellRenderer',
        },
      });
      colDef.push({
        ...defaultColumn,
        colId: 'firmname',
        headerName: 'Firm Name',
        field: 'firmname',
        menuTabs: ['generalMenuTab'],
        cellClass: 'my-permission-cursor-pointer',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        minWidth: grid_widths_map.sm_column_sm,
        floatingFilterComponent: 'textFloatingFilterComponent',
        floatingFilterComponentParams: {
          suppressFilterButton: true,
          placeHolder: 'Search Firms',
        },
      });
      colDef.push({
        ...defaultColumn,
        colId: 'pf_type',
        headerName: 'Fund Type',
        field: 'pf_type',
        menuTabs: ['generalMenuTab'],
        cellClass: 'my-permission-cursor-pointer',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        minWidth: grid_widths_map.sm_column_sm,
        floatingFilterComponent: 'textFloatingFilterComponent',
        floatingFilterComponentParams: {
          suppressFilterButton: true,
          placeHolder: 'Search Fund Type',
        },
      });
      colDef.push({
        ...defaultColumn,
        colId: 'gp_name',
        headerName: 'GP Name',
        field: 'gp_name',
        menuTabs: ['generalMenuTab'],
        cellClass: 'my-permission-cursor-pointer',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        minWidth: grid_widths_map.sm_column_sm,
        floatingFilterComponent: 'textFloatingFilterComponent',
        floatingFilterComponentParams: {
          suppressFilterButton: true,
          placeHolder: 'Search',
        },
      });
      colDef.push({
        ...defaultColumn,
        colId: 'pf_state_country',
        headerName: 'State/Country',
        field: 'pf_state_country',
        menuTabs: ['generalMenuTab'],
        cellClass: 'my-permission-cursor-pointer',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        minWidth: grid_widths_map.sm_column_sm,
        floatingFilterComponent: 'textFloatingFilterComponent',
        floatingFilterComponentParams: {
          suppressFilterButton: true,
          placeHolder: 'Search',
        },
      });
      colDef.push({
        ...defaultColumn,
        colId: 'pf_aum',
        headerName: 'AUM(mn)',
        field: 'pf_aum',
        menuTabs: ['generalMenuTab'],
        cellClass: 'my-permission-cursor-pointer',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        minWidth: grid_widths_map.sm_column_xm,
        floatingFilterComponent: 'textFloatingFilterComponent',
        floatingFilterComponentParams: {
          suppressFilterButton: true,
          placeHolder: 'Search AUM',
        },
        cellRenderer: 'agGroupCellRenderer',
        cellRendererParams: {
          innerRenderer: 'AdvAumMillionRenderer',
        },
      });
    } else if (activeView == 'firm') {
      colDef.push({
        ...defaultColumn,
        colId: 'info_legalname',
        headerName: 'Firm Name',
        field: 'info_legalname',
        menuTabs: ['generalMenuTab'],
        cellClass: 'my-permission-cursor-pointer',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        minWidth: grid_widths_map.sm_column_lg,
        floatingFilterComponent: 'textFloatingFilterComponent',
        floatingFilterComponentParams: {
          suppressFilterButton: true,
          placeHolder: 'Search Firms',
        },
        suppressColumnsToolPanel: true,
        cellRenderer: 'agGroupCellRenderer',
        cellRendererParams: {
          innerRenderer: 'AdvFrimFundCellRenderer',
        },
      });
      colDef.push({
        ...defaultColumn,
        colId: 'firmcrd',
        headerName: 'Firm CRD',
        field: 'firmcrd',
        cellClass: 'my-permission-cursor-pointer',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        minWidth: grid_widths_map.sm_column_xm,
        floatingFilterComponent: 'textFloatingFilterComponent',
        floatingFilterComponentParams: {
          suppressFilterButton: true,
          placeHolder: 'Search CRD',
        },
      });
      colDef.push({
        ...defaultColumn,
        colId: 'firmtype',
        headerName: 'Firm Type',
        field: 'firmtype',
        menuTabs: ['generalMenuTab'],
        cellClass: 'my-permission-cursor-pointer',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        minWidth: grid_widths_map.sm_column_xm,
        floatingFilterComponent: 'textFloatingFilterComponent',
        floatingFilterComponentParams: {
          suppressFilterButton: true,
          placeHolder: 'Search Type',
        },
      });
      colDef.push({
        ...defaultColumn,
        colId: 'filingdate',
        headerName: 'Filing Date',
        field: 'filingdate',
        menuTabs: ['generalMenuTab'],
        cellClass: 'my-permission-cursor-pointer',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        minWidth: grid_widths_map.sm_column_sm,
        floatingFilterComponent: 'textFloatingFilterComponent',
        floatingFilterComponentParams: {
          suppressFilterButton: true,
          placeHolder: 'Search Date',
        },
        comparator: dateSortWithGroupBy(),
        cellRenderer: 'agGroupCellRenderer',
        cellRendererParams: {
          innerRenderer: 'AdvFilingDateRenderer',
        },
      });
      colDef.push({
        ...defaultColumn,
        colId: 'foo_country',
        headerName: 'Country',
        field: 'foo_country',
        menuTabs: ['generalMenuTab'],
        cellClass: 'my-permission-cursor-pointer',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        minWidth: grid_widths_map.sm_column_sm,
        floatingFilterComponent: 'textFloatingFilterComponent',
        floatingFilterComponentParams: {
          suppressFilterButton: true,
          placeHolder: 'Search Country',
        },
      });
      colDef.push({
        ...defaultColumn,
        colId: 'info_discretionary_raum',
        headerName: 'RAUM(mn)',
        field: 'info_discretionary_raum',
        menuTabs: ['generalMenuTab'],
        cellClass: 'my-permission-cursor-pointer',
        filter: 'agNumberColumnFilter',
        floatingFilter: true,
        minWidth: grid_widths_map.sm_column_lg,
        floatingFilterComponent: 'textFloatingFilterComponent',
        floatingFilterComponentParams: {
          suppressFilterButton: true,
          placeHolder: 'Search RAUM',
        },
        cellRenderer: 'agGroupCellRenderer',
        cellRendererParams: {
          innerRenderer: 'AdvAumMillionRenderer',
        },
      });
    }

    return colDef;
  }

  getADVSearchGridData(params: any): Observable<any> {
    return this.http.post(`service/es_service/search`, params).pipe(
      map((response: any) => {
        return response.data;
      })
    );
  }

  getCriteriaList(): Observable<any> {
    const payload: any = {
      filters: {},
    };
    return this.http.post(`service/es_service/filters`, payload);
  }
}
