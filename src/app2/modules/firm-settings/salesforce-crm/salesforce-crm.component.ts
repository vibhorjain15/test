import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Select, Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { finalize, take } from 'rxjs/operators';
import { DynamicsCrmService } from 'src/app2/services/dynamics-crm/dynamics-crm.service';
import { entityList } from 'src/app2/shared/constants/constant';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import { UserState } from 'src/app2/store/user/user.state';
import { SalesforceDataGridService } from './salesforce-data-grid.service';
import swal from 'sweetalert2/dist/sweetalert2.js';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { DvGridComponent } from 'src/app2/shared/components/dv-grid/dv-grid.component';
import { noWhitespaceValidator } from 'src/app2/shared/validators/no-white-space.validator';
import { errorMessageMap, Regex } from 'src/app2/shared/constants/constant';
import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';

@Component({
  selector: 'app-salesforce-crm',
  templateUrl: './salesforce-crm.component.html',
  styleUrls: ['./salesforce-crm.component.css'],
})
export class SalesforceCrmComponent implements OnInit {
  crmList = [];
  firmField = [];
  contactField = [];
  loading: any;
  currentTab: any = 0;
  isLoaded = false;
  countLoaded = false;
  lastSync = new Date();
  totalData = 0;
  configurationForm: FormGroup;
  errorMessageMap = errorMessageMap;
  isConfigured: any;
  configParams = [];
  initGridSection = true;
  isPut: boolean;
  @ViewChild('secret_token') input;
  submitted = false;
  securityToken: any = [];
  entityList = entityList;
  entityVal = 'firms';
  api: any;
  salesforceDataColumns = [];
  gridNameContact: string = 'salesforceContactDataGrid';
  gridNameFirm: string = 'salesforceFirmDataGrid';
  gridData = [];
  totalSelectedRecords: number = 0;
  resourcesGridSelectedData: Array<any> = new Array<any>();
  show_bulk_actions;
  @ViewChild('dataResourcesGrid') dataGridComponent: DvGridComponent; // ref of common grid component to call the deSelect method
  showPassword = false;
  showSecurityToken = false;
  @ViewChild('inputRef') inputRef;
  @ViewChild('inputRefPwd') inputRefPwd;
  disableFields = false;
  @Select(UserState.getCurrentUserData) user;
  is_manager: boolean;
  is_investor: boolean;
  current_user;

  constructor(
    public dynamicsCrmService: DynamicsCrmService,
    private readonly toast: ToastrService,
    public salesforceDataGridService: SalesforceDataGridService,
    private readonly store: Store,
    private readonly SweetAlert: SweetAlertService,
    private readonly modal: CustomModalService,
    private dvDatePipe: DvDatePipe
  ) {}

  ngOnInit(): void {
    this.createForm();
    this.getUserConfiguration();
    this.getCurrentUserData();
    this.setGridColumns();
    this.crmList = this.salesforceDataGridService.crmList;
    this.firmField = this.salesforceDataGridService.firmField;
    this.contactField = this.salesforceDataGridService.contactField;
    for (let index = 0; index < this.crmList.length; index++) {
      this.crmList[index].active = false;
    }
  }

  onGridReady(params) {
    this.api = params.api; //Getting all the grid apis for updating the grid columns.
  }

