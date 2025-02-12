import { Component, OnDestroy, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { ManageDisclaimerService } from 'src/app2/services/manage-disclaimer/manage-disclaimer.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import {
  defaultColumn,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import { UserState } from 'src/app2/store/user/user.state';
import swal from 'sweetalert2/dist/sweetalert2.js';
import { DisclaimerService } from './disclaimer.service';
import { PanelControl } from 'src/app2/shared/components/dv-panel-heading/dv-panel-heading.component';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-disclaimers',
  templateUrl: './disclaimers.component.html',
  styleUrls: ['./disclaimers.component.css'],
})
export class DisclaimersComponent implements OnInit, OnDestroy {
  disclaimers_type;
  renderGrid;
  loading;
  activeFlagForDisclaimerApi: boolean;
  columnDef;
  disclaimers: any;
  disSub: Subject<string>;
  gridName: string = 'disclaimers';
  @Select(UserState.getCurrentUserData) user;
  manageDisSub;
  panelHeadingControls: PanelControl[] = [];
  constructor(
    private readonly SweetAlert: SweetAlertService,
    private readonly NewModalFactory: CustomModalService,
    private readonly disclaimerService: DisclaimerService,
    private readonly ManageDisclaimerService: ManageDisclaimerService,
    private readonly store: Store
  ) {}

  ngOnInit(): void {
    this.setPanelHeadingControls();
    this.user.pipe(take(1)).subscribe((data) => this.init());
  }

  setPanelHeadingControls() {
    this.panelHeadingControls = [
      {
        text: 'New Disclaimer',
        handleClick: this.addDisclaimer.bind(this),
        tooltip: 'Add New Disclaimer',
        leftIcon: 'plus',
      },
    ];
  }

  init() {
    this.disclaimers_type = 'active';
    this.activeFlagForDisclaimerApi = true;
    this.renderGrid = true;
    this.columnDef = this.disclaimerService.getDisclaimerColDef();
    this.columnDef = [
      {
        ...defaultColumn,
        colId: 'name',
        headerName: 'Name',
        field: 'name',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        floatingFilterComponent: 'textFloatingFilterComponent',
        floatingFilterComponentParams: {
          suppressFilterButton: true,
          placeHolder: 'Search...',
        },
        cellRenderer: 'disclaimerNameCellRenderer',
        cellRendererParams: {
          clickedView: (field) => {
            this.viewDisclaimer(field.data.disclaimer);
          },
        },
        suppressColumnsToolPanel: true,
      },
      ...this.columnDef,
      {
        ...defaultColumn,
        sortable: false,
        colId: 'action',
        headerName: 'Action',
        field: 'action',
        cellRenderer: 'disclaimerTemplateActionsCellRenderer',
        cellRendererParams: {
          clickedEdit: (field) => {
            this.editDisclaimer(field.data.disclaimer);
          },
          clickedDelete: (field) => {
            this.confirmDisclaimerDeletion(field.data.disclaimer);
          },
        },
        minWidth: grid_widths_map.sm_column_xm,
        headerClass: 'my-permission-cursor-pointer',
      },
    ];
    this.store.dispatch(
      new SetDefaultColumnDef({ [this.gridName]: this.columnDef })
    );
    this.refreshDisclaimerData();
    this.manageDisSub = this.ManageDisclaimerService.allDisclaimerSub.subscribe(
      () => {
        this.refreshDisclaimerData();
      }
    );
  }

  confirmDisclaimerDeletion(disclaimer) {
    const title = 'Are you sure you want to delete this disclaimer?';
    const warningText =
      'This disclaimer will be disassociated from ' +
      disclaimer.usage +
      ' diligences';
    this.SweetAlert.confirm({
      title,
      text: warningText,
      focusCancel: true,
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.deleteDisclaimer(disclaimer, resolve);
        });
      },
    }).then(() => {
      swal.close();
    });
  }

  deleteDisclaimer(disclaimer, resolve) {
    this.ManageDisclaimerService.deleteDisclaimer(
      disclaimer.id,
      () => {
        resolve();
        this.refreshDisclaimerData();
      },
      () => {}
    );
  }

  addDisclaimer() {
    this.NewModalFactory.invoke('manage-disclaimer');
  }

  refreshDisclaimerData() {
    this.renderGrid = false;
    this.loading = true;
    this.disclaimerService
      .getDisclaimerRowData({
        is_active: this.activeFlagForDisclaimerApi ? true : false,
      })
      .subscribe((disclaimers: any) => {
        this.disclaimers = disclaimers.map((disclaimer) => ({
          ...disclaimer,
          disclaimers_type: this.disclaimers_type,
        }));
        this.renderGrid = true;
        this.loading = false;
      });
  }

  setDisclaimerType(type) {
    this.disclaimers_type = type;
    this.renderGrid = false;
    this.loading = true;
    if (this.disclaimers_type === 'inactive') {
      this.activeFlagForDisclaimerApi = false;
      this.refreshDisclaimerData();
    } else {
      this.activeFlagForDisclaimerApi = true;
      this.refreshDisclaimerData();
    }
  }

  viewDisclaimer(disclaimer) {
    this.NewModalFactory.invoke('view-disclaimer', {
      initialState: {
        disclaimerObj: disclaimer,
      },
    });
  }

  editDisclaimer(disclaimerObj) {
    if (disclaimerObj.usage <= 0) {
      this.NewModalFactory.invoke('manage-disclaimer', {
        initialState: { disclaimerObj },
      });
    }
  }
  ngOnDestroy(): void {
    this.manageDisSub.unsubscribe();
  }
}
