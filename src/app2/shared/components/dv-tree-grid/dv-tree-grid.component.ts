import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Select, Store } from '@ngxs/store';
import {
  GridApi,
  ColDef,
  GridReadyEvent,
  ColumnApi,
} from 'ag-grid-community';
import { GridService } from 'src/app2/services/grid.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { SharedService } from 'src/app2/services/shared.service';
import { GridState } from 'src/app2/store/grid/grid.state';
import { UserState } from 'src/app2/store/user/user.state';
import { VIEW_ACCESS_LEVELS } from '../../constants/constant';
import { take } from 'rxjs/operators';
import swal from 'sweetalert2/dist/sweetalert2.js';
import { ToastrService } from 'ngx-toastr';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';

@Component({
  selector: 'dv-tree-grid',
  templateUrl: './dv-tree-grid.component.html',
  styleUrls: ['./dv-tree-grid.component.css'],
})
export class DvTreeGridComponent implements OnInit, OnDestroy {
  @Input() rowData: any[];
  @Input() columnDefs: ColDef[];
  @Input() defaultAutoGroupColumnDef: ColDef;
  @Input() getContextMenuItems;
  @Input() groupDefaultExpanded = -1;
  @Input() getDataPath;
  @Input() name?;
  @Input() additionalColumns = [];
  @Input() onRowSelected = (event) => {};
  @Input() onSelectionChanged = (event) => {};
  @Input() onCellClicked? = (event) => {};
  @Input() noRowsTemplate = `No results found`;
  @Input() noRowsOverlayComponent: any;
  @Input() noRowsOverlayComponentParams: any;
  @Input() rowClass;
  @Input() getRowClass? = () => '';
  @Input() suppressContextMenu = true;
  @Input() filterData;
  @Input() customFilterInitValue = {};
  @Input() hideExportOptions = false;
  @Output() gridReady = new EventEmitter(); //Used for getting ag-grid apis too update grid columns dynamically.
  @Output() onLoadView = new EventEmitter();

  autoGroupColumnDef: ColDef;
  frameworkComponents;
  columnApi: ColumnApi;
  grid;
  sideBar;
  statusBar;
  gridSub;
  defaultColumnsSubscription;
  savedViews = [];
  selectedView;
  defaultViewId = -1;
  viewMoreActionsDropDownList;
  hasStateChanges = false;
  hasFilterChanges = false;
  hasCustomFilterChanges = false;
  hasGridPageSizeChanges = false;
  gridPageSize = '10';
  defaultGridPageSize = '10';
  defaultSettings = {
    columnState: {},
    filterState: {},
    pageSize: this.defaultGridPageSize,
    activeAlphabetFilter: '',
  };
  saveViewDropdownList = [
    { key: 'save_new', label: 'Save as New' },
    { key: 'update_view', label: 'Update this View' },
  ];
  isCustomViewPopoverOpen;
  popoverPlacement = 'bottom';
  currentUser;
  VIEW_ACCESS_LEVELS = VIEW_ACCESS_LEVELS;
  sessionSavedState;
  @Select(GridState.getGridState) gridState;
  @Select(GridState.getDefaultColumnDef) gridDefaultColumnDef;
  @Select(UserState.getCurrentUserData) user;
  @ViewChild('myGrid') myLocalGridref;

  public gridApi!: GridApi;

