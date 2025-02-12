import {
  Component,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
  ViewChild,
  forwardRef,
} from '@angular/core';
import {
  BsDatepickerDirective,
  BsDaterangepickerConfig,
} from 'ngx-bootstrap/datepicker';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DateTimeModel } from '../../models/date-time.model';
@Component({
  selector: 'app-date-time-picker',
  templateUrl: './date-time-picker.component.html',
  styleUrls: ['./date-time-picker.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateTimePickerComponent),
      multi: true,
    },
  ],
})
export class DateTimePickerComponent implements ControlValueAccessor {
  @ViewChild('dp') datePicker: BsDatepickerDirective;
  @Input() value: Date;
  @Input() minDate: Date;
  @Input() maxDate: Date;
  @Input() placeholder = '';
  @Input() disabled: boolean = false;
  @Input() showSec:boolean = false;
  @Output() change = new EventEmitter<Date>();
  @Output() blur = new EventEmitter<null>();
  @Input() clearable = false;
  _value = null;
  timePickerValue: Date = new Date();
  datePickerValue = null;
  config: Partial<BsDaterangepickerConfig>;
  inputDatetimeFormat = 'dd-MMM-yyyy, h:mm:ss a';
  inputValue: any;
  private datetime: DateTimeModel = new DateTimeModel();
  adjustedDate: Date;
  @ViewChild('pop') pop;
  previousDate: Date;
  isTimeChanged: boolean;
  constructor() {}

  ngOnInit(): void {
    this.init();
    this.config = {
      containerClass: 'theme-blue',
      showWeekNumbers: false,
    };
  }
  init(){
    this.timePickerValue = !!this.value ? new Date(this.value) : new Date();
    this.datePickerValue = !!this.value ? new Date(this.value) : null;
    this.inputValue = !!this.value ? new Date(this.value) : null;
    this.previousDate=!!this.value ? new Date(this.value) : null;
    this._value = this.value ?? null;
  }
  writeValue(value: any): void {
    if (value !== undefined && value instanceof Date) {
      this._value = value;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.inputValue) {
      this.timePickerValue = new Date(this.inputValue);
    }
  }

  registerOnChange(fn: any): void {}
  registerOnTouched(fn: any): void {}

  onDateChange(date) {
    if(!date) return;
    this.timePickerValue = !!this.value ? new Date(this.value) : new Date();
    this.datetime.year = date.getFullYear();
    this.datetime.month = date.getMonth() + 1;
    this.datetime.day = date.getDate();
    if(!this.isTimeChanged){
    this.datetime.hour = new Date().getHours();
    this.datetime.minute = new Date().getMinutes();
    this.datetime.second = new Date().getSeconds();
    }
    this.adjustedDate = new Date(this.datetime.toString());
    this.value = this.adjustedDate;
    this.inputValue = new Date(this.datetime.toString());
    if (!this.datesAreEqual(this.previousDate, date)) {
      this.previousDate = date;
      this.pop.hide();
    }
    this.isTimeChanged=false;
  }
  setDateStringModel() {
    this.inputValue = this.datetime.toString();
  }
  onTimeChange(event) {
    this.isTimeChanged=true;
    this.datetime.hour = event.getHours();
    this.datetime.minute = event.getMinutes();
    this.datetime.second = event.getSeconds();
    this.setDateStringModel();
    this.value = this.adjustedDate;
  }
  onPopoverHidden() {
    this.blur.emit();
    if(this.inputValue){
      this.change.emit(new Date(this.inputValue));
    }
  }
  showPop(){
    this.pop.show();
  }
  hidePop(){
    this.pop.hide();
  }
  clear() {
    this.value = null;
    this.change.emit();
    this.init();
    this.datetime = new DateTimeModel();
  }
  datesAreEqual(date1: Date, date2: Date): boolean {
    if (!date1 || !date2) {
      return false;
    }
    return date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();
  }
}
