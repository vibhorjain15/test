import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  dateSortNew,
  defaultColumn,
  grid_widths_map,
} from '../shared/constants/constant';
import { CustomFieldsGridService } from './custom-fields-grid.service';

@Injectable({
  providedIn: 'root',
})
export class ProjectsGridManagerService {
  constructor(
    private readonly http: HttpClient,
    private readonly customFieldsGridService: CustomFieldsGridService
  ) {}

  getProjectsGridColDef(type: string, customFields = []): ColDef[] {
    const colDef: ColDef[] = [];
    const gridTabCols = {
      'my projects': [
        'selectAll',
        'investor_firm_name',
        'entity_name',
        'template_name',
        'due_at',
        'as_of_date',
        'question_count',
        'internal_key',
        'displayStatus',
        'displayType',
        'primary_owners',
        'started_by',
        'entity_type',
        'percentage_completed',
        'last_updated_at',
        'last_reminded_at',
        'last_reminded_by_name',
      ],
      'in-progress': [
        'selectAll',
        'investor_firm_name',
        'entity_name',
        'template_name',
        'due_at',
        'as_of_date',
        'question_count',
        'internal_key',
        'displayStatus',
        'displayType',
        'primary_owners',
        'started_by',
        'entity_type',
        'percentage_completed',
        'last_updated_at',
        'last_reminded_at',
        'last_reminded_by_name',
      ],
      closed: [
        'selectAll',
        'investor_firm_name',
        'entity_name',
        'as_of_date',
        'template_name',
        'displayStatus',
        'internal_key',
        'displayType',
        'primary_owners',
        'started_by',
        'entity_type',
        'last_updated_at',
        'closed_at',
        'question_count',
      ],
      sent: [
        'selectAll',
        'entity_name',
        'tofirm_name',
        'created_at',
        'created_by_name',
        'question_count',
        'primary_owners',
        'started_by',
        'entity_type',
        'last_reminded_at',
        'last_reminded_by_name',
        'internal_key',
      ],
      all: [
        'selectAll',
        'investor_firm_name',
        'entity_name',
        'tofirm_name',
        'template_name',
        'created_at',
        'created_by_name',
        'internal_key',
        'due_at',
        'question_count',
        'displayStatus',
        'displayType',
        'primary_owners',
        'started_by',
        'entity_type',
        'percentage_completed',
        'last_updated_at',
        'last_reminded_at',
        'last_reminded_by_name',
      ],
    };
    let colDefMap = {
      selectAll: {
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
      },
      investor_firm_name: {
        ...defaultColumn,
        colId: 'investor_firm_name',
        headerName: 'Client Name',
        field: 'investor_firm_name',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        floatingFilterComponent: 'textFloatingFilterComponent',
        floatingFilterComponentParams: {
          suppressFilterButton: true,
          placeHolder: 'Search Firm',
        },
        menuTabs: ['generalMenuTab'],
        minWidth: grid_widths_map.sm_column_sm,
        cellRenderer: 'agGroupCellRenderer',
        cellRendererParams: {
          innerRenderer: 'projectClientNameRenderer',
        },
        suppressColumnsToolPanel: true,
      },
      entity_name: {
        ...defaultColumn,
        colId: 'entity_name',
        headerName: 'Entity Name',
        field: 'entity_name',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        floatingFilterComponent: 'textFloatingFilterComponent',
        floatingFilterComponentParams: {
          suppressFilterButton: true,
          placeHolder: 'Search Entity',
        },
        menuTabs: ['generalMenuTab'],
        minWidth: grid_widths_map.sm_column_lg,
      },
      as_of_date: {
        ...defaultColumn,
        colId: 'as_of_date',
        headerName: 'As Of Date',
        field: 'as_of_date',
        minWidth: grid_widths_map.sm_column_xm,
        comparator: dateSortNew('as_of_date'),
      },
      template_name: {
        ...defaultColumn,
        colId: 'template_name',
        headerName: 'Template',
        field: 'template_name',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        floatingFilterComponent: 'textFloatingFilterComponent',
        floatingFilterComponentParams: {
          suppressFilterButton: true,
          placeHolder: 'Search Template',
        },
        menuTabs: ['generalMenuTab'],
        minWidth: grid_widths_map.sm_column_lg,
        cellRenderer: 'agGroupCellRenderer',
        cellRendererParams: {
          innerRenderer: 'ProjectTemplateNameRenderer',
        },
      },
      due_at: {
        ...defaultColumn,
        colId: 'due_at',
        headerName: 'Due Date',
        field: 'due_at',
        minWidth: grid_widths_map.sm_column_xm,
        comparator: dateSortNew('due_at_date'),
      },
      displayStatus: {
        ...defaultColumn,
        colId: 'displayStatus',
        headerName: 'Status',
        field: 'displayStatus',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        floatingFilterComponent: 'textFloatingFilterComponent',
        floatingFilterComponentParams: {
          suppressFilterButton: true,
          placeHolder: 'Search Status',
        },
        cellRenderer: 'agGroupCellRenderer',
        cellRendererParams: {
          innerRenderer: 'projectStatusRenderer',
        },
        menuTabs: ['generalMenuTab'],
        minWidth: grid_widths_map.sm_column_sm,
      },
      displayType: {
        ...defaultColumn,
        colId: 'displayType',
        headerName: 'Type',
        field: 'displayType',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        floatingFilterComponent: 'textFloatingFilterComponent',
        floatingFilterComponentParams: {
          suppressFilterButton: true,
          placeHolder: 'Search Type',
        },
        cellRenderer: 'agGroupCellRenderer',
        cellRendererParams: {
          innerRenderer: 'projectTypeRenderer',
        },
        menuTabs: ['generalMenuTab'],
        minWidth: grid_widths_map.sm_column_xm,
      },
      closed_at: {
        ...defaultColumn,
        colId: 'closed_at',
        headerName: 'Closed On',
        field: 'closed_at',
        minWidth: grid_widths_map.sm_column_sm,
        comparator: dateSortNew('closed_at_date'),
      },
      tofirm_name: {
        ...defaultColumn,
        colId: 'tofirm_name',
        headerName: 'To Firm',
        field: 'tofirm_name',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        floatingFilterComponent: 'textFloatingFilterComponent',
        floatingFilterComponentParams: {
          suppressFilterButton: true,
          placeHolder: 'Search Firm',
        },
        menuTabs: ['generalMenuTab'],
        minWidth: grid_widths_map.sm_column_sm,
      },
      created_at: {
        ...defaultColumn,
        colId: 'created_at',
        headerName: 'Sent Date',
        field: 'created_at',
        minWidth: grid_widths_map.sm_column_xm,
        comparator: dateSortNew('created_at_date'),
      },
      created_by_name: {
        ...defaultColumn,
        colId: 'created_by_name',
        headerName: 'Sent By',
        field: 'created_by_name',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        floatingFilterComponent: 'textFloatingFilterComponent',
        floatingFilterComponentParams: {
          suppressFilterButton: true,
          placeHolder: 'Search Sender',
        },
        menuTabs: ['generalMenuTab'],
        minWidth: grid_widths_map.sm_column_sm,
      },
      internal_key: {
        ...defaultColumn,
        colId: 'internal_key',
        headerName: 'Internal Key',
        field: 'internal_key',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        floatingFilterComponent: 'textFloatingFilterComponent',
        floatingFilterComponentParams: {
          suppressFilterButton: true,
          placeHolder: 'Search Internal Key',
        },
        minWidth: grid_widths_map.sm_column_sm,
        hide: true,
      },
      question_count: {
        ...defaultColumn,
        colId: 'question_count',
        headerName: '# of Questions',
        field: 'question_count',
        minWidth: grid_widths_map.sm_column_xm,
      },
      percentage_completed: {
        ...defaultColumn,
        colId: 'percentage_completed',
        headerName: '% Complete',
        field: 'percentage_completed',
        cellRenderer: 'progressBarRenderer',
        cellRendererParams: {},
        minWidth: grid_widths_map.sm_column_xm,
      },
      last_updated_at: {
        ...defaultColumn,
        colId: 'last_updated_at',
        headerName: 'Last Updated At',
        field: 'last_updated_at',
        minWidth: grid_widths_map.sm_column_sm,
        comparator: dateSortNew('last_updated_at_date'),
      },
      last_reminded_at: {
        ...defaultColumn,
        colId: 'last_reminded_at',
        headerName: 'Last Reminded',
        field: 'last_reminded_at',
        minWidth: grid_widths_map.sm_column_sm,
        comparator: dateSortNew('last_reminded_at_date'),
      },
      last_reminded_by_name: {
        ...defaultColumn,
        colId: 'last_reminded_by_name',
        headerName: 'Reminded By',
        field: 'last_reminded_by_name',
        menuTabs: ['generalMenuTab'],
        minWidth: grid_widths_map.sm_column_sm,
      },
      statusIcon: {
        ...defaultColumn,
        colId: 'statusIcon',
        headerName: '',
        field: 'statusIcon',
        cellRenderer: 'projectStatusIconRenderer',
        pinned: 'right',
        width: grid_widths_map.icon_lg,
        cellRendererParams: {
          isInvestor: false,
        },
        flex: 1,
        suppressColumnsToolPanel: true,
      },
      primary_owners: {
        ...defaultColumn,
        colId: 'primary_owners',
        headerName: 'Primary Owners',
        field: 'primary_owners',
        floatingFilter: true,
        floatingFilterComponent: 'textFloatingFilterComponent',
        floatingFilterComponentParams: {
          suppressFilterButton: true,
          placeHolder: 'Search by Name',
        },
        minWidth: grid_widths_map['sm_column_sm'],
        cellClass: 'my-permission-cursor-pointer',
        flex: 1,
        cellRenderer: 'agGroupCellRenderer',
        cellRendererParams: {
          innerRenderer: 'groupableFieldNameCellRenderer',
          type: 'entities',
        },
        filter: 'agTextColumnFilter',
        menuTabs: ['generalMenuTab'],
      },
      started_by: {
        ...defaultColumn,
        colId: 'started_by',
        headerName: 'Started By',
        field: 'started_by',
        floatingFilter: true,
        floatingFilterComponent: 'textFloatingFilterComponent',
        floatingFilterComponentParams: {
          suppressFilterButton: true,
          placeHolder: 'Search by Name',
        },
        minWidth: grid_widths_map['sm_column_sm'],
        cellClass: 'my-permission-cursor-pointer',
        flex: 1,
        cellRenderer: 'agGroupCellRenderer',
        cellRendererParams: {
          innerRenderer: 'groupableFieldNameCellRenderer',
          type: 'entities',
        },
        filter: 'agTextColumnFilter',
        menuTabs: ['generalMenuTab'],
      },
      entity_type: {
        ...defaultColumn,
        colId: 'entity_type_label',
        headerName: 'Entity Type',
        field: 'entity_type_label',
        floatingFilter: true,
        floatingFilterComponent: 'textFloatingFilterComponent',
        floatingFilterComponentParams: {
          suppressFilterButton: true,
          placeHolder: 'Search by Entity Type',
        },
        minWidth: grid_widths_map['sm_column_sm'],
        flex: 1,
        filter: 'agTextColumnFilter',
        menuTabs: ['generalMenuTab'],
      },
    };
    gridTabCols[type].forEach((column) => {
      if (type == 'sent' && colDefMap[column].colId == 'entity_name') {
        let col = {
          ...colDefMap[column],
          suppressColumnsToolPanel: true,
        };
        colDef.push(col);
      } else {
        colDef.push(colDefMap[column]);
      }
    });

    if (customFields?.length) {
      this.customFieldsGridService.addColumnsForCustomFields(
        colDef,
        customFields
      );
    }

    return colDef;
  }

  getProjectsGridData(payload: any): Observable<any> {
    return this.http
      .post(`service/dvapi_service/diligence_search`, payload)
      .pipe(
        map((response: any) => {
          return response.data;
        })
      );
  }
}
