import { DecimalPipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { defaultColumn, grid_widths_map } from 'src/app2/shared/constants/constant';

@Injectable({
    providedIn: 'root',
})
export class privateFundsService {
    constructor(private decimalPipe: DecimalPipe) { }

    getServiceProvidersColDef(): ColDef[] {
        const colDef: ColDef[] = [];
        colDef.push({
            ...defaultColumn,
            colId: 'name',
            headerName: 'Private Fund Name',
            field: 'name',
            filter: 'agTextColumnFilter',
            floatingFilter: true,
            minWidth: grid_widths_map.lg_column_lg,
            floatingFilterComponent: 'textFloatingFilterComponent',
            floatingFilterComponentParams: {
                suppressFilterButton: true,
                placeHolder: 'Search fund',
            },
            cellRenderer: 'formAdvPrivateFundsName',
            cellClass: 'text-left',
            flex: 1,
        });
        colDef.push({
            ...defaultColumn,
            colId: 'assets',
            headerName: 'Gross Assets ($mm)',
            field: 'assets',
            minWidth: grid_widths_map.sm_column_lg,
            valueFormatter: (params) => {
              return this.decimalPipe.transform(params.value);
            },
            flex: 1,
        });
        colDef.push({
            ...defaultColumn,
            colId: 'type',
            headerName: 'Type',
            field: 'type',
            minWidth: grid_widths_map.sm_column_sm,
            floatingFilter: true,
            filter: 'agTextColumnFilter',
            floatingFilterComponent: 'textFloatingFilterComponent',
            floatingFilterComponentParams: {
                suppressFilterButton: true,
                placeHolder: 'Search by type',
            },
            cellRenderer: 'formAdvPrivateFundsType',
            cellClass: 'text-left',
            flex: 1,
        });
        colDef.push({
            ...defaultColumn,
            colId: 'id',
            headerName: 'ID',
            field: 'id',
            minWidth: grid_widths_map.sm_column_lg,
            cellClass: 'text-left',
            flex: 1,
        });
        return colDef;
    }
}
