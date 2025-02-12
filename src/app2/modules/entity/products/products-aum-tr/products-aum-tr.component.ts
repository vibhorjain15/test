import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { FundDataService } from 'src/app2/services/fund-data.service';
import { RouterService } from 'src/app2/services/router.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import {
  EntityType,
  keywordConstants,
} from 'src/app2/shared/constants/constant';
import { HttpClient } from '@angular/common/http';

import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { ManageAumService } from 'src/app2/services/manage-aum.service';
import { Subscription } from 'rxjs';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take } from 'rxjs/operators';
import { UnsavedChangeService } from '../../shared/unsaved-change.service';
@Component({
  selector: 'products-aum-tr',
  templateUrl: './products-aum-tr.component.html',
  styleUrls: ['./products-aum-tr.component.css'],
})
export class ProductsAumTrComponent implements OnInit, OnDestroy {
  fund;
  tables = [];
  entity_type: string;
  stateParams: any;
  fundId: any;
  currentUser: any;
  currentFirmId: any;
  subscription: Subscription;
  is_add_menu_open: boolean = false;
  unsaved_table_count: number = 0;
  @Select(UserState.getCurrentUserData) user;

  @HostListener('window:beforeunload')
  onBeforeUnload() {
    return this.unsaved_table_count === 0;
  }

  dropdownItems = [
    { key: 'add-aum', label: 'Add AUM/Track Record' },
    { key: 'upload-aum', label: 'Upload AUM/Track Record' },
  ];

  constructor(
    private readonly routerService: RouterService,
    private readonly FundDataservice: FundDataService,
    private readonly ModalFactory: CustomModalService,
    private readonly toaster: ToastrService,
    private readonly SweetAlert: SweetAlertService,
    private readonly http: HttpClient,
    private readonly manageAumService: ManageAumService,
    private readonly unsavedChangeService: UnsavedChangeService
  ) {}

  ngOnInit() {
    this.entity_type = keywordConstants.Product;
    this.stateParams = this.routerService.getState().params;
    this.fundId = this.stateParams.fundId;
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.currentUser = data;
          this.currentFirmId = this.currentUser.firmInfo.id;
          this.FundDataservice.getFund(this.fundId).subscribe((fund: any) => {
            this.fund = fund;
            this.getTables();
          });
        }
      });
    this.subscribeForTableChanges();
  }

  getTables() {
    this.FundDataservice.getShareClassTables(
      this.fund.parentFirm.id,
      this.fund.id
    ).subscribe((response: any) => {
      this.tables = response;
      this.manageAumService.setInitialTables(this.tables);
    });
  }

  subscribeForTableChanges() {
    this.subscription = this.manageAumService.tableChanged$.subscribe(() => {
      this.tables = this.manageAumService.tables;
    });
  }

  openAddTableDialog() {
    this.ModalFactory.invoke('manage-aum', {
      initialState: {
        entity_id: this.fund.id,
        entity_type: this.entity_type,
      },
      ignoreBackdropClick: true,
    });
  }

  openEditTableDialog(table, idx) {
    this.ModalFactory.invoke('manage-aum', {
      initialState: {
        entity_id: this.fund.id,
        entity_type: this.entity_type,
        table: table,
      },
      ignoreBackdropClick: true,
    });
  }

  openDeleteConfirmation(table, idx) {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to delete this data table?',
      text: '',
      focusCancel: true,
      showLoaderOnConfirm: true,
      preConfirm: () => {
        this.deleteTable(table, idx);
      },
    });
  }

  deleteTable(table, idx) {
    const params = {
      id: table.id,
      name: table.name,
      type: table.type,
      period: table.period,
      firm_id: table.firm_id,
      entity_type: table.entity_type,
      entity_id: table.entity_id,
    };
    this.http
      .delete('AumTrackRecordDefinitions/' + table.id, { params })
      .subscribe(() => {
        this.tables.splice(idx, 1);
        this.toaster.success('', 'Data table deleted successfully');
      });
  }

  backToProducts() {
    this.routerService.navigate('app.monitor.investments');
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  openUploadModal() {
    this.ModalFactory.invoke('upload-aum-file', {
      initialState: {
        entity_id: this.fund.id,
        entity_type: EntityType.Fund,
      },
    });
  }

  set_has_unsaved_changes(table, has_unsaved_changes) {
    table.has_unsaved_changes = has_unsaved_changes;
    let current_unsaved_table_count = this.tables.filter(
      (table) => table.has_unsaved_changes
    ).length;
    if (this.unsaved_table_count != current_unsaved_table_count) {
      this.unsaved_table_count = current_unsaved_table_count;
      this.unsavedChangeService.onUnsavedTableCountChange(
        this.unsaved_table_count
      );
    }
  }

  onDropdownClick(action: any) {
    const actionsMap = {
      'add-aum': () => this.openAddTableDialog(),
      'upload-aum': () => this.openUploadModal(),
    };
    actionsMap[action.key]();
  }
}
