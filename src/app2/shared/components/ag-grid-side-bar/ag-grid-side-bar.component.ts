import { Component, OnInit } from '@angular/core';
import { ColDef, ColumnApi, ColumnState, GridApi } from 'ag-grid-community';
import getDocDefinition from './docDefinition';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { SharedService } from 'src/app2/services/shared.service';
import { GridService } from 'src/app2/services/grid.service';
pdfMake.vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: 'app-ag-grid-side-bar',
  templateUrl: './ag-grid-side-bar.component.html',
  styleUrls: ['./ag-grid-side-bar.component.css'],
})
export class AgGridSideBarComponent implements OnInit {
  filterAdded = true;
  // Grid API
  gridApi: GridApi;
  // Column API
  columnApi: ColumnApi;
  columnDefs: ColDef[] = [];
  columnState: ColumnState[];
  gridName;
  gridId;
  hideExportOptions: boolean = false;

  constructor(
    private readonly sharedService: SharedService,
    private readonly gridService: GridService
  ) {}

  agInit(params): void {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.gridName = params.gridName;
    this.hideExportOptions = params.hideExportOptions ?? false;
    this.gridId = this.gridService.getGridDownloadName(this.gridName);
  }

  ngOnInit(): void {
    this.sharedService.currentColumnDefs.subscribe((columnDefs) => {
      this.columnDefs = columnDefs;
    });
  }

  onToggleFiltering() {
    // for all definitions, toggle floatingFilter based on filter attribute
    const latestDefs = this.gridApi
      .getColumns()
      .map((column) => column.getColDef());
    latestDefs.forEach((column: ColDef) => {
      if (column.filter) {
        column.floatingFilter = !this.filterAdded;
      }
    });
    // update definitions
    const groupingAvailable = this.gridApi.getRowGroupColumns().length > 0;
    this.gridApi.updateGridOptions({ columnDefs: latestDefs });

    // above method automatically assigns group so remove it if user has not set any group
    if (!groupingAvailable) {
      this.gridApi.removeRowGroupColumns(this.gridApi.getRowGroupColumns());
    }

    // for grouped definition, toggle floatingFilter based on filter attribute
    const groupedColumns = this.gridApi
      .getRowGroupColumns()
      .map((column) => column.getColDef());
    if (groupedColumns.length) {
      groupedColumns.forEach((column: ColDef) => {
        if (column.filter) {
          column.floatingFilter = !this.filterAdded;
        }
      });
      // update group definition
      this.gridApi.updateGridOptions(groupedColumns[0]);
    }

    // refresh headers manually for new change to reflect
    this.gridApi.refreshHeader();
    // toggle bit
    this.filterAdded = !this.filterAdded;
    this.gridApi.closeToolPanel();
  }

  saveDownloadAudit(filename, totalItems) {
    let params = {
      no_of_records: totalItems,
      file_name: filename,
      task_name: this.gridId,
    };
    this.gridService.saveDownloadAudit(params).subscribe((response) => {
      return;
    });
  }

  onDownloadAsPDF() {
    const filename = `${this.gridId
      .toString()
      .split(' ')
      .join('-')}-download.pdf`;
    const PDF_HEADER_COLOR = '#f8f8f8';
    const PDF_INNER_BORDER_COLOR = '#dde2eb';
    const PDF_OUTER_BORDER_COLOR = '#babfc7';
    // const PDF_LOGO =
    //   'https://raw.githubusercontent.com/AhmedAGadir/ag-grid-todo-list-react-typescript/master/src/assets/new-ag-grid-logo.png';
    const PDF_PAGE_ORITENTATION = 'landscape';
    const PDF_WITH_HEADER_IMAGE = false;
    const PDF_WITH_FOOTER_PAGE_COUNT = false;
    const PDF_HEADER_HEIGHT = 25;
    const PDF_ROW_HEIGHT = 15;
    const PDF_ODD_BKG_COLOR = '#fcfcfc';
    const PDF_EVEN_BKG_COLOR = '#ffffff';
    const PDF_WITH_CELL_FORMATTING = true;
    const PDF_WITH_COLUMNS_AS_LINKS = false;
    const PDF_SELECTED_ROWS_ONLY = false;
    const docDefinition = getDocDefinition(
      {
        PDF_HEADER_COLOR,
        PDF_INNER_BORDER_COLOR,
        PDF_OUTER_BORDER_COLOR,
        PDF_PAGE_ORITENTATION,
        PDF_WITH_HEADER_IMAGE,
        PDF_WITH_FOOTER_PAGE_COUNT,
        PDF_HEADER_HEIGHT,
        PDF_ROW_HEIGHT,
        PDF_ODD_BKG_COLOR,
        PDF_EVEN_BKG_COLOR,
        PDF_WITH_CELL_FORMATTING,
        PDF_WITH_COLUMNS_AS_LINKS,
        PDF_SELECTED_ROWS_ONLY,
        info: {
          title: filename,
        },
      },
      this.gridApi,
      this.columnApi
    );
    pdfMake.createPdf(docDefinition).download();
    this.saveDownloadAudit(filename, this.gridApi.getDisplayedRowCount());
    this.gridApi.closeToolPanel();
  }

