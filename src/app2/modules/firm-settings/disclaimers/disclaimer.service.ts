import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { map } from 'rxjs/operators';
import { dateSort, defaultColumn } from 'src/app2/shared/constants/constant';
import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';

@Injectable({
  providedIn: 'root',
})
export class DisclaimerService {
  constructor(
    private readonly http: HttpClient,
    private readonly dvDatePipe: DvDatePipe
  ) {}
  getDisclaimerColDef(): ColDef[] {
    const colDef: ColDef[] = [];
    colDef.push({
      ...defaultColumn,
      colId: 'last_updated',
      headerName: 'Last Updated',
      field: 'last_updated',
      comparator: dateSort,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'usage',
      headerName: 'Usage',
      field: 'usage',
    });
    return colDef;
  }

  getDisclaimerRowData(params) {
    return this.http.get(`disclaimers`, { params }).pipe(
      map((response: any) => {
        return response.map((disclaimer) => ({
          name: disclaimer.name,
          last_updated: disclaimer.updated_at
            ? this.dvDatePipe.transform(disclaimer.updated_at)
            : disclaimer.created_at
            ? this.dvDatePipe.transform(disclaimer.created_at)
            : '',
          usage: disclaimer.usage,
          disclaimer,
          last_updated_at: disclaimer.updated_at ?? disclaimer.created_at,
        }));
      })
    );
  }
}
