import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';

import {
  ColDef,
  ColumnApi,
  GetDataPath,
  GetQuickFilterTextParams,
  GridApi,
  GridReadyEvent,
  RowNode,
} from 'ag-grid-community';
import { DocumentsService } from 'src/app2/services/documents.service';
import { GridFolderManagementService } from 'src/app2/services/grid-folder-management.service';

import { GridService } from 'src/app2/services/grid.service';

@Component({
  selector: 'dv-folder-selection-grid',
  templateUrl: './dv-folder-selection-grid.component.html',
  styleUrls: ['./dv-folder-selection-grid.component.css'],
})
export class DvFolderSelectionGridComponent implements OnInit, OnChanges {
  @Input() rowData: Array<any> = [];
  @Input() columnDefs: Array<ColDef> = [];
  @Input() defaultColDef: ColDef = {};
  @Input() autoGroupColumnDef: ColDef = {};
  // @Input() dataPath: string = 'document.path';
  // @Input() documentNamePath: string = 'document.name';
  @Input() groupDefaultExpanded: number = 0; // 0 / -1
  @Input() filterValue: string = '';
  @Input() noRowsTemplate = `No results found`;
  @Input() entityId: number;
  @Input() entityType: string;
  @Input() currentUser;
  @Input() onlyFolders: boolean = true;
  @Input() isRadioButton: boolean = true;
  @Input() document_folder_type: Number = 1;
  @Input() selectedFolderId: number = -99; // default selection id for root folder.
  @Input() allowClearSelection: boolean = false;
  @Output() gridReady: EventEmitter<GridReadyEvent> =
    new EventEmitter<GridReadyEvent>();
  @Output() selectionChange: EventEmitter<any> = new EventEmitter<any>();
  @Output() emitAllData: EventEmitter<any> = new EventEmitter<any>();

  gridLoader: boolean = false;
  frameworkComponents: any;
  grid: GridReadyEvent;
  gridApi: GridApi & { selectedFolder: { id: number } };
  columnApi: ColumnApi;
  updatedNodeStyles: Array<RowNode> = [];

  constructor(
    private readonly gridService: GridService,
    private readonly folderManagementService: GridFolderManagementService,
    private readonly documentService: DocumentsService
  ) {}

  ngOnInit(): void {
    this.frameworkComponents = this.gridService.getFrameWorkComponents();
    this.defaultColDef = {
      flex: 1,
    };
    this.autoGroupColumnDef = {
      cellRenderer: 'agGroupCellRenderer',
      cellClass: 'folder-name-cell',
      flex: 1,
      getQuickFilterText: (params: GetQuickFilterTextParams) =>
        params.data.document.name,
      cellRendererParams: {
        suppressCount: true,
        innerRenderer: 'dvFolderSelectionCellRendererComponent',
        isMultiSelect: !this.isRadioButton,
      },
    };
    if (this.onlyFolders) {
      this.gridLoader = true;
      this.fetchOnlyFolders();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.hasOwnProperty('filterValue') &&
      !changes.filterValue.isFirstChange() &&
      changes.filterValue.previousValue !== changes.filterValue.currentValue
    ) {
      this.gridApi.setQuickFilter(changes.filterValue.currentValue);
    }
  }

  onSelectionChanged(event): void {
    const nodes = this.gridApi.getSelectedNodes();
    if (this.isRadioButton)
      this.gridApi.selectedFolder.id = nodes[0]?.data?.document.id;

    this.selectionChange.emit(nodes);
  }

  onClearSelection() {
    this.gridApi.deselectAll();
    this.selectionChange.emit(null);
  }

  getDataPath: GetDataPath = (data: any) => {
    return data.document.path ?? [Math.random()];
  };

  onGridReady(params: GridReadyEvent): void {
    this.grid = params;
    this.gridApi = params.api as any;
    this.columnApi = params.columnApi;
    this.gridApi.selectedFolder = { id: this.selectedFolderId }; // work as ngModel for radio button
    this.setRowDataToRender();
    this.gridApi.setGridOption('rowData', this.rowData);
    this.gridReady.emit(params);
  }

