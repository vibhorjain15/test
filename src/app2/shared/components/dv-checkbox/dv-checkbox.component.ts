import {
  Component,
  EventEmitter,
  forwardRef,
  Input,
  OnInit,
  Output,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'dv-checkbox',
  templateUrl: './dv-checkbox.component.html',
  styleUrls: ['./dv-checkbox.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DvCheckboxComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DvCheckboxComponent
  implements ControlValueAccessor, OnInit, AfterViewInit
{
  @Input() label: string;
  @Input() Tooltip: string;
  @Input() disabled = false;
  @Output() onValChange = new EventEmitter();
  @Output() onIconClick = new EventEmitter();
  @Input() name = '';
  // Passing id is required if label is not passed and make sure to pass it as [id]
  @Input() id = '';
  @Input() isBold = false;
  @Input() labelClass = '';
  @Input() rightIcon = '';
  @Input() iconClass = '';
  @Input() iconTooltip = '';
  @Input() indeterminate = false;
  @Input() ariaLabel = '';
  @Input() policyChange: boolean = false;
  // Internal properties
  isChecked = false;
  onChange = (_) => {};
  onBlur = (_) => {};

  labelId: string;
  tooltipId: string;

  constructor(private cd: ChangeDetectorRef) {}
  ngOnInit(): void {
    this.labelId = this.generateId('label');
    this.tooltipId = this.iconTooltip ? this.generateId('tooltip') : '';
    if (!this.id) {
      this.id = this.generateId('input');
    }
  }

  ngAfterViewInit() {
    this.updateAccessibilityAttributes();
  }

  generateId(suffix: string): string {
    return `${suffix}-${Math.random().toString(36).substr(2, 9)}`;
  }

  updateAccessibilityAttributes() {
    if (!this.labelId) {
      this.labelId = this.generateId('label');
    }
    if (!this.tooltipId && this.iconTooltip) {
      this.tooltipId = this.generateId('tooltip');
    }
  }

  writeValue(obj: boolean): void {
    if (this.isChecked != obj) {
      this.isChecked = obj;
      this.cd.markForCheck();
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onBlur = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    if (this.label !== 'Auto-assign') this.disabled = isDisabled;
  }

  onChanged($event) {
    $event.stopPropagation();
    if (this.policyChange && $event && $event.target && $event.target.checked) {
      $event.target.checked = false;
      this.onValChange.emit(true);
      return;
    }
    this.isChecked = $event && $event.target && $event.target.checked;
    this.onChange(this.isChecked);
    this.onValChange.emit(this.isChecked);
  }

  onCLick($event) {
    $event.stopPropagation();
  }

  handleIconClick() {
    this.onIconClick.emit();
  }
}
