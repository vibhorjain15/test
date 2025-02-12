import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { map } from 'rxjs/operators';
import { BulkUploadMappingAPIService } from 'src/app2/services/bulk-upload-mapping/bulk-upload-mapping.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { UtilsService } from 'src/app2/services/utils.service';
import {
  dateSort,
  defaultColumn,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';
import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';

@Injectable({
  providedIn: 'root',
})
export class BulkUploadMappingGridService {
  constructor(
    private readonly dvDatePipe: DvDatePipe,
    private readonly utils: UtilsService,
    private readonly NewModalFactory: CustomModalService,
    private readonly BulkUploadMappingApiService: BulkUploadMappingAPIService
  ) {}
  getMappingsColDef(): Array<ColDef & { id?: string }> {
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
      id: 'name',
      colId: 'name',
      headerName: 'Name',
      field: 'name',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search Name',
      },
      cellRenderer: 'NameWithIconCellRenderer',
      cellRendererParams: {
        clickedActionIcon: (field) => {
          this.previewMapping(field.data.metadata);
        },
      },
      minWidth: grid_widths_map.sm_column_sm,
      suppressColumnsToolPanel: true,
    });
    colDef.push({
      ...defaultColumn,
      id: 'entity_type',
      colId: 'entity_type',
      headerName: 'Entity Type',
      field: 'entity_type',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search Entity Type',
      },
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map.sm_column_sm,
    });
    colDef.push({
      ...defaultColumn,
      id: 'description',
      colId: 'description',
      headerName: 'Description',
      field: 'description',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search Description',
      },
      minWidth: grid_widths_map.sm_column_xm,
    });
    colDef.push({
      ...defaultColumn,
      id: 'created_at',
      colId: 'created_at',
      headerName: 'Created At',
      field: 'created_at',
      minWidth: grid_widths_map.sm_column_xm,
      comparator: dateSort,
    });
    colDef.push({
      ...defaultColumn,
      id: 'updated_at',
      colId: 'last_updated',
      headerName: 'Last Updated',
      field: 'last_updated',
      minWidth: grid_widths_map.sm_column_xm,
      comparator: dateSort,
    });
    return colDef;
  }

  previewMapping(mapping_metadata) {
    this.NewModalFactory.invoke('preview-saved-mapping', {
      initialState: {
        mappings: mapping_metadata,
      },
    });
  }
  EntityNameMapper = {
    firm: 'Firm',
    fund: 'Product',
    strategy: 'Strategy',
    vehicle: 'Vehicle',
    user: 'Contact',
    team_member: 'Team Member',
  };
  getMappingsRowData(firmId: number) {
    return this.BulkUploadMappingApiService.getMappingRowsData().pipe(
      map((response: any) => {
        return response.map((mapping) => ({
          name: mapping.name,
          entity_type: this.EntityNameMapper[mapping.entity_type],
          description: mapping.description,
          source_id: mapping.source_id,
          last_updated: mapping.updated_at
            ? this.dvDatePipe.transform(mapping.updated_at)
            : mapping.created_at
            ? this.dvDatePipe.transform(mapping.created_at)
            : '',
          created_at: this.dvDatePipe.transform(mapping.created_at),
          source: mapping.source,
          metadata: mapping.mapping_metadata,
          nameIcon: 'eye',
          mapping,
        }));
      })
    );
  }
}
