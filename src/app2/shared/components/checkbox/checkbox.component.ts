import {
  Component,
  forwardRef,
  Input,
  OnInit,
  Output,
  EventEmitter,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-checkbox',
  templateUrl: './checkbox.component.html',
  styleUrls: ['./checkbox.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true,
    },
  ],
})
export class CheckboxComponent implements OnInit, ControlValueAccessor {
  @Input() label? = '';
  @Input() disabled?: boolean = false;
  @Output() onClick?: EventEmitter<string> = new EventEmitter();
  @Input() isWorkflow = false;
  @Input() name = '';
  @Input() initialValue: boolean = false;
  _value = false;
  propagateChange = (_: any) => {};
  constructor() {}

  ngOnInit(): void {
    this._value = this.initialValue ?? false;
  }

  get value(): boolean {
    return this._value;
  }

  set value(value) {
    this._value = value;
    this.propagateChange(this._value);
  }

  writeValue(value: any): void {
    if (value !== undefined) {
      this._value = value;
    }
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  handleOnClick() {
    if (!this.disabled) {
      this.value = !this._value;
      if (this.onClick) {
        this.onClick.emit();
      }
    }
  }

  registerOnTouched(fn: any): void {}

  setDisabledState?(isDisabled: boolean): void {}
}