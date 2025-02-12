import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Select, Store } from '@ngxs/store';
import {
  ColDef,
  ColumnApi,
  GridApi,
  InitialGroupOrderComparatorParams,
  SuppressKeyboardEventParams,
} from 'ag-grid-community';
import { ToastrService } from 'ngx-toastr';
import {  take } from 'rxjs/operators';
import { GridService } from 'src/app2/services/grid.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { SharedService } from 'src/app2/services/shared.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import {
  alphabets,
  KeyTableNameMap,
  VIEW_ACCESS_LEVELS,
} from 'src/app2/shared/constants/constant';
import { GridState } from 'src/app2/store/grid/grid.state';
import { UserState } from 'src/app2/store/user/user.state';
import swal from 'sweetalert2/dist/sweetalert2.js';

@Component({
  selector: 'app-dv-grid',
  templateUrl: './dv-grid.component.html',
  styleUrls: ['./dv-grid.component.css'],
})
export class DvGridComponent implements OnInit, OnDestroy, OnChanges {
  @Input() rowData?;
  @Input() name?;
  @Input() showCharacterFilter? = false;
  @Input() autoGroupColumnHeader?;
  @Input() onRowClicked? = (event) => {};
  @Input() onCellClicked? = (event) => {};
  @Input() onRowSelected? = (event) => {}; // gets triggered for every row (selection/de-selection)
  @Input() onSelectionChanged? = (event) => {}; // get triggered once per selection/de-selection
  @Input() noRowsTemplate = `No results found`;
  @Input() noRowsOverlayComponent: any;
  @Input() showSaveView: boolean = true;
  @Input() noRowsOverlayComponentParams: any;
  // these columns will be shown regardless of saved view - currently used for checkbox in entity grids for managers
  @Input() additionalColumns = [];
  @Input() rowClass;
  @Input() getRowClass? = () => '';
  @Input() filterData;
  @Input() customFilterInitValue = {};
  @Input() showNewPagination = true;
  @Input() groupRowClickEnabled = false;
  @Output() gridReady = new EventEmitter(); //Used for getting ag-grid apis too update grid columns dynamically.
  @Output() onLoadView = new EventEmitter();
  sideBar;
  frameworkComponents;
  grid;
  gridApi: GridApi;
  columnApi: ColumnApi;
  alphabets = alphabets;
  rowDataCopy;
  active_alphabet_filter = '';
  autoGroupColumnDef: ColDef;
  statusBar: any;
  columnDefs = [];
  gridSub;
  filterStateSub;
  localDef;
  getRowStyle;
  defaultColumnsSubscription;
  additionalSettingAdded: boolean;
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
    columnState: [],
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
  subscription;
  countData: any = {};
  isGridRendered: boolean = false;
  @Select(GridState.getGridState) gridState;
  @Select(GridState.getDefaultColumnDef) gridDefaultColumnDef;
  @Select(UserState.getCurrentUserData) user;
  @ViewChild('myGrid') myLocalGridref;
  public initialGroupOrderComparator: (
    params: InitialGroupOrderComparatorParams
  ) => number = (params: InitialGroupOrderComparatorParams) => {
    const a = `${params.nodeA.key}`.toLowerCase() || '';
    const b = `${params.nodeB.key}`.toLowerCase() || '';
    return a < b ? -1 : a > b ? 1 : 0;
  };

  defaultColDef = {
    suppressKeyboardEvent,
  };

  constructor(
    readonly gridService: GridService,
    private readonly sharedService: SharedService,
    private readonly store: Store,
    private readonly modalFactory: CustomModalService,
    private readonly toasterService: ToastrService,
    private readonly SweetAlert: SweetAlertService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes?.rowData?.currentValue &&
      changes.rowData.currentValue !== changes?.rowData?.previousValue
    ) {
      this.rowDataCopy = [...changes?.rowData.currentValue];
    }

