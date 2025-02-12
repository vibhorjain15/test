import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { RouterService } from 'src/app2/services/router.service';
import {
  dateSortNew,
  defaultColumn,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';
@Injectable({
  providedIn: 'root',
})
export class DiligeneceGridTemplateService {
  constructor(private readonly routerService: RouterService) {}
  getDiligeneceTemplateGridColumn(): ColDef[] {
    const colDef: ColDef[] = [];
    colDef.push({
      ...defaultColumn,
      colId: 'entity_name',
      headerName: 'Fund Name',
      field: 'entity_name',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: '',
      },
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        innerRenderer: 'EntityNameLinkCellRendererComponent',
        clicked: (route, params) => {
          this.routerService.navigateWithParams(route, params);
        },
      },
      minWidth: grid_widths_map.sm_column_xl,
      suppressColumnsToolPanel: true,
      cellClass: 'my-permission-cursor-pointer',
    });
    colDef.push({
      ...defaultColumn,
      colId: 'name',
      headerName: 'Name',
      field: 'name',
      minWidth: grid_widths_map.sm_column_xm,
      flex: 1,
      cellClass: 'my-permission-cursor-pointer',
      menuTabs: ['generalMenuTab'],
    });
    return colDef;
  }
}
