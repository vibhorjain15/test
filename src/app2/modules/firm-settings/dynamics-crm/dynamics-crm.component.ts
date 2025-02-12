import { DatePipe } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Select, Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { finalize, take } from 'rxjs/operators';
import { DynamicsCrmService } from 'src/app2/services/dynamics-crm/dynamics-crm.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { DvGridComponent } from 'src/app2/shared/components/dv-grid/dv-grid.component';
import { entityList } from 'src/app2/shared/constants/constant';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import { UserState } from 'src/app2/store/user/user.state';
import swal from 'sweetalert2/dist/sweetalert2.js';
import { DynamicsDataGridService } from './dynamics-data-grid.service';
import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';

@Component({
  selector: 'app-dynamics-crm',
  templateUrl: './dynamics-crm.component.html',
  styleUrls: ['./dynamics-crm.component.css'],
})
export class DynamicsCrmComponent implements OnInit {
  crmList = [];
  firmField = [];
  contactField = [];
  loading: any;
  currentTab: any = 0;
  configurationForm: FormGroup;
  firmId: any;
  disclaimers: any;
  gridNameContact: string = 'dynamicsContactDataGrid';
  gridNameFirm: string = 'dynamicsFirmDataGrid';
  name = 'Angular';
  contacts;
  configParams;
  entityList = entityList;
  entityVal = 'firms';
  initGridSection = true;
  api: any;
  dynamicsDataColumns = [];
  isConfigured: any;
  isPut: boolean;
  submitted = false;
  gridData = [];
  @ViewChild('dataResourcesGrid')
  dataGridComponent: DvGridComponent; // ref of common grid component to call the deSelect method
  totalSelectedRecords: number = 0;
  resourcesGridSelectedData: Array<any> = new Array<any>();
  show_bulk_actions;
  lastSync: Date;
  totalData = 0;
  isLoaded = false;
  countLoaded = false;
  @Select(UserState.getCurrentUserData) user$;
  is_manager: boolean;
  is_investor: boolean;
  current_user;

  constructor(
    private readonly dynamicsDataGridService: DynamicsDataGridService,
    public dynamicsCrmService: DynamicsCrmService,
    private readonly store: Store,
    private readonly modal: CustomModalService,
    private readonly toast: ToastrService,
    private readonly SweetAlert: SweetAlertService,
    private dvDatePipe: DvDatePipe
  ) {}

  @Select(UserState.getCurrentUserData) user;

  ngOnInit(): void {
    this.createForm();
    this.getCurrentUserData();
    this.getUserConfiguration();
    this.setGridColumns();
    this.crmList = this.dynamicsDataGridService.crmList;
    this.firmField = this.dynamicsDataGridService.firmField;
    this.contactField = this.dynamicsDataGridService.contactField;
    for (let index = 0; index < this.crmList.length; index++) {
      this.crmList[index].active = false;
    }
    this.user$
      .pipe(
        take(1),
      )
      .subscribe((user) => {
        if (user) {
          this.current_user = JSON.parse(JSON.stringify(user));
          this.is_manager = this.current_user.isManager;
          this.is_investor = this.current_user.isInvestor;
          if (this.is_manager) {
            const index = this.entityList.findIndex((x) => x.id == 'firms');
            if (index !== -1) {
              this.entityList.splice(index, 1);
            }
          } else {
            const index = this.entityList.findIndex((x) => x.id == 'investors');
            if (index !== -1) {
              this.entityList.splice(index, 1);
            }
          }
          this.entityVal =
            this.entityVal == 'firms'
              ? this.is_manager
                ? 'investors'
                : 'firms'
              : this.entityVal;
          this.entityList = this.entityList;
          this.getDataCount();
        }
      });
  }

  setActiveTabStatus(isConfigured) {
    if (isConfigured) {
      this.crmList.filter((x: any) => x.id == 3)[0].active = true;
      this.currentTab = 3;
    } else {
      this.crmList.filter((x: any) => x.id == 1)[0].active = true;
      this.currentTab = 1;
    }
  }

  createForm() {
    const reg = '(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})[#/\\w .-]*/?';
    this.configurationForm = new FormGroup({
      client_id: new FormControl(null, [
        Validators.required,
        this.noWhitespaceValidator,
      ]),
      client_secret: new FormControl(null, [
        Validators.required,
        this.noWhitespaceValidator,
      ]),
      crm_url: new FormControl(null, [
        Validators.required,
        Validators.pattern(reg),
        this.noWhitespaceValidator,
      ]),
      tenant_id: new FormControl(null, [
        Validators.required,
        this.noWhitespaceValidator,
      ]),
    });
  }

  noWhitespaceValidator(control: FormControl) {
    const isWhitespace = (control.value || '').trim().length === 0;
    const isValid = !isWhitespace;
    return isValid ? null : { whitespace: true };
  }

  onGridReady(params) {
    this.api = params.api; //Getting all the grid apis for updating the grid columns.
  }

