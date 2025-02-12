import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import {
  dateSortWithGroupBy,
  defaultColumn,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';
import { UtilsService } from './utils.service';
import { DvDatePipe } from '../shared/pipes/dv-date.pipe';
import { TagType } from '../shared/constants/tag.constant';
@Injectable({
  providedIn: 'root',
})
export class CustomFieldsGridService {
  constructor(
    private utils: UtilsService,
    private readonly dvDatePipe: DvDatePipe
  ) {}

  addColumnsForCustomFields(colDef: ColDef[], dynamicGridColumns: any[]) {
    dynamicGridColumns = dynamicGridColumns.filter((field) => {
      return !field.is_linked;
    });
    dynamicGridColumns = this.sortByKey(dynamicGridColumns);
    dynamicGridColumns.forEach((custom_field) => {
      if (
        custom_field.has_href ||
        custom_field.type == TagType.Link ||
        custom_field.type == TagType.Dynamic
      ) {
        colDef.push({
          ...defaultColumn,
          colId: custom_field.field_unique_key,
          headerName: custom_field.alias,
          field: custom_field.field_unique_key,
          minWidth: grid_widths_map['sm_column_lg'],
          hide: true,
          cellRenderer: 'customFieldCellLinkRenderer',
          cellRendererParams: {},
          filter: 'agTextColumnFilter',
          floatingFilter: true,
          floatingFilterComponent: 'textFloatingFilterComponent',
          floatingFilterComponentParams: {
            suppressFilterButton: true,
            placeHolder: `Search ${custom_field.alias}`,
          },
          menuTabs: ['generalMenuTab'],
          refData: { showGroupMenu: 'false' },
        });
      } else if (
        custom_field.type == TagType.Date ||
        custom_field.type == TagType.DateTime
      ) {
        colDef.push({
          ...defaultColumn,
          colId: custom_field.field_unique_key,
          headerName: custom_field.alias,
          field: custom_field.field_unique_key,
          minWidth: grid_widths_map['sm_column_sm'],
          hide: true,
          cellRenderer: 'agGroupCellRenderer',
          cellRendererParams: {
            innerRenderer: 'customFieldCellRenderer',
            type: custom_field.type,
          },
          comparator: dateSortWithGroupBy(),
          menuTabs: ['generalMenuTab'],
          refData: { showGroupMenu: 'false' },
        });
      } else if (custom_field.type == TagType.Rating) {
        colDef.push({
          ...defaultColumn,
          colId: custom_field.field_unique_key,
          headerName: custom_field.alias,
          field: custom_field.field_unique_key,
          minWidth: grid_widths_map['sm_column_sm'],
          hide: true,
          cellRenderer: 'agGroupCellRenderer',
          cellRendererParams: {
            innerRenderer: 'ratingCustomFieldCellRenderer',
            type: custom_field.type,
          },
          menuTabs: ['generalMenuTab'],
          refData: { showGroupMenu: 'false' },
        });
      } else {
        colDef.push({
          ...defaultColumn,
          colId: custom_field.field_unique_key,
          headerName: custom_field.alias,
          field: custom_field.field_unique_key,
          minWidth: grid_widths_map['sm_column_sm'],
          hide: true,
          cellRenderer: 'agGroupCellRenderer',
          cellRendererParams: {
            innerRenderer: 'customFieldCellRenderer',
            type: custom_field.type,
          },
          filter: 'agTextColumnFilter',
          floatingFilter: true,
          floatingFilterComponent: 'textFloatingFilterComponent',
          floatingFilterComponentParams: {
            suppressFilterButton: true,
            placeHolder: `Search ${custom_field.alias}`,
          },
          menuTabs: ['generalMenuTab'],
          refData: { showGroupMenu: 'false' },
        });
      }
    });
  }
  sortByKey(dynamicGridColumns: any[]): any[] {
    return this.utils.sortByAplhaIgnoreCase(dynamicGridColumns, 'alias');
  }

  mapCustomFieldResponses(entities: any[], customFields: any[]) {
    entities.forEach((response) => {
      customFields.forEach((custom_field) => {
        const field = response.entity.custom_fields.find(
          (x) => x.field_key === custom_field.field_unique_key
        );
        if (field) {
          if (field.field_type == TagType.Rating) {
            response[custom_field.field_unique_key] = {
              field_value: field.field_value,
              display_format: custom_field.display_format,
            };
          } else if (field.field_type === TagType.Date) {
            response[custom_field.field_unique_key] = this.dvDatePipe.transform(
              field.field_value[0],
              ['isLocaleDate']
            );
          } else if (field.field_type == TagType.DateTime) {
            response[custom_field.field_unique_key] = this.dvDatePipe.transform(
              field.field_value[0],
              ['dvDateTime', 'isLocaleDate']
            );
          } else response[custom_field.field_unique_key] = field.field_value;
        } else {
          response[custom_field.field_unique_key] = '';
        }
      });
    });
  }

  mapCustomFieldProjectsResponses(entities: any[], customFields: any[]) {
    entities.forEach((response) => {
      customFields.forEach((custom_field) => {
        const field = response.custom_fields.find(
          (x) => x.field_key === custom_field.field_unique_key
        );
        if (field) {
          if (field?.field_type == TagType.Rating) {
            response[custom_field.field_unique_key] = {
              field_value: field.field_value,
              display_format: custom_field.display_format,
            };
          } else if (field.field_type === TagType.Date) {
            response[custom_field.field_unique_key] = this.dvDatePipe.transform(
              field.field_value[0],
              ['isLocaleDate']
            );
          } else if (field.field_type == TagType.DateTime) {
            response[custom_field.field_unique_key] = this.dvDatePipe.transform(
              field.field_value[0],
              ['dvDateTime', 'isLocaleDate']
            );
          } else response[custom_field.field_unique_key] = field.field_value;
        } else {
          response[custom_field.field_unique_key] = '';
        }
      });
    });
  }
}
