import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Select } from '@ngxs/store';
import { take } from 'rxjs/operators';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { UserState } from 'src/app2/store/user/user.state';

@Component({
  selector: 'app-importing-firms',
  templateUrl: './importing-firms.component.html',
  styleUrls: ['./importing-firms.component.css'],
})
export class ImportingFirmsComponent implements OnInit {
  loader: boolean = false;
  tinyMceInit = {
    placeholder: 'Internal Notes',
  };

  notes: string = '';
  notesId: number;
  noteCheck: string = '';
  templateID: number;
  importingForm: FormGroup;
  allDates: any;
  dateRangeForDirectives = null;
  customDateFilter;
  maxDate = new Date();
  @Input() onSuccess;
  @Input() entity: string;
  @Select(UserState.getFirmPreferenceData) firmPref;
  loading_prefs: boolean;

  constructor(
    private readonly Utils: UtilsService,
    private modal: CustomModalService
  ) {}

  ngOnInit(): void {
    this.maxDate = new Date();
    this.importingForm = new FormGroup({
      import_all_acc_firm: new FormControl('allDates'),
      specific_date_range: new FormControl('allDates'),
      selected_date_range: new FormControl(null, Validators.required),
    });
    this.getFirmPref();
  }

  getFirmPref() {
    this.loading_prefs = true;
    this.firmPref.pipe(take(1)).subscribe((response) => {
      this.customDateFilter = this.Utils.getPredefinedDateRanges(
        response.default_daterange_months
      );
      if (response.default_daterange_months) {
        this.dateRangeForDirectives = {
          startDate: this.Utils.formatDatetime(this.customDateFilter.startDate),
          endDate: this.Utils.formatDatetime(this.customDateFilter.endDate),
          range: response?.default_daterange_months ?? 'null',
        };
      } else {
        this.dateRangeForDirectives = null;
      }
      this.loading_prefs = false;
    });
  }

  onChange(event) {
    if (event && event.startDate && event.endDate) {
      this.applyMethod(
        this.Utils.formatDate(event.startDate),
        this.Utils.formatDate(event.endDate),
        event.range
      );
    }
    this.importingForm.patchValue({
      selected_date_range: event
    });
  }

  applyMethod(startDate, endDate, range) {
    this.dateRangeForDirectives = {
      startDate,
      endDate,
      range,
    };
  }

  onClearDateFilter() {
    this.dateRangeForDirectives = null;
    this.importingForm.patchValue({
      selected_date_range: null
    });
  }

  onImport(event) {
    this.importingForm.setValue({
      import_all_acc_firm: this.importingForm.value.import_all_acc_firm,
      specific_date_range: this.importingForm.value.specific_date_range,
      selected_date_range: this.dateRangeForDirectives,
    });
    this.onSuccess(this.importingForm.value);
    this.modal.close();
  }
}
