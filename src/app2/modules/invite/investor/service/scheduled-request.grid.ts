import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import * as moment from 'moment';
import { map } from 'rxjs/operators';
import { RouterService } from 'src/app2/services/router.service';
import {
  dateSortNew,
  defaultColumn,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';
import { DDScheduledType } from '../type/ddSchedule.type';
import { shortDateFormat } from '../util/date.util';

@Injectable({
  providedIn: 'root',
})
export class ScheduledRequestGridService {
  constructor(
    private readonly http: HttpClient,
    private readonly routerService: RouterService
  ) {}

  getMyApprovalGridColDef(): ColDef[] {
    const colDef: ColDef[] = [];
    colDef.push({
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
      colId: 'scheduled_date',
      headerName: 'Scheduled Date',
      field: 'scheduled_date',
      flex: 1,
      minWidth: grid_widths_map.sm_column_sm,
      suppressColumnsToolPanel: true,
      comparator: dateSortNew('scheduled_date'),
    });
    colDef.push({
      ...defaultColumn,
      colId: 'entity_name',
      headerName: 'Entity Name',
      field: 'entity_name',
      menuTabs: ['generalMenuTab'],
      filter: 'agTextColumnFilter',
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        innerRenderer: 'EntityNameLinkCellRendererComponent',
        clicked: (route, params) => {
          this.routerService.navigateWithParams(route, params);
        },
      },
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search by name',
      },
      flex: 1,
      resizable: true,
      minWidth: grid_widths_map.lg_column_xxm,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'questionnaire',
      headerName: 'Questionnaire',
      field: 'questionnaire',
      menuTabs: ['generalMenuTab'],
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search by questionnaire',
      },
      flex: 1,
      resizable: true,
      minWidth: grid_widths_map.lg_column_xxm,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'project_name',
      headerName: 'Project Name',
      menuTabs: ['generalMenuTab'],
      field: 'project_name',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search Project',
      },
      flex: 1,
      resizable: true,
      minWidth: grid_widths_map.sm_column_xm,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'due_date',
      headerName: 'Due Date',
      field: 'due_date',
      flex: 1,
      minWidth: grid_widths_map.sm_column_xxm,
      comparator: dateSortNew('due_date'),
      cellStyle: (params) => {
        if (!params.node.group) {
          let today = moment();
          let due_at = moment(params.data.due_date);
          if (due_at < today) {
            return { color: '#CF2E0B' };
          }
        }
      },
    });
    return colDef;
  }

  getData() {
    return this.http.get(`diligences?type=scheduled`).pipe(
      map((response: any) => {
        return response.map((draft: DDScheduledType) => ({
          id: draft.id,
          scheduled_date: draft.scheduled_for
            ? shortDateFormat(draft.scheduled_for)
            : '',
          entity_name: draft.entity_name,
          project_name: draft.name,
          questionnaire: draft.template_name,
          due_date: draft.due_at ? shortDateFormat(draft.due_at) : '',
          entity_type: draft.entity_type,
          fromfirm_id: draft.fromfirm_id,
          entity_id: draft.entity_id,
        }));
      })
    );
  }
}
