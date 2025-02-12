import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { DocumentDataService } from 'src/app2/services/document-data.service';
import { DocumentsFactoryService } from 'src/app2/services/documents-factory.service';
import { EntityDocumentsService } from 'src/app2/services/entity-documents.service';
import { FirmDataService } from 'src/app2/services/firm-data.service';
import { FundDataService } from 'src/app2/services/fund-data.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { ProjectSummaryService } from 'src/app2/services/project-summary.service';
import { RouterService } from 'src/app2/services/router.service';
import { StrategyDataService } from 'src/app2/services/strategy-data.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { VehicleDataService } from 'src/app2/services/vehicle-data.service';
import {
  defaultColumn,
  diligenceStatusConstant,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import swal from 'sweetalert2/dist/sweetalert2.js';
import { DvGridComponent } from '../dv-grid/dv-grid.component';
import { Select, Store } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take } from 'rxjs/operators';
import { ColumnApi, GridApi } from 'ag-grid-community';
@Component({
  selector: 'entity-documents',
  templateUrl: './entity-documents.component.html',
  styleUrls: ['./entity-documents.component.css'],
})
export class EntityDocumentsComponent implements OnInit, OnDestroy {
  show_bulk_actions: boolean;
  totalSelectedRecords: number;
  freeSubscription: boolean;
  downloadingDocuments: boolean;
  is_investor: boolean;
  is_manager: boolean;
  stateParams: any;
  entity_id: number;
  searchText: any;
  isSearchResults: boolean;
  searchResultTemplateUrl: string;
  previewClicked: boolean;
  columnDefs: any;
  documents: any;
  gridName: string;
  firmId: number;
  entity: any;
  entity_type: string;
  entity_label: string;
  documentCount: number;
  routerStateUrl: string;
  gridSelectedData: any[] = new Array<any>();
  @ViewChild('entityDocumentsGrid') commonGridComponent: DvGridComponent; // ref of common grid component to call the deSelect method
  displaySidebarPanel: boolean;
  sidebarTitle: string;
  clickedDocument: any;
  @Select(UserState.getCurrentUserData) user;
  current_user: any;
  isGridLoaded = false;
  pageurl;
  diligenceStatusConstant = diligenceStatusConstant;
  columnApi: ColumnApi;
  gridApi: GridApi;
  newOptions = [
    { label: 'Add Existing', key: 4 },
    { label: 'Upload Document', key: 2 },
    { label: 'Upload Folder', key: 3, disabled: false, tooltip: '' },
  ];
  loadingDocuments = false;
  constructor(
    private readonly Utils: UtilsService,
    private readonly routerService: RouterService,
    private readonly SweetAlert: SweetAlertService,
    private readonly http: HttpClient,
    private readonly toaster: ToastrService,
    private readonly customModalFactory: CustomModalService,
    private readonly entityDocumentsService: EntityDocumentsService,
    private readonly store: Store,
    private readonly firmDataService: FirmDataService,
    private readonly fundDataservice: FundDataService,
    private readonly vehicleDataService: VehicleDataService,
    private readonly strategyDataservice: StrategyDataService,
    private readonly documentDataservice: DocumentDataService,
    private readonly documentsFactoryService: DocumentsFactoryService,
    private readonly projectSummaryService: ProjectSummaryService
  ) {}