  getCurrentUserData() {
    this.user.pipe(take(1))
      .subscribe((user) => {
        if (user) {
          this.current_user = JSON.parse(JSON.stringify(user));
          this.is_manager = this.current_user.isManager;
          this.is_investor = this.current_user.isInvestor;
          const index = this.entityList.findIndex(
            (x) => x.id == (this.is_manager ? 'firms' : 'investors')
          );
          if (index !== -1) {
            this.entityList.splice(index, 1);
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

  createForm() {
    this.configurationForm = new FormGroup({
      consumer_key: new FormControl(null, [
        Validators.required,
        Validators.maxLength(140),
        noWhitespaceValidator,
      ]),
      consumer_secret: new FormControl(null, [
        Validators.required,
        Validators.maxLength(140),
        noWhitespaceValidator,
      ]),
      username: new FormControl(null, [
        Validators.required,
        Validators.maxLength(140),
        noWhitespaceValidator,
        Validators.email,
        Validators.pattern(Regex.validEmailId),
      ]),
      password: new FormControl(null, [
        Validators.required,
        noWhitespaceValidator,
      ]),
      security_token: new FormControl(null, [
        Validators.required,
        noWhitespaceValidator,
      ]),
      is_verified: new FormControl(false, [Validators.requiredTrue]),
    });
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

  resetForm() {
    this.configurationForm.enable();
    this.configurationForm.reset();
    this.isPut = false;
    this.disableFields = false;
  }

  cancelEdit() {
    this.configurationForm.reset(), this.configurationForm.enable();
    this.disableFields = false;
  }
  tooltipReconfig() {
    if (
      this.configurationForm.get('consumer_key').valid &&
      this.configurationForm.get('consumer_secret').valid &&
      this.configurationForm.get('username').valid &&
      this.configurationForm.get('password').valid &&
      this.configurationForm.get('security_token').valid
    ) {
      return true;
    } else {
      return false;
    }
  }
  revertForm(isConfigured) {
    if (isConfigured) {
      this.setFormData(this.configParams, 'disable');
      this.isConfigured = true;
      this.isPut = true;
      this.showPassword = false;
      this.showSecurityToken = false;
    }
  }

  setTabStatus(isConfigured) {
    if (isConfigured) {
      this.crmList = this.crmList.map((x) => ({
        ...x,
        disabled: false,
      }));
    }
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

  getUserConfiguration() {
    const crmTypeId = 2;
    this.dynamicsCrmService.getUserConfiguration(crmTypeId).subscribe(
      (res: any) => {
        this.configParams = res.config_params ? res.config_params : [];
        this.configParams['is_verified'] = false;
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

  setFormData(data, status) {
    status.toLowerCase() == 'enable'
      ? (this.configurationForm.setValue({
          consumer_key: data?.consumer_key,
          consumer_secret: data?.consumer_secret,
          username: data?.username,
          password: data?.password,
          security_token: data?.security_token,
          is_verified: data?.is_verified,
        }),
        this.configurationForm.enable(),
        (this.disableFields = false))
      : (this.configurationForm.setValue({
          consumer_key: this.transform(data?.consumer_key),
          consumer_secret: this.transform(data?.consumer_secret),
          username: this.transform(data?.username),
          password: data?.password,
          security_token: data?.security_token,
          is_verified: true,
        }),
        this.configurationForm.disable(),
        (this.disableFields = true));
  }

  transform(value: string): string {
    return value
      ? value.replace(
          value.substring(0, value.length - 9),
          value.substring(0, value.length - 9).replace(/./g, '•')
        )
      : value;
  }

  submit(isConfigured) {
    this.submitted = true;
    if (this.configurationForm.invalid) {
      return;
    }
    if (this.configurationForm.valid) {
      const configuration_copy = {
        config_params: {
          consumer_key: this.configurationForm.value.consumer_key,
          consumer_secret: this.configurationForm.value.consumer_secret,
          username: this.configurationForm.value.username,
          password: this.configurationForm.value.password,
          security_token: this.configurationForm.value.security_token,
          is_verified: this.configurationForm.value.is_verified,
        },
        crm_type_id: 2,
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
      this.showPassword = false;
      this.showSecurityToken = false;
    }
  }

  changeView() {
    this.gridData = [];
    this.salesforceDataColumns = [];
    this.api.setColumnDefs(this.salesforceDataColumns);
    if (this.currentTab == 3) {
      this.getDataCount();
    }
    this.onResourcesRowSelected([]);
    this.onResourcesSelectionChanged(null);
  }

  getDataCount() {
    this.countLoaded = false;
    const crm_type_id = 2;
    const entityVal = this.entityVal == 'investors' ? 'firms' : this.entityVal;
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

  setGridColumns() {
    this.store.dispatch(
      new SetDefaultColumnDef({
        [this.gridNameFirm]:
          this.salesforceDataGridService.getSalesforceFirmDataColumn(),
      })
    );
    this.store.dispatch(
      new SetDefaultColumnDef({
        [this.gridNameContact]:
          this.salesforceDataGridService.getSalesforceContactDataColumn(),
      })
    );
  }

  initGrid(startDate, endDate) {
    const entityVal = this.entityVal == 'investors' ? 'firms' : this.entityVal;
    swal.fire({
      title: `Importing ${entityVal}`,
    });
    swal.showLoading();
    const crmTypeId = 2;
    this.dynamicsCrmService
      .getCrmData(crmTypeId, startDate, endDate, entityVal)
      .subscribe((response: any) => {
        response.data.map((element) => {
          element.createdon_date = element.createdon;
          element.modifiedon_date = element.modifiedon;
          element.createdon = this.transformDate(element.createdon);
          element.modifiedon = this.transformDate(element.modifiedon);
        });
        this.toast.success(
          `${
            !response.data.length ? 'No' : response.data.length
          } ${entityVal.substring(
            0,
            entityVal.length - 1
          )} record/s imported from Salesforce`
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
          if (!e.title) {
            e.title = '';
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

  confirmBulkDataAddition() {
    const entityVal = this.entityVal == 'investors' ? 'firms' : this.entityVal;
    const title = `Are you sure you want to add selected ${entityVal} to DiligenceVault?`;
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
      crm_type_id: 2,
    };
    this.dynamicsCrmService
      .setCrmData(obj, entityVal)
      .pipe(finalize(() => resolve()))
      .subscribe((response: any) => {
        swal.close();
        response = response.hasOwnProperty('message')
          ? JSON.parse(response.message)
          : response;
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
}

