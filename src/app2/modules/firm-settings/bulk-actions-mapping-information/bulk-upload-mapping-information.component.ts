import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import * as angular from 'angular';
import { downgradeComponent } from '@angular/upgrade/static';
import { UtilsService } from 'src/app2/services/utils.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { BulkUploadMappingGridService } from './bulk-upload-mapping-information.service';
import { ColDef } from 'ag-grid-community';
import { keywordConstants } from 'src/app2/shared/constants/constant';
import { ToastrService } from 'ngx-toastr';
import { DvGridComponent } from 'src/app2/shared/components/dv-grid/dv-grid.component';
import swal from 'sweetalert2/dist/sweetalert2.js';
import { BulkUploadMappingAPIService } from 'src/app2/services/bulk-upload-mapping/bulk-upload-mapping.service';
import { UserState } from 'src/app2/store/user/user.state';
import { Select, Store } from '@ngxs/store';
import { finalize, take } from 'rxjs/operators';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';

@Component({
  selector: 'bulk-upload-mapping-information',
  templateUrl: './bulk-upload-mapping-information.component.html',
  styleUrls: ['./bulk-upload-mapping-information.component.css'],
})
export class BulkUploadMappingInformationComponent
  implements OnInit, OnDestroy
{
  bulk_upload_mapping_enabled;
  show_bulk_actions: boolean = false;
  totalSelectedRecords: number = 0;
  freeSubscription;
  render_grid = false;
  is_admin: any;
  is_manager: any;
  selectionType: string;
  current_user: any;
  currentFirmId: any;
  mappings;
  gridSelectedData: Array<any>;
  @ViewChild('mappingsGrid') commonGridComponent: DvGridComponent; // ref of common grid component to call the deSelect method
  gridName = 'mappings';
  mappingsSub;
  @Select(UserState.getCurrentUserData) user;

  constructor(
    private readonly Utils: UtilsService,
    private readonly BulkUploadMappingGridService: BulkUploadMappingGridService,
    private readonly BulkUploadMappingApiService: BulkUploadMappingAPIService,
    private readonly SweetAlert: SweetAlertService,
    private readonly toaster: ToastrService,
    private readonly store: Store
  ) {}

  ngOnInit() {
    this.mappingsSub = this.BulkUploadMappingApiService.mappingsSub.subscribe(
      (res) => {
        this.initGrid();
      }
    );
    this.user.pipe(take(1)).subscribe((data) => {
      if (data) {
        this.current_user = JSON.parse(JSON.stringify(data));
        this.initApi();
      }
    });
  }

  initApi() {
    this.is_admin = this.current_user.isAdmin;
    this.is_manager = this.current_user.isManager;
    this.selectionType = 'person';
    this.bulk_upload_mapping_enabled =
      this.current_user.firmInfo.hasPermissionEnabled;
    this.currentFirmId = this.current_user.firmInfo.id;
    this.render_grid = false;
    this.gridSelectedData = new Array<any>();
    let defaultColumnDef =
      this.BulkUploadMappingGridService.getMappingsColDef();

    defaultColumnDef.map(
      (x) =>
        (x.cellClass = x.colId !== 'name' ? 'my-permission-cursor-pointer' : '')
    );
    this.store.dispatch(
      new SetDefaultColumnDef({ [this.gridName]: defaultColumnDef })
    );
    this.initGrid();
  }

  initGrid() {
    this.render_grid = false;
    this.BulkUploadMappingGridService.getMappingsRowData(
      this.currentFirmId
    ).subscribe((response) => {
      this.mappings = this.Utils.sortByDate(response, 'updated_at', true);
      this.totalSelectedRecords = this.mappings.length;
      this.render_grid = true;
    });
  }

  confirmBulkMappingDeletion() {
    const title = `Are you sure, you want to delete ${this.totalSelectedRecords} mapping(s)?`;
    const text = '';
    this.SweetAlert.confirm({
      title,
      confirmButtonText: 'Yes, Please!',
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.deleteSelectedMappings(resolve);
        });
      },
    }).then(() => {
      swal.close();
      this.deSelectAllRows();
    });
  }

  onRowSelected = (row) => {
    if (row.data) {
      if (row.node.selected) {
        this.gridSelectedData.push(row.data.mapping);
      } else {
        const index = this.gridSelectedData.findIndex(
          (x) => x.id === row.data.mapping.id
        );
        if (index !== -1) {
          this.gridSelectedData.splice(index, 1);
        }
      }
    }
  };

  onSelectionChanged = (event) => {
    this.show_bulk_actions = this.gridSelectedData.length ? true : false;
    this.totalSelectedRecords = this.gridSelectedData.length;
  };

  deleteSelectedMappings(resolve) {
    const selectedRows = [...this.gridSelectedData];
    const ids = selectedRows.map((item) => item.id);
    this.BulkUploadMappingApiService.deleteMappings(ids)
      .pipe(finalize(() => resolve()))
      .subscribe((response: any) => {
        this.show_bulk_actions = false;
        this.initGrid();
        this.toaster.success('Mapping Deleted');
      }),
      (error: any) => {
        this.toaster.error(error.data.message);
      };
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

  ngOnDestroy(): void {
    this.mappingsSub.unsubscribe();
  }
}
