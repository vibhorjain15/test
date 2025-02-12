import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { map } from 'rxjs/operators';
import { UtilsService } from 'src/app2/services/utils.service';
import { accessLevelTypes } from 'src/app2/shared/components/modal/manage-permission/manage-permission.util';
import {
  dateSort,
  defaultColumn,
  grid_widths_map,
  keywordConstants,
} from 'src/app2/shared/constants/constant';
import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';

@Injectable({
  providedIn: 'root',
})
export class PermissionsService {
  constructor(
    private readonly http: HttpClient,
    private readonly dvDatePipe: DvDatePipe,
    private readonly utils: UtilsService
  ) {}
  getPermissionsColDef(): Array<ColDef & { id?: string }> {
    const colDef: Array<ColDef & { id?: string }> = [];
    colDef.push({
      id: 'selectAll',
      colId: 'selectAll',
      field: 'selectAll',
      checkboxSelection: true,
      headerCheckboxSelection: true,
      headerCheckboxSelectionFilteredOnly: true,
      lockPosition: true,
      width: 50,
      headerClass: 'my-permission-checkbox',
      cellClass: 'my-permission-checkbox',
      suppressColumnsToolPanel: true,
      resizable: false,
      suppressHeaderMenuButton: true,
      suppressAutoSize: true,
    });
    colDef.push({
      ...defaultColumn,
      id: 'entity_name',
      colId: 'resource',
      headerName: 'Resource',
      field: 'resource',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search Resource',
      },
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map.sm_column_sm,
      suppressColumnsToolPanel: true,
      cellClass: 'my-permission-cursor-pointer',
    });
    colDef.push({
      ...defaultColumn,
      id: 'entity_type',
      colId: 'resource_type',
      headerName: 'Resource Type',
      field: 'resource_type',
      // TODO: Add dropdown filter
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'dropdownFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
      },
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map.sm_column_sm,
    });
    colDef.push({
      ...defaultColumn,
      id: 'assigned_to_name',
      colId: 'assigned_to',
      headerName: 'Assigned To',
      field: 'assigned_to',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search Members',
      },
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map.sm_column_xm,
    });
    colDef.push({
      ...defaultColumn,
      id: 'assigned_to_entity_type',
      colId: 'type',
      headerName: 'Type',
      field: 'type',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search Type',
      },
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map.sm_column_xm,
    });
    colDef.push({
      ...defaultColumn,
      id: 'role_name',
      colId: 'role',
      headerName: 'Access Level',
      field: 'role',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search Access Level',
      },
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map.sm_column_xm,
    });
    colDef.push({
      ...defaultColumn,
      id: 'access_level',
      colId: 'visibility',
      headerName: 'Visibility',
      field: 'visibility',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search Visibility',
      },
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map.sm_column_xm,
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        innerRenderer: 'permissionVisibilityRenderer',
      },
    });
    colDef.push({
      ...defaultColumn,
      colId: 'permission_type',
      headerName: 'Permission Mode',
      field: 'permission_type_name',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search Permission Mode',
      },
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map.sm_column_sm,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'allow_underlying_entities',
      headerName: 'Apply to Underlying Entities',
      field: 'allow_underlying_entities',
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map.sm_column_sm,
    });
    colDef.push({
      ...defaultColumn,
      id: 'created_at',
      colId: 'last_updated',
      headerName: 'Last Updated',
      field: 'last_updated',
      minWidth: grid_widths_map.sm_column_xm,
      comparator: dateSort,
    });
    return colDef;
  }
  getPermissionsRowData(firmId: number, includeDefaultPermissions: boolean) {
    const params = {
      include_default_permissions: includeDefaultPermissions,
    };
    return this.http
      .get(`firms/${firmId}/resourcepermissions`, { params: params })
      .pipe(
        map((response: any) => {
          return response.map((permission) => ({
            resource: permission.entity_name,
            resource_type:
              permission.entity_type === keywordConstants.Template
                ? 'Template'
                : permission.entity_type === 'Fund'
                ? 'Product'
                : permission.entity_type === keywordConstants.Project
                ? 'Project'
                : permission.entity_type === keywordConstants.Firm &&
                  this.utils.isManager() &&
                  permission.entity_id !== firmId
                ? 'Investor'
                : permission.entity_type === keywordConstants.Firm &&
                  this.utils.isManager() &&
                  permission.entity_id === firmId
                ? 'My Firm'
                : permission.entity_type,
            assigned_to: permission.assigned_to_entity_id
              ? permission.assigned_to_name
              : 'Everyone',
            type: permission.assigned_to_entity_type ?? 'Everyone',
            role: permission.role_name || '',
            visibility: permission.access_level
              ? permission.access_level === accessLevelTypes.Private
                ? 'TeamOwned'
                : permission.access_level
              : '',
            last_updated: permission.is_default
              ? ''
              : permission.updated_at
              ? this.dvDatePipe.transform(permission.updated_at)
              : permission.created_at
              ? this.dvDatePipe.transform(permission.created_at)
              : '',
            entity_id: permission.assigned_to_entity_id,
            entity_type: permission.assigned_to_entity_type,
            entity_name: permission.assigned_to_name,
            permission,
            last_updated_at: permission.updated_at ?? permission.created_at,
            permission_type_name: permission.permission_type_name,
            allow_underlying_entities: permission.allow_underlying_entities
              ? 'Yes'
              : 'No',
            is_default: permission.is_default,
            disableDeleteAction: permission.is_default,
            disableDeleteTooltip: `You can't delete default permissions`,
          }));
        })
      );
  }
}
