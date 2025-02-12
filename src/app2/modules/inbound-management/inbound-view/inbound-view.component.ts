import { Component, Inject, OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { RouterService } from 'src/app2/services/router.service';
import { FILTER_TERNARY_OPERATORS } from 'src/app2/shared/constants/constant';
import { UpdateGridState } from 'src/app2/store/grid/grid.action';

@Component({
  selector: 'app-inbound-view',
  templateUrl: './inbound-view.component.html',
  styleUrls: ['./inbound-view.component.css'],
})
export class InboundViewComponent implements ICellRendererAngularComp {
  params;
  constructor(
    private readonly routerService: RouterService,
    private readonly store: Store
  ) {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
  }
  navigateToProjects(inbound) {
    if (inbound.submission_count) {
      let gridState = {
        columnState: JSON.stringify([]),
        filterState: {},
        customFilters: {
          global_ternary_operator: FILTER_TERNARY_OPERATORS.AND,
          search_criterias: [
            {
              advance_filter_value: inbound.id,
              condition: 'eq',
              filter_key: 'inbound_configurations_id',
              filter_name: 'Opportunity',
              type: 'dropdown',
              operations: 'eq',
              filter_value: inbound.id,
              operator: FILTER_TERNARY_OPERATORS.AND,
              options: [{ id: inbound.id, value: inbound.name }],
              response_type: 'duediligence',
            },
          ],
        },

        pageSize: 10,
      };
      const params = {
        'all-projects-grid': JSON.stringify(gridState),
      };
      this.store.dispatch(new UpdateGridState(params));
      this.routerService.navigateWithParams('app.diligence.projects.activity', {
        type: 'all',
      });
    }
  }
}
