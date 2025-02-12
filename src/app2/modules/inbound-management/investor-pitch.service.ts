import { ColDef } from 'ag-grid-community';
import { Injectable } from '@angular/core';
import {
  dateSortNew,
  defaultColumn,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';
@Injectable({
  providedIn: 'root',
})
export class InvestorPitchService {
  private searchText$ = new BehaviorSubject(null);
  constructor(
    private readonly http: HttpClient,
    private readonly dvDatePipe: DvDatePipe
  ) {}

  getInvestorPitchColDef() {
    const colDef: ColDef[] = [];
    colDef.push({
      ...defaultColumn,
      colId: 'investor_firms',
      headerName: 'Investor Firms',
      field: 'investor_firms',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search Investor Firm',
        onSearch: (searchText: string) => {
          this.searchText$.next(searchText);
        },
      },
      minWidth: grid_widths_map.sm_column_lg,
      suppressColumnsToolPanel: true,
      cellClass: 'my-permission-cursor-pointer',
      cellRenderer: 'InboundInvestorFirmsCellRenderer',
    });
    colDef.push({
      ...defaultColumn,
      colId: 'last_applied',
      headerName: 'Last Applied',
      field: 'last_applied',
      minWidth: grid_widths_map['sm_column_lg'],
      comparator: dateSortNew('last_applied_date'),
    });
    colDef.push({
      ...defaultColumn,
      colId: 'opportunity_count',
      headerName: 'Number of Opportunities',
      field: 'opportunity_count',
      filter: 'agTextColumnFilter',
      minWidth: grid_widths_map.sm_column_lg,
      cellClass: 'my-permission-cursor-pointer',
    });
    return colDef;
  }

  getSearchText() {
    return this.searchText$.asObservable();
  }

  clearSearchText() {
    this.searchText$.next(null);
  }

  getInvestorPitchData() {
    return this.http.post(`service/dvapi_service/inbound_investors`, {}).pipe(
      map((res: any) => {
        return res.data.map((firm) => ({
          investorId: firm.firm_id,
          investor_firms: firm.display_name,
          last_applied: firm.last_applied_at
            ? this.dvDatePipe.transform(firm.last_applied_at)
            : '',
          last_applied_date: firm.last_applied_at ?? null,
          opportunity_count: firm.opportunity_count,
        }));
      })
    );
  }
}