  onDownloadAsCSV() {
    const filename = `${this.gridId
      .toString()
      .split(' ')
      .join('-')}-download.csv`;
    this.gridApi.exportDataAsCsv({
      fileName: filename,
      processCellCallback: (node) => {
        if (
          node.column.getColDef().cellRendererParams?.type == 'rating' &&
          node.value?.field_value?.length > 0
        ) {
          return node.value?.display_format == 'name'
            ? node.value.field_value[1]
            : node.value.field_value[0];
        }
        if (node.column.getId() === 'document_types' && node.value) {
          return node.value?.join(', ');
        }
        if (node.column.getId() === 'contacts') {
          const item = node.value.map((x) => x.name);
          item.join(', ');
        }
        if (node.column.getId() === 'contacts') {
          const item = node.value.map((x) => x.name);
          return Array.isArray(item)
            ? item.map((val) => val).join(' , ')
            : item;
        } else {
          return Array.isArray(node.value)
            ? node.value.map((val) => val).join(' , ')
            : node.value;
        }
      },
      columnKeys: this.getVisibleColumnsForExport(),
    });
    this.saveDownloadAudit(filename, this.gridApi.getDisplayedRowCount());
    this.gridApi.closeToolPanel();
  }

  onExcelExportAll() {
    const filename = `${this.gridId
      .toString()
      .split(' ')
      .join('-')}-download-all.xlsx`;
    this.gridApi.exportDataAsExcel({
      processCellCallback: (node) => {
        if (
          node.column.getColDef().cellRendererParams?.type == 'rating' &&
          node.value?.field_value?.length > 0
        ) {
          return node.value?.display_format == 'name'
            ? node.value.field_value[1]
            : node.value.field_value[0];
        }
        if (node.column.getId() === 'document_types' && node.value) {
          return node.value?.join(', ');
        }
        if (node.column.getId() === 'contacts') {
          const item = node.value.map((x) => x.name);
          item.join(', ');
        }
        if (node.column.getId() === 'contacts') {
          const item = node.value.map((x) => x.name);
          return Array.isArray(item)
            ? item.map((val) => val).join(' , ')
            : item;
        } else {
          return Array.isArray(node.value)
            ? node.value.map((val) => val).join(' , ')
            : node.value;
        }
      },
      fileName: filename,
      columnKeys: this.getAllColumns(),
      sheetName: 'Sheet1',
    });
    this.saveDownloadAudit(filename, this.gridApi.getDisplayedRowCount());
    this.gridApi.closeToolPanel();
  }

  getAllColumns() {
    let columns = this.gridApi
      .getAllGridColumns()
      .map((column) => column.getColDef())
      .filter((column: any) => column.field !== 'selectAll');

    const groupedColumns = this.gridApi
      .getRowGroupColumns()
      .map((column) => column.getColDef());
    if (groupedColumns.length) {
      columns
        .filter((x: any) => x.colId === 'ag-Grid-AutoColumn' && !x.field)
        .map((y: any) => (y.field = groupedColumns[0].field));
    }
    return columns.map((column: any) => column.field);
  }

  onExcelExportVisible() {
    const filename = `${this.gridId
      .toString()
      .split(' ')
      .join('-')}-download-visible.xlsx`;
    this.gridApi.exportDataAsExcel({
      processCellCallback: (node) => {
        if (
          node.column.getColDef().cellRendererParams?.type == 'rating' &&
          node.value?.field_value?.length > 0
        ) {
          return node.value?.display_format == 'name'
            ? node.value.field_value[1]
            : node.value.field_value[0];
        }
        if (node.column.getId() === 'document_types' && node.value) {
          return node.value?.join(', ');
        }
        if (node.column.getId() === 'contacts') {
          const item = node.value.map((x) => x.name);
          item.join(', ');
        }
        if (node.column.getId() === 'contacts') {
          const item = node.value.map((x) => x.name);
          return Array.isArray(item)
            ? item.map((val) => val).join(' , ')
            : item;
        } else {
          return Array.isArray(node.value)
            ? node.value.map((val) => val).join(' , ')
            : node.value;
        }
      },
      shouldRowBeSkipped: (params) => {
        const visibleRowIndexes = this.gridApi
          .getRenderedNodes()
          .map((row) => row.rowIndex);

        // params.node.rowIndex will be null for the grouped rows. we want to include the grouped rows in visible export so don't skip
        return (
          params.node.rowIndex !== null &&
          !visibleRowIndexes.includes(params.node.rowIndex)
        );
      },
      fileName: filename,
      columnKeys: this.getVisibleColumnsForExport(),
      sheetName: 'Sheet1',
    });
    this.saveDownloadAudit(filename, this.gridApi.getRenderedNodes().length);
    this.gridApi.closeToolPanel();
  }

  getVisibleColumnsForExport(): string[] {
    let columns = this.gridApi
      .getAllDisplayedColumns()
      .map((column) => column.getColDef())
      .filter((column) => column.field !== 'selectAll');

    const groupedColumns = this.gridApi
      .getRowGroupColumns()
      .map((column) => column.getColDef());
    if (groupedColumns.length) {
      columns
        .filter((x) => x.colId === 'ag-Grid-AutoColumn' && !x.field)
        .map((y) => (y.field = groupedColumns[0].field));
    }
    return columns.map((column) => column.field);
  }
}
