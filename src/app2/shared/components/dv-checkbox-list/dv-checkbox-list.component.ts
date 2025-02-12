import {
  Component,
  EventEmitter,
  forwardRef,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'dv-checkbox-list',
  templateUrl: './dv-checkbox-list.component.html',
  styleUrls: ['./dv-checkbox-list.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DvCheckboxListComponent),
      multi: true,
    },
  ],
})
export class DvCheckboxListComponent implements ControlValueAccessor, OnInit {
  @Input() disabled = false;
  @Input() max_size = 5;
  @Input() items_per_page = 10;
  @Input() is_pagination_enabled = true;
  @Output() onValChange = new EventEmitter();

  // Internal properties
  checkboxes_in_page = [];
  checkboxes = [];
  current_page = 1;
  onChange = (_) => {};
  onBlur = (_) => {};

  ngOnInit() {
    this.loadPage({ page: 1 });
  }

  writeValue(obj: any[]): void {
    this.checkboxes = obj;
    if (!this.is_pagination_enabled) {
      this.items_per_page = this.checkboxes?.length;
    }

    this.loadPage({ page: 1 });
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onBlur = fn;
  }

  setDisabledState?(is_disabled: boolean): void {
    this.disabled = is_disabled;
  }

  handleValChange(checkbox, value) {
    this.onChange(this.checkboxes);
    this.onValChange.emit(
      this.checkboxes.filter((checkbox) => checkbox.is_checked)
    );
  }

  loadPage(event?) {
    if (event) {
      this.current_page = event.page;
    }
    const start_index = (this.current_page - 1) * this.items_per_page;
    const end_index = this.current_page * this.items_per_page;
    this.checkboxes_in_page =
      this.checkboxes?.slice(start_index, end_index) ?? [];
  }
}
