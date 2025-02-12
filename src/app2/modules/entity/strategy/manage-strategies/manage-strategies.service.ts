import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { ColDef } from 'ag-grid-community';
import { map } from 'rxjs/operators';
import { CustomFieldsGridService } from 'src/app2/services/custom-fields-grid.service';
import {
  dateSortNew,
  defaultColumn,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';
import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';

@Injectable({
  providedIn: 'root',
})
export class ManageStrategiesService {
  constructor(
    private readonly http: HttpClient,
    private readonly dvDatePipe: DvDatePipe,
    private readonly customFieldsGridService: CustomFieldsGridService
  ) {}
  getManageStrategiesColDef(customFields: Array<any>, isInvestor): ColDef[] {
    const colDef: ColDef[] = [];

    colDef.push({
      ...defaultColumn,
      colId: 'strategy_name',
      headerName: 'Strategy Name',
      field: 'strategy_name',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search Strategy',
      },
      minWidth: grid_widths_map['sm_column_lg'],
      cellClass: 'my-permission-cursor-pointer',
      cellRenderer: 'entityNameCellRenderer',
      cellRendererParams: {
        entityName: 'strategy_name',
        entityType: 'Strategy',
      },
      suppressColumnsToolPanel: true,
    });
    if (isInvestor)
      colDef.push({
        ...defaultColumn,
        colId: 'relationship_status',
        headerName: 'Relationship Status',
        field: 'relationship_status',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        floatingFilterComponent: 'textFloatingFilterComponent',
        floatingFilterComponentParams: {
          suppressFilterButton: true,
          placeHolder: 'Search by relationship status',
        },
        cellRenderer: 'agGroupCellRenderer',
        cellRendererParams: {
          innerRenderer: 'DvRelationshipStatusTagComponentRenderer',
        },
        menuTabs: ['generalMenuTab'],
        minWidth: grid_widths_map['sm_column_lg'],
        cellClass: 'my-permission-cursor-pointer',
      });
    colDef.push({
      ...defaultColumn,
      colId: 'status',
      headerName: 'Status',
      field: 'status',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search by status',
      },
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map['sm_column_sm'],
      cellClass: 'my-permission-cursor-pointer',
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        innerRenderer: 'entityStatusCellRenderer',
      },
    });
    colDef.push({
      ...defaultColumn,
      colId: 'primary_owner',
      headerName: 'Primary Owner',
      field: 'primary_owner',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search primary owner',
      },
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map['sm_column_sm'],
      cellClass: 'my-permission-cursor-pointer',
    });
    colDef.push({
      ...defaultColumn,
      colId: 'secondary_owner',
      headerName: 'Secondary Owner',
      field: 'secondary_owner',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search secondary owner',
      },
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map['sm_column_sm'],
      cellClass: 'my-permission-cursor-pointer',
    });
    colDef.push({
      ...defaultColumn,
      colId: 'last_touchpoint',
      headerName: 'Last TouchPoint',
      field: 'last_touchpoint',
      minWidth: grid_widths_map['sm_column_sm'],
      cellClass: 'my-permission-cursor-pointer',
      comparator: dateSortNew('last_touchpoint_date'),
    });
    colDef.push({
      ...defaultColumn,
      colId: 'last_updated',
      headerName: 'Last Updated',
      field: 'last_updated',
      minWidth: grid_widths_map['sm_column_sm'],
      cellClass: 'my-permission-cursor-pointer',
      comparator: dateSortNew('last_updated_date'),
    });
    colDef.push({
      ...defaultColumn,
      colId: 'parent_firm',
      headerName: 'Parent Firm',
      field: 'parent_firm',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search by parent firm',
      },
      minWidth: grid_widths_map['sm_column_lg'],
      cellClass: 'my-permission-cursor-pointer',
    });
    colDef.push({
      ...defaultColumn,
      colId: 'internal_key',
      headerName: 'Internal Key',
      field: 'internal_key',
      floatingFilter: true,
      filter: 'agTextColumnFilter',
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search Internal Key',
      },
      minWidth: grid_widths_map['sm_column_sm'],
      cellClass: 'my-permission-cursor-pointer',
    });
    if (customFields?.length) {
      this.customFieldsGridService.addColumnsForCustomFields(
        colDef,
        customFields
      );
    }

    return colDef;
  }
  getManageStrategiesRowData(params) {
    return this.http.post(`service/dvapi_service/product_search`, params).pipe(
      map((response: any) => {
        return response.data.map((strategy) => ({
          strategy_name: strategy.name,
          relationship_status: strategy.relationship_status_name ?? '',
          status: strategy.platform_active ? 'Active' : 'Deactivated',
          primary_owner: strategy.primary_owner || '',
          secondary_owner: strategy.secondary_owner || '',
          last_touchpoint: strategy.lastTouchPoint
            ? this.dvDatePipe.transform(strategy.lastTouchPoint)
            : 'None',
          last_touchpoint_date: strategy.lastTouchPoint ?? null,
          last_updated: strategy.last_updated_at
            ? this.dvDatePipe.transform(strategy.last_updated_at)
            : 'Never',
          last_updated_date: strategy.last_updated_at ?? null,
          parent_firm: strategy.firm_name,
          internal_key: strategy.key ?? '',
          strategy,
          entity: strategy,
        }));
      })
    );
  }
}
