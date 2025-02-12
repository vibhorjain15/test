import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import {
  dateSortNew,
  defaultColumn,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';

@Injectable({
  providedIn: 'root',
})
export class DynamicsDataGridService {
  crmList: any = [
    {
      id: 1,
      name: 'Configuration',
      active: false,
      disabled: false,
    },
    {
      id: 2,
      name: 'Field Information',
      active: false,
      disabled: true,
    },
    {
      id: 3,
      name: 'Import Data',
      active: false,
      disabled: true,
    },
    // {
    //   id: 4,
    //   name: 'History',
    //   active: false,
    // },
  ];

  firmField: any = [
    {
      header: [
        {
          mainHeader: 'Source - Dynamics 365 (Accounts)',
          subHeader: [
            { name: 'Display Name' },
            { name: 'API Field Name' },
            { name: 'Datatype' },
          ],
        },
        {
          mainHeader: 'Target - DiligenceVault(Firms)',
          subHeader: [
            { name: 'Display Name' },
            { name: 'API Field Name' },
            { name: 'Datatype' },
          ],
        },
      ],
      rows: [
        {
          field_data: [
            {
              data: 'Account Name',
            },
            {
              data: 'name<span class="important">*</span>',
            },
            {
              data: 'string',
            },
            {
              data: 'Firm Name',
            },
            {
              data: 'name<span class="important">*</span>',
            },
            {
              data: 'string',
            },
          ],
        },
        {
          field_data: [
            {
              data: 'Website',
            },
            {
              data: 'websiteurl',
            },
            {
              data: 'string',
            },
            {
              data: 'Firm Domain',
            },
            {
              data: 'domain<span class="important">*</span>',
            },
            {
              data: 'string',
            },
          ],
        },
        {
          field_data: [
            {
              data: 'Email',
            },
            {
              data: 'emailaddress1',
            },
            {
              data: 'string',
            },
            {
              data: 'Email Address',
            },
            {
              data: 'primary_contact_email<span class="important">*</span>',
            },
            {
              data: 'string',
            },
          ],
        },
        {
          field_data: [
            {
              data: 'Email Address 2',
            },
            {
              data: 'emailaddress2',
            },
            {
              data: 'string',
            },
            {
              data: 'Secondary Contact Email',
            },
            {
              data: 'secondary_contact_emails',
            },
            {
              data: 'string',
            },
          ],
        },
        {
          field_data: [
            {
              data: 'Email Address 3',
            },
            {
              data: 'emailaddress3',
            },
            {
              data: 'string',
            },
            {
              data: 'Secondary Contact Email',
            },
            {
              data: 'secondary_contact_emails',
            },
            {
              data: 'string',
            },
          ],
        },
        {
          field_data: [
            {
              data: 'Relationship Type',
            },
            {
              data: 'customertypecode',
            },
            {
              data: 'integer',
            },
            {
              data: 'Firm Type',
            },
            {
              data: 'firm_type',
            },
            {
              data: 'string',
            },
          ],
        },
      ],
    },
  ];

  contactField: any = [
    {
      header: [
        {
          mainHeader: 'Source - Dynamics 365 (Contacts)',
          subHeader: [
            { name: 'Display Name' },
            { name: 'API Field Name' },
            { name: 'Datatype' },
          ],
        },
        {
          mainHeader: 'Target - DiligenceVault(Contacts)',
          subHeader: [
            { name: 'Display Name' },
            { name: 'API Field Name' },
            { name: 'Datatype' },
          ],
        },
      ],

      rows: [
        {
          field_data: [
            {
              data: 'Email',
            },
            {
              data: 'emailaddress1',
            },
            {
              data: 'string',
            },
            {
              data: 'Email',
            },
            {
              data: 'email<span class="important">*</span>',
            },
            {
              data: 'string',
            },
          ],
        },
        {
          field_data: [
            {
              data: 'First Name',
            },
            {
              data: 'firstname<span class="important">*</span>',
            },
            {
              data: 'string',
            },
            {
              data: 'First Name',
            },
            {
              data: 'first_name<span class="important">*</span>',
            },
            {
              data: 'string',
            },
          ],
        },
        {
          field_data: [
            {
              data: 'Last Name',
            },
            {
              data: 'lastname<span class="important">*</span>',
            },
            {
              data: 'string',
            },
            {
              data: 'Last Name',
            },
            {
              data: 'last_name<span class="important">*</span>',
            },
            {
              data: 'string',
            },
          ],
        },
      ],
    },
  ];

  constructor() {}

  getDynamicsFirmDataColumn(): ColDef[] {
    const colDef: ColDef[] = [];
    colDef.push({
      colId: 'selectAll',
      field: 'selectAll',
      checkboxSelection: true,
      headerCheckboxSelection: true,
      headerCheckboxSelectionFilteredOnly: true,
      width: 50,
      lockPosition: true,
      suppressColumnsToolPanel: true,
      headerClass: 'my-permission-checkbox',
      cellClass: 'my-permission-checkbox',
      resizable: false,
      suppressHeaderMenuButton: true,
      suppressAutoSize: true,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'name',
      headerName: 'Firm Name',
      field: 'name',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search Firm Name',
      },
      minWidth: grid_widths_map.sm_column_lg,
      suppressColumnsToolPanel: true,
      cellClass: 'my-permission-cursor-pointer',
    });
    colDef.push({
      ...defaultColumn,
      colId: 'domain',
      headerName: 'Firm Domain',
      field: 'domain',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search Firm Domain',
      },
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map.sm_column_lg,
      cellClass: 'my-permission-cursor-pointer',
    });
    colDef.push({
      ...defaultColumn,
      colId: 'primary_contact_email',
      headerName: 'Email Address',
      field: 'primary_contact_email',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search Email Address',
      },
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map.sm_column_lg,
      cellClass: 'my-permission-cursor-pointer',
    });
    colDef.push({
      ...defaultColumn,
      colId: 'secondary_contact_emails',
      headerName: 'Secondary Contact Email',
      field: 'secondary_contact_emails',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search Secondary Contact Email',
      },
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map.sm_column_lg,
      cellClass: 'my-permission-cursor-pointer',
    });
    colDef.push({
      ...defaultColumn,
      colId: 'firm_type',
      headerName: 'Firm Type',
      field: 'firm_type',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search Firm Type',
      },
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map.sm_column_lg,
      cellClass: 'my-permission-cursor-pointer',
    });
    colDef.push({
      ...defaultColumn,
      colId: 'createdon',
      headerName: 'Created On',
      field: 'createdon',
      minWidth: grid_widths_map.sm_column_lg,
      cellClass: 'my-permission-cursor-pointer',
      comparator: dateSortNew('createdon_date'),
    });
    colDef.push({
      ...defaultColumn,
      colId: 'modifiedon',
      headerName: 'Modified On',
      field: 'modifiedon',
      minWidth: grid_widths_map.sm_column_lg,
      cellClass: 'my-permission-cursor-pointer',
      comparator: dateSortNew('modifiedon_date'),
    });
    return colDef;
  }

  getDynamicsContactDataColumn(): ColDef[] {
    const colDef: ColDef[] = [];
    colDef.push({
      colId: 'selectAll',
      field: 'selectAll',
      checkboxSelection: true,
      headerCheckboxSelection: true,
      headerCheckboxSelectionFilteredOnly: true,
      width: 50,
      lockPosition: true,
      suppressColumnsToolPanel: true,
      headerClass: 'my-permission-checkbox',
      cellClass: 'my-permission-checkbox',
      resizable: false,
      suppressHeaderMenuButton: true,
      suppressAutoSize: true,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'firstname',
      headerName: 'First Name',
      field: 'firstname',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search First Name',
      },
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map.sm_column_lg,
      cellClass: 'my-permission-cursor-pointer',
    });
    colDef.push({
      ...defaultColumn,
      colId: 'lastname',
      headerName: 'Last Name',
      field: 'lastname',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search Last Name',
      },
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map.sm_column_lg,
      cellClass: 'my-permission-cursor-pointer',
    });
    colDef.push({
      ...defaultColumn,
      colId: 'email',
      headerName: 'Email',
      field: 'email',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search Email',
      },
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map.sm_column_lg,
      suppressColumnsToolPanel: true,
      cellClass: 'my-permission-cursor-pointer',
    });
    colDef.push({
      ...defaultColumn,
      colId: 'createdon',
      headerName: 'Created On',
      field: 'createdon',
      minWidth: grid_widths_map.sm_column_lg,
      cellClass: 'my-permission-cursor-pointer',
      comparator: dateSortNew('createdon_date'),
    });
    colDef.push({
      ...defaultColumn,
      colId: 'modifiedon',
      headerName: 'Modified On',
      field: 'modifiedon',
      minWidth: grid_widths_map.sm_column_lg,
      cellClass: 'my-permission-cursor-pointer',
      comparator: dateSortNew('modifiedon_date'),
    });
    return colDef;
  }
}
