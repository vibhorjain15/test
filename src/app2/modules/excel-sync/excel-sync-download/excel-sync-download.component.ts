import { HttpClient } from '@angular/common/http';
import {
  AfterContentChecked,
  Component,
  ElementRef,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { UtilsService } from 'src/app2/services/utils.service';
import { RouterService } from 'src/app2/services/router.service';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { finalize, take } from 'rxjs/operators';
import * as saveAs from 'file-saver';
import { DateRangePickerComponent } from 'src/app2/shared/components/date-range-picker/date-range-picker.component';
@Component({
  selector: 'app-excel-sync-download',
  templateUrl: './excel-sync-download.component.html',
  styleUrls: ['./excel-sync-download.component.css'],
})
export class ExcelSyncDownloadComponent implements OnInit, AfterContentChecked {
  sync_type: string;
  products_list: any[];
  isInvestor: boolean;
  loading_prefs: boolean;
  selected_template: any;
  products_disabled: boolean;
  filters: any[];
  disable_selected_all_products: boolean;
  product: any;
  excelSyncForm: FormGroup;
  product_name = '';
  Navigator: any = navigator;
  Window: any = window;
  templates_list: any[];
  customDateFilter: { startDate: any; endDate: any; selectedRange: any };
  @ViewChild('dateRangePicker') dateRangePicker: DateRangePickerComponent;
  defaultDateRange: any;
  defaultCustomDateFilter: any;
  active_dds: any;
  active_dds_loading: any;
  transaction_id: number;
  active_investors: any[];
  active_managers: any[];
  copyOfProductList: any[];
  selected_products_list: any[];
  stateParams: any;
  count = 0;
  ranges = {
    'Last 1 month': [moment().subtract(1, 'month'), moment()],
    'Last 3 month': [moment().subtract(3, 'month'), moment()],
    'Last 6 month': [moment().subtract(6, 'month'), moment()],
    'Last 1 year': [moment().subtract(1, 'year'), moment()],
  };
  processing_excel: boolean;
  selected_firm: any;
  @Select(UserState.getCurrentUserData) user;
  @Select(UserState.getFirmPreferenceData) firmPref;
  dateRange: any;
  @ViewChildren('myRef') containers: QueryList<ElementRef>;

  constructor(
    private readonly Utils: UtilsService,
    private readonly http: HttpClient,
    private readonly toaster: ToastrService,
    private readonly routerService: RouterService,
  ) {}

  ngOnInit(): void {
    this.createForm();
    this.loading_prefs = true;
    this.stateParams = this.routerService.getState().params;
    this.sync_type = this.stateParams.sync_type;
    this.transaction_id = this.stateParams?.Id;
    this.disable_selected_all_products = false;
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.isInvestor = data.isInvestor;
          if (this.sync_type === 'download') {
            this.templates_list = [];
            this.products_list = [];
            this.getFirmPref();
            this.getAllActiveDDs();
          }
          this.loading_prefs = false;
        }
      });
  }

  createForm() {
    this.excelSyncForm = new FormGroup({
      firm: new FormControl(null, Validators.required),
      template: new FormControl(null, Validators.required),
    });
  }

  enumerateDaysBetweenDates(startDate: any, endDate: any) {
    const now = startDate;
    const dates = [];
    while (now.isSameOrBefore(endDate)) {
      dates.push(now.format('M/D/YYYY'));
      now.add(1, 'days');
    }
    return dates;
  }

  getFirmPref() {
    this.loading_prefs = true;
    this.firmPref.pipe(take(1)).subscribe((response) => {
      if (response) {
        this.customDateFilter = this.Utils.getPredefinedDateRanges(
          response.default_daterange_months
        );
        this.customDateFilter.selectedRange = this.Utils.getDateRanges().find(
          (val) => `${val.value}` === `${response.default_daterange_months}`
        )?.label;
        this.dateRange = {
          startDate: this.Utils.formatDatetime(this.customDateFilter.startDate),
          endDate: this.Utils.formatDatetime(this.customDateFilter.endDate),
          range: response?.default_daterange_months ?? 'null',
        };
        this.defaultDateRange = { ...this.dateRange };
        this.customDateFilter = {
          ...this.customDateFilter,
          startDate: this.dateRange?.startDate,
          endDate: this.dateRange?.endDate,
        };
        this.defaultCustomDateFilter = { ...this.customDateFilter };
        this.loading_prefs = false;
      }
    });
  }

  getAllActiveDDs() {
    this.active_dds_loading = true;
    this.http
      .get('excel_sync/diligences')
      .pipe(finalize(() => (this.active_dds_loading = false)))
      .subscribe((response: any) => {
        this.active_dds = response.filter(
          (dd) => dd.status !== 'Completed' && dd.status !== 'PendingRestart'
        );
        if (!this.isInvestor) {
          this.setInvestorsList();
        } else {
          this.setManagersList();
        }
      });
  }

  goToPreviousPage() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.stateParams.sync_type = 'download';
      this.routerService.navigate('app.diligence.excel_sync.list');
    }
  }

  findUniqueDataAndSort(array: any[]): any[] {
    const arr = array.filter(
      (element, i) => array.findIndex((t) => t.id === element.id) === i
    );
    arr.sort((a, b) => a.name.localeCompare(b.name));
    return arr;
  }

  setInvestorsList() {
    this.active_investors = this.active_dds.map((dd) => ({
      name: dd.fromfirm_name,
      id: dd.fromfirm_id,
    }));

    this.active_investors = this.findUniqueDataAndSort(this.active_investors);
  }

  setManagersList() {
    this.active_managers = this.active_dds.map((dd) => ({
      name: dd.tofirm_name,
      id: dd.tofirm_id,
    }));
    this.active_managers = this.findUniqueDataAndSort(this.active_managers);
  }

  sortBetweenDates(startDate: any, endDate: any) {
    if (this.copyOfProductList) {
      this.products_list = JSON.parse(JSON.stringify(this.copyOfProductList));
      if (startDate && endDate) {
        startDate = moment(new Date(startDate));
        endDate = moment(new Date(endDate));
        const datesArray = this.enumerateDaysBetweenDates(startDate, endDate);
        const testArr = [];
        this.products_list.forEach((product) => {
          product.created_at = moment(product.created_at);
          product.created_at = product.created_at.format('M/D/YYYY');
          if (datesArray.includes(product.created_at)) {
            testArr.push(product);
          }
        });
        this.products_list = testArr;
      }
    }
  }

  firmSelected(event: any) {
    this.selected_template = false;
    this.selected_firm = this.excelSyncForm.get('firm').value;
    if (this.selected_firm) {
      this.products_list = [];
      this.copyOfProductList = [];
      this.templates_list = [];
      this.excelSyncForm.get('template').patchValue(null);
      const dds_list = this.active_dds.filter(
        (dd) =>
          this.selected_firm.id ===
          (!this.isInvestor ? dd.fromfirm_id : dd.tofirm_id)
      );
      const templates_list = dds_list.map((dd) => ({
        name: dd.template_name,
        id: dd.template_id,
      }));

      this.templates_list = this.findUniqueDataAndSort(templates_list);
    }
  }

  templateSelected() {
    this.selected_template = this.excelSyncForm.get('template').value;
    if (this.selected_template) {
      this.products_list = [];
      const firmId = this.selected_firm.id;
      const dds_list = this.active_dds.filter(
        (dd) => firmId === (!this.isInvestor ? dd.fromfirm_id : dd.tofirm_id)
      );
      const dds_list_by_template = dds_list.filter(
        (dd) => this.selected_template.id === dd.template_id
      );
      const products_list_by_template = dds_list_by_template.map((dd) => {
        return {
          entity_name: dd.entity_name,
          id: dd.entity_id,
          name: dd.name,
          tofirm_name: dd.tofirm_name,
          as_of_date: dd.as_of_date,
          entity_type: dd.entity_type,
          created_at: dd.created_at,
          due_at: dd.due_at,
          dd_id: dd.id,
          display_name: this.Utils.getDisplayEntityType(dd.entity_type),
        };
      });

      this.products_list = products_list_by_template.filter(
        (element, i) =>
          products_list_by_template.findIndex(
            (t) => t.dd_id === element.dd_id
          ) === i
      );
      this.products_list.sort((a, b) => a?.name?.localeCompare(b?.name));
      this.copyOfProductList = [...this.products_list];
      this.sortBetweenDates(
        this.dateRange ? this.dateRange.startDate : null,
        this.dateRange ? this.dateRange.endDate : null
      );
    }
  }

  toggleProductSelection(product, isSelected: any) {
    product.is_selected = isSelected;
    if (this.getSelectedProducts().length === this.products_list.length) {
      this.disable_selected_all_products = true;
    } else {
      this.disable_selected_all_products = false;
    }
  }

  selectedAllProducts() {
    this.products_list.map((x) => (x.is_selected = true));
    this.disable_selected_all_products = true;
  }

  clearAllProducts() {
    this.products_list.map((x) => (x.is_selected = false));
    this.disable_selected_all_products = false;
  }

  goBack() {
    window.history.back();
  }

  getSelectedProducts() {
    this.selected_products_list = this.products_list.filter(
      (product) => product.is_selected
    );
    return this.selected_products_list;
  }
  resetDates() {
    this.customDateFilter = { ...this.defaultCustomDateFilter };
    this.dateRange = { ...this.defaultDateRange };
    this.dateRangePicker?.setDateRange(this.defaultDateRange, true);
  }
  resetFilter() {
    this.products_list = [];
    this.copyOfProductList = [];
    this.excelSyncForm.reset();
    this.excelSyncForm.get('firm').patchValue(null);
    this.excelSyncForm.get('template').patchValue(null);
    this.selected_firm = null;
    this.selected_template = null;
    this.resetDates();
    this.clearAllProducts();
  }

  processExcelSync() {
    this.processing_excel = true;
    if (this.sync_type === 'download') {
      if (this.getSelectedProducts().length) {
        let request_payload;
        const products_id_arr = this.getSelectedProducts().map(
          (product) => product.dd_id
        );
        this.toaster.info(
          'Processing Excel Download...',
          'Please wait while the excel file is being generated.',
          { timeOut: 0 }
        );
        request_payload = {
          template_id: this.selected_template.id,
          diligences: products_id_arr,
          investor_firm_id: this.selected_firm.id,
        };
        this.http
          .post('excel_sync/download', request_payload, {
            responseType: 'blob',
            observe: 'response',
          })
          .pipe(
            finalize(() => {
              this.toaster.clear();
              this.processing_excel = false;
            })
          )
          .subscribe(
            (response: any) => {
              const content_disposition_header = response.headers.get(
                'Content-Disposition'
              );
              let file_name = 'download.xlsx';
              try {
                file_name = content_disposition_header
                  ?.split(';')[1]
                  .split('filename')[1]
                  .split('=')[1]
                  .trim();
              } catch (err) {}
              saveAs(response.body, file_name);
              this.resetFilter();
            },
            (error: any) => {
              this.toaster.error(error.message);
            }
          );
      } else {
        this.toaster.error('Please select at least one project.');
        this.processing_excel = false;
      }
    }
  }

  onDateChange(date) {
    this.customDateFilter = date;
    if (date) {
      this.dateRange = {
        startDate: date.startDate,
        endDate: date.endDate,
      };
      this.sortBetweenDates(this.dateRange.startDate, this.dateRange.endDate);
    }
  }

  onClearDateFilter() {
    this.dateRange = null;
    this.sortBetweenDates(null, null);
  }

  navigateToQuestionnaire(transaction) {
    this.routerService.navigateWithParams(
      'app.diligence.project.questionnaire',
      { diligenceId: transaction.duediligence_id }
    );
  }

  ngAfterContentChecked() {
    this.count = this.containers?.length;
  }
}