  ngOnInit() {
    this.stateParams = this.routerService.getState().params;
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
    } else {
      this.entity_id = parseInt(this.stateParams.firmId);
      this.entity_type = 'Firm';
    }
    this.entity_label =
      this.entity_type === 'Fund'
        ? 'Product'
        : this.entity_type === 'DueDiligence'
        ? 'Diligence'
        : this.entity_type;
    this.searchText = this.stateParams.q || '';
    this.isSearchResults = this.stateParams.status === 'Search';
    this.previewClicked = false;
    this.gridName = `${this.entity_type.toLowerCase()}-document-list`;
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.current_user = data;
          this.is_investor = data.isInvestor;
          // If entity_id is still empty then its my_firm (so firm id would be current firm id )
          if (!this.entity_id) {
            this.entity_id = data.firmInfo.id;
            this.firmId = data.firmInfo.id;
          }
          this.freeSubscription = data.isFreeSubscription;
          this.newOptions.find((option) => option.key === 3).disabled =
            this.freeSubscription;
          this.newOptions.find((option) => option.key === 3).tooltip = this
            .freeSubscription
            ? 'Available with premium subscription'
            : null;
          this.entityDocumentsService.initializeEntityLoad();
          this.getEntityDetails();
          this.setGridColumnDefs();
          this.getDocumentData();
          this.setSearchRouterState();
        }
      });
  }

  handleNewDropdownClick(item) {
    switch (item.key) {
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

  useExistingDocument() {
    this.customModalFactory.invoke('use-existing-document', {
      initialState: {
        entityId: this.entity_id,
        entityType: this.entity_type,
        success: (action) => {
          this.closeQuickActions();
          this.getDocumentData();
          this.toaster.success('Selected documents were added successfully');
        },
      },
    });
  }

  addDocument(isFile) {
    this.customModalFactory.invoke('upload-document-folder', {
      initialState: {
        uploadType: isFile ? 'file' : 'folder',
        flow: 'add',
        entity_id: this.entity_id,
        entity_type: this.entity_type,
        success: (action) => {
          if (action === 'refresh') {
            this.closeQuickActions();
            this.getDocumentData();
          }
        },
      },
      class: 'modal-lg',
    });
  }

  handleOnGridReady(dvGridEvent) {
    this.gridApi = dvGridEvent.api as GridApi;
    this.columnApi = dvGridEvent.columnApi;
  }

  getDocumentData() {
    this.loadingDocuments = true;
    this.documents = [];
    this.entityDocumentsService
      .getDocumentListRowData(
        {
          entity_id: this.entity_id,
          entity_type: this.entity_type,
          q: this.searchText,
        },
        this.current_user?.firmInfo?.id
      )
      .pipe(
        finalize(() => {
          this.loadingDocuments = false;
        })
      )
      .subscribe(
        (documents) => {
          this.documents = documents;
        },
        (e) => {
          this.documents = [];
        }
      );
    this.getDocumentCounts();
  }

  getDocumentCounts() {
    this.documentDataservice
      .getAttachmentAssignmentCount(this.entity_type, this.entity_id)
      .subscribe(
        (response: any) => {
          this.documentCount = response.count;
        },
        (e) => {
          this.documentCount = 0;
        }
      );
  }

  setGridColumnDefs() {
    this.columnDefs = this.entityDocumentsService.getDocumentListColDef();
    this.columnDefs.unshift({
      ...defaultColumn,
      colId: 'document_name',
      headerName: 'Document Name',
      field: 'document_name',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      suppressFloatingFilterButton: true,
      floatingFilterComponentParams: {
        placeHolder: 'Search by name',
      },
      cellRenderer: 'documentNameCellRendererComponent',
      cellRendererParams: {
        currentUser: this.current_user,
        showShareAction: false,
        gridType: 'entity',
        openDocumentUpdateDialog: (document) => {
          this.openDocumentUpdateDialog(document);
        },
        openDocumentShareDialog: (document) => {
          this.openDocumentShareDialog(document);
        },
        confirmDocumentDeletion: (document) => {
          this.confirmDocumentDeletion(document);
        },
        openNotesSidebar: (document) => {
          this.openNotesSidebar(document);
        },
        clickedPreview: (document) => {
          this.previewClicked = true;
          this.getSignedURL(document);
        },
        handleDownload: (item) => {
          this.toaster.info('Downloading the requested document.');
          this.documentsFactoryService
            .downloadDocument(item)
            .subscribe((response: any) => {
              this.documentDataservice.downloadFile(
                response.body,
                item?.name || item?.file_name || 'download',
                item?.file_name
              );
            });
        },
      },
      minWidth: grid_widths_map['sm_column_xl'],
      suppressColumnsToolPanel: true,
    });
    this.columnDefs.unshift({
      colId: 'selectAll',
      field: 'selectAll',
      checkboxSelection: true,
      headerCheckboxSelection: true,
      headerCheckboxSelectionFilteredOnly: true,
      lockPosition: true,
      suppressHeaderMenuButton: true,
      suppressAutoSize: true,
      width: 50,
      headerClass: 'my-permission-checkbox',
      cellClass: 'my-permission-checkbox',
      suppressColumnsToolPanel: true,
      resizable: false,
    });
    this.columnDefs.map(
      (x) =>
        (x.cellClass =
          x.colId !== 'action' ? 'my-permission-cursor-pointer' : '')
    );
    this.store.dispatch(
      new SetDefaultColumnDef({ [this.gridName]: this.columnDefs })
    );
    this.isGridLoaded = true;
  }

  getEntityDetails() {
    if (this.entity_type === 'Firm') {
      this.firmDataService.getFirm(this.entity_id).subscribe(
        (firm) => {
          this.entity = firm;
        },
        (e) => {}
      );
    } else if (this.entity_type === 'Fund') {
      this.fundDataservice.getFund(this.entity_id).subscribe(
        (fund: any) => {
          this.entity = fund;
        },
        (e) => {}
      );
    } else if (this.entity_type === 'Strategy') {
      this.strategyDataservice.getStrategy(this.entity_id).subscribe(
        (strategy) => {
          this.entity = strategy;
        },
        (e) => {}
      );
    } else if (this.entity_type === 'Vehicle') {
      this.vehicleDataService
        .getVehicle(this.firmId, this.stateParams.fundId, this.entity_id)
        .subscribe(
          (vehicle: any) => {
            this.entity = vehicle;
          },
          (e) => {
            this.entity = [];
          }
        );
    } else if (this.entity_type === 'DueDiligence') {
      this.projectSummaryService
        .getCurrentDiligence(this.entity_id, this.current_user)
        .subscribe((diligence: any) => {
          this.entity = diligence;
          this.entityDocumentsService.entityLoadedTrigger({
            entity: this.entity,
            entity_type: this.entity_type,
          });
        });
    }
  }

  setSearchRouterState() {
    this.routerStateUrl = this.pageurl;
  }

  handleOnSearch($event: string) {
    this.searchText = $event;
    this.getDocumentData();
  }

  handleOnClear() {
    this.searchText = '';
    this.getDocumentData();
  }

  getSignedURL(entity, openDocument = true) {
    return this.documentsFactoryService.getSignedURL(entity, openDocument);
  }

  openUploadDocumentModal() {
    this.customModalFactory.invoke('manage-documents', {
      initialState: {
        entityId: +this.entity_id,
        entityType: this.entity_type,
      },
      closeInterceptor: () => {
        return new Promise<void>((resolve) => {
          resolve();
          this.closeQuickActions();
          this.getDocumentData();
        });
      },
    });
  }

  bulkEditDocuments(): void {
    this.customModalFactory.invoke('bulk-edit-documents-modal', {
      initialState: {
        documentType: 'file',
        selectedRowNodes: this.gridApi.getSelectedNodes(),
        selectedDocuments: [...this.gridSelectedData],
        allowBulkAddAssociatedEntity: !this.gridSelectedData.some(
          (document) =>
            !this.Utils.isDocumentUploadByCurrentFirm(
              this.current_user,
              document.owner_firm_id
            )
        ),
        isProjectGrid: true,
        callback: () => {
          this.closeQuickActions();
          this.getDocumentData();
        },
      },
    });
  }

  confirmDocumentDeletion(attachment) {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to remove this attachment?',
      showLoaderOnConfirm: true,
      focusCancel: false,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.removeAttachment(attachment, resolve);
        });
      },
    }).then(() => {
      swal.close();
    });
  }

  removeAttachment(attachment, resolve) {
    this.http
      .delete('attachmentassignments/' + attachment.id)
      .pipe(finalize(() => resolve()))
      .subscribe(() => {
        this.toaster.success('Attachment successfully unassigned');
        this.deSelectAllRows();
        this.getDocumentData();
      });
  }

  openDocumentUpdateDialog(attachment) {
    this.customModalFactory.invoke('manage-document', {
      initialState: {
        documentOptions: {
          editAccessGranted: false,
          mode: 'update',
          source: 'documentsEditClick',
          document: attachment,
        },
        isEntityIdRequired: false,
        showSelectionPath: false,
        success: (file) => {
          this.closeQuickActions();
          this.getDocumentData();
        },
      },
    });
  }

  openDocumentShareDialog(attachment) {
    this.customModalFactory.invoke('share-document', {
      initialState: {
        document: attachment,
        entityType: this.entity_type,
        entityId: this.entity_id,
      },
    });
  }

  openNotesSidebar(document) {
    this.clickedDocument = document;
    this.sidebarTitle = `Add Notes under ${document.name}`;
    this.displaySidebarPanel = true;
  }

  closeQuickActions() {
    this.show_bulk_actions = false;
    this.deSelectAllRows();
  }

  deSelectAllRows() {
    this.gridSelectedData = new Array<any>();
    this.totalSelectedRecords = 0;
    this.commonGridComponent.deSelectAllRows();
  }

  onRowSelected = (row) => {
    if (!row.data) return;
    if (row.node.selected) {
      this.gridSelectedData.push(row.data.document);
    } else {
      const index = this.gridSelectedData.findIndex(
        (x) => x.id === row.data.document.id
      );
      if (index !== -1) {
        this.gridSelectedData.splice(index, 1);
      }
    }
  };

  onSelectionChanged = (event) => {
    this.show_bulk_actions = this.gridSelectedData.length ? true : false;
    this.totalSelectedRecords = this.gridSelectedData.length;
  };

  onRowClicked = (event) => {
    if (event?.data) {
      const documentId = event.data.document.attachment_id
        ? event.data.document.attachment_id
        : event.data.document.id;
      this.documentDataservice.setDocumentPageUrl(this.pageurl);
      this.routerService.navigateWithParams('app.content.document.detail', {
        documentId: documentId,
      });
    }
  };

  downloadURI(uri) {
    const link = document.createElement('a');
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  downloadAllDocuments() {
    this.downloadingDocuments = true;
    this.toaster.info(
      'Processing Your Files For Download...',
      'Please wait while the zip file is being generated.'
    );
    this.documentDataservice
      .downloadAllDocuments(
        this.gridSelectedData,
        this.current_user,
        this.columnApi
      )
      .pipe(
        finalize(() => {
          this.downloadingDocuments = false;
          this.toaster.clear();
        })
      )
      .subscribe(
        (response: any) => {
          this.downloadURI(response.url);
        },
        (err) => (this.downloadingDocuments = false)
      );
  }

  copyMoveAllDocuments(action: string) {
    if (this.freeSubscription) {
      return;
    }
    const attachment_ids = this.gridSelectedData.map((x) => x.attachment_id);

    this.customModalFactory.invoke('manage-bulk-document', {
      initialState: {
        documentOptions: {
          type: action,
          sourceEntityId: this.entity_id,
          sourceEntityType: this.entity_type,
          documentsList: attachment_ids,
        },
        success: (response: any) => {
          this.getDocumentData();
          this.closeQuickActions();
        },
      },
    });
  }

  showDocumentAction(document) {
    return this.Utils.isDocumentUploadByCurrentFirm(
      this.current_user,
      document.owner_firm_id
    );
  }

  ngOnDestroy(): void {
    this.entityDocumentsService.unSubscribeEntityLoad();
  }

  onCellClicked = (event) => {
    if (
      !event.colDef ||
      (event.colDef.colId !== 'action' &&
        event.colDef.colId !== 'document_name')
    ) {
      this.documentDataservice.setDocumentPageUrl(this.pageurl);
      if (!event.data.document.attachment_id) {
        this.routerService.navigateWithParams('app.content.document.detail', {
          documentId: event.data.document.id,
        });
      } else {
        this.routerService.navigateWithParams('app.content.document.detail', {
          documentId: event.data.document.attachment_id,
        });
      }
    }
  };
}
