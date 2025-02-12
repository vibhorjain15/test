import { HttpClient } from '@angular/common/http';
import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { FirmDataService } from 'src/app2/services/firm-data.service';
import { ManageAumService } from 'src/app2/services/manage-aum.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { RouterService } from 'src/app2/services/router.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import {
  EntityType,
  keywordConstants,
} from 'src/app2/shared/constants/constant';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take } from 'rxjs/operators';
import { UnsavedChangeService } from '../../shared/unsaved-change.service';
@Component({
  selector: 'firms-aum-tr',
  templateUrl: './firms-aum-tr.component.html',
  styleUrls: ['./firms-aum-tr.component.css'],
})
export class FirmsAumTrComponent implements OnInit, OnDestroy {
  firm;
  tables;
  entity_type: string;
  stateParams: any;
  firmId: any;
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

  aumTRItems = [
    { key: 'add-aum', label: 'Add AUM/Track Record' },
    { key: 'upload-aum', label: 'Upload via Excel' },
  ];

  constructor(
    private readonly routerService: RouterService,
    private readonly firmDataService: FirmDataService,
    private readonly ModalFactory: CustomModalService,
    private readonly toaster: ToastrService,
    private readonly SweetAlert: SweetAlertService,
    private readonly http: HttpClient,
    private readonly manageAumService: ManageAumService,
    private readonly unsavedChangeService: UnsavedChangeService
  ) {}

  ngOnInit() {
    this.entity_type = keywordConstants.Firm;
    this.stateParams = this.routerService.getState().params;
    this.firmId = this.stateParams.firmId;
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.currentUser = data;
          this.currentFirmId = this.currentUser.firmInfo.id;
          this.firmDataService.getFirm(this.firmId).subscribe((firm) => {
            this.firm = firm;
            this.getTables();
          });
        }
      });
    this.subscribeForTableChanges();
  }

  getTables() {
    this.firmDataService.getTables(this.firm.id).subscribe((response: any) => {
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
        entity_id: this.firm.id,
        entity_type: this.entity_type,
      },
      ignoreBackdropClick: true,
    });
  }

  openEditTableDialog(table, idx) {
    this.ModalFactory.invoke('manage-aum', {
      initialState: {
        entity_id: this.firm.id,
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
        this.toaster.success('Data table deleted successfully');
      });
  }

  navigateToMonitorFirms() {
    this.routerService.navigate(`app.monitor.firms`);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  openUploadModal() {
    this.ModalFactory.invoke('upload-aum-file', {
      initialState: {
        entity_id: this.firm.id,
        entity_type: EntityType.Firm,
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
    switch (action.key) {
      case 'add-aum':
        this.openAddTableDialog();
        break;
      case 'upload-aum':
        this.openUploadModal()
        break;
      default:
        break;
    }
  }
}