  onFilterChanged(params): void {
    this.gridApi.collapseAll();
    const filterValue = this.filterValue.toLowerCase();
    this.resetNodeStyles(); // Resetting node values on filter update.
    this.toggleNoRowsOverlay();
    if (filterValue) {
      let pendingNodes = [];
      let previousLevel = -1;
      const regex = new RegExp(filterValue, 'gi');
      this.gridApi.forEachNodeAfterFilter((rowNode: RowNode, index: number) => {
        if (rowNode.level === 0) {
          pendingNodes = [];
        }

        if (rowNode.data.document.name.toLowerCase().includes(filterValue)) {
          this.updateNodeStyle(rowNode, regex);
          pendingNodes.forEach((node) => {
            if (node.level < rowNode.level) {
              node.setExpanded(true);
            }
          });

          previousLevel = rowNode.level;
          pendingNodes = [rowNode];
        } else {
          if (previousLevel >= rowNode.level) {
            pendingNodes = pendingNodes.filter(
              (node) => node.level < rowNode.level
            );
          }

          pendingNodes.push(rowNode);
        }
      });
    }
  }

  private toggleNoRowsOverlay(): void {
    if (this.gridApi && !this.gridApi.getModel().isRowsToRender()) {
      this.gridApi.showNoRowsOverlay();
    } else {
      if (this.gridApi) {
        this.gridApi.hideOverlay();
      }
    }
  }

  private resetNodeStyles(): void {
    this.updatedNodeStyles.forEach((rowNode) => {
      rowNode.data.dataToRender = rowNode.data.document.name;
    });
  }

  private updateNodeStyle(rowNode: RowNode, regex: RegExp): void {
    rowNode.data.dataToRender = rowNode.data.document.name.replace(
      regex,
      (match) => `<span class="highlight-match">${match}</span>`
    );
    this.updatedNodeStyles.push(rowNode); // Remember to reset upon filter update.
  }

  private setRowDataToRender(): void {
    this.rowData.forEach((data) => (data.dataToRender = data.document.name));
  }

  fetchOnlyFolders() {
    this.folderManagementService
      .getAttachmentHierarchy(0, this.document_folder_type)
      .subscribe((documents: any) => {
        if (documents) {
          let folders = documents.filter((docs) => !docs.attachment_id);
          let attachments = this.folderAttachmentHierarchy(folders);
          if (attachments) this.rowData = attachments[0];
          else this.rowData = [];
          this.rowData.forEach((doc) => {
            doc.updated_at_datetime = doc.updated_at
              ? new Date(doc.updated_at)
              : new Date(doc.created_at);
            doc.document = doc;
          });
          this.documentService.sortDocumentsAndFolders(this.rowData);
          this.emitAllData.emit(this.rowData);
        } else this.rowData = [];
        this.gridLoader = false;
      });
  }

  folderAttachmentHierarchy(attachmentHierarchy) {
    let rootEntries = attachmentHierarchy.filter(
      (item) => item.parent_id == null
    );
    let result = [];
    if (rootEntries?.length) {
      result.push(
        ...this.traverseAttachmentHierarchy(null, [], attachmentHierarchy)
      );
      return [result, null];
    }
  }

  traverseAttachmentHierarchy(
    folderId,
    path,
    attachmentHierarchy,
    parentFolderPathString = null
  ) {
    let items = attachmentHierarchy.filter(
      (item) => item.parent_id == folderId
    );
    let result = [];
    items?.forEach((item) => {
      result.push({
        ...item,
        path: [...path, item.id],
        name: item.name,
        type: 0,
        attachmentHierarchyId: item.id,
        parentAttachmentHierarchyId: item.parent_id,
        folderPath: parentFolderPathString ?? '',
      });
      let nextFolderPathString = !parentFolderPathString?.length
        ? item.name
        : parentFolderPathString + ' > ' + item.name;
      let childEntries = this.traverseAttachmentHierarchy(
        item.id,
        [...path, item.id],
        attachmentHierarchy,
        nextFolderPathString
      );
      if (childEntries.length) {
        result.push(...childEntries);
      }
    });
    return result;
  }
}
