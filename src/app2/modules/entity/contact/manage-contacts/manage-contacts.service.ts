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
export class ManageContactsService {
  constructor(
    private readonly http: HttpClient,
    private readonly dvDatePipe: DvDatePipe,
    private readonly customFieldsGridService: CustomFieldsGridService
  ) {}
  getManageContactsColDef(customFields: Array<any>): ColDef[] {
    const colDef: ColDef[] = [];
    colDef.push({
      ...defaultColumn,
      colId: 'contact_name',
      headerName: 'Contact Name',
      field: 'contact_name',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search contact',
      },
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map['sm_column_xl'],
      cellClass: 'my-permission-cursor-pointer',
      suppressColumnsToolPanel: true,
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        suppressCount: false,
        checkbox: false,
        innerRenderer: 'contactNameCellRenderer',
        entityType: 'Contact',
        suppressDoubleClickExpand: true,
        suppressEnterExpand: true,
      },
    });
    colDef.push({
      ...defaultColumn,
      colId: 'email',
      headerName: 'Email',
      field: 'email',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search email',
      },
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map['sm_column_sm'],
      cellClass: 'my-permission-cursor-pointer',
    });
    colDef.push({
      ...defaultColumn,
      colId: 'firm',
      headerName: 'Firm',
      field: 'firm',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search firm',
      },
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map['sm_column_xl'],
      cellClass: 'my-permission-cursor-pointer',
    });
    colDef.push({
      ...defaultColumn,
      colId: 'diligencevault_owner',
      headerName: 'DiligenceVault Owner',
      field: 'diligencevault_owner',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search owner',
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
      minWidth: grid_widths_map['sm_column_sm'],
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        innerRenderer: 'entityStatusCellRenderer',
      },
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
    if (customFields.length) {
      this.customFieldsGridService.addColumnsForCustomFields(
        colDef,
        customFields
      );
    }
    return colDef;
  }
  getManageContactsRowData(params) {
    return this.http.post(`service/dvapi_service/contact_search`, params).pipe(
      map((response: any) => {
        return response.data.map((contact) => ({
          contact_name: contact.fullName || contact.email,
          email: contact.email,
          firm: contact.firm_name,
          diligencevault_owner: contact.owner_name,
          primary_owner: contact.primary_owner || '',
          secondary_owner: contact.secondary_owner || '',
          last_touchpoint: contact.lastTouchPoint
            ? this.dvDatePipe.transform(contact.lastTouchPoint)
            : 'None',
          last_touchpoint_date: contact.lastTouchPoint ?? null,
          last_updated: contact.last_updated_at
            ? this.dvDatePipe.transform(contact.last_updated_at, [
                'isLocaleDate',
              ])
            : 'Never',
          last_updated_date: contact.last_updated_at ?? null,
          internal_key: contact.key ?? '',
          status: contact.platform_active ? 'Active' : 'Deactivated',
          entity: contact,
        }));
      })
    );
  }
}
