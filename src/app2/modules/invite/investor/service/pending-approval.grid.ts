import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { map } from 'rxjs/operators';
import {
  defaultColumn,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';
import { DDDraftType } from '../type/ddDraft.type';
import { shortDateFormat } from '../util/date.util';

@Injectable({
  providedIn: 'root',
})
export class PendingApprovalGridService {
  constructor(private readonly http: HttpClient) {}

  getMyApprovalGridColDef(): ColDef[] {
    const colDef: ColDef[] = [];
    colDef.push({
      ...defaultColumn,
      colId: 'project_name',
      headerName: 'Project Name',
      field: 'project_name',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search Project',
      },
      flex: 1,
      minWidth: grid_widths_map.sm_column_sm,
      suppressColumnsToolPanel: true,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'status',
      menuTabs: ['generalMenuTab'],
      headerName: 'Status',
      field: 'status',
      flex: 1,
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        innerRenderer: 'GridStatusCellComponent',
      },
      minWidth: grid_widths_map.sm_column_sm,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'created_by',
      headerName: 'Created By',
      field: 'created_by',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search Name',
      },
      flex: 1,
      minWidth: grid_widths_map.sm_column_lg,
    });

    colDef.push({
      ...defaultColumn,
      colId: 'due_date',
      headerName: 'Due Date',
      field: 'due_date',
      menuTabs: ['generalMenuTab'],
      flex: 1,
      minWidth: grid_widths_map.sm_column_xxm,
      valueGetter(params) {
        if (params.node.group) {
          return '';
        }
        return params.data.due_date || '';
      },
    });

    colDef.push({
      ...defaultColumn,
      colId: 'as_of_date',
      headerName: 'As of Date',
      menuTabs: ['generalMenuTab'],
      field: 'as_of_date',
      flex: 1,
      minWidth: grid_widths_map.sm_column_xxm,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'last_updated',
      headerName: 'Last Updated',
      field: 'last_updated',
      flex: 1,
      minWidth: grid_widths_map.sm_column_xxm,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'entities',
      headerName: '# of Entities',
      field: 'entities',
      flex: 1,
      minWidth: grid_widths_map.sm_column_xxm,
    });
    return colDef;
  }

  getDraftStatus(status, approverIds, user, currentUserId) {
    let currentId = currentUserId;

    if (approverIds.indexOf(currentId) !== -1 && status === 'InProgress') {
      return 'Pending approval';
    } else if (currentId === user && status === 'InProgress') {
      return 'Waiting for approval';
    } else return 'Rejected';
  }

  getData(currentUserId) {
    return this.http.get(`duediligence_drafts`).pipe(
      map((response: any) => {
        return response.map((draft: DDDraftType) => ({
          id: draft.id,
          project_name: draft.project_name,
          status: this.getDraftStatus(
            draft.draft_status,
            draft.approver_ids,
            draft.created_by,
            currentUserId
          ),
          created_by: draft.created_by_name,
          due_date: this.formatDate(JSON.parse(draft.author_json).Due_at),
          as_of_date: this.formatDate(JSON.parse(draft.author_json).As_of_date),
          last_updated: this.formatDate(
            JSON.parse(draft.author_json).As_of_date
          ),
          entities: JSON.parse(draft.author_json).Entities.length,
          draft_type: draft.draft_type,
        }));
      })
    );
  }

  formatDate(date: string) {
    let formattedDate = `N/A`;
    if (date) {
      return shortDateFormat(date);
    }
    return formattedDate;
  }
}
