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
export class ManageProductsService {
  constructor(
    private readonly http: HttpClient,
    private readonly dvDatePipe: DvDatePipe,
    private readonly customFieldsGridService: CustomFieldsGridService
  ) {}

  getManageProductsColDef(customFields: Array<any>, isInvestor): ColDef[] {
    const colDef: ColDef[] = [];

    colDef.push({
      ...defaultColumn,
      colId: 'product_name',
      headerName: 'Product Name',
      field: 'product_name',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search Product',
      },
      minWidth: grid_widths_map['sm_column_lg'],
      cellClass: 'my-permission-cursor-pointer',
      cellRenderer: 'entityNameCellRenderer',
      cellRendererParams: {
        entityName: 'product_name',
        entityType: 'Product',
      },
      suppressColumnsToolPanel: true,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'classification',
      headerName: 'Classification',
      field: 'classification',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search Classification',
      },
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map['sm_column_lg'],
      cellClass: 'my-permission-cursor-pointer',
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
        minWidth: grid_widths_map['sm_column_sm'],
        cellClass: 'my-permission-cursor-pointer',
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
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        innerRenderer: 'entityStatusCellRenderer',
      },
      minWidth: grid_widths_map['sm_column_sm'],
      cellClass: 'my-permission-cursor-pointer',
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

  getManageProductsRowData(params) {
    return this.http.post(`service/dvapi_service/fund_search`, params).pipe(
      map((response: any) => {
        return response.data.map((product) => ({
          product_name: product.name,
          classification: product.strategyName || '',
          relationship_status: product.relationship_status_name ?? '',
          primary_owner: product.primary_owner || '',
          secondary_owner: product.secondary_owner || '',
          last_touchpoint: product.lastTouchPoint
            ? this.dvDatePipe.transform(product.lastTouchPoint)
            : 'None',
          last_touchpoint_date: product.lastTouchPoint ?? null,
          last_updated: product.last_updated_at
            ? this.dvDatePipe.transform(product.last_updated_at)
            : 'Never',
          last_updated_date: product.last_updated_at ?? null,
          parent_firm: product.firm_name,
          internal_key: product.key ?? '',
          status: product.platform_active ? 'Active' : 'Deactivated',
          entity: product,
        }));
      })
    );
  }
}
