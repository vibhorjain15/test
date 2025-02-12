import { HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  EventEmitter,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { ColDef, ColumnApi, GridApi } from 'ag-grid-community';
import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';
import { take, finalize, tap } from 'rxjs/operators';
import { DocumentsService } from 'src/app2/services/documents.service';
import { GlobalGridFilterComponent } from 'src/app2/shared/components/global-grid-filter/global-grid-filter.component';
import { DocumentDataService } from 'src/app2/services/document-data.service';
import { GridFolderManagementService } from 'src/app2/services/grid-folder-management.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { RouterService } from 'src/app2/services/router.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import { UserState } from 'src/app2/store/user/user.state';
import {
  DateRanges,
  DocumentEventTypes,
  defaultColumn,
  grid_widths_map,
} from '../../constants/constant';
import { dvTabsList } from '../dv-tabs/dv-tabs.model';
import { DvTreeGridComponent } from '../dv-tree-grid/dv-tree-grid.component';
import { ColorTheme } from '../../themes/color.themes';
import { CurrentUserModel } from 'src/app2/store/user/user.model';
import { ToggleButtonSwitchComponent } from '../toggle-button-switch/toggle-button-switch.component';
import { DvGridEmptyStateComponent } from '../dv-grid-empty-state/dv-grid-empty-state.component';
import { DvGridLoadingStateComponent } from '../dv-grid-loading-state/dv-grid-loading-state.component';
import { GetCurrentUser } from 'src/app2/store/user/user.action';

@Component({
  selector: 'dv-document-grid',
  templateUrl: './dv-document-grid.component.html',
  styleUrls: ['./dv-document-grid.component.css'],
})
export class DvDocumentGridComponent implements OnInit, OnDestroy {
  @ViewChild('documentsGrid') documentsGrid: DvTreeGridComponent; // ref of common grid component to call the deSelect method
  @Input() gridType: 'entity' | 'content' = 'content';
  @Output() gridReloaded = new EventEmitter(); // used for entity document tab header
  isLoading = false;
  documents = [];
  rowData = [];
  customDateFilter;
  isSearchPanelCollapsed = true;
  searchCriteria: any = [];
  subscription;
  globalTernaryOperator = 'and';
  show_bulk_actions = false;
  isFolderSelected = false;
  totalSelectedRecords = 0;
  freeSubscription;
  freeManager;
  render_grid = false;
  initGridSection = false;
  initDateSection = false;
  initTabAndView = false;
  currentUser: CurrentUserModel;
  searchText = '';
  isSearchResults = false;
  dateFormat = 'MM-DD-YYYYTHH:mm:ss';
  dateDisplayFormat = 'DD MMM YYYY';
  initializeSearchDetails = true;
  filterParams: any = {};
  oldQueryText = '';
  oldGlobalOperator = 'any';
  documentsChardinConfig;
  columnDefs: ColDef[] = [];
  columnDefsCopy = [];
  gridName: string = 'documents_myattachments';
  fileviewGridName: string = 'documents';
  folderviewGridName: string = 'documents_folderview';
  gridSelectedData = [];
  noGroupsDocuments = [];
  treeGridApi;
  emptyFolderSelected: boolean = true;
  groupHelpers = [
    {
      unGroupedColumn: 'group_names',
      groupedName: 'group_names',
    },
    {
      unGroupedColumn: 'project_name',
      groupedName: 'project_name',
    },
    {
      unGroupedColumn: 'template_name',
      groupedName: 'template_name',
    },
    {
      unGroupedColumn: 'associated_all_entities',
      groupedName: 'associated_all_entities',
    },
    {
      unGroupedColumn: 'shared_with_firm_names',
      groupedName: 'shared_with_firm_names',
    },
    {
      unGroupedColumn: 'document_types',
      groupedName: 'document_types',
    },
  ];
  lastGroupedCol = '';
  autoGroupColDef;
  baseAttachmentHierarchyId;
  gridClipboardData: any[] = new Array<any>();
  clipboardOperation;
  colorTheme = ColorTheme;
  @ViewChild('documentsTreeGrid') treeGrid: DvTreeGridComponent;
  @ViewChild('viewToggler') viewToggler: ToggleButtonSwitchComponent;

  tabs: dvTabsList[] = [
    {
      name: 'Uploads',
      link: 'MyAttachments',
      active: true,
      condition: true,
    },
    {
      name: 'Received',
      link: 'Received',
      active: false,
      condition: true,
    },
    {
      name: 'All',
      link: 'All',
      active: false,
      condition: true,
    },
  ];
  selectedTab = this.tabs[0];
  isFilterApplied = false;

  newOptions = [];

  viewOptions = [
    {
      label: 'File View',
      key: 1,
      leftIcon: 'list',
      leftIconClass: 'text-primary',
    },
    {
      label: 'Folder View',
      key: 2,
      leftIcon: 'folder',
      leftIconClass: 'text-primary',
    },
  ];

  bulkFolderOperationOptions = [];
  stateParams;
  selectedViewType = 1;
  hideEmptyFolders = false;

  @Select(UserState.getCurrentUserData) user$;
  @Select(UserState.getFirmPreferenceData) firmPref;
  firmPreference;
  isFirmPreferenceSubscribed = false;

  columnApi: ColumnApi;
  treegridColumnApi: ColumnApi;
  gridColumnApi: ColumnApi;
  gridApi: GridApi;
  pageurl;
  firmId;
  entity_id;
  entity_label;
  entity_type;
  @ViewChild('documentsFilter')
  globalGridFilterComponent: GlobalGridFilterComponent;
  columnRowGroupChangedListener;
  routerStateUrl;
  noRowsOverlayComponent = DvGridEmptyStateComponent;
  loadingOverlayComponent = DvGridLoadingStateComponent;
  noRowsOverlayComponentParams: any = {
    canAllowDocumentUpload: () => {
      return this.canShowEmptyGridOpenUploadModal();
    },
    openDocumentUploadModal: () => {
      this.addDocument(true, this.baseAttachmentHierarchyId, true);
    },
  };
  filterData = {
    dateRange: {},
    filterParams: {},
    searchCriteria: [],
    globalTernaryOperator: this.globalTernaryOperator,
  };
  filterInitValue = {
    dateRange: {},
    filterParams: {},
    searchCriteria: [],
    globalTernaryOperator: this.globalTernaryOperator,
  };
  appliedFilterData;
  dateMap = {
    1: DateRanges[0].value,
    3: DateRanges[1].value,
    6: DateRanges[2].value,
    12: DateRanges[3].value,
    null: DateRanges[4].value,
  };
  groupedDocuments = [];
  isMultivaluedColumnGrouping: boolean = false;
  receivedDocumentsNewCount = null;

  constructor(
    private readonly http: HttpClient,
    private readonly routerService: RouterService,
    private readonly Utils: UtilsService,
    private readonly SweetAlert: SweetAlertService,
    private readonly toaster: ToastrService,
    private readonly documentsService: DocumentsService,
    private readonly store: Store,
    private readonly customModalFactory: CustomModalService,
    private readonly documentDataService: DocumentDataService,
    private readonly gridFolderService: GridFolderManagementService
  ) {}

  ngOnInit() {
    this.initView();
  }

  ngOnDestroy(): void {
    this.gridApi?.removeEventListener(
      'columnRowGroupChanged',
      this.columnRowGroupChangedListener
    );
  }

  async initView() {
    this.isFirmPreferenceSubscribed = false;
    this.setEntityType();
    const params = this.routerService.getState()?.params;
    let viewType = '',
      tab = '';
    let selectedViewType = null,
      selectedTab = null;
    if (params) {
      tab = params.tab ? params.tab.toLowerCase() : tab;
      viewType = params.view ? params.view.toLowerCase() : viewType;

      if (
        params.receivedDocumentsNewCount &&
        !isNaN(Number(params.receivedDocumentsNewCount)) &&
        Number(params.receivedDocumentsNewCount) > 0
      ) {
        this.tabs[1].name = `Received <span class="align-middle label label-orange inline-block">
            <small>${params.receivedDocumentsNewCount} new</small>
          </span>`;
      }

      switch (tab) {
        case 'received':
          selectedTab = this.tabs.find((tab) => tab.link == 'Received');
          break;
        case 'all':
          selectedTab = this.tabs.find((tab) => tab.link == 'All');
          break;
        case 'uploads':
          selectedTab = this.tabs.find((tab) => tab.link == 'MyAttachments');
          break;
      }

      switch (viewType) {
        case 'folder':
          selectedViewType = 2;
          break;
        case 'file':
          selectedViewType = 1;
          break;
      }

      this.hideEmptyFolders = params.hide_empty?.toLowerCase() === 'true';
    }

    if (!selectedTab || !selectedViewType) {
      if (!this.isFirmPreferenceSubscribed) {
        this.getFirmPreference(
          this.setSelectedTabAndViewFromFirmPreference(
            !selectedTab,
            !selectedViewType
          )
        );
      } else {
        if (!selectedTab) {
          this.selectedTab = this.tabs.find(
            (tab) =>
              tab.link ==
              (this.firmPreference?.default_document_tab ?? 'MyAttachments')
          );
        }
        if (!selectedViewType) {
          this.selectedViewType = this.getDefaultDocumentViewInt(
            this.firmPreference?.default_document_view
          );
        }
        this.updateQueryParams();
      }

      return;
    }

    this.setSelectedTabAndView(selectedTab, selectedViewType);

    this.user$
      .pipe(
        take(2),
        tap((userData) => {
          if (!userData) {
            this.store.dispatch(new GetCurrentUser());
          }
        })
      )
      .subscribe((user) => {
        if (user) {
          this.currentUser = user;
          this.freeSubscription = user.isFreeSubscription;
          this.freeManager = user.isFreeManager;
          this.subscription = user.firmInfo.subscription;
          const routerState = this.routerService.getState();
          this.isSearchResults = routerState.params.status === 'Search';
          if (this.entity_type == 'Firm' && !this.entity_id) {
            // MyFirm scenario
            this.entity_id = this.currentUser.firmInfo.id;
          }

          this.setNewOptions();
          this.setBulkFolderOperationOptions();
          this.setGridColumns();
          this.setBulkFolderOperationOptions();
          if (!this.isFirmPreferenceSubscribed) {
            this.getFirmPreference();
          }
          this.render_grid = true;
        }
      });
  }

  setSelectedTabAndViewFromFirmPreference(setTab = true, setViewType = true) {
    return () => {
      if (setTab) {
        this.selectedTab = this.tabs.find(
          (tab) =>
            tab.link ==
            (this.firmPreference?.default_document_tab ?? 'MyAttachments')
        );
      }

      if (setViewType) {
        this.selectedViewType = this.getDefaultDocumentViewInt(
          this.firmPreference?.default_document_view
        );
      }

      if (setTab || setViewType) {
        this.updateQueryParams();
      }
    };
  }

  setSelectedTabAndView(selectedTab, selectedViewType) {
    this.selectedTab = selectedTab;
    this.selectedViewType = selectedViewType;
    this.tabs.forEach((tab) => (tab.active = false));
    this.selectedTab.active = true;
    this.setGridName();
    this.initTabAndView = true;

    if (this.gridType == 'content') {
      this.documentDataService
        .getReceivedAttachmentsNewCount(
          null,
          null,
          this.entity_type,
          this.entity_id
        )
        .subscribe((res: any) => {
          this.receivedDocumentsNewCount = res?.count;
          if (res?.count) {
            this.tabs[1].name = `Received <span class="align-middle label label-orange inline-block">
            <small>${res.count} new</small>
          </span>`;

            if (this.selectedTab?.link == 'Received') {
              setTimeout(() => {
                this.tabs[1].name = 'Received';
              }, 8000);
            }
          }
        });
    }

    setTimeout(() => {
      if (this.selectedTab?.link == 'Received' && this.gridType == 'content') {
        this.documentDataService
          .postDocumentStatisticsEvent({
            event_type: DocumentEventTypes.document_received_tab_view,
          })
          .subscribe(() => {});
        this.receivedDocumentsNewCount = 0;
      }
    }, 1000);
  }

  updateQueryParams() {
    let params = this.stateParams.queryParams;
    params.tab = this.getTabName().toLowerCase();
    params.view = this.selectedViewType == 1 ? 'file' : 'folder';
    params.receivedDocumentsNewCount = this.receivedDocumentsNewCount;
    this.routerService.navigateWithParams(
      this.gridType == 'content'
        ? 'app.content.documents'
        : this.getEntityRouterStateUrl(),
      this.stateParams,
      {
        reload: true,
      }
    );
    return;
  }

  getDefaultDocumentViewInt(defaultDocumentView) {
    if (!defaultDocumentView) {
      return 1;
    }

    switch (defaultDocumentView.toLowerCase()) {
      case 'file':
        return 1;
      case 'folder':
        return 2;
    }
  }

  getFirmPreference(callback = null) {
    this.isFirmPreferenceSubscribed = true;
    this.firmPref.pipe(take(1)).subscribe((response: any) => {
      if (response) {
        this.firmPreference = response;
        if (callback) {
          callback();
        }
      }
    });
  }

  loadView(filterData) {
    let dateFilter = this.Utils.getPredefinedDateRanges(
      this.firmPreference.default_daterange_months
    );
    if (
      !filterData.hasOwnProperty('dateRange') ||
      (filterData.dateRange && Object.keys(filterData.dateRange).length == 0)
    ) {
      if (this.firmPreference.default_daterange_months) {
        this.customDateFilter = {
          startDate: this.Utils.formatDatetime(dateFilter.startDate),
          endDate: this.Utils.formatDatetime(dateFilter.endDate),
          range: this.firmPreference?.default_daterange_months ?? 'null',
        };
      } else {
        this.customDateFilter = null;
      }
    } else {
      if (filterData.dateRange?.range) {
        this.customDateFilter = this.dateMap[filterData.dateRange.range];
        this.customDateFilter = {
          startDate: this.Utils.getFromDateTimeFormatted(
            this.customDateFilter[0]
          ),
          endDate: this.Utils.getToDateTimeFormatted(this.customDateFilter[1]),
          range: filterData.dateRange.range,
        };
      } else if (
        filterData.dateRange?.startDate &&
        filterData.dateRange?.endDate
      ) {
        this.customDateFilter = {
          startDate: this.Utils.getFromDateTimeFormatted(
            filterData.dateRange.startDate
          ),
          endDate: this.Utils.getToDateTimeFormatted(
            filterData.dateRange.endDate
          ),
        };
      } else {
        this.customDateFilter = null;
      }
    }

    if (filterData.filterParams) {
      this.filterParams = filterData.filterParams;
      this.searchText = filterData.filterParams.q ?? '';
    } else {
      this.searchText = '';
      this.filterParams = {
        q: this.searchText,
      };
    }

    this.globalTernaryOperator = filterData.globalTernaryOperator ?? 'and';
    this.searchCriteria =
      filterData.searchCriteria && filterData.searchCriteria.length > 0
        ? filterData.searchCriteria
        : [
            {
              criteriaObj: { items: [{ id: 'equals', name: 'Equals' }] },
              value: null,
              condition: null,
            },
          ];
    this.isFilterApplied = this.filterParams.isFilterApplied ?? false;
    this.appliedFilterData = {
      searchCriteria: this.searchCriteria,
      filterParams: this.filterParams,
    };
    this.filterData = {
      ...this.filterData,
      filterParams: this.filterParams,
      searchCriteria: this.searchCriteria,
      globalTernaryOperator: this.globalTernaryOperator,
      dateRange: this.getDateObject(),
    };

    this.globalGridFilterComponent?.updateFilterDataAndGenerateSearchQuery(
      this.appliedFilterData
    );

    this.filterInitValue = {
      ...this.filterInitValue,
      filterParams: this.filterParams,
      searchCriteria: this.searchCriteria,
      globalTernaryOperator: this.globalTernaryOperator,
      dateRange: this.getDateObject(),
    };

    this.initializeDocumentsGrid();
  }

  getDateObject() {
    let dateObj;
    if (this.customDateFilter?.range) {
      dateObj = {
        range: parseInt(this.customDateFilter.range),
      };
    } else if (
      this.customDateFilter?.startDate &&
      this.customDateFilter?.endDate
    ) {
      dateObj = {
        startDate: this.customDateFilter?.startDate,
        endDate: this.customDateFilter?.endDate,
      };
    } else {
      dateObj = null;
    }
    return dateObj;
  }

  setEntityType() {
    this.stateParams = this.routerService.getState()?.params;
    if (this.gridType === 'entity') {
      this.pageurl = window.location.hash.slice(1);
      this.firmId = this.stateParams.firmId;

      if (this.stateParams.diligenceId) {
        this.entity_id = parseInt(this.stateParams.diligenceId);
        this.entity_type = 'DueDiligence';
      } else if (this.stateParams.vehicleId) {
        this.entity_id = parseInt(this.stateParams.vehicleId);
        this.entity_type = 'Vehicle';
      } else if (this.stateParams.fundId) {
        this.entity_id = parseInt(this.stateParams.fundId);
        this.entity_type = 'Fund';
      } else if (this.stateParams.strategyId) {
        this.entity_id = parseInt(this.stateParams.strategyId);
        this.entity_type = 'Strategy';
      } else if (this.stateParams.firmId) {
        this.entity_id = parseInt(this.stateParams.firmId);
        this.entity_type = 'Firm';
      } else {
        // assuming its myFirm
        this.entity_type = 'Firm';
      }
      this.entity_label =
        this.entity_type === 'Fund'
          ? 'Product'
          : this.entity_type === 'DueDiligence'
          ? 'Diligence'
          : this.entity_type;
    }
  }

  getEntityRouterStateUrl() {
    let routerStateUrl = '';
    if (this.entity_type === 'Firm') {
      if (!this.entity_id || this.entity_id == this.currentUser?.firmInfo?.id) {
        // my firm case
        routerStateUrl = 'app.monitor.my_firm.profile.documents.list';
      } else {
        routerStateUrl = 'app.firms.profile.documents.list';
      }
    } else if (this.entity_type === 'Fund') {
      routerStateUrl = 'app.firms.funds.profile.documents.list';
    } else if (this.entity_type === 'Strategy') {
      routerStateUrl = 'app.firms.strategies.profile.documents.list';
    } else if (this.entity_type === 'Vehicle') {
      routerStateUrl = 'app.firms.funds.vehicles.profile.documents.list';
    }
    return routerStateUrl;
  }

  handleHideEmptyFolderChange(val) {
    this.hideEmptyFolders = val;
    this.closeQuickActions();
    if (val) {
      this.removeEmptyFolders();
    } else {
      this.documentsService.resetToOriginalDocuments();
      this.performFilteringAndUpdateGrid();
    }
    this.updateRouteParams('hide_empty', val);
  }

  removeEmptyFolders() {
    this.documents = this.documentsService.getDocumentsAndNonEmptyFolders(
      this.documents
    );
  }

  setBulkFolderOperationOptions() {
    this.bulkFolderOperationOptions = [];
    if (
      this.gridType === 'content' &&
      (this.currentUser?.isAdmin || this.currentUser?.isOwner) &&
      !this.currentUser?.isSecurityAdmin &&
      !this.freeSubscription
    ) {
      this.bulkFolderOperationOptions.push({
        label: 'Bulk Organize Documents',
        key: 1,
      });
      this.bulkFolderOperationOptions.push({
        label: 'Flatten All Folders',
        key: 2,
      });
    }
  }

  handleBulkFolderOperationDropdownClick(item) {
    switch (item.key) {
      case 1:
        this.handleBulkOrganize();
        break;
      case 2:
        this.flattenAttachments(true);
        break;
    }
  }

  getDataPath = (event) => {
    return event.document.path ?? [Math.random()];
  };

  createNewFolder(path, pathHirearchy?) {
    this.customModalFactory.invoke('create-document', {
      initialState: {
        last_parent_folder: path,
        document_folder_type: this.selectedTab?.link == 'MyAttachments' ? 1 : 2,
        is_file_path: false,
        documents: [...this.documents],
        defaultSelectionPath:
          pathHirearchy &&
          this.gridFolderService.getCurrentFolderPath(
            this.documents,
            pathHirearchy
          ),
        success: (value) => {
          if (value) {
            this.toaster.success('Folder has been created successfully');
            if (this.selectedViewType == 1) {
              const params = this.stateParams.queryParams;
              params.tab = this.getTabName().toLowerCase();
              params.view = 'folder';
              params.receivedDocumentsNewCount = this.receivedDocumentsNewCount;
              this.routerService.navigateWithParams(
                this.gridType == 'content'
                  ? 'app.content.documents'
                  : this.getEntityRouterStateUrl(),
                this.stateParams,
                {
                  reload: true,
                }
              );
              return;
            }
            this.refreshGrid();
          }
        },
        entityId: this.gridType == 'entity' ? this.entity_id : null,
        entityType: this.gridType == 'entity' ? this.entity_type : null,
      },
      class: 'modal-xs',
    });
  }

  renameFolder(document) {
    this.customModalFactory.invoke('create-document', {
      initialState: {
        document_folder_type: this.selectedTab?.link == 'MyAttachments' ? 1 : 2,
        documents: [...this.documents],
        mode: 'edit',
        existingFolder: document,
        success: (value) => {
          if (value) {
            this.refreshGrid();
            this.toaster.success('Folder has been renamed successfully');
          }
        },
      },
    });
  }

  setGridColumns() {
    this.columnDefs = this.getColDefs();
    this.columnDefsCopy = JSON.parse(JSON.stringify(this.columnDefs));

    this.store.dispatch(
      new SetDefaultColumnDef({
        [this.gridName]: this.columnDefs,
      })
    );
  }

  getColDefs() {
    this.columnDefs = this.documentsService.getDocumentColDef(
      this.currentUser.isInvestor,
      this.selectedTab?.link,
      this.gridType,
      this.selectedViewType == 1 ? 'file' : 'folder'
    );

    if (this.selectedViewType == 2) {
      this.autoGroupColDef = {
        ...defaultColumn,
        colId: 'document_name',
        headerName: 'Name',
        headerCheckboxSelection: true,
        headerCheckboxSelectionFilteredOnly: true,
        field: 'document_name',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        floatingFilterComponent: 'textFloatingFilterComponent',
        suppressFloatingFilterButton: true,
        floatingFilterComponentParams: {
          placeHolder: 'Search by name',
        },
        cellRenderer: 'agGroupCellRenderer',
        cellClass: 'folder-name-cell',
        checkboxSelection: true,
        cellRendererParams: {
          gridType: this.gridType,
          currentUser: this.currentUser,
          tab: this.selectedTab?.link,
          clickedPreview: (document) => {
            this.getSignedURL(document);
          },
          openDocumentUpdateDialog: (document) => {
            this.openDocumentUpdateDialog(document);
          },
          openDocumentShareDialog: (document) => {
            this.openDocumentShareDialog(document);
          },
          confirmDocumentDeletion: (document) => {
            this.confirmDocumentDeletion(document);
          },
          moveOrCopyDocument: (
            operationType: 'move' | 'copy',
            document: any
          ) => {
            this.moveOrCopySelectedDocuments(operationType, [document]);
          },
          renameDocument: (document) => {
            this.renameFolder(document);
          },
          editFolder: (folderDetails: any, documents: Array<any>) => {
            this.editFolder(folderDetails, documents);
          },
          handleDownload: (item) => {
            if (item.type == 1) {
              this.toaster.info('Downloading the requested document.');
              this.documentsService
                .downloadDocument(item)
                .subscribe((response: any) => {
                  this.documentsService.downloadFile(
                    response.body,
                    item.name || item.file_name || 'download',
                    item.file_name
                  );
                });
            } else {
              this.downloadSingleFolder(item);
            }
          },
          suppressCount: true,
          innerRenderer: 'folderCellRendererComponent',
        },
        minWidth: grid_widths_map['lg_column_lg'],
        suppressColumnsToolPanel: true,
        groupDefaultExpanded: 0,
      };
    } else {
      if (!this.freeSubscription) {
        this.columnDefs.unshift({
          ...defaultColumn,
          colId: 'folderPath',
          headerName: 'Folder Path',
          field: 'folderPath',
          filter: 'agTextColumnFilter',
          floatingFilter: true,
          floatingFilterComponent: 'textFloatingFilterComponent',
          suppressFloatingFilterButton: true,
          floatingFilterComponentParams: {
            placeHolder: 'Search by Path',
          },
          minWidth: grid_widths_map['sm_column_lg'],
          cellClass: 'my-permission-cursor-pointer',
        });
      }
      this.columnDefs.unshift({
        ...defaultColumn,
        colId: 'document_name',
        headerName: 'Document Name',
        field: 'document_name',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        suppressColumnsToolPanel: true,
        floatingFilterComponent: 'textFloatingFilterComponent',
        suppressFloatingFilterButton: true,
        floatingFilterComponentParams: {
          placeHolder: 'Search by Name',
        },
        cellRendererParams: {
          currentUser: this.currentUser,
          tab: this.selectedTab?.link,
          gridType: this.gridType,
          clickedPreview: (document) => {
            this.getSignedURL(document);
          },
          openDocumentUpdateDialog: (document) => {
            this.openDocumentUpdateDialog(document);
          },
          openDocumentShareDialog: (document) => {
            this.openDocumentShareDialog(document);
          },
          confirmDocumentDeletion: (document) => {
            this.confirmDocumentDeletion(document);
          },
          moveOrCopyDocument: (
            operationType: 'move' | 'copy',
            document: any
          ) => {
            this.moveOrCopySelectedDocuments(operationType, [document]);
          },
          handleDownload: (document) => {
            this.toaster.info('Downloading the requested document.');
            this.documentsService
              .downloadDocument(document)
              .subscribe((response: any) => {
                this.documentsService.downloadFile(
                  response.body,
                  document.name || document.file_name || 'download',
                  document.file_name
                );
              });
          },
        },
        minWidth: grid_widths_map['sm_column_xxl'],
        cellClass: 'my-permission-cursor-pointer',
        cellRenderer: 'documentNameCellRendererComponent',
        enableRowGroup: false,
        rowGroup: false,
        initialRowGroup: false,
      });
      this.columnDefs.unshift({
        colId: 'selectAll',
        field: 'selectAll',
        checkboxSelection: true,
        headerCheckboxSelection: true,
        headerCheckboxSelectionFilteredOnly: true,
        lockPosition: true,
        width: 50,
        initialWidth: 50,
        maxWidth: 50,
        suppressHeaderMenuButton: true,
        suppressAutoSize: true,
        resizable: false,
        headerClass: 'my-permission-checkbox',
        cellClass: 'my-permission-checkbox',
        suppressColumnsToolPanel: true,
      });
    }

    return this.columnDefs;
  }

  onCellClicked = (event) => {
    if (
      (event.colDef &&
        event.colDef.colId !== 'action' &&
        event.colDef.colId !== 'document_name' &&
        event.colDef.colId !== 'ag-Grid-AutoColumn' &&
        event.data?.document?.type === 1) ||
      !event.colDef
    ) {
      const documentId =
        event.data?.document?.attachment_id || event.data?.document?.id;
      if (
        this.showFilters() ||
        (this.isSearchResults &&
          this.searchText.length &&
          !event.data.document.attachment_id)
      ) {
        let url: any = this.routerService.href('app.content.document.detail', {
          documentId,
        });
        window.open(url, '_blank');
      } else {
        this.routerService.navigateWithParams('app.content.document.detail', {
          documentId,
        });
      }
    }
  };

  initCustomDateRangeFilter() {
    const params = this.routerService.getState()?.params;
    if (params.date_range) {
      this.customDateFilter =
        params.date_range !== 'none'
          ? this.getDateRangeFromParam(params)
          : null;
    }
    this.initializeDocumentsGrid();
  }

  onChange(event) {
    if (event && event.startDate && event.endDate) {
      if (
        !(
          this.customDateFilter?.range == event.range &&
          moment(event.startDate).isSame(this.customDateFilter?.startDate) &&
          moment(event.endDate).isSame(this.customDateFilter?.endDate)
        )
      ) {
        this.customDateFilter = {
          startDate: this.Utils.formatDatetime(event.startDate),
          endDate: this.Utils.formatDatetime(event.endDate),
          selectedRange: event.range,
          range: event.range,
        };
        this.filterData = {
          ...this.filterData,
          dateRange: this.getDateObject(),
        };
        this.refreshGrid();
      }
    }
  }

  onClearDateFilter() {
    setTimeout(() => {
      let existingCustomDateFilter = this.customDateFilter;
      this.customDateFilter = null;
      this.filterData = {
        ...this.filterData,
        dateRange: this.getDateObject(),
      };
      if (
        existingCustomDateFilter != null &&
        existingCustomDateFilter.range !== 'null'
      ) {
        this.refreshGrid();
      }
    });
  }

  getSignedURL(entity, openDocument = true) {
    return this.documentsService.getSignedURL(entity, openDocument);
  }

  toggleSearchPanel() {
    this.isSearchPanelCollapsed = !this.isSearchPanelCollapsed;
    if (this.isSearchPanelCollapsed) {
      this.keepAppliedFilters();
    }
  }

  keepAppliedFilters() {
    this.globalGridFilterComponent?.revertSearchCriteria();
    this.searchCriteria = this.globalGridFilterComponent?.searchCriteria
      ? [...this.globalGridFilterComponent.searchCriteria]
      : [];
    if (!this.searchCriteria.length) {
      this.resetFiltersData();
    }
  }

  onFilterApplyAction(filters) {
    const { data, isFilterApplied, searchCriteria } = filters;
    const keywordParam = data.q || '';
    this.filterParams = data;
    this.isSearchPanelCollapsed = true;
    this.filterParams.isFilterApplied = isFilterApplied;
    this.searchCriteria = searchCriteria;
    this.isFilterApplied = this.searchCriteria?.some(
      (criteria) =>
        criteria.criteriaObj ||
        criteria.condition != null ||
        criteria.value != null
    );
    this.globalTernaryOperator = this.filterParams.global_operator ?? 'and';
    if (keywordParam !== this.oldQueryText) {
      this.reinitializeDocumentsGrid(this.selectedTab?.link);
      this.oldQueryText = keywordParam;
      this.oldGlobalOperator = this.oldGlobalOperator;
    } else {
      this.performFilteringAndUpdateGrid();
      this.showFilters();
    }

    this.filterData = {
      ...this.filterData,
      filterParams: this.filterParams,
      searchCriteria: this.searchCriteria,
      globalTernaryOperator: this.globalTernaryOperator,
    };
  }

  initializeFiltering() {
    this.filterParams = this.getSearchQuery();
    const keywordParam = this.filterParams.q || '';
    const globalOperator = this.filterParams.global_operator;
    if (keywordParam) {
      this.reinitializeDocumentsGrid(this.selectedTab?.link);
      this.oldQueryText = keywordParam;
      this.oldGlobalOperator = globalOperator;
    } else {
      this.performFilteringAndUpdateGrid();
    }
  }

  initializeDocumentsGrid(): void {
    this.reinitializeDocumentsGrid(this.selectedTab?.link);
    this.initDateSection = true;
    this.initializeFiltering();
    this.gridReloaded.emit();
  }

  reinitializeDocumentsGrid(selectedTab) {
    this.initializeSearchDetails = true;
    this.initGridSection = false;
    this.closeQuickActions();
    this.documents = [];
    let queryParams: any = {};
    if (this.gridType === 'content') {
      queryParams = {
        q: this.filterParams.q,
        global_operator: this.globalTernaryOperator,
      };
      if (this.customDateFilter && this.customDateFilter?.range !== 'null') {
        queryParams.start_date = this.Utils.formatDatetime(
          this.customDateFilter?.startDate
        );
        queryParams.end_date = this.Utils.formatDatetime(
          this.customDateFilter?.endDate
        );
      } else {
        queryParams.start_date = null;
        queryParams.end_date = null;
      }
      const queryParamsCopy = queryParams;
      Object.keys(queryParamsCopy).forEach((key) => {
        if (!queryParams[key]) {
          delete queryParams[key];
        }
      });
    } else {
      queryParams = {
        entity_id: this.entity_id,
        entity_type: this.entity_type,
        q: this.searchText,
      };
    }
    queryParams.type = this.selectedTab.link;
    this.documentsService
      .getDocumentsRowData(
        queryParams,
        this.selectedTab?.link,
        this.currentUser?.firmInfo.id,
        this.selectedViewType,
        this.gridType,
        this.gridType == 'entity' ? this.entity_id : null,
        this.gridType == 'entity' ? this.entity_type : null
      )
      .subscribe(
        (response) => {
          if (this.selectedTab?.link == selectedTab) {
            this.baseAttachmentHierarchyId = response.baseAttachmentHierarchyId;
            this.documents = response.attachments;
            this.documentsService.setDocuments(response.attachments);
            this.documentsService.setOriginalDocuments(response.attachments);
            this.initGridSection = true;
            if (this.searchCriteria.length && this.documents.length) {
              this.performFilteringAndUpdateGrid();
            } else if (this.searchText) {
              this.documents =
                this.documentsService.getDocumentsAndNonEmptyFolders(
                  this.documents
                );
              this.documentsService.setDocuments(this.documents);
              this.documentsService.setOriginalDocuments(this.documents);
            }
            if (this.hideEmptyFolders) {
              this.removeEmptyFolders();
            }
            this.setGroupedDocuments();
          }
        },
        (e) => {
          setTimeout(() => {
            if (this.selectedTab?.link == selectedTab) {
              this.documents = [];
              this.documentsService.setDocuments(this.documents);
              this.documentsService.setOriginalDocuments(this.documents);
              if (this.hideEmptyFolders) {
                this.removeEmptyFolders();
              }
              this.setGroupedDocuments();
              this.initGridSection = true;
            }
          }, 100);
        }
      );
  }

  performFilteringAndUpdateGrid() {
    this.documents = this.documentsService.filterDocuments(
      this.filterParams,
      this.selectedTab?.link === 'All',
      this.currentUser?.firmInfo?.id
    );

    if (this.hideEmptyFolders) {
      this.removeEmptyFolders();
    }
    this.setGroupedDocuments();
  }

  handleTabChange(index) {
    if (this.selectedTab?.link == 'Received') {
      this.receivedDocumentsNewCount = 0;
    }

    this.selectedTab = this.tabs[index];
    const params = this.stateParams.queryParams;
    params.tab = this.getTabName().toLowerCase();
    params.receivedDocumentsNewCount = this.receivedDocumentsNewCount;
    this.routerService.navigateWithParams(
      this.gridType == 'content'
        ? 'app.content.documents'
        : this.getEntityRouterStateUrl(),
      this.stateParams,
      {
        reload: true,
      }
    );
    this.initGridSection = false;
  }

  setNewOptions() {
    this.newOptions = [
      { label: 'Upload Document', key: 2 },
      {
        label: 'Upload Folder',
        key: 3,
        disabled: this.freeSubscription ? true : null,
        tooltip: this.freeSubscription
          ? 'Available with premium subscription'
          : null,
      },
    ];

    if (this.gridType == 'entity') {
      this.newOptions.unshift({ label: 'Add Existing', key: 4 });
    }

    if (!this.freeSubscription) {
      this.newOptions.unshift({ label: 'New Folder', key: 1 });
    }
  }

  handleOnSearch($event) {
    this.searchText = $event;
    if (!this.filterParams) {
      this.filterParams = {
        global_operator: this.globalTernaryOperator,
      };
    }
    this.filterParams.q = this.searchText;
    this.filterData = {
      ...this.filterData,
      filterParams: this.filterParams,
    };
    this.reinitializeDocumentsGrid(this.selectedTab?.link);
  }

  handleOnClear() {
    this.searchText = '';
    this.oldQueryText = '';
    if (!this.filterParams) {
      this.filterParams = {
        global_operator: this.globalTernaryOperator,
      };
    }
    this.filterParams.q = null;
    this.filterData = {
      ...this.filterData,
      filterParams: this.filterParams,
    };
    this.reinitializeDocumentsGrid(this.selectedTab?.link);
  }

  resetFiltersData() {
    this.oldQueryText = '';
    this.oldGlobalOperator = 'and';
    this.globalTernaryOperator = 'and';
    this.filterParams = {};
    this.documentsService.resetToOriginalDocuments();
    this.performFilteringAndUpdateGrid();
    this.searchCriteria = [
      {
        criteriaObj: { items: [{ id: 'equals', name: 'Equals' }] },
        value: null,
        condition: null,
      },
    ];
    this.globalGridFilterComponent?.resetFiltersData();
    this.isFilterApplied = false;
    this.filterData = {
      ...this.filterData,
      filterParams: this.filterParams,
      searchCriteria: this.searchCriteria,
      globalTernaryOperator: this.globalTernaryOperator,
    };
  }

  refreshGrid() {
    this.closeQuickActions();
    let filterParams;
    let queryParams: any = {};
    if (this.gridType === 'content') {
      filterParams = this.getSearchQuery();
      queryParams = {
        q: filterParams.q,
        global_operator: this.globalTernaryOperator,
      };
      let end_date: any, start_date: any;
      this.initializeSearchDetails = true;
      this.initGridSection = false;
      this.documents = [];
      if (
        this.customDateFilter &&
        this.customDateFilter.selectedRange !== 'No Filter' &&
        this.customDateFilter.range !== 'null'
      ) {
        start_date = this.Utils.formatDatetime(this.customDateFilter.startDate);
        end_date = this.Utils.formatDatetime(this.customDateFilter.endDate);
        queryParams = {
          ...queryParams,
          start_date,
          end_date,
        };
      }
    } else {
      filterParams = queryParams = {
        entity_id: this.entity_id,
        entity_type: this.entity_type,
        q: this.searchText,
      };
    }
    queryParams.type = this.selectedTab.link;

    this.documentsService
      .getDocumentsRowData(
        queryParams,
        this.selectedTab?.link,
        this.currentUser?.firmInfo.id,
        this.selectedViewType,
        this.gridType,
        this.entity_id,
        this.entity_type
      )
      .pipe(finalize(() => (this.initGridSection = true)))
      .subscribe((response: any) => {
        this.documents = response.attachments || [];
        this.documentsService.setDocuments(response.attachments);
        this.documentsService.setOriginalDocuments(response.attachments);
        this.filterParams = { ...filterParams };
        this.performFilteringAndUpdateGrid();
        this.initGridSection = true;
        this.gridReloaded.emit();
      });
  }

  getSearchQuery() {
    let searchQuery = this.globalGridFilterComponent?.createSearchQuery() ?? {};
    if (this.searchText) {
      searchQuery.q = this.searchText;
    }
    return searchQuery;
  }

  showFilters() {
    const showFilters =
      this.searchCriteria?.length &&
      this.searchCriteria[0]?.value &&
      this.isSearchPanelCollapsed;
    return showFilters;
  }

  displayFilter(criterion) {
    let displayedFilter = '';
    switch (criterion.criteriaObj.text) {
      case 'Keyword':
        displayedFilter = 'Keyword: ' + criterion.value;
        break;
      case 'As of Date':
        if (criterion.condition === 'equals') {
          displayedFilter =
            'As of Date = ' +
            moment(criterion.value).format(this.dateDisplayFormat);
        } else if (criterion.condition === 'greater_than') {
          displayedFilter =
            'As of Date > ' +
            moment(criterion.value).format(this.dateDisplayFormat);
        } else if (criterion.condition === 'lesser_than') {
          displayedFilter =
            'As of Date < ' +
            moment(criterion.value).format(this.dateDisplayFormat);
        }
        break;
      case 'Document Type':
        displayedFilter =
          'Type: ' +
          criterion.value.map((type: { name: any }) => type.name).join(', ');
        break;
      case 'Document Group':
        displayedFilter =
          'Group: ' +
          criterion.value.map((group: { name: any }) => group.name).join(', ');
        break;
      case 'Associated Firm':
        displayedFilter =
          'Firm: ' +
          criterion.value.map((firm: { name: any }) => firm.name).join(', ');
        break;
      case 'Associated Strategy':
        displayedFilter =
          'Strategy: ' +
          criterion.value.map((firm: { name: any }) => firm.name).join(', ');
        break;
      case 'Associated Product':
        displayedFilter =
          'Product: ' +
          criterion.value.map((fund: { name: any }) => fund.name).join(', ');
        break;
      case 'Associated Vehicle':
        displayedFilter =
          'Vehicle: ' +
          criterion.value
            .map((vehicle: { name: any }) => vehicle.name)
            .join(', ');
        break;
      case 'Project Name':
        displayedFilter =
          'Project Name: ' +
          criterion.value
            .map((project: { name: any }) => project.name)
            .join(', ');
        break;
      case 'Client Name':
        displayedFilter =
          'Client Name: ' +
          criterion.value
            .map((project: { display_name: any }) => project.display_name)
            .join(', ');
        break;
      case 'Uploaded By':
        displayedFilter =
          'Uploaded By: ' +
          criterion.value.map((user: { name: any }) => user.name).join(', ');
        break;
      case 'Uploaded On':
        if (criterion.condition === 'equals') {
          displayedFilter =
            'Uploaded On = ' +
            moment(criterion.value).format(this.dateDisplayFormat);
        } else if (criterion.condition === 'greater_than') {
          displayedFilter =
            'Uploaded On > ' +
            moment(criterion.value).format(this.dateDisplayFormat);
        } else if (criterion.condition === 'lesser_than') {
          displayedFilter =
            'Uploaded On < ' +
            moment(criterion.value).format(this.dateDisplayFormat);
        }
        break;
      case 'Received On':
        if (criterion.condition === 'equals') {
          displayedFilter =
            'Received On = ' +
            moment(criterion.value).format(this.dateDisplayFormat);
        } else if (criterion.condition === 'greater_than') {
          displayedFilter =
            'Received On > ' +
            moment(criterion.value).format(this.dateDisplayFormat);
        } else if (criterion.condition === 'lesser_than') {
          displayedFilter =
            'Received On < ' +
            moment(criterion.value).format(this.dateDisplayFormat);
        }
        break;
      case 'Shared By':
        displayedFilter =
          'Shared By: ' +
          criterion.value.map((user: { name: any }) => user.name).join(', ');
        break;
      case 'Shared With':
        displayedFilter =
          'Shared With: ' +
          criterion.value.map((firm: { name: any }) => firm.name).join(', ');
        break;
    }
    return displayedFilter;
  }

  removeFilterCriterion(criterion, index) {
    this.globalGridFilterComponent?.removeCriteriaById(criterion?.id);
    this.globalGridFilterComponent?.updatePreviousCriteria();
    this.searchCriteria.splice(index, 1);

    if (!this.searchCriteria?.length) {
      this.isFilterApplied = false;
      this.refreshGrid();
      // empty state when there are no criteria for filters
      this.oldQueryText = '';
    } else if (criterion.criteriaText?.toLowerCase() == 'q') {
      this.refreshGrid();
    } else {
      this.initializeFiltering();
    }
    this.filterData = {
      ...this.filterData,
      searchCriteria: this.searchCriteria,
    };
  }

  showDocumentAction(document: { owner_firm_id: any }) {
    if (!this.currentUser) return;
    return this.Utils.isDocumentUploadByCurrentFirm(
      this.currentUser,
      document.owner_firm_id
    );
  }

  bulkDeleteFoldersAndAttachments() {
    this.SweetAlert.confirm({
      title: 'Are you sure?',
      text:
        this.gridType == 'content'
          ? `All the selected ${
              this.selectedViewType == 2 ? 'folders and documents' : 'documents'
            } will be deleted`
          : this.selectedViewType == 2
          ? 'Entity association will be removed for all the selected folders and documents'
          : 'Entity association will be removed for all the selected documents',
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          let attachmentIds = this.gridSelectedData
            .filter((item) => item.type === 1)
            .map((item) => item.attachment_id || item.id);
          this.http
            .post('document_folders/delete_multiple', {
              Root_attachment_hierarchy_ids:
                this.selectedViewType === 2
                  ? this.gridSelectedData
                      .filter(
                        (item) =>
                          !this.gridSelectedData.some(
                            (item2) =>
                              item2.attachmentHierarchyId ==
                              item.parentAttachmentHierarchyId
                          )
                      )
                      .map((data) => data.attachmentHierarchyId)
                  : this.gridSelectedData
                      .map((d) => d.attachmentHierarchyId)
                      .filter((d) => d), // remove null or undefined values
              Attachment_ids: attachmentIds,
              Remove_association_only: this.gridType == 'entity',
              Entity_type: this.gridType == 'entity' ? this.entity_type : null,
              Entity_id: this.gridType == 'entity' ? this.entity_id : null,
            })
            .pipe(finalize(() => resolve()))
            .subscribe(() => {
              this.refreshGrid();
              this.toaster.success(
                this.gridType == 'content'
                  ? `Selected ${
                      this.selectedViewType == 2
                        ? 'folders and documents'
                        : 'documents'
                    } deleted successfully`
                  : 'Selected documents successfully unassigned'
              );
            });
        });
      },
    }).then(() => {});
  }

  addDocument(
    isFile,
    parentAttachmentHierarchyId = this.baseAttachmentHierarchyId,
    showUploadTypeToggler = false
  ) {
    this.customModalFactory.invoke('upload-document-folder', {
      initialState: {
        uploadType: isFile ? 'file' : 'folder',
        flow: 'add',
        showUploadTypeToggler: showUploadTypeToggler,
        parentAttachmentHierarchyId:
          parentAttachmentHierarchyId?.length &&
          parentAttachmentHierarchyId[parentAttachmentHierarchyId.length - 1],
        defaultSelectionPath:
          parentAttachmentHierarchyId?.length &&
          this.gridFolderService.getCurrentFolderPath(
            this.documents,
            parentAttachmentHierarchyId
          ),
        entity_id: this.entity_id ?? null,
        entity_type: this.entity_type ?? null,
        documents: [...this.documents],
        success: (action) => {
          if (action === 'refresh') {
            if (!isFile && this.selectedViewType == 1) {
              this.viewToggler.handleButtonClick('folder');
            } else {
              this.refreshGrid();
            }
          }
        },
      },
      class: 'modal-lg',
    });
  }

  useExistingDocument() {
    this.customModalFactory.invoke('use-existing-document', {
      initialState: {
        entityId: this.entity_id,
        entityType: this.entity_type,
        success: (action) => {
          this.refreshGrid();
          this.toaster.success('Selected documents were added successfully');
        },
      },
    });
  }

  openDocumentUpdateDialog(document) {
    const defaultSelectionPath = this.getDefaultSelectionPath();
    const selectionPath =
      this.selectedViewType == 2
        ? this.gridFolderService.getCurrentFolderPath(
            this.documents,
            document.path,
            defaultSelectionPath
          )
        : [...defaultSelectionPath, ...document.folderPath.split(' > ')].filter(
            (path) => !!path
          ); // filter empty path (i.e., '')
    this.customModalFactory.invoke('manage-document', {
      initialState: {
        documentOptions: {
          editAccessGranted: this.showDocumentAction(document),
          mode: 'update',
          source: 'documentsEditClick',
          document,
        },
        isEntityIdRequired: false,
        selectionPath: selectionPath,
        success: (file) => {
          this.refreshGrid();
        },
      },
    });
  }

  openDocumentShareDialog(attachment) {
    let document = {
      ...attachment,
      attachment_id: attachment?.attachment_id ?? attachment?.id,
    };
    const currentFirmId = this.currentUser.firmInfo.id;
    this.customModalFactory.invoke('share-document', {
      initialState: {
        attachment_id: attachment.id,
        document,
        entityType: this.gridType == 'content' ? 'Firm' : this.entity_type,
        entityId: this.gridType == 'content' ? currentFirmId : this.entity_id,
        success: (file) => {
          this.refreshGrid();
        },
      },
    });
  }

  confirmDocumentDeletion(document) {
    const title =
      this.gridType == 'content'
        ? 'Are you sure?'
        : document.type === 1
        ? 'Are you sure you want to remove entity association for this document?'
        : 'Are you sure you want to remove entity association for this folder and its contents?';
    let text = '';
    if (this.gridType == 'content' && document.type === 1) {
      text =
        'If you have shared this document with other firms, they will still be able to see it. Please use edit to add new versions.';
    } else if (this.gridType == 'content' && document.type === 0) {
      text =
        'This will delete this folder and its contents. If you have shared any document in this folder with other firms, they will still be able to see it. Please use edit to add new versions.';
    } else if (this.gridType == 'entity') {
      text = '';
    }
    this.SweetAlert.confirm({
      title,
      text,
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          let attachmentIds =
            document.type == 1
              ? [document.attachment_id || document.id]
              : this.documents
                  .filter(
                    (item) =>
                      item.type === 1 &&
                      item.path?.includes(document.attachmentHierarchyId)
                  )
                  .map((item) => item.attachment_id || item.id);
          this.http
            .post('document_folders/delete_multiple', {
              Root_attachment_hierarchy_ids: [document.attachmentHierarchyId],
              Attachment_ids: attachmentIds,
              Remove_association_only: this.gridType == 'entity',
              Entity_type: this.gridType == 'entity' ? this.entity_type : null,
              Entity_id: this.gridType == 'entity' ? this.entity_id : null,
            })
            .pipe(finalize(() => resolve()))
            .subscribe(() => {
              this.refreshGrid();
              this.toaster.success(
                this.gridType == 'content'
                  ? 'Selected items were deleted successfully'
                  : 'Selected items were successfully unassigned'
              );
            });
        });
      },
    }).then(() => {});
  }

  downloadURI(uri) {
    const link = document.createElement('a');
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  downloadDocuments(selectedData) {
    let bulkDownloadArr: any = {
      user_id: this.currentUser.id,
      files: [],
      container_name: `firm${this.currentUser.firmInfo.id}`,
    };
    if (this.gridApi?.getRowGroupColumns()?.length) {
      bulkDownloadArr.selected_group_name = this.gridApi
        .getRowGroupColumns()[0]
        .getColDef().field;
    }
    const toasterInstance = this.toaster.info(
      'Please wait while the zip file is being generated.',
      'Processing Your Files For Download...',
      { timeOut: 0 }
    );

    let parentIdToNodeMapping = {};

    selectedData =
      selectedData == null ? [...this.gridSelectedData] : selectedData;

    if (this.selectedViewType == 2) {
      selectedData
        .filter((item) => item.type === 0)
        .forEach((item) => {
          parentIdToNodeMapping[item.id] = [];
        });
    }

    selectedData.forEach((item) => {
      if (this.selectedViewType == 1 || item.type === 1) {
        // in entity documents grid, attachment id is present as attachment_id. id contains assignment id. in the request object, we need to pass attachment id
        const itemsObj: any = { ...item, id: item.attachment_id || item.id };

        if (this.selectedViewType == 1) {
          bulkDownloadArr.files.push(itemsObj);
        } else {
          let parentId =
            item.path?.length > 1 ? item.path[item.path.length - 2] : null;
          if (!(parentId in parentIdToNodeMapping)) {
            parentId = null;
          }

          itemsObj.parentId = parentId;
          itemsObj.type = item.type;

          if (parentId == null && !(parentId in parentIdToNodeMapping)) {
            parentIdToNodeMapping[parentId] = [];
          }

          parentIdToNodeMapping[parentId].push(itemsObj);
        }
      } else {
        let parentId =
          item.path?.length > 1 ? item.path[item.path.length - 2] : null;
        if (!(parentId in parentIdToNodeMapping)) {
          parentId = null;
        }

        if (parentId == null && !(parentId in parentIdToNodeMapping)) {
          parentIdToNodeMapping[parentId] = [];
        }

        parentIdToNodeMapping[parentId].push({
          attachmentHierarchyId: item.attachmentHierarchyId,
          name: item.name,
          type: item.type,
          parentId,
        });
      }
    });

    if (this.selectedViewType == 2) {
      let traversalNodes = parentIdToNodeMapping['null'];
      let payload = {
        folders: [],
        files: [],
      };
      let parentIdToPayloadReference = {};
      parentIdToPayloadReference['null'] = payload;
      while (traversalNodes?.length) {
        let childNodes = [];
        traversalNodes.forEach((item) => {
          if (item.type == 1) {
            parentIdToPayloadReference[item.parentId].files.push({
              ...item,
              id: item.attachment_id || item.id, // in entity documents grid, attachment id is present as attachment_id. id contains assignment id. in the request object, we need to pass attachment id
            });
          } else {
            let folder = {
              name: item.name,
              folders: [],
              files: [],
            };
            parentIdToPayloadReference[item.parentId].folders.push(folder);
            parentIdToPayloadReference[item.attachmentHierarchyId] = folder;

            if (parentIdToNodeMapping[item.attachmentHierarchyId]?.length) {
              childNodes.push(
                ...parentIdToNodeMapping[item.attachmentHierarchyId]
              );
            }
          }
        });

        traversalNodes = childNodes;
      }

      bulkDownloadArr = { ...bulkDownloadArr, ...payload };
    }

    this.http
      .post('/service/dv_scheduler_service/download_dir_blob', bulkDownloadArr)
      .pipe(finalize(() => this.toaster.clear(toasterInstance.toastId)))
      .subscribe((response: any) => this.downloadURI(response.url));
  }

  downloadSingleFolder(folder) {
    let selectedData = this.documents.filter((document) =>
      document.path.includes(folder.attachmentHierarchyId)
    );
    this.downloadDocuments(selectedData);
  }

  closeQuickActions() {
    this.show_bulk_actions = false;
    this.isFolderSelected = false;
    this.deSelectAllRows();
  }

  deSelectAllRows() {
    this.gridSelectedData = new Array<any>();
    this.totalSelectedRecords = 0;
    this.documentsGrid?.deSelectAllRows();
    this.treeGrid?.deSelectAllRows();
  }

  onSelectionChanged = (event) => {
    this.show_bulk_actions = this.gridSelectedData.length > 0;
    this.isFolderSelected =
      this.selectedViewType == 2 &&
      this.gridSelectedData.some((item) => item.type === 0);
    this.totalSelectedRecords = this.gridSelectedData.length;
  };

  onRowSelected = (row) => {
    if (!row.data) return;
    if (
      !row.node?.parent?.groupData ||
      !this.groupHelpers
        .map((col) => col.unGroupedColumn)
        .includes(row.node?.parent?.field)
    ) {
      if (row.node.selected) {
        this.gridSelectedData.push(row.data);
      } else {
        const index = this.gridSelectedData.findIndex(
          (x) => x.id === row.data.document.id
        );
        if (index !== -1) {
          this.gridSelectedData.splice(index, 1);
        }
      }
    } else {
      const column = this.groupHelpers.find(
        (x) => x.unGroupedColumn === row.node?.parent?.field
      );
      if (row.node.selected) {
        let selectedNode = JSON.parse(JSON.stringify(row.data));
        selectedNode[column.unGroupedColumn] = [row.node.parent.key];
        this.gridSelectedData.push(selectedNode);
      } else {
        const index = this.gridSelectedData.findIndex(
          (x) =>
            x.id === row.data.document.id &&
            x[column.unGroupedColumn]?.includes(row.node.parent.key)
        );
        if (index !== -1) {
          this.gridSelectedData.splice(index, 1);
        }
      }
    }
    this.emptyFolderSelected = true;
    this.gridSelectedData.forEach((data) => {
      this.emptyFolderSelected &&= !data.type;
    });
  };

  handleOnTreeGridReady(dvGridEvent) {
    this.treeGridApi = dvGridEvent.api as GridApi;
    this.treegridColumnApi = dvGridEvent.columnApi;
    if (this.selectedViewType == 2) {
      this.columnApi = this.treegridColumnApi;
    }
  }

  handleOnGridReady(dvGridEvent) {
    this.gridApi = dvGridEvent.api as GridApi;
    this.gridColumnApi = dvGridEvent.columnApi;
    if (this.selectedViewType == 1) {
      this.columnApi = this.gridColumnApi;
    }
    const self = this;
    // updating grid colDef state whenever user add or edit the column from the sidebar
    this.gridApi.addEventListener('columnVisible', (event) => {
      if (event) {
        const column = event.columns[0];
        self.columnDefsCopy.find((x) => x.colId === column.colId).hide =
          !event.visible;
      }
    });

    this.columnRowGroupChangedListener = this.getColumnRowGroupChangedListener(
      this.gridApi
    );
    this.gridApi.addEventListener(
      'columnRowGroupChanged',
      this.columnRowGroupChangedListener
    );
  }

  getColumnRowGroupChangedListener(gridApi) {
    const self = this;

    let getListener = (event) => {
      self.closeQuickActions();
      const columnDefs: any = gridApi.getColumnDefs();
      if (!event.columns.length) {
        // getting new column set
        let lastGroupedColumn = columnDefs.find(
          (x) => x.colId === self.lastGroupedCol
        );
        if (lastGroupedColumn) {
          lastGroupedColumn.hide = false;
        }
        self.lastGroupedCol = '';
        self.isMultivaluedColumnGrouping = false;
        self.groupedDocuments = [];
        gridApi.setGridOption('columnDefs', columnDefs);
        gridApi.setGridOption('rowData', self.documents);
        return;
      }

      let groupedColumn = event.columns?.find(
        (column) => column.rowGroupActive
      );

      self.lastGroupedCol = groupedColumn?.colId;

      if (
        self.groupHelpers
          .map((col) => col.unGroupedColumn)
          .includes(self.lastGroupedCol)
      ) {
        self.isMultivaluedColumnGrouping = true;
        try {
          self.setGroupedDocuments();
          gridApi.setGridOption('columnDefs', columnDefs);
          gridApi.setGridOption('rowData', []);
          gridApi.setGridOption('rowData', self.groupedDocuments);
        } catch (e) {
          console.log(e);
        }
      } else if (!groupedColumn) {
        let ungroupedColumn = event.columns?.find(
          (column) => !column.rowGroupActive
        );

        self.isMultivaluedColumnGrouping = false;
        self.groupedDocuments = [];

        columnDefs.map((x) => {
          x.rowGroup = false;
          x.hide = x.colId == ungroupedColumn?.colId ? false : x.hide;
        });
        self.lastGroupedCol = '';
        gridApi.setGridOption('columnDefs', columnDefs);
        gridApi.setGridOption('rowData', []);
        gridApi.setGridOption('rowData', self.documents);
      } else {
        self.isMultivaluedColumnGrouping = false;
        self.groupedDocuments = [];
      }
    };

    return getListener;
  }

  setGroupedDocuments() {
    if (this.lastGroupedCol && this.isMultivaluedColumnGrouping) {
      let newCollection = [],
        noGroupsDocuments = [];
      const column = this.groupHelpers.find(
        (x) => x.unGroupedColumn === this.lastGroupedCol
      );
      const individualGroupColumn = column?.groupedName ?? this.lastGroupedCol;
      const groupColumn = column?.unGroupedColumn ?? this.lastGroupedCol;
      this.documents.forEach((document) => {
        if (document[groupColumn] && document[groupColumn]?.length) {
          document[groupColumn].forEach((groupName) => {
            let documentCopy = { ...document };
            documentCopy[individualGroupColumn] = [groupName];
            newCollection.push(documentCopy);
          });
        } else {
          let documentCopy = JSON.parse(JSON.stringify(document));
          documentCopy[individualGroupColumn] = ['Ungrouped'];
          noGroupsDocuments.push(documentCopy);
        }
      });
      this.groupedDocuments = noGroupsDocuments.concat(newCollection);
    }
  }

  handleNewDropdownClick(item) {
    if (this.freeSubscription) {
      if (this.freeManager) this.SweetAlert.premiumAlert();
      return;
    }

    switch (item.key) {
      case 1:
        this.createNewFolder(this.baseAttachmentHierarchyId);
        break;
      case 2:
        this.addDocument(true);
        break;
      case 3:
        this.addDocument(false);
        break;
      case 4:
        this.useExistingDocument();
    }
  }

  handleViewChange(id) {
    if (id === 'folder') this.selectedViewType = 2;
    else this.selectedViewType = 1;
    const params = this.stateParams.queryParams;
    params.tab = this.getTabName().toLowerCase();
    params.view = this.selectedViewType == 1 ? 'file' : 'folder';
    params.receivedDocumentsNewCount = this.receivedDocumentsNewCount;
    this.routerService.navigateWithParams(
      this.gridType == 'content'
        ? 'app.content.documents'
        : this.getEntityRouterStateUrl(),
      this.stateParams,
      {
        reload: true,
      }
    );
    this.initGridSection = false;
  }

  setGridName() {
    if (
      this.selectedViewType == 1 &&
      this.selectedTab?.link?.toLowerCase() == 'all'
    ) {
      // set existing document grid name for all tab in both content and entity document grids
      this.gridName =
        this.gridType == 'content'
          ? 'documents'
          : `${this.entity_type.toLowerCase()}-document-list`;
      return;
    }

    if (this.gridType === 'entity') {
      this.gridName = `${this.entity_type.toLowerCase()}_`;
    } else {
      // initializing to empty string
      this.gridName = '';
    }

    if (this.selectedViewType == 1) {
      this.gridName +=
        this.fileviewGridName + '_' + this.selectedTab?.link?.toLowerCase();
    } else {
      this.gridName +=
        this.folderviewGridName + '_' + this.selectedTab?.link?.toLowerCase();
    }
  }

  canShowEmptyGridOpenUploadModal(): boolean {
    return (
      !this.freeSubscription &&
      this.selectedTab?.link === 'MyAttachments' &&
      (this.gridType !== 'content' || !this.customDateFilter) &&
      !this.searchText &&
      !this.isFilterApplied && // Check if no filters are applied, like: date, text and advance filter;
      this.documents.length === 0 // Also check, no documents are available
    );
  }

  private getDateRangeFromParam(params: any): any {
    const dateRange = JSON.parse(params.date_range);
    dateRange.startDate = this.Utils.formatDatetime(dateRange.startDate);
    dateRange.endDate = this.Utils.formatDatetime(dateRange.endDate);
    return dateRange;
  }

  private updateRouteParams(name: string, value: string | number): void {
    const params = {};
    const stateParams = this.stateParams.queryParams;
    stateParams[name] = value;
    params[name] = value;
    this.routerService.navigateWithParams('.', params);
  }

  private getTabName(): string {
    if (
      (this.selectedTab.name.toLowerCase() as string).startsWith('received')
    ) {
      return 'received';
    }

    return this.selectedTab.name;
  }

  private getDefaultSelectionPath(): Array<string> {
    return ['Documents'];
  }

  //#region Move, Copy and edit

  moveOrCopySelectedDocuments(
    operationType: 'move' | 'copy',
    documents: Array<any> = null
  ): void {
    this.customModalFactory.invoke('dv-document-operation-modal', {
      initialState: {
        rowData: this.documents,
        operationType: operationType,
        documentFolderType: this.selectedTab?.link === 'MyAttachments' ? 1 : 2,
        selectedDocuments:
          documents !== null ? [...documents] : [...this.gridSelectedData],
        defaultSelectionPath: this.getDefaultSelectionPath(),
        entityId: this.gridType == 'entity' ? this.entity_id : null,
        entityType: this.gridType == 'entity' ? this.entity_type : null,
        callback: () => {
          this.refreshGrid();
        },
      },
    });
  }

  bulkEditDocuments(): void {
    this.customModalFactory.invoke('bulk-edit-documents-modal', {
      initialState: {
        selectedViewType: this.selectedViewType === 2 ? 'folder' : 'file',
        selectedDocuments: [...this.gridSelectedData],
        selectedRowNodes:
          this.selectedViewType === 2
            ? this.treeGridApi.getSelectedNodes()
            : [],
        selectionPath: this.getDefaultSelectionPath(),
        allowBulkAddAssociatedEntity: this.selectedTab?.link == 'MyAttachments',
        callback: () => {
          this.refreshGrid();
        },
      },
    });
  }

  editFolder(folderDetails: any, documents: Array<any>): void {
    const selectionPath = this.gridFolderService.getCurrentFolderPath(
      this.documents,
      folderDetails.path,
      this.getDefaultSelectionPath()
    );
    this.customModalFactory.invoke('bulk-edit-documents-modal', {
      initialState: {
        folderDetails: folderDetails,
        operationMode: 'single',
        selectedDocuments: [...documents],
        selectionPath: selectionPath,
        allowBulkAddAssociatedEntity: this.selectedTab?.link == 'MyAttachments',
        callback: () => {
          this.refreshGrid();
        },
      },
    });
  }

  //#endregion

  handleBulkOrganize() {
    this.customModalFactory.invoke('bulk-organize-attachments', {
      initialState: {
        callback: () => {
          this.refreshGrid();
        },
        selectedTab: this.selectedTab?.link,
      },
    });
  }

  flattenAttachments(deleteAll = false) {
    let text = '';
    if (deleteAll && this.gridType == 'content') {
      text =
        'All the folders will be deleted and the documents will be moved to the root directory';
    } else if (!deleteAll && this.gridType == 'content') {
      text = `All the selected folders will be deleted and the documents inside the folders will be moved to the root directory`;
    } else if (deleteAll && this.gridType == 'entity') {
      text =
        'Entity association will be removed for all the folders and the documents inside the folders will be moved to the root directory';
    } else if (!deleteAll && this.gridType == 'entity') {
      text =
        'Entity association will be removed for all the selected folders and the documents inside the folders will be moved to the root directory';
    }
    this.SweetAlert.confirm({
      title: 'Are you sure?',
      text,
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          let folderAttachmentHierarchyIds = this.gridSelectedData
            .filter((item) => item.type === 0)
            .map((item) => item.id);
          let payload: any = {
            Delete_all_folders: deleteAll,
            Attachment_hierarchy_ids: deleteAll
              ? null
              : folderAttachmentHierarchyIds,
            Type: this.selectedTab?.link == 'MyAttachments' ? 1 : 2,
          };
          if (this.gridType == 'entity') {
            payload = {
              ...payload,
              entity_type: this.entity_type,
              entity_id: this.entity_id,
            };
          }
          this.http
            .post('document_folders/bulk_remove_folders', payload)
            .pipe(finalize(() => resolve()))
            .subscribe(() => {
              this.refreshGrid();
              this.toaster.success(
                deleteAll
                  ? 'All the folders were deleted successfully and the documents were moved to the root directory'
                  : 'Selected folders were deleted successfully and the documents were moved to the root directory'
              );
            });
        });
      },
    }).then(() => {});
  }

  handleDisabledClick(disabled) {
    if (this.freeManager) this.SweetAlert.premiumAlert();
  }
}
