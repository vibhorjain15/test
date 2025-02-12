import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { UtilsService } from 'src/app2/services/utils.service';
import {
  dateSortNew,
  defaultColumn,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';
import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';
@Injectable({
  providedIn: 'root',
})
export class TemplateGridService {
  constructor(private utils: UtilsService, private dvDatePipe: DvDatePipe) {}

  getTemplateGridColumn(isInvestor: boolean): ColDef[] {
    const colDef: ColDef[] = [];
    colDef.push({
      ...defaultColumn,
      colId: 'name',
      headerName: 'Name',
      field: 'name',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search Template',
      },
      minWidth: grid_widths_map.sm_column_xl,
      suppressColumnsToolPanel: true,
      cellClass: 'my-permission-cursor-pointer',
      cellRenderer: 'entityNameCellRenderer',
      cellRendererParams: {
        entityName: 'name',
        entityType: 'Template',
      },
    });
    colDef.push({
      ...defaultColumn,
      colId: 'questionCount',
      headerName: 'Total Questions',
      field: 'questionCount',
      minWidth: grid_widths_map.sm_column_sm,
      cellClass: 'my-permission-cursor-pointer',
    });
    colDef.push({
      ...defaultColumn,
      colId: 'is_draft',
      headerName: 'Status',
      field: 'is_draft',
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        innerRenderer: 'DvStatusTagComponentRenderer',
      },
      minWidth: grid_widths_map.sm_column_xm,
      flex: 1,
      cellClass: 'my-permission-cursor-pointer',
      menuTabs: ['generalMenuTab'],
    });
    colDef.push({
      ...defaultColumn,
      colId: 'last_updated_at',
      headerName: 'Last Updated At',
      field: 'last_updated_at',
      minWidth: grid_widths_map.sm_column_xm,
      cellClass: 'my-permission-cursor-pointer',
      comparator: dateSortNew('last_updated_at'),
      cellRenderer: 'agGroupCellRenderer',
    });
    colDef.push({
      ...defaultColumn,
      colId: 'strategy',
      headerName: 'Classification',
      field: 'strategy',
      menuTabs: ['generalMenuTab'],
      cellRenderer: 'agGroupCellRenderer',
      minWidth: grid_widths_map.sm_column_xm,
      cellClass: 'my-permission-cursor-pointer',
    });
    colDef.push({
      ...defaultColumn,
      colId: 'type',
      headerName: 'Type',
      field: 'type',
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        innerRenderer: 'DvStatusTagComponentRenderer',
      },
      minWidth: grid_widths_map.sm_column_xm,
      flex: 1,
      cellClass: 'my-permission-cursor-pointer',
      menuTabs: ['generalMenuTab'],
    });
    colDef.push({
      ...defaultColumn,
      colId: 'ownership',
      headerName: 'Ownership',
      field: 'ownership',
      cellRenderer: 'agGroupCellRenderer',
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map.sm_column_sm,
      cellClass: 'my-permission-cursor-pointer',
    });
    if (isInvestor) {
      colDef.push({
        ...defaultColumn,
        colId: 'has_rating_scheme',
        headerName: 'Rating/Score Definition',
        field: 'has_rating_scheme',
        cellRenderer: 'agGroupCellRenderer',
        cellRendererParams: {
          innerRenderer: 'TemplateRatingSchemeRenderer',
        },
        menuTabs: ['generalMenuTab'],
        minWidth: grid_widths_map.sm_column_sm,
        cellClass: 'my-permission-cursor-pointer',
      });
      colDef.push({
        ...defaultColumn,
        colId: 'has_rating_scheme_custom_fields',
        headerName: 'Rating/Score Custom Fields',
        field: 'has_rating_scheme_custom_fields',
        cellRenderer: 'agGroupCellRenderer',
        cellRendererParams: {
          innerRenderer: 'TemplateRatingSchemeCustomFieldsRenderer',
        },
        menuTabs: ['generalMenuTab'],
        minWidth: grid_widths_map.sm_column_sm,
        cellClass: 'my-permission-cursor-pointer',
      });
    }
    return colDef;
  }

  lastUpdateFinder(params, isGrid = false) {
    let lastUpdate = isGrid ? 'Never' : 'Never Updated';
    if (params && this.utils.isDate(params)) {
      let lastUpdated: any = new Date(params + 'Z');
      lastUpdate = this.dvDatePipe.transform(
        lastUpdated,
        isGrid ? [] : ['dvDateTime']
      );
      return isGrid ? lastUpdate : `Last updated on ${lastUpdate}`;
    }
    return lastUpdate;
  }
}
