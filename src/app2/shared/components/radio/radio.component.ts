import { Component, forwardRef, Input, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-radio',
  templateUrl: './radio.component.html',
  styleUrls: ['./radio.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioComponent),
      multi: true,
    },
  ],
})
export class RadioComponent implements OnInit, ControlValueAccessor {
  @Input() label? = '';
  @Input() name? = '';
  @Input() value1?;
  @Input() disabled? = false;
  @Input() id? = '';
  _value = false;
  propagateChange = (_: any) => {};

  constructor() {}

  ngOnInit(): void {
    this.value = this.value1;
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

  registerOnTouched(fn: any): void {}

  setDisabledState?(isDisabled: boolean): void {}
}
