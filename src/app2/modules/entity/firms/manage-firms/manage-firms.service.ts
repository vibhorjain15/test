import { dateSortNew } from './../../../../shared/constants/constant';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  defaultColumn,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';
import { Firm } from 'src/app2/shared/models/firm.model';
import { CustomFieldsGridService } from 'src/app2/services/custom-fields-grid.service';
import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';

@Injectable({
  providedIn: 'root',
})
export class ManageFirmsService {
  constructor(
    private readonly http: HttpClient,
    private dvDatePipe: DvDatePipe,
    private readonly customFieldsGridService: CustomFieldsGridService
  ) {}

  getManageGridColDef(customFields: Array<any>): ColDef[] {
    const colDef: ColDef[] = [];

    colDef.push({
      ...defaultColumn,
      colId: 'display_name',
      headerName: 'Firm Name',
      field: 'display_name',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search Firm Name',
      },
      minWidth: grid_widths_map.sm_column_xl,
      suppressColumnsToolPanel: true,
      cellClass: 'my-permission-cursor-pointer',
      cellRenderer: 'entityNameCellRenderer',
      cellRendererParams: {
        entityName: 'display_name',
        entityType: 'Firm',
      },
    });
    colDef.push({
      ...defaultColumn,
      colId: 'relationship_status_name',
      headerName: 'Relationship Status',
      field: 'relationship_status_name',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search by Relationship Status',
      },
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        innerRenderer: 'DvRelationshipStatusTagComponentRenderer',
      },
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map.sm_column_xl,
      cellClass: 'my-permission-cursor-pointer',
    });
    colDef.push({
      ...defaultColumn,
      colId: 'lastTouchPoint',
      headerName: 'Last TouchPoint',
      field: 'lastTouchPoint',
      minWidth: grid_widths_map.sm_column_sm,
      cellClass: 'my-permission-cursor-pointer',
      comparator: dateSortNew('lastTouchPointDate'),
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
        placeHolder: 'Search Primary Owner',
      },
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map.sm_column_sm,
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
        placeHolder: 'Search Secondary Owner',
      },
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map.sm_column_sm,
      cellClass: 'my-permission-cursor-pointer',
    });
    colDef.push({
      ...defaultColumn,
      colId: 'last_updated_at',
      headerName: 'Last Updated',
      field: 'last_updated_at',
      minWidth: grid_widths_map.sm_column_sm,
      cellClass: 'my-permission-cursor-pointer',
      comparator: dateSortNew('last_updated_at_date'),
    });
    colDef.push({
      ...defaultColumn,
      colId: 'key',
      headerName: 'Internal Key',
      floatingFilter: true,
      filter: 'agTextColumnFilter',
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search Internal Key',
      },
      field: 'key',
      minWidth: grid_widths_map.sm_column_sm,
      cellClass: 'my-permission-cursor-pointer',
    });
    if (customFields.length) {
      this.customFieldsGridService.addColumnsForCustomFields(
        colDef,
        customFields
      );
    }

    return colDef;
  }

  getAllFirms(): Observable<Firm[]> {
    let payload: any = {
      include_contacts: false,
      include_custom_fields: true,
      include_dates: true,
      filters: {},
    };
    return this.http.post(`service/dvapi_service/firm_search`, payload).pipe(
      map((response: any) => {
        return response.data.map((firm) => ({
          ...firm,
          relationship_status_name: firm.relationship_status_name ?? '',
          primary_owner: firm.primary_owner ?? '',
          secondary_owner: firm.secondary_owner ?? '',
          lastTouchPoint: firm.lastTouchPoint
            ? this.dvDatePipe.transform(firm.lastTouchPoint)
            : 'None',
          lastTouchPointDate: firm.lastTouchPoint ?? null,
          last_updated_at: firm.last_updated_at
            ? this.dvDatePipe.transform(firm.last_updated_at)
            : 'Never',
          last_updated_at_date: firm.last_updated_at ?? null,
          entity: firm,
        }));
      })
    );
  }

  getFilteredFirms(params) {
    return this.http.post(`service/dvapi_service/firm_search`, params).pipe(
      map((response: any) => {
        return response.data.map((firm) => ({
          ...firm,
          relationship_status_name: firm.relationship_status_name ?? '',
          primary_owner: firm.primary_owner ?? '',
          secondary_owner: firm.secondary_owner ?? '',
          lastTouchPoint: firm.lastTouchPoint
            ? this.dvDatePipe.transform(firm.lastTouchPoint)
            : 'None',
          lastTouchPointDate: firm.lastTouchPoint ?? null,
          last_updated_at: firm.last_updated_at
            ? this.dvDatePipe.transform(firm.last_updated_at)
            : 'Never',
          last_updated_at_date: firm.last_updated_at ?? null,
          entity: firm,
        }));
      })
    );
  }
}
