import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { map } from 'rxjs/operators';
import {
  defaultColumn,
  grid_widths_map,
  keywordConstants,
} from '../shared/constants/constant';
import { accessLevelTypes } from '../shared/components/modal/manage-permission/manage-permission.util';

@Injectable({
  providedIn: 'root',
})
export class PermissionResourceGridService {
  constructor(private readonly http: HttpClient) {}
  getPermissionResourceTeamsColDef(entity_type: string): ColDef[] {
    const colDef: ColDef[] = [];
    colDef.push({
      colId: 'selectAll',
      field: 'selectAll',
      checkboxSelection: true,
      headerCheckboxSelection: true,
      headerCheckboxSelectionFilteredOnly: true,
      width: 50,
      lockPosition: true,
      suppressColumnsToolPanel: true,
      headerClass: 'my-permission-checkbox',
      cellClass: 'my-permission-checkbox',
      resizable: false,
      suppressHeaderMenuButton: true,
      suppressAutoSize: true,
    });
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
        placeHolder: 'Search by name',
      },
      minWidth: grid_widths_map.sm_column_sm,
      suppressColumnsToolPanel: true,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'assigned_to',
      headerName: 'Assigned To',
      field: 'assigned_to',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search by keyword',
      },
      minWidth: grid_widths_map.sm_column_sm,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'role',
      headerName: 'Access Level',
      field: 'role',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search by Access Level',
      },
      minWidth: grid_widths_map.sm_column_xm,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'visibility',
      headerName: 'Visibility',
      field: 'visibility',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search by visibility',
      },
      minWidth: grid_widths_map.sm_column_xm,
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
    if (
      entity_type == keywordConstants.Firm ||
      entity_type == keywordConstants.Strategy
    ) {
      colDef.push({
        ...defaultColumn,
        colId: 'allow_underlying_entities',
        headerName: 'Apply to Underlying Entities',
        field: 'allow_underlying_entities',
        menuTabs: ['generalMenuTab'],
        minWidth: grid_widths_map.sm_column_sm,
      });
    }
    return colDef;
  }
  getPermissionResourceRowData(
    firmId,
    id,
    entityType,
    includeDefaultPermissions: boolean,
    isUser = true
  ) {
    return this.http
      .get(
        `firms/${firmId}/${
          isUser ? 'users' : 'teams'
        }/${id}/ResourcePermissions`,
        {
          params: {
            entity_type: entityType,
            include_default_permissions: includeDefaultPermissions,
          },
        }
      )
      .pipe(
        map((response: any) =>
          response.map((resource) => ({
            name: resource.entity_name,
            assigned_to: resource.assigned_to_entity_id
              ? resource.assigned_to_name
              : 'Everyone',
            role: resource.role_name,
            visibility:
              resource.access_level === accessLevelTypes.Private
                ? 'TeamOwned'
                : resource.access_level,
            entity_type: resource.entity_type,
            entity_id: resource.entity_id,
            assigned_to_entity_type: resource.assigned_to_entity_type,
            assigned_to_name: resource.assigned_to_name,
            permission_type_name: resource.permission_type_name,
            allow_underlying_entities: resource.allow_underlying_entities
              ? 'Yes'
              : 'No',
            is_default: resource.is_default,
            underlying_entity: resource.underlying_entity,
            resource,
          }))
        )
      );
  }
}
