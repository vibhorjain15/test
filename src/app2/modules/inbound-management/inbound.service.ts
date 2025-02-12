import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import {
  defaultColumn,
  grid_widths_map,
  dateSortNew,
  dateSortWithGroupBy,
} from 'src/app2/shared/constants/constant';
const INBOUND_ENDPOINT = 'service/dvapi_service/inbound_configuration';
import * as moment from 'moment';
@Injectable({
  providedIn: 'root',
})
export class InboundService {
  constructor(private readonly http: HttpClient) {}

  getInboundConfigs() {
    return this.http.post(INBOUND_ENDPOINT, { type: 'get' });
  }

  addInboundConfig(config) {
    return this.http.post(INBOUND_ENDPOINT, config);
  }

  deleteInboundConfigs(config_id) {
    return this.http.post(INBOUND_ENDPOINT, {
      type: 'delete',
      config_id,
    });
  }

  sendVerificationCode(email) {
    return this.http.post(`account/generatesignupcode?email=${email}`, []);
  }

  getLogo(redirectId) {
    return this.http.get(`InboundConfigurations?redirect_id=${redirectId}`);
  }

  getAllFirms(params) {
    return this.http.get('firms/activation_list', { params });
  }

  signupInbound(params) {
    return this.http.post(`account/signup`, params);
  }

  getactivationList(params) {
    return this.http.get(`firms/activation_list`, params);
  }

  getInboundColDef() {
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
      suppressMovable: true,
      resizable: false,
      suppressHeaderMenuButton: true,
      suppressAutoSize: true,
    });
    colDef.push({
      ...defaultColumn,
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
      minWidth: grid_widths_map.sm_column_lg,
      suppressColumnsToolPanel: true,
      cellRenderer: 'inboundNameCellRender',
    });
    colDef.push({
      ...defaultColumn,
      colId: 'links',
      headerName: 'Links',
      field: 'links',
      minWidth: grid_widths_map.sm_column_xm,
      cellRenderer: 'inboundLinksCellRenderer',
      sortable: false,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'submission_count',
      headerName: 'Submissions',
      field: 'submission_count',
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map.sm_column_xm,
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        innerRenderer: 'inboundViewCellRenderer',
      },
    });

    colDef.push({
      ...defaultColumn,
      colId: 'contacts',
      headerName: 'Contacts',
      field: 'contacts',
      minWidth: grid_widths_map.sm_column_xl,
      cellRenderer: 'inboundContactsCellRenderer',
    });

    colDef.push({
      ...defaultColumn,
      colId: 'template_name',
      headerName: 'Template Name',
      field: 'template_name',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      menuTabs: ['generalMenuTab'],
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search Template',
      },
      minWidth: grid_widths_map.sm_column_lg,
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        innerRenderer: 'InboundTemplateCellRender',
      },
    });

    colDef.push({
      ...defaultColumn,
      colId: 'visibility',
      headerName: 'Visibility',
      field: 'visibility',
      menuTabs: ['generalMenuTab'],
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        innerRenderer: 'inboundVisibilityCellRenderer',
      },
      minWidth: grid_widths_map.sm_column_xm,
    });

    colDef.push({
      ...defaultColumn,
      colId: 'email_template',
      headerName: 'Email Template',
      field: 'email_template',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      menuTabs: ['generalMenuTab'],
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search Email Template',
      },
      minWidth: grid_widths_map.sm_column_lg,
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        innerRenderer: 'InboundEmailTemplateCellRenderer',
      },
    });

    colDef.push({
      ...defaultColumn,
      colId: 'due_date',
      headerName: 'Expiry Date',
      field: 'due_date',
      sortable: true,
      minWidth: grid_widths_map.sm_column_xm,
      cellStyle: { fontWeight: '500' },
      menuTabs: ['generalMenuTab'],
      cellClassRules: {
        danger: (params) => {
          return moment(new Date(params.value), 'YYYY/MM/DD')
            .add(1, 'day')
            .isBefore(moment(new Date(), 'YYYY/MM/DD'));
        },
      },
      comparator: dateSortWithGroupBy(),
    });
    colDef.push({
      ...defaultColumn,
      colId: 'as_of_date',
      headerName: 'Created Date',
      field: 'as_of_date',
      minWidth: grid_widths_map.sm_column_xm,
      comparator: dateSortNew('as_of_date'),
    });
    return colDef;
  }
}
