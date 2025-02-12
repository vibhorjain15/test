import {
  Component,
  EventEmitter,
  forwardRef,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

enum size {
  'mini' = '9px',
  'tiny' = '10px',
  'small' = '11px',
  'medium' = '12px',
  'large' = '14px',
  'big' = '18px',
  'huge' = '20px',
  'massive' = '24px',
}
enum color {
  'primary' = '#126b82',
  'secondary' = '10px',
  'orange' = '#f0592b',
  'success' = '#27b098',
  'default' = '#333',
}

@Component({
  selector: 'dv-radio',
  templateUrl: './dv-radio.component.html',
  //   styleUrls: ['./dv-radio.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DvRadioComponent),
      multi: true,
    },
  ],
})
export class DvRadioComponent
  implements OnInit, ControlValueAccessor, OnChanges
{
  @Input() groupName: string = '';
  @Input() label: string = '';
  @Input() valueName: string = '';
  @Input() radioId!: string;
  @Input() checkedVal: boolean = false;
  @Input() disabled: boolean = false;
  @Input() type: 'disable' | 'default' | 'bold' = 'default';
  @Input() color: 'primary' | 'secondary' | 'orange' | 'success' | 'default' =
    'default';
  @Input() size:
    | 'mini'
    | 'tiny'
    | 'small'
    | 'medium'
    | 'large'
    | 'big'
    | 'huge'
    | 'massive' = 'large';
  @Output() innerValueEmitter = new EventEmitter<string>();
  styleSize = size.large;
  styleColor = color.default;
  public checked: boolean;
  public value!: any;
  constructor() {}

  onChange: any = () => {};
  onTouch: any = () => {};

  onInputChange(val: any) {
    this.checked = val == this.valueName;
    this.onChange(val);
  }

  writeValue(value: any): void {
    this.value = value;
    this.checked = value == this.valueName;
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  emitValue(event) {
    event.stopPropagation();
    this.innerValueEmitter.emit(event);
  }

  ngOnInit(): void {
    this.styleSize = size[this.size];
    this.styleColor = color[this.color];
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.styleColor = color[this.color];
    this.styleSize = size[this.size];
  }
}