  getCurrentUserData() {
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.firmId = data.firmInfo.id;
        }
      });
  }

  initGrid(startDate, endDate) {
    const entityVal = this.entityVal == 'investors' ? 'firms' : this.entityVal;
    swal.fire({
      title: `Importing ${entityVal}`,
    });
    swal.showLoading();
    const crmTypeId = 3;
    this.dynamicsCrmService
      .getCrmData(crmTypeId, startDate, endDate, entityVal)
      .subscribe((response: any) => {
        response.data.map((element) => {
          element.createdon_date = element.createdon ?? null;
          element.modifiedon_date = element.modifiedon ?? null;
          element.createdon = this.transformDate(element.createdon);
          element.modifiedon = this.transformDate(element.modifiedon);
        });
        this.toast.success(
          `${
            !response.data.length ? 'No' : response.data.length
          } ${entityVal.substring(
            0,
            entityVal.length - 1
          )} record/s imported from Dynamics`
        );
        response.data.forEach((e) => {
          if (!e.name) {
            e.name = '';
          }
          if (!e.domain) {
            e.domain = '';
          }
          if (!e.firm_type) {
            e.firm_type = '';
          }
          if (!e.primary_contact_email) {
            e.primary_contact_email = '';
          }
          if (!e.secondary_contact_emails) {
            e.secondary_contact_emails = '';
          }
          if (!e.firstname) {
            e.firstname = '';
          }
          if (!e.lastname) {
            e.lastname = '';
          }
          if (!e.email) {
            e.email = '';
          }
        });
        this.gridData = response.data;
        this.initGridSection = true;
        swal.close();
      });
  }

  transformDate(date) {
    return this.dvDatePipe.transform(date, ['isLocaleDate']);
  }

  getUserConfiguration() {
    const crmTypeId = 3;
    this.dynamicsCrmService.getUserConfiguration(crmTypeId).subscribe(
      (res: any) => {
        this.configParams = res.config_params;
        this.isConfigured = res.isConfigured;
        if (res.isConfigured) {
          this.initGridSection = true;
          this.isPut = true;
        }
        this.setFormData(
          !!res.config_params
            ? res.config_params
            : this.configurationForm.value,
          !!res.config_params ? 'disable' : 'enable'
        );
        this.setTabStatus(res.isConfigured);
        this.setActiveTabStatus(this.isConfigured);
        this.isLoaded = true;
      },
      (error) => {
        this.setActiveTabStatus(this.isConfigured);
        this.isLoaded = true;
      }
    );
  }

  getDataCount() {
    this.countLoaded = false;
    const entityVal = this.entityVal == 'investors' ? 'firms' : this.entityVal;
    const crm_type_id = 3;
    this.dynamicsCrmService.countData(entityVal, crm_type_id).subscribe(
      (response: any) => {
        if (response) {
          this.countLoaded = true;
          this.totalData = response.count;
          this.lastSync = response.last_sync;
        }
      },
      (error) => {
        this.countLoaded = true;
      }
    );
  }

  transform(value: string): string {
    return value
      ? value.replace(
          value.substring(0, value.length - 9),
          value.substring(0, value.length - 9).replace(/./g, '*')
        )
      : value;
  }

  setGridColumns() {
    this.store.dispatch(
      new SetDefaultColumnDef({
        [this.gridNameFirm]:
          this.dynamicsDataGridService.getDynamicsFirmDataColumn(),
      })
    );
    this.store.dispatch(
      new SetDefaultColumnDef({
        [this.gridNameContact]:
          this.dynamicsDataGridService.getDynamicsContactDataColumn(),
      })
    );
  }

  switchTab(item) {
    this.deSelectAllRows();
    this.show_bulk_actions = false;
    this.crmList.filter((x) => x.active == true)[0].active = false;
    this.currentTab = item.id;
    item.active = true;
    this.entityVal = this.is_manager ? 'investors' : 'firms';
    if (item.id == 3) {
      this.getDataCount();
    }
    this.gridData = [];
    this.setFormData(this.configParams, 'disable');
    this.isPut = true;
  }

  setTabStatus(isConfigured) {
    if (isConfigured) {
      this.crmList = this.crmList.map((x) => ({
        ...x,
        disabled: false,
      }));
    }
  }

  resetForm() {
    this.configurationForm.enable();
    this.configurationForm.reset();
    this.isPut = false;
  }

  submit(isConfigured) {
    this.submitted = true;
    if (this.configurationForm.invalid) {
      return;
    }
    if (this.configurationForm.valid) {
      const configuration_copy = {
        config_params: {
          client_id: this.configurationForm.value.client_id,
          client_secret: this.configurationForm.value.client_secret,
          crm_url: this.configurationForm.value.crm_url,
          tenant_id: this.configurationForm.value.tenant_id,
        },
        crm_type_id: 3,
      };
      const service = isConfigured
        ? this.dynamicsCrmService.updateUserConfiguration(configuration_copy)
        : this.dynamicsCrmService.setUserConfiguration(configuration_copy);

      service.subscribe(
        (res: any) => {
          if (res) {
            if (res.isConfigured) {
              this.toast.success(res.message);
              this.setTabStatus(res.isConfigured);
            } else if (!res.isConfigured) {
              this.toast.error(res.message);
            }
            this.setFormData(this.configurationForm.value, 'disable');
            this.isConfigured = res.isConfigured;
            this.isPut = res.isConfigured;
          }
          this.configParams = this.configurationForm.value;
          this.submitted = false;
        },
        (error) => {
          if (error.status === 400) {
            this.setFormData(this.configurationForm.value, 'enable');
          }
          this.submitted = false;
        }
      );
    }
  }

  cancelEdit() {
    this.configurationForm.reset(), this.configurationForm.enable();
  }

  revertForm(isConfigured) {
    if (isConfigured) {
      this.setFormData(this.configParams, 'disable');
      this.isConfigured = true;
      this.isPut = true;
    }
  }

  openImportingFirms() {
    this.modal.invoke('importing-firms', {
      initialState: {
        entity: this.entityVal,
        onSuccess: (res) => {
          if (res.import_all_acc_firm.toLowerCase() == 'alldates') {
            this.initGridSection = false;
            this.initGrid('', '');
          } else if (res.import_all_acc_firm.toLowerCase() == 'specificdate') {
            this.initGridSection = false;
            this.initGrid(
              res.selected_date_range.startDate,
              res.selected_date_range.endDate
            );
          }
          this.onResourcesRowSelected([]);
          this.onResourcesSelectionChanged(null);
        },
      },
      class: 'modal-md',
    });
  }

  setFormData(data, status) {
    status.toLowerCase() == 'enable'
      ? (this.configurationForm.setValue({
          client_id: data?.client_id,
          client_secret: data?.client_secret,
          crm_url: data?.crm_url,
          tenant_id: data?.tenant_id,
        }),
        this.configurationForm.enable())
      : (this.configurationForm.setValue({
          client_id: this.transform(data?.client_id),
          client_secret: this.transform(data?.client_secret),
          crm_url: this.transform(data?.crm_url),
          tenant_id: this.transform(data?.tenant_id),
        }),
        this.configurationForm.disable());
  }

  changeView() {
    this.gridData = [];
    this.dynamicsDataColumns = [];
    this.api.setColumnDefs(this.dynamicsDataColumns);
    if (this.currentTab == 3) {
      this.getDataCount();
    }
    this.onResourcesRowSelected([]);
    this.onResourcesSelectionChanged(null);
  }

  confirmBulkDataAddition() {
    const entityVal = this.entityVal == 'investors' ? 'firms' : this.entityVal;
    const title = `Are you sure you want to add selected ${entityVal} to DiligenceVault?`;
    const text = '';
    this.SweetAlert.confirm({
      title,
      confirmButtonText: 'Yes, Please!',
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          swal.fire({
            title: 'Data is being added to DiligenceVault',
          });
          swal.showLoading();
          this.addDataToPlatform(resolve);
        });
      },
    }).then(() => {
      swal.close();
      this.deSelectAllRows();
    });
  }

  addDataToPlatform(resolve) {
    const entityVal = this.entityVal == 'investors' ? 'firms' : this.entityVal;
    const selectedRows = [...this.resourcesGridSelectedData];
    this.show_bulk_actions = false;
    const obj = {
      data: selectedRows,
      crm_type_id: 3,
    };
    this.dynamicsCrmService
      .setCrmData(obj, entityVal)
      .pipe(finalize(() => resolve()))
      .subscribe((response: any) => {
        swal.close();
        if (response.message.toLowerCase() == 'success') {
          this.toast.success(
            'Adding data to DiligenceVault. Please check your email for detailed report.'
          );
        }
        this.onDelete(selectedRows);
        this.resourcesGridSelectedData = [];
        this.getDataCount();
      });
  }

  onDelete(params) {
    this.gridData = this.filterByReference(this.gridData, params);
    this.show_bulk_actions = false;
    return JSON.parse(JSON.stringify(this.gridData));
  }

  filterByReference = (gridData, selectedRows) => {
    let res = [];
    res = gridData.filter((el) => {
      return !selectedRows.find((element) => {
        return element.sourceid === el.sourceid;
      });
    });
    return res;
  };

  onResourcesRowSelected = (row) => {
    if (row.data) {
      if (row.node.selected) {
        this.resourcesGridSelectedData.push(row.data);
      } else {
        const index = this.resourcesGridSelectedData.findIndex(
          (x) => x.sourceid === row.data.sourceid
        );
        if (index !== -1) {
          this.resourcesGridSelectedData.splice(index, 1);
        }
      }
    } else if (row.node?.group == true) {
      this.resourcesGridSelectedData = this.resourcesGridSelectedData;
    } else {
      this.resourcesGridSelectedData = [];
    }
  };

  onResourcesSelectionChanged = (event) => {
    this.show_bulk_actions = this.resourcesGridSelectedData.length
      ? true
      : false;
    this.totalSelectedRecords = this.resourcesGridSelectedData.length;
  };

  closeQuickActions() {
    this.show_bulk_actions = false;
    this.deSelectAllRows();
  }

  deSelectAllRows() {
    this.resourcesGridSelectedData = new Array<any>();
    this.dataGridComponent?.deSelectAllRows();
    this.totalSelectedRecords = 0;
  }
}


