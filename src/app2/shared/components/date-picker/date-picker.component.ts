import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  forwardRef,
} from '@angular/core';
import {
  BsDatepickerDirective,
  BsDaterangepickerConfig,
} from 'ngx-bootstrap/datepicker';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-date-picker',
  templateUrl: './date-picker.component.html',
  styleUrls: ['./date-picker.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true,
    },
  ],
})
export class DatePickerComponent implements ControlValueAccessor {
  @ViewChild('dp') datePicker: BsDatepickerDirective;
  @Input() value: Date;
  @Input() minDate: Date;
  @Input() maxDate: Date;
  @Input() placeholder = 'Select Date';
  @Input() disabled: boolean = false;
  @Input() placement: 'top' | 'bottom' | 'left' | 'right';
  @Input() container = 'body';
  @Input() class? = '';
  @Input() clearable = false;
  @Input() format;
  @Input() id = '';
  @Input() withTimePicker = false;
  @Output() change = new EventEmitter<Date>();
  @Input() ariaLabel = '';
  @Output() blur = new EventEmitter<null>();
  _value = null;
  propagateChange = (_: any) => {};

  config: Partial<BsDaterangepickerConfig>;
  constructor() {}

  ngOnInit(): void {
    this._value = this.value ?? null;
    this.config = {
      dateInputFormat: this.format ? this.format: 'DD-MMMM-YYYY',
      containerClass: 'theme-blue',
      showWeekNumbers: false
    };
    if (!this.placement) {
      this.config.adaptivePosition = true;
    }
  }

  clear() {
    this.value = null;
  }

  onValueChange(event: Date) {
    this.change.emit(event);
  }

  onBlur() {
    this.blur.emit();
  }

  close() {
    this.datePicker.hide();
  }
  writeValue(value: any): void {
    if (value !== undefined) {
      this._value = value;
    }
  }
  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }
  registerOnTouched(fn: any): void {}
  setDisabledState?(isDisabled: boolean): void {}
}
