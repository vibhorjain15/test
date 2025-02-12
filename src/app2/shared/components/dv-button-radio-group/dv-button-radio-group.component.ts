import {
  Component,
  EventEmitter,
  forwardRef,
  Input,
  Output,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'dv-button-radio-group',
  templateUrl: './dv-button-radio-group.component.html',
  styleUrls: ['./dv-button-radio-group.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DvButtonRadioGroupComponent),
      multi: true,
    },
  ],
})
export class DvButtonRadioGroupComponent implements ControlValueAccessor {
  @Input() items: {
    id: number;
    name: string;
    disabled: boolean;
    tooltip: string;
  }[];
  @Input() disabled: boolean = false;
  @Input() size? = '';
  @Output() onActiveButtonChange = new EventEmitter();

  onChangeCallback = (_: any) => {};

  private _value: number;
  public get value(): number {
    return this._value;
  }
  public set value(v: number) {
    if (v !== this._value) {
      this._value = v;
      this.onChangeCallback(v);
      this.onActiveButtonChange.emit(v);
    }
  }

  writeValue(value: number): void {
    if (value !== this._value) {
      this._value = value;
    }
  }

  registerOnChange(fn: any): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: any): void {}

  setValue(value) {
    if (!this.disabled) {
      this.value = value;
    }
  }
}
