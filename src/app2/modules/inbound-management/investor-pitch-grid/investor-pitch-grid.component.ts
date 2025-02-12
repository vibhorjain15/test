import { RouterService } from 'src/app2/services/router.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import {
  defaultColumn,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';
import { InvestorPitchService } from '../investor-pitch.service';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-investor-pitch-grid',
  templateUrl: './investor-pitch-grid.component.html',
  styleUrls: ['./investor-pitch-grid.component.css'],
})
export class InvestorPitchGridComponent implements OnInit, OnDestroy {
  gridName = 'investor-pitch';
  rowData = [];
  loading = false;
  noRowsTemplateText = 'There are currently no opportunities available';
  searchSubscription: Subscription;
  constructor(
    private readonly investorPitchService: InvestorPitchService,
    private readonly store: Store,
    private readonly routerService: RouterService
  ) {}

  ngOnInit(): void {
    const inboundColDef = this.investorPitchService.getInvestorPitchColDef();
    inboundColDef.push({
      ...defaultColumn,
      colId: 'action',
      headerName: 'Action',
      field: 'action',
      minWidth: grid_widths_map.sm_column_lg,
      cellRenderer: 'investorPitchAction',
      cellRendererParams: {
        clickedSelect: (field) => {
          this.clickedSelect(field);
        },
      },
      cellClass: 'my-permission-cursor-pointer',
    });
    this.store.dispatch(
      new SetDefaultColumnDef({ [this.gridName]: inboundColDef })
    );
    this.loading = true;
    this.investorPitchService
      .getInvestorPitchData()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe((res: any) => {
        this.rowData = res;
        this.searchSubscription = this.investorPitchService
          .getSearchText()
          .subscribe((searchText) => {
            this.noRowsTemplateText = searchText
              ? 'No results found'
              : 'There are currently no opportunities available';
          });
      });
  }

  clickedSelect(data) {
    this.routerService.navigateWithParams(`app.inbound.review_request`, {
      investorId: data.investorId,
    });
  }

  onRowClicked = (event) => {
    this.clickedSelect(event.data);
  };

  ngOnDestroy(): void {
    if (this.searchSubscription) this.searchSubscription.unsubscribe();
    this.investorPitchService.clearSearchText();
  }
}