  constructor(
    private gridService: GridService,
    private readonly sharedService: SharedService,
    private readonly store: Store,
    private readonly modalFactory: CustomModalService,
    private readonly toasterService: ToastrService,
    private readonly SweetAlert: SweetAlertService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes?.filterData &&
      changes.filterData.previousValue !== changes.filterData.currentValue
    ) {
      this.gridCustomFiltersChanged();
    }
  }

  ngOnInit(): void {
    this.autoGroupColumnDef = { ...this.defaultAutoGroupColumnDef };
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.currentUser = data;
          const dvDefaultView = {
            id: this.defaultViewId,
            name: 'Default View',
            description: "DV's default grid view",
            is_default: false,
            grid_name: this.name,
            settings_json: {},
            level: VIEW_ACCESS_LEVELS.FIRM,
          };
          this.gridService.getGridStatesByType(this.name).subscribe(
            (gridState: any) => {
              this.savedViews = [dvDefaultView, ...gridState];
              this.init();
            },
            () => {
              this.savedViews = [dvDefaultView];
              this.init();
            }
          );
        }
      });

    this.frameworkComponents = this.gridService.getFrameWorkComponents();
    this.sideBar = this.gridService.getSidebar();
    this.sideBar.toolPanels.forEach((panel) => {
      if (panel.id === 'agGridSideBar') {
        panel.toolPanelParams = {
          gridName: this.name,
          hideExportOptions: this.hideExportOptions,
        };
      }
    });

    this.statusBar = {
      statusPanels: [
        {
          statusPanel: 'paginationBarComponent',
          statusPanelParams: {
            gridPageSize: this.gridPageSize,
            onPageSizeChanged: (newValue) => {
              this.onPageSizeChanged(newValue);
            },
            onFirstClicked: () => {
              this.onFirstClicked();
            },
            onLastClicked: () => {
              this.onLastClicked();
            },
            onPrevClicked: () => {
              this.onPrevClicked();
            },
            onNextClicked: () => {
              this.onNextClicked();
            },
          },
        },
      ],
    };
  }

  init() {
    let snapshot = this.store.selectSnapshot((state) => state.grid.gridState);
    this.sessionSavedState = snapshot[this.name];

    let defaultView = this.savedViews.find((viewObj) => viewObj.is_default);
    let currentGridState;
    if (!this.sessionSavedState && defaultView) {
      currentGridState = defaultView;
      defaultView.selected = true;
      this.selectedView = JSON.parse(JSON.stringify(defaultView));
    } else {
      currentGridState = this.savedViews[0];
      currentGridState.selected = true;
      if (!defaultView) currentGridState.is_default = true;
      if (this.sessionSavedState) {
        currentGridState.settings_json = this.sessionSavedState;
        this.gridService.deleteCurrentView(this.name);
      }
      this.selectedView = JSON.parse(JSON.stringify(currentGridState));
    }

    let existingGridState = currentGridState.settings_json;
    if (this.filterData) {
      existingGridState =
        typeof existingGridState === 'string'
          ? JSON.parse(existingGridState)
          : existingGridState;
      if (
        existingGridState &&
        Object.keys(existingGridState).length &&
        existingGridState.customFilters
      ) {
        let customFilters = existingGridState.customFilters;
        this.onLoadView.emit(JSON.parse(JSON.stringify(customFilters)));
      } else {
        this.onLoadView.emit(this.customFilterInitValue);
      }
    }

    this.defaultColumnsSubscription?.unsubscribe();
    this.defaultColumnsSubscription = this.gridDefaultColumnDef.subscribe(
      (defaultColumns) => {
        // columns defined in code
        let defaultColumnDef = defaultColumns[this.name];
        if (!defaultColumnDef) {
          return;
        }

        // append additional columns like custom fields (if any) to the default columns
        this.setGridGroupHeader();
        let existingFilters;
        if (existingGridState && Object.keys(existingGridState).length) {
          let savedDefs =
            typeof existingGridState === 'string'
              ? JSON.parse(existingGridState)
              : existingGridState;
          if (savedDefs.pageSize && this.gridPageSize !== savedDefs.pageSize) {
            this.gridPageSize = savedDefs.pageSize;
          }
          if (!this.sessionSavedState) {
            let existingColumnDef = savedDefs.columnState;
            existingFilters = savedDefs.filterState;
            // extra check for array
            if (!Array.isArray(existingColumnDef)) {
              existingColumnDef = JSON.parse(existingColumnDef);
            }
            existingColumnDef = existingColumnDef.filter((val) => val !== null);
            if (!existingColumnDef.length) existingColumnDef = defaultColumnDef;
            // remove columns which are deleted in the latest json config but present in the saved view
            existingColumnDef = existingColumnDef.filter((existingColumn) =>
              defaultColumnDef.some(
                (defaultColumn) => defaultColumn.colId === existingColumn.colId
              )
            );
            this.columnDefs = this.getColDef(
              existingColumnDef,
              defaultColumnDef
            );
          }
        } else {
          this.columnDefs = [...defaultColumnDef];
        }
        if (this.gridApi) {
          // colDef is changed so update it using gridApi
          this.gridApi.updateGridOptions({ columnDefs: [] });
          this.gridApi.updateGridOptions({
            columnDefs: this.columnDefs,
            paginationPageSize: Number(this.gridPageSize),
          });
          if (this.gridPageSize !== this.defaultSettings.pageSize) {
            this.gridService.onGridPageSizeChanged(this.gridPageSize);
            this.onPageSizeChanged(this.gridPageSize);
          }
          if (existingFilters) {
            this.gridApi.setFilterModel(existingFilters);
          }

          this.sharedService.changeColumnDefs(this.columnDefs);

          setTimeout(() => {
            const columns = this.getCurrentColumnState();
            this.defaultSettings.columnState = columns;
          }, 1);
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.defaultColumnsSubscription?.unsubscribe();
    this.myLocalGridref._nativeElement.removeEventListener(
      'cellClicked',
      this.onCellClickedEvent.bind(this)
    );
  }

  onGridReady(params: GridReadyEvent) {
    this.grid = params;
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.sharedService.changeColumnDefs(this.gridApi.getColumnDefs());
    this.gridReady.emit(params);
    this.setGridGroupHeader();
    this.myLocalGridref._nativeElement.addEventListener(
      'cellClicked',
      this.onCellClickedEvent.bind(this)
    );
  }

  appendAdditionalColumns(defaultColumnDef) {
    const defaultColumnDefCopy = JSON.parse(JSON.stringify(defaultColumnDef));
    defaultColumnDefCopy.push(...this.additionalColumns);
    return defaultColumnDefCopy;
  }

  setGridGroupHeader() {
    // if you already have a column grouped by default, override default group definition
    if (this.gridApi?.getRowGroupColumns()?.length) {
      this.autoGroupColumnDef = this.gridApi
        .getRowGroupColumns()[0]
        .getColDef();
      this.autoGroupColumnDef = {
        ...this.autoGroupColumnDef,
        headerValueGetter: (params) => params.colDef.headerName,
      };
    }
  }

  onFilterTextBoxChanged() {
    this.gridApi.setQuickFilter(
      (document.getElementById('filter-text-box') as any).value
    );
  }

  deSelectAllRows() {
    this.gridApi.deselectAll();
  }

  onPageSizeChanged(newPageSize) {
    this.gridPageSize = newPageSize;
    this.gridApi.updateGridOptions({ paginationPageSize: Number(newPageSize) });
    this.onGridPageSizeChanged();
  }

  onFirstClicked() {
    this.gridApi.paginationGoToFirstPage();
  }

  onLastClicked() {
    this.gridApi.paginationGoToLastPage();
  }

  onPrevClicked() {
    this.gridApi.paginationGoToPreviousPage();
  }

  onNextClicked() {
    this.gridApi.paginationGoToNextPage();
  }

  onPaginationChanged() {
    this.gridService.onPaginationChanged();
  }

  gotoPage(page) {
    this.gridApi.paginationGoToPage(+page - 1);
  }

  onModelUpdated(event) {
    if (this.gridApi && !this.gridApi.getModel().isRowsToRender()) {
      this.gridApi.showNoRowsOverlay();
    } else {
      if (this.gridApi) {
        this.gridApi.hideOverlay();
      }
    }
  }

  getMainMenuItems = (params) => {
    if (params.column.getId() === 'ag-Grid-AutoColumn') {
      const agGridAutoColumnMenuItems = [];
      this.addSortMenuOption(params, agGridAutoColumnMenuItems);
      agGridAutoColumnMenuItems.push({
        name: 'Ungroup',
        icon: '<span class="ag-icon ag-icon-group" unselectable="on" role="presentation"></span>',
        action: () => {
          this.gridApi.resetColumnState();
          this.gridApi.removeRowGroupColumns(this.gridApi.getRowGroupColumns());
        },
      });
      return agGridAutoColumnMenuItems;
    } else {
      const agGridMenuItems = [];
      this.addSortMenuOption(params, agGridMenuItems);
      const showGroupMenu =
        params.column.colDef.refData?.showGroupMenu !== 'false';
      if (showGroupMenu) {
        agGridMenuItems.push({
          name: 'Group',
          icon: '<span class="ag-icon ag-icon-group" unselectable="on" role="presentation"></span>',
          action: () => {
            const field = params.column.colDef.colId;
            this.gridApi.setColumnsVisible([field], false);
            this.gridApi.setRowGroupColumns([field]);
            this.gridService.onClearFilterTrigger();
            this.autoGroupColumnDef = { ...params.column.colDef, sort: null };
          },
        });
      }
      return agGridMenuItems;
    }
  };

  addSortMenuOption(params: any, menuItems: any[]) {
    if (!params.column.getSort()) {
      menuItems.push({
        name: 'Sort Ascending',
        icon: '<span class="ag-icon ag-icon-save" unselectable="on" role="presentation"></span>',
        action: () => {
          this.columnApi.applyColumnState({
            state: [
              ...this.columnApi.getColumnState(),
              { colId: params.column.getId(), sort: 'asc' },
            ],
          });
        },
      });
    } else {
      menuItems.push({
        name: 'Remove Sort',
        icon: '<span class="ag-icon ag-icon-cross" unselectable="on" role="presentation"></span>',
        action: () => {
          this.columnApi.applyColumnState({
            state: [
              ...this.columnApi.getColumnState(),
              { colId: params.column.getId(), sort: null },
            ],
          });
        },
      });
    }
  }

  onSaveDropdownClick(action) {
    let actionType = action.key;
    switch (actionType) {
      case 'save_new':
        this.saveView();
        break;
      case 'update_view':
        this.updateExistingView();
        break;
    }
  }

  getCurrentColumnState() {
    const columnState = this.gridApi?.getColumnState();
    const columns = columnState.map((state) => ({
      colId: state.colId,
      rowGroup: state.rowGroup,
      hide: state.hide,
      width: state.width,
      flex: state.flex,
      sort: state.sort,
      sortIndex: state.sortIndex,
    }));
    return columns;
  }

  updateExistingView() {
    let selectedViewIndex = this.savedViews.findIndex(
      (viewObj) => viewObj.id == this.selectedView.id
    );
    const columns = this.getCurrentColumnState();
    let filterState;
    filterState = this.gridApi.getFilterModel();

    let gridState = {
      columnState: JSON.stringify(columns),
      filterState: filterState,
      customFilters: this.filterData,
      pageSize: this.gridPageSize,
    };

    let params = {
      ...this.savedViews[selectedViewIndex],
      settings_json: gridState,
    };
    this.gridService.updateView(params).subscribe(
      (response) => {
        this.selectedView = {
          ...this.selectedView,
          ...response,
        };
        this.savedViews[selectedViewIndex] = {
          ...this.savedViews[selectedViewIndex],
          ...response,
        };
        this.hasGridPageSizeChanges =
          this.hasCustomFilterChanges =
          this.hasFilterChanges =
          this.hasStateChanges =
            false;
        this.toasterService.success('View Updated Successfully');
      },
      () => {
        this.toasterService.error('View Update Failed.');
      }
    );
  }

  saveView() {
    const columns = this.getCurrentColumnState();
    let filterState;
    filterState = this.gridApi.getFilterModel();

    let gridState = {
      columnState: JSON.stringify(columns),
      filterState: filterState,
      customFilters: this.filterData,
      pageSize: this.gridPageSize,
    };

    let params = {
      settings_json: gridState,
      grid_name: this.name,
      level: 'User',
      is_default: false,
    };

    this.modalFactory.invoke('save-view', {
      initialState: {
        state: params,
        viewList: this.savedViews,
        user: this.currentUser,
        action: 'add',
        onSave: (response) => {
          this.selectedView = response;
          if (response.is_default) {
            let defaultViewIndex = this.savedViews.findIndex(
              (viewObj) => viewObj.is_default
            );
            if (defaultViewIndex > -1)
              this.savedViews[defaultViewIndex].is_default = false;
          }
          let selectedViewIndex = this.savedViews.findIndex(
            (viewObj) => viewObj.selected
          );
          this.savedViews[selectedViewIndex].selected = false;
          this.selectedView.selected = true;
          this.savedViews = [...this.savedViews, this.selectedView];
          this.hasGridPageSizeChanges =
            this.hasCustomFilterChanges =
            this.hasFilterChanges =
            this.hasStateChanges =
              false;
          this.gridApi.closeToolPanel();
        },
      },
    });
  }

  onViewClick(view) {
    if (!view.selected) {
      view.selected = true;
      this.handleViewChange(view);
    }
  }

  handleViewChange(view) {
    let selectedViewIndex = this.savedViews.findIndex(
      (viewObj) => viewObj.id != view.id && viewObj.selected
    );
    this.savedViews[selectedViewIndex].selected = false;
    this.loadView(view);
  }

  loadView(view) {
    this.isCustomViewPopoverOpen = false;
    this.gridApi.closeToolPanel();
    this.selectedView = view;
    if (this.selectedView.id == this.defaultViewId) this.restoreDefaultView();
    else {
      let savedFilters = view.settings_json;
      this.gridPageSize = savedFilters.pageSize;
      this.gridService.onGridPageSizeChanged(this.gridPageSize);
      this.onPageSizeChanged(this.gridPageSize);
      if (savedFilters.customFilters) {
        this.onLoadView.emit(
          JSON.parse(JSON.stringify(savedFilters.customFilters))
        );
      }
      this.applyColumnState(savedFilters);
      this.gridApi.setFilterModel(savedFilters.filterState);
    }
  }

  applyColumnState(savedFilters) {
    let savedColumns = JSON.parse(savedFilters.columnState);
    this.gridApi.resetColumnState();
    this.gridApi.removeRowGroupColumns(this.gridApi.getRowGroupColumns());
    const defaultColumnDef = this.store.selectSnapshot(
      GridState.getDefaultColumnDef
    )[this.name];

    this.gridApi.setGridOption(
      'columnDefs',
      this.getColDef(savedColumns, defaultColumnDef)
    );
  }

  restoreDefaultView() {
    this.onLoadView.emit({});
    if (this.gridPageSize !== this.defaultGridPageSize) {
      this.gridPageSize = this.defaultGridPageSize;
      this.gridService.onGridPageSizeChanged(this.gridPageSize);
      this.onPageSizeChanged(this.gridPageSize);
    }
    const defaultColumnDef = this.store.selectSnapshot(
      GridState.getDefaultColumnDef
    )[this.name];
    this.columnDefs = defaultColumnDef;
    this.autoGroupColumnDef = { ...this.defaultAutoGroupColumnDef };
    this.gridApi.setGridOption('columnDefs', defaultColumnDef);
    this.gridApi.setGridOption(
      'autoGroupColumnDef',
      this.defaultAutoGroupColumnDef
    );
    // remove grouping if any
    this.gridApi.removeRowGroupColumns(this.gridApi.getRowGroupColumns());
    this.gridApi.resetColumnState();
    this.gridService.onClearFilterTrigger();

    // check if default state has any grouping
    const groupedColumns = this.gridApi
      .getRowGroupColumns()
      .map((column) => column.getColDef());
    if (groupedColumns.length) {
      // add grouping for the column
      const column = groupedColumns[0];
      this.gridApi.setColumnsVisible([column.field], false);
      this.gridApi.setRowGroupColumns([column.field]);
      this.gridApi.updateGridOptions(column);
    }

    const columns = this.getCurrentColumnState();
    this.defaultSettings.columnState = columns;
  }

  markAsDefault(view) {
    if (view.id == this.defaultViewId) {
      if (view.is_default) {
        return;
      } else {
        let defaultViewIndex = this.savedViews.findIndex(
          (viewObj) => viewObj.is_default
        );
        let remove_params = {
          is_default: false,
        };
        this.gridService
          .updateDefaultView(
            this.savedViews[defaultViewIndex].id,
            remove_params
          )
          .subscribe(
            (response) => {
              this.toasterService.success('Set as the default view.');
              this.selectedView = { ...this.selectedView, ...response };
              this.savedViews[defaultViewIndex].is_default = false;
              this.savedViews[0].is_default = true;
            },
            () => {
              this.toasterService.error('View Update Failed.');
            }
          );
      }
    } else {
      if (view.is_default) {
        this.onDropdownClick('remove_default', view);
      } else {
        this.onDropdownClick('mark_default', view);
      }
    }
  }

  onDropdownClick(action, view) {
    let actionKey = action;
    switch (actionKey) {
      case 'mark_default':
        let params = {
          is_default: true,
        };
        this.gridService.updateDefaultView(view.id, params).subscribe(
          (response) => {
            this.toasterService.success('Set as the default view.');
            let defaultViewIndex = this.savedViews.findIndex(
              (viewObj) => viewObj.is_default
            );
            if (defaultViewIndex > -1)
              this.savedViews[defaultViewIndex].is_default = false;
            let selectedViewIndex = this.savedViews.findIndex(
              (viewObj) => viewObj.id === view.id
            );
            this.savedViews[selectedViewIndex].is_default = true;
          },
          () => {
            this.toasterService.error('View Update Failed.');
          }
        );
        break;
      case 'remove_default':
        let remove_params = {
          is_default: false,
        };
        this.gridService.updateDefaultView(view.id, remove_params).subscribe(
          (response) => {
            this.toasterService.success('Removed as the default view.');
            let selectedViewIndex = this.savedViews.findIndex(
              (viewObj) => viewObj.id === view.id
            );
            this.savedViews[selectedViewIndex].is_default = false;
            this.savedViews[0].is_default = true;
          },
          () => {
            this.toasterService.error('View Update Failed.');
          }
        );
        break;
      case 'rename':
        this.modalFactory.invoke('save-view', {
          initialState: {
            state: view,
            viewList: this.savedViews,
            user: this.currentUser,
            action: 'rename',
            onSave: (response) => {
              let savedViewIndex = this.savedViews.findIndex(
                (viewObj) => view.id === viewObj.id
              );
              this.savedViews[savedViewIndex] = {
                ...this.savedViews[savedViewIndex],
                ...response,
              };
              if (this.selectedView.id === view.id)
                this.selectedView = {
                  ...this.selectedView,
                  ...response,
                };
              this.savedViews = [...this.savedViews];
              this.gridApi.closeToolPanel();
            },
          },
        });
        break;
      case 'delete':
        this.confirmDeleteViewModal(view);
        break;
    }
  }

  confirmDeleteViewModal(view) {
    if (view)
      this.SweetAlert.confirm({
        title: 'Are you sure you want to remove this view?',
        showLoaderOnConfirm: true,
        confirmButtonText: 'Remove',
        focusCancel: true,
        preConfirm: () => {
          return new Promise<void>((resolve) => {
            this.gridService.deleteView(view.id).subscribe(
              (response) => {
                let viewIndex = this.savedViews.findIndex(
                  (viewObj) => viewObj.id == view.id
                );
                this.savedViews.splice(viewIndex, 1);
                if (this.selectedView.id === view.id) {
                  let defaultViewIndex = this.savedViews.findIndex(
                    (viewObj) => viewObj.is_default
                  );
                  let selectedView;
                  if (defaultViewIndex > -1) {
                    this.savedViews[defaultViewIndex].selected = true;
                    selectedView = this.savedViews[defaultViewIndex];
                  } else {
                    this.savedViews[0].selected = true;
                    this.savedViews[0].is_default = true;
                    selectedView = this.savedViews[0];
                  }
                  this.loadView(selectedView);
                } else if (view.is_default) {
                  this.savedViews[0].selected = true;
                  this.savedViews[0].is_default = true;
                }
                this.savedViews = [...this.savedViews];
                this.toasterService.success('View deleted successfully.');
              },
              () => {
                this.toasterService.error('View Delete Failed.');
              }
            );
            resolve();
          });
        },
      }).then(() => {
        swal.close();
      });
  }

  onFirstDataRendered(event) {
    const columns = this.getCurrentColumnState();
    this.defaultSettings.columnState = columns;

    if (this.sessionSavedState)
      setTimeout(() => {
        let savedState = JSON.parse(this.sessionSavedState);
        this.applyColumnState(savedState);

        let filters = savedState.filterState;
        this.gridApi.setFilterModel(filters);
        this.gridFiltersChanged();
      }, 1);

    this.gridColumnsChanged();
  }

  gridColumnsChanged() {
    if (this.selectedView) {
      let currentGridState = this.getCurrentColumnState();
      if (this.selectedView?.id === this.defaultViewId) {
        if (
          JSON.stringify(this.defaultSettings.columnState) !==
          JSON.stringify(currentGridState)
        )
          this.hasStateChanges = true;
        else this.hasStateChanges = false;
      } else {
        let currentState = this.selectedView.settings_json;
        let oldGridState = currentState.columnState;
        if (oldGridState !== JSON.stringify(currentGridState))
          this.hasStateChanges = true;
        else this.hasStateChanges = false;
      }
    }
  }

  gridFiltersChanged() {
    if (this.selectedView) {
      let currentFilterState = this.gridApi.getFilterModel();
      if (this.selectedView?.id === this.defaultViewId) {
        if (
          JSON.stringify(this.defaultSettings.filterState) !==
          JSON.stringify(currentFilterState)
        )
          this.hasFilterChanges = true;
        else this.hasFilterChanges = false;
      } else {
        let currentState = this.selectedView.settings_json;
        let oldFilterState = currentState.filterState;
        if (
          JSON.stringify(oldFilterState) !== JSON.stringify(currentFilterState)
        )
          this.hasFilterChanges = true;
        else this.hasFilterChanges = false;
      }
    }
  }

  gridCustomFiltersChanged() {
    if (this.selectedView) {
      if (this.selectedView?.id === this.defaultViewId) {
        if (
          JSON.stringify(this.filterData) !==
          JSON.stringify(this.customFilterInitValue)
        )
          this.hasCustomFilterChanges = true;
        else this.hasCustomFilterChanges = false;
      } else {
        let currentState = this.selectedView?.settings_json;
        let oldFilterState = currentState.customFilters;
        let currentFilterState = this.filterData;
        if (
          JSON.stringify(oldFilterState) !== JSON.stringify(currentFilterState)
        )
          this.hasCustomFilterChanges = true;
        else this.hasCustomFilterChanges = false;
      }
    }
  }

  onGridPageSizeChanged() {
    if (this.selectedView) {
      if (this.selectedView?.id === this.defaultViewId) {
        if (this.defaultSettings.pageSize !== this.gridPageSize)
          this.hasGridPageSizeChanges = true;
        else this.hasGridPageSizeChanges = false;
      } else {
        let savedState = this.selectedView.settings_json;
        if (this.gridPageSize !== savedState.pageSize)
          this.hasGridPageSizeChanges = true;
        else this.hasGridPageSizeChanges = false;
      }
    }
  }

  onCellClickedEvent(event) {
    if (
      event?.data &&
      (this.hasStateChanges ||
        this.hasFilterChanges ||
        this.hasCustomFilterChanges ||
        this.hasGridPageSizeChanges)
    ) {
      const columns = this.getCurrentColumnState();
      let filterState;
      filterState = this.gridApi.getFilterModel();

      let gridState = {
        columnState: JSON.stringify(columns),
        filterState: filterState,
        customFilters: this.filterData,
        pageSize: this.gridPageSize,
      };
      this.gridService.saveCurrentView(gridState, this.name);
    }
    this.onCellClicked(event);
  }

  showSavedViews() {
    this.isCustomViewPopoverOpen = !this.isCustomViewPopoverOpen;
  }

  onPopoverHide() {
    if (this.isCustomViewPopoverOpen) this.isCustomViewPopoverOpen = false;
  }

  getColDef(existingColumnDef, defaultColumnDef) {
    let finalColDefs = [];
    existingColumnDef.map((existingColumn) => {
      const column = defaultColumnDef.find(
        (defaultColumn) => defaultColumn.colId === existingColumn.colId
      );
      // pick only relevant properties from saved view and use json present in the code to create colDef
      if (existingColumn.colId != 'ag-Grid-AutoColumn') {
        finalColDefs.push({
          ...column,
          rowGroup: existingColumn.rowGroup,
          hide: existingColumn.hide,
          width: existingColumn.width,
          flex: existingColumn.flex,
          sort: existingColumn.sort,
          sortIndex: existingColumn.sortIndex,
        });
      }
      if (
        existingColumn.rowGroup ||
        existingColumn.colId === 'ag-Grid-AutoColumn'
      ) {
        this.autoGroupColumnDef = {
          ...this.autoGroupColumnDef,
          headerName: column?.headerName ?? this.autoGroupColumnDef?.headerName, // in tree grid, column is not added with rowGroup = true. only autoGroupColumn is present with default grouping
          width: existingColumn.width,
          flex: existingColumn.flex,
          sort: existingColumn.sort,
          sortIndex: existingColumn.sortIndex,
        };
        this.gridApi.setGridOption(
          'autoGroupColumnDef',
          this.autoGroupColumnDef
        );
      }
    });

    const remainingColumns = JSON.parse(
      JSON.stringify(
        defaultColumnDef.filter(
          (column) =>
            !existingColumnDef.some(
              (existingColumn) => existingColumn.colId === column.colId
            )
        )
      )
    );
    finalColDefs.push(
      ...remainingColumns.map((column) => {
        column.hide = true;
        return column;
      })
    );
    return [...finalColDefs];
  }
}
