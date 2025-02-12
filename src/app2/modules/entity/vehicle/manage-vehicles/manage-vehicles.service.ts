import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
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
export class ManageVehiclesService {
  constructor(
    private readonly http: HttpClient,
    private readonly dvDatePipe: DvDatePipe,
    private readonly customFieldsGridService: CustomFieldsGridService
  ) {}
  getManageVehiclesColDef(customFields: Array<any>, isInvestor): ColDef[] {
    const colDef: ColDef[] = [];
    colDef.push({
      ...defaultColumn,
      colId: 'vehicle_name',
      headerName: 'Vehicle Name',
      field: 'vehicle_name',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search vehicle',
      },
      minWidth: grid_widths_map['sm_column_xl'],
      cellClass: 'my-permission-cursor-pointer',
      cellRenderer: 'entityNameCellRenderer',
      cellRendererParams: {
        entityName: 'vehicle_name',
        entityType: 'Vehicle',
        isFreeSubscription: true,
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
        minWidth: grid_widths_map['sm_column_sm'],
        cellClass: 'my-permission-cursor-pointer',
      });
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
        placeHolder: 'Search product',
      },
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map['sm_column_lg'],
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
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        innerRenderer: 'entityStatusCellRenderer',
      },
      menuTabs: ['generalMenuTab'],
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
  getManageVehiclesRowData(params) {
    return this.http.post(`service/dvapi_service/vehicle_search`, params).pipe(
      map((response: any) => {
        return response.data.map((vehicle) => ({
          vehicle_name: vehicle.name,
          relationship_status: vehicle.relationship_status_name ?? '',
          product_name: vehicle.fund_name,
          primary_owner: vehicle.primary_owner || '',
          secondary_owner: vehicle.secondary_owner || '',
          last_touchpoint: vehicle.last_touch_point
            ? this.dvDatePipe.transform(vehicle.last_touch_point)
            : 'None',
          last_touchpoint_date: vehicle.last_touch_point ?? null,
          status: vehicle.platform_active ? 'Active' : 'Deactivated',
          last_updated: vehicle.updated_at
            ? this.dvDatePipe.transform(vehicle.updated_at)
            : 'Never',
          last_updated_date: vehicle.updated_at ?? null,
          internal_key: vehicle.key ?? '',
          entity: vehicle,
        }));
      })
    );
  }
}
