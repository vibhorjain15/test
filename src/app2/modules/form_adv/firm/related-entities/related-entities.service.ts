import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { defaultColumn, grid_widths_map } from 'src/app2/shared/constants/constant';

@Injectable({
    providedIn: 'root',
})
export class realtedEntitiesService {
    constructor() { }

    getServiceProvidersColDef(): ColDef[] {
        const colDef: ColDef[] = [];
        colDef.push({
            ...defaultColumn,
            colId: 'name',
            headerName: 'Name',
            field: 'name',
            filter: 'agTextColumnFilter',
            sort: 'desc',
            floatingFilter: true,
            minWidth: grid_widths_map.lg_column_xl,
            floatingFilterComponent: 'textFloatingFilterComponent',
            floatingFilterComponentParams: {
                suppressFilterButton: true,
                placeHolder: 'Search entity...',
            },
            cellClass: 'text-left',
            flex: 1,
        });
        colDef.push({
            ...defaultColumn,
            colId: 'id',
            headerName: 'CRD #',
            field: 'id',
            minWidth: grid_widths_map.sm_column_xl,
            cellRenderer: 'emptyCell',
            cellClass: 'text-left',
            flex: 1,
        });
        colDef.push({
            ...defaultColumn,
            colId: 'entity_type',
            headerName: 'Relation',
            field: 'entity_type',
            menuTabs: ['generalMenuTab'],
            minWidth: grid_widths_map.sm_column_xl,
            floatingFilter: true,
            filter: 'agTextColumnFilter',
            floatingFilterComponent: 'textFloatingFilterComponent',
            cellRenderer: 'agGroupCellRenderer',
            cellRendererParams: {
              innerRenderer: 'emptyCell',
            },
            floatingFilterComponentParams: {
                suppressFilterButton: true,
                placeHolder: 'Search relation...',
            },
            cellClass: 'text-left',
            flex: 1,
        });
        colDef.push({
            ...defaultColumn,
            colId: 'owenrship',
            headerName: 'Ownership Code',
            field: 'owenrship',
            floatingFilter: true,
            filter: 'agTextColumnFilter',
            menuTabs: ['generalMenuTab'],
            floatingFilterComponent: 'textFloatingFilterComponent',
            minWidth: grid_widths_map.sm_column_xl,
            floatingFilterComponentParams: {
                suppressFilterButton: true,
                placeHolder: 'Search ownership...',
            },
            cellRenderer: 'emptyCell',
            cellClass: 'text-left',
            flex: 1,
        });
        return colDef;
    }
}
