import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import * as moment from 'moment';
import { DateRanges } from '../../constants/constant';

@Component({
  selector: 'app-date-range-picker',
  templateUrl: './date-range-picker.component.html',
  styleUrls: ['./date-range-picker.component.css'],
})
export class DateRangePickerComponent implements OnInit, OnChanges {
  @Input() customDate;
  @Input() maxDate;
  @Input() minDate;
  @Input() showRanges: boolean = true;
  @Input() minMode: 'day' | 'month' | 'year' = 'day';
  @Input() appendTime: boolean = true;
  @Input() format = 'DD MMM YYYY';
  @Input() container = 'body';
  @Input() placement;
  @Input() showClearButton = true;
  @Input() containerClass = '';
  @Input() ariaLabel = 'Select Dates';
  @Input() id: string = null;
  @Input() helpText = '';
  @Input() ariaLabelledBy = '';
  @Output() change = new EventEmitter();
  @Output() clearDateFilter = new EventEmitter();
  dateRange;
  ranges = DateRanges;
  config: any = {
    ranges: this.ranges,
    containerClass: 'theme-blue',
    rangeInputFormat: 'DD MMM YYYY',
    showWeekNumbers: false,
    showPreviousMonth: true,
    minMode: 'day',
  };
  localRange;

  dateMap = {
    1: DateRanges[0].value,
    3: DateRanges[1].value,
    6: DateRanges[2].value,
    12: DateRanges[3].value,
    null: DateRanges[4].value,
  };
  ngOnInit(): void {
    setTimeout(() => {
      if (!this.customDate) {
        this.dateRange = null;
      } else if (this.customDate.range) {
        this.dateRange = this.dateMap[this.customDate?.range ?? 'null'];
      } else {
        // moment(null) -> INVALID DATE
        // moment(undefined) -> Current Date
        const dateRange = [
          this.customDate.startDate
            ? moment(this.customDate.startDate).toDate()
            : null,
          this.customDate.endDate
            ? moment(this.customDate.endDate).toDate()
            : null,
        ];
        this.dateRange = dateRange;
      }
    }, 10);
    if (!this.showRanges) {
      delete this.config.ranges;
    }
    this.config.minMode = this.minMode;
    this.config.rangeInputFormat = this.format;
    this.config.containerClass += ` ${this.containerClass}`;

    if (!this.placement) {
      this.config.adaptivePosition = true;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      !changes.customDate.firstChange &&
      changes.customDate.previousValue?.length &&
      changes.customDate.currentValue?.length &&
      (changes.customDate.currentValue[0].getTime() !=
        changes.customDate.previousValue[0].getTime() ||
        changes.customDate.currentValue[1].getTime() !=
          changes.customDate.previousValue[1].getTime())
    ) {
      this.ngOnInit();
    }
    if (
      !changes.customDate.firstChange &&
      (this.customDate == null ||
        this.dateRange == null ||
        (this.customDate &&
          this.dateRange &&
          !(
            moment(this.customDate?.startDate).format(this.format) ===
              moment(this.dateRange[0]).format(this.format) &&
            moment(this.customDate?.endDate).format(this.format) ===
              moment(this.dateRange[1]).format(this.format)
          )))
    ) {
      this.updateDateRange();
    }
  }

  updateDateRange() {
    if (this.customDate)
      this.dateRange = [
        new Date(this.customDate.startDate),
        new Date(this.customDate.endDate),
      ];
    else this.dateRange = null;
  }

  onChange(event) {
    if (event && event[0] && event[1]) {
      if (event === this.ranges[4].value) {
        setTimeout(() => {
          this.dateRange = null; //[null, null];
        }, 0);
        this.clearDateFilter.emit();
      } else {
        this.getDateRangeMonth(event);
        let startDate = moment(new Date(event[0])).format(this.format);
        let endDate = moment(new Date(event[1])).format(this.format);
        if (this.appendTime) {
          // appending time part to indicate start and end time respectively
          startDate += ' 00:00:00';
          endDate += ' 23:59:59';
        }
        this.change.emit({
          startDate,
          endDate,
          range: this.localRange,
        });
      }
    } else {
      setTimeout(() => {
        this.dateRange = null; //[null, null];
      }, 100);
    }
  }

  getDateRangeMonth(event) {
    this.localRange = null;
    for (const [key, value] of Object.entries(this.dateMap)) {
      if (moment(event[0]).isSame(value[0])) {
        this.localRange = key;
      }
    }
  }

  onClick(dp) {
    dp.toggle();
  }

  setDateRange(dateRange, isCustomDate = false) {
    if (!isCustomDate) {
      this.dateRange = dateRange;
    } else {
      // dateRange object is same as what we receive in the input in the form of "customDate"
      // so assign the same way we do in ngOnInit()
      this.dateRange = this.dateMap[dateRange?.range ?? 'null'] ?? null;
    }
  }
}
