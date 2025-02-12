import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { map } from 'rxjs/operators';
import {
  dateSort,
  dateSortNew,
  defaultColumn,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';
import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';

@Injectable({
  providedIn: 'root',
})
export class EmailTemplatesService {
  constructor(
    private readonly http: HttpClient,
    private readonly dvDatePipe: DvDatePipe
  ) {}
  getEmailTemplatesColDef(): ColDef[] {
    const colDef: ColDef[] = [];
    colDef.push({
      ...defaultColumn,
      colId: 'content',
      headerName: 'Content',
      field: 'content',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search by Content',
      },
      minWidth: grid_widths_map.sm_column_xxl,
      cellRenderer: 'emailTemplateContentComponentCellRenderer',
    });
    colDef.push({
      ...defaultColumn,
      colId: 'last_updated',
      headerName: 'Last Updated',
      field: 'last_updated',
      minWidth: grid_widths_map.sm_column_xm,
      comparator: dateSortNew('last_updated_date'),
    });
    return colDef;
  }
  getEmailTemplatesRowData() {
    return this.http.get(`EmailTemplateMessages`).pipe(
      map((response: any) => {
        return response.map((template) => ({
          name: template.name,
          content: template.content,
          last_updated: template.updated_at
            ? this.dvDatePipe.transform(template.updated_at)
            : template.created_at
            ? this.dvDatePipe.transform(template.created_at)
            : '',
          last_updated_date: template.updated_at ? template.created_at : null,
          template,
          is_default: template.is_default ?? false,
          last_updated_at: template.updated_at ?? template.created_at,
        }));
      })
    );
  }
}