    if (
      changes?.filterData &&
      changes.filterData.previousValue !== changes.filterData.currentValue
    ) {
      this.gridCustomFiltersChanged();
    }
  }

  ngOnInit(): void {
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
          if (!this.showSaveView) {
            this.savedViews = [dvDefaultView];
            this.init();
            return;
          }
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
        };
      }
    });
    if (!this.showNewPagination)
      this.statusBar = {
        statusPanels: [
          {
            key: 'paginationBar',
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

        if (this.additionalColumns.length && !this.additionalSettingAdded)
          defaultColumnDef = this.appendAdditionalColumns(defaultColumnDef);
        // append additional columns like custom fields (if any) to the default columns
        let existingFilters;
        if (existingGridState && Object.keys(existingGridState).length) {
          let savedDefs =
            typeof existingGridState === 'string'
              ? JSON.parse(existingGridState)
              : existingGridState;
          if (savedDefs.pageSize && this.gridPageSize !== savedDefs.pageSize) {
            this.gridPageSize = savedDefs.pageSize;
          }
          if (savedDefs.activeAlphabetFilter)
            this.active_alphabet_filter = savedDefs.activeAlphabetFilter;

          if (!this.sessionSavedState) {
            let existingColumnDef = savedDefs.columnState;
            existingFilters = savedDefs.filterState;
            if (!Array.isArray(existingColumnDef)) {
              // extra check for array
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
          } else {
            this.columnDefs = [...defaultColumnDef];
          }
        } else {
          this.columnDefs = [...defaultColumnDef];
        }
        if (this.gridApi) {
          this.columnDefs.forEach((existingColumn) => {
            if (existingColumn.rowGroup) {
              this.autoGroupColumnDef = {
                ...existingColumn,
                headerName: existingColumn.headerName,
                width: existingColumn.width ?? existingColumn.minWidth,
              };
            }
          });
          // colDef is changed so update it using gridApi
          this.gridApi.updateGridOptions({ columnDefs: [] });
          this.gridApi.updateGridOptions({
            columnDefs: this.columnDefs,
            autoGroupColumnDef: this.autoGroupColumnDef,
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

          const columns = this.getCurrentColumnState();
          this.defaultSettings.columnState = columns;
        }
      }
    );
  }

  deSelectAllRows() {
    this.gridApi?.deselectAll();
  }

  onGridReady(params) {
    this.grid = params;
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.sharedService.changeColumnDefs(this.gridApi.getColumnDefs());
    this.gridReady.emit(params);
    this.setGridGroupHeader();
    this.myLocalGridref._nativeElement.addEventListener(
      'rowClicked',
      this.onRowClickedEvent.bind(this)
    );
    this.myLocalGridref._nativeElement.addEventListener(
      'cellClicked',
      this.onCellClickedEvent.bind(this)
    );
    this.updatePaginationValues();
    this.subscribeToPaginationChanges();
    // setTimeout(() => {
    //   this.toggleAccessibilityAccess();
    // }, 1500);
  }

  toggleAccessibilityAccess() {
    document
      .querySelectorAll('div[role="rowgroup"]:empty')
      .forEach((element) => {
        element.setAttribute('aria-hidden', 'true');
      });
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
            this.gridApi.updateGridOptions({
              autoGroupColumnDef: {
                ...params.column.colDef,
                sort: null,
              },
            });
          },
        });
      }
      return agGridMenuItems;
    }
  };

  addSortMenuOption(params: any, menuItems: any[]) {
    if (!params.column.getSort()) {
      menuItems.push(
        {
          name: 'Sort Ascending',
          icon: '<span class="ag-icon ag-icon-asc" unselectable="on" role="presentation"></span>',
          action: () => {
            this.gridApi.applyColumnState({
              state: [
                ...this.gridApi.getColumnState(),
                { colId: params.column.getId(), sort: 'asc' },
              ],
            });
          },
        },
        {
          name: 'Sort Descending ',
          icon: '<span class="ag-icon ag-icon-desc" unselectable="on" role="presentation"></span>',
          action: () => {
            this.columnApi.applyColumnState({
              state: [
                ...this.columnApi.getColumnState(),
                { colId: params.column.getId(), sort: 'desc' },
              ],
            });
          },
        }
      );
    } else {
      menuItems.push({
        name: 'Remove Sort',
        icon: '<span class="ag-icon ag-icon-cross" unselectable="on" role="presentation"></span>',
        action: () => {
          this.gridApi.applyColumnState({
            state: [
              ...this.gridApi.getColumnState(),
              { colId: params.column.getId(), sort: null },
            ],
          });
        },
      });
    }
  }

  filterRowDataByCharacter(character: string) {
    this.active_alphabet_filter = character;
    if (character) {
      let filter = {};
      filter[KeyTableNameMap[this.name]] = {
        filterType: 'text',
        type: 'startsWith',
        filter: character,
      };
      this.gridApi.setFilterModel(filter);
    } else {
      this.gridApi.setFilterModel({});
    }
  }

  onPageSizeChanged(newPageSize) {
    this.gridPageSize = newPageSize;
    this.gridApi.updateGridOptions({ paginationPageSize: Number(newPageSize) });
    this.onGridPageSizeChanged();
    setTimeout(() => {
      this.updatePaginationValues();
    });
  }

  onFirstClicked() {
    !this.countData.isFirstPage && this.gridApi.paginationGoToFirstPage();
  }

  onLastClicked() {
    !this.countData.isLastPage && this.gridApi.paginationGoToLastPage();
  }

  onPrevClicked() {
    !this.countData.isFirstPage && this.gridApi.paginationGoToPreviousPage();
  }

  onNextClicked() {
    !this.countData.isLastPage && this.gridApi.paginationGoToNextPage();
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

  appendAdditionalColumns(defaultColumnDef) {
    this.additionalSettingAdded = true;
    return [...defaultColumnDef, ...this.additionalColumns];
  }

  showBuilder() {
    this.gridApi.showAdvancedFilterBuilder();
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
    const columns = columnState
      ?.filter((state) => state.colId !== 'ag-Grid-AutoColumn')
      .map((state) => {
        let width = state.width;
        if (state.rowGroup) {
          let autoGroupColumn = columnState.find(
            (column) => column.colId === 'ag-Grid-AutoColumn'
          );
          if (
            autoGroupColumn &&
            autoGroupColumn.width &&
            autoGroupColumn.width != width
          ) {
            width = autoGroupColumn.width;
          }
        }
        return {
          colId: state.colId,
          rowGroup: state.rowGroup,
          hide: state.hide,
          width: width,
          flex: state.flex,
          sort: state.sort,
          sortIndex: state.sortIndex,
        };
      });
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
      activeAlphabetFilter: this.active_alphabet_filter,
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
      activeAlphabetFilter: this.active_alphabet_filter,
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
      if (savedFilters.activeAlphabetFilter)
        this.active_alphabet_filter = savedFilters.activeAlphabetFilter;
      else
        this.active_alphabet_filter = this.defaultSettings.activeAlphabetFilter;
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

  applyColumnState(savedFilter) {
    let savedColumns = JSON.parse(savedFilter.columnState);
    if (savedColumns.length) {
      this.gridApi.resetColumnState();
      this.gridApi.removeRowGroupColumns(this.gridApi.getRowGroupColumns());
      let defaultColumnDef = this.store.selectSnapshot(
        GridState.getDefaultColumnDef
      )[this.name];
      if (this.additionalColumns.length)
        defaultColumnDef = [...defaultColumnDef, ...this.additionalColumns];
      this.gridApi.setGridOption(
        'columnDefs',
        this.getColDef(savedColumns, defaultColumnDef)
      );
    }
  }

  restoreDefaultView() {
    this.onLoadView.emit({});
    if (this.gridPageSize !== this.defaultGridPageSize) {
      this.gridPageSize = this.defaultGridPageSize;
      this.gridService.onGridPageSizeChanged(this.gridPageSize);
      this.onPageSizeChanged(this.gridPageSize);
    }
    this.active_alphabet_filter = this.defaultSettings.activeAlphabetFilter;
    let defaultColumnDef = this.store.selectSnapshot(
      GridState.getDefaultColumnDef
    )[this.name];
    if (this.additionalColumns.length)
      defaultColumnDef = [...defaultColumnDef, ...this.additionalColumns];
    this.columnDefs = defaultColumnDef;
    this.gridApi.setGridOption('columnDefs', defaultColumnDef);
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
      const column: ColDef = groupedColumns[0];
      this.gridApi.setColumnsVisible([column.field], false);
      this.gridApi.setRowGroupColumns([column.field]);
      this.autoGroupColumnDef = {
        headerName: column.headerName,
        width: column.width ?? column.minWidth,
      };
      this.gridApi.setGridOption('autoGroupColumnDef', this.autoGroupColumnDef);
      // this.gridApi.updateGridOptions(column);
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
      if (this.sessionSavedState) {
        let savedState = JSON.parse(this.sessionSavedState);
        this.applyColumnState(savedState);
        let filters = savedState.filterState;
        this.gridApi.setFilterModel(filters);
        this.gridFiltersChanged();
      }
      this.gridColumnsChanged();
      this.isGridRendered = true;
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

  onRowClickedEvent(event) {
    if (
      (event?.data || this.groupRowClickEnabled) &&
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
    this.onRowClicked(event);
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
      finalColDefs.push({
        ...column,
        rowGroup: existingColumn.rowGroup,
        hide: existingColumn.hide,
        width: existingColumn.width ?? column?.width,
        flex: existingColumn.flex,
        sort: existingColumn.sort,
        sortIndex: existingColumn.sortIndex,
      });
      if (existingColumn.rowGroup) {
        this.autoGroupColumnDef = {
          ...column,
          headerName: column.headerName,
          width: existingColumn.width,
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

  subscribeToPaginationChanges() {
    this.subscription = this.gridService.gridPaginationChanged$.subscribe(() =>
      this.updatePaginationValues()
    );
  }

  updatePaginationValues() {
    this.countData = {
      currentPage: this.gridApi.paginationGetCurrentPage() + 1,
      totalPages: this.gridApi.paginationGetTotalPages() || 1,
      isFirstPage: 0,
      isLastPage: 0,
      totalCount: this.gridApi.getDisplayedRowCount(),
    };

    this.countData.isFirstPage = this.countData.currentPage === 1;
    this.countData.isLastPage =
      this.countData.currentPage === this.countData.totalPages;
    const pageSize = this.gridApi.paginationGetPageSize();
    if (this.countData.totalCount) {
      this.countData.startCount =
        pageSize * (this.countData.currentPage - 1) + 1;
    } else {
      this.countData.startCount = 0;
    }

    this.countData.endCount = Math.min(
      this.countData.totalCount,
      pageSize * this.countData.currentPage
    );
    this.countData = JSON.parse(JSON.stringify(this.countData));
  }

  ngOnDestroy(): void {
    this.gridSub?.unsubscribe();
    this.subscription?.unsubscribe();
    this.additionalSettingAdded = false;
    this.defaultColumnsSubscription?.unsubscribe();
    this.myLocalGridref?._nativeElement.removeEventListener(
      'rowClicked',
      this.onRowClickedEvent.bind(this)
    );
    this.myLocalGridref?._nativeElement.removeEventListener(
      'cellClicked',
      this.onCellClickedEvent.bind(this)
    );
  }
}

const GRID_CELL_CLASSNAME = 'ag-cell';

function getAllFocusableElementsOf(el: HTMLElement) {
  return Array.from<HTMLElement>(
    el.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])')
  ).filter((focusableEl) => {
    return focusableEl.tabIndex !== -1;
  });
}

function getEventPath(event: Event): HTMLElement[] {
  const path: HTMLElement[] = [];
  let currentTarget: any = event.target;

  while (currentTarget) {
    path.push(currentTarget);
    currentTarget = currentTarget.parentElement;
  }

  return path;
}

/**
 * Capture whether the user is tabbing forwards or backwards and suppress keyboard event if tabbing
 * outside of the children
 */
function suppressKeyboardEvent({ event }: SuppressKeyboardEventParams<any>) {
  const { key, shiftKey } = event;
  const path = getEventPath(event);
  const isTabForward = key === 'Tab' && shiftKey === false;
  const isTabBackward = key === 'Tab' && shiftKey === true;

  let suppressEvent = false;

  // Handle cell children tabbing
  if (isTabForward || isTabBackward) {
    const eGridCell = path.find((el) => {
      if (el.classList === undefined) return false;
      return el.classList.contains(GRID_CELL_CLASSNAME);
    });

    if (!eGridCell) {
      return suppressEvent;
    }

    const focusableChildrenElements = getAllFocusableElementsOf(eGridCell);
    const lastCellChildEl =
      focusableChildrenElements[focusableChildrenElements.length - 1];
    const firstCellChildEl = focusableChildrenElements[0];

    // Suppress keyboard event if tabbing forward within the cell and the current focused element is not the last child
    if (focusableChildrenElements.length === 0) {
      return false;
    }

    const currentIndex = focusableChildrenElements.indexOf(
      document.activeElement as HTMLElement
    );

    if (isTabForward) {
      const isLastChildFocused =
        lastCellChildEl && document.activeElement === lastCellChildEl;

      if (!isLastChildFocused) {
        suppressEvent = true;
        if (currentIndex !== -1 || document.activeElement === eGridCell) {
          event.preventDefault();
          focusableChildrenElements[currentIndex + 1].focus();
        }
      }
    }
    // Suppress keyboard event if tabbing backwards within the cell, and the current focused element is not the first child
    else {
      const cellHasFocusedChildren =
        eGridCell.contains(document.activeElement) &&
        eGridCell !== document.activeElement;

      // Manually set focus to the last child element if cell doesn't have focused children
      if (!cellHasFocusedChildren) {
        lastCellChildEl.focus();
        // Cancel keyboard press, so that it doesn't focus on the last child and then pass through the keyboard press to
        // move to the 2nd last child element
        event.preventDefault();
      }

      const isFirstChildFocused =
        firstCellChildEl && document.activeElement === firstCellChildEl;
      if (!isFirstChildFocused) {
        suppressEvent = true;
        if (currentIndex !== -1 || document.activeElement === eGridCell) {
          event.preventDefault();
          focusableChildrenElements[currentIndex - 1].focus();
        }
      }
    }
  }

  return suppressEvent;
}
